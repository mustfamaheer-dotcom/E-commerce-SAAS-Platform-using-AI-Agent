# backend/agent/erp_agent.py
import re
import uuid
from typing import Dict, Any, List, Optional
from langchain_core.messages import HumanMessage, AIMessage
from langgraph.graph import StateGraph, START, END, MessagesState

from backend.agent.arabic_normalizer import normalize_arabic
from backend.agent.tools.product_tool import add_product_tool, update_product_price_tool, list_products_tool
from backend.agent.tools.category_tool import add_category_tool, list_categories_tool
from backend.agent.tools.order_tool import list_orders_tool, update_order_status_tool
from backend.agent.tools.inventory_tool import get_inventory_alerts_tool, adjust_stock_tool
from backend.agent.tools.coupon_tool import create_coupon_tool, list_coupons_tool
from backend.agent.tools.analytics_tool import get_analytics_summary_tool, get_top_products_tool
from backend.agent.tools.theme_tool import update_store_theme_tool
from backend.agent.tools.store_tool import update_store_settings_tool
from backend.db.database import SessionLocal
from backend.models import AgentSession, AgentMessage, AgentAction


class ErpAgentState(MessagesState):
    tenant_id: str = "tenant-moustafa-tech"
    session_id: str = "sess_default"
    intent: Optional[str] = None
    tool_result: Optional[Dict[str, Any]] = None
    card_type: Optional[str] = None


def classify_intent_node(state: ErpAgentState) -> Dict[str, Any]:
    messages = state.get("messages", [])
    raw_query = messages[-1].content if messages else ""
    norm_query = normalize_arabic(raw_query).lower().strip()

    prev_assistant_msg = ""
    if len(messages) >= 2:
        for m in reversed(messages[:-1]):
            if isinstance(m, AIMessage) or getattr(m, "role", None) == "assistant":
                prev_assistant_msg = m.content
                break

    # 1. Product listing & follow-up questions
    list_triggers = [
        "منتجات", "المنتجات", "عرض المنتجات", "الكتالوج", "list products", "show products",
        "المنتجات اللي عندي", "عايز اعرف المنتجات", "ايه المنتجات", "وريني المنتجات",
        "اي هما", "ايه هما", "ايه هم", "مين هما", "اعرضهم", "وريني", "قولهم لي",
        "عرفني المنتجات", "ايه البضاعه", "البضاعه اللي عندي",
    ]
    if any(k in norm_query for k in list_triggers):
        return {"intent": "list_products"}

    # 2. Product addition
    add_triggers = [
        "اضف منتج", "اضافه منتج", "ضيف منتج", "منتج جديد", "عايز اضيف منتج",
        "عاوز اضيف منتج", "عايز اضيف", "عاوز اضيف", "add product", "انشئ منتج",
        "اضف", "أضف", "ضيف",
    ]
    is_add_prompt = any(k in norm_query for k in add_triggers)
    was_asking_product_slots = "عشان أضيفلك المنتج" in prev_assistant_msg or "اسم المنتج" in prev_assistant_msg
    has_product_specs = bool(
        re.search(r"(?:بسعر|سعر[ه]?|بـ)\s*\d+", norm_query)
        and (
            re.search(r"(?:كمية|كميه|مخزون|قطع[هة]?|قسم)", norm_query)
            or any(k in norm_query for k in ["سماعه", "موبايل", "كيبورد", "ماوس", "شاحن", "كابل", "شاشه", "لابتوب", "ايربودز", "سبيكر"])
        )
    )
    if is_add_prompt or was_asking_product_slots or has_product_specs:
        return {"intent": "add_product"}

    # 3. Product price updates
    if any(k in norm_query for k in ["عدل سعر", "غير سعر", "خصم على", "تخفيض سعر", "update price"]):
        return {"intent": "update_price"}

    # 4. Categories
    if any(k in norm_query for k in ["انشئ قسم", "قسم جديد", "اضف قسم", "add category"]):
        return {"intent": "add_category"}

    # 5. Orders & Logistics
    if any(k in norm_query for k in ["الطلبات", "الاوردرات", "طلبات اليوم", "طلبات جديدة", "orders", "view orders"]):
        return {"intent": "view_orders"}
    if any(k in norm_query for k in ["تم الشحن", "تحديث حالة الطلب", "شحن الطلب", "ship order"]):
        return {"intent": "update_order"}

    # 6. Inventory & Alerts
    if any(k in norm_query for k in ["مخزون", "نواقص", "نفاد", "كميات", "inventory", "stock", "low stock"]):
        return {"intent": "inventory_alerts"}

    # 7. Coupons & Promotions
    if any(k in norm_query for k in ["كوبون", "خصم ترويجي", "انشئ كوبون", "coupon", "promo"]):
        return {"intent": "create_coupon"}

    # 8. Analytics & BI
    if any(k in norm_query for k in ["ارباح", "مبيعات", "ايرادات", "تقرير", "احصائيات", "analytics", "revenue", "sales"]):
        return {"intent": "analytics_summary"}

    # 9. Theme & Identity
    if any(k in norm_query for k in ["لون المتجر", "مظهر المتجر", "وضع ليلي", "وضع نهاري", "theme", "colors"]):
        return {"intent": "update_theme"}

    return {"intent": "general_chat"}


