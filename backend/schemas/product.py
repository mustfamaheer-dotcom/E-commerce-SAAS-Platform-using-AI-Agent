# backend/schemas/product.py
"""Catalog Product and Variant DTO schemas."""
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict


class ProductVariantDTO(BaseModel):
    id: Optional[str] = None
    name: str
    sku: str
    price_modifier: float = Field(0.0, description="Price offset relative to base product price")
    stock_qty: int = Field(0, ge=0)
    attributes: Dict[str, Any] = Field(default_factory=dict)


class ProductDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    tenant_id: str
    category_id: Optional[str] = None
    name_ar: str
    name_en: Optional[str] = None
    slug: str
    price: float
    cost_price: float = 0.0
    compare_price: Optional[float] = None
    sku: str
    stock_qty: int = 0
    low_stock_threshold: int = 5
    images: List[str] = Field(default_factory=list)
    attributes: Dict[str, Any] = Field(default_factory=dict)
    is_active: bool = True
    featured: bool = False
    description_ar: Optional[str] = None
    description_en: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ProductCreateDTO(BaseModel):
    name_ar: str = Field(..., min_length=2, max_length=255)
    name_en: Optional[str] = Field(None, max_length=255)
    price: float = Field(..., gt=0, description="Retail selling price in store currency")
    cost_price: float = Field(0.0, ge=0, description="Unit acquisition / manufacturing cost")
    compare_price: Optional[float] = Field(None, ge=0, description="Strikethrough original price")
    category_id: Optional[str] = None
    sku: Optional[str] = Field(None, max_length=100)
    stock_qty: int = Field(20, ge=0)
    low_stock_threshold: int = Field(5, ge=0)
    description_ar: Optional[str] = None
    description_en: Optional[str] = None
    featured: bool = False
    images: List[str] = Field(default_factory=list)
    attributes: Dict[str, Any] = Field(default_factory=dict)
    variants: List[ProductVariantDTO] = Field(default_factory=list)


class ProductUpdateDTO(BaseModel):
    name_ar: Optional[str] = None
    name_en: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    cost_price: Optional[float] = Field(None, ge=0)
    compare_price: Optional[float] = Field(None, ge=0)
    category_id: Optional[str] = None
    stock_qty: Optional[int] = Field(None, ge=0)
    low_stock_threshold: Optional[int] = Field(None, ge=0)
    description_ar: Optional[str] = None
    description_en: Optional[str] = None
    featured: Optional[bool] = None
    is_active: Optional[bool] = None
    images: Optional[List[str]] = None
    attributes: Optional[Dict[str, Any]] = None


class ProductFilterParams(BaseModel):
    category_id: Optional[str] = None
    search: Optional[str] = None
    featured: Optional[bool] = None
    is_active: Optional[bool] = True
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    min_stock: Optional[int] = None
