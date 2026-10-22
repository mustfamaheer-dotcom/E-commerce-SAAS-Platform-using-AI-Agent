# backend/agent/tools/store_tool.py
from typing import Dict, Any, Optional
from backend.db.database import SessionLocal
from backend.models import StoreSettings, Tenant

def update_store_settings_tool(
    tenant_id: str,
    display_name: Optional[str] = None,
    shipping_default_rate: Optional[float] = None,
) -> Dict[str, Any]:
    db = SessionLocal()
    try:
        st = db.query(StoreSettings).filter_by(tenant_id=tenant_id).first()
        if not st:
            st = StoreSettings(tenant_id=tenant_id, display_name="My Store")
            db.add(st)
        
        if display_name:
            st.display_name = display_name
            tenant = db.query(Tenant).filter_by(id=tenant_id).first()
            if tenant:
                tenant.name = display_name

        if shipping_default_rate is not None:
            zones = dict(st.shipping_zones or {})
            zones["default_rate"] = float(shipping_default_rate)
            st.shipping_zones = zones

        db.commit()
        return {
            "status": "success",
            "message": f"تم تحديث إعدادات المتجر بنجاح.",
            "settings": {
                "displayName": st.display_name,
                "shippingZones": st.shipping_zones,
            },
        }
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()
