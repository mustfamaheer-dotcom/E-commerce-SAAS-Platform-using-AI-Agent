# backend/agent/sql_executor.py
import time
from typing import Dict, Any, List
from apps.agent.tools.analytics_tools import execute_safe_sql_query

class SqlExecutor:
    def __init__(self, tenant_id: str = "tenant-demo-01"):
        self.tenant_id = tenant_id

    def execute(self, sql: str) -> Dict[str, Any]:
        result = execute_safe_sql_query(sql, tenant_id=self.tenant_id)
        return result
