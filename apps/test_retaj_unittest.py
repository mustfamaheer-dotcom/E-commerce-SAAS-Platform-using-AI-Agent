# apps/test_retaj_unittest.py
# Unit tests for Retaj's Vertical Slice 04: Sales Forecasting, SHAP & MLOps.
import os
import sys
import unittest
from unittest import mock

import numpy as np
import pandas as pd

if sys.platform == "win32" and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

os.environ["FORECAST_LIVE"] = "0"

from apps.ml.src.forecast import feature_builder
from apps.ml.src.forecast.mock_store import PRODUCTS, daily_series
from apps.ml.src.forecast.predictor import get_predictor
from apps.ml.src.forecast.product_resolver import resolve_product
from apps.agent.tools.forecast_tools import (
    build_synthesis_prompt,
    render_forecast_advice,
    run_sales_forecast,
)


def pytest_import_mlflow():
    """Return the mlflow module when installed, otherwise None."""
    try:
        import mlflow

        return mlflow
    except Exception:
        return None


def _synthetic_frame(days: int = 60) -> pd.DataFrame:
    dates = pd.date_range(end=pd.Timestamp("2026-10-20"), periods=days, freq="D")
    return pd.DataFrame(
        {
            "tenant_id": "tenant-demo-01",
            "product_id": "prod_test",
            "report_date": dates,
            "units_sold": np.arange(1, days + 1, dtype=float),
            "discount_pct": 0.0,
            "avg_unit_price": 100.0,
            "stock_level": 500.0,
            "is_holiday": False,
            "holiday_weight": 0.0,
            "day_of_week": dates.dayofweek + 1,
            "month": dates.month,
        }
    )


