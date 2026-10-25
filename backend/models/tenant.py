# backend/models/tenant.py
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, JSON, ForeignKey
from backend.db.database import Base

class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(String(64), primary_key=True, index=True)
    slug = Column(String(128), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    logo_url = Column(Text, nullable=True)
    currency = Column(String(10), default="EGP")
    theme_config = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class StoreSettings(Base):
    __tablename__ = "store_settings"

    tenant_id = Column(String(64), ForeignKey("tenants.id", ondelete="CASCADE"), primary_key=True)
    display_name = Column(String(255), nullable=False)
    currency = Column(String(10), default="EGP")
    business_sector = Column(String(100), default="electronics")
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    governorate = Column(String(100), default="القاهرة", nullable=True)
    shipping_zones = Column(JSON, default=dict)
    payment_gateways = Column(JSON, default=dict)
    social_links = Column(JSON, default=dict)
    bosta_api_key = Column(String(255), nullable=True)
    paymob_api_key = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ThemeConfig(Base):
    __tablename__ = "theme_config"

    tenant_id = Column(String(64), ForeignKey("tenants.id", ondelete="CASCADE"), primary_key=True)
    mode = Column(String(10), default="dark")
    primary_color = Column(String(32), default="#0ea5e9")
    secondary_color = Column(String(32), default="#6366f1")
    accent_color = Column(String(32), default="#10b981")
    background_dark = Column(String(32), default="#020617")
    background_light = Column(String(32), default="#f8fafc")
    logo_url = Column(Text, nullable=True)
    font_family = Column(String(100), default="Cairo, sans-serif")
    generated_at = Column(DateTime, default=datetime.utcnow)
