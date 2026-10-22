# backend/api/routes/schema.py
from fastapi import APIRouter, Query
from typing import Optional, List
from backend.agent.schema_loader import SchemaLoader

router = APIRouter(prefix="/schema", tags=["Schema"])
loader = SchemaLoader()

@router.get("")
def get_schema(domain: Optional[str] = Query(None)):
    domains = [domain] if domain else []
    tables = loader.prune_schema_for_domains(domains)
    return {"total_tables": len(tables), "tables": tables}
