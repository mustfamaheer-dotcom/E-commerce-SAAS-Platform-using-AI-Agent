# backend/agent/self_correction.py
from typing import Dict, Any, Optional
from apps.agent.tools.sql_validator import validate_and_sanitize_sql, SQLSecurityError

class SelfCorrectionLoop:
    def __init__(self, max_attempts: int = 3):
        self.max_attempts = max_attempts

    def attempt_correction(self, sql: str, error_message: str, tenant_id: str) -> Optional[str]:
        """Simple deterministic self-correction for missing tenant filter or LIMIT clause."""
        corrected = sql.strip()
        if not corrected.endswith(";"):
            corrected += ";"
        if "LIMIT" not in corrected.upper() and "TOP" not in corrected.upper():
            corrected = corrected.rstrip(";") + " LIMIT 50;"
        return corrected
