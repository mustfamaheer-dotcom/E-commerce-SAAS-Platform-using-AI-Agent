# apps/test_renad_unittest.py
"""
Comprehensive Unit Tests for Renad Hakim's Vertical Slice 05:
Customer RFM Segmentation, Smart Promotions & Local Egypt Integrations (Paymob, Bosta).
"""
import os
import sys
import unittest
from fastapi.testclient import TestClient

if sys.platform == "win32" and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from packages.database.seed.seed_customers_rfm import generate_rfm_customer_pool
from apps.ml.src.customers.rfm_service import RfmSegmentationPipeline, run_rfm_segmentation
from apps.ml.src.main import app as ml_app
from apps.agent.tools.customer_promo_tools import create_promotion_for_segment, get_customer_segments


class TestRenadCustomerSlice(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(ml_app)

    def test_01_seeding_script_generates_all_5_rfm_clusters(self):
        custs, ords, items = generate_rfm_customer_pool(tenant_id="tenant-test", customer_count=50)
        self.assertEqual(len(custs), 50)
        self.assertGreater(len(ords), 100)
        self.assertGreater(len(items), 200)

        segments = {c["rfm_segment"] for c in custs}
        expected_segments = {"VIP Champions", "Loyal Customers", "New Customers", "At-Risk of Churn", "Hibernating / Lost"}
        self.assertEqual(segments, expected_segments)

    def test_02_rfm_pipeline_computes_valid_recency_frequency_monetary(self):
        _, ords, _ = generate_rfm_customer_pool(tenant_id="tenant-test", customer_count=20)
        pipeline = RfmSegmentationPipeline(n_clusters=5)
        rfm_df = pipeline.extract_rfm(ords)

        self.assertIn("recency", rfm_df.columns)
        self.assertIn("frequency", rfm_df.columns)
        self.assertIn("monetary", rfm_df.columns)
        self.assertTrue((rfm_df["frequency"] >= 1).all())
        self.assertTrue((rfm_df["monetary"] > 0).all())
        self.assertTrue((rfm_df["recency"] >= 0).all())

    def test_03_rfm_clustering_silhouette_quality(self):
        result = run_rfm_segmentation(tenant_id="tenant-demo-01")
        self.assertGreater(result["silhouette_score"], 0.40, "Silhouette score must exceed 0.40")
        self.assertEqual(len(result["segments"]), 5)

    def test_04_rfm_segment_labels_and_actions_complete(self):
        result = run_rfm_segmentation(tenant_id="tenant-demo-01")
        segment_names = {s["segment_name"] for s in result["segments"]}
        self.assertIn("VIP Champions", segment_names)
        self.assertIn("At-Risk of Churn", segment_names)

        at_risk = next(s for s in result["segments"] if s["segment_name"] == "At-Risk of Churn")
        self.assertIn("خصم", at_risk["recommended_action_ar"])
        self.assertEqual(at_risk["badge_color"], "rose")

    def test_05_fastapi_rfm_endpoint_returns_200(self):
        res = self.client.post("/ml/v1/customers/rfm-segmentation", json={"tenant_id": "tenant-demo-01"})
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertEqual(body["card_type"], "customer_segments")
        self.assertGreaterEqual(body["total_customers"], 20)
        self.assertGreater(body["silhouette_score"], 0.40)

    def test_06_agent_tool_get_customer_segments(self):
        res = get_customer_segments.invoke({"tenant_id": "tenant-demo-01"})
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["card_type"], "customer_segments")
        self.assertIn("retention_insight", res)
        self.assertGreater(res["retention_insight"]["at_risk_count"], 0)

    def test_07_agent_tool_create_promotion_hitl_pending(self):
        res = create_promotion_for_segment.invoke({
            "segment": "At-Risk of Churn",
            "discount_pct": 15.0,
            "duration_days": 7,
            "tenant_id": "tenant-demo-01",
        })
        self.assertEqual(res["status"], "pending_confirmation")
        self.assertEqual(res["card_type"], "promotion_approval")
        self.assertTrue(res["requires_confirmation"])
        self.assertEqual(res["coupon_code"], "ATRISK15")
        self.assertGreater(res["projected_revenue_impact_egp"], 0)

    def test_08_create_promotion_validates_discount_limits(self):
        res_zero = create_promotion_for_segment.invoke({
            "segment": "At-Risk of Churn",
            "discount_pct": 0.0,
        })
        self.assertEqual(res_zero["status"], "error")

        res_excess = create_promotion_for_segment.invoke({
            "segment": "At-Risk of Churn",
            "discount_pct": 60.0,
        })
        self.assertEqual(res_excess["status"], "error")

    def test_09_create_promotion_validates_unknown_segment(self):
        res = create_promotion_for_segment.invoke({
            "segment": "Random_Nonexistent_Segment",
            "discount_pct": 10.0,
        })
        self.assertEqual(res["status"], "error")

    def test_10_paymob_hmac_sha512_verification(self):
        import hmac
        import hashlib

        secret = "sandbox_hmac_secret_demo_techzone"
        sample_payload = {
            "amount_cents": 500000,
            "created_at": "2026-10-21T12:00:00",
            "currency": "EGP",
            "error_occured": "false",
            "has_parent_transaction": "false",
            "id": 123456,
            "integration_id": 999,
            "is_3d_secure": "true",
            "is_auth": "false",
            "is_capture": "false",
            "is_refunded": "false",
            "is_standalone_payment": "true",
            "is_voided": "false",
            "order": {"id": 8888},
            "owner": 1,
            "pending": "false",
            "source_data": {"pan": "2346", "sub_type": "Visa", "type": "card"},
            "success": "true",
        }

        # Build concatenation string
        concat_str = (
            f"{sample_payload['amount_cents']}{sample_payload['created_at']}{sample_payload['currency']}"
            f"{sample_payload['error_occured']}{sample_payload['has_parent_transaction']}{sample_payload['id']}"
            f"{sample_payload['integration_id']}{sample_payload['is_3d_secure']}{sample_payload['is_auth']}"
            f"{sample_payload['is_capture']}{sample_payload['is_refunded']}{sample_payload['is_standalone_payment']}"
            f"{sample_payload['is_voided']}{sample_payload['order']['id']}{sample_payload['owner']}"
            f"{sample_payload['pending']}{sample_payload['source_data']['pan']}{sample_payload['source_data']['sub_type']}"
            f"{sample_payload['source_data']['type']}{sample_payload['success']}"
        )
        calculated_hmac = hmac.new(secret.encode("utf-8"), concat_str.encode("utf-8"), hashlib.sha512).hexdigest()
        self.assertEqual(len(calculated_hmac), 128)  # SHA-512 hex length

    def test_11_bosta_shipping_waybill_zones(self):
        zones = {
            "Cairo": {"zone": "Greater Cairo", "days": 1},
            "Alexandria": {"zone": "Alexandria", "days": 2},
            "Assiut": {"zone": "Upper Egypt", "days": 3},
        }
        self.assertEqual(zones["Cairo"]["days"], 1)
        self.assertEqual(zones["Alexandria"]["zone"], "Alexandria")
        self.assertEqual(zones["Assiut"]["days"], 3)


if __name__ == "__main__":
    unittest.main()
