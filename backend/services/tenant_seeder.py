# backend/services/tenant_seeder.py
import json
import random
import uuid
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.models import Tenant, User

def to_json_str(val):
    if isinstance(val, (dict, list)):
        return json.dumps(val, ensure_ascii=False)
    return val

def seed_tenant_from_demo(db: Session, target_tenant_id: str, source_tenant_id: str = "tenant-moustafa-tech"):
    """
    Clones categories, products, variants, customers, coupons, orders, order logs,
    and analytics_daily from source_tenant to target_tenant.
    """
    # 1. Verify target exists
    target = db.query(Tenant).filter_by(id=target_tenant_id).first()
    if not target:
        raise ValueError(f"Target tenant {target_tenant_id} does not exist.")

    # Check if target already has products or orders
    check_sql = text("SELECT COUNT(*) FROM products WHERE tenant_id = :tid")
    existing_count = db.execute(check_sql, {"tid": target_tenant_id}).scalar()
    if existing_count and existing_count > 0:
        print(f"Tenant {target_tenant_id} already has {existing_count} products. Skipping seeding.")
        return

    # Clear any existing data for clean re-seeding
    db.execute(text("DELETE FROM order_status_log WHERE order_id IN (SELECT id FROM orders WHERE tenant_id = :tid)"), {"tid": target_tenant_id})
    db.execute(text("DELETE FROM orders WHERE tenant_id = :tid"), {"tid": target_tenant_id})
    db.execute(text("DELETE FROM coupons WHERE tenant_id = :tid"), {"tid": target_tenant_id})
    db.execute(text("DELETE FROM customers WHERE tenant_id = :tid"), {"tid": target_tenant_id})
    db.execute(text("DELETE FROM product_variants WHERE product_id IN (SELECT id FROM products WHERE tenant_id = :tid)"), {"tid": target_tenant_id})
    db.execute(text("DELETE FROM products WHERE tenant_id = :tid"), {"tid": target_tenant_id})
    db.execute(text("DELETE FROM categories WHERE tenant_id = :tid"), {"tid": target_tenant_id})
    db.execute(text("DELETE FROM analytics_daily WHERE tenant_id = :tid"), {"tid": target_tenant_id})
    db.commit()

    # Find owner user for target tenant if any
    owner_user = db.query(User).filter_by(tenant_id=target_tenant_id).first()
    owner_user_id = owner_user.id if owner_user else None

    print(f"Seeding tenant '{target_tenant_id}' from '{source_tenant_id}'...")

    # 2. Categories
    cat_rows = db.execute(
        text("SELECT id, name_ar, name_en, slug, parent_id, image_url, sort_order, is_active FROM categories WHERE tenant_id = :src"),
        {"src": source_tenant_id}
    ).fetchall()

    cat_id_map = {}
    for r in cat_rows:
        old_id = r[0]
        new_id = f"cat_{target_tenant_id}_{uuid.uuid4().hex[:8]}"
        cat_id_map[old_id] = new_id

    # Insert root categories first, then child
    for r in cat_rows:
        old_id, name_ar, name_en, slug, parent_id, image_url, sort_order, is_active = r
        new_id = cat_id_map[old_id]
        new_parent_id = cat_id_map.get(parent_id) if parent_id else None
        db.execute(
            text("""
                INSERT INTO categories (id, tenant_id, name_ar, name_en, slug, parent_id, image_url, sort_order, is_active)
                VALUES (:id, :tenant_id, :name_ar, :name_en, :slug, :parent_id, :image_url, :sort_order, :is_active)
            """),
            {
                "id": new_id,
                "tenant_id": target_tenant_id,
                "name_ar": name_ar,
                "name_en": name_en,
                "slug": f"{slug}-{uuid.uuid4().hex[:4]}",
                "parent_id": new_parent_id,
                "image_url": image_url,
                "sort_order": sort_order,
                "is_active": is_active,
            }
        )
    db.flush()
    print(f"  Cloned {len(cat_rows)} categories.")

    # 3. Products
    prod_rows = db.execute(
        text("""
            SELECT id, category_id, name_ar, name_en, slug, description_ar, description_en,
                   price, cost_price, compare_price, sku, stock_qty, low_stock_threshold,
                   images, attributes, is_active, featured
            FROM products WHERE tenant_id = :src
        """),
        {"src": source_tenant_id}
    ).fetchall()

    prod_id_map = {}
    for r in prod_rows:
        old_id = r[0]
        new_id = f"prod_{target_tenant_id}_{uuid.uuid4().hex[:8]}"
        prod_id_map[old_id] = new_id

    for r in prod_rows:
        old_id, cat_id, name_ar, name_en, slug, desc_ar, desc_en, price, cost_price, comp_price, sku, stock_qty, low_stock, images, attrs, is_active, feat = r
        new_id = prod_id_map[old_id]
        new_cat_id = cat_id_map.get(cat_id)
        db.execute(
            text("""
                INSERT INTO products (
                    id, tenant_id, category_id, name_ar, name_en, slug, description_ar, description_en,
                    price, cost_price, compare_price, sku, stock_qty, low_stock_threshold,
                    images, attributes, is_active, featured
                ) VALUES (
                    :id, :tenant_id, :cat_id, :name_ar, :name_en, :slug, :desc_ar, :desc_en,
                    :price, :cost_price, :comp_price, :sku, :stock_qty, :low_stock,
                    :images, :attributes, :is_active, :featured
                )
            """),
            {
                "id": new_id,
                "tenant_id": target_tenant_id,
                "cat_id": new_cat_id,
                "name_ar": name_ar,
                "name_en": name_en,
                "slug": f"{slug}-{uuid.uuid4().hex[:4]}",
                "desc_ar": desc_ar,
                "desc_en": desc_en,
                "price": price,
                "cost_price": cost_price,
                "comp_price": comp_price,
                "sku": f"{sku}-{uuid.uuid4().hex[:4]}",
                "stock_qty": stock_qty,
                "low_stock": low_stock,
                "images": to_json_str(images),
                "attributes": to_json_str(attrs),
                "is_active": is_active,
                "featured": feat,
            }
        )
    db.flush()
    print(f"  Cloned {len(prod_rows)} products.")

    # 4. Product Variants
    if prod_id_map:
        old_prod_ids = list(prod_id_map.keys())
        var_rows = db.execute(
            text("SELECT id, product_id, name, sku, price_modifier, stock_qty, attributes FROM product_variants WHERE product_id = ANY(:pids)"),
            {"pids": old_prod_ids}
        ).fetchall()

        for r in var_rows:
            old_vid, old_pid, name, sku, pmod, sqty, vattrs = r
            new_pid = prod_id_map.get(old_pid)
            if new_pid:
                new_vid = f"var_{target_tenant_id}_{uuid.uuid4().hex[:8]}"
                db.execute(
                    text("""
                        INSERT INTO product_variants (id, product_id, name, sku, price_modifier, stock_qty, attributes)
                        VALUES (:id, :pid, :name, :sku, :pmod, :sqty, :vattrs)
                    """),
                    {
                        "id": new_vid,
                        "pid": new_pid,
                        "name": name,
                        "sku": f"{sku}-{uuid.uuid4().hex[:4]}",
                        "pmod": pmod,
                        "sqty": sqty,
                        "vattrs": to_json_str(vattrs),
                    }
                )
        db.flush()
        print(f"  Cloned {len(var_rows)} product variants.")

    # 5. Customers
    cust_rows = db.execute(
        text("""
            SELECT id, name, phone, email, governorate, city, address, total_orders, total_spent, last_order_at, created_at
            FROM customers WHERE tenant_id = :src
        """),
        {"src": source_tenant_id}
    ).fetchall()

    for r in cust_rows:
        old_id, cname, phone, email, gov, city, addr, tot_ord, tot_spent, last_ord, cat = r
        new_cid = f"cust_{target_tenant_id}_{uuid.uuid4().hex[:8]}"
        new_phone = f"{phone[:8]}{random.randint(100, 999)}" if phone else phone
        new_email = f"{uuid.uuid4().hex[:6]}_{email}" if email else None
        db.execute(
            text("""
                INSERT INTO customers (id, tenant_id, name, phone, email, governorate, city, address, total_orders, total_spent, last_order_at, created_at)
                VALUES (:id, :tenant_id, :name, :phone, :email, :gov, :city, :addr, :tot_ord, :tot_spent, :last_ord, :cat)
            """),
            {
                "id": new_cid,
                "tenant_id": target_tenant_id,
                "name": cname,
                "phone": new_phone,
                "email": new_email,
                "gov": gov,
                "city": city,
                "addr": addr,
                "tot_ord": tot_ord,
                "tot_spent": tot_spent,
                "last_ord": last_ord,
                "cat": cat,
            }
        )
    db.flush()
    print(f"  Cloned {len(cust_rows)} customers.")

    # 6. Coupons
    coup_rows = db.execute(
        text("SELECT id, code, type, value, min_order, max_uses, used_count, is_active, expires_at, created_at FROM coupons WHERE tenant_id = :src"),
        {"src": source_tenant_id}
    ).fetchall()
    for r in coup_rows:
        old_id, code, ctype, val, min_o, max_u, ucnt, act, exp, cat = r
        new_cid = f"cpn_{target_tenant_id}_{uuid.uuid4().hex[:8]}"
        db.execute(
            text("""
                INSERT INTO coupons (id, tenant_id, code, type, value, min_order, max_uses, used_count, is_active, expires_at, created_at)
                VALUES (:id, :tenant_id, :code, :type, :value, :min_order, :max_uses, :used_count, :is_active, :expires_at, :created_at)
            """),
            {
                "id": new_cid,
                "tenant_id": target_tenant_id,
                "code": f"{code}_{target_tenant_id[-6:]}",
                "type": ctype,
                "value": val,
                "min_order": min_o,
                "max_uses": max_u,
                "used_count": ucnt,
                "is_active": act,
                "expires_at": exp,
                "created_at": cat,
            }
        )
    db.flush()
    print(f"  Cloned {len(coup_rows)} coupons.")

    # 7. Orders & Order Status Log
    ord_rows = db.execute(
        text("""
            SELECT id, status, items, subtotal, shipping_cost, discount, total,
                   payment_method, payment_status, payment_ref, bosta_tracking_number,
                   shipping_address, created_at, updated_at
            FROM orders WHERE tenant_id = :src
        """),
        {"src": source_tenant_id}
    ).fetchall()

    ord_id_map = {}
    for r in ord_rows:
        old_id = r[0]
        new_id = f"ord_{target_tenant_id}_{uuid.uuid4().hex[:8]}"
        ord_id_map[old_id] = new_id

    for r in ord_rows:
        old_id, status, items, subtotal, shipping_cost, discount, total, pmethod, pstat, pref, bosta, ship_addr, cat, uat = r
        new_id = ord_id_map[old_id]
        db.execute(
            text("""
                INSERT INTO orders (
                    id, tenant_id, user_id, status, items, subtotal, shipping_cost, discount, total,
                    payment_method, payment_status, payment_ref, bosta_tracking_number,
                    shipping_address, created_at, updated_at
                ) VALUES (
                    :id, :tenant_id, :user_id, :status, :items, :subtotal, :shipping_cost, :discount, :total,
                    :pmethod, :pstat, :pref, :bosta, :ship_addr, :cat, :uat
                )
            """),
            {
                "id": new_id,
                "tenant_id": target_tenant_id,
                "user_id": owner_user_id,
                "status": status,
                "items": to_json_str(items),
                "subtotal": subtotal,
                "shipping_cost": shipping_cost,
                "discount": discount,
                "total": total,
                "pmethod": pmethod,
                "pstat": pstat,
                "pref": pref,
                "bosta": bosta,
                "ship_addr": to_json_str(ship_addr),
                "cat": cat,
                "uat": uat,
            }
        )
    db.flush()
    print(f"  Cloned {len(ord_rows)} orders.")

    # 8. Order Status Log
    if ord_id_map:
        old_ord_ids = list(ord_id_map.keys())
        log_rows = db.execute(
            text("SELECT id, order_id, status, note, created_by, created_at FROM order_status_log WHERE order_id = ANY(:oids)"),
            {"oids": old_ord_ids}
        ).fetchall()

        for r in log_rows:
            old_lid, old_oid, lstat, lnote, lby, lcat = r
            new_oid = ord_id_map.get(old_oid)
            if new_oid:
                new_lid = f"osl_{target_tenant_id}_{uuid.uuid4().hex[:8]}"
                db.execute(
                    text("""
                        INSERT INTO order_status_log (id, order_id, status, note, created_by, created_at)
                        VALUES (:id, :order_id, :status, :note, :created_by, :created_at)
                    """),
                    {
                        "id": new_lid,
                        "order_id": new_oid,
                        "status": lstat,
                        "note": lnote,
                        "created_by": lby,
                        "created_at": lcat,
                    }
                )
        db.flush()
        print(f"  Cloned {len(log_rows)} order status logs.")

    # 9. Analytics Daily
    ad_rows = db.execute(
        text("SELECT id, date, orders_count, revenue, new_customers, top_products FROM analytics_daily WHERE tenant_id = :src"),
        {"src": source_tenant_id}
    ).fetchall()

    for r in ad_rows:
        old_id, dt, o_cnt, rev, new_c, top_p = r
        new_adid = f"ad_{target_tenant_id}_{uuid.uuid4().hex[:8]}"
        db.execute(
            text("""
                INSERT INTO analytics_daily (id, tenant_id, date, orders_count, revenue, new_customers, top_products)
                VALUES (:id, :tenant_id, :date, :orders_count, :revenue, :new_customers, :top_products)
            """),
            {
                "id": new_adid,
                "tenant_id": target_tenant_id,
                "date": dt,
                "orders_count": o_cnt,
                "revenue": rev,
                "new_customers": new_c,
                "top_products": to_json_str(top_p),
            }
        )
    db.flush()
    print(f"  Cloned {len(ad_rows)} analytics_daily records.")

    db.commit()
    print(f"Successfully seeded tenant {target_tenant_id}!")
