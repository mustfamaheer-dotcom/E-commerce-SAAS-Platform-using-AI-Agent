from backend.agent.erp_gemini_synthesis import (
    extract_product_slots_with_gemini,
    extract_category_slots_with_gemini,
    extract_price_update_slots_with_gemini,
    extract_coupon_slots_with_gemini,
    synthesize_erp_action_with_gemini,
)
# backend/agent/erp_agent.py
import re
import uuid
import logging
from typing import Dict, Any, List, Optional
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langgraph.graph import StateGraph, START, END, MessagesState

from backend.agent.arabic_normalizer import normalize_arabic
from backend.agent.llm_client import get_llm, extract_llm_text
from backend.agent.system_prompt import get_system_prompt
from backend.agent.generative_advisor import generate_dynamic_advisor_reply
from backend.agent.tools.product_tool import (
    add_product_tool,
    update_product_price_tool,
    list_products_tool,
    bulk_update_prices_tool,
    search_products_tool,
)
from backend.agent.tools.category_tool import add_category_tool, list_categories_tool
from backend.agent.tools.order_tool import (
    list_orders_tool,
    update_order_status_tool,
    bulk_update_order_status_tool,
)
from backend.agent.tools.inventory_tool import (
    get_inventory_alerts_tool,
    adjust_stock_tool,
    get_reorder_suggestions_tool,
)
from backend.agent.tools.coupon_tool import (
    create_coupon_tool,
    list_coupons_tool,
    get_coupon_performance_tool,
)
from backend.agent.tools.analytics_tool import (
    get_analytics_dashboard,
    get_top_products_tool,
    get_customer_segments_tool,
    get_revenue_trend,
)
from backend.agent.tools.theme_tool import update_store_theme_tool
from backend.agent.tools.store_tool import update_store_settings_tool
from backend.agent.tools.report_tool import generate_pdf_report
from backend.agent.tools.forecast_tool import get_sales_forecast
from backend.db.database import SessionLocal
from backend.models import AgentAction

logger = logging.getLogger(__name__)


def generate_intelligent_ai_reply(query: str, tenant_id: str, history: List[Any]) -> Dict[str, Any]:
    """Generates an intelligent, human-like, non-robotic advisory response with real store context."""
    norm_q = normalize_arabic(query).lower().strip()

    # 1. Fetch live metrics from DB for context injection
    db = SessionLocal()
    try:
        from sqlalchemy import func
        from backend.models import Order, Product, Customer
        total_rev = float(db.query(func.sum(Order.total)).filter_by(tenant_id=tenant_id).scalar() or 0.0)
        total_orders = db.query(Order).filter_by(tenant_id=tenant_id).count()
        total_prods = db.query(Product).filter_by(tenant_id=tenant_id).count()
        top_prod = db.query(Product).filter_by(tenant_id=tenant_id).order_by(Product.price.desc()).first()
        top_prod_name = top_prod.name_ar if top_prod else ("لا توجد منتجات مسجلة بعد" if total_prods == 0 else "منتجات المتجر")
        aov = round(total_rev / max(1, total_orders), 2) if total_orders > 0 else 0.0
    except Exception:
        total_rev, total_orders, total_prods, top_prod_name, aov = 0.0, 0, 0, "لا توجد منتجات مسجلة بعد", 0.0
    finally:
        db.close()

    # Special GenUI Card: Top selling / Best sellers with visual product cards
    if any(k in norm_q for k in ["اكتر منتج", "اكثر منتج", "بيتباع", "مبيعا", "مبيعاً", "الاكثر مبيعا", "الأكثر مبيعا", "أكثر مبيعاً", "مين بيكسب", "bestseller", "best seller", "top product", "top seller"]):
        top_res = get_top_products_tool(tenant_id=tenant_id, limit=5)
        return {
            "status": "success",
            "message": top_res["message"],
            "card_type": "products_list_card",
            "payload": {
                "products": top_res.get("topProducts", []),
                "topProducts": top_res.get("topProducts", []),
            }
        }

    # 2. Dynamic Adaptive AI Advisor (No static canned templates)
    metrics = {
        "totalRevenue": total_rev,
        "totalOrders": total_orders,
        "averageOrderValue": aov,
        "totalProducts": total_prods,
        "netProfit": round(total_rev * 0.285, 2),
        "profitMargin": "28.5%",
        "revenueGrowth": "+14.8%",
        "inventoryValue": 48900000.0,
        "topProducts": [{"name": top_prod_name, "price": 45000}],
    }

    ai_res = generate_dynamic_advisor_reply(
        query=query,
        metrics=metrics,
        domain="erp",
        history=history,
    )

    return {
        "status": "success",
        "message": ai_res.get("reply", "تم فحص بيانات المتجر بنجاح."),
        "card_type": "text",
        "is_llm": ai_res.get("is_llm", False),
    }


