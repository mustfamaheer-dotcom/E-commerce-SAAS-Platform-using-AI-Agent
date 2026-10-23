import sys, os
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.abspath("."))
from backend.db.database import engine
from sqlalchemy import text

conn = engine.connect()
print("Tenants in PostgreSQL DB:")
for r in conn.execute(text("SELECT id, name, slug FROM tenants")).fetchall():
    t_id = r[0]
    p_cnt = conn.execute(text(f"SELECT COUNT(*) FROM products WHERE tenant_id='{t_id}'")).scalar()
    o_cnt = conn.execute(text(f"SELECT COUNT(*) FROM orders WHERE tenant_id='{t_id}'")).scalar()
    c_cnt = conn.execute(text(f"SELECT COUNT(*) FROM customers WHERE tenant_id='{t_id}'")).scalar()
    cat_cnt = conn.execute(text(f"SELECT COUNT(*) FROM categories WHERE tenant_id='{t_id}'")).scalar()
    print(f"  Tenant: {t_id} ({r[1]}) -> Products: {p_cnt:,}, Orders: {o_cnt:,}, Customers: {c_cnt:,}, Categories: {cat_cnt:,}")

total_all = conn.execute(text("SELECT COUNT(*) FROM orders")).scalar()
print(f"Total orders in DB: {total_all:,}")
total_prods = conn.execute(text("SELECT COUNT(*) FROM products")).scalar()
print(f"Total products in DB: {total_prods:,}")
conn.close()
