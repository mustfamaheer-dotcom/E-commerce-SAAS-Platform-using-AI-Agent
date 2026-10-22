# backend/agent/schema_loader.py
import json
from pathlib import Path
from typing import Dict, List, Any

SCHEMA_FILE = Path(__file__).resolve().parents[2] / "Docs" / "schema_metadata.json"

class SchemaLoader:
    def __init__(self, schema_path: Path = SCHEMA_FILE):
        self.schema_path = schema_path
        self._schema_data = None

    def load_schema(self) -> Dict[str, Any]:
        if not self._schema_data:
            if self.schema_path.exists():
                with open(self.schema_path, "r", encoding="utf-8") as f:
                    self._schema_data = json.load(f)
            else:
                self._schema_data = {"tables": {}}
        return self._schema_data

    def prune_schema_for_domains(self, domains: List[str]) -> List[Dict[str, Any]]:
        full_schema = self.load_schema()
        raw_tables = full_schema.get("tables", {})
        
        if isinstance(raw_tables, dict):
            table_list = list(raw_tables.values())
        else:
            table_list = raw_tables

        if not domains:
            return table_list[:15]
            
        lower_domains = [d.lower() for d in domains]
        return [
            t for t in table_list
            if isinstance(t, dict) and (
                t.get("schema", "").lower() in lower_domains
                or t.get("domain", "").lower() in lower_domains
            )
        ]
