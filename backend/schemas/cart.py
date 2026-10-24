# backend/schemas/cart.py
"""Cart and Checkout Session DTO schemas."""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class CartItemDTO(BaseModel):
    product_id: str
    variant_id: Optional[str] = None
    name: str
    price: float
    quantity: int = Field(..., gt=0)
    sku: Optional[str] = None
    image_url: Optional[str] = None
    total: float = 0.0


class CartDTO(BaseModel):
    items: List[CartItemDTO] = Field(default_factory=list)
    subtotal: float = 0.0
    discount: float = 0.0
    shipping_cost: float = 0.0
    tax: float = 0.0
    total: float = 0.0
    applied_coupon: Optional[str] = None
    currency: str = "EGP"


class AddToCartDTO(BaseModel):
    product_id: str
    variant_id: Optional[str] = None
    quantity: int = Field(1, gt=0)


class ApplyCouponDTO(BaseModel):
    code: str = Field(..., min_length=2, max_length=50)
    subtotal: float = Field(..., ge=0)
