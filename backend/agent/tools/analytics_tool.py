# backend/agent/tools/analytics_tool.py
from typing import Dict, Any
from sqlalchemy import func
from backend.db.database import SessionLocal
from backend.models import Order, Product, Customer

def get_analytics_summary_tool(tenant_id: str) -> Dict[str, Any]:
    db = SessionLocal()
    try:
        total_revenue = db.query(func.sum(Order.total)).filter_by(tenant_id=tenant_id).scalar() or 0.0
        total_orders = db.query(Order).filter_by(tenant_id=tenant_id).count()
        total_products = db.query(Product).filter_by(tenant_id=tenant_id).count()
        total_customers = db.query(Customer).filter_by(tenant_id=tenant_id).count()
        aov = round(total_revenue / max(1, total_orders), 2)

        if total_orders == 0:
            summary_msg = f"متجرك لسه جديد! إجمالي الإيرادات حالياً: 0 ج.م، وعدد المنتجات: {total_products} منتج. في انتظار أول عملية شراء لتبدأ مؤشرات النمو والأرباح في الظهور! 📈"
        else:
            summary_msg = f"إجمالي الإيرادات حتى الآن: {total_revenue:,.2f} ج.م عبر {total_orders} طلب بمعدل {aov:,.2f} ج.م لكل طلب."

        return {
            "status": "success",
            "message": summary_msg,
            "kpis": {
                "totalRevenue": round(total_revenue, 2),
                "totalOrders": total_orders,
                "totalProducts": total_products,
                "totalCustomers": total_customers,
                "averageOrderValue": aov,
            },
            "recentOrdersSummary": summary_msg,
        }
    finally:
        db.close()


def get_top_products_tool(tenant_id: str) -> Dict[str, Any]:
    db = SessionLocal()
    try:
        products = db.query(Product).filter_by(tenant_id=tenant_id).order_by(Product.price.desc()).limit(5).all()
        return {
            "status": "success",
            "topProducts": [
                {"name": p.name_ar, "sku": p.sku, "price": p.price, "stock": p.stock_qty}
                for p in products
            ],
        }
    finally:
        db.close()
