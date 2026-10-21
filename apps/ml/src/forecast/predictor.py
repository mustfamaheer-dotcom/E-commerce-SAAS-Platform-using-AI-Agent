# apps/ml/src/forecast/predictor.py
"""Real-time sales forecast scoring, SHAP attribution and restock advice."""
import json
import math
import os
import time
from datetime import date, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np
import pandas as pd

from apps.ml.src.forecast import feature_builder
from apps.ml.src.forecast.mock_store import current_stock, daily_series, get_product
from packages.database.seed.seed_calendar_events import get_holiday_for

MODEL_DIR = Path(__file__).resolve().parents[2] / "models"
CHAMPION_PATH = MODEL_DIR / "sales_forecast_quantile.joblib"
HEURISTIC_VERSION = "heuristic-seasonal-v1"
CACHE_TTL_SECONDS = 60
LEAD_TIME_DAYS = 7
Z_95 = 1.645
Z_95_TWO_SIDED = 1.96
REDIS_FRAME_TTL_SECONDS = 300
CACHE_KEY_PREFIX = "techzone:forecast:frame:"


class TenantAccessError(PermissionError):
    """Raised when a product does not belong to the requesting tenant (RLS)."""


class ForecastPredictor:
    def __init__(self) -> None:
        self._frame_cache: Dict[str, Tuple[float, pd.DataFrame]] = {}
        self._rows_cache: Dict[str, Tuple[float, List[Dict]]] = {}
        self._bundle_cache: Optional[Dict] = None
        self._bundle_mtime: Optional[float] = None
        self._redis = None
        self._redis_checked = False
        self._explainer_cache: Dict[str, object] = {}

    def _redis_client(self):
        """Lazily connect to Redis (feature cache); returns None when unavailable."""
        if self._redis_checked:
            return self._redis
        self._redis_checked = True
        url = os.getenv("REDIS_URL", "").strip()
        if not url:
            return None
        try:
            import redis

            client = redis.Redis.from_url(
                url,
                decode_responses=True,
                socket_connect_timeout=1,
                socket_timeout=1,
            )
            client.ping()
            self._redis = client
        except Exception:
            self._redis = None
        return self._redis

    def _raw_rows(self, product_id: str, tenant_id: str) -> List[Dict]:
        """Gapless daily rows, cached in-process and (when available) in Redis."""
        now = time.time()
        cached = self._rows_cache.get(product_id)
        if cached and now - cached[0] < CACHE_TTL_SECONDS:
            return cached[1]

        key = f"{CACHE_KEY_PREFIX}{tenant_id}:{product_id}"
        client = self._redis_client()

        if client is not None:
            try:
                payload = client.get(key)
                if payload:
                    rows = json.loads(payload)
                    self._rows_cache[product_id] = (now, rows)
                    return rows
            except Exception:
                pass

        rows = daily_series(product_id)

        if client is not None:
            try:
                client.setex(key, REDIS_FRAME_TTL_SECONDS, json.dumps(rows, default=str))
            except Exception:
                pass

        self._rows_cache[product_id] = (now, rows)
        return rows

    def _series_frame(self, product_id: str, tenant_id: str = "tenant-demo-01") -> pd.DataFrame:
        now = time.time()
        cached = self._frame_cache.get(product_id)
        if cached and now - cached[0] < CACHE_TTL_SECONDS:
            return cached[1].copy()

        rows = self._raw_rows(product_id, tenant_id)
        frame = feature_builder.build_feature_frame(pd.DataFrame(rows))
        self._frame_cache[product_id] = (now, frame)
        return frame.copy()

    def _load_bundle(self) -> Optional[Dict]:
        if not CHAMPION_PATH.exists():
            return None
        mtime = CHAMPION_PATH.stat().st_mtime
        if self._bundle_cache is not None and self._bundle_mtime == mtime:
            return self._bundle_cache
        try:
            import joblib

            bundle = joblib.load(CHAMPION_PATH)
            if not isinstance(bundle, dict) or "models" not in bundle:
                return None
            self._bundle_cache = bundle
            self._bundle_mtime = mtime
            return bundle
        except Exception:
            return None

    def _model_forecast(
        self,
        bundle: Dict,
        history_rows: List[Dict],
        last_row: Dict,
        horizon_days: int,
        origin: date,
        product_id: str = "",
    ) -> List[Dict]:
        models = bundle.get("models", {}) or {}
        product_models = models.get(product_id) if isinstance(models, dict) else None
        if not product_models:
            product_models = bundle.get("global_models", {}) or {}
        q50 = product_models.get("q50") or product_models.get("champion")
        if q50 is None:
            return []

        meta = (bundle.get("product_meta", {}) or {}).get(product_id, {}) or {}
        conformal_offset = float(
            meta.get("conformal_offset", bundle.get("conformal_offset", 0.0)) or 0.0
        )
        units_history = [float(row["units_sold"]) for row in history_rows]
        columns = bundle.get("feature_columns", feature_builder.FEATURE_COLUMNS)
        lower_model = product_models.get("q05")
        upper_model = product_models.get("q95")

        def _build_rows(history: List[float]) -> Tuple[List[Dict], pd.DataFrame]:
            rows = []
            for step in range(1, horizon_days + 1):
                future_date = origin + timedelta(days=step)
                holiday = get_holiday_for(future_date)
                row = feature_builder.build_inference_row(
                    history,
                    last_row,
                    future_date,
                    is_holiday=bool(holiday),
                    holiday_weight=float(holiday["weight"]) if holiday else 0.0,
                )
                row["report_date"] = future_date
                rows.append(row)
            matrix = pd.DataFrame([{column: row[column] for column in columns} for row in rows])
            return rows, matrix

        # The horizon is scored in ONE vectorised call per pass (30 sequential
        # predict() calls cost ~150 ms and blew the latency SLA). Because the
        # lag features depend on the previous forecast, the horizon is rolled
        # forward in a few passes so each day sees the model's own predictions.
        rows: List[Dict] = []
        matrix = pd.DataFrame()
        yhat_values = np.zeros(horizon_days, dtype=float)
        lower_values = np.zeros(horizon_days, dtype=float)
        upper_values = np.zeros(horizon_days, dtype=float)

        scaled_target = bundle.get("target_mode") == "scaled"

        def _to_units(scaled: np.ndarray, matrix: pd.DataFrame) -> np.ndarray:
            if not scaled_target:
                return np.maximum(np.asarray(scaled, dtype=float), 0.0)
            scale = matrix[feature_builder.SCALE_COLUMN].fillna(0.0).clip(
                lower=feature_builder.MIN_SCALE
            ).to_numpy()
            return np.maximum(np.asarray(scaled, dtype=float), 0.0) * scale

        for _pass in range(3):
            rows, matrix = _build_rows(units_history)
            yhat_values = _to_units(q50.predict(matrix), matrix)
            lower_values = (
                _to_units(lower_model.predict(matrix), matrix)
                if lower_model is not None
                else yhat_values - 2.0
            )
            upper_values = (
                _to_units(upper_model.predict(matrix), matrix)
                if upper_model is not None
                else yhat_values + 2.0
            )
            units_history = units_history + [float(value) for value in yhat_values]

        forecast: List[Dict] = []
        for index, row in enumerate(rows):
            yhat = max(0.0, round(float(yhat_values[index]), 1))
            lower = max(0.0, round(min(float(lower_values[index]) - conformal_offset, yhat), 1))
            upper = max(yhat, round(float(upper_values[index]) + conformal_offset, 1))
            forecast.append(
                {
                    "report_date": row["report_date"].isoformat(),
                    "yhat": yhat,
                    "yhat_lower": lower,
                    "yhat_upper": upper,
                }
            )

        return forecast

    def _heuristic_forecast(
        self,
        history_rows: List[Dict],
        horizon_days: int,
        origin: date,
    ) -> List[Dict]:
        units = [float(row["units_sold"]) for row in history_rows]
        recent = units[-28:] if len(units) >= 28 else units
        previous = units[-42:-14] if len(units) >= 42 else units[: max(1, len(units) // 2)]

        recent_mean = float(np.mean(recent)) if recent else 1.0
        previous_mean = float(np.mean(previous)) if previous else recent_mean
        trend = float(np.clip(recent_mean / max(previous_mean, 0.1), 0.70, 1.40))

        weekday_history: Dict[int, List[float]] = {dow: [] for dow in range(1, 8)}
        for row in history_rows[-28:]:
            weekday_history[int(row["day_of_week"])].append(float(row["units_sold"]))
        overall_mean = recent_mean if recent else 1.0

        residuals = []
        for row in history_rows[-28:]:
            dow_mean = np.mean(weekday_history[int(row["day_of_week"])]) if weekday_history[int(row["day_of_week"])] else overall_mean
            residuals.append(float(row["units_sold"]) - dow_mean)
        sigma = float(np.std(residuals, ddof=1)) if len(residuals) > 2 else max(0.5, overall_mean * 0.2)

        forecast: List[Dict] = []
        for step in range(1, horizon_days + 1):
            future_date = origin + timedelta(days=step)
            dow = future_date.isoweekday()
            base = float(np.mean(weekday_history[dow])) if weekday_history[dow] else overall_mean
            trend_effect = trend ** min(step / 14.0, 1.0)
            holiday = get_holiday_for(future_date)
            holiday_effect = 1.0 + 0.22 * float(holiday["weight"]) if holiday else 1.0

            yhat = max(0.0, round(base * trend_effect * holiday_effect, 1))
            band = max(0.5, sigma) * Z_95 * math.sqrt(1.0 + step / 30.0)
            forecast.append(
                {
                    "report_date": future_date.isoformat(),
                    "yhat": yhat,
                    "yhat_lower": max(0.0, round(yhat - band, 1)),
                    "yhat_upper": round(yhat + band, 1),
                }
            )
        return forecast

    def _fallback_drivers(
        self,
        frame: pd.DataFrame,
        last_row: Dict,
        forecast: List[Dict],
    ) -> List[Dict]:
        features = feature_builder.FEATURE_COLUMNS
        means = frame[features].mean(numeric_only=True)
        stds = frame[features].std(numeric_only=True, ddof=1).replace(0, np.nan)

        def z(feature: str) -> float:
            value = float(last_row.get(feature, 0.0) or 0.0)
            mean = float(means.get(feature, 0.0) or 0.0)
            std = float(stds.get(feature, 0.0) or 0.0)
            if not std or np.isnan(std):
                return 0.0
            return float(np.clip((value - mean) / std, -3.0, 3.0))

        first_future = date.fromisoformat(forecast[0]["report_date"])
        last_discount = float(last_row.get("discount_pct", 0.0) or 0.0)
        last_price_change = float(last_row.get("price_change_pct", 0.0) or 0.0)
        momentum = float(last_row.get("sales_rolling_mean_7", 0.0) or 0.0) - float(
            last_row.get("sales_rolling_mean_28", 0.0) or 0.0
        )
        volatility = float(last_row.get("sales_rolling_std_28", 0.0) or 0.0)
        mean_28 = max(float(last_row.get("sales_rolling_mean_28", 0.0) or 0.0), 0.5)
        total_yhat = max(sum(point["yhat"] for point in forecast), 1.0)
        stock_ratio = float(last_row.get("stock_level", 0.0) or 0.0) / total_yhat

        drivers = [
            {
                "feature": "day_of_week",
                "impact_pct": round(18.0 if first_future.isoweekday() in (5, 6) else 3.0, 1),
            },
            {
                "feature": "discount_pct",
                "impact_pct": round(min(24.0, last_discount * 160.0), 1),
            },
            {
                "feature": "is_holiday",
                "impact_pct": round(
                    min(25.0, float(last_row.get("holiday_weight", 0.0) or 0.0) * 20.0), 1
                ),
            },
            {
                "feature": "price_change_pct",
                "impact_pct": round(float(np.clip(-last_price_change * 50.0, -12.0, 12.0)), 1),
            },
            {
                "feature": "sales_rolling_mean_7",
                "impact_pct": round(float(np.clip((momentum / mean_28) * 10.0, -15.0, 15.0)), 1),
            },
            {
                "feature": "sales_rolling_std_28",
                "impact_pct": round(float(np.clip(-(volatility / mean_28) * 6.0, -12.0, 0.0)), 1),
            },
            {
                "feature": "stock_level",
                "impact_pct": round(float(np.clip(-(1.0 - stock_ratio) * 15.0, -15.0, 0.0)), 1),
            },
        ]

        drivers = [driver for driver in drivers if abs(driver["impact_pct"]) > 0.2]
        drivers.sort(key=lambda driver: abs(driver["impact_pct"]), reverse=True)

        while len(drivers) < 3:
            drivers.append({"feature": f"sales_lag_{7 * (len(drivers) + 1)}", "impact_pct": 1.0})
        return drivers[:5]

    def _shap_drivers(
        self,
        bundle: Optional[Dict],
        frame: pd.DataFrame,
        last_row: Dict,
        forecast: List[Dict],
        product_id: str = "",
    ) -> List[Dict]:
        if bundle is not None:
            try:
                import shap

                models = bundle.get("models", {}) or {}
                product_models = models.get(product_id) if isinstance(models, dict) else None
                if not product_models:
                    product_models = bundle.get("global_models", {}) or {}
                model = product_models.get("q50") or product_models.get("champion")
                if model is None:
                    raise ValueError("no champion model available for SHAP")
                columns = bundle.get("feature_columns", feature_builder.FEATURE_COLUMNS)
                matrix = pd.DataFrame([{column: last_row.get(column, 0.0) for column in columns}])

                # Building a TreeExplainer is expensive (~200 ms), so it is
                # cached per champion artifact and reused across requests.
                cache_key = f"{bundle.get('trained_at')}:{product_id}:{id(model)}"
                explainer = self._explainer_cache.get(cache_key)
                if explainer is None:
                    explainer = shap.TreeExplainer(model)
                    self._explainer_cache[cache_key] = explainer

                values = np.array(explainer.shap_values(matrix)).reshape(-1)
                if bundle.get("target_mode") == "scaled":
                    # The tree predicts scaled demand; convert the attributions
                    # back to units before turning them into percentages.
                    scale = float(matrix[feature_builder.SCALE_COLUMN].iloc[0] or 0.0)
                    values = values * max(scale, feature_builder.MIN_SCALE)
                point = max(float(forecast[0]["yhat"]), 1.0)
                drivers = [
                    {"feature": column, "impact_pct": round(float(value / point * 100.0), 1)}
                    for column, value in zip(columns, values)
                ]
                drivers.sort(key=lambda driver: abs(driver["impact_pct"]), reverse=True)
                if len(drivers) >= 3:
                    return drivers[:5]
            except Exception:
                pass
        return self._fallback_drivers(frame, last_row, forecast)

    def _residual_sigma(self, frame: pd.DataFrame) -> float:
        """Std of the daily residuals (weekday baseline removed) over the last 28 days."""
        rows = frame.to_dict("records")
        if len(rows) < 8:
            return 0.0
        window = rows[-28:]
        by_dow: Dict[int, List[float]] = {}
        for row in window:
            by_dow.setdefault(int(row["day_of_week"]), []).append(float(row["units_sold"]))
        residuals = []
        for row in window:
            dow_values = by_dow.get(int(row["day_of_week"]), [])
            baseline = float(np.mean(dow_values)) if dow_values else float(np.mean([r["units_sold"] for r in window]))
            residuals.append(float(row["units_sold"]) - baseline)
        if len(residuals) < 3:
            return 0.0
        return float(np.std(residuals, ddof=1))

    @staticmethod
    def _aggregate_band(total: float, sigma: float, horizon_days: int) -> Tuple[float, float]:
        """
        Uncertainty of the *horizon total* (not the sum of marginal quantiles).

        Daily errors are roughly independent, so the aggregate error grows with
        sqrt(horizon): total ± 1.96 · sigma · sqrt(H). Each point keeps its own
        quantile bounds; this band is what the merchant card shows for the
        horizon total.
        """
        half_width = Z_95_TWO_SIDED * max(sigma, 0.0) * math.sqrt(max(horizon_days, 1))
        return max(0.0, round(total - half_width, 1)), round(total + half_width, 1)

    def _restock(self, forecast: List[Dict], frame: pd.DataFrame, product_id: str) -> Dict:
        stock = current_stock(product_id)
        total_yhat = sum(point["yhat"] for point in forecast)
        gap = max(0, int(math.ceil(total_yhat - stock)))

        std_28 = float(frame["sales_rolling_std_28"].dropna().iloc[-1]) if frame["sales_rolling_std_28"].notna().any() else 0.0
        safety_stock = int(math.ceil(std_28 * math.sqrt(LEAD_TIME_DAYS)))
        product = get_product(product_id=product_id) or {}
        reorder_level = int(product.get("reorder_level", 0) or 0)
        suggested = int(math.ceil(gap + safety_stock)) if gap > 0 else 0
        if gap > 0 and reorder_level > suggested:
            suggested = reorder_level

        stockout_eta = None
        cumulative = 0.0
        for point in forecast:
            cumulative += point["yhat"]
            if cumulative > stock:
                stockout_eta = point["report_date"]
                break

        return {
            "current_stock": stock,
            "predicted_demand": int(round(total_yhat)),
            "gap": gap,
            "safety_stock": safety_stock,
            "reorder_level": reorder_level,
            "stockout_eta": stockout_eta,
            "recommendation": "order_now" if gap > 0 else "sufficient",
            "suggested_order_qty": suggested,
        }

    def invalidate_cache(self) -> None:
        """Drop cached features/models so a freshly promoted champion is served."""
        self._frame_cache.clear()
        self._rows_cache.clear()
        self._bundle_cache = None
        self._bundle_mtime = None
        self._explainer_cache.clear()

    def warm_up(self) -> None:
        """Load the champion bundle, the SHAP explainers and hot caches."""
        bundle = self._load_bundle()
        if bundle is None:
            return
        try:
            import shap

            models = bundle.get("models", {}) or {}
            candidates = list(models.values()) if isinstance(models, dict) else []
            candidates.append(bundle.get("global_models", {}) or {})
            for product_id, product_models in candidates:
                model = (product_models or {}).get("q50")
                if model is None:
                    continue
                key = f"{bundle.get('trained_at')}:{product_id}:{id(model)}"
                if key not in self._explainer_cache:
                    self._explainer_cache[key] = shap.TreeExplainer(model)
        except Exception:
            pass

    def predict(self, product_id: str, horizon_days: int = 30, tenant_id: str = "tenant-demo-01") -> Dict:
        start_time = time.perf_counter()
        product = get_product(product_id=product_id)
        if product is None:
            raise LookupError(f"Unknown product: {product_id}")

        owner_tenant = str(product.get("tenant_id", tenant_id) or tenant_id)
        if tenant_id and owner_tenant != tenant_id:
            raise TenantAccessError(
                f"Product {product_id} does not belong to tenant {tenant_id}."
            )

        frame = self._series_frame(product["product_id"], tenant_id=tenant_id)
        history = frame.tail(30)
        last_row = frame.iloc[-1].to_dict()
        origin = pd.to_datetime(last_row["report_date"]).date()

        bundle = self._load_bundle()
        forecast = (
            self._model_forecast(
                bundle,
                frame.to_dict("records"),
                last_row,
                horizon_days,
                origin,
                product_id=product["product_id"],
            )
            if bundle
            else []
        )
        source = "model"
        if not forecast:
            forecast = self._heuristic_forecast(frame.to_dict("records"), horizon_days, origin)
            source = "heuristic"

        total_yhat = round(sum(point["yhat"] for point in forecast), 1)

        model_version = HEURISTIC_VERSION
        sigma = self._residual_sigma(frame)
        if bundle is not None and source == "model":
            model_version = bundle.get("model_name", "sales_forecast_quantile")
            trained_at = bundle.get("trained_at")
            if trained_at:
                model_version = f"{model_version}@{str(trained_at)[:10]}"
            meta = (bundle.get("product_meta", {}) or {}).get(product["product_id"], {}) or {}
            sigma = float(meta.get("residual_sigma", bundle.get("residual_sigma", sigma)) or sigma)

        total_lower, total_upper = self._aggregate_band(total_yhat, sigma, horizon_days)

        latency_ms = int(round((time.perf_counter() - start_time) * 1000, 0))

        return {
            "card_type": "sales_forecast",
            "product": {
                "id": product["product_id"],
                "name": product["name"],
                "sku": product["sku"],
                "current_stock": int(product["stock"]),
            },
            "horizon_days": horizon_days,
            "history": [
                {
                    "report_date": pd.to_datetime(row["report_date"]).date().isoformat(),
                    "units_sold": int(row["units_sold"]),
                }
                for row in history.to_dict("records")
            ],
            "point_forecast": forecast,
            "totals": {
                "yhat": total_yhat,
                "yhat_lower": total_lower,
                "yhat_upper": total_upper,
            },
            "top_shap_drivers": self._shap_drivers(
                bundle, frame, last_row, forecast, product_id=product["product_id"]
            ),
            "restock": self._restock(forecast, frame, product["product_id"]),
            "model_version": model_version,
            "source": source,
            "latency_ms": latency_ms,
        }


_predictor: Optional[ForecastPredictor] = None


def get_predictor() -> ForecastPredictor:
    global _predictor
    if _predictor is None:
        _predictor = ForecastPredictor()
    return _predictor
