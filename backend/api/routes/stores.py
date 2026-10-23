# backend/api/routes/stores.py
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict, Any

from backend.db.database import get_db
from backend.models import Tenant, StoreSettings, ThemeConfig, User
from backend.services.logo_analyzer import analyze_logo_and_generate_theme

router = APIRouter(prefix="/stores", tags=["Store Configuration"])


class StoreCreatePayload(BaseModel):
    name: str
    category: Optional[str] = "تجارة عامة وإلكترونيات"
    currency: Optional[str] = "EGP"
    owner_name: Optional[str] = None
    owner_email: str
    phone: Optional[str] = None
    theme_mode: Optional[str] = "dark"


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


@router.post("")
def create_store(payload: StoreCreatePayload, db: Session = Depends(get_db)):
    import re, uuid
    raw_slug = re.sub(r'[^a-zA-Z0-9]+', '-', payload.name.lower()).strip('-')
    if not raw_slug:
        raw_slug = "store"
    unique_suffix = uuid.uuid4().hex[:6]
    slug = f"{raw_slug}-{unique_suffix}"
    tenant_id = f"tenant-{slug}"

    new_tenant = Tenant(
        id=tenant_id,
        slug=slug,
        name=payload.name,
        currency=payload.currency or "EGP",
        theme_config={"mode": payload.theme_mode or "dark"},
    )
    db.add(new_tenant)
    db.flush()

    settings = StoreSettings(
        tenant_id=tenant_id,
        display_name=payload.name,
        currency=payload.currency or "EGP",
        business_sector=payload.category or "electronics",
        contact_email=payload.owner_email.strip().lower(),
        contact_phone=payload.phone or "",
    )
    db.add(settings)

    theme = ThemeConfig(
        tenant_id=tenant_id,
        mode=payload.theme_mode or "dark",
        primary_color="#0ea5e9",
        secondary_color="#6366f1",
        accent_color="#10b981",
    )
    db.add(theme)

    email_clean = payload.owner_email.strip().lower()
    user = db.query(User).filter_by(email=email_clean).first()
    if not user:
        user = User(
            id=f"usr_{tenant_id}_owner",
            tenant_id=tenant_id,
            email=email_clean,
            full_name=payload.owner_name or payload.name,
            phone=payload.phone or "",
            role="owner",
        )
        db.add(user)
    else:
        user.tenant_id = tenant_id

    db.commit()
    db.refresh(new_tenant)

    # Auto-seed the newly created tenant from demo catalog & ERP transactions
    try:
        from backend.services.tenant_seeder import seed_tenant_from_demo
        seed_tenant_from_demo(db, target_tenant_id=tenant_id, source_tenant_id="tenant-moustafa-tech")
    except Exception as exc:
        print(f"Warning: Auto-seeding tenant '{tenant_id}' failed: {exc}")

    return {
        "status": "success",
        "message": f"تم إنشاء المتجر '{new_tenant.name}' بنجاح",
        "store": {
            "id": new_tenant.id,
            "slug": new_tenant.slug,
            "name": new_tenant.name,
            "category": payload.category or "تجارة عامة",
            "currency": new_tenant.currency,
            "themeMode": payload.theme_mode or "dark",
            "createdAt": new_tenant.created_at.isoformat() if new_tenant.created_at else None,
            "adminUrl": f"/admin/{new_tenant.slug}",
            "storefrontUrl": f"/store/{new_tenant.slug}",
            "logoUrl": new_tenant.logo_url,
        },
    }


@router.get("")
def list_stores(owner_email: Optional[str] = None, db: Session = Depends(get_db)):
    if owner_email:
        email_clean = owner_email.strip().lower()
        if email_clean in ["owner@moustafatech.eg", "owner.1.1@-moustafa-tech--102.eg"]:
            tenants = db.query(Tenant).filter_by(id="tenant-moustafa-tech").all()
        else:
            setting_tenant_ids = [
                s.tenant_id
                for s in db.query(StoreSettings).filter(StoreSettings.contact_email.ilike(email_clean)).all()
            ]
            user_tenant_ids = [
                u.tenant_id
                for u in db.query(User).filter(User.email.ilike(email_clean)).all()
                if u.tenant_id
            ]
            allowed_ids = set(setting_tenant_ids + user_tenant_ids)
            # Always include demo store so user can seamlessly switch and test with baseline ERP data
            allowed_ids.add("tenant-moustafa-tech")
            if allowed_ids:
                tenants = db.query(Tenant).filter(Tenant.id.in_(allowed_ids)).all()
            else:
                tenants = db.query(Tenant).filter_by(id="tenant-moustafa-tech").all()
    else:
        # Default unauthenticated access only gets demo store, never leaking competitors
        tenants = db.query(Tenant).filter_by(id="tenant-moustafa-tech").all()

    return [
        {
            "id": t.id,
            "slug": t.slug,
            "name": t.name,
            "category": "بيع أجهزة وإلكترونيات",
            "currency": t.currency or "EGP",
            "themeMode": "dark",
            "createdAt": t.created_at.isoformat() if t.created_at else None,
            "adminUrl": f"/admin/{t.slug}",
            "storefrontUrl": f"/store/{t.slug}",
            "logoUrl": t.logo_url,
        }
        for t in tenants
    ]


@router.get("/me")
def get_current_store(tenant_id: Optional[str] = "tenant-moustafa-tech", db: Session = Depends(get_db)):
    tid = tenant_id if tenant_id and tenant_id != "all" else "tenant-moustafa-tech"
    tenant = db.query(Tenant).filter_by(id=tid).first()
    if not tenant:
        tenant = db.query(Tenant).filter_by(id="tenant-moustafa-tech").first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Store not found")
    settings = db.query(StoreSettings).filter_by(tenant_id=tenant.id).first()
    theme = db.query(ThemeConfig).filter_by(tenant_id=tenant.id).first()
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
def get_store_theme(tenant_id: Optional[str] = "tenant-moustafa-tech", db: Session = Depends(get_db)):
    tid = tenant_id if tenant_id and tenant_id != "all" else "tenant-moustafa-tech"
    theme = db.query(ThemeConfig).filter_by(tenant_id=tid).first()
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
