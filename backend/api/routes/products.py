# backend/api/routes/products.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uuid

from backend.db.database import get_db
from backend.models import Product, Category

router = APIRouter(prefix="/products", tags=["Product Management"])


class ProductCreatePayload(BaseModel):
    name_ar: str
    name_en: Optional[str] = None
    price: float
    cost_price: Optional[float] = 0.0
    compare_price: Optional[float] = None
    category_id: Optional[str] = None
    sku: Optional[str] = None
    stock_qty: Optional[int] = 20
    description_ar: Optional[str] = None
    featured: Optional[bool] = False
    images: Optional[List[str]] = None


class ProductUpdatePayload(BaseModel):
    name_ar: Optional[str] = None
    name_en: Optional[str] = None
    price: Optional[float] = None
    cost_price: Optional[float] = None
    compare_price: Optional[float] = None
    category_id: Optional[str] = None
    stock_qty: Optional[int] = None
    description_ar: Optional[str] = None
    featured: Optional[bool] = None
    images: Optional[List[str]] = None


@router.get("")
def list_products(
    tenant_id: Optional[str] = "tenant-moustafa-tech",
    category_id: Optional[str] = None,
    featured: Optional[bool] = None,
    search: Optional[str] = None,
    limit: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Product).filter_by(is_active=True)
    if tenant_id and tenant_id != "all":
        query = query.filter_by(tenant_id=tenant_id)
    if category_id and category_id not in ("ALL", "all"):
        cat_match = db.query(Category).filter(
            (Category.id == category_id) | (Category.slug == category_id) | (Category.name_ar == category_id) | (Category.name_en == category_id)
        ).first()
        if cat_match:
            query = query.filter(
                (Product.category_id == cat_match.id) | (Product.category_id == cat_match.slug) | (Product.category_id == category_id)
            )
        else:
            query = query.filter(Product.category_id == category_id)
    if featured is not None:
        query = query.filter_by(featured=featured)
    if search:
        query = query.filter(
            (Product.name_ar.ilike(f"%{search}%")) | (Product.sku.ilike(f"%{search}%"))
        )
    if limit:
        query = query.limit(limit)
    products = query.order_by(Product.created_at.desc()).all()
    return [
        {
            "id": p.id,
            "sku": p.sku,
            "name": p.name_ar,
            "nameEn": p.name_en,
            "slug": p.slug,
            "price": p.price,
            "costPrice": p.cost_price,
            "comparePrice": p.compare_price,
            "stock": p.stock_qty,
            "categoryId": p.category_id,
            "featured": p.featured,
            "images": p.images or [],
            "description": p.description_ar,
        }
        for p in products
    ]


@router.post("")
def create_product(
    payload: ProductCreatePayload,
    tenant_id: str = "tenant-moustafa-tech",
    db: Session = Depends(get_db),
):
    sku = payload.sku or f"PRD-{uuid.uuid4().hex[:6].upper()}"
    slug = f"prod-{uuid.uuid4().hex[:8]}"

    prod = Product(
        id=f"prod_{uuid.uuid4().hex[:10]}",
        tenant_id=tenant_id,
        category_id=payload.category_id,
        name_ar=payload.name_ar,
        name_en=payload.name_en or payload.name_ar,
        slug=slug,
        price=payload.price,
        cost_price=payload.cost_price or 0.0,
        compare_price=payload.compare_price or round(payload.price * 1.15, 2),
        sku=sku,
        stock_qty=payload.stock_qty or 20,
        description_ar=payload.description_ar or f"منتج {payload.name_ar} أصلي.",
        featured=payload.featured or False,
        images=payload.images
        or [
            "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&auto=format&fit=crop&q=80"
        ],
        is_active=True,
    )
    db.add(prod)
    db.commit()
    db.refresh(prod)
    return {"status": "success", "message": f"تمت إضافة المنتج '{prod.name_ar}' بنجاح", "id": prod.id}


@router.get("/{product_id}")
def get_product(product_id: str, tenant_id: Optional[str] = "tenant-moustafa-tech", db: Session = Depends(get_db)):
    query = db.query(Product).filter((Product.id == product_id) | (Product.slug == product_id))
    if tenant_id and tenant_id != "all":
        query = query.filter_by(tenant_id=tenant_id)
    prod = query.first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    return {
        "id": prod.id,
        "sku": prod.sku,
        "name": prod.name_ar,
        "nameEn": prod.name_en,
        "slug": prod.slug,
        "price": prod.price,
        "costPrice": prod.cost_price,
        "comparePrice": prod.compare_price,
        "stock": prod.stock_qty,
        "categoryId": prod.category_id,
        "featured": prod.featured,
        "images": prod.images or [],
        "description": prod.description_ar,
    }


@router.put("/{product_id}")
def update_product(
    product_id: str,
    payload: ProductUpdatePayload,
    tenant_id: Optional[str] = "tenant-moustafa-tech",
    db: Session = Depends(get_db),
):
    query = db.query(Product).filter_by(id=product_id)
    if tenant_id and tenant_id != "all":
        query = query.filter_by(tenant_id=tenant_id)
    prod = query.first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    if payload.name_ar is not None:
        prod.name_ar = payload.name_ar
    if payload.price is not None:
        prod.price = payload.price
    if payload.cost_price is not None:
        prod.cost_price = payload.cost_price
    if payload.compare_price is not None:
        prod.compare_price = payload.compare_price
    if payload.stock_qty is not None:
        prod.stock_qty = payload.stock_qty
    if payload.description_ar is not None:
        prod.description_ar = payload.description_ar
    if payload.featured is not None:
        prod.featured = payload.featured
    if payload.images is not None:
        prod.images = payload.images
    if payload.category_id is not None:
        prod.category_id = payload.category_id or None

    db.commit()
    return {"status": "success", "message": f"تم تحديث بيانات '{prod.name_ar}' بنجاح"}


@router.delete("/{product_id}")
def delete_product(product_id: str, tenant_id: Optional[str] = "tenant-moustafa-tech", db: Session = Depends(get_db)):
    query = db.query(Product).filter_by(id=product_id)
    if tenant_id and tenant_id != "all":
        query = query.filter_by(tenant_id=tenant_id)
    prod = query.first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(prod)
    db.commit()
    return {"status": "success", "message": "تم حذف المنتج بنجاح"}
