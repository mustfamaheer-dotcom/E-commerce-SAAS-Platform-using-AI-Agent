# backend/models/product.py
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey, JSON, Index
from backend.db.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(String(64), primary_key=True, index=True)
    tenant_id = Column(String(64), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(String(64), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)
    name_ar = Column(String(255), nullable=False)
    name_en = Column(String(255), nullable=True)
    slug = Column(String(255), nullable=False, index=True)
    description_ar = Column(Text, nullable=True)
    description_en = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    cost_price = Column(Float, default=0.0)
    compare_price = Column(Float, nullable=True)
    sku = Column(String(100), nullable=False, index=True)
    stock_qty = Column(Integer, default=0)
    low_stock_threshold = Column(Integer, default=5)
    images = Column(JSON, default=list)
    attributes = Column(JSON, default=dict)
    is_active = Column(Boolean, default=True)
    featured = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("idx_products_tenant_active", "tenant_id", "is_active"),
        Index("idx_products_tenant_cat", "tenant_id", "category_id"),
    )


class ProductVariant(Base):
    __tablename__ = "product_variants"

    id = Column(String(64), primary_key=True, index=True)
    product_id = Column(String(64), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    sku = Column(String(100), nullable=False)
    price_modifier = Column(Float, default=0.0)
    stock_qty = Column(Integer, default=0)
    attributes = Column(JSON, default=dict)
