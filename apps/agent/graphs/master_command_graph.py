# apps/agent/graphs/master_command_graph.py
"""
Master Command Center Orchestrator Graph.
Unified AI Agent for TechZone E-Commerce & ERP:
  - Multi-Turn E-Commerce Store Builder (Slot extraction + StoreCreationPreview)
  - ERP Catalog Operations & Bulk Price Discounts with Margin Floor Protection (HITL)
  - ERP Inventory Stockout & Risk Alerts
  - Text-to-SQL BI Analytics Sandbox with Auto-Chart Hint & SQL Drawer
  - Predictive Sales Forecasting (LightGBM + Quantiles + SHAP Explainability)
  - Customer RFM Segmentation (KMeans K=5) & Win-Back Promotions
  - Store Policy RAG (Egyptian Consumer Protection Law 181/2018)
  - 3-Tier Context Memory & Prompt Guard Security Firewall
  - Langfuse Distributed Tracing
"""
import os
import re
import time
import uuid
from typing import Any, Dict, List, Optional
from langchain_core.messages import AIMessage, HumanMessage
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, MessagesState, StateGraph

from apps.agent.nodes.memory_context_node import inject_memory_context
from apps.agent.observability.langfuse_tracer import global_tracer
from apps.agent.tools.customer_promo_tools import create_promotion_for_segment, get_customer_segments
from apps.agent.tools.policy_rag_tools import save_merchant_preference, search_store_policies
from apps.agent.tools.catalog_tools import bulk_update_prices_dry_run, get_inventory_alerts_tool
from apps.agent.tools.analytics_tools import query_sales_data
from apps.agent.tools.forecast_tools import run_sales_forecast


class MasterAgentState(MessagesState):
    tenant_id: str = "tenant-demo-01"
    session_id: str = "session_default"
    trace_id: Optional[str] = None
    language: str = "ar"
    intent_route: str = "general"
    card_type: Optional[str] = None
    tool_output: Optional[Dict[str, Any]] = None
    security_flag: bool = False


FORBIDDEN_PROMPTS = [
    r"ignore\s+(all\s+)?(previous|prior)\s+instructions",
    r"system\s+prompt",
    r"you\s+are\s+now\s+in\s+developer\s+mode",
    r"set\s+local\s+app\.current_tenant_id",
    r"drop\s+table",
    r"delete\s+from",
    r"truncate\s+table",
]


def _get_human_query(messages: List[Any]) -> str:
    for m in reversed(messages):
        if isinstance(m, HumanMessage) or getattr(m, "type", "") == "human":
            return m.content
    return messages[-1].content if messages else ""


def guardrail_node(state: MasterAgentState) -> Dict[str, Any]:
    messages = state.get("messages", [])
    user_text = _get_human_query(messages)
    session_id = state.get("session_id", "session_01")
    tenant_id = state.get("tenant_id", "tenant-demo-01")

    trace_id = global_tracer.start_trace(session_id, tenant_id, user_text)

    # Check for prompt injection / security violations
    for pat in FORBIDDEN_PROMPTS:
        if re.search(pat, user_text, flags=re.IGNORECASE):
            global_tracer.log_step(trace_id, "guardrail_blocked", user_text, "BLOCKED", 1.0)
            return {
                "security_flag": True,
                "trace_id": trace_id,
            }

    global_tracer.log_step(trace_id, "guardrail_pass", user_text, "PASSED", 1.5)
    return {
        "security_flag": False,
        "trace_id": trace_id,
    }


def context_injector_node(state: MasterAgentState) -> Dict[str, Any]:
    if state.get("security_flag"):
        return {}
    enriched = inject_memory_context(state)
    return enriched


