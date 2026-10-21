# apps/agent/nodes/hitl_gate_node.py
import time
import uuid
from typing import Dict, Any, Optional
from langgraph.types import interrupt
from apps.agent.tools.catalog_tools import (
    bulk_update_prices_dry_run,
    update_product_dry_run,
)


def log_langfuse_trace(trace_id: str, step_name: str, duration_ms: float, metadata: Dict[str, Any]):
    """
    Simulates / emits structured Langfuse trace span (trace_id, step_name, duration, metadata).
    """
    print(
        f"[Langfuse Trace] trace_id={trace_id} step={step_name} duration={duration_ms:.2f}ms metadata={metadata}"
    )


def hitl_gate_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Human-In-The-Loop Interrupt Gate.
    1. Executes dry-run without mutating database.
    2. Evaluates margin safety guardrails (new_price < cost).
    3. Emits Langfuse trace span.
    4. Triggers LangGraph interrupt() streaming GenUI diff payload to merchant.
    """
    start_time = time.time()
    trace_id = state.get("trace_id") or f"trace_{uuid.uuid4().hex[:12]}"
    action_type = state.get("pending_action_type", "bulk_update_prices")
    action_params = state.get("pending_action_params", {})
    language = state.get("language", "ar")

    diff_payload: Dict[str, Any] = {}

    if action_type == "bulk_update_prices":
        category = action_params.get("category")
        min_stock = action_params.get("min_stock")
        discount_pct = float(action_params.get("discount_pct", 0.0))

        diff_payload = bulk_update_prices_dry_run(
            category=category,
            min_stock=min_stock,
            discount_pct=discount_pct,
        )
    elif action_type == "update_product":
        product_id = action_params.get("product_id", "")
        fields = action_params.get("fields", {})
        diff_payload = update_product_dry_run(product_id=product_id, fields=fields)

    duration_ms = (time.time() - start_time) * 1000
    has_margin_warning = False
    if "summary" in diff_payload:
        has_margin_warning = diff_payload["summary"].get("negativeMarginCount", 0) > 0
    elif diff_payload.get("marginWarning"):
        has_margin_warning = True

    log_langfuse_trace(
        trace_id=trace_id,
        step_name="hitl_dry_run",
        duration_ms=duration_ms,
        metadata={
            "action_type": action_type,
            "has_margin_warning": has_margin_warning,
            "affected_skus": diff_payload.get("summary", {}).get("totalAffectedSkus", 1),
        },
    )

    # Human-In-The-Loop Interrupt Payload streamed to frontend GenUI
    interrupt_data = {
        "type": "HITL_CONFIRMATION_REQUIRED",
        "actionId": diff_payload.get("actionId"),
        "actionType": action_type,
        "diffPayload": diff_payload,
        "marginWarning": has_margin_warning,
        "message": (
            "⚠️ تنبيه حماية هامش الربح: تم رصد منتجات سيصبح سعرها أقل من سعر التكلفة! يرجى مراجعة الجدول والموافقة."
            if has_margin_warning and language == "ar"
            else "الرجاء مراجعة التغييرات المقترحة على المنتجات والموافقة عليها لتطبيقها في قاعدة البيانات."
            if language == "ar"
            else "Please review proposed price changes and confirm execution."
        ),
    }

    # Suspend LangGraph execution until merchant confirms via UI
    resume_payload = interrupt(interrupt_data)

    # Return updated state upon resumption
    return {
        "diff_payload": diff_payload,
        "approved": resume_payload.get("approved", False) if isinstance(resume_payload, dict) else False,
        "action_id": diff_payload.get("actionId"),
        "resume_data": resume_payload,
    }
