# backend/api/routes/agent.py
import json
import uuid
import asyncio
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from langchain_core.messages import HumanMessage, AIMessage

from backend.db.database import get_db, SessionLocal
from backend.models import AgentSession, AgentMessage, AgentAction
from backend.agent.erp_agent import get_erp_agent
from backend.agent.streaming_utils import format_sse_event, throttle_tokens, THINKING_MIN_SECONDS
from backend.agent.session_manager import auto_title_session, extract_context_slots

router = APIRouter(prefix="/agent", tags=["AI Agent Command Center"])


class SessionCreatePayload(BaseModel):
    title: Optional[str] = "محادثة جديدة"
    tenant_id: Optional[str] = None


class SessionUpdatePayload(BaseModel):
    title: Optional[str] = None


class ChatMessagePayload(BaseModel):
    message: Optional[str] = None
    query: Optional[str] = None
    content: Optional[str] = None
    session_id: Optional[str] = None
    tenant_id: str = "tenant-moustafa-tech"

    @property
    def effective_message(self) -> str:
        return (self.message or self.query or self.content or "").strip()


@router.get("/sessions")
def list_sessions(tenant_id: Optional[str] = None, db: Session = Depends(get_db)):
    if not tenant_id:
        return []
    query = db.query(AgentSession)
    if tenant_id != "all":
        query = query.filter_by(tenant_id=tenant_id)
    sessions = query.order_by(AgentSession.created_at.desc()).all()
    return [
        {
            "id": s.id,
            "title": s.title,
            "createdAt": s.created_at.isoformat() if s.created_at else None,
        }
        for s in sessions
    ]


@router.post("/sessions")
def create_session(payload: SessionCreatePayload, tenant_id: Optional[str] = None, db: Session = Depends(get_db)):
    actual_tid = payload.tenant_id or tenant_id or "tenant-moustafa-tech"
    sess_id = f"sess_{uuid.uuid4().hex[:8]}"
    sess = AgentSession(
        id=sess_id,
        tenant_id=actual_tid,
        title=payload.title or "محادثة جديدة",
    )
    db.add(sess)
    db.commit()
    db.refresh(sess)
    return {"id": sess.id, "title": sess.title, "tenant_id": sess.tenant_id}


