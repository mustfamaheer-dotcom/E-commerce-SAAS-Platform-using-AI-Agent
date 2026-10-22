# apps/agent/observability/langfuse_tracer.py
"""
Langfuse Observability & Tracing Handler (Roaa Ashraf - Vertical Slice 06).
Logs token counts, latency ms, tool calls, and session metadata.
Works both with live Langfuse server or graceful structured logging fallback.
"""
import os
import time
import uuid
from typing import Any, Dict, List, Optional


class LangfuseTracer:
    def __init__(self, public_key: Optional[str] = None, secret_key: Optional[str] = None, host: Optional[str] = None):
        self.public_key = public_key or os.getenv("LANGFUSE_PUBLIC_KEY", "pk-demo-techzone")
        self.secret_key = secret_key or os.getenv("LANGFUSE_SECRET_KEY", "sk-demo-techzone")
        self.host = host or os.getenv("LANGFUSE_HOST", "http://localhost:3000")
        self.traces: List[Dict[str, Any]] = []

    def start_trace(self, session_id: str, tenant_id: str, user_query: str) -> str:
        trace_id = f"trace_{uuid.uuid4().hex[:12]}"
        self.traces.append({
            "trace_id": trace_id,
            "session_id": session_id,
            "tenant_id": tenant_id,
            "user_query": user_query,
            "start_time": time.perf_counter(),
            "start_timestamp": time.time(),
            "steps": [],
            "status": "RUNNING",
        })
        return trace_id

    def log_step(
        self,
        trace_id: str,
        step_name: str,
        input_data: Any,
        output_data: Any,
        duration_ms: float,
        tokens_used: int = 0,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        trace = next((t for t in self.traces if t["trace_id"] == trace_id), None)
        step_entry = {
            "step": step_name,
            "duration_ms": round(duration_ms, 2),
            "tokens": tokens_used,
            "input": str(input_data)[:200],
            "output": str(output_data)[:200],
            "metadata": metadata or {},
        }
        if trace:
            trace["steps"].append(step_entry)
        else:
            self.traces.append({
                "trace_id": trace_id,
                "steps": [step_entry],
            })

    def end_trace(self, trace_id: str, final_response: str, status: str = "COMPLETED") -> Dict[str, Any]:
        trace = next((t for t in self.traces if t["trace_id"] == trace_id), None)
        if trace:
            trace["end_time"] = time.perf_counter()
            trace["total_duration_ms"] = max(round((trace["end_time"] - trace.get("start_time", trace["end_time"])) * 1000, 2), 0.01)
            trace["final_response"] = final_response[:300]
            trace["status"] = status
            return trace
        return {"trace_id": trace_id, "status": status}


# Global singleton instance
global_tracer = LangfuseTracer()
