# apps/ml/src/routers/forecast.py
"""Retaj's FastAPI forecasting endpoints (predict, retrain, model metrics)."""
import json
import threading
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from apps.ml.src.forecast.predictor import get_predictor
from apps.ml.src.forecast.product_resolver import resolve_product

router = APIRouter(prefix="/ml/v1/forecast", tags=["Sales Forecasting & Explainability"])

MODEL_DIR = Path(__file__).resolve().parents[2] / "models"
METRICS_PATH = MODEL_DIR / "forecast_metrics.json"

_retrain_tasks: Dict[str, str] = {}


class ForecastRequest(BaseModel):
    tenant_id: str = Field("tenant-demo-01", description="Verified tenant id (set by the API gateway)")
    product_id: Optional[str] = Field(None, description="Product UUID; optional when product_name_hint is given")
    product_name_hint: Optional[str] = Field(None, description="Free-text product reference (Arabic or English)")
    horizon_days: int = Field(30, ge=1, le=30, description="Forecast horizon in days (7, 14 or 30)")


class ProductInfo(BaseModel):
    id: str
    name: str
    sku: str
    current_stock: int


class HistoryPoint(BaseModel):
    report_date: str
    units_sold: int


class ForecastPoint(BaseModel):
    report_date: str
    yhat: float
    yhat_lower: float
    yhat_upper: float


class Totals(BaseModel):
    yhat: float
    yhat_lower: float
    yhat_upper: float


class ShapDriver(BaseModel):
    feature: str
    impact_pct: float


class RestockAdvice(BaseModel):
    current_stock: int
    predicted_demand: int
    gap: int
    safety_stock: int
    stockout_eta: Optional[str] = None
    recommendation: str
    suggested_order_qty: int


class ForecastResponse(BaseModel):
    card_type: str = "sales_forecast"
    product: ProductInfo
    horizon_days: int
    history: List[HistoryPoint]
    point_forecast: List[ForecastPoint]
    totals: Totals
    top_shap_drivers: List[ShapDriver]
    restock: RestockAdvice
    model_version: str
    source: str
    latency_ms: int


class TriggerRetrainRequest(BaseModel):
    tenant_id: str = "tenant-demo-01"
    force: bool = Field(False, description="Force retraining even when a champion already exists")


class TriggerRetrainResponse(BaseModel):
    task_id: str
    status: str
    mode: str
    message: str


class ModelMetricsResponse(BaseModel):
    model_name: str
    model_version: str
    source: str
    MAE: Optional[float] = None
    RMSE: Optional[float] = None
    MAPE: Optional[float] = None
    WAPE: Optional[float] = None
    coverage_95: Optional[float] = None
    trained_date: Optional[str] = None
    train_start: Optional[str] = None
    train_end: Optional[str] = None
    test_start: Optional[str] = None
    test_end: Optional[str] = None
    benchmark: Optional[List[Dict[str, Any]]] = None


def _resolve(request: ForecastRequest) -> Dict:
    if request.product_id:
        from apps.ml.src.forecast.mock_store import get_product

        product = get_product(product_id=request.product_id)
        if product is None:
            raise HTTPException(status_code=404, detail=f"Unknown product_id: {request.product_id}")
        return {"status": "resolved", "product": product, "candidates": []}

    if not request.product_name_hint:
        raise HTTPException(
            status_code=422,
            detail="Either product_id or product_name_hint must be provided.",
        )

    return resolve_product(request.product_name_hint, tenant_id=request.tenant_id)


@router.post("/predict", response_model=ForecastResponse)
async def predict_forecast(request: ForecastRequest):
    """
    POST /ml/v1/forecast/predict
    Returns point + quantile forecasts, SHAP drivers and restock advice.
    Target latency: p95 < 350ms with a warmed feature cache.
    """
    resolved = _resolve(request)
    if resolved["status"] == "ambiguous":
        raise HTTPException(
            status_code=404,
            detail={
                "message": "Multiple products match this reference. Please choose one candidate.",
                "candidates": resolved["candidates"],
            },
        )
    if resolved["status"] == "not_found":
        raise HTTPException(status_code=404, detail="No product matches this reference.")

    product = resolved["product"]
    try:
        return get_predictor().predict(
            product_id=product["product_id"],
            horizon_days=request.horizon_days,
            tenant_id=request.tenant_id,
        )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except PermissionError as exc:
        raise HTTPException(
            status_code=403,
            detail={"message": "Cross-tenant access is not allowed.", "error": str(exc)},
        )


def _run_retrain_inline(task_id: str, tenant_id: str, force: bool) -> None:
    try:
        from apps.ml.src.forecast.train_forecast import run_training

        run_training(quick=False, promote=not force)
        _retrain_tasks[task_id] = "finished"
        get_predictor().invalidate_cache()
    except Exception as exc:
        _retrain_tasks[task_id] = f"failed: {exc}"


@router.post("/trigger-retrain", response_model=TriggerRetrainResponse, status_code=202)
async def trigger_retrain(request: TriggerRetrainRequest):
    """
    POST /ml/v1/forecast/trigger-retrain
    Enqueues the weekly retraining job. Production uses Celery + Redis; when the
    worker stack is absent (local demo) the job runs in a daemon thread.
    """
    task_id = f"retrain_{uuid.uuid4().hex[:12]}"
    _retrain_tasks[task_id] = "queued"

    try:
        from apps.ml.src.forecast.workers.celery_app import celery_app

        celery_app.send_task(
            "retrain_tenant_forecast_models",
            args=[request.tenant_id],
            kwargs={"force": request.force},
            task_id=task_id,
        )
        mode = "celery"
        message = "Retraining queued on the Celery worker."
    except Exception as exc:
        thread = threading.Thread(
            target=_run_retrain_inline,
            args=(task_id, request.tenant_id, request.force),
            daemon=True,
        )
        thread.start()
        mode = "inline"
        message = f"Celery unavailable ({type(exc).__name__}); retraining started in a background thread."

    return TriggerRetrainResponse(task_id=task_id, status="queued", mode=mode, message=message)


@router.get("/models/metrics", response_model=ModelMetricsResponse)
async def model_metrics():
    """
    GET /ml/v1/forecast/models/metrics
    Returns the champion model quality card logged during the last benchmark.
    """
    if METRICS_PATH.exists():
        try:
            metrics = json.loads(METRICS_PATH.read_text(encoding="utf-8"))
            return ModelMetricsResponse(
                model_name=metrics.get("model_name", "sales_forecast_quantile"),
                model_version=metrics.get("model_version", "unknown"),
                source=metrics.get("source", "benchmark"),
                MAE=metrics.get("MAE"),
                RMSE=metrics.get("RMSE"),
                MAPE=metrics.get("MAPE"),
                WAPE=metrics.get("WAPE"),
                coverage_95=metrics.get("coverage_95"),
                trained_date=metrics.get("trained_at"),
                train_start=metrics.get("train_start"),
                train_end=metrics.get("train_end"),
                test_start=metrics.get("test_start"),
                test_end=metrics.get("test_end"),
                benchmark=metrics.get("benchmark"),
            )
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Could not read model metrics: {exc}")

    return ModelMetricsResponse(
        model_name="heuristic-seasonal",
        model_version="heuristic-seasonal-v1",
        source="heuristic",
    )
