# apps/agent/nodes/memory_context_node.py
"""
3-Tier Conversational Context & Memory Injector (Roaa Ashraf - Vertical Slice 06).
Injects:
  - Tier 1: Fixed Store Context (tenant id, store name, default currency, active theme)
  - Tier 2: Persistent Long-Term Merchant Preferences (merchant_memories)
  - Tier 3: Rolling Short-Term Session Window (last K=10 turns)
"""
from typing import Any, Dict, List, Optional
from langchain_core.messages import BaseMessage, SystemMessage

# In-memory store for merchant preferences when running offline / mock
_MERCHANT_PREFERENCES_STORE: Dict[str, Dict[str, str]] = {
    "tenant-demo-01": {
        "default_forecast_horizon": "14",
        "default_shipping_carrier": "Bosta",
        "preferred_currency": "EGP",
        "auto_restock_threshold": "15",
    }
}


def get_merchant_preferences(tenant_id: str) -> Dict[str, str]:
    return _MERCHANT_PREFERENCES_STORE.get(tenant_id, {
        "default_forecast_horizon": "14",
        "preferred_currency": "EGP",
    })


def set_merchant_preference(tenant_id: str, key: str, value: str) -> None:
    if tenant_id not in _MERCHANT_PREFERENCES_STORE:
        _MERCHANT_PREFERENCES_STORE[tenant_id] = {}
    _MERCHANT_PREFERENCES_STORE[tenant_id][key] = value


def build_3tier_system_prompt(
    tenant_id: str = "tenant-demo-01",
    store_name: str = "TechZone Electronics Cairo",
    currency: str = "EGP",
) -> str:
    """
    Constructs the 3-tier memory system prompt injected before LLM execution.
    """
    # Tier 1: Fixed Store Context
    tier1 = f"[Tier 1: Store Context]\n- Tenant ID: {tenant_id}\n- Store Name: {store_name}\n- Base Currency: {currency}\n- Primary Market: Egypt (EGP)"

    # Tier 2: Long-Term Merchant Preferences
    prefs = get_merchant_preferences(tenant_id)
    pref_lines = "\n".join([f"- {k}: {v}" for k, v in prefs.items()])
    tier2 = f"[Tier 2: Long-Term Merchant Preferences]\n{pref_lines}"

    # Tier 3: Instruction on Short-Term Dialogue
    tier3 = "[Tier 3: Dialogue Memory Policy]\n- Retain context from previous conversation turns.\n- When generating recommendations, respect merchant preferences (e.g. default horizons and thresholds)."

    return f"{tier1}\n\n{tier2}\n\n{tier3}"


def inject_memory_context(state: Dict[str, Any], k_window: int = 10) -> Dict[str, Any]:
    """
    State modifier node that trims history to K turns and prepends 3-tier SystemMessage.
    """
    tenant_id = state.get("tenant_id", "tenant-demo-01")
    messages: List[BaseMessage] = state.get("messages", [])

    # Trim to last K turns
    windowed = messages[-k_window:] if len(messages) > k_window else messages

    # Prepend 3-tier system context
    sys_prompt = build_3tier_system_prompt(tenant_id=tenant_id)
    enriched_messages = [SystemMessage(content=sys_prompt)] + [
        m for m in windowed if not isinstance(m, SystemMessage)
    ]

    return {
        "messages": enriched_messages,
        "tenant_id": tenant_id,
        "preferences": get_merchant_preferences(tenant_id),
    }
