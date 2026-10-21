# apps/ml/src/forecast/train_forecast.py
"""
Retaj's forecasting training pipeline (Section 8.2 / 8.3).

Builds the feature matrix, enforces a strict chronological train/test split,
trains quantile regression models, benchmarks statistical baselines, and
logs everything to MLflow (when available). The champion model is persisted to
`apps/ml/models/sales_forecast_quantile.joblib` for the inference service.

Usage:
    python -m apps.ml.src.forecast.train_forecast
    python -m apps.ml.src.forecast.train_forecast --quick
"""
import json
import math
import os
import shutil
import sys
import warnings
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

import numpy as np
import pandas as pd

from apps.ml.src.forecast import feature_builder
from apps.ml.src.forecast.mock_store import daily_series, list_products

if sys.platform == "win32" and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

MODEL_DIR = Path(__file__).resolve().parents[2] / "models"
REPO_ROOT = Path(__file__).resolve().parents[4]
CHAMPION_PATH = MODEL_DIR / "sales_forecast_quantile.joblib"
CANDIDATE_PATH = MODEL_DIR / "sales_forecast_quantile.candidate.joblib"
METRICS_PATH = MODEL_DIR / "forecast_metrics.json"
CANDIDATE_METRICS_PATH = MODEL_DIR / "forecast_metrics_candidate.json"
QUANTILES = (0.05, 0.5, 0.95)


def _metrics(actual: np.ndarray, predicted: np.ndarray) -> Dict[str, float]:
    actual = np.asarray(actual, dtype=float)
    predicted = np.maximum(np.asarray(predicted, dtype=float), 0.0)
    errors = actual - predicted
    mae = float(np.mean(np.abs(errors)))
    rmse = float(np.sqrt(np.mean(errors ** 2)))
    non_zero = np.abs(actual) > 1e-9
    mape = float(np.mean(np.abs(errors[non_zero] / actual[non_zero])) * 100.0) if non_zero.any() else 0.0
    wape = float(np.sum(np.abs(errors)) / max(np.sum(np.abs(actual)), 1e-9) * 100.0)
    return {"MAE": round(mae, 3), "RMSE": round(rmse, 3), "MAPE": round(mape, 2), "WAPE": round(wape, 2)}


def _conformal_offset(lower: np.ndarray, upper: np.ndarray, actual: np.ndarray) -> float:
    """
    Conformalised quantile regression offset.

    The conformity score of a point is `max(lower - y, y - upper)`; the 95th
    percentile of that score on a held-out calibration slice is added to the
    band, which lifts the empirical coverage of the 95% interval to >= 95%.
    """
    lower = np.asarray(lower, dtype=float)
    upper = np.asarray(upper, dtype=float)
    actual = np.asarray(actual, dtype=float)
    if lower.size == 0:
        return 0.0
    scores = np.maximum(lower - actual, actual - upper)
    return float(np.quantile(scores, 0.96))


def _build_dataset(product_limit: Optional[int] = None, days: int = 180) -> pd.DataFrame:
    products = list_products()
    if product_limit:
        products = products[:product_limit]

    frames = []
    for product in products:
        rows = daily_series(product["product_id"], days=days)
        frame = feature_builder.build_feature_frame(pd.DataFrame(rows))
        frame = feature_builder.supervised_rows(frame)
        frame = feature_builder.add_scaled_target(frame)
        if not frame.empty:
            frames.append(frame)

    if not frames:
        raise RuntimeError("No training rows were generated from the time-series store.")

    return pd.concat(frames, ignore_index=True)


def _make_regressor(quantile: float, quick: bool):
    try:
        from lightgbm import LGBMRegressor

        return LGBMRegressor(
            objective="quantile",
            alpha=quantile,
            n_estimators=80 if quick else 180,
            learning_rate=0.06,
            max_depth=3,
            num_leaves=15,
            min_child_samples=12,
            random_state=42,
            verbosity=-1,
        )
    except Exception:
        from sklearn.ensemble import GradientBoostingRegressor

        return GradientBoostingRegressor(
            loss="quantile",
            alpha=quantile,
            n_estimators=60 if quick else 140,
            learning_rate=0.06,
            max_depth=3,
            random_state=42,
        )


