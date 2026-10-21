# apps/ml/src/routers/agent_chat.py
from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from langchain_core.messages import HumanMessage
from apps.agent.graphs.master_command_graph import build_master_command_graph

router = APIRouter(prefix="/ml/v1/agent", tags=["AI Agent Command Center"])

# Lazy-loaded singleton master graph
_master_graph = None

def get_graph():
    global _master_graph
    if _master_graph is None:
        _master_graph = build_master_command_graph()
    return _master_graph


class ChatRequest(BaseModel):
    message: str = Field(..., description="User prompt or merchant instruction")
    session_id: Optional[str] = Field("session_default", description="Conversation session ID")
    tenant_id: Optional[str] = Field("tenant-demo-01", description="Multi-tenant store ID")
    language: Optional[str] = Field("ar", description="Preferred response language ('ar' or 'en')")


class ChatResponse(BaseModel):
    reply: str
    card_type: Optional[str] = None
    payload: Optional[Dict[str, Any]] = None
    security_flag: bool = False
    trace_id: Optional[str] = None
    intent_route: Optional[str] = None


@router.post("/chat", response_model=ChatResponse)
async def process_agent_chat(request: ChatRequest):
    """
    Unified AI Agent entrypoint for TechZone E-Commerce & ERP:
    - Multi-Turn Store Builder
    - Catalog & Pricing ERP (HITL)
    - Stockout Risk Alerts
    - Text-to-SQL Analytics
    - ML Sales Forecasting with SHAP
    - Customer RFM Segmentation & Promos
    - Store Policy RAG (Law 181/2018)
    - Prompt Guard Security
    """
    try:
        graph = get_graph()
        initial_state = {
            "messages": [HumanMessage(content=request.message)],
            "session_id": request.session_id,
            "tenant_id": request.tenant_id,
            "language": request.language,
        }

        result = graph.invoke(initial_state)

        messages = result.get("messages", [])
        last_message = messages[-1].content if messages else "No response generated."
        card_type = result.get("card_type")
        tool_output = result.get("tool_output") or {}
        security_flag = result.get("security_flag", False)
        trace_id = result.get("trace_id")
        intent_route = result.get("intent_route")

        return ChatResponse(
            reply=last_message,
            card_type=card_type,
            payload=tool_output,
            security_flag=security_flag,
            trace_id=trace_id,
            intent_route=intent_route,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Agent execution error: {str(e)}")
