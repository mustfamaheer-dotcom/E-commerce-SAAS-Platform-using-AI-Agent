# backend/agent/erp_agent.py
import re
import uuid
import logging
from typing import Dict, Any, List, Optional
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langgraph.graph import StateGraph, START, END, MessagesState

from backend.agent.arabic_normalizer import normalize_arabic
from backend.agent.llm_client import get_llm
from backend.agent.system_prompt import get_system_prompt
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
        price_val: Optional[float] = None
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
        clean_name = re.sub(r"\s+و\s*$", "", clean_name).strip()
        clean_name = re.sub(r"^\s*و\s+", "", clean_name).strip()
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
        code_match = re.search(r"\b([A-Z0-9]{4,15})\b", raw_query.upper())
        code = code_match.group(1) if code_match else "PROMO20"
        val_match = re.search(r"(\d+)%", raw_query) or re.search(r"(\d+)", raw_query)
        val = float(val_match.group(1)) if val_match else 20.0
        res = create_coupon_tool(tenant_id=tenant_id, code=code, value=val)
        tool_result = res
        card_type = "coupon_card"

    elif intent == "update_theme":
        color = "#6366f1" if "بنفسجي" in raw_query else "#0ea5e9"
        mode = "dark" if ("ليلي" in raw_query or "داكن" in raw_query) else "light"
        res = update_store_theme_tool(tenant_id=tenant_id, primary_color=color, mode=mode)
        tool_result = res
        card_type = "theme_card"

    else:
        tool_result = {
            "status": "info",
            "message": "أنا وكيل تيك زون للـ ERP والتجارة الذكية 🇪🇬. أقدر أساعدك في: إضافة وتعديل المنتجات، فحص نواقص المخزون، استعراض وتحديث الطلبات، تفعيل الكوبونات، وعرض لوحة تحليلات الأرباح التفاعلية بالمصري.",
        }
        card_type = "text"

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

    # 1. Multi-turn follow-ups on products: "وريني الأعلى سعراً منهم" / "الاغلى"
    if any(k in norm_query for k in ["الاعلى سعرا", "الأعلى سعرا", "الاغلى", "الأغلى", "أعلى سعر", "اعلى سعر", "top products"]):
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

    # 8. Clarification trigger: User says "ضيف منتج" or "عايز اضيف منتج" without name/price
    short_add_triggers = ["ضيف منتج", "اضف منتج", "أضف منتج", "عايز اضيف منتج", "عاوز اضيف منتج", "اضافة منتج", "إضافة منتج", "add product"]
    is_bare_add = any(norm_query == t or norm_query == f"{t} جديد" or norm_query == f"ياريت {t}" for t in short_add_triggers)
    if is_bare_add:
        return {"intent": "clarification_add_product"}

    # 9. Add product with details
    add_triggers = ["اضف", "أضف", "ضيف", "منتج جديد", "عايز اضيف", "عاوز اضيف"]
    if any(k in norm_query for k in add_triggers):
        return {"intent": "add_product"}

    # 10. List products
    if any(k in norm_query for k in [
        "منتجات", "المنتجات", "عرض المنتجات", "الكتالوج", "list products", "show products",
        "المنتجات اللي عندي", "عايز اعرف المنتجات", "ايه المنتجات", "وريني المنتجات",
        "اعرضهم", "وريني", "البضاعه",
    ]):
        return {"intent": "list_products"}

    # 11. Orders
    if any(k in norm_query for k in ["الطلبات", "الاوردرات", "طلبات اليوم", "طلبات جديدة", "orders", "view orders", "شحن"]):
        return {"intent": "view_orders"}

    # 12. Inventory Alerts
    if any(k in norm_query for k in ["مخزون", "نواقص", "نفاد", "كميات", "inventory", "stock", "low stock", "تنبيهات المخزون"]):
        return {"intent": "inventory_alerts"}

    # 13. Coupon
    if any(k in norm_query for k in ["كوبون", "خصم ترويجي", "انشئ كوبون", "coupon", "promo"]):
        return {"intent": "create_coupon"}

    # 14. Theme
    if any(k in norm_query for k in ["لون المتجر", "مظهر المتجر", "وضع ليلي", "وضع نهاري", "theme", "colors"]):
        return {"intent": "update_theme"}

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
    msg = tool_result.get("message", "تم تنفيذ الأمر بنجاح.")
    ai_reply = AIMessage(content=msg)
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
