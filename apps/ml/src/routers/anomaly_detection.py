# apps/ml/src/routers/anomaly_detection.py
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from apps.ml.src.analytics.anomaly_service import detect_series_anomalies
from apps.ml.src.analytics.attribution_service import attribute_anomaly_root_causes

router = APIRouter(prefix="/ml/v1/analytics", tags=["BI Analytics & Anomaly Detection"])


class MetricDataPoint(BaseModel):
    date: str
    value: float


class AnomalyDetectionRequest(BaseModel):
    metric: str = Field("net_profit", description="Metric to analyze: net_profit | gross_revenue | cancellation_rate")
    data_points: List[MetricDataPoint] = Field(..., description="Chronological series of daily values")
    z_threshold: Optional[float] = Field(2.5, description="Z-Score outlier threshold")
    breakdown_data: Optional[List[Dict[str, Any]]] = Field(None, description="Optional category/city breakdown for attribution")


class RootCause(BaseModel):
    dimension: str
    value: str
    contribution_pct: int
    explanation: str


class AnomalyItem(BaseModel):
    metric: str
    date: str
    value: float
    expected_value: float
    z_score: float
    severity: str
    direction: str
    root_causes: List[RootCause]


class AnomalyDetectionResponse(BaseModel):
    anomalies: List[AnomalyItem]
    summary: str


@router.post("/detect-anomalies", response_model=AnomalyDetectionResponse)
async def detect_anomalies_endpoint(payload: AnomalyDetectionRequest):
    """
    POST /ml/v1/analytics/detect-anomalies
    Detects statistical spikes/drops in revenue, profit, or cancellation rate,
    and returns automated root-cause explanations.
    """
    if len(payload.data_points) < 5:
        raise HTTPException(status_code=400, detail="Minimum 5 data points required for statistical anomaly detection.")

    dates = [p.date for p in payload.data_points]
    values = [p.value for p in payload.data_points]

    detected = detect_series_anomalies(
        dates=dates,
        values=values,
        metric_name=payload.metric,
        z_threshold=payload.z_threshold or 2.5,
    )

    enriched_anomalies = []
    for item in detected:
        causes = attribute_anomaly_root_causes(
            anomaly_date=item["date"],
            direction=item["direction"],
            breakdown_data=payload.breakdown_data,
        )
        enriched_anomalies.append(
            AnomalyItem(
                metric=item["metric"],
                date=item["date"],
                value=item["value"],
                expected_value=item["expected_value"],
                z_score=item["z_score"],
                severity=item["severity"],
                direction=item["direction"],
                root_causes=[RootCause(**c) for c in causes],
            )
        )

    if enriched_anomalies:
        first = enriched_anomalies[0]
        summary = (
            f"تم رصد شذوذ إحصائي في {first.metric}: حدث {first.direction} بتاريخ {first.date} "
            f"(قيمة فعلية: {first.value:,.0f} مقابل متوقع: {first.expected_value:,.0f})."
        )
    else:
        summary = f"المؤشرات المالية لمقياس {payload.metric} طبيعية ومستقرة ولا توجد انحرافات إحصائية شاذة."

    return AnomalyDetectionResponse(
        anomalies=enriched_anomalies,
        summary=summary,
    )
