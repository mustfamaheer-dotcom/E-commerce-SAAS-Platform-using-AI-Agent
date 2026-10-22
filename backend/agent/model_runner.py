# backend/agent/model_runner.py
from typing import Dict, Any, Optional
from apps.agent.graphs.master_command_graph import build_master_command_graph

class ModelRunner:
    def __init__(self):
        self.graph = build_master_command_graph()

    def run_query(self, message: str, tenant_id: str = "tenant-demo-01", session_id: str = "sess_default") -> Dict[str, Any]:
        from langchain_core.messages import HumanMessage
        state = {
            "messages": [HumanMessage(content=message)],
            "tenant_id": tenant_id,
            "session_id": session_id,
        }
        res = self.graph.invoke(state)
        last_msg = res["messages"][-1].content
        return {
            "response": last_msg,
            "session_id": session_id,
            "tenant_id": tenant_id,
        }
