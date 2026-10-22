# apps/ml/src/main.py
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from apps.ml.src.catalog.ingest import router as catalog_router
from apps.ml.src.routers.inventory_risk import router as inventory_risk_router
from apps.ml.src.routers.anomaly_detection import router as anomaly_router
from apps.ml.src.routers.forecast import router as forecast_router
from apps.ml.src.routers.rfm_segmentation import router as rfm_router
from apps.ml.src.routers.agent_chat import router as agent_chat_router
from backend.api.routes.stores import router as stores_router
from backend.api.routes.products import router as products_router
from backend.api.routes.categories import router as categories_router
from backend.api.routes.orders import router as orders_router
from backend.api.routes.coupons import router as coupons_router
from backend.api.routes.customers import router as customers_router
from backend.api.routes.inventory import router as inventory_router
from backend.api.routes.analytics import router as analytics_router
from backend.api.routes.agent import router as agent_router
from backend.db.database import init_db

init_db()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Load the promoted champion, its SHAP explainer and the feature caches so
    the first inference request already meets the p95 < 350 ms budget.
    """
    try:
        from apps.ml.src.forecast.predictor import get_predictor

        get_predictor().warm_up()
    except Exception:
        pass
    yield


app = FastAPI(
    title="TechZone ML & Intelligence Microservice",
    description="Product Catalog Cleaning, Zero-Shot Category Classification, Probabilistic Inventory Risk, BI Financial Anomaly Detection, Sales Forecasting with SHAP explainability, and Customer RFM Segmentation",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(catalog_router)
app.include_router(inventory_risk_router)
app.include_router(anomaly_router)
import os
from fastapi.staticfiles import StaticFiles

uploads_dir = os.path.join(os.getcwd(), "backend", "static", "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

app.include_router(forecast_router)
app.include_router(rfm_router)
app.include_router(agent_chat_router)
app.include_router(stores_router, prefix="/api/v1")
app.include_router(products_router, prefix="/api/v1")
app.include_router(categories_router, prefix="/api/v1")
app.include_router(orders_router, prefix="/api/v1")
app.include_router(coupons_router, prefix="/api/v1")
app.include_router(customers_router, prefix="/api/v1")
app.include_router(inventory_router, prefix="/api/v1")
app.include_router(analytics_router, prefix="/api/v1")
app.include_router(agent_router, prefix="/api/v1")


@app.get("/", include_in_schema=False)
def root():
    """Redirect root to Swagger documentation"""
    return RedirectResponse(url="/docs")


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "techzone-ml",
        "modules": [
            "catalog_ingest",
            "sku_classifier",
            "stockout_optimizer",
            "bi_anomaly_detector",
            "sales_forecaster",
            "forecast_retrain_worker",
            "customer_rfm_segmentation",
        ],
    }
