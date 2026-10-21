# apps/agent/graphs/onboarding_graph.py
import os
import re
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field
from langchain_core.messages import AIMessage, HumanMessage, BaseMessage
from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.types import interrupt
from apps.agent.tools.store_builder_tools import create_store_tenant

# 1. Pydantic Slot Definition
class OnboardingSlots(BaseModel):
    store_name: Optional[str] = Field(None, description="Name of the store (e.g. 'TechZone')")
    product_category: Optional[str] = Field(None, description="Primary product category")
    theme_mode: Optional[Literal["dark", "light"]] = Field("light", description="Theme mode preference")
    currency: Optional[Literal["EGP", "USD", "SAR"]] = Field("EGP", description="Store billing currency")
    payment_methods: Optional[List[str]] = Field(default_factory=lambda: ["cod", "card"], description="Payment methods")
    shipping_policy: Optional[str] = Field(None, description="Shipping policy details")


class OnboardingState(MessagesState):
    slots: OnboardingSlots = Field(default_factory=OnboardingSlots)
    missing_slots: List[str] = Field(default_factory=list)
    language: str = "en"
    confirmed: bool = False
    tenant_id: Optional[str] = None


REQUIRED_SLOTS = ["store_name", "currency", "payment_methods"]


def detect_language(text: str) -> str:
    """Detect if input contains Arabic characters."""
    if re.search(r"[\u0600-\u06FF]", text):
        return "ar"
    return "en"


def extract_slots_node(state: OnboardingState) -> Dict[str, Any]:
    """Slot extractor analyzing conversation turns."""
    messages = state.get("messages", [])
    if not messages:
        return {}

    last_user_msg = ""
    for m in reversed(messages):
        if isinstance(m, HumanMessage) or getattr(m, "type", "") == "human":
            last_user_msg = m.content
            break

    lang = detect_language(last_user_msg)
    slots = state.get("slots") or OnboardingSlots()
    slots_dict = slots.model_dump()

    # Rule-based / NLP pattern extraction
    # Currency
    if re.search(r"\b(egp|جنيه|مصر|le)\b", last_user_msg, re.IGNORECASE):
        slots_dict["currency"] = "EGP"
    elif re.search(r"\b(usd|dollar|دولار)\b", last_user_msg, re.IGNORECASE):
        slots_dict["currency"] = "USD"
    elif re.search(r"\b(sar|ريال|سعودي)\b", last_user_msg, re.IGNORECASE):
        slots_dict["currency"] = "SAR"

    # Theme
    if re.search(r"(dark|داكن|اسود|black|ليلي|الوضع الليلي|الوضع الداكن)", last_user_msg, re.IGNORECASE):
        slots_dict["theme_mode"] = "dark"
    elif re.search(r"(light|فاتح|ابيض|white|نهاري|الوضع الفاتح|الوضع النهاري)", last_user_msg, re.IGNORECASE):
        slots_dict["theme_mode"] = "light"

    # Store Name extraction
    name_match = re.search(
        r"(?:called|named|اسم المتجر|اسمه|متجر)\s+([A-Za-z0-9\u0600-\u06FF\s_-]{2,30})",
        last_user_msg,
        re.IGNORECASE,
    )
    if name_match and not slots_dict.get("store_name"):
        raw_name = name_match.group(1)
        cleaned_name = re.split(r"\s+(?:in|في|بالوضع|مع|ب)\s+", raw_name)[0].strip()
        slots_dict["store_name"] = cleaned_name

    updated_slots = OnboardingSlots(**slots_dict)
    missing = [s for s in REQUIRED_SLOTS if not getattr(updated_slots, s)]

    return {
        "slots": updated_slots,
        "missing_slots": missing,
        "language": lang,
    }


def onboarding_router(state: OnboardingState) -> str:
    """Decide next step based on slot completeness."""
    if state.get("missing_slots"):
        return "ask_followup"
    return "preview_and_confirm"


def ask_followup_node(state: OnboardingState) -> Dict[str, Any]:
    """Ask targeted questions in merchant's language for missing slots."""
    missing = state.get("missing_slots", [])
    lang = state.get("language", "en")

    prompts = {
        "en": {
            "store_name": "What is the name of your store? (e.g., 'TechZone Store')",
            "currency": "Which currency would you like to set? (EGP, USD, or SAR)",
            "payment_methods": "What payment gateways should be active? (Cash on Delivery, Credit Card, InstaPay)",
        },
        "ar": {
            "store_name": "ما هو اسم المتجر الذي ترغب في إنشائه؟ (مثال: 'تك زون')",
            "currency": "ما هي العملة المفضلة لمتجرك؟ (جنيه مصري EGP، دولار USD، أو ريال سعودي SAR)",
            "payment_methods": "ما هي طرق الدفع المفضلة؟ (دفع عند الاستلام، بطاقات بنكية، إنستاباي)",
        },
    }

    target_slot = missing[0] if missing else "store_name"
    question = prompts.get(lang, prompts["en"]).get(
        target_slot, f"Please provide details for: {target_slot}"
    )

    return {"messages": [AIMessage(content=question)]}


def preview_and_confirm_node(state: OnboardingState) -> Dict[str, Any]:
    """Render preview card and wait for merchant HITL confirmation."""
    slots = state["slots"]
    lang = state.get("language", "en")

    preview_payload = {
        "type": "store_creation_preview",
        "data": slots.model_dump(),
    }

    # LangGraph Human-in-the-Loop Interrupt
    confirmation = interrupt(preview_payload)

    if confirmation and confirmation.get("approved"):
        result = create_store_tenant.invoke({
            "name": slots.store_name,
            "currency": slots.currency or "EGP",
            "theme": {
                "mode": slots.theme_mode or "light",
                "primaryColor": "#0284c7" if slots.theme_mode == "dark" else "#4F46E5",
                "backgroundColor": "#0f172a" if slots.theme_mode == "dark" else "#F8FAFC",
            },
            "payment_methods": slots.payment_methods or ["cod", "card"],
            "shipping_policy": slots.shipping_policy or "Standard fast shipping",
        })

        success_msg = (
            f"🎉 تم إنشاء متجرك '{slots.store_name}' بنجاح مع عزل كامل للبيانات!"
            if lang == "ar"
            else f"🎉 Store '{slots.store_name}' has been successfully provisioned with full multi-tenant isolation!"
        )

        tenant_id = result.get("tenant", {}).get("id") or result.get("id")
        return {
            "messages": [AIMessage(content=success_msg)],
            "tenant_id": tenant_id,
            "confirmed": True,
        }
    else:
        cancel_msg = (
            "❌ تم إلغاء عملية بناء المتجر. يمكنك إعادة إخباري بتفضيلاتك في أي وقت."
            if lang == "ar"
            else "❌ Store creation cancelled. Let me know whenever you're ready to adjust settings."
        )
        return {
            "messages": [AIMessage(content=cancel_msg)],
            "confirmed": False,
        }


def build_onboarding_graph():
    """Compile the LangGraph Onboarding State Graph."""
    builder = StateGraph(OnboardingState)

    builder.add_node("extract_slots", extract_slots_node)
    builder.add_node("ask_followup", ask_followup_node)
    builder.add_node("preview_and_confirm", preview_and_confirm_node)

    builder.add_edge(START, "extract_slots")
    builder.add_conditional_edges("extract_slots", onboarding_router, {
        "ask_followup": "ask_followup",
        "preview_and_confirm": "preview_and_confirm",
    })
    builder.add_edge("ask_followup", "extract_slots")
    builder.add_edge("preview_and_confirm", END)

    return builder.compile()