class TestRetajForecastSlice(unittest.TestCase):
    # --- 1. Feature engineering ---
    def test_features_are_gapless_and_use_trailing_windows(self):
        frame = feature_builder.build_feature_frame(_synthetic_frame())
        row = frame.iloc[30]
        self.assertEqual(row["sales_lag_7"], 24.0)
        self.assertAlmostEqual(row["sales_rolling_mean_7"], 27.0, places=6)
        self.assertAlmostEqual(row["sales_rolling_mean_28"], 16.5, places=6)
        expected_std = pd.Series(range(3, 31), dtype=float).std(ddof=1)
        self.assertAlmostEqual(row["sales_rolling_std_28"], expected_std, places=6)

    def test_target_is_next_day_units(self):
        frame = feature_builder.build_feature_frame(_synthetic_frame())
        self.assertEqual(frame.iloc[30][feature_builder.TARGET_COLUMN], 32.0)

    def test_time_split_never_leaks_future_data(self):
        frame = feature_builder.supervised_rows(feature_builder.build_feature_frame(_synthetic_frame()))
        train, test = feature_builder.time_based_split(frame, train_ratio=0.8)
        feature_builder.assert_no_leakage(train, test)
        self.assertLess(train["report_date"].max(), test["report_date"].min())

    def test_mock_daily_series_is_gapless(self):
        rows = daily_series("prod_101", days=180)
        self.assertEqual(len(rows), 180)
        self.assertEqual(len({row["report_date"] for row in rows}), 180)
        self.assertTrue(all(row["units_sold"] >= 0 for row in rows))
        self.assertTrue(all(row["stock_level"] >= 0 for row in rows))

    # --- 2. Product resolution ---
    def test_resolver_matches_sku_and_names(self):
        self.assertEqual(resolve_product("SPK-JBL-01")["product"]["product_id"], "prod_101")
        self.assertEqual(resolve_product("JBL Flip 6")["product"]["product_id"], "prod_101")
        self.assertEqual(resolve_product("Samsung 45W")["product"]["product_id"], "prod_116")

    def test_resolver_reports_ambiguity_for_generic_arabic_term(self):
        result = resolve_product("سماعة")
        self.assertEqual(result["status"], "ambiguous")
        self.assertGreaterEqual(len(result["candidates"]), 2)

    def test_resolver_handles_unknown_product(self):
        self.assertEqual(resolve_product("nuclear reactor")["status"], "not_found")

    # --- 3. Predictor & restock math ---
    def test_predictor_payload_contract(self):
        payload = get_predictor().predict("prod_101", horizon_days=30)
        for key in (
            "card_type",
            "product",
            "history",
            "point_forecast",
            "totals",
            "top_shap_drivers",
            "restock",
            "model_version",
            "source",
            "latency_ms",
        ):
            self.assertIn(key, payload)
        self.assertEqual(payload["card_type"], "sales_forecast")
        self.assertEqual(len(payload["history"]), 30)
        self.assertEqual(len(payload["point_forecast"]), 30)
        self.assertGreaterEqual(len(payload["top_shap_drivers"]), 3)

    def test_quantile_bands_are_ordered(self):
        payload = get_predictor().predict("prod_102", horizon_days=14)
        for point in payload["point_forecast"]:
            self.assertLessEqual(point["yhat_lower"], point["yhat"])
            self.assertLessEqual(point["yhat"], point["yhat_upper"])
            self.assertGreaterEqual(point["yhat_lower"], 0.0)

    def test_totals_match_daily_sum(self):
        payload = get_predictor().predict("prod_115", horizon_days=7)
        self.assertAlmostEqual(
            payload["totals"]["yhat"],
            round(sum(point["yhat"] for point in payload["point_forecast"]), 1),
            places=1,
        )

    def test_restock_formula(self):
        payload = get_predictor().predict("prod_101", horizon_days=30)
        restock = payload["restock"]
        expected_gap = max(0, int(np.ceil(payload["totals"]["yhat"] - restock["current_stock"])))
        self.assertEqual(restock["gap"], expected_gap)
        if restock["gap"] > 0:
            self.assertEqual(restock["recommendation"], "order_now")
            self.assertGreaterEqual(restock["suggested_order_qty"], restock["gap"])
        else:
            self.assertEqual(restock["recommendation"], "sufficient")
            self.assertEqual(restock["suggested_order_qty"], 0)

    def test_canonical_demo_numbers(self):
        """Docs/Retaj.md canonical demo: ~145 units, 80 in stock -> order 85."""
        payload = get_predictor().predict("prod_101", horizon_days=30)
        self.assertEqual(payload["restock"]["current_stock"], 80)
        self.assertEqual(payload["restock"]["suggested_order_qty"], 85)
        self.assertEqual(payload["restock"]["recommendation"], "order_now")
        self.assertGreater(payload["totals"]["yhat_lower"], 100)
        self.assertLess(payload["totals"]["yhat_upper"], 200)

    def test_all_catalog_products_are_forecastable(self):
        for product in PRODUCTS:
            payload = get_predictor().predict(product["product_id"], horizon_days=7)
            self.assertEqual(payload["product"]["id"], product["product_id"])

    # --- 4. FastAPI endpoints ---
    def test_predict_endpoint(self):
        from fastapi.testclient import TestClient
        from apps.ml.src.main import app

        client = TestClient(app)
        client.post(
            "/ml/v1/forecast/predict",
            json={"tenant_id": "tenant-demo-01", "product_id": "prod_101", "horizon_days": 30},
        )
        response = client.post(
            "/ml/v1/forecast/predict",
            json={"tenant_id": "tenant-demo-01", "product_id": "prod_101", "horizon_days": 30},
        )
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["card_type"], "sales_forecast")
        self.assertLess(body["latency_ms"], 350)

    def test_predict_endpoint_validates_horizon(self):
        from fastapi.testclient import TestClient
        from apps.ml.src.main import app

        client = TestClient(app)
        response = client.post(
            "/ml/v1/forecast/predict",
            json={"tenant_id": "tenant-demo-01", "product_id": "prod_101", "horizon_days": 31},
        )
        self.assertEqual(response.status_code, 422)

    def test_predict_endpoint_unknown_product(self):
        from fastapi.testclient import TestClient
        from apps.ml.src.main import app

        client = TestClient(app)
        response = client.post(
            "/ml/v1/forecast/predict",
            json={"tenant_id": "tenant-demo-01", "product_id": "prod_missing"},
        )
        self.assertEqual(response.status_code, 404)

    def test_predict_endpoint_rejects_cross_tenant_product(self):
        from fastapi.testclient import TestClient
        from apps.ml.src.main import app

        client = TestClient(app)
        response = client.post(
            "/ml/v1/forecast/predict",
            json={"tenant_id": "tenant-other-99", "product_id": "prod_101", "horizon_days": 7},
        )
        self.assertEqual(response.status_code, 403)
        self.assertIn("Cross-tenant", response.json()["detail"]["message"])

    def test_metrics_endpoint(self):
        from fastapi.testclient import TestClient
        from apps.ml.src.main import app

        client = TestClient(app)
        response = client.get("/ml/v1/forecast/models/metrics")
        self.assertEqual(response.status_code, 200)
        self.assertIn("model_name", response.json())

    def test_metrics_endpoint_exposes_benchmark_quality(self):
        from fastapi.testclient import TestClient
        from apps.ml.src.main import app

        client = TestClient(app)
        body = client.get("/ml/v1/forecast/models/metrics").json()

        for metric in ("MAE", "RMSE", "MAPE", "WAPE", "coverage_95"):
            self.assertIsNotNone(body.get(metric), f"{metric} missing from the metrics card")
        self.assertGreaterEqual(body["coverage_95"], 85.0)
        self.assertLessEqual(body["coverage_95"], 99.0)

        models = {row["model"] for row in body.get("benchmark", [])}
        self.assertGreaterEqual(len(models), 3, "the benchmark must cover at least 3 model families")

    def test_promoted_champion_is_served_without_restart(self):
        from apps.ml.src.forecast.predictor import CHAMPION_PATH, get_predictor

        if not CHAMPION_PATH.exists():
            self.skipTest("no promoted champion artifact in the repo yet")

        predictor = get_predictor()
        predictor.invalidate_cache()
        payload = predictor.predict("prod_101", horizon_days=30)

        self.assertEqual(payload["source"], "model")
        self.assertIn("lightgbm", payload["model_version"].lower())

    def test_feature_cache_uses_redis_when_configured(self):
        from apps.ml.src.forecast import predictor as predictor_module

        class FakeRedis:
            def __init__(self):
                self.store = {}

            def ping(self):
                return True

            def get(self, key):
                return self.store.get(key)

            def setex(self, key, ttl, value):
                self.store[key] = value

        fake = FakeRedis()
        predictor = predictor_module.ForecastPredictor()
        predictor._redis = fake
        predictor._redis_checked = True

        rows = predictor._raw_rows("prod_101", "tenant-demo-01")
        self.assertTrue(rows)
        self.assertTrue(fake.store, "the gapless series was not written to Redis")

        # A second predictor (cold cache) must read the rows back from Redis.
        other = predictor_module.ForecastPredictor()
        other._redis = fake
        other._redis_checked = True
        cached_rows = other._raw_rows("prod_101", "tenant-demo-01")
        self.assertEqual(len(cached_rows), len(rows))

    def test_redis_is_optional(self):
        from apps.ml.src.forecast import predictor as predictor_module

        os.environ.pop("REDIS_URL", None)
        predictor = predictor_module.ForecastPredictor()
        self.assertIsNone(predictor._redis_client())
        payload = predictor.predict("prod_101", horizon_days=7)
        self.assertEqual(payload["card_type"], "sales_forecast")

    def test_celery_task_retrains_and_refreshes_the_champion(self):
        from apps.ml.src.forecast.workers import celery_app as celery_module
        from apps.ml.src.forecast.workers import retrain_tasks

        celery_module.celery_app.conf.task_always_eager = True
        try:
            with mock.patch(
                "apps.ml.src.forecast.train_forecast.run_training",
                return_value={
                    "model_name": "sales_forecast_lightgbm",
                    "WAPE": 12.5,
                    "MAE": 0.5,
                    "coverage_95": 95.0,
                    "conformal_offset": 0.2,
                },
            ):
                result = retrain_tasks.retrain_tenant_forecast_models.run(
                    "tenant-demo-01", force=False
                )
        finally:
            celery_module.celery_app.conf.task_always_eager = False

        self.assertEqual(result["tenant_id"], "tenant-demo-01")
        self.assertEqual(result["WAPE"], 12.5)
        self.assertEqual(result["coverage_95"], 95.0)

    def test_celery_beat_schedules_the_weekly_retrain(self):
        from apps.ml.src.forecast.workers.celery_app import celery_app

        schedule = celery_app.conf.beat_schedule["weekly-forecast-retrain"]
        self.assertEqual(schedule["task"], "retrain_tenant_forecast_models")
        self.assertEqual(schedule["schedule"].hour, {2})
        self.assertEqual(schedule["schedule"].minute, {0})
        self.assertEqual(schedule["schedule"].day_of_week, {1})  # crontab: Monday

    def test_mlflow_run_is_recorded(self):
        mlflow = pytest_import_mlflow()
        if mlflow is None:
            self.skipTest("mlflow is not installed")

        from pathlib import Path

        repo_root = Path(__file__).resolve().parents[1]
        tracking_uri = os.getenv("MLFLOW_URI") or os.getenv("MLFLOW_TRACKING_URI")
        if not tracking_uri:
            tracking_uri = f"sqlite:///{(repo_root / 'mlflow.db').as_posix()}"
        mlflow.set_tracking_uri(tracking_uri)
        client = mlflow.tracking.MlflowClient()
        experiment = mlflow.get_experiment_by_name("techzone_forecast_demo")
        self.assertIsNotNone(experiment, "the MLflow experiment was never created")

        runs = client.search_runs(experiment.experiment_id, max_results=10)
        self.assertTrue(runs, "no MLflow run was recorded")
        latest = runs[0]
        self.assertIn("WAPE", latest.data.metrics)
        self.assertIn("coverage_95", latest.data.metrics)

    def test_benchmark_notebook_exists(self):
        from pathlib import Path

        repo_root = Path(__file__).resolve().parents[1]
        notebook = repo_root / "apps" / "ml" / "notebooks" / "forecast_benchmark.ipynb"
        self.assertTrue(notebook.exists(), "the benchmark notebook is missing")
        content = notebook.read_text(encoding="utf-8")
        self.assertIn("run_training", content)
        self.assertIn("mlflow", content)

    def test_sql_gapless_test_script_exists(self):
        from pathlib import Path

        repo_root = Path(__file__).resolve().parents[1]
        script = repo_root / "packages" / "database" / "sql" / "tests" / "test_timeseries_gapless.sql"
        self.assertTrue(script.exists(), "the SQL acceptance script is missing")
        content = script.read_text(encoding="utf-8")
        self.assertIn("v_daily_product_timeseries", content)
        self.assertIn("RAISE EXCEPTION", content)

    def test_trigger_retrain_endpoint(self):
        from fastapi.testclient import TestClient
        from apps.ml.src.main import app

        with mock.patch("apps.ml.src.forecast.train_forecast.run_training", return_value={}):
            client = TestClient(app)
            response = client.post(
                "/ml/v1/forecast/trigger-retrain",
                json={"tenant_id": "tenant-demo-01", "force": False},
            )
            self.assertEqual(response.status_code, 202)
            self.assertEqual(response.json()["status"], "queued")

    # --- 5. Agent tool & synthesis ---
    def test_agent_tool_returns_genui_payload(self):
        result = run_sales_forecast.func("JBL Flip 6", 30)
        self.assertTrue(result["success"])
        self.assertEqual(result["source"], "mock")
        self.assertEqual(result["card_type"], "sales_forecast")
        self.assertEqual(result["payload"]["product"]["id"], "prod_101")

    def test_agent_tool_returns_candidates_for_ambiguous_name(self):
        result = run_sales_forecast.func("سماعة", 7)
        self.assertFalse(result["success"])
        self.assertEqual(result["error"], "ambiguous_product")
        self.assertGreaterEqual(len(result["candidates"]), 2)

    def test_synthesis_contains_units_drivers_and_action_ar(self):
        payload = get_predictor().predict("prod_101", horizon_days=30)
        advice = render_forecast_advice(payload, language="ar")
        self.assertIn(str(payload["totals"]["yhat"]), advice)
        self.assertIn(f"{payload['totals']['yhat_lower']}–{payload['totals']['yhat_upper']}", advice)
        self.assertIn("وحدة", advice)

    def test_synthesis_prompt_embeds_payload(self):
        payload = get_predictor().predict("prod_101", horizon_days=7)
        prompt = build_synthesis_prompt(payload, language="en")
        self.assertIn("demand planning advisor", prompt)
        self.assertIn(str(payload["totals"]["yhat"]), prompt)


if __name__ == "__main__":
    unittest.main(verbosity=2)