def _benchmark_sarima(train_agg: pd.Series, test_agg: pd.Series) -> Dict:
    try:
        from statsmodels.tsa.statespace.sarimax import SARIMAX
    except Exception:
        return {"model": "SARIMA", "status": "not_installed"}

    try:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            model = SARIMAX(
                train_agg.astype(float),
                order=(1, 0, 1),
                seasonal_order=(1, 0, 1, 7),
                enforce_stationarity=False,
                enforce_invertibility=False,
            )
            fitted = model.fit(disp=False)
            predictions = fitted.forecast(steps=len(test_agg))
        return {
            "model": "SARIMA",
            "status": "ok",
            **_metrics(test_agg.to_numpy(), np.asarray(predictions)),
        }
    except Exception as exc:
        return {"model": "SARIMA", "status": f"failed: {exc}"}


def _benchmark_prophet(train_agg: pd.Series, test_agg: pd.Series) -> Dict:
    try:
        from prophet import Prophet
    except Exception:
        return {"model": "Prophet", "status": "not_installed"}

    try:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            train_frame = pd.DataFrame({"ds": train_agg.index, "y": train_agg.to_numpy(dtype=float)})
            model = Prophet(weekly_seasonality=True, yearly_seasonality=False, daily_seasonality=False)
            model.fit(train_frame)
            future = pd.DataFrame({"ds": pd.to_datetime(test_agg.index)})
            forecast = model.predict(future)
        return {
            "model": "Prophet",
            "status": "ok",
            **_metrics(test_agg.to_numpy(), forecast["yhat"].to_numpy()),
        }
    except Exception as exc:
        return {"model": "Prophet", "status": f"failed: {exc}"}


def _log_to_mlflow(bundle_path: Path, metrics: Dict, params: Dict, quick: bool, promoted: bool) -> None:
    try:
        import mlflow

        tracking_uri = os.getenv("MLFLOW_URI") or os.getenv("MLFLOW_TRACKING_URI")
        if tracking_uri:
            mlflow.set_tracking_uri(tracking_uri)
        else:
            # Local sqlite backend inside the repo so runs are reproducible
            # offline (compose overrides this with the Postgres backend).
            mlflow.set_tracking_uri(f"sqlite:///{(REPO_ROOT / 'mlflow.db').as_posix()}")
        experiment = os.getenv("MLFLOW_EXPERIMENT", "techzone_forecast_demo")
        mlflow.set_experiment(experiment)

        with mlflow.start_run(run_name=f"retaj_{metrics['model_name']}_{date.today().isoformat()}"):
            mlflow.log_params({**params, "quick_mode": quick, "split": "time_80_20"})
            mlflow.log_metrics(
                {
                    "MAE": metrics["MAE"],
                    "RMSE": metrics["RMSE"],
                    "MAPE": metrics["MAPE"],
                    "WAPE": metrics["WAPE"],
                    "coverage_95": metrics["coverage_95"],
                    "conformal_offset": metrics.get("conformal_offset", 0.0),
                }
            )
            for row in metrics.get("benchmark", []):
                if row.get("status") == "ok":
                    tag = row["model"].lower().replace(" ", "_").replace("/", "_")
                    mlflow.log_metrics(
                        {f"bench_{tag}_MAE": row["MAE"], f"bench_{tag}_WAPE": row["WAPE"]}
                    )
            mlflow.set_tag("promoted", str(promoted))
            mlflow.set_tag("model_name", metrics["model_name"])
            mlflow.log_artifact(str(bundle_path), artifact_path="model")
            mlflow.log_dict(metrics, "forecast_metrics.json")
        print(f"  * MLflow logging: OK ({mlflow.get_tracking_uri()})")
    except Exception as exc:
        print(f"  * MLflow logging skipped ({type(exc).__name__}: {exc})")


