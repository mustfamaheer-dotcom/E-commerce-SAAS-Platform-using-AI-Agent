# backend/models/category.py
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, Text, DateTime, ForeignKey
from backend.db.database import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(String(64), primary_key=True, index=True)
    tenant_id = Column(String(64), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    name_ar = Column(String(255), nullable=False)
    name_en = Column(String(255), nullable=True)
    slug = Column(String(255), nullable=False, index=True)
    parent_id = Column(String(64), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    image_url = Column(Text, nullable=True)
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
