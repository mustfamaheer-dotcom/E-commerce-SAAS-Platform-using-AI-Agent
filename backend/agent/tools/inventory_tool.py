# backend/agent/tools/inventory_tool.py
from typing import Dict, Any
from backend.db.database import SessionLocal
from backend.models import Product

def get_inventory_alerts_tool(tenant_id: str) -> Dict[str, Any]:
    db = SessionLocal()
    try:
        products = db.query(Product).filter_by(tenant_id=tenant_id).all()
        low_stock_items = []
        for p in products:
            if p.stock_qty <= (p.low_stock_threshold or 5):
                daily_profit_at_risk = round(max(0, p.price - (p.cost_price or 0)) * 2.5, 2)
                low_stock_items.append({
                    "sku": p.sku,
                    "productName": p.name_ar,
                    "currentStock": p.stock_qty,
                    "threshold": p.low_stock_threshold or 5,
                    "daysUntilStockout": max(1, p.stock_qty // 2),
                    "dailyProfitAtRisk": daily_profit_at_risk,
                    "recommendedReorderQty": max(20, (p.low_stock_threshold or 5) * 4),
                })

        if len(products) == 0:
            msg = "كتالوج متجرك لسه جديد ومفيهوش منتجات. تقدر تقولي 'ضيف منتج جديد' ونبدأ نضيف البضاعة في المخزن! 📦"
        elif len(low_stock_items) == 0:
            msg = f"مخزون متجرك تمام ومفيش أي نواقص! كل الـ {len(products)} منتجات متوفرة بكميات آمنة. ✨"
        else:
            msg = f"يوجد {len(low_stock_items)} منتجات اقتربت من النفاد في مخزن متجرك وبحاجة لإعادة طلب."

        return {
            "status": "success",
            "message": msg,
            "totalAlerts": len(low_stock_items),
            "alerts": low_stock_items,
        }
    finally:
        db.close()


def adjust_stock_tool(tenant_id: str, sku: str, quantity: int) -> Dict[str, Any]:
    db = SessionLocal()
    try:
        prod = db.query(Product).filter_by(tenant_id=tenant_id, sku=sku).first()
        if not prod:
            return {"status": "error", "message": f"المنتج ذو الرمز {sku} غير موجود في متجرك."}
        prod.stock_qty = max(0, prod.stock_qty + quantity)
        db.commit()
        return {
            "status": "success",
            "message": f"تم تعديل مخزون '{prod.name_ar}' ليصبح {prod.stock_qty} قطعة.",
            "current_stock": prod.stock_qty,
        }
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()
