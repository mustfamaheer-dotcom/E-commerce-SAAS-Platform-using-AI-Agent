# apps/agent/graphs/forecast_agent_graph.py
"""LangGraph workflow for Retaj's sales forecasting slice."""
import re
from typing import Any, Dict, Optional

from langchain_core.messages import AIMessage, HumanMessage
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, MessagesState, StateGraph

from apps.agent.tools.forecast_tools import render_forecast_advice, run_sales_forecast


class ForecastState(MessagesState):
    tenant_id: str = "tenant-demo-01"
    language: str = "ar"
    product_query: str = ""
    horizon_days: int = 30
    forecast_result: Optional[Dict[str, Any]] = None
    card_type: Optional[str] = None


INTENT_PATTERNS = [
    r"توقع", r"متوقع", r"كام", r"كم وحدة", r"هبيع", r"مبيعات", r"طلب", r"مخزون",
    r"forecast", r"how many", r"will i sell", r"demand", r"units", r"restock", r"stock",
]

PRODUCT_CLEANUP_PATTERNS = [
    r"\b(كام|كم|وحدة|وحدات|هبيع|هبيعها|مبيعات|توقع|متوقع|الشهر|الجاي|القادم|الأسبوع|الاسبوع)\b",
    r"\b(من|على|عن|المنتج|منتج|في|هو|هي)\b",
    r"\b(next|this|month|week|forecast|sales|for|of|the|how|many|units|will|sell|demand|stock|inventory|restock|please)\b",
]


def detect_language(text: str) -> str:
    return "ar" if re.search(r"[\u0600-\u06FF]", text) else "en"


def extract_horizon_days(text: str) -> int:
    lower = text.lower()
    if re.search(r"(أسبوعين|اسبوعين|two weeks|14)", lower):
        return 14
    if re.search(r"(أسبوع|اسبوع|week|7)", lower):
        return 7
    if re.search(r"(شهر|month|30)", lower):
        return 30
    return 30


def extract_product_query(text: str) -> str:
    cleaned = text
    for pattern in PRODUCT_CLEANUP_PATTERNS:
        cleaned = re.sub(pattern, " ", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"[؟?,.!،:]+", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned or text


def parse_forecast_intent(state: ForecastState) -> Dict[str, Any]:
    messages = state.get("messages", [])
    last_message = ""
    for message in reversed(messages):
        if isinstance(message, HumanMessage) or getattr(message, "type", "") == "human":
            last_message = message.content
            break

    return {
        "language": detect_language(last_message),
        "horizon_days": extract_horizon_days(last_message),
        "product_query": extract_product_query(last_message),
    }


def forecast_node(state: ForecastState) -> Dict[str, Any]:
    result = run_sales_forecast.invoke(
        {
            "product_id_or_name": state.get("product_query", ""),
            "horizon_days": state.get("horizon_days", 30),
            "tenant_id": state.get("tenant_id", "tenant-demo-01"),
        }
    )
    return {
        "forecast_result": result,
        "card_type": result.get("card_type") if result.get("success") else None,
    }


def synthesis_node(state: ForecastState) -> Dict[str, Any]:
    result = state.get("forecast_result") or {}
    language = state.get("language", "ar")

    if not result.get("success"):
        error = result.get("error")
        if error == "ambiguous_product":
            candidates = result.get("candidates", [])
            names = "، ".join(candidate["name"] for candidate in candidates)
            text = (
                f"لقيت أكتر من منتج مطابق: {names}. تحب أحسب توقعات أنهي واحد؟"
                if language == "ar"
                else f"I found multiple matching products: {names}. Which one should I forecast?"
            )
        else:
            text = (
                "معلش، مقدرتش ألاقي المنتج المطلوب. جرّب تكتب اسم المنتج أو الـ SKU."
                if language == "ar"
                else "I could not find that product. Please provide the product name or SKU."
            )
        return {"messages": [AIMessage(content=text)]}

    payload = result["payload"]
    advice = render_forecast_advice(payload, language=language)
    return {"messages": [AIMessage(content=advice)]}


def build_forecast_agent_graph(checkpointer: Optional[Any] = None):
    builder = StateGraph(ForecastState)
    builder.add_node("parse_forecast_intent", parse_forecast_intent)
    builder.add_node("forecast_node", forecast_node)
    builder.add_node("synthesis_node", synthesis_node)

    builder.add_edge(START, "parse_forecast_intent")
    builder.add_edge("parse_forecast_intent", "forecast_node")
    builder.add_edge("forecast_node", "synthesis_node")
    builder.add_edge("synthesis_node", END)

    checkpoint = checkpointer or MemorySaver()
    return builder.compile(checkpointer=checkpoint)


forecast_agent_graph = build_forecast_agent_graph()
