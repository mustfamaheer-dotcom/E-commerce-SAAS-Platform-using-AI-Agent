# backend/schemas/coupon.py
"""Coupon and Discount Engine DTO schemas."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class CouponDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    tenant_id: str
    code: str
    type: str = "percent"  # percent | fixed
    value: float
    min_order: float = 0.0
    max_uses: int = 100
    used_count: int = 0
    is_active: bool = True
    expires_at: Optional[datetime] = None
    created_at: Optional[datetime] = None


class CouponCreateDTO(BaseModel):
    code: str = Field(..., min_length=2, max_length=50)
    type: str = Field("percent", pattern="^(percent|fixed)$")
    value: float = Field(..., gt=0)
    min_order: float = Field(0.0, ge=0)
    max_uses: int = Field(100, ge=1)
    expires_at: Optional[datetime] = None


class CouponValidateDTO(BaseModel):
    code: str = Field(..., min_length=2, max_length=50)
    subtotal: float = Field(..., ge=0)


class CouponValidationResultDTO(BaseModel):
    valid: bool
    code: str
    discount_amount: float
    type: str
    message: str
