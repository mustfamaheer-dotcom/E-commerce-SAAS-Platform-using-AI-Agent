import json
import re
import logging
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from langchain_core.messages import SystemMessage, HumanMessage

from backend.models import StoreSettings, ThemeConfig
from backend.agent.llm_client import get_llm, extract_llm_text

logger = logging.getLogger(__name__)


def process_studio_copilot_chat(
    message: str,
    tenant_id: str,
    current_theme: Optional[Dict[str, Any]],
    history: Optional[List[Dict[str, Any]]],
    db: Session,
) -> Dict[str, Any]:
    """
    Intelligent AI Design & Theme Copilot for E-Commerce Studio powered by Google Gemini.
    Generates dynamic brand philosophy, marketing copy, and structured UI/theme modifications.
    """
    settings = db.query(StoreSettings).filter_by(tenant_id=tenant_id).first()
    store_name = settings.display_name if settings and settings.display_name else "المتجر الذكي"
    curr_theme = current_theme or {}

    llm = get_llm()
    query = message.strip()

    system_prompt = (
        f"أنت كبير مصممي واجهات المتاجر الإلكترونية (Lead E-Commerce UI/UX Designer) وخبير الهوية البصرية والتسويق لمتجر '{store_name}'.\n"
        "المطلوب منك تحليل رغبة التاجر أو صاحب المتجر بدقة واقتراح التعديلات المثالية لواجهة متجره.\n\n"
        "عليك إرجاع النتيجة بتنسيق JSON حصراً (Valid JSON فقط بدون أي علامات markdown حول الـ json أو مع ```json) يحتوي على الحقول التالية:\n"
        "{\n"
        '  "reply": "شرح موجز وذكي بلهجة مصرية مهذبة واحترافية للتعديلات وفلسفة الألوان أو المحتوى التسويقي المختار (جملة أو جملتين فقط)",\n'
        '  "modifications": {\n'
        '    "primary_color": "#HEX (أو null إذا لم يتطلب تغيير)",\n'
        '    "secondary_color": "#HEX (أو null إذا لم يتطلب تغيير)",\n'
        '    "accent_color": "#HEX (أو null إذا لم يتطلب تغيير)",\n'
        '    "font_family": "(Cairo أو Tajawal أو IBM Plex Sans Arabic أو Readex Pro أو Almarai أو null)",\n'
        '    "hero_title": "عنوان بانر تسويقي جذاب أو null",\n'
        '    "hero_subtitle": "وصف تسويقي مقنع للبانر أو null",\n'
        '    "cta_text": "نص زر الشراء للبانر أو null",\n'
        '    "announcement_text": "نص شريط الإعلانات العلوي أو null",\n'
        '    "free_shipping_threshold": (رقم مثل 500 أو 1000 أو null),\n'
        '    "shipping_rate": (رقم مثل 0 أو 45 أو null),\n'
        '    "banner_style": "(gradient أو dark أو mesh أو null)"\n'
        "  }\n"
        "}\n"
    )

    history_text = ""
    if history:
        for h in history[-4:]:
            snd = "التاجر" if h.get("sender") == "user" else "المصمم"
            history_text += f"{snd}: {h.get('text', '')}\n"

    user_prompt = (
        f"سياق المتجر الحالي:\n"
        f"- اللون الأساسي: {curr_theme.get('primary_color', '#0ea5e9')}\n"
        f"- الخط: {curr_theme.get('font_family', 'Cairo')}\n"
        f"- العنوان الحالي: {curr_theme.get('hero_title', '')}\n\n"
        f"المحادثة السابقة:\n{history_text}\n"
        f"طلب التاجر الجديد: '{query}'\n\n"
        "أخرج الـ JSON المطلوب الآن:"
    )

    default_res = {
        "reply": "تم استيعاب رغبتك التصميمية وتطبيق أفضل التنسيقات المتناسقة مع هوية متجرك!",
        "modifications": {},
    }

    if llm:
        try:
            resp = llm.invoke([SystemMessage(content=system_prompt), HumanMessage(content=user_prompt)])
            raw_text = extract_llm_text(resp).strip()
            if "```" in raw_text:
                m = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", raw_text)
                if m:
                    raw_text = m.group(1).strip()
            parsed = json.loads(raw_text)
            reply = parsed.get("reply") or default_res["reply"]
            mods = parsed.get("modifications") or {}

            # Persist theme updates if present
            if any(k in mods and mods[k] for k in ["primary_color", "secondary_color", "accent_color", "font_family"]):
                t_cfg = db.query(ThemeConfig).filter_by(tenant_id=tenant_id).first()
                if not t_cfg:
                    t_cfg = ThemeConfig(tenant_id=tenant_id)
                    db.add(t_cfg)
                if mods.get("primary_color"):
                    t_cfg.primary_color = mods["primary_color"]
                if mods.get("secondary_color"):
                    t_cfg.secondary_color = mods["secondary_color"]
                if mods.get("accent_color"):
                    t_cfg.accent_color = mods["accent_color"]
                if mods.get("font_family"):
                    t_cfg.font_family = mods["font_family"]
                db.commit()

            return {
                "status": "success",
                "reply": reply,
                "modifications": mods,
                "model": getattr(llm, "model_name", getattr(llm, "model", "gemini-flash-lite-latest")),
                "is_llm": True,
            }
        except Exception as exc:
            logger.warning(f"Studio LLM inference failed: {exc}")

    return {
        "status": "success",
        "reply": default_res["reply"],
        "modifications": {},
        "is_llm": False,
    }
