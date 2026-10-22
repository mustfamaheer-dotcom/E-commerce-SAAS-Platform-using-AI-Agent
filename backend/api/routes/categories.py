# backend/api/routes/categories.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import uuid

from backend.db.database import get_db
from backend.models import Category

router = APIRouter(prefix="/categories", tags=["Categories Management"])


class CategoryCreatePayload(BaseModel):
    name_ar: str
    name_en: Optional[str] = None
    slug: Optional[str] = None
    image_url: Optional[str] = None


@router.get("")
def list_categories(tenant_id: Optional[str] = "tenant-moustafa-tech", db: Session = Depends(get_db)):
    query = db.query(Category).filter_by(is_active=True)
    if tenant_id and tenant_id != "all":
        query = query.filter_by(tenant_id=tenant_id)
    categories = query.order_by(Category.name_ar.asc()).all()
    return [
        {
            "id": c.id,
            "name": c.name_ar,
            "nameEn": c.name_en,
            "slug": c.slug,
            "imageUrl": c.image_url,
        }
        for c in categories
    ]


@router.post("")
def create_category(payload: CategoryCreatePayload, tenant_id: str = "tenant-moustafa-tech", db: Session = Depends(get_db)):
    slug = payload.slug or f"cat-{uuid.uuid4().hex[:6]}"
    cat = Category(
        id=f"cat_{uuid.uuid4().hex[:8]}",
        tenant_id=tenant_id,
        name_ar=payload.name_ar,
        name_en=payload.name_en or payload.name_ar,
        slug=slug,
        image_url=payload.image_url,
        is_active=True,
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return {"status": "success", "message": f"تم إنشاء القسم '{cat.name_ar}' بنجاح", "id": cat.id}


@router.delete("/{category_id}")
def delete_category(category_id: str, tenant_id: Optional[str] = "tenant-moustafa-tech", db: Session = Depends(get_db)):
    query = db.query(Category).filter_by(id=category_id)
    if tenant_id and tenant_id != "all":
        query = query.filter_by(tenant_id=tenant_id)
    cat = query.first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(cat)
    db.commit()
    return {"status": "success", "message": "تم حذف القسم بنجاح"}
