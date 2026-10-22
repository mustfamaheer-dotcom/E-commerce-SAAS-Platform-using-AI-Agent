# backend/main.py
"""FastAPI Entrypoint for Intelligent ERP + AI Agent E-Commerce Platform."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.routes.health import router as health_router
from backend.api.routes.schema import router as schema_router
from backend.api.routes.chat import router as chat_router
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

# Ensure all database tables exist on startup
init_db()

app = FastAPI(
    title="Intelligent ERP + AI Agent E-Commerce API",
    description="Full ERP + Autonomous Egyptian AI Agent Multi-Tenant Platform",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os
from fastapi.staticfiles import StaticFiles

uploads_dir = os.path.join(os.getcwd(), "backend", "static", "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Core ERP & E-Commerce API Routers
app.include_router(health_router, prefix="/api/v1")
app.include_router(schema_router, prefix="/api/v1")
app.include_router(chat_router, prefix="/api/v1")
app.include_router(stores_router, prefix="/api/v1")
app.include_router(products_router, prefix="/api/v1")
app.include_router(categories_router, prefix="/api/v1")
app.include_router(orders_router, prefix="/api/v1")
app.include_router(coupons_router, prefix="/api/v1")
app.include_router(customers_router, prefix="/api/v1")
app.include_router(inventory_router, prefix="/api/v1")
app.include_router(analytics_router, prefix="/api/v1")
app.include_router(agent_router, prefix="/api/v1")


@app.get("/")
def root():
    return {
        "service": "TechZone ERP & E-Commerce Platform API",
        "version": "2.0.0",
        "status": "online",
        "docs": "/docs",
    }