def router_node(state: MasterAgentState) -> Dict[str, Any]:
    if state.get("security_flag"):
        return {"intent_route": "security_violation"}

    messages = state.get("messages", [])
    user_text = _get_human_query(messages)
    lower = user_text.lower()
    lang = "ar" if re.search(r"[\u0600-\u06FF]", user_text) else "en"

    # 1. E-Commerce Store Builder Intent
    if any(k in lower or k in user_text for k in [
        "انشئ متجر", "أنشئ متجر", "ابني متجر", "متجر جديد", "تأسيس متجر",
        "create store", "build store", "launch store", "setup store", "store builder"
    ]):
        return {"intent_route": "store_builder", "language": lang}

    # 2. ERP Inventory & Stockout Risk
    if any(k in lower or k in user_text for k in [
        "نواقص", "مخزون", "نفاد", "معرضة للنفاد", "كميات", "inventory", "stockout", "low stock", "stock alerts"
    ]) and not any(k in lower or k in user_text for k in ["توقع", "forecast", "خصم", "discount"]):
        return {"intent_route": "inventory_alerts", "language": lang}

    # 3. ERP Bulk Price Discount (HITL)
    if any(k in lower or k in user_text for k in [
        "طبق خصم", "تخفيض اسعار", "تخفيض الأسعار", "خصم على السماعات", "عدل اسعار",
        "bulk discount", "discount on", "lower prices", "price update"
    ]):
        return {"intent_route": "bulk_price_preview", "language": lang}

    # 4. ERP BI Analytics & Text-to-SQL
    if any(k in lower or k in user_text for k in [
        "ارباح", "أرباح", "صافي الربح", "اعلى المنتجات", "أعلى المنتجات", "مبيعات القاهرة", "مبيعات الاسكندرية",
        "top products", "profit", "sales report", "sql query", "most profitable", "analytics"
    ]) and not any(k in lower or k in user_text for k in ["توقع", "forecast", "بكرة", "الشهر الجاي"]):
        return {"intent_route": "analytics_sql", "language": lang}

    # 5. Predictive Sales Forecast (LightGBM + SHAP)
    if any(k in lower or k in user_text for k in [
        "توقع", "توقعات", "كام هبيع", "كام وحدة", "forecast", "predict sales", "demand", "next month sales"
    ]):
        return {"intent_route": "sales_forecast", "language": lang}

    # 6. Customer RFM Segmentation
    if any(k in lower or k in user_text for k in [
        "عملاء", "شرائح", "زباين", "rfm", "segments", "customers", "تقسيم العملاء"
    ]) and not any(k in lower or k in user_text for k in ["كوبون", "coupon"]):
        return {"intent_route": "customer_segments", "language": lang}

    # 7. Customer Retention Promotion / Coupon
    if any(k in lower or k in user_text for k in [
        "كوبون", "خصم لعملاء", "حملة استعادة", "promo", "coupon", "retention voucher"
    ]):
        return {"intent_route": "promotion_create", "language": lang}

    # 8. Store Policies & Legal Compliance RAG
    if any(k in lower or k in user_text for k in [
        "سياسة", "استرجاع", "استبدال", "ضمان", "توصيل", "شحن", "policy", "return", "refund", "warranty"
    ]):
        return {"intent_route": "policy_rag", "language": lang}

    # 9. Merchant Preference Memory
    if any(k in lower or k in user_text for k in ["تفضيل", "احفظ", "remember", "preference"]):
        return {"intent_route": "preference_memory", "language": lang}

    # 10. General ERP & E-Commerce Conversational Intelligence
    return {"intent_route": "general_dialogue", "language": lang}


