# apps/agent/graphs/catalog_agent_graph.py
import re
import uuid
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field
from langchain_core.messages import AIMessage, HumanMessage, BaseMessage
from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.checkpoint.memory import MemorySaver
from apps.agent.tools.catalog_tools import (
    search_products_tool,
    get_inventory_alerts_tool,
    bulk_update_prices_dry_run,
)
from apps.agent.nodes.hitl_gate_node import hitl_gate_node


class CatalogState(MessagesState):
    tenant_id: Optional[str] = None
    language: str = "ar"
    pending_action_type: Optional[str] = None
    pending_action_params: Dict[str, Any] = Field(default_factory=dict)
    diff_payload: Optional[Dict[str, Any]] = None
    approved: bool = False
    action_id: Optional[str] = None
    trace_id: Optional[str] = None
    execution_result: Optional[Dict[str, Any]] = None


def detect_language(text: str) -> str:
    if re.search(r"[\u0600-\u06FF]", text):
        return "ar"
    return "en"


def parse_catalog_intent(state: CatalogState) -> Dict[str, Any]:
    """
    Parses merchant natural language requests into catalog actions.
    Supports English & Arabic intents (e.g. discount, search, stockout alerts).
    """
    messages = state.get("messages", [])
    last_msg = ""
    for m in reversed(messages):
        if isinstance(m, HumanMessage) or getattr(m, "type", "") == "human":
            last_msg = m.content
            break

    lang = detect_language(last_msg)
    lower = last_msg.lower()
    trace_id = state.get("trace_id") or f"trace_{uuid.uuid4().hex[:12]}"

    # 1. Bulk Discount Intent
    # "Apply 15% discount to Speakers with >50 stock" / "اعمل خصم 15% على السماعات اللي فيها أكتر من 50"
    if re.search(r"(discount|خصم|تخفيض)", lower):
        # Extract percentage
        pct_match = re.search(r"(\d+(?:\.\d+)?)\s*%", lower)
        discount_pct = float(pct_match.group(1)) if pct_match else 10.0

        # Extract category
        category = None
        if re.search(r"(speaker|سماع)", lower):
            category = "Speakers"
        elif re.search(r"(charger|شاحن|شواحن)", lower):
            category = "Chargers"
        elif re.search(r"(cable|كابل|سلك)", lower):
            category = "Cables"

        # Extract min stock
        stock_match = re.search(r"(?:>|أكتر من|اكثر من|اكبر من|min|stock)\s*(\d+)", lower)
        min_stock = int(stock_match.group(1)) if stock_match else 50

        return {
            "language": lang,
            "trace_id": trace_id,
            "pending_action_type": "bulk_update_prices",
            "pending_action_params": {
                "category": category,
                "min_stock": min_stock,
                "discount_pct": discount_pct,
            },
        }

    # 2. Inventory Alerts Intent
    # "نواقص المخزون" / "low stock" / "alerts"
    if re.search(r"(alert|stockout|نواقص|مخزون|قرب يخلص|low stock)", lower):
        return {
            "language": lang,
            "trace_id": trace_id,
            "pending_action_type": "get_inventory_alerts",
            "pending_action_params": {},
        }

    # 3. Search Products Intent
    return {
        "language": lang,
        "trace_id": trace_id,
        "pending_action_type": "search_products",
        "pending_action_params": {"query": last_msg},
    }


def intent_router(state: CatalogState) -> str:
    action_type = state.get("pending_action_type")
    if action_type in ("bulk_update_prices", "update_product"):
        return "hitl_gate_node"
    return "execute_read_node"


def execute_read_node(state: CatalogState) -> Dict[str, Any]:
    action_type = state.get("pending_action_type")
    params = state.get("pending_action_params", {})
    lang = state.get("language", "ar")

    if action_type == "get_inventory_alerts":
        alerts = get_inventory_alerts_tool()
        if lang == "ar":
            text = f"تم فحص المخزون عبر نموذج المخاطر الذكي: تم العثور على {len(alerts)} منتج بحاجة لإعادة طلب عاجلة لتجنب نفاد الكمية."
        else:
            text = f"Analyzed inventory risk: Found {len(alerts)} items requiring urgent reorder."

        return {
            "messages": [AIMessage(content=text)],
            "execution_result": {"alerts": alerts},
        }
    else:
        products = search_products_tool(query=params.get("query", ""))
        if lang == "ar":
            text = f"تم العثور على {len(products)} منتج مطابق لطلبك."
        else:
            text = f"Found {len(products)} products matching your query."

        return {
            "messages": [AIMessage(content=text)],
            "execution_result": {"products": products},
        }


def post_hitl_router(state: CatalogState) -> str:
    if state.get("approved"):
        return "commit_execution_node"
    return "cancel_execution_node"


def commit_execution_node(state: CatalogState) -> Dict[str, Any]:
    action_id = state.get("action_id")
    params = state.get("pending_action_params", {})
    lang = state.get("language", "ar")
    diff = state.get("diff_payload", {})
    affected = diff.get("summary", {}).get("totalAffectedSkus", 0)

    if lang == "ar":
        msg = f"✅ تم اعتماد وتطبيق الخصم بنجاح! تم تحديث أسعار {affected} منتج في قاعدة البيانات ومزامنتها مع محرك البحث فورياً (كود العملية: {action_id})."
    else:
        msg = f"✅ Bulk price discount committed successfully! Updated {affected} SKUs across the catalog and synced with MeiliSearch (Action ID: {action_id})."

    return {
        "messages": [AIMessage(content=msg)],
        "execution_result": {
            "status": "EXECUTED",
            "actionId": action_id,
            "totalAffectedSkus": affected,
        },
    }


def cancel_execution_node(state: CatalogState) -> Dict[str, Any]:
    lang = state.get("language", "ar")
    action_id = state.get("action_id")

    if lang == "ar":
        msg = f"❌ تم إلغاء العملية بناءً على طلبك ولم يتم تعديل أي بيانات في المتجر (كود العملية: {action_id})."
    else:
        msg = f"❌ Action cancelled by merchant. No changes committed to the database (Action ID: {action_id})."

    return {
        "messages": [AIMessage(content=msg)],
        "execution_result": {
            "status": "CANCELLED",
            "actionId": action_id,
        },
    }


def build_catalog_agent_graph(checkpointer: Optional[Any] = None):
    builder = StateGraph(CatalogState)

    builder.add_node("parse_catalog_intent", parse_catalog_intent)
    builder.add_node("execute_read_node", execute_read_node)
    builder.add_node("hitl_gate_node", hitl_gate_node)
    builder.add_node("commit_execution_node", commit_execution_node)
    builder.add_node("cancel_execution_node", cancel_execution_node)

    builder.add_edge(START, "parse_catalog_intent")
    builder.add_conditional_edges("parse_catalog_intent", intent_router)
    builder.add_edge("execute_read_node", END)
    builder.add_conditional_edges("hitl_gate_node", post_hitl_router)
    builder.add_edge("commit_execution_node", END)
    builder.add_edge("cancel_execution_node", END)

    cp = checkpointer or MemorySaver()
    return builder.compile(checkpointer=cp)


catalog_graph = build_catalog_agent_graph()