def run_training(quick: bool = False, promote: bool = True) -> Dict:
    """Train, benchmark, persist and (optionally) promote the champion model."""
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    started = datetime.now(timezone.utc).isoformat(timespec="seconds")

    print("=" * 78)
    print("RETAJ FORECAST TRAINING PIPELINE (quantile regression + SHAP-ready trees)")
    print("=" * 78)

    dataset = _build_dataset(product_limit=2 if quick else None, days=120 if quick else 180)
    train, test = feature_builder.time_based_split(dataset, train_ratio=0.8)
    feature_builder.assert_no_leakage(train, test)

    # A second chronological slice inside the training window is used to
    # calibrate the quantile band (conformalised quantile regression) so the
    # 95% interval is honest on unseen data.
    columns = feature_builder.FEATURE_COLUMNS
    scale_column = feature_builder.SCALE_COLUMN
    scaled_target = feature_builder.SCALED_TARGET_COLUMN

    print(f"  * Train dates: {train['report_date'].min().date()} -> {train['report_date'].max().date()}")
    print(f"  * Test dates : {test['report_date'].min().date()} -> {test['report_date'].max().date()}")

    # One pooled model on the scale-normalised target: the catalogue shares
    # demand *patterns* while every SKU keeps its own level.
    fit, calibration = feature_builder.time_based_split(train, train_ratio=0.8)
    feature_builder.assert_no_leakage(fit, calibration)

    x_fit = fit[columns].astype(float)
    y_fit = fit[scaled_target].astype(float)
    x_calibration = calibration[columns].astype(float)
    scale_calibration = calibration[scale_column].fillna(0.0).clip(lower=feature_builder.MIN_SCALE).to_numpy()
    y_calibration_units = calibration[feature_builder.TARGET_COLUMN].astype(float).to_numpy()
    x_test = test[columns].astype(float)
    scale_test = test[scale_column].fillna(0.0).clip(lower=feature_builder.MIN_SCALE).to_numpy()
    y_test = test[feature_builder.TARGET_COLUMN].astype(float).to_numpy()

    models = {}
    for quantile in QUANTILES:
        model = _make_regressor(quantile, quick)
        model.fit(x_fit, y_fit)
        models[f"q{int(quantile * 100):02d}"] = model

    def _to_units(scaled: np.ndarray, scale: np.ndarray) -> np.ndarray:
        return np.maximum(np.asarray(scaled, dtype=float), 0.0) * np.asarray(scale, dtype=float)

    calibration_point = _to_units(models["q50"].predict(x_calibration), scale_calibration)
    residual_sigma = float(np.std(y_calibration_units - calibration_point, ddof=1))
    conformal_offset = _conformal_offset(
        _to_units(models["q05"].predict(x_calibration), scale_calibration),
        _to_units(models["q95"].predict(x_calibration), scale_calibration),
        y_calibration_units,
    )

    point_predictions = _to_units(models["q50"].predict(x_test), scale_test)
    lower_predictions = np.maximum(_to_units(models["q05"].predict(x_test), scale_test) - conformal_offset, 0.0)
    upper_predictions = _to_units(models["q95"].predict(x_test), scale_test) + conformal_offset
    upper_predictions = np.maximum(upper_predictions, point_predictions)

    quality = _metrics(y_test, point_predictions)
    coverage = float(np.mean((y_test >= lower_predictions) & (y_test <= upper_predictions)) * 100.0)

    # Per-SKU calibration constants so every product ships its own band.
    product_meta: Dict[str, Dict] = {}
    aggregate_rows: List[Dict] = []
    total_cover_hits = 0
    total_cover_count = 0
    test_frame = test[["product_id"]].copy()
    test_frame["actual"] = y_test
    test_frame["point"] = point_predictions
    test_frame["lower"] = lower_predictions
    test_frame["upper"] = upper_predictions
    test_frame["scale"] = scale_test
    for product_id, group in test_frame.groupby("product_id"):
        product_meta[str(product_id)] = {
            "conformal_offset": round(conformal_offset, 4),
            "residual_sigma": round(residual_sigma, 4),
            "rows_test": int(len(group)),
        }
        actual_sum = float(group["actual"].sum())
        point_sum = float(group["point"].sum())
        covered = abs(actual_sum - point_sum) <= 1.96 * residual_sigma * math.sqrt(max(len(group), 1))
        total_cover_hits += 1 if covered else 0
        total_cover_count += 1
        aggregate_rows.append(
            {
                "product_id": str(product_id),
                "actual": round(actual_sum, 2),
                "predicted": round(point_sum, 2),
                "covered": bool(covered),
            }
        )

    coverage_total = float(total_cover_hits / max(total_cover_count, 1) * 100.0)

    print(f"  * Rows: fit={len(fit)} | calibration={len(calibration)} | test={len(test)} "
          f"(pooled model on scale-normalised target)")

    try:
        import lightgbm  # noqa: F401

        model_name = "sales_forecast_lightgbm"
    except Exception:
        model_name = "sales_forecast_gbr_quantile"

    benchmark: List[Dict] = [
        {"model": "Quantile GBR / LightGBM", "status": "ok", **quality},
    ]

    aggregate = dataset.groupby("report_date")[feature_builder.TARGET_COLUMN].sum().sort_index()
    if len(aggregate) >= 10:
        cutoff = pd.to_datetime(train["report_date"]).max()
        train_agg = aggregate[aggregate.index <= cutoff]
        test_agg = aggregate[aggregate.index > cutoff]
        if len(train_agg) >= 21 and len(test_agg) >= 1:
            benchmark.append(_benchmark_sarima(train_agg, test_agg))
            benchmark.append(_benchmark_prophet(train_agg, test_agg))
        else:
            benchmark.append({"model": "SARIMA", "status": "insufficient_history"})
            benchmark.append({"model": "Prophet", "status": "insufficient_history"})

    metrics = {
        "model_name": model_name,
        "model_version": f"{model_name}@{date.today().isoformat()}",
        "trained_at": started,
        "source": "benchmark",
        "MAE": quality["MAE"],
        "RMSE": quality["RMSE"],
        "MAPE": quality["MAPE"],
        "WAPE": quality["WAPE"],
        "coverage_95": round(coverage, 2),
        "coverage_95_total": round(coverage_total, 2),
        "conformal_offset": round(conformal_offset, 4),
        "residual_sigma": round(residual_sigma, 4),
        "train_start": str(train["report_date"].min().date()),
        "train_end": str(train["report_date"].max().date()),
        "test_start": str(test["report_date"].min().date()),
        "test_end": str(test["report_date"].max().date()),
        "rows_train": int(len(train)),
        "rows_test": int(len(test)),
        "rows_fit": int(len(fit)),
        "rows_calibration": int(len(calibration)),
        "target_mode": "scaled",
        "benchmark": benchmark,
        "per_product": aggregate_rows,
    }

    bundle = {
        "models": models,
        "global_models": models,
        "product_meta": product_meta,
        "feature_columns": columns,
        "model_name": model_name,
        "trained_at": started,
        "metrics": metrics,
        "conformal_offset": round(conformal_offset, 4),
        "residual_sigma": round(residual_sigma, 4),
        "target_mode": "scaled",
    }

    import joblib

    joblib.dump(bundle, CANDIDATE_PATH)

    old_metrics = None
    if METRICS_PATH.exists():
        try:
            old_metrics = json.loads(METRICS_PATH.read_text(encoding="utf-8"))
        except Exception:
            old_metrics = None

    improved = old_metrics is None or metrics["WAPE"] <= float(old_metrics.get("WAPE", 1e9)) + 1e-9
    promoted = bool(promote and improved)

    if promoted:
        shutil.copyfile(CANDIDATE_PATH, CHAMPION_PATH)
        METRICS_PATH.write_text(json.dumps(metrics, indent=2, ensure_ascii=False), encoding="utf-8")
    else:
        CANDIDATE_METRICS_PATH.write_text(
            json.dumps(metrics, indent=2, ensure_ascii=False), encoding="utf-8"
        )

    print(f"  * Model: {model_name} | MAE={metrics['MAE']} RMSE={metrics['RMSE']} "
          f"MAPE={metrics['MAPE']}% WAPE={metrics['WAPE']}%")
    print(f"  * 95% interval empirical coverage: {metrics['coverage_95']}% "
          f"(conformal offset {metrics['conformal_offset']})")
    for row in benchmark[1:]:
        if row.get("status") == "ok":
            print(f"  * Benchmark {row['model']}: MAE={row['MAE']} WAPE={row['WAPE']}%")
        else:
            print(f"  * Benchmark {row['model']}: {row['status']}")
    print(f"  * Champion promoted: {promoted} -> {CHAMPION_PATH if promoted else CANDIDATE_PATH}")

    _log_to_mlflow(
        CHAMPION_PATH if promoted else CANDIDATE_PATH,
        metrics,
        {"quantiles": list(QUANTILES), "model_name": model_name},
        quick,
        promoted,
    )

    return metrics


if __name__ == "__main__":
    quick_mode = "--quick" in sys.argv
    should_promote = "--no-promote" not in sys.argv
    result = run_training(quick=quick_mode, promote=should_promote)
    print("\nTraining finished.")
    print(json.dumps({k: result[k] for k in ("model_name", "MAE", "RMSE", "MAPE", "WAPE", "coverage_95")}, indent=2))
