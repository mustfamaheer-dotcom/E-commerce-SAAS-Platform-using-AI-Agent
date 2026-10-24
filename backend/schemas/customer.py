# backend/schemas/customer.py
"""Customer CRM and RFM segmentation DTO schemas."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class CustomerDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    tenant_id: str
    name: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    governorate: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    total_orders: int = 0
    total_spent: float = 0.0
    rfm_segment: Optional[str] = None
    last_order_at: Optional[datetime] = None
    created_at: Optional[datetime] = None


class CustomerCreateDTO(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    email: Optional[EmailStr] = None
    governorate: Optional[str] = "Cairo"
    city: Optional[str] = "Cairo"
    address: Optional[str] = None


class CustomerFilterParams(BaseModel):
    search: Optional[str] = None
    rfm_segment: Optional[str] = None
    city: Optional[str] = None
    min_spent: Optional[float] = None
