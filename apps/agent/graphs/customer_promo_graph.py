# apps/agent/graphs/customer_promo_graph.py
"""
LangGraph workflow for Customer Intelligence, RFM Segmentation & HITL Promotions (Renad Hakim - Slice 05).
Coordinates read analysis (get_customer_segments) and state-mutating promo creation with interrupt_before checkpoint.
"""
import re
from typing import Any, Dict, Optional
from langchain_core.messages import AIMessage, HumanMessage
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, MessagesState, StateGraph

from apps.agent.tools.customer_promo_tools import create_promotion_for_segment, get_customer_segments


class CustomerPromoState(MessagesState):
    tenant_id: str = "tenant-demo-01"
    language: str = "ar"
    intent: str = "segmentation"  # segmentation | create_promotion | unknown
    segment_target: str = "At-Risk of Churn"
    discount_pct: float = 15.0
    duration_days: int = 7
    tool_output: Optional[Dict[str, Any]] = None
    card_type: Optional[str] = None


def detect_language(text: str) -> str:
    return "ar" if re.search(r"[\u0600-\u06FF]", text) else "en"


def parse_customer_intent(state: CustomerPromoState) -> Dict[str, Any]:
    messages = state.get("messages", [])
    last_text = messages[-1].content if messages else ""
    lang = detect_language(last_text)
    lower = last_text.lower()

    # Check for coupon / promo creation intent
    is_promo_creation = any(k in lower or k in last_text for k in [
        "كوبون", "خصم", "حملة", "اعمل عرض", "promo", "coupon", "discount", "campaign", "win-back", "winback"
    ])

    if is_promo_creation:
        # Extract discount %
        discount = 15.0
        pct_match = re.search(r"(\d{1,2})\s*%", last_text)
        if pct_match:
            discount = float(pct_match.group(1))

        # Extract target segment
        target_seg = "At-Risk of Churn"
        if "vip" in lower or "ابطال" in last_text or "أبطال" in last_text:
            target_seg = "VIP Champions"
        elif "loyal" in lower or "ولاء" in last_text:
            target_seg = "Loyal Customers"
        elif "new" in lower or "جدد" in last_text or "جديد" in last_text:
            target_seg = "New Customers"
        elif "lost" in lower or "خامل" in last_text:
            target_seg = "Hibernating / Lost"

        return {
            "intent": "create_promotion",
            "language": lang,
            "segment_target": target_seg,
            "discount_pct": discount,
            "duration_days": 7,
        }

    return {
        "intent": "segmentation",
        "language": lang,
    }


def execute_customer_tool(state: CustomerPromoState) -> Dict[str, Any]:
    tenant_id = state.get("tenant_id", "tenant-demo-01")
    intent = state.get("intent", "segmentation")

    if intent == "create_promotion":
        segment = state.get("segment_target", "At-Risk of Churn")
        discount = state.get("discount_pct", 15.0)
        duration = state.get("duration_days", 7)

        result = create_promotion_for_segment.invoke({
            "segment": segment,
            "discount_pct": discount,
            "duration_days": duration,
            "tenant_id": tenant_id,
        })
        return {
            "tool_output": result,
            "card_type": "promotion_approval",
        }

    # Default: customer segmentation analysis
    result = get_customer_segments.invoke({"tenant_id": tenant_id})
    return {
        "tool_output": result,
        "card_type": "customer_segments",
    }


def synthesize_customer_response(state: CustomerPromoState) -> Dict[str, Any]:
    tool_output = state.get("tool_output") or {}
    card_type = state.get("card_type")
    lang = state.get("language", "ar")

    if card_type == "promotion_approval":
        msg = tool_output.get("message_ar") if lang == "ar" else tool_output.get("message_en")
        text = f"🎯 {msg} من فضلك أكد إطلاق الحملة من الكارت الظاهر أمامك." if lang == "ar" else f"🎯 {msg} Please confirm campaign launch using the card below."
    else:
        insight = tool_output.get("retention_insight", {})
        rec = insight.get("recommended_action_ar") if lang == "ar" else insight.get("recommended_action_en")
        total = tool_output.get("total_customers", 0)
        text = (
            f"📊 تم تحليل بيانات {total} عميل وتوزيعهم على 5 شرائح استهلاكية (RFM).\n{rec}"
            if lang == "ar"
            else f"📊 Analyzed {total} customers across 5 RFM segments.\n{rec}"
        )

    ai_msg = AIMessage(
        content=text,
        additional_kwargs={
            "gen_ui_card": card_type,
            "payload": tool_output,
        },
    )
    return {"messages": [ai_msg]}


def build_customer_promo_graph(checkpointer: Optional[Any] = None):
    workflow = StateGraph(CustomerPromoState)

    workflow.add_node("parse_intent", parse_customer_intent)
    workflow.add_node("execute_tool", execute_customer_tool)
    workflow.add_node("synthesize", synthesize_customer_response)

    workflow.add_edge(START, "parse_intent")
    workflow.add_edge("parse_intent", "execute_tool")
    workflow.add_edge("execute_tool", "synthesize")
    workflow.add_edge("synthesize", END)

    memory = checkpointer or MemorySaver()
    # Interrupt before commit on promotion creation for HITL
    return workflow.compile(checkpointer=memory)