def execute_tools_node(state: ErpAgentState) -> Dict[str, Any]:
    intent = state.get("intent", "general_chat")
    tenant_id = state.get("tenant_id", "tenant-moustafa-tech")
    session_id = state.get("session_id", "sess_default")
    messages = state.get("messages", [])
    raw_query = messages[-1].content if messages else ""
    norm_query = normalize_arabic(raw_query).lower()

    tool_result = {}
    card_type = "text"

    if intent == "add_product":
        # Extract price with multiple patterns
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

        # Fallback price extraction from numbers if context supports it
        numbers = [float(n) for n in re.findall(r"\b(\d+(?:\.\d+)?)\b", raw_query)]

        # Extract stock quantity
        stock_m = re.search(r"(?:كمية|كميه|مخزون|عدد|قطع[هة]?)\s*[:=]?\s*(\d+)", raw_query, re.IGNORECASE)
        stock_qty = int(stock_m.group(1)) if stock_m else 20

        # If price wasn't found by pattern but numbers exist:
        if price_val is None and numbers:
            # If stock was matched and is one of the numbers, pick the other as price
            remaining_nums = [n for n in numbers if n != stock_qty]
            if remaining_nums:
                price_val = remaining_nums[0]
            elif len(numbers) == 1 and not stock_m:
                price_val = numbers[0]

        # Extract name: strip boilerplate trigger words and values
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

        # Check if this is an incomplete prompt without product name or price
        invalid_names = ["", "ا", "ان", "لي", "لنا", "جديد", "منتج", "واحد"]
        is_incomplete = (price_val is None or clean_name in invalid_names or len(clean_name) < 2)

        if is_incomplete:
            tool_result = {
                "status": "need_details",
                "message": (
                    "يا أهلاً وسهلاً بيك يا فندم! 🌟 عشان أضيفلك المنتج بدقة في الكتالوج والمخزن، ياريت تشاركني التفاصيل دي:\n\n"
                    "1️⃣ **اسم المنتج** (مثلاً: سماعة وايرلس JBL أو كيبورد ميكانيكي RGB)\n"
                    "2️⃣ **السعر للعميل** بالجنيه المصري (مثلاً: 850)\n"
                    "3️⃣ **الكمية في المخزن** (مثلاً: 25 قطعة)\n"
                    "4️⃣ **القسم** (إلكترونيات، موبايلات، إكسسوارات...)\n\n"
                    "تقدر تكتبهم كلهم مع بعض في رسالة واحدة زي: *'سماعة أنكر بسعر 850 وكمية 20 قسم إلكترونيات'* وهضيفه في ثواني! ⚡"
                ),
            }
            card_type = "text"
        else:
            # Complete details provided -> commit to catalog
            res = add_product_tool(
                tenant_id=tenant_id,
                name_ar=clean_name,
                price=price_val,
                stock_qty=stock_qty,
            )
            tool_result = res
            card_type = "product_card"

    elif intent == "update_price":
        price_match = re.search(r"(\d+(?:\.\d+)?)", raw_query)
        price = float(price_match.group(1)) if price_match else 500.0
        sku_or_name = re.sub(r"(?:عدل|غير|سعر|منتج|الى|إلى|بـ|\d+|جنيه|ج\.م)", "", raw_query).strip() or "JBL"
        res = update_product_price_tool(tenant_id=tenant_id, sku_or_name=sku_or_name, new_price=price)
        tool_result = res
        card_type = "price_card"

    elif intent == "list_products":
        res = list_products_tool(tenant_id=tenant_id)
        tool_result = res
        card_type = "products_list_card"

    elif intent == "add_category":
        name = re.sub(r"(?:انشئ|أنشئ|قسم|جديد|اضف|أضف)", "", raw_query).strip() or "قسم إلكترونيات"
        res = add_category_tool(tenant_id=tenant_id, name_ar=name)
        tool_result = res
        card_type = "category_card"

    elif intent == "view_orders":
        res = list_orders_tool(tenant_id=tenant_id)
        tool_result = res
        card_type = "orders_card"

    elif intent == "inventory_alerts":
        res = get_inventory_alerts_tool(tenant_id=tenant_id)
        tool_result = res
        card_type = "inventory_card"

    elif intent == "create_coupon":
        code_match = re.search(r"\b([A-Z0-9]{4,15})\b", raw_query.upper())
        code = code_match.group(1) if code_match else "SALE15"
        val_match = re.search(r"(\d+)%", raw_query) or re.search(r"(\d+)", raw_query)
        val = float(val_match.group(1)) if val_match else 15.0
        res = create_coupon_tool(tenant_id=tenant_id, code=code, value=val)
        tool_result = res
        card_type = "coupon_card"

    elif intent == "analytics_summary":
        res = get_analytics_summary_tool(tenant_id=tenant_id)
        tool_result = res
        card_type = "analytics_card"

    elif intent == "update_theme":
        color = "#6366f1" if "بنفسجي" in raw_query else "#0ea5e9"
        mode = "dark" if "ليلي" in raw_query or "داكن" in raw_query else "light"
        res = update_store_theme_tool(tenant_id=tenant_id, primary_color=color, mode=mode)
        tool_result = res
        card_type = "theme_card"

    else:
        tool_result = {
            "status": "info",
            "message": "أنا وكيل تيك زون للـ ERP والتجارة الذكية 🇪🇬. أقدر أساعدك في: إضافة وتعديل المنتجات، فحص نواقص المخزون، استعراض وتحديث الطلبات، تفعيل الكوبونات، وتحليل الأرباح بالمصري البسيط.",
        }

    # Record action in DB for session tracking
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
