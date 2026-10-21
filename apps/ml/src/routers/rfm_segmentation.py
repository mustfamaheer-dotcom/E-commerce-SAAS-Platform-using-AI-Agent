# apps/ml/src/routers/rfm_segmentation.py
"""FastAPI endpoint for Customer RFM Segmentation & K-Means Clustering (Renad Slice 05)."""
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from apps.ml.src.customers.rfm_service import run_rfm_segmentation

router = APIRouter(prefix="/ml/v1/customers", tags=["Customer Segmentation & Promotions"])


class RfmSegmentationRequest(BaseModel):
    tenant_id: str = Field("tenant-demo-01", description="Tenant UUID or Slug")


class SegmentSummary(BaseModel):
    segment_name: str
    customer_count: int
    avg_recency_days: float
    avg_frequency: float
    avg_monetary_egp: float
    recommended_action_en: str
    recommended_action_ar: str
    badge_color: str


class RfmSegmentationResponse(BaseModel):
    tenant_id: str
    silhouette_score: float
    davies_bouldin_score: float
    total_customers: int
    segments: List[SegmentSummary]
    card_type: str = "customer_segments"


@router.post("/rfm-segmentation", response_model=RfmSegmentationResponse)
async def segment_customers(request: RfmSegmentationRequest):
    """
    POST /ml/v1/customers/rfm-segmentation
    Calculates Log-RFM features, fits K-Means (K=5), evaluates Silhouette Score,
    and returns segment distributions and retention advice.
    """
    try:
        data = run_rfm_segmentation(tenant_id=request.tenant_id)
        return RfmSegmentationResponse(
            tenant_id=data["tenant_id"],
            silhouette_score=data["silhouette_score"],
            davies_bouldin_score=data["davies_bouldin_score"],
            total_customers=data["total_customers"],
            segments=data["segments"],
            card_type="customer_segments",
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"RFM segmentation failed: {str(exc)}")
