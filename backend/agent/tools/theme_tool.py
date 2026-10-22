# backend/agent/tools/theme_tool.py
from typing import Dict, Any, Optional
from backend.db.database import SessionLocal
from backend.models import ThemeConfig

def update_store_theme_tool(
    tenant_id: str,
    primary_color: Optional[str] = None,
    mode: Optional[str] = None,
) -> Dict[str, Any]:
    db = SessionLocal()
    try:
        theme = db.query(ThemeConfig).filter_by(tenant_id=tenant_id).first()
        if not theme:
            theme = ThemeConfig(tenant_id=tenant_id)
            db.add(theme)
        
        if primary_color:
            theme.primary_color = primary_color
        if mode:
            theme.mode = mode.lower()
        
        db.commit()
        return {
            "status": "success",
            "message": f"تم تحديث سمة ومظهر المتجر بنجاح (الوضع: {theme.mode}، اللون: {theme.primary_color}).",
            "theme": {
                "mode": theme.mode,
                "primaryColor": theme.primary_color,
                "secondaryColor": theme.secondary_color,
            },
        }
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()