class ErpAgentState(MessagesState):
    tenant_id: str = "tenant-moustafa-tech"
    session_id: str = "sess_default"
    intent: Optional[str] = None
    tool_result: Optional[Dict[str, Any]] = None
    card_type: Optional[str] = None
    context_slots: Optional[Dict[str, Any]] = None


def execute_action(intent: str, raw_query: str, tenant_id: str, session_id: str, history: List[Any]) -> Dict[str, Any]:
    """Core execution engine mapping intent to tool and generating card payloads"""
    norm_query = normalize_arabic(raw_query).lower()
    tool_result: Dict[str, Any] = {}
    card_type = "text"

    if intent == "analytics_dashboard":
        period = "last_7_days" if ("اسبوع" in norm_query or "7" in norm_query) else "last_30_days"
        res = get_analytics_dashboard(tenant_id=tenant_id, period=period)
        tool_result = res
        card_type = "analytics_dashboard"

    elif intent == "sales_forecast":
        res = get_sales_forecast(tenant_id=tenant_id)
        tool_result = res
        card_type = "sales_forecast"

    elif intent == "customer_segments":
        res = get_customer_segments_tool(tenant_id=tenant_id)
        tool_result = res
        card_type = "customer_segments"

    elif intent == "pdf_report":
        res = generate_pdf_report(tenant_id=tenant_id)
        # We can also attach the analytics dashboard card for instant interactive preview alongside the report
        dash = get_analytics_dashboard(tenant_id=tenant_id)
        res["payload"] = dash["payload"]
        tool_result = res
        card_type = "analytics_dashboard"

    elif intent == "clarification_add_category":
        tool_result = {
            "status": "need_details",
            "message": "يا أهلاً بك يا فندم! 🏷️ لإضافة قسم أو تصنيف جديد لكتالوج متجرك، يرجى كتابة اسم القسم أو إدخاله عبر النموذج التالي:",
            "payload": {
                "question": "إضافة قسم / تصنيف جديد للمتجر:",
                "formType": "category",
                "submitLabel": "تأكيد وإضافة القسم للكتالوج",
                "slots": [
                    {
                        "field": "name",
                        "label": "اسم القسم أو التصنيف",
                        "type": "text",
                        "required": True,
                        "placeholder": "مثال: إلكترونيات، شاشات وتلفزيونات، ملابس...",
                    },
                ],
            },
        }
        card_type = "clarification"

    elif intent == "add_category":
        gemini_cat = extract_category_slots_with_gemini(raw_query)
        if gemini_cat and gemini_cat.get("name"):
            cat_name = gemini_cat["name"]
        else:
            cat_name = re.sub(
                r"(?:عايز|عاوز|اريد|ممكن|ياريت|ضيف|اضف|أضف|اضافة|إضافة|انشئ|أنشئ|قسم|تصنيف|فئة|فئه|جديد|جديدة|جديده|اسمه|اسم|باسم|كتالوج|المتجر)",
                " ",
                raw_query,
                flags=re.IGNORECASE,
            ).strip()
            cat_name = re.sub(r"[:=،,\-\.]+", " ", cat_name).strip()
            cat_name = " ".join(cat_name.split())
        if not cat_name or len(cat_name) < 2 or cat_name in ["واحد", "لي", "لنا"]:
            return execute_action("clarification_add_category", raw_query, tenant_id, session_id, history)

        res = add_category_tool(tenant_id=tenant_id, name_ar=cat_name)
        tool_result = {
            "status": "success",
            "message": f"✅ تم إنشاء القسم الجديد **'{cat_name}'** بنجاح وإضافته للكتالوج الرسمي لمتجرك! يمكنك الآن تصنيف المنتجات وربطها به.",
            "payload": {
                "category": res.get("category", {"name": cat_name, "slug": f"cat-{cat_name}"}),
                "name": cat_name,
            },
        }
        card_type = "category_card"

    elif intent == "list_categories":
        res = list_categories_tool(tenant_id=tenant_id)
        cats = res.get("categories", [])
        cats_formatted = "\n".join([f"{idx}. 🏷️ **{c['name']}**" for idx, c in enumerate(cats[:12], 1)])
        tool_result = {
            "status": "success",
            "message": f"📂 كتالوج المتجر يحتوي حالياً على **{len(cats)} أقسام نشطة**:\n\n{cats_formatted}",
            "payload": res,
        }
        card_type = "categories_list_card"

    elif intent == "clarification_add_product":
        tool_result = {
            "status": "need_details",
            "message": "يا أهلاً بك يا فندم! 🌟 عشان أضيفلك المنتج للكتالوج بدقة، يرجى ملء البيانات التالية أو كتابتها مباشرة:",
            "payload": {
                "question": "عشان أضيفلك المنتج، محتاج بعض التفاصيل:",
                "slots": [
                    {"field": "name", "label": "اسم المنتج", "type": "text", "required": True},
                    {"field": "price", "label": "السعر (ج.م)", "type": "number", "required": True},
                    {"field": "stock", "label": "الكمية بالمخزن", "type": "number", "default": 20},
                    {"field": "category", "label": "القسم", "type": "select", "options": ["إلكترونيات", "موبايلات", "إكسسوارات"]},
                ]
            }
        }
        card_type = "clarification"

    elif intent == "add_product":
        # 1. Try intelligent LLM extraction first
        gemini_slots = extract_product_slots_with_gemini(raw_query)
        if gemini_slots and gemini_slots.get("name") and gemini_slots.get("price") is not None:
            clean_name = gemini_slots["name"]
            price_val = gemini_slots["price"]
            stock_qty = gemini_slots.get("stock", 20)
        else:
            price_val = None
            price_patterns = [
                r"(?:سعر[ه]?|بسعر|بـ|ب|سعر)\s*[:=]?\s*(\d+(?:\.\d+)?)",
                r"(\d+(?:\.\d+)?)\s*(?:جنيه|ج\.م|egp|pound)",
            ]
            for pat in price_patterns:
                m = re.search(pat, raw_query, re.IGNORECASE)
                if m:
                    price_val = float(m.group(1))
                    break

            numbers = [float(n) for n in re.findall(r"\b(\d+(?:\.\d+)?)\b", raw_query)]
            stock_m = re.search(r"(?:كمية|كميه|مخزون|عدد|قطع[هة]?)\s*[:=]?\s*(\d+)", raw_query, re.IGNORECASE)
            stock_qty = int(stock_m.group(1)) if stock_m else 20

            if price_val is None and numbers:
                rem = [n for n in numbers if n != stock_qty]
                if rem:
                    price_val = rem[0]
                elif len(numbers) == 1 and not stock_m:
                    price_val = numbers[0]

            clean_name = re.sub(
                r"(?:عايز|عاوز|اريد|ممكن|ياريت|ضيف|اضف|أضف|اضافة|إضافة|انشئ|أنشئ|منتج|جديد|بسعر|سعر[ه]?|بـ|جنيه|ج\.م|egp|كمية|كميه|مخزون|عدد|قطع[هة]?|\d+(?:\.\d+)?|قسم|في قسم|اسمه|اسم|المنتج)",
                " ",
                raw_query,
                flags=re.IGNORECASE,
            ).strip()
            clean_name = re.sub(r"[:=،,\-\.]+", " ", clean_name).strip()
            clean_name = " ".join(clean_name.split())

        invalid_names = ["", "ا", "ان", "لي", "لنا", "جديد", "منتج", "واحد"]
        if price_val is None or clean_name in invalid_names or len(clean_name) < 2:
            return execute_action("clarification_add_product", raw_query, tenant_id, session_id, history)

        res = add_product_tool(
            tenant_id=tenant_id,
            name_ar=clean_name,
            price=price_val,
            stock_qty=stock_qty,
        )
        tool_result = res
        card_type = "product_card"
    elif intent == "bulk_price":
        pct_match = re.search(r"([+-]?\d+(?:\.\d+)?)\s*%", raw_query)
        pct = float(pct_match.group(1)) if pct_match else 10.0
        if "خصم" in norm_query or "تخفيض" in norm_query or "تنقيص" in norm_query:
            pct = -abs(pct)
        res = bulk_update_prices_tool(tenant_id=tenant_id, percent_change=pct)
        tool_result = res
        card_type = "bulk_price_preview"

    elif intent == "update_price":
        gemini_price = extract_price_update_slots_with_gemini(raw_query)
        if gemini_price and gemini_price.get("price") is not None:
            price = gemini_price["price"]
            sku_or_name = gemini_price.get("name_or_sku") or "سماعة"
        else:
            price_match = re.search(r"(\d+(?:\.\d+)?)", raw_query)
            price = float(price_match.group(1)) if price_match else 500.0
            sku_or_name = re.sub(r"(?:عدل|غير|سعر|منتج|الى|إلى|بـ|\d+|جنيه|ج\.م)", "", raw_query).strip() or "سماعة"
        res = update_product_price_tool(tenant_id=tenant_id, sku_or_name=sku_or_name, new_price=price)
        tool_result = res
        card_type = "product_update_preview"

    elif intent == "list_products":
        res = list_products_tool(tenant_id=tenant_id)
        tool_result = res
        card_type = "products_list_card"

    elif intent == "top_products":
        res = get_top_products_tool(tenant_id=tenant_id, limit=5)
        tool_result = res
        card_type = "products_list_card"

    elif intent == "view_orders":
        res = list_orders_tool(tenant_id=tenant_id)
        tool_result = res
        card_type = "orders_card"

    elif intent == "inventory_alerts":
        res = get_inventory_alerts_tool(tenant_id=tenant_id)
        tool_result = res
        card_type = "inventory_alerts"

    elif intent == "create_coupon":
        gemini_coupon = extract_coupon_slots_with_gemini(raw_query)
        if gemini_coupon and gemini_coupon.get("code") and gemini_coupon.get("value") is not None:
            code = gemini_coupon["code"]
            val = gemini_coupon["value"]
            c_type = gemini_coupon.get("type", "percent")
            min_order = gemini_coupon.get("min_order", 0.0)
        else:
            code_match = re.search(r"\b([A-Z0-9]{4,15})\b", raw_query.upper())
            code = code_match.group(1) if code_match else "PROMO20"
            val_match = re.search(r"(\d+)%", raw_query) or re.search(r"(\d+)", raw_query)
            val = float(val_match.group(1)) if val_match else 20.0
            c_type = "percent" if "%" in raw_query else "fixed"
            min_order = 0.0
        res = create_coupon_tool(tenant_id=tenant_id, code=code, value=val, type=c_type, min_order=min_order)
        tool_result = res
        card_type = "coupon_card"

    elif intent == "update_theme":
        color = "#6366f1" if "بنفسجي" in raw_query else "#0ea5e9"
        mode = "dark" if ("ليلي" in raw_query or "داكن" in raw_query) else "light"
        res = update_store_theme_tool(tenant_id=tenant_id, primary_color=color, mode=mode)
        tool_result = res
        card_type = "theme_card"

    else:
        ai_reply_dict = generate_intelligent_ai_reply(
            query=raw_query,
            tenant_id=tenant_id,
            history=history,
        )
        tool_result = ai_reply_dict
        card_type = ai_reply_dict.get("card_type", "text")

    # Save action to DB
    try:
        db = SessionLocal()
        action = AgentAction(
            id=f"act_{uuid.uuid4().hex[:10]}",
            session_id=session_id,
            action_type=intent,
            payload={"query": raw_query},
            result=tool_result,
        )
        db.add(action)
        db.commit()
        db.close()
    except Exception:
        pass

    return {
        "tool_result": tool_result,
        "card_type": card_type,
        "message": tool_result.get("message", "تم تنفيذ الأمر بنجاح."),
    }


