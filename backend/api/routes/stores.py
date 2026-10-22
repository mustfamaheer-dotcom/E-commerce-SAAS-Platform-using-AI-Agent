# backend/api/routes/stores.py
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict, Any

from backend.db.database import get_db
from backend.models import Tenant, StoreSettings, ThemeConfig
from backend.services.logo_analyzer import analyze_logo_and_generate_theme

router = APIRouter(prefix="/stores", tags=["Store Configuration"])


class StoreUpdatePayload(BaseModel):
    name: Optional[str] = None
    currency: Optional[str] = None
    business_sector: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    shipping_zones: Optional[Dict[str, Any]] = None
    payment_gateways: Optional[Dict[str, Any]] = None


class ThemeUpdatePayload(BaseModel):
    mode: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    accent_color: Optional[str] = None
    font_family: Optional[str] = None


@router.get("/me")
def get_current_store(tenant_id: str = "tenant-moustafa-tech", db: Session = Depends(get_db)):
    tenant = db.query(Tenant).filter_by(id=tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Store not found")
    settings = db.query(StoreSettings).filter_by(tenant_id=tenant_id).first()
    theme = db.query(ThemeConfig).filter_by(tenant_id=tenant_id).first()
    return {
        "tenant": {
            "id": tenant.id,
            "slug": tenant.slug,
            "name": tenant.name,
            "currency": tenant.currency,
            "logoUrl": tenant.logo_url,
        },
        "settings": {
            "displayName": settings.display_name if settings else tenant.name,
            "currency": settings.currency if settings else "EGP",
            "businessSector": settings.business_sector if settings else "electronics",
            "shippingZones": settings.shipping_zones if settings else {},
            "paymentGateways": settings.payment_gateways if settings else {},
        },
        "theme": {
            "mode": theme.mode if theme else "dark",
            "primaryColor": theme.primary_color if theme else "#0ea5e9",
            "secondaryColor": theme.secondary_color if theme else "#6366f1",
            "accentColor": theme.accent_color if theme else "#10b981",
            "logoUrl": theme.logo_url if theme else tenant.logo_url,
        },
    }


@router.put("/me")
def update_current_store(payload: StoreUpdatePayload, tenant_id: str = "tenant-moustafa-tech", db: Session = Depends(get_db)):
    tenant = db.query(Tenant).filter_by(id=tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Store not found")
    settings = db.query(StoreSettings).filter_by(tenant_id=tenant_id).first()
    if not settings:
        settings = StoreSettings(tenant_id=tenant_id, display_name=tenant.name)
        db.add(settings)

    if payload.name:
        tenant.name = payload.name
        settings.display_name = payload.name
    if payload.currency:
        tenant.currency = payload.currency
        settings.currency = payload.currency
    if payload.business_sector:
        settings.business_sector = payload.business_sector
    if payload.contact_email:
        settings.contact_email = payload.contact_email
    if payload.contact_phone:
        settings.contact_phone = payload.contact_phone
    if payload.shipping_zones:
        settings.shipping_zones = payload.shipping_zones
    if payload.payment_gateways:
        settings.payment_gateways = payload.payment_gateways

    db.commit()
    return {"status": "success", "message": "تم تحديث إعدادات المتجر بنجاح"}


@router.post("/me/logo")
async def upload_logo_and_generate_theme(
    file: UploadFile = File(...),
    tenant_id: str = "tenant-moustafa-tech",
    db: Session = Depends(get_db),
):
    """
    Analyzes uploaded logo, generates brand color palette, and persists to DB.
    """
    import os
    import uuid

    contents = await file.read()
    theme_data = analyze_logo_and_generate_theme(contents)

    # Persist the logo image to disk
    upload_dir = os.path.join(os.getcwd(), "backend", "static", "uploads", "logos")
    os.makedirs(upload_dir, exist_ok=True)
    ext = os.path.splitext(file.filename or "logo.png")[1] or ".png"
    safe_filename = f"{tenant_id}_{uuid.uuid4().hex[:8]}{ext}"
    file_path = os.path.join(upload_dir, safe_filename)
    with open(file_path, "wb") as f:
        f.write(contents)

    logo_url = f"/uploads/logos/{safe_filename}"

    theme = db.query(ThemeConfig).filter_by(tenant_id=tenant_id).first()
    if not theme:
        theme = ThemeConfig(tenant_id=tenant_id)
        db.add(theme)

    theme.primary_color = theme_data["primaryColor"]
    theme.secondary_color = theme_data["secondaryColor"]
    theme.accent_color = theme_data["accentColor"]
    theme.mode = theme_data["mode"]
    theme.logo_url = logo_url

    tenant = db.query(Tenant).filter_by(id=tenant_id).first()
    if tenant:
        tenant.logo_url = logo_url

    db.commit()

    return {
        "status": "success",
        "message": "تم تحليل الشعار بنجاح وتوليد لوحة ألوان الهوية البصرية.",
        "theme": {
            **theme_data,
            "logoUrl": logo_url,
        },
    }


@router.get("/me/theme")
def get_store_theme(tenant_id: str = "tenant-moustafa-tech", db: Session = Depends(get_db)):
    theme = db.query(ThemeConfig).filter_by(tenant_id=tenant_id).first()
    if not theme:
        return {
            "mode": "dark",
            "primaryColor": "#0ea5e9",
            "secondaryColor": "#6366f1",
            "accentColor": "#10b981",
        }
    return {
        "mode": theme.mode,
        "primaryColor": theme.primary_color,
        "secondaryColor": theme.secondary_color,
        "accentColor": theme.accent_color,
        "logoUrl": theme.logo_url,
    }


@router.put("/me/theme")
def update_store_theme(payload: ThemeUpdatePayload, tenant_id: str = "tenant-moustafa-tech", db: Session = Depends(get_db)):
    theme = db.query(ThemeConfig).filter_by(tenant_id=tenant_id).first()
    if not theme:
        theme = ThemeConfig(tenant_id=tenant_id)
        db.add(theme)

    if payload.mode:
        theme.mode = payload.mode
    if payload.primary_color:
        theme.primary_color = payload.primary_color
    if payload.secondary_color:
        theme.secondary_color = payload.secondary_color
    if payload.accent_color:
        theme.accent_color = payload.accent_color
    if payload.font_family:
        theme.font_family = payload.font_family

    db.commit()
    return {"status": "success", "message": "تم تحديث مظهر المتجر بنجاح"}
