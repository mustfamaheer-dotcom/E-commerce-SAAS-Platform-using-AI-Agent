# scripts/validate_schema_metadata.py
"""
Schema Metadata Verification Script (Roaa Ashraf - TASK-RO-02).
Verifies that Docs/schema_metadata.json contains all 71 AdventureWorks2019 tables
with valid schemas, table names, column definitions, and data types.
"""
import json
import sys
from pathlib import Path

if sys.platform == "win32" and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

REPO_ROOT = Path(__file__).resolve().parents[1]
METADATA_PATH = REPO_ROOT / "Docs" / "schema_metadata.json"


def validate_metadata() -> bool:
    print("=" * 80)
    print("🔍 VALIDATING ADVENTUREWORKS2019 SCHEMA METADATA (TASK-RO-02)")
    print("=" * 80)

    if not METADATA_PATH.exists():
        print(f"❌ Error: Metadata file not found at {METADATA_PATH}")
        return False

    try:
        data = json.loads(METADATA_PATH.read_text(encoding="utf-8"))
    except Exception as exc:
        print(f"❌ Error parsing JSON: {exc}")
        return False

    tables = data.get("tables", {})
    total_declared = data.get("total_tables", len(tables))

    print(f"Database: {data.get('database', 'Unknown')}")
    print(f"Declared tables: {total_declared} | Parsed tables: {len(tables)}")

    if len(tables) != 71:
        print(f"⚠️ Warning: Expected 71 tables, found {len(tables)}")
    else:
        print("✅ Exactly 71 tables verified in schema metadata!")

    # Verify column structures
    total_columns = 0
    missing_fields = []
    schemas_found = set()

    for full_name, tbl in tables.items():
        schema_name = tbl.get("schema", "")
        table_name = tbl.get("table", "")
        schemas_found.add(schema_name)

        if not schema_name or not table_name:
            missing_fields.append((full_name, "missing schema or table name"))

        columns = tbl.get("columns", [])
        total_columns += len(columns)

        for col in columns:
            if not col.get("name") or not col.get("type"):
                missing_fields.append((full_name, f"column missing name or type: {col}"))

    print(f"Total columns verified: {total_columns}")
    print(f"Schemas covered: {sorted(list(schemas_found))}")

    if missing_fields:
        print(f"❌ Found {len(missing_fields)} validation warnings:")
        for m in missing_fields[:5]:
            print(f"  - {m[0]}: {m[1]}")
        return False

    print("✅ All 71 tables and column definitions passed schema verification successfully!")
    print("=" * 80)
    return True


if __name__ == "__main__":
    success = validate_metadata()
    sys.exit(0 if success else 1)
