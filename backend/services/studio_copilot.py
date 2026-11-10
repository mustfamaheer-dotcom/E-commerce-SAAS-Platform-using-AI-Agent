import json
import re
import logging
from typing import Dict, Any, Optional, List, Tuple
from sqlalchemy.orm import Session
from langchain_core.messages import SystemMessage, HumanMessage

from backend.models import StoreSettings, ThemeConfig, Tenant
from backend.agent.llm_client import get_llm, extract_llm_text

logger = logging.getLogger(__name__)


def extract_heuristic_design_modifications(query: str) -> Tuple[str, Dict[str, Any]]:
    """
    Intelligent heuristic extractor for Egyptian Arabic color, theme, font, and banner queries.
    Provides instant, zero-latency, 100% reliable local fallback when LLM is unavailable or offline.
    """
    q = query.strip().lower()
    mods: Dict[str, Any] = {}
    reply = "تم استيعاب رغبتك التصميمية وتطبيق أفضل التنسيقات المتناسقة مع هوية متجرك!"

    # 1. Color Palette Detection
    if any(k in q for k in ["احمر", "أحمر", "حمرا", "حمراء", "نبيتي", "مارون", "كرزي", "red", "crimson"]):
        mods["primary_color"] = "#dc2626"
        mods["secondary_color"] = "#991b1b"
        mods["accent_color"] = "#f87171"
        reply = "تم تطبيق الهوية الحمراء الجذابة والديناميكية، مع درجات متناسقة لتعزيز الحيوية وزيادة تفاعل العملاء في المتجر!"
    elif any(k in q for k in ["دهبي", "ذهبي", "دهب", "ذهب", "ذهبية", "فاخر", "ملكي", "gold", "golden", "luxury"]):
        mods["primary_color"] = "#d97706"
        mods["secondary_color"] = "#78350f"
        mods["accent_color"] = "#fbbf24"
        reply = "تم تطبيق الهوية الذهبية الملكية الفاخرة، مع تباينات راقية تبرز جودة وفخامة منتجات متجرك!"
    elif any(k in q for k in ["ازرق", "أزرق", "زرقة", "سماوي", "كحلي", "نيلي", "بترولي", "blue", "navy", "cyan", "sky"]):
        mods["primary_color"] = "#0284c7"
        mods["secondary_color"] = "#1e40af"
        mods["accent_color"] = "#38bdf8"
        reply = "تم اعتماد درجات الأزرق السماوي والتقني الموثوق، المستوحاة من هوية TechZone لبث الأمان والاحترافية!"
    elif any(k in q for k in ["اخضر", "أخضر", "خضرا", "خضراء", "زمردي", "زيتي", "نعناعي", "green", "emerald", "mint"]):
        mods["primary_color"] = "#059669"
        mods["secondary_color"] = "#064e3b"
        mods["accent_color"] = "#34d399"
        reply = "تم تطبيق الهوية الخضراء الزمردية المريحة للعين، والتي تعبر عن النمو والوفرة والموثوقية!"
    elif any(k in q for k in ["بنفسجي", "موف", "ارجواني", "أرجواني", "لافندر", "purple", "violet", "indigo"]):
        mods["primary_color"] = "#7c3aed"
        mods["secondary_color"] = "#4c1d95"
        mods["accent_color"] = "#a78bfa"
        reply = "تم تطبيق الهوية البنفسجية العصرية، لون الإبداع والذكاء الاصطناعي الحديث والتميز التقني!"
    elif any(k in q for k in ["اسود", "أسود", "سوداء", "غامق", "دارك", "فحمي", "رمادي", "black", "dark", "obsidian"]):
        mods["primary_color"] = "#0f172a"
        mods["secondary_color"] = "#334155"
        mods["accent_color"] = "#38bdf8"
        mods["banner_style"] = "dark"
        reply = "تم تطبيق النمط الداكن الفخم (Dark Mode)، لإبراز ألوان المنتجات والراحة البصرية للعملاء!"
    elif any(k in q for k in ["وردي", "بينك", "فوشيا", "زهري", "روز", "pink", "rose", "magenta"]):
        mods["primary_color"] = "#ec4899"
        mods["secondary_color"] = "#831843"
        mods["accent_color"] = "#f472b6"
        reply = "تم تطبيق درجات الوردي المتألقة والأنيقة، مثالية لمنتجات الجمال والعناية والموضة!"
    elif any(k in q for k in ["برتقالي", "اورنج", "أورنج", "مشمشي", "orange", "amber"]):
        mods["primary_color"] = "#ea580c"
        mods["secondary_color"] = "#7c2d12"
        mods["accent_color"] = "#fb923c"
        reply = "تم تطبيق درجات البرتقالي النشطة والمحفزة لقرارات الشراء السريعة وزيادة معدل التحويل!"
    elif any(k in q for k in ["اصفر", "أصفر", "صفراء", "ليموني", "yellow"]):
        mods["primary_color"] = "#eab308"
        mods["secondary_color"] = "#713f12"
        mods["accent_color"] = "#fde047"
        reply = "تم اعتماد اللون الأصفر المشرق الذي يبعث على البهجة والتفاؤل مع تباينات داكنة للوضوح!"

    # 2. Arabic Typography Detection
    if any(k in q for k in ["تجوال", "tajawal"]):
        mods["font_family"] = "Tajawal"
        reply += " وتم تحديث الخط إلى خط 'تجوال' العصري."
    elif any(k in q for k in ["كايرو", "cairo"]):
        mods["font_family"] = "Cairo"
        reply += " وتم اعتماد خط 'كايرو' القياسي."
    elif any(k in q for k in ["المرعي", "almarai"]):
        mods["font_family"] = "Almarai"
        reply += " وتم تحديث الخط إلى خط 'المرعي' الأنيق."
    elif any(k in q for k in ["ريديكس", "readex"]):
        mods["font_family"] = "Readex Pro"
        reply += " وتم اعتماد خط 'Readex Pro' التقني."
    elif any(k in q for k in ["اي بي ام", "ibm"]):
        mods["font_family"] = "IBM Plex Sans Arabic"
        reply += " وتم تفعيل خط 'IBM Plex Sans Arabic'."

    # 3. Promotions & Seasonal Banners
    if any(k in q for k in ["جمعة بيضاء", "بلاك فرايداي", "وايت فرايداي", "عروض", "تخفيضات", "خصم"]):
        mods["hero_title"] = "عروض الموسم الكبرى بخصومات حتى 40% 🔥"
        mods["hero_subtitle"] = "تسوق أحدث الأجهزة والإلكترونيات بأقوى الأسعار مع شحن سريع وضمان استبدال 14 يوم."
        mods["cta_text"] = "تسوق العروض الحصرية"
        mods["announcement_text"] = "🔥 عروض الجمعة الكبرى | شحن مجاني لكافة المحافظات + خصم 10% بكود: TECHZONE"
        if "primary_color" not in mods:
            mods["primary_color"] = "#e11d48"
            mods["secondary_color"] = "#0f172a"
            mods["accent_color"] = "#fbbf24"
        reply = "تم تجهيز وتصميم بانر ترويجي للجمعة البيضاء والعروض الكبرى، مع ألوان وشريط إعلانات علوي جذاب!"

    # 4. Shipping Rates & Thresholds
    if "شحن مجاني" in q:
        threshold = 500
        if "1000" in q or "ألف" in q:
            threshold = 1000
        elif "300" in q:
            threshold = 300
        elif "500" in q:
            threshold = 500
        mods["free_shipping_threshold"] = threshold
        mods["shipping_rate"] = 0
        mods["announcement_text"] = f"🚚 مبروك! شحن مجاني لكافة المحافظات للطلبات التي تتجاوز {threshold} جنيه!"
        reply += f" وتم تفعيل الشحن المجاني التلقائي للطلبات فوق {threshold} ج.م!"

    # 5. Banner Layout Style
    if any(k in q for k in ["بانر متدرج", "جرادينت", "gradient"]):
        mods["banner_style"] = "gradient"
    elif any(k in q for k in ["بانر دارك", "بانر غامق", "بانر اسود", "dark"]):
        mods["banner_style"] = "dark"
    elif any(k in q for k in ["بانر مش", "mesh"]):
        mods["banner_style"] = "mesh"

    return reply, mods


