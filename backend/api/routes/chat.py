# backend/api/routes/chat.py
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from backend.agent.model_runner import ModelRunner

router = APIRouter(prefix="/chat", tags=["Chat"])
runner = ModelRunner()

class ChatRequest(BaseModel):
    message: str = Field(..., description="User query in Egyptian Arabic or English")
    session_id: Optional[str] = Field("sess_default", description="Conversation session ID")
    tenant_id: Optional[str] = Field("tenant-demo-01", description="Tenant ID")

@router.post("")
def chat_endpoint(req: ChatRequest, x_tenant_id: Optional[str] = Header(None)):
    tenant = x_tenant_id or req.tenant_id or "tenant-demo-01"
    try:
        result = runner.run_query(req.message, tenant_id=tenant, session_id=req.session_id)
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