def _extract_store_slots(text: str) -> Dict[str, Any]:
    """Slot extractor for E-Commerce Builder."""
    lower = text.lower()

    # Currency
    currency = "EGP"
    if any(k in lower or k in text for k in ["usd", "dollar", "دولار"]):
        currency = "USD"
    elif any(k in lower or k in text for k in ["sar", "ريال", "سعودي"]):
        currency = "SAR"

    # Theme mode
    theme_mode = "dark" if any(k in lower or k in text for k in ["dark", "داكن", "اسود", "black", "ليلي"]) else "light"

    # Category
    category = "Electronics & Gadgets"
    if any(k in lower or k in text for k in ["ملابس", "ازياء", "fashion", "clothes"]):
        category = "Fashion & Apparel"
    elif any(k in lower or k in text for k in ["عطور", "perfume", "beauty", "تجميل"]):
        category = "Perfumes & Cosmetics"
    elif any(k in lower or k in text for k in ["اكسسوارات", "accessories"]):
        category = "Mobile & Tech Accessories"

    # Store Name extraction
    name_match = re.search(
        r"(?:called|named|اسم المتجر|اسمه)\s+([A-Za-z0-9\u0600-\u06FF\s_-]{2,30})",
        text,
        re.IGNORECASE,
    )
    if not name_match:
        name_match = re.search(
            r"متجر\s+([A-Za-z0-9\u0600-\u06FF\s_-]{2,30})",
            text,
            re.IGNORECASE,
        )

    store_name = "TechZone Elite"
    if name_match:
        raw_name = name_match.group(1)
        store_name = re.split(r"\s+(?:in|في|بالوضع|مع|ب)\s+", raw_name)[0].strip()

    return {
        "store_name": store_name,
        "currency": currency,
        "theme_mode": theme_mode,
        "primary_color": "#0ea5e9" if theme_mode == "dark" else "#4F46E5",
        "product_category": category,
        "payment_methods": ["card", "instapay", "fawry", "cod"],
        "shipping_policy": "شحن وتوصيل سريع لجميع محافظات جمهورية مصر العربية خلال 2-3 أيام عمل.",
    }