@router.get("/sessions/{session_id}")
def get_session_history(session_id: str, tenant_id: Optional[str] = None, db: Session = Depends(get_db)):
    sess = db.query(AgentSession).filter_by(id=session_id).first()
    if not sess:
        if tenant_id and tenant_id != "all":
            sess = AgentSession(
                id=session_id,
                tenant_id=tenant_id,
                title="محادثة رئيسية",
            )
            db.add(sess)
            db.commit()
            db.refresh(sess)
        else:
            return {"session": {"id": session_id, "title": "محادثة جديدة"}, "messages": []}
    elif tenant_id and tenant_id != "all" and sess.tenant_id != tenant_id:
        return {
            "session": {"id": session_id, "title": "محادثة جديدة"},
            "messages": [],
        }

    messages = (
        db.query(AgentMessage)
        .filter_by(session_id=sess.id)
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
def delete_session(session_id: str, tenant_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(AgentSession).filter_by(id=session_id)
    if tenant_id and tenant_id != "all":
        query = query.filter_by(tenant_id=tenant_id)
    sess = query.first()
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(sess)
    db.commit()
    return {"status": "success", "message": "تم حذف جلسة المحادثة بنجاح"}


@router.patch("/sessions/{session_id}")
def update_session(session_id: str, payload: SessionUpdatePayload, tenant_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(AgentSession).filter_by(id=session_id)
    if tenant_id and tenant_id != "all":
        query = query.filter_by(tenant_id=tenant_id)
    sess = query.first()
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    if payload.title is not None and payload.title.strip():
        sess.title = payload.title.strip()
        db.commit()
        db.refresh(sess)
    return {"status": "success", "session": {"id": sess.id, "title": sess.title}}


@router.post("/chat")
def process_agent_chat(payload: ChatMessagePayload, db: Session = Depends(get_db)):
    tenant_id = payload.tenant_id
    session_id = payload.session_id

    msg_text = payload.effective_message

    # Cross-tenant safety check
    is_new = False
    if session_id:
        existing_sess = db.query(AgentSession).filter_by(id=session_id).first()
        if not existing_sess:
            new_sess = AgentSession(id=session_id, tenant_id=tenant_id, title=msg_text[:35])
            db.add(new_sess)
            db.commit()
            is_new = True
        elif existing_sess.tenant_id != tenant_id:
            session_id = f"sess_{uuid.uuid4().hex[:8]}"
            new_sess = AgentSession(id=session_id, tenant_id=tenant_id, title=msg_text[:35])
            db.add(new_sess)
            db.commit()
            is_new = True
    else:
        session_id = f"sess_{uuid.uuid4().hex[:8]}"
        title = msg_text[:35] + ("..." if len(msg_text) > 35 else "")
        new_sess = AgentSession(id=session_id, tenant_id=tenant_id, title=title)
        db.add(new_sess)
        db.commit()
        is_new = True

    # Save user message
    user_msg_id = f"msg_{uuid.uuid4().hex[:8]}"
    u_msg = AgentMessage(
        id=user_msg_id,
        session_id=session_id,
        role="user",
        content=msg_text,
    )
    db.add(u_msg)
    db.commit()

    # Load 20 recent messages
    db_history = (
        db.query(AgentMessage)
        .filter_by(session_id=session_id)
        .order_by(AgentMessage.created_at.asc())
        .all()
    )
    history_messages = []
    for m in db_history[-20:]:
        if m.role == "user":
            history_messages.append(HumanMessage(content=m.content))
        else:
            history_messages.append(AIMessage(content=m.content))

    agent = get_erp_agent()
    slots = extract_context_slots(db_history)
    state = {
        "messages": history_messages if history_messages else [HumanMessage(content=payload.message)],
        "tenant_id": tenant_id,
        "session_id": session_id,
        "context_slots": slots,
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


@router.post("/chat/stream")
async def stream_agent_chat(payload: ChatMessagePayload):
    """
    Server-Sent Events endpoint for streaming agent responses.
    Emits:
      - thinking: agent is reasoning or fetching data
      - tool_call: tool is executing
      - token: streaming typewriter token
      - card: rich generated UI card payload
      - done: stream finished with final output
      - error: error occurred
    """
    tenant_id = payload.tenant_id
    session_id = payload.session_id or f"sess_{uuid.uuid4().hex[:8]}"

    stream_msg = payload.effective_message

    async def event_generator():
        db = SessionLocal()
        try:
            # Session verification
            existing_sess = db.query(AgentSession).filter_by(id=session_id).first()
            if not existing_sess:
                new_sess = AgentSession(id=session_id, tenant_id=tenant_id, title=stream_msg[:35])
                db.add(new_sess)
                db.commit()

            # Save user message
            user_msg_id = f"msg_{uuid.uuid4().hex[:8]}"
            u_msg = AgentMessage(
                id=user_msg_id,
                session_id=session_id,
                role="user",
                content=stream_msg,
            )
            db.add(u_msg)
            db.commit()

            # 1. Multi-Step Deep Thinking Phase
            yield format_sse_event("thinking", {
                "status": "thinking",
                "step": 1,
                "message": "🧠 تحليل الاستعلام واستنباط الأهداف التجارية...",
            })
            await asyncio.sleep(0.7)

            yield format_sse_event("thinking", {
                "status": "thinking",
                "step": 2,
                "message": "📊 استعلام قاعدة البيانات ومطابقة سجلات المبيعات الحية...",
            })
            await asyncio.sleep(0.7)

            yield format_sse_event("thinking", {
                "status": "thinking",
                "step": 3,
                "message": "💡 صياغة الاستجابة الاستشارية الذكية والتوصيات المباشرة...",
            })
            await asyncio.sleep(0.5)

            # 2. History & state
            db_history = (
                db.query(AgentMessage)
                .filter_by(session_id=session_id)
                .order_by(AgentMessage.created_at.asc())
                .all()
            )
            history_messages = []
            for m in db_history[-20:]:
                if m.role == "user":
                    history_messages.append(HumanMessage(content=m.content))
                else:
                    history_messages.append(AIMessage(content=m.content))

            agent = get_erp_agent()
            slots = extract_context_slots(db_history)
            state = {
                "messages": history_messages,
                "tenant_id": tenant_id,
                "session_id": session_id,
                "context_slots": slots,
            }

            # 3. Execution
            yield format_sse_event("tool_call", {
                "tool": "erp_execution_engine",
                "status": "running",
                "message": "جاري معالجة البيانات واستخراج النتائج...",
            })

            result = agent.invoke(state)
            messages = result.get("messages", [])
            reply_text = messages[-1].content if messages else "تم تنفيذ طلبك بنجاح."
            card_type = result.get("card_type", "text")
            tool_output = result.get("tool_result") or {}

            # 4. Emit rich card if any
            if card_type and card_type != "text":
                yield format_sse_event("card", {
                    "card_type": card_type,
                    "payload": tool_output.get("payload", tool_output),
                })

            # 5. Stream response tokens (typewriter feel)
            async for chunk in throttle_tokens(reply_text, chunk_size=4):
                yield format_sse_event("token", {"token": chunk})

            # 6. Save assistant message to DB
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

            # 7. Done event
            yield format_sse_event("done", {
                "status": "complete",
                "sessionId": session_id,
                "reply": reply_text,
                "cardType": card_type,
                "payload": tool_output,
            })

            # Auto-title in background if needed
            if len(db_history) <= 2:
                asyncio.create_task(auto_title_session(session_id, stream_msg, tenant_id))

        except Exception as e:
            yield format_sse_event("error", {"error": str(e), "message": "حدث خطأ أثناء معالجة الطلب."})
        finally:
            db.close()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
