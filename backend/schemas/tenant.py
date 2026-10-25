# backend/schemas/tenant.py
"""Tenant, Store Settings, and Dynamic Theme schemas."""
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class ThemeConfigDTO(BaseModel):
    mode: str = Field("dark", description="Theme mode: light or dark")
    primary_color: str = Field("#0ea5e9", description="Primary brand hex code")
    secondary_color: str = Field("#6366f1", description="Secondary brand hex code")
    accent_color: str = Field("#10b981", description="Accent color hex code")
    font_family: str = Field("Cairo, sans-serif", description="UI font family")
    logo_url: Optional[str] = None


class StoreSettingsDTO(BaseModel):
    display_name: str
    currency: str = Field("EGP", max_length=10)
    business_sector: str = Field("electronics", description="Store sector / niche")
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    governorate: Optional[str] = "القاهرة"
    shipping_zones: Dict[str, Any] = Field(default_factory=dict)
    payment_gateways: Dict[str, Any] = Field(default_factory=dict)


class TenantDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    slug: str
    name: str
    currency: str = "EGP"
    logo_url: Optional[str] = None
    theme_config: Optional[ThemeConfigDTO] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class TenantCreateDTO(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    owner_email: EmailStr
    owner_name: Optional[str] = None
    password: Optional[str] = Field(None, min_length=6)
    phone: Optional[str] = None
    governorate: Optional[str] = "القاهرة"
    category: Optional[str] = "تجارة عامة وإلكترونيات"
    currency: str = Field("EGP", max_length=10)
    theme_mode: str = Field("dark", pattern="^(dark|light)$")


class TenantUpdateDTO(BaseModel):
    name: Optional[str] = None
    currency: Optional[str] = None
    category: Optional[str] = None
    governorate: Optional[str] = None
    phone: Optional[str] = None