def tool_execution_node(state: MasterAgentState) -> Dict[str, Any]:
    route = state.get("intent_route")
    tenant_id = state.get("tenant_id", "tenant-demo-01")
    trace_id = state.get("trace_id", "")
    messages = state.get("messages", [])
    user_text = _get_human_query(messages)
    t0 = time.time()

    # 1. Security Violation
    if route == "security_violation":
        return {
            "card_type": "security_alert",
            "tool_output": {
                "blocked": True,
                "reason": "SecurityGuardrailTriggered: Prompt injection or restricted system directive detected.",
            },
        }

    # 2. E-Commerce Store Builder
    if route == "store_builder":
        slots = _extract_store_slots(user_text)
        global_tracer.log_step(trace_id, "store_builder_extract", user_text, slots["store_name"], (time.time() - t0) * 1000)
        return {
            "card_type": "store_creation_preview",
            "tool_output": slots,
        }

    # 3. ERP Inventory Alerts
    if route == "inventory_alerts":
        alerts = get_inventory_alerts_tool("ALL")
        normalized = []
        for a in alerts:
            normalized.append({
                **a,
                "productName": a.get("product_name"),
                "currentStock": a.get("current_stock"),
                "daysUntilStockout": a.get("days_until_stockout"),
                "dailyProfitAtRisk": a.get("daily_profit_at_risk", 0.0),
                "recommendedReorderQty": a.get("recommended_reorder_qty", 30),
            })
        global_tracer.log_step(trace_id, "get_inventory_alerts", user_text, f"{len(alerts)}_alerts", (time.time() - t0) * 1000)
        return {
            "card_type": "inventory_alerts",
            "tool_output": {"alerts": normalized},
        }

    # 4. ERP Bulk Price Discounts (HITL)
    if route == "bulk_price_preview":
        discount = 15.0
        pct_match = re.search(r"(\d+(\.\d+)?)\s*%", user_text)
        if pct_match:
            discount = float(pct_match.group(1))
        category = "Speakers" if "سماع" in user_text or "speaker" in user_text.lower() else None
        preview = bulk_update_prices_dry_run(category=category, min_stock=50, discount_pct=discount)
        global_tracer.log_step(trace_id, "bulk_update_prices_dry_run", user_text, f"affected_{preview['summary']['totalAffectedSkus']}", (time.time() - t0) * 1000)
        return {
            "card_type": "bulk_price_preview",
            "tool_output": preview,
        }

    # 5. ERP BI Analytics & Text-to-SQL
    if route == "analytics_sql":
        analytics_res = query_sales_data.invoke({"question": user_text, "tenant_id": tenant_id})
        # Map into AnalyticsResultPayload
        payload = {
            "columns": analytics_res.get("columns", ["Category", "Net_Profit_EGP"]),
            "rows": analytics_res.get("rows", []),
            "rowCount": analytics_res.get("row_count", 0),
            "executionTimeMs": analytics_res.get("execution_time_ms", 45),
            "verifiedSql": analytics_res.get("verified_sql", "SELECT category, SUM(net_profit) FROM v_orders GROUP BY category;"),
            "chartHint": analytics_res.get("chart_hint", "bar"),
            "title": "تحليل الأرباح والمبيعات بالذكاء الاصطناعي (AdventureWorks2019)",
        }
        global_tracer.log_step(trace_id, "query_sales_data", user_text, f"rows_{payload['rowCount']}", (time.time() - t0) * 1000)
        return {
            "card_type": "analytics_result",
            "tool_output": payload,
        }

    # 6. Predictive Sales Forecasting
    if route == "sales_forecast":
        # Resolve target product
        product_query = "SPK-JBL-01"
        if "سماعة" in user_text or "jbl" in user_text.lower() or "flip" in user_text.lower():
            product_query = "JBL Flip 6"
        elif "شاحن" in user_text or "anker" in user_text.lower():
            product_query = "Anker 65W GaN Fast Charger"

        forecast_res = run_sales_forecast.invoke({
            "product_id_or_name": product_query,
            "horizon_days": 30,
            "tenant_id": tenant_id,
        })
        forecast_payload = forecast_res.get("payload") or forecast_res
        global_tracer.log_step(trace_id, "run_sales_forecast", user_text, product_query, (time.time() - t0) * 1000)
        return {
            "card_type": "sales_forecast",
            "tool_output": forecast_payload,
        }

    # 7. Customer RFM Segments
    if route == "customer_segments":
        out = get_customer_segments.invoke({"tenant_id": tenant_id})
        global_tracer.log_step(trace_id, "get_customer_segments", user_text, "5_segments", (time.time() - t0) * 1000)
        return {"tool_output": out, "card_type": "customer_segments"}

    # 8. Customer Promotion Approval (HITL)
    if route == "promotion_create":
        out = create_promotion_for_segment.invoke({
            "segment": "At-Risk of Churn",
            "discount_pct": 15.0,
            "duration_days": 7,
            "tenant_id": tenant_id,
        })
        global_tracer.log_step(trace_id, "create_promotion_for_segment", user_text, "PENDING", (time.time() - t0) * 1000)
        return {"tool_output": out, "card_type": "promotion_approval"}

    # 9. Store Policy RAG
    if route == "policy_rag":
        out = search_store_policies.invoke({"query": user_text, "tenant_id": tenant_id})
        global_tracer.log_step(trace_id, "search_store_policies", user_text, out["primary_citation"], (time.time() - t0) * 1000)
        return {"tool_output": out, "card_type": "policy_rag"}

    # 10. Preference Memory
    if route == "preference_memory":
        out = save_merchant_preference.invoke({"key": "default_forecast_horizon", "value": "14", "tenant_id": tenant_id})
        global_tracer.log_step(trace_id, "save_merchant_preference", user_text, "SAVED", (time.time() - t0) * 1000)
        return {"tool_output": out, "card_type": "merchant_memory"}

    # 11. General Dialogue
    return {
        "card_type": "text",
        "tool_output": {"query": user_text},
    }


