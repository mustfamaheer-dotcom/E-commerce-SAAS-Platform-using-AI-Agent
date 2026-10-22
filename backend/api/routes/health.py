# backend/api/routes/health.py
from fastapi import APIRouter

router = APIRouter(tags=["Health"])

@router.get("/health")
def health_check():
    return {"status": "ok", "service": "Intelligent ERP Data Navigator & TechZone Agent"}
