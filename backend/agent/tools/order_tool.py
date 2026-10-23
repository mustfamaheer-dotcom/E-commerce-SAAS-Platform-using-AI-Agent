# backend/agent/tools/order_tool.py
from typing import Dict, Any, Optional, List
from backend.db.database import SessionLocal
from backend.models import Order

def list_orders_tool(tenant_id: str, status: Optional[str] = None) -> Dict[str, Any]:
    db = SessionLocal()
    try:
        q = db.query(Order).filter_by(tenant_id=tenant_id)
        if status:
            q = q.filter_by(status=status.upper())
        orders = q.order_by(Order.created_at.desc()).limit(15).all()

        if len(orders) == 0:
            msg = "لا توجد أي طلبات شراء مسجلة في متجرك حالياً. بمجرد أن يطلب عملاؤك ستظهر الطلبات وتفاصيل الشحن هنا فوراً! 🛒"
        else:
            msg = f"لديك حالياً {len(orders)} طلبات شراء مسجلة في متجرك."

        return {
            "status": "success",
            "card_type": "orders_card",
            "message": msg,
            "count": len(orders),
            "orders": [
                {
                    "id": o.id,
                    "status": o.status,
                    "total": o.total,
                    "payment_method": o.payment_method,
                    "payment_status": o.payment_status,
                    "tracking": o.bosta_tracking_number,
                    "created_at": o.created_at.strftime("%Y-%m-%d %H:%M") if o.created_at else "",
                }
                for o in orders
            ],
        }
    finally:
        db.close()


def update_order_status_tool(tenant_id: str, order_id: str, new_status: str) -> Dict[str, Any]:
    db = SessionLocal()
    try:
        order = db.query(Order).filter_by(tenant_id=tenant_id, id=order_id).first()
        if not order:
            return {"status": "error", "message": f"الطلب رقم '{order_id}' غير موجود في متجرك."}
        old_status = order.status
        order.status = new_status.upper()
        db.commit()
        return {
            "status": "success",
            "card_type": "orders_card",
            "message": f"تم تحديث حالة الطلب {order_id} من {old_status} إلى {new_status.upper()} بنجاح.",
        }
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


def bulk_update_order_status_tool(tenant_id: str, order_ids: List[str], new_status: str) -> Dict[str, Any]:
    """Updates status of multiple orders at once (e.g. mark shipped)"""
    db = SessionLocal()
    try:
        updated = []
        for oid in order_ids:
            clean_id = str(oid).strip()
            o = db.query(Order).filter_by(tenant_id=tenant_id, id=clean_id).first()
            if o:
                o.status = new_status.upper()
                updated.append(clean_id)
        db.commit()
        return {
            "status": "success",
            "card_type": "orders_card",
            "message": f"تم تحديث حالة {len(updated)} طلبات إلى '{new_status.upper()}' بنجاح.",
            "updatedCount": len(updated),
            "orderIds": updated,
        }
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()
