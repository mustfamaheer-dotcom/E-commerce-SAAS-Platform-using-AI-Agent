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
    image_url: Optional[str] = None,
) -> Dict[str, Any]:
    """Adds a new product to the catalog."""
    db = SessionLocal()
    try:
        if not sku:
            sku = f"PRD-{uuid.uuid4().hex[:6].upper()}"
        slug = f"prod-{uuid.uuid4().hex[:8]}"

        category_id = None
        if category_slug:
            cat = (
                db.query(Category)
                .filter(
                    Category.tenant_id == tenant_id,
                    (Category.id == category_slug)
                    | (Category.slug == category_slug)
                    | (Category.name_ar == category_slug)
                    | (Category.name_en == category_slug),
                )
                .first()
            )
            if cat:
                category_id = cat.id

        if not category_id:
            first_cat = db.query(Category).filter_by(tenant_id=tenant_id, is_active=True).first()
            if first_cat:
                category_id = first_cat.id

        images = [image_url] if image_url else [
            "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&auto=format&fit=crop&q=80"
        ]

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
            images=images,
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
                "categoryId": prod.category_id,
                "images": prod.images,
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


def bulk_update_prices_tool(
    tenant_id: str,
    percent_change: float,
    category_name_or_slug: Optional[str] = None,
) -> Dict[str, Any]:
    """Applies bulk percentage price change (e.g. +10% or -15%) to products"""
    db = SessionLocal()
    try:
        query = db.query(Product).filter_by(tenant_id=tenant_id)
        if category_name_or_slug:
            cat = (
                db.query(Category)
                .filter(
                    Category.tenant_id == tenant_id,
                    (Category.slug == category_name_or_slug) | (Category.name_ar.ilike(f"%{category_name_or_slug}%")),
                )
                .first()
            )
            if cat:
                query = query.filter_by(category_id=cat.id)

        products = query.limit(50).all()
        if not products:
            return {"status": "error", "message": "لم يتم العثور على منتجات لتعديل أسعارها."}

        factor = 1.0 + (percent_change / 100.0)
        items_preview = []
        for p in products:
            old_p = p.price
            new_p = round(old_p * factor, 2)
            p.price = new_p
            items_preview.append({
                "sku": p.sku,
                "name": p.name_ar,
                "oldPrice": old_p,
                "newPrice": new_p,
                "delta": round(new_p - old_p, 2),
            })
        db.commit()

        sign = "+" if percent_change > 0 else ""
        return {
            "status": "success",
            "card_type": "bulk_price_preview",
            "message": f"تم تطبيق تعديل الأسعار ({sign}{percent_change}%) بنجاح على {len(products)} منتج.",
            "payload": {
                "actionId": f"bulk_price_{uuid.uuid4().hex[:6]}",
                "percentChange": percent_change,
                "totalAffected": len(products),
                "items": items_preview[:15],
            },
        }
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


def search_products_tool(tenant_id: str, query: str) -> Dict[str, Any]:
    """Searches products by keyword or SKU"""
    db = SessionLocal()
    try:
        products = (
            db.query(Product)
            .filter(
                Product.tenant_id == tenant_id,
                (Product.name_ar.ilike(f"%{query}%"))
                | (Product.name_en.ilike(f"%{query}%"))
                | (Product.sku.ilike(f"%{query}%")),
            )
            .limit(10)
            .all()
        )
        if not products:
            return {"status": "info", "message": f"لم يتم العثور على أي منتج يطابق '{query}' في الكتالوج."}

        return {
            "status": "success",
            "card_type": "products_list_card",
            "message": f"عثرت على {len(products)} منتجات تطابق بحثك '{query}':",
            "products": [
                {"id": p.id, "name": p.name_ar, "sku": p.sku, "price": p.price, "stock": p.stock_qty}
                for p in products
            ],
        }
    finally:
        db.close()