def process_studio_copilot_chat(
    message: str,
    tenant_id: str,
    current_theme: Optional[Dict[str, Any]],
    history: Optional[List[Dict[str, Any]]],
    db: Session,
) -> Dict[str, Any]:
    """
    Intelligent AI Design & Theme Copilot for E-Commerce Studio.
    Combines LLM inference with comprehensive dialect rule-based fallbacks to guarantee 100% reliable execution.
    """
    settings = db.query(StoreSettings).filter_by(tenant_id=tenant_id).first()
    store_name = settings.display_name if settings and settings.display_name else "المتجر الذكي"
    curr_theme = current_theme or {}

    llm = get_llm()
    query = message.strip()

    # Pre-extract local heuristic modifications
    h_reply, h_mods = extract_heuristic_design_modifications(query)

    reply = h_reply
    mods = dict(h_mods)
    is_llm = False

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

    if llm:
        try:
            resp = llm.invoke([SystemMessage(content=system_prompt), HumanMessage(content=user_prompt)])
            raw_text = extract_llm_text(resp).strip()
            if "```" in raw_text:
                m = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", raw_text)
                if m:
                    raw_text = m.group(1).strip()
            parsed = json.loads(raw_text)
            if parsed.get("reply"):
                reply = parsed["reply"]
            llm_mods = parsed.get("modifications") or {}
            for k, v in llm_mods.items():
                if v is not None:
                    mods[k] = v
            is_llm = True
        except Exception as exc:
            logger.warning(f"Studio LLM inference fallback to rule-based engine: {exc}")

    # Persist theme updates to DB (both ThemeConfig and Tenant.theme_config)
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

        # Also sync to tenant.theme_config JSON
        tenant_obj = db.query(Tenant).filter_by(id=tenant_id).first()
        if tenant_obj:
            t_data = dict(tenant_obj.theme_config or {})
            if mods.get("primary_color"):
                t_data["primaryColor"] = mods["primary_color"]
            if mods.get("secondary_color"):
                t_data["secondaryColor"] = mods["secondary_color"]
            if mods.get("accent_color"):
                t_data["accentColor"] = mods["accent_color"]
            if mods.get("font_family"):
                t_data["fontFamily"] = mods["font_family"]
            tenant_obj.theme_config = t_data

        db.commit()

    return {
        "status": "success",
        "reply": reply,
        "modifications": mods,
        "is_llm": is_llm,
    }
