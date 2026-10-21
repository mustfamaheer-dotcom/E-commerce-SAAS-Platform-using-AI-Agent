# apps/ml/src/routers/inventory_risk.py
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, Field
from apps.ml.src.inventory.stockout_optimizer import (
    analyze_inventory_risk,
    InventoryRiskAnalysisResult,
    DEFAULT_LEAD_TIME_DAYS,
    DEFAULT_SERVICE_LEVEL,
)

router = APIRouter(prefix="/ml/v1/inventory", tags=["Inventory Risk & Optimization"])


class InventoryRiskRequest(BaseModel):
    items: List[Dict[str, Any]] = Field(..., description="List of SKU inventory and demand records")
    lead_time_days: Optional[int] = Field(DEFAULT_LEAD_TIME_DAYS, description="Supplier lead time in days")
    service_level: Optional[float] = Field(DEFAULT_SERVICE_LEVEL, description="Service level target (e.g. 0.95)")


@router.post("/analyze-risk", response_model=InventoryRiskAnalysisResult)
async def analyze_risk_endpoint(payload: InventoryRiskRequest):
    """
    POST /ml/v1/inventory/analyze-risk
    Computes rolling demand velocity, volatility (sigma_d), dynamic ROP,
    probabilistic safety stock (Z_0.95), and days-until-stockout.
    """
    if not payload.items:
        raise HTTPException(status_code=400, detail="items list cannot be empty")

    try:
        result = analyze_inventory_risk(
            items=payload.items,
            lead_time_days=payload.lead_time_days or DEFAULT_LEAD_TIME_DAYS,
            service_level=payload.service_level or DEFAULT_SERVICE_LEVEL,
        )
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Stockout risk calculation failed: {str(exc)}")
