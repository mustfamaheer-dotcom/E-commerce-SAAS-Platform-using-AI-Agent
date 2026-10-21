# apps/agent/tools/customer_promo_tools.py
"""
LangGraph Tools for Customer RFM Segmentation & Targeted Promotions (Renad Hakim - Slice 05).
Supports read/analysis tool `get_customer_segments` and state-mutating HITL tool `create_promotion_for_segment`.
"""
import uuid
from typing import Any, Dict, Optional
from langchain_core.tools import tool

from apps.ml.src.customers.rfm_service import run_rfm_segmentation


@tool
def get_customer_segments(tenant_id: str = "tenant-demo-01") -> Dict[str, Any]:
    """
    Analyzes merchant customer purchase patterns using Log-RFM features and K-Means (K=5).
    Returns segment distributions, customer counts, average spend, and targeted retention advice.
    """
    res = run_rfm_segmentation(tenant_id=tenant_id)

    # Find the At-Risk of Churn segment for proactive retention highlight
    at_risk = next((s for s in res["segments"] if s["segment_name"] == "At-Risk of Churn"), None)
    at_risk_count = at_risk["customer_count"] if at_risk else 0

    return {
        "status": "success",
        "card_type": "customer_segments",
        "tenant_id": tenant_id,
        "silhouette_score": res["silhouette_score"],
        "total_customers": res["total_customers"],
        "segments": res["segments"],
        "retention_insight": {
            "at_risk_count": at_risk_count,
            "recommended_action_ar": f"عندك {at_risk_count} عملاء في شريحة 'معرضين للمغادرة'. يُنصح بإطلاق كوبون خصم 15% لاستعادتهم فوراً.",
            "recommended_action_en": f"You have {at_risk_count} customers in 'At-Risk of Churn'. Recommend launching a 15% win-back campaign.",
        },
    }


@tool
def create_promotion_for_segment(
    segment: str,
    discount_pct: float,
    duration_days: int = 7,
    code_prefix: Optional[str] = None,
    tenant_id: str = "tenant-demo-01",
) -> Dict[str, Any]:
    """
    Creates a targeted promotional coupon for a specific customer RFM segment.
    Triggers a Human-in-the-Loop (HITL) confirmation card before committing to database.
    """
    if discount_pct <= 0 or discount_pct > 50:
        return {
            "status": "error",
            "message": f"Invalid discount percentage {discount_pct}%. Must be between 1% and 50%.",
        }

    valid_segments = ["VIP Champions", "Loyal Customers", "New Customers", "At-Risk of Churn", "Hibernating / Lost", "ALL"]
    if segment not in valid_segments:
        return {
            "status": "error",
            "message": f"Unknown segment '{segment}'. Valid options: {valid_segments}",
        }

    prefix = (code_prefix or segment.split()[0]).upper().replace("-", "")[:6]
    coupon_code = f"{prefix}{int(discount_pct)}"
    action_id = f"act_{uuid.uuid4().hex[:10]}"

    # Mock customer count and projected revenue impact estimation
    reach_estimate = 10 if segment != "ALL" else 50
    avg_order_value = 4500.0 if "VIP" in segment else 2200.0
    projected_revenue = round(reach_estimate * avg_order_value * 0.40 * (1 - discount_pct / 100), 2)

    return {
        "status": "pending_confirmation",
        "card_type": "promotion_approval",
        "action_id": action_id,
        "tenant_id": tenant_id,
        "coupon_code": coupon_code,
        "target_segment": segment,
        "discount_pct": discount_pct,
        "duration_days": duration_days,
        "estimated_reach_customers": reach_estimate,
        "projected_revenue_impact_egp": projected_revenue,
        "requires_confirmation": True,
        "message_ar": f"مطلوب تأكيد إطلاق حملة الخصم: كود '{coupon_code}' لشريحة '{segment}' بخصم {discount_pct}% لمدة {duration_days} أيام.",
        "message_en": f"Confirmation required to launch promo '{coupon_code}' for '{segment}' ({discount_pct}% off, {duration_days} days).",
    }
