# backend/schemas/order.py
"""Order, Order Item, and Fulfillment DTO schemas."""
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class OrderItemDTO(BaseModel):
    product_id: str
    variant_id: Optional[str] = None
    name: str
    price: float
    quantity: int = Field(..., gt=0)
    sku: Optional[str] = None
    total: float


class ShippingAddressDTO(BaseModel):
    full_name: str
    phone: str
    email: Optional[EmailStr] = None
    city: str
    governorate: str
    address: str
    postal_code: Optional[str] = None
    notes: Optional[str] = None


class OrderDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    tenant_id: str
    user_id: Optional[str] = None
    status: str
    items: List[OrderItemDTO]
    subtotal: float
    shipping_cost: float = 0.0
    discount: float = 0.0
    total: float
    payment_method: str = "CARD"
    payment_status: str = "UNPAID"
    payment_ref: Optional[str] = None
    tracking_number: Optional[str] = None
    shipping_address: ShippingAddressDTO
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class OrderCreateDTO(BaseModel):
    items: List[OrderItemDTO] = Field(..., min_length=1)
    shipping_address: ShippingAddressDTO
    payment_method: str = Field("CARD", pattern="^(CARD|INSTAPAY|FAWRY|COD)$")
    promo_code: Optional[str] = None


class OrderStatusUpdateDTO(BaseModel):
    status: str = Field(..., pattern="^(PENDING|CONFIRMED|PROCESSING|SHIPPED|DELIVERED|CANCELLED|REFUNDED)$")
    note: Optional[str] = None


class OrderFilterParams(BaseModel):
    status: Optional[str] = None
    customer_id: Optional[str] = None
    payment_status: Optional[str] = None
    from_date: Optional[datetime] = None
    to_date: Optional[datetime] = None