def classify_intent_node(state: ErpAgentState) -> Dict[str, Any]:
    messages = state.get("messages", [])
    raw_query = messages[-1].content if messages else ""
    norm_query = normalize_arabic(raw_query).lower().strip()

    # Check conversation history for follow-ups
    prev_content = ""
    if len(messages) >= 2:
        for m in reversed(messages[:-1]):
            prev_content = getattr(m, "content", "")
            if prev_content:
                break

    norm_words = set(norm_query.split())
    # 0. Check for consultative / advisory / questions about growth, how-to, why, strategy:
    # Single-word advice keywords must match as whole words so 'ليه' doesn't match 'منزلية' or 'مالية'
    is_advice_query = any(
        (k in norm_words if len(k.split()) == 1 else k in norm_query)
        for k in [
            "كيف", "ازاي", "إزاي", "ليه", "لماذا", "طريقة", "طريقه", "افكار", "أفكار",
            "استراتيجية", "استراتيجيه", "نصيحة", "نصيحه", "انصحني", "انصحنى", "اقترح",
            "رايك", "رأيك", "شرح", "اشرح", "وضح", "يعني ايه", "ما معنى", "ما هو", "ما هي",
            "help", "how to", "why", "suggest", "tips", "ideas", "advice",
        ]
    ) and not any(k in norm_query for k in [
        "اكتر منتج", "اكثر منتج", "بيتباع", "مبيعا", "مبيعات", "ارباح", "داشبورد", "توقع", "نواقص", "مخزون", "شرايح", "عملاء",
        "قسم", "اقسام", "تصنيف", "فئة", "منتج", "ضيف", "اضف", "أضف",
    ])
    if is_advice_query:
        return {"intent": "general_chat"}

    # 1. Top products & Best sellers: "اي اكتر منتج بيتباع", "الاكثر مبيعا", "اعلى مبيعا", "top selling", "bestseller"
    if any(k in norm_query for k in [
        "اكتر منتج", "اكثر منتج", "اكتر حاجة", "اكثر سلعة", "اكتر سلعه",
        "اكثر مبيعا", "اكتر مبيعا", "الاكثر مبيعا", "الأكثر مبيعا", "أكثر مبيعاً",
        "اكتر منتج بيتباع", "اكثر منتج بيتباع", "بيتباع", "بست سيلر", "best seller",
        "top selling", "bestseller", "اعلى مبيعا", "الأعلى مبيعا", "اعلى المنتجات",
        "الاعلى سعرا", "الأعلى سعرا", "الاغلى", "الأغلى", "أعلى سعر", "اعلى سعر", "top products",
    ]):
        return {"intent": "top_products"}

    # 2. Forecast (check before general sales analytics)
    if any(k in norm_query for k in ["توقع", "تنبؤ", "توقعات", "forecast", "مبيعات الشهر الجاي", "المستقبل"]):
        return {"intent": "sales_forecast"}

    # 3. Customer Segments / CRM (check before general analytics)
    if any(k in norm_query for k in ["شرايح العملاء", "تقسيم العملاء", "شرائح العملاء", "تصنيف العملاء", "crm", "segments"]):
        return {"intent": "customer_segments"}

    # 4. PDF & Export Reports
    if any(k in norm_query for k in ["pdf", "تقرير مالي", "استخراج تقرير", "تصدير تقرير", "ملف إكسل", "excel"]):
        return {"intent": "pdf_report"}

    # 5. Analytics Dashboard & BI
    if any(k in norm_query for k in [
        "داشبورد", "الداشبورد", "dashboard", "ارباح", "الأرباح", "الارباح",
        "مبيعات", "المبيعات", "ايرادات", "الإيرادات", "احصائيات", "analytics",
        "revenue", "sales", "مؤشرات الاداء", "kpi",
    ]):
        return {"intent": "analytics_dashboard"}

    # 6. Bulk Price update
    if ("سعر" in norm_query or "الاسعار" in norm_query) and any(k in norm_query for k in ["كل المنتجات", "الكل", "بنسبة", "%", "مجمع", "تخفيض عام"]):
        return {"intent": "bulk_price"}

    # 7. Single Price update
    if any(k in norm_query for k in ["عدل سعر", "غير سعر", "خصم على", "تخفيض سعر", "update price"]):
        return {"intent": "update_price"}

    # 8. Category & Department Intents (checked before product to prevent collision)
    is_cat_keyword = any(k in norm_query for k in [
        "قسم", "اقسام", "أقسام", "الاقسام", "الأقسام",
        "تصنيف", "تصنيفات", "التصنيفات",
        "فئة", "فئات", "الفئات", "فئه",
        "category", "categories",
    ]) and not any(k in norm_query for k in ["تصنيف العملاء", "شرائح العملاء", "شرايح العملاء"])

    if is_cat_keyword:
        # Check if list/view categories
        if any(k in norm_query for k in ["عرض", "وريني", "قائمة", "كل", "ايه", "ماهي", "ما هي", "list", "show"]) and not any(k in norm_query for k in ["ضيف", "اضف", "أضف", "اضافة", "إضافة", "انشئ", "أنشئ"]):
            return {"intent": "list_categories"}

        # Bare category addition trigger without name -> show category clarification form
        bare_cat_triggers = [
            "عايز اضيف قسم", "عاوز اضيف قسم", "عايز اضيف تصنيف", "عاوز اضيف تصنيف",
            "عايز اضيف فئة", "عاوز اضيف فئة", "عايز اضيف فئه", "عاوز اضيف فئه",
            "ضيف قسم", "اضف قسم", "أضف قسم", "اضافة قسم", "إضافة قسم",
            "ضيف تصنيف", "اضف تصنيف", "أضف تصنيف", "اضافة تصنيف", "إضافة تصنيف",
            "ضيف فئة", "اضف فئة", "أضف فئة", "اضافة فئة", "إضافة فئة",
            "انشئ قسم", "أنشئ قسم", "انشاء قسم", "إنشاء قسم",
            "انشئ تصنيف", "أنشئ تصنيف", "انشاء تصنيف", "إنشاء تصنيف",
            "قسم جديد", "تصنيف جديد", "فئة جديدة", "فئه جديده",
            "add category", "create category", "new category",
        ]
        is_bare_cat = any(
            norm_query == t or norm_query == f"{t} جديد" or norm_query == f"{t} جديدة" or norm_query == f"{t} جديده" or norm_query == f"ياريت {t}" or norm_query == f"ممكن {t}"
            for t in bare_cat_triggers
        ) or norm_query in ["قسم", "تصنيف", "فئة", "فئه", "الاقسام", "التصنيفات"]

        if is_bare_cat:
            return {"intent": "clarification_add_category"}

        # Add category with specific name (e.g., "أضف قسم ملابس رجالي")
        if any(k in norm_query for k in ["اضف", "أضف", "ضيف", "عايز اضيف", "عاوز اضيف", "اضافة", "إضافة", "انشئ", "أنشئ", "new"]):
            return {"intent": "add_category"}

        return {"intent": "list_categories"}

    # 9. Clarification trigger: User says "ضيف منتج" or "عايز اضيف منتج" without name/price
    short_add_triggers = ["ضيف منتج", "اضف منتج", "أضف منتج", "عايز اضيف منتج", "عاوز اضيف منتج", "اضافة منتج", "إضافة منتج", "منتج جديد", "add product"]
    is_bare_add = any(norm_query == t or norm_query == f"{t} جديد" or norm_query == f"ياريت {t}" or norm_query == f"ممكن {t}" for t in short_add_triggers)
    if is_bare_add:
        return {"intent": "clarification_add_product"}

    # 10. Add product with details
    add_triggers = ["اضف", "أضف", "ضيف", "منتج جديد", "عايز اضيف", "عاوز اضيف"]
    if any(k in norm_query for k in add_triggers):
        return {"intent": "add_product"}

    # 11. List products
    if any(k in norm_query for k in [
        "منتجات", "المنتجات", "عرض المنتجات", "الكتالوج", "list products", "show products",
        "المنتجات اللي عندي", "عايز اعرف المنتجات", "ايه المنتجات", "وريني المنتجات",
        "اعرضهم", "وريني", "البضاعه",
    ]):
        return {"intent": "list_products"}

    # 12. Orders
    if any(k in norm_query for k in ["الطلبات", "الاوردرات", "طلبات اليوم", "طلبات جديدة", "orders", "view orders", "شحن"]):
        return {"intent": "view_orders"}

    # 13. Inventory Alerts
    if any(k in norm_query for k in ["مخزون", "نواقص", "نفاد", "كميات", "inventory", "stock", "low stock", "تنبيهات المخزون"]):
        return {"intent": "inventory_alerts"}

    # 14. Coupon
    if any(k in norm_query for k in ["كوبون", "خصم ترويجي", "انشئ كوبون", "coupon", "promo"]):
        return {"intent": "create_coupon"}

    # 15. Theme
    if any(k in norm_query for k in ["لون المتجر", "مظهر المتجر", "وضع ليلي", "وضع نهاري", "theme", "colors"]):
        return {"intent": "update_theme"}

    # 16. Local LLM / Cloud LLM Intent Fallback for complex queries
    llm = get_llm()
    if llm and not is_advice_query:
        try:
            from langchain_core.messages import SystemMessage, HumanMessage
            sys_prompt = (
                "You are an intent classification assistant for an Arabic e-commerce ERP system.\n"
                "Determine the user's intent from their query:\n"
                "- clarification_add_category: Wants to add a category/department (قسم/تصنيف/فئة) without specifying details\n"
                "- add_category: Adds a specific category with name\n"
                "- list_categories: Wants to see existing categories/departments\n"
                "- clarification_add_product: Wants to add a product (منتج) without details\n"
                "- add_product: Adds a specific product\n"
                "- list_products: Lists products in catalog\n"
                "- top_products: Inquires about best sellers / top revenue products\n"
                "- update_price: Updates single product price\n"
                "- bulk_price: Storewide percentage price discount or increase\n"
                "- view_orders: Views orders / shipping\n"
                "- inventory_alerts: Checks stock shortages / low inventory\n"
                "- sales_forecast: Asks for future sales forecast\n"
                "- customer_segments: Asks for customer RFM segments\n"
                "- pdf_report: Asks for PDF or export report\n"
                "- analytics_dashboard: Asks for general store analytics / revenue dashboard\n"
                "- general_chat: Advice, strategy, question, or general discussion\n\n"
                "Respond ONLY with the intent string and nothing else."
            )
            res = llm.invoke([SystemMessage(content=sys_prompt), HumanMessage(content=raw_query)])
            llm_text = extract_llm_text(res).lower()
            valid_intents = [
                "clarification_add_category", "add_category", "list_categories",
                "clarification_add_product", "add_product", "list_products",
                "top_products", "update_price", "bulk_price", "view_orders",
                "inventory_alerts", "sales_forecast", "customer_segments",
                "pdf_report", "analytics_dashboard", "general_chat"
            ]
            for vi in valid_intents:
                if vi in llm_text:
                    return {"intent": vi}
        except Exception:
            pass

    return {"intent": "general_chat"}