def _generate_contextual_dialogue(user_text: str, is_ar: bool) -> str:
    """
    Intelligent conversational reasoning engine for open-ended queries,
    explaining ERP insights, store building, and guiding the merchant.
    Powered directly by Google Gemini LLM when available.
    """
    from backend.agent.llm_client import get_llm, extract_llm_text
    llm = get_llm()
    if llm:
        try:
            from langchain_core.messages import SystemMessage, HumanMessage
            sys_prompt = (
                "أنت وكيل تيك زون الذكي (TechZone Autonomous Agent)، مساعد ذكاء اصطناعي متكامل للتاجر لإدارة التجارة الإلكترونية والـ ERP وبناء المتاجر.\n"
                "المطلوب:\n"
                "1. رد بشكل مباشر، ذكي، وموجز جداً (1-2 جملة) بلهجة مصرية مهذبة أو بالإنجليزية حسب لغة المستخدم.\n"
                "2. وضح قدرتك ووجه التاجر للخطوة التالية بوضوح وبدون حشو أو ديباجات محفوظة."
                if is_ar else
                "You are TechZone Autonomous Agent, an AI copilot for e-commerce, ERP, and store building.\n"
                "Be direct, smart, and concise (1-2 sentences), guiding the merchant with clear next steps."
            )
            resp = llm.invoke([SystemMessage(content=sys_prompt), HumanMessage(content=user_text)])
            ans = extract_llm_text(resp).strip()
            if ans and len(ans) > 10:
                return ans
        except Exception as ex:
            pass

    lower = user_text.lower()

    if any(k in lower or k in user_text for k in ["من انت", "مين انت", "who are you", "what can you do", "وظيفتك", "بتعمل ايه"]):
        if is_ar:
            return (
                "أنا **وكيل تيك زون الذكي (TechZone Autonomous Agent)**، نظام ذكاء اصطناعي متكامل لإدارة التجارة الإلكترونية ونظام الـ ERP.\n\n"
                "💼 **قدراتي الأساسية التي يمكنك طلبها مني الآن:**\n"
                "1. **بناء المتاجر (Store Builder):** قل لي مثلاً: *'أنشئ متجر إلكتروني لبيع الإلكترونيات اسمه TechZone Store'* وسأقوم بتجهيز المتجر والهوية فورا.\n"
                "2. **إدارة المخزون والتسعير (ERP):** قل لي: *'طبق خصم 15% على السماعات'* أو *'ايه نواقص المخزون؟'*\n"
                "3. **تحليل البيانات (Text-to-SQL):** اسألني: *'أعلى 5 منتجات ربحية في القاهرة'* وسأقوم بتحويل السؤال لاستعلام SQL ورسم بياني.\n"
                "4. **التنبؤ بالمبيعات (ML Forecasting):** اسألني: *'كام وحدة هبيع من JBL Flip 6 الشهر القادم؟'* لترى تنبؤات مدعومة بـ SHAP.\n"
                "5. **تقسيم العملاء والتسويق (RFM):** قل لي: *'حلل شرائح العملاء واقترح عروض استبقاء'*."
            )
        return (
            "I am the **TechZone Autonomous E-Commerce & ERP Agent**.\n\n"
            "Here is what I can do for you:\n"
            "1. **Store Builder:** Build instant multi-tenant storefronts via chat.\n"
            "2. **Catalog & Inventory ERP:** Bulk price discounting with margin safety & stockout alerts.\n"
            "3. **Text-to-SQL Analytics:** Ask questions about profits and orders in natural language.\n"
            "4. **ML Sales Forecasting:** 30-day demand predictions with SHAP explainability.\n"
            "5. **Customer RFM:** K-Means customer segmentation and retention campaigns."
        )

    if any(k in lower or k in user_text for k in ["ارباح", "ازود مبيعاتي", "مبيعات", "ارباحي", "grow sales", "revenue", "profit"]):
        if is_ar:
            return (
                "لزيادة أرباحك ومبيعاتك، أنصحك باتباع هذه الخطوات الثلاث المعتمدة في الـ ERP:\n\n"
                "1. **تحليل شرائح العملاء (RFM):** اكتب *'حلل قطاعات العملاء'* لنطلق عروضاً مخصصة للعملاء المعرضين للمغادرة.\n"
                "2. **فحص المنتجات الأكثر ربحية:** اكتب *'أعلى 5 منتجات ربحية'* للتركيز الإعلاني على المنتجات ذات هامش الربح العالي.\n"
                "3. **تجنب نفاد المخزون:** اكتب *'تنبيهات المخزون'* للتأكد من توفر الكميات الكافية قبل مواسم الطلب."
            )
        return (
            "To maximize store revenue and profitability, follow these steps:\n"
            "1. Run RFM Segmentation to re-engage churn-risk customers.\n"
            "2. Inspect your top profit-margin products with our Text-to-SQL engine.\n"
            "3. Prevent stockouts by checking inventory alerts."
        )

    # General fallback with domain awareness
    if is_ar:
        return (
            f"أهلاً بك! لقد قمت بتحليل استفسارك: **\"{user_text}\"**.\n\n"
            "بصفتي وكيل الـ ERP والتجارة الإلكترونية، أنا جاهز لتنفيذ طلباتك. يمكنك البدء بأي من الأوامر التالية:\n"
            "• *'أنشئ متجر إلكتروني لبيع الإكسسوارات اسمه TechZone'* (لتأسيس متجرك الجديد)\n"
            "• *'طبق خصم 15% على السماعات اللي مخزونها أكثر من 50'* (لتعديل الأسعار مع فحص هامش الربح)\n"
            "• *'ايه المنتجات المعرضة لنفاد المخزون؟'* (لفحص تنبيهات المستودع)\n"
            "• *'أعلى 5 منتجات ربحية في القاهرة'* (لتحليل المبيعات فوراً)\n"
            "• *'توقع مبيعات سماعة JBL للشهر القادم'* (لتشغيل نماذج الذكاء الاصطناعي)"
        )
    return (
        f"Hello! I analyzed your query: **\"{user_text}\"**.\n\n"
        "As your autonomous ERP & E-Commerce assistant, here are actionable tasks you can run right now:\n"
        "• *'Build an e-commerce store called TechZone Store'* (Store Builder)\n"
        "• *'Apply a 15% discount on speakers with stock > 50'* (Bulk Pricing Preview)\n"
        "• *'Check stockout risk alerts'* (Inventory Management)\n"
        "• *'Show top 5 profitable products in Cairo'* (Text-to-SQL BI)\n"
        "• *'Forecast sales for JBL speaker for next month'* (ML Demand Forecast)"
    )


