# backend/api/routes/coupons.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import uuid

from backend.db.database import get_db
from backend.models import Coupon

router = APIRouter(prefix="/coupons", tags=["Coupons Engine"])


class CouponCreatePayload(BaseModel):
    code: str
    type: str = "percent"  # percent or fixed
    value: float
    min_order: Optional[float] = 0.0
    max_uses: Optional[int] = 100


class CouponValidatePayload(BaseModel):
    code: str
    subtotal: float


@router.get("")
def list_coupons(tenant_id: str = "tenant-moustafa-tech", db: Session = Depends(get_db)):
    coupons = db.query(Coupon).filter_by(tenant_id=tenant_id).all()
    return [
        {
            "id": c.id,
            "code": c.code,
            "type": c.type,
            "value": c.value,
            "minOrder": c.min_order,
            "maxUses": c.max_uses,
            "usedCount": c.used_count,
            "isActive": c.is_active,
        }
        for c in coupons
    ]


@router.post("")
def create_coupon(payload: CouponCreatePayload, tenant_id: str = "tenant-moustafa-tech", db: Session = Depends(get_db)):
    clean_code = payload.code.upper().strip()
    existing = db.query(Coupon).filter_by(tenant_id=tenant_id, code=clean_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="الكوبون موجود مسبقاً")

    coup = Coupon(
        id=f"coup_{uuid.uuid4().hex[:8]}",
        tenant_id=tenant_id,
        code=clean_code,
        type=payload.type,
        value=payload.value,
        min_order=payload.min_order or 0.0,
        max_uses=payload.max_uses or 100,
        is_active=True,
    )
    db.add(coup)
    db.commit()
    db.refresh(coup)
    return {"status": "success", "message": f"تم إنشاء الكوبون '{clean_code}' بنجاح", "id": coup.id}


@router.post("/validate")
def validate_coupon(payload: CouponValidatePayload, tenant_id: str = "tenant-moustafa-tech", db: Session = Depends(get_db)):
    clean_code = payload.code.upper().strip()
    coup = db.query(Coupon).filter_by(tenant_id=tenant_id, code=clean_code, is_active=True).first()
    if not coup:
        raise HTTPException(status_code=404, detail="كود الكوبون غير صحيح أو منتهي الصلاحية")

    if payload.subtotal < coup.min_order:
        raise HTTPException(
            status_code=400,
            detail=f"الحد الأدنى لتطبيق هذا الكوبون هو {coup.min_order:,.0f} ج.م",
        )

    discount = (
        round(payload.subtotal * (coup.value / 100.0), 2)
        if coup.type == "percent"
        else min(payload.subtotal, coup.value)
    )

    return {
        "valid": True,
        "code": coup.code,
        "discountAmount": discount,
        "type": coup.type,
        "message": f"تم تطبيق الخصم بنجاح (-{discount:,.2f} ج.م)",
    }


@router.delete("/{coupon_id}")
def delete_coupon(coupon_id: str, tenant_id: str = "tenant-moustafa-tech", db: Session = Depends(get_db)):
    coup = db.query(Coupon).filter_by(tenant_id=tenant_id, id=coupon_id).first()
    if not coup:
        raise HTTPException(status_code=404, detail="Coupon not found")
    db.delete(coup)
    db.commit()
    return {"status": "success", "message": "تم حذف الكوبون بنجاح"}
