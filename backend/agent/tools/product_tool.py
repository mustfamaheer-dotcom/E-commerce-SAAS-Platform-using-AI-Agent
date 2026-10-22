# backend/agent/tools/product_tool.py
from typing import Dict, Any, List, Optional
import uuid
from backend.db.database import SessionLocal
from backend.models import Product, Category

def add_product_tool(
    tenant_id: str,
    name_ar: str,
    price: float,
    sku: Optional[str] = None,
    cost_price: Optional[float] = 0.0,
    category_slug: Optional[str] = None,
    stock_qty: int = 20,
    description_ar: Optional[str] = None,
) -> Dict[str, Any]:
    """Adds a new product to the catalog."""
    db = SessionLocal()
    try:
        if not sku:
            sku = f"PRD-{uuid.uuid4().hex[:6].upper()}"
        slug = f"prod-{uuid.uuid4().hex[:8]}"

        category_id = None
        if category_slug:
            cat = db.query(Category).filter_by(tenant_id=tenant_id, slug=category_slug).first()
            if cat:
                category_id = cat.id

        prod = Product(
            id=f"prod_{uuid.uuid4().hex[:10]}",
            tenant_id=tenant_id,
            category_id=category_id,
            name_ar=name_ar,
            name_en=name_ar,
            slug=slug,
            price=float(price),
            cost_price=float(cost_price or 0.0),
            compare_price=round(float(price) * 1.15, 2),
            sku=sku,
            stock_qty=stock_qty,
            description_ar=description_ar or f"منتج {name_ar} أصلي ومضمون مع شحن سريع.",
            images=[
                "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&auto=format&fit=crop&q=80"
            ],
            attributes={},
            is_active=True,
            featured=True,
        )
        db.add(prod)
        db.commit()
        db.refresh(prod)
        return {
            "status": "success",
            "message": f"تمت إضافة المنتج '{name_ar}' بنجاح بسعر {price:,.2f} ج.م",
            "product": {
                "id": prod.id,
                "name": prod.name_ar,
                "price": prod.price,
                "sku": prod.sku,
                "stock": prod.stock_qty,
            },
        }
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": f"فشل إضافة المنتج: {str(e)}"}
    finally:
        db.close()


def update_product_price_tool(
    tenant_id: str,
    sku_or_name: str,
    new_price: float,
) -> Dict[str, Any]:
    """Updates product price in the catalog."""
    db = SessionLocal()
    try:
        prod = (
            db.query(Product)
            .filter(
                Product.tenant_id == tenant_id,
                (Product.sku == sku_or_name) | (Product.name_ar.ilike(f"%{sku_or_name}%")),
            )
            .first()
        )
        if not prod:
            return {"status": "error", "message": f"المنتج '{sku_or_name}' غير موجود في الكتالوج."}

        old_price = prod.price
        prod.price = float(new_price)
        db.commit()
        return {
            "status": "success",
            "message": f"تم تحديث سعر '{prod.name_ar}' من {old_price:,.2f} ج.م إلى {new_price:,.2f} ج.م بنجاح.",
            "product": {"sku": prod.sku, "name": prod.name_ar, "price": prod.price},
        }
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


def list_products_tool(tenant_id: str, limit: int = 15) -> Dict[str, Any]:
    """Lists current catalog products with rich Egyptian Arabic formatting."""
    db = SessionLocal()
    try:
        products = db.query(Product).filter_by(tenant_id=tenant_id).limit(limit).all()
        count = len(products)
        if count == 0:
            msg = "كتالوج متجرك لسه فاضي ومفيهوش أي منتجات حالياً. تقدر تقولي 'عايز اضيف منتج جديد' ونبدأ نضيف أول منتج مع بعض! 🚀"
        else:
            lines = [
                f"كتالوج المتجر عندك فيه حالياً {count} منتجات نشطة وجاهزة للبيع 🛒:\n"
            ]
            for idx, p in enumerate(products, 1):
                stock_label = f"{p.stock_qty} قطعة بالمخزن" if p.stock_qty > 0 else "نفد من المخزن ⚠️"
                lines.append(
                    f"{idx}. 📦 **{p.name_ar}**\n"
                    f"   • السعر: **{p.price:,.2f} ج.م**\n"
                    f"   • كود المنتج (SKU): `{p.sku}`\n"
                    f"   • حالة المخزون: {stock_label}"
                )
            lines.append("\nتقدر تطلب مني تعديل سعر أي منتج، زيادة مخزونه، أو إضافة منتج جديد في أي وقت! ✨")
            msg = "\n".join(lines)

        return {
            "status": "success",
            "message": msg,
            "count": count,
            "products": [
                {
                    "id": p.id,
                    "name": p.name_ar,
                    "sku": p.sku,
                    "price": p.price,
                    "stock": p.stock_qty,
                    "featured": p.featured,
                }
                for p in products
            ],
        }
    finally:
        db.close()
