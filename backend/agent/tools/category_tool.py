# backend/agent/tools/category_tool.py
from typing import Dict, Any
import uuid
from backend.db.database import SessionLocal
from backend.models import Category

def add_category_tool(tenant_id: str, name_ar: str, slug: str = None) -> Dict[str, Any]:
    db = SessionLocal()
    try:
        if not slug:
            slug = f"cat-{uuid.uuid4().hex[:6]}"
        cat = Category(
            id=f"cat_{uuid.uuid4().hex[:8]}",
            tenant_id=tenant_id,
            name_ar=name_ar,
            name_en=name_ar,
            slug=slug,
            is_active=True,
        )
        db.add(cat)
        db.commit()
        db.refresh(cat)
        return {
            "status": "success",
            "message": f"تم إنشاء القسم '{name_ar}' بنجاح.",
            "category": {"id": cat.id, "name": cat.name_ar, "slug": cat.slug, "isActive": cat.is_active},
        }
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


def list_categories_tool(tenant_id: str) -> Dict[str, Any]:
    db = SessionLocal()
    try:
        categories = db.query(Category).filter_by(tenant_id=tenant_id).all()
        return {
            "status": "success",
            "categories": [{"id": c.id, "name": c.name_ar, "slug": c.slug} for c in categories],
        }
    finally:
        db.close()
