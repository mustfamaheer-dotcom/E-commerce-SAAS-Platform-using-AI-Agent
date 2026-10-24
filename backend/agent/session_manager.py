# backend/agent/session_manager.py
import re
from typing import List, Dict, Any, Optional
from backend.agent.llm_client import get_llm, extract_llm_text
from backend.db.database import SessionLocal
from backend.models import AgentSession, AgentMessage

async def auto_title_session(session_id: str, first_message: str, tenant_id: str) -> str:
    """Auto-generate a 3-5 word Arabic title for the session"""
    clean_text = first_message.strip()
    if not clean_text:
        return "محادثة جديدة"

    title = clean_text[:30]
    llm = get_llm()
    if llm:
        try:
            prompt = (
                f"أنت نظام إدارة متجر. بناءً على الرسالة الأولى من التاجر: '{clean_text}'\n"
                "اكتب عنواناً مختصراً جداً من 2 إلى 4 كلمات فقط باللغة العربية يلخص موضوع المحادثة بدون علامات تنصيص."
            )
            res = await llm.ainvoke(prompt)
            candidate = extract_llm_text(res).replace('"', '').replace("'", "")
            if len(candidate) > 2 and len(candidate) <= 40:
                title = candidate
        except Exception:
            pass

    # Update in DB
    try:
        db = SessionLocal()
        sess = db.query(AgentSession).filter_by(id=session_id).first()
        if sess:
            sess.title = title
            db.commit()
        db.close()
    except Exception:
        pass

    return title

def extract_context_slots(history: List[Any]) -> Dict[str, Any]:
    """Extract context like last mentioned product, last action from recent messages"""
    slots: Dict[str, Any] = {
        "last_product": None,
        "last_intent": None,
    }
    for m in reversed(history):
        content = getattr(m, "content", "")
        if not content:
            continue
        # Look for product names
        prod_m = re.search(r"(?:سماعة|ماوس|كيبورد|شاحن|موبايل|لابتوب|سبيكر|شاشة)\s*[\w\u0600-\u06FF]+", content)
        if prod_m and not slots["last_product"]:
            slots["last_product"] = prod_m.group(0).strip()
    return slots
