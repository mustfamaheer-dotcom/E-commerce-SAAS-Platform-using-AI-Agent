# backend/agent/tools/coupon_tool.py
from typing import Dict, Any
import uuid
from backend.db.database import SessionLocal
from backend.models import Coupon

def create_coupon_tool(
    tenant_id: str,
    code: str,
    value: float,
    type: str = "percent",
    min_order: float = 0.0,
) -> Dict[str, Any]:
    db = SessionLocal()
    try:
        clean_code = code.upper().strip()
        existing = db.query(Coupon).filter_by(tenant_id=tenant_id, code=clean_code).first()
        if existing:
            return {"status": "error", "message": f"الكوبون {clean_code} موجود بالفعل."}
        
        coup = Coupon(
            id=f"coup_{uuid.uuid4().hex[:8]}",
            tenant_id=tenant_id,
            code=clean_code,
            type=type,
            value=float(value),
            min_order=float(min_order),
            is_active=True,
        )
        db.add(coup)
        db.commit()
        desc = f"{value}%" if type == "percent" else f"{value:,.2f} ج.م"
        return {
            "status": "success",
            "message": f"تم إنشاء الكوبون الترويجي '{clean_code}' بنجاح بقيمة خصم {desc}.",
            "coupon": {"code": clean_code, "value": value, "type": type},
        }
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


def list_coupons_tool(tenant_id: str) -> Dict[str, Any]:
    db = SessionLocal()
    try:
        coupons = db.query(Coupon).filter_by(tenant_id=tenant_id).all()
        return {
            "status": "success",
            "coupons": [
                {
                    "code": c.code,
                    "type": c.type,
                    "value": c.value,
                    "minOrder": c.min_order,
                    "usedCount": c.used_count,
                    "isActive": c.is_active,
                }
                for c in coupons
            ],
        }
    finally:
        db.close()
