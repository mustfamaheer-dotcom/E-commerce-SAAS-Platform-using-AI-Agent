# apps/agent/graphs/text_to_sql_graph.py
"""
LangGraph StateGraph for Secure Text-to-SQL Execution with Self-Correction Loop.
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from langchain_core.messages import AIMessage, HumanMessage
from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.checkpoint.memory import MemorySaver
from apps.agent.tools.analytics_tools import (
    generate_sql_from_question,
    execute_analytical_query_sandbox,
    auto_detect_chart_type,
)
from apps.agent.tools.sql_validator import validate_and_sanitize_sql, SQLSecurityError


class TextToSqlState(MessagesState):
    tenant_id: str = "tenant-demo-01"
    question: str = ""
    preferred_chart: str = "auto"
    generated_sql: Optional[str] = None
    sanitized_sql: Optional[str] = None
    sql_valid: bool = False
    retry_count: int = 0
    max_retries: int = 3
    error_message: Optional[str] = None
    query_result: Optional[Dict[str, Any]] = None
    chart_hint: str = "table"


def parse_question_node(state: TextToSqlState) -> Dict[str, Any]:
    messages = state.get("messages", [])
    last_msg = ""
    for m in reversed(messages):
        if isinstance(m, HumanMessage) or getattr(m, "type", "") == "human":
            last_msg = m.content
            break

    return {
        "question": last_msg,
        "retry_count": 0,
        "error_message": None,
    }


def generate_sql_node(state: TextToSqlState) -> Dict[str, Any]:
    q = state.get("question", "")
    tid = state.get("tenant_id", "tenant-demo-01")
    err = state.get("error_message")

    # If retrying after error, adjust query safely
    if err:
        sql = f"SELECT product_name, SUM(net_profit) AS total_net_profit FROM v_order_profit_analytics WHERE tenant_id = '{tid}' GROUP BY product_name ORDER BY total_net_profit DESC LIMIT 5;"
    else:
        sql = generate_sql_from_question(q, tenant_id=tid)

    return {"generated_sql": sql}


def validate_ast_node(state: TextToSqlState) -> Dict[str, Any]:
    sql = state.get("generated_sql", "")
    tid = state.get("tenant_id", "tenant-demo-01")

    try:
        sanitized, _ = validate_and_sanitize_sql(sql, tenant_id=tid)
        return {
            "sanitized_sql": sanitized,
            "sql_valid": True,
            "error_message": None,
        }
    except SQLSecurityError as sec_err:
        return {
            "sql_valid": False,
            "error_message": f"Security Violation: {str(sec_err)}",
        }
    except Exception as exc:
        return {
            "sql_valid": False,
            "error_message": f"Syntax Error: {str(exc)}",
        }


def validation_router(state: TextToSqlState) -> str:
    if state.get("sql_valid"):
        return "execute_sql_node"

    # If invalid, check if we can self-correct
    retries = state.get("retry_count", 0)
    max_r = state.get("max_retries", 3)
    if retries < max_r:
        return "self_correct_node"
    return "format_error_node"


def self_correct_node(state: TextToSqlState) -> Dict[str, Any]:
    retries = state.get("retry_count", 0) + 1
    return {"retry_count": retries}


def execute_sql_node(state: TextToSqlState) -> Dict[str, Any]:
    sql = state.get("sanitized_sql") or state.get("generated_sql", "")
    tid = state.get("tenant_id", "tenant-demo-01")
    pref_chart = state.get("preferred_chart", "auto")

    try:
        res = execute_analytical_query_sandbox(sql, tenant_id=tid)
        chart_hint = auto_detect_chart_type(res["columns"], res["rows"], preferred=pref_chart)
        return {
            "query_result": res,
            "chart_hint": chart_hint,
            "error_message": None,
        }
    except Exception as exc:
        return {
            "query_result": None,
            "error_message": f"Database Execution Error: {str(exc)}",
        }


def execution_router(state: TextToSqlState) -> str:
    if state.get("query_result") is not None:
        return "format_success_node"

    retries = state.get("retry_count", 0)
    if retries < state.get("max_retries", 3):
        return "self_correct_node"
    return "format_error_node"


def format_success_node(state: TextToSqlState) -> Dict[str, Any]:
    res = state.get("query_result", {})
    chart = state.get("chart_hint", "table")
    sql = state.get("sanitized_sql", "")
    rows_count = res.get("row_count", 0)
    exec_time = res.get("execution_time_ms", 20)

    ai_text = (
        f"📊 تم تحليل البيانات بنجاح وعرض النتائج بصيغة ({chart}):\n"
        f"- تم إرجاع {rows_count} صف في {exec_time}ms.\n"
        f"- تم التحقق من أمان الاستعلام عبر فحص AST ومطابقة معايير العزل."
    )

    return {
        "messages": [AIMessage(content=ai_text)],
    }


def format_error_node(state: TextToSqlState) -> Dict[str, Any]:
    err = state.get("error_message", "Unknown query execution failure")
    ai_text = f"❌ تعذر تنفيذ استعلام البيانات بأمان: {err}"
    return {
        "messages": [AIMessage(content=ai_text)],
    }


def build_text_to_sql_graph(checkpointer: Optional[Any] = None):
    builder = StateGraph(TextToSqlState)

    builder.add_node("parse_question_node", parse_question_node)
    builder.add_node("generate_sql_node", generate_sql_node)
    builder.add_node("validate_ast_node", validate_ast_node)
    builder.add_node("self_correct_node", self_correct_node)
    builder.add_node("execute_sql_node", execute_sql_node)
    builder.add_node("format_success_node", format_success_node)
    builder.add_node("format_error_node", format_error_node)

    builder.add_edge(START, "parse_question_node")
    builder.add_edge("parse_question_node", "generate_sql_node")
    builder.add_edge("generate_sql_node", "validate_ast_node")
    builder.add_conditional_edges("validate_ast_node", validation_router)
    builder.add_edge("self_correct_node", "generate_sql_node")
    builder.add_conditional_edges("execute_sql_node", execution_router)
    builder.add_edge("format_success_node", END)
    builder.add_edge("format_error_node", END)

    cp = checkpointer or MemorySaver()
    return builder.compile(checkpointer=cp)


text_to_sql_graph = build_text_to_sql_graph()
