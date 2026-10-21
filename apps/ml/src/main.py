# apps/ml/src/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apps.ml.src.catalog.ingest import router as catalog_router
from apps.ml.src.routers.inventory_risk import router as inventory_risk_router
from apps.ml.src.routers.anomaly_detection import router as anomaly_router

app = FastAPI(
    title="TechZone ML & Intelligence Microservice",
    description="Product Catalog Cleaning, Zero-Shot Category Classification, Probabilistic Inventory Risk, and BI Financial Anomaly Detection",
    version="1.0.0",
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


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "techzone-ml",
        "modules": ["catalog_ingest", "sku_classifier", "stockout_optimizer", "bi_anomaly_detector"],
    }