def synthesis_node(state: MasterAgentState) -> Dict[str, Any]:
    route = state.get("intent_route")
    lang = state.get("language", "ar")
    output = state.get("tool_output") or {}
    card_type = state.get("card_type")
    is_ar = lang == "ar"

    if route == "security_violation":
        text = (
            "⚠️ تم إيقاف الطلب بواسطة نظام الحماية الأمني (Prompt Guard): محاولة حقن أوامر أو وصول غير مصرح به للنظام."
            if is_ar
            else "⚠️ Request blocked by Prompt Guard Security Firewall: unauthorized prompt injection detected."
        )
        return {"messages": [AIMessage(content=text)]}

    if route == "store_builder":
        store_name = output.get("store_name", "TechZone Store")
        category = output.get("product_category", "الإلكترونيات")
        theme = output.get("theme_mode", "dark")
        currency = output.get("currency", "EGP")
        text = (
            f"🎉 **تم تحليل وتجهيز متجرك الإلكتروني الجديد بنجاح!**\n\n"
            f"• **اسم المتجر:** {store_name}\n"
            f"• **النشاط والتصنيف:** {category}\n"
            f"• **السمة (Theme):** {theme.upper()} Mode\n"
            f"• **العملة:** {currency}\n"
            f"• **بوابات الدفع:** البطاقات البنكية، InstaPay، فوري، والدفع عند الاستلام (COD).\n\n"
            f"يرجى مراجعة بطاقة المعاينة أدناه والضغط على **'إطلاق المتجر الآن'** لإنشاء قاعدة البيانات وعزل المستأجر (Tenant Isolation)."
            if is_ar
            else (
                f"🎉 **Your new e-commerce storefront is configured!**\n"
                f"• Store Name: {store_name} | Category: {category} | Theme: {theme} | Currency: {currency}\n"
                f"Review the preview card below and click 'Launch Store Now' to provision."
            )
        )
        return {"messages": [AIMessage(content=text)]}

    if route == "inventory_alerts":
        alerts = output.get("alerts", [])
        text = (
            f"⚠️ **تم فحص مستودع المخزون:** تم رصد **{len(alerts)} منتجات** معرضة لخطر نفاد المخزون (Stockout Risk).\n"
            f"تم تقدير الأرباح اليومية المعرضة للخطر وتوصيات إعادة الطلب في البطاقة التفاعلية أدناه:"
            if is_ar
            else f"⚠️ **Inventory Checked:** {len(alerts)} items nearing stockout. Review recommended reorder quantities below:"
        )
        return {"messages": [AIMessage(content=text)]}

    if route == "bulk_price_preview":
        summary = output.get("summary", {})
        affected = summary.get("totalAffectedSkus", 0)
        warn_count = summary.get("negativeMarginCount", 0)
        text = (
            f"🏷️ **تم حساب أثر الخصم الجماعي (Dry-Run Preview):**\n"
            f"• عدد المنتجات المتأثرة: **{affected} منتجات**\n"
            f"• متوسط هامش الربح قبل التخفيض: **{summary.get('averageMarginBeforePct', 0):.1f}%**\n"
            f"• متوسط هامش الربح بعد التخفيض: **{summary.get('averageMarginAfterPct', 0):.1f}%**\n"
            + (f"🚨 **تحذير:** هناك {warn_count} منتج ينخفض هامش ربحه تحت الحد الآمن!\n" if warn_count > 0 else "")
            + "يرجى مراجعة الجدول والاعتماد أو الإلغاء (Human-in-the-Loop)."
            if is_ar
            else f"🏷️ Bulk price update preview calculated for {affected} SKUs. Review margins and approve below."
        )
        return {"messages": [AIMessage(content=text)]}

    if route == "analytics_sql":
        verified_sql = output.get("verifiedSql", "")
        row_count = output.get("rowCount", 0)
        chart_hint = output.get("chartHint", "bar")
        text = (
            f"📊 **نتائج التحليل المالي والمبيعات (Text-to-SQL Engine):**\n"
            f"تم توليد استعلام SQL آمن والتحقق منه عبر `sqlglot` وتنفيذه في {output.get('executionTimeMs', 30)}ms.\n"
            f"• نوع المخطط البياني الموصى به: **{chart_hint.upper()}** ({row_count} نتائج).\n"
            f"يمكنك فتح درج الاستعلام (SQL Drawer) لمشاهدة الاستعلام المنفذ."
            if is_ar
            else f"📊 Analytical results processed in {output.get('executionTimeMs', 30)}ms with {row_count} records."
        )
        return {"messages": [AIMessage(content=text)]}

    if route == "sales_forecast":
        fc = output.get("payload") or output
        prod = fc.get("product", {})
        prod_name = prod.get("name") or fc.get("product_name", "سماعة JBL Flip 6")
        totals = fc.get("totals", {})
        point = totals.get("yhat") or fc.get("point_forecast_units", 35)
        low = totals.get("yhat_lower") or fc.get("ci_lower_units", 28)
        high = totals.get("yhat_upper") or fc.get("ci_upper_units", 42)
        text = (
            f"📈 **توقعات الطلب والمبيعات لـ {prod_name}:**\n"
            f"• التوقع النقطي: **{point} وحدة** خلال الـ 30 يوماً القادمة.\n"
            f"• نطاق الثقة (90% CI): بين **{low}** و **{high} وحدة**.\n"
            f"تم احتساب تأثير أهم العوامل (العيد والموسمية، وزخم المبيعات) عبر قيم SHAP في الرسم البياني أدناه."
            if is_ar
            else f"📈 Demand forecast for {prod_name}: {point} units (CI: {low} - {high} units) over 30 days."
        )
        return {"messages": [AIMessage(content=text)]}

    if route == "customer_segments":
        text = (
            "📊 **تم تحليل شرائح العملاء بنموذج Log-RFM و K-Means (K=5):**\n"
            "تم تصنيف العملاء وتحديد الشريحة المعرضة للمغادرة (At-Risk of Churn) والشريحة الأكثر ولاءً (Champions).\n"
            "يمكنك الضغط على زر 'إطلاق كوبون' أسفل أي شريحة لتجهيز حملة مخصصة لها فوراً."
            if is_ar
            else "📊 Customer RFM segmentation completed across 5 clusters. Launch promo for targeted segments below."
        )
        return {"messages": [AIMessage(content=text)]}

    if route == "promotion_create":
        text = (
            "🎟️ **تم تجهيز حملة العروض الترويجية المستهدفة (HITL):**\n"
            "كوبون خصم 15% مخصص لشريحة العملاء المعرضين للمغادرة (At-Risk of Churn) لاستعادتهم وتحفيز إعادة الشراء.\n"
            "يرجى مراجعة أثر الإيرادات المتوقعة واعتماد الحملة لتفعيل الكوبون في المتجر."
            if is_ar
            else "🎟️ Targeted 15% discount campaign prepared. Review revenue impact and approve below."
        )
        return {"messages": [AIMessage(content=text)]}

    if route == "policy_rag":
        text = (
            f"📖 طبقاً لـ **سياسة المتجر المعتمدة وقانون حماية المستهلك المصري (رقم 181 لسنة 2018)**:\n\n"
            f"{output.get('content', '')}\n\n"
            f"📌 **المرجع القانوني:** {output.get('primary_citation', 'قانون 181 لسنة 2018')}"
            if is_ar
            else f"📖 Per Store Policy & Consumer Law:\n{output.get('content', '')}\nCitation: {output.get('primary_citation', '')}"
        )
        return {"messages": [AIMessage(content=text)]}

    if route == "preference_memory":
        text = (
            "💾 تم حفظ تفضيل التاجر في الذاكرة طويلة المدى للمتجر بنجاح."
            if is_ar
            else "💾 Merchant preference successfully saved in long-term store memory."
        )
        return {"messages": [AIMessage(content=text)]}

    # General Dialogue Fallback
    user_query = _get_human_query(state.get("messages", []))
    text = _generate_contextual_dialogue(user_query, is_ar)
    return {"messages": [AIMessage(content=text)]}


def build_master_command_graph(checkpointer: Optional[Any] = None, use_checkpointer: bool = False):
    workflow = StateGraph(MasterAgentState)

    workflow.add_node("guardrail", guardrail_node)
    workflow.add_node("context_injector", context_injector_node)
    workflow.add_node("router", router_node)
    workflow.add_node("tool_execution", tool_execution_node)
    workflow.add_node("synthesis", synthesis_node)

    workflow.add_edge(START, "guardrail")
    workflow.add_edge("guardrail", "context_injector")
    workflow.add_edge("context_injector", "router")
    workflow.add_edge("router", "tool_execution")
    workflow.add_edge("tool_execution", "synthesis")
    workflow.add_edge("synthesis", END)

    if use_checkpointer:
        if checkpointer is None:
            checkpointer = MemorySaver()
        return workflow.compile(checkpointer=checkpointer)

    return workflow.compile()
