# backend/tests/test_chat_route.py
"""Test suite for Chat & AI inference routes (Renad - TASK-RE-05)."""
import unittest
from fastapi.testclient import TestClient
from apps.ml.src.main import app


class TestChatAndInferenceRoutes(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_01_health_check_returns_ok(self):
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "ok")

    def test_02_rfm_segmentation_valid_payload(self):
        res = self.client.post("/ml/v1/customers/rfm-segmentation", json={"tenant_id": "tenant-demo-01"})
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertEqual(len(body["segments"]), 5)
        self.assertGreater(body["silhouette_score"], 0.40)

    def test_03_forecast_predict_valid_product(self):
        res = self.client.post(
            "/ml/v1/forecast/predict",
            json={"tenant_id": "tenant-demo-01", "product_id": "prod_101", "horizon_days": 14},
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.json()["point_forecast"]), 14)

    def test_04_forecast_predict_invalid_horizon_rejected(self):
        res = self.client.post(
            "/ml/v1/forecast/predict",
            json={"tenant_id": "tenant-demo-01", "product_id": "prod_101", "horizon_days": 60},
        )
        self.assertEqual(res.status_code, 422)

    def test_05_large_payload_handling(self):
        large_query = "مبيعات " * 500  # > 2500 characters
        res = self.client.post(
            "/ml/v1/forecast/predict",
            json={"tenant_id": "tenant-demo-01", "product_name_hint": large_query, "horizon_days": 7},
        )
        # Should gracefully return 404/422 rather than crash the server
        self.assertIn(res.status_code, [404, 422])


if __name__ == "__main__":
    unittest.main()
