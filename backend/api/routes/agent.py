# backend/api/routes/agent.py
import json
import uuid
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from langchain_core.messages import HumanMessage

from backend.db.database import get_db
from backend.models import AgentSession, AgentMessage, AgentAction
from backend.agent.erp_agent import get_erp_agent

router = APIRouter(prefix="/agent", tags=["AI Agent Command Center"])


class SessionCreatePayload(BaseModel):
    title: Optional[str] = "محادثة جديدة"


class ChatMessagePayload(BaseModel):
    message: str
    session_id: Optional[str] = None
    tenant_id: Optional[str] = "tenant-moustafa-tech"


@router.get("/sessions")
def list_sessions(tenant_id: str = "tenant-moustafa-tech", db: Session = Depends(get_db)):
    sessions = (
        db.query(AgentSession)
        .filter_by(tenant_id=tenant_id)
        .order_by(AgentSession.created_at.desc())
        .all()
    )
    return [
        {
            "id": s.id,
            "title": s.title,
            "createdAt": s.created_at.isoformat() if s.created_at else None,
        }
        for s in sessions
    ]


@router.post("/sessions")
def create_session(payload: SessionCreatePayload, tenant_id: str = "tenant-moustafa-tech", db: Session = Depends(get_db)):
    sess_id = f"sess_{uuid.uuid4().hex[:8]}"
    sess = AgentSession(
        id=sess_id,
        tenant_id=tenant_id,
        title=payload.title or "محادثة جديدة",
    )
    db.add(sess)
    db.commit()
    db.refresh(sess)
    return {"id": sess.id, "title": sess.title}


@router.get("/sessions/{session_id}")
def get_session_history(session_id: str, db: Session = Depends(get_db)):
    sess = db.query(AgentSession).filter_by(id=session_id).first()
    if not sess:
        # Auto-create session if not present (prevents console 404 on sess_default)
        sess = AgentSession(
            id=session_id,
            tenant_id="tenant-moustafa-tech",
            title="محادثة رئيسية" if session_id == "sess_default" else "محادثة جديدة",
        )
        db.add(sess)
        db.commit()
        db.refresh(sess)

    messages = (
        db.query(AgentMessage)
        .filter_by(session_id=session_id)
        .order_by(AgentMessage.created_at.asc())
        .all()
    )
    return {
        "session": {"id": sess.id, "title": sess.title},
        "messages": [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "cardType": m.card_type,
                "payload": m.payload,
                "createdAt": m.created_at.isoformat() if m.created_at else None,
            }
            for m in messages
        ],
    }


@router.delete("/sessions/{session_id}")
def delete_session(session_id: str, db: Session = Depends(get_db)):
    sess = db.query(AgentSession).filter_by(id=session_id).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(sess)
    db.commit()
    return {"status": "success", "message": "تم حذف جلسة المحادثة بنجاح"}


@router.post("/chat")
def process_agent_chat(payload: ChatMessagePayload, db: Session = Depends(get_db)):
    tenant_id = payload.tenant_id or "tenant-moustafa-tech"
    session_id = payload.session_id

    # Create session if none exists
    if not session_id:
        session_id = f"sess_{uuid.uuid4().hex[:8]}"
        title = payload.message[:35] + ("..." if len(payload.message) > 35 else "")
        new_sess = AgentSession(id=session_id, tenant_id=tenant_id, title=title)
        db.add(new_sess)
        db.commit()

    # Save user message
    user_msg_id = f"msg_{uuid.uuid4().hex[:8]}"
    u_msg = AgentMessage(
        id=user_msg_id,
        session_id=session_id,
        role="user",
        content=payload.message,
    )
    db.add(u_msg)
    db.commit()

    # Load recent conversation history (last 10 messages)
    db_history = (
        db.query(AgentMessage)
        .filter_by(session_id=session_id)
        .order_by(AgentMessage.created_at.asc())
        .all()
    )
    history_messages = []
    for m in db_history[-10:]:
        if m.role == "user":
            history_messages.append(HumanMessage(content=m.content))
        else:
            from langchain_core.messages import AIMessage
            history_messages.append(AIMessage(content=m.content))

    # Invoke real LangGraph agent
    agent = get_erp_agent()
    state = {
        "messages": history_messages if history_messages else [HumanMessage(content=payload.message)],
        "tenant_id": tenant_id,
        "session_id": session_id,
    }
    result = agent.invoke(state)

    messages = result.get("messages", [])
    reply_text = messages[-1].content if messages else "تم تنفيذ طلبك بنجاح."
    card_type = result.get("card_type", "text")
    tool_output = result.get("tool_result") or {}

    # Save assistant message
    ai_msg_id = f"msg_{uuid.uuid4().hex[:8]}"
    ai_msg = AgentMessage(
        id=ai_msg_id,
        session_id=session_id,
        role="assistant",
        content=reply_text,
        card_type=card_type,
        payload=tool_output,
    )
    db.add(ai_msg)
    db.commit()

    return {
        "sessionId": session_id,
        "reply": reply_text,
        "cardType": card_type,
        "payload": tool_output,
    }
