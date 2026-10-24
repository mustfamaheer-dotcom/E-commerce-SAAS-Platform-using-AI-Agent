# backend/services/coupon_service.py
"""Coupon & Promotion Service."""
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session

from backend.models.coupon import Coupon
from backend.schemas.coupon import CouponCreateDTO, CouponValidationResultDTO
from backend.core.errors import EntityNotFoundException, ValidationException


class CouponService:
    def __init__(self, db: Session):
        self.db = db

    def list_coupons(self, tenant_id: str) -> List[Coupon]:
        return self.db.query(Coupon).filter_by(tenant_id=tenant_id).all()

    def create_coupon(self, tenant_id: str, dto: CouponCreateDTO) -> Coupon:
        clean_code = dto.code.upper().strip()
        existing = self.db.query(Coupon).filter_by(tenant_id=tenant_id, code=clean_code).first()
        if existing:
            raise ValidationException(f"Coupon code '{clean_code}' already exists in this store.")

        coupon = Coupon(
            id=f"coup_{uuid.uuid4().hex[:8]}",
            tenant_id=tenant_id,
            code=clean_code,
            type=dto.type,
            value=dto.value,
            min_order=dto.min_order,
            max_uses=dto.max_uses,
            expires_at=dto.expires_at,
            is_active=True,
        )
        self.db.add(coupon)
        self.db.commit()
        self.db.refresh(coupon)
        return coupon

    def validate_coupon(
        self, tenant_id: str, code: str, subtotal: float
    ) -> Tuple[bool, float, str]:
        """
        Validates coupon rules and returns (is_valid, discount_amount, message).
        Does NOT increment used_count (safe for preview/dry-run).
        """
        clean_code = code.upper().strip()
        coupon = self.db.query(Coupon).filter_by(tenant_id=tenant_id, code=clean_code).first()
        if not coupon or not coupon.is_active:
            return False, 0.0, "Coupon code is invalid or expired."

        now = datetime.now(timezone.utc)
        if coupon.expires_at and coupon.expires_at.replace(tzinfo=timezone.utc) < now:
            return False, 0.0, "Coupon has expired."

        if coupon.used_count >= coupon.max_uses:
            return False, 0.0, "Coupon usage limit has been reached."

        if subtotal < coupon.min_order:
            return False, 0.0, f"Minimum order amount for this coupon is {coupon.min_order:,.0f} EGP."

        if coupon.type == "percent":
            discount = round(subtotal * (coupon.value / 100.0), 2)
        else:
            discount = min(subtotal, coupon.value)

        return True, discount, f"Coupon applied successfully (-{discount:,.2f} EGP)."

    def apply_and_consume(self, tenant_id: str, code: str, subtotal: float) -> float:
        """Applies coupon and atomically increments used_count."""
        clean_code = code.upper().strip()
        coupon = (
            self.db.query(Coupon)
            .filter_by(tenant_id=tenant_id, code=clean_code)
            .with_for_update()
            .first()
        )
        if not coupon or not coupon.is_active:
            raise ValidationException("Coupon code is invalid or inactive.")

        if coupon.used_count >= coupon.max_uses:
            raise ValidationException("Coupon usage limit reached.")

        if subtotal < coupon.min_order:
            raise ValidationException(f"Minimum order for this coupon is {coupon.min_order:,.0f} EGP.")

        if coupon.type == "percent":
            discount = round(subtotal * (coupon.value / 100.0), 2)
        else:
            discount = min(subtotal, coupon.value)

        coupon.used_count += 1
        self.db.flush()
        return discount