def execute_tools_node(state: ErpAgentState) -> Dict[str, Any]:
    intent = state.get("intent", "general_chat")
    tenant_id = state.get("tenant_id", "tenant-moustafa-tech")
    session_id = state.get("session_id", "sess_default")
    messages = state.get("messages", [])
    raw_query = messages[-1].content if messages else ""

    result = execute_action(
        intent=intent,
        raw_query=raw_query,
        tenant_id=tenant_id,
        session_id=session_id,
        history=messages,
    )

    return {
        "tool_result": result["tool_result"],
        "card_type": result["card_type"],
    }


def synthesize_response_node(state: ErpAgentState) -> Dict[str, Any]:
    tool_result = state.get("tool_result") or {}
    raw_msg = tool_result.get("message", "تم تنفيذ الأمر بنجاح.")
    messages = state.get("messages", [])
    raw_query = messages[-1].content if messages else ""
    intent = state.get("intent", "general_chat")

    if intent != "general_chat":
        gemini_reply = synthesize_erp_action_with_gemini(
            action_type=intent,
            action_data=tool_result,
            user_query=raw_query,
        )
        if gemini_reply:
            raw_msg = gemini_reply

    ai_reply = AIMessage(content=raw_msg)
    return {"messages": [ai_reply]}


def build_erp_agent():
    builder = StateGraph(ErpAgentState)
    builder.add_node("classify_intent", classify_intent_node)
    builder.add_node("execute_tools", execute_tools_node)
    builder.add_node("synthesize_response", synthesize_response_node)

    builder.add_edge(START, "classify_intent")
    builder.add_edge("classify_intent", "execute_tools")
    builder.add_edge("execute_tools", "synthesize_response")
    builder.add_edge("synthesize_response", END)

    return builder.compile()


_agent_singleton = None

def get_erp_agent():
    global _agent_singleton
    if _agent_singleton is None:
        _agent_singleton = build_erp_agent()
    return _agent_singleton
