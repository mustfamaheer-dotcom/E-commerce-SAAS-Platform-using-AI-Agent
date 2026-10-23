import sys, os
sys.path.insert(0, os.path.abspath("."))
from backend.db.database import engine
from sqlalchemy import text

conn = engine.connect()
tables = [r[0] for r in conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")).fetchall()]
print(f"Found {len(tables)} tables in PostgreSQL:")
total = 0
for t in sorted(tables):
    try:
        cnt = conn.execute(text(f'SELECT COUNT(*) FROM "{t}"')).scalar()
        print(f"  {t}: {cnt:,} rows")
        total += cnt
    except Exception as e:
        print(f"  {t}: ERROR ({e})")
print(f"Total rows in PostgreSQL: {total:,}")
conn.close()
