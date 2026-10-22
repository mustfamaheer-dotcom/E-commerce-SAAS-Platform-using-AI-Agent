#!/usr/bin/env python3
"""
High-Performance ERP & E-Commerce 30,000-Row Dataset Generator for PostgreSQL.
Generates a complete, highly realistic multi-tenant dataset tailored to TechZone ERP.

Tables Populated:
  1. tenants (5 rows)
  2. store_settings (5 rows)
  3. theme_config (5 rows)
  4. users (25 rows)
  5. categories (80 rows)
  6. products (2,500 rows)
  7. product_variants (3,500 rows)
  8. customers (4,000 rows)
  9. coupons (50 rows)
 10. orders (14,000 rows)
 11. order_status_log (5,000 rows)
 12. analytics_daily (830 rows)
 ------------------------------------------
 Total exact rows: 30,000 rows
"""

import sys
import os
import json
import random
import uuid
import datetime
from pathlib import Path
from typing import List, Dict, Any

# Ensure UTF-8 output on Windows consoles
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Seed for reproducible high-quality data
random.seed(42)

# Date boundaries: Jan 1, 2024 to Oct 22, 2026 (~1025 days)
START_DATE = datetime.datetime(2024, 1, 1, 0, 0, 0, tzinfo=datetime.timezone.utc)
END_DATE = datetime.datetime(2026, 10, 22, 17, 30, 0, tzinfo=datetime.timezone.utc)
TOTAL_DAYS = (END_DATE - START_DATE).days

def random_date(start: datetime.datetime = START_DATE, end: datetime.datetime = END_DATE) -> datetime.datetime:
    delta = end - start
    random_seconds = random.randint(0, int(delta.total_seconds()))
    return start + datetime.timedelta(seconds=random_seconds)

def escape_sql(value: Any) -> str:
    if value is None:
        return "NULL"
    elif isinstance(value, bool):
        return "TRUE" if value else "FALSE"
    elif isinstance(value, (int, float)):
        return str(value)
    elif isinstance(value, (dict, list)):
        dumped = json.dumps(value, ensure_ascii=False).replace("'", "''")
        return f"'{dumped}'::jsonb"
    elif isinstance(value, datetime.datetime):
        return f"'{value.strftime('%Y-%m-%d %H:%M:%S%z')}'"
    elif isinstance(value, datetime.date):
        return f"'{value.strftime('%Y-%m-%d')}'"
    else:
        escaped = str(value).replace("'", "''")
        return f"'{escaped}'"

# --- Master Dictionaries for Realistic E-Commerce / Tech ERP ---
TENANT_DEFS = [
    {
        "id": "tenant-moustafa-tech",
        "slug": "-moustafa-tech--102",
        "name": "Moustafa Tech",
        "display_name": "Moustafa Tech — بيع موبايلات وإلكترونيات",
        "contact_email": "owner@moustafatech.eg",
        "phone": "+20 100 123 4567",
        "currency": "EGP",
        "sector": "electronics",
        "primary_color": "#0ea5e9",
        "secondary_color": "#6366f1",
        "accent_color": "#10b981",
    },
    {
        "id": "tenant-cairo-tech",
        "slug": "cairo-tech-hub",
        "name": "Cairo Tech Hub",
        "display_name": "كايرو تك هب — لابتوبات وتجهيزات قيمنق",
        "contact_email": "sales@cairotechhub.com",
        "phone": "+20 101 987 6543",
        "currency": "EGP",
        "sector": "gaming_laptops",
        "primary_color": "#8b5cf6",
        "secondary_color": "#ec4899",
        "accent_color": "#eab308",
    },
    {
        "id": "tenant-alex-gadgets",
        "slug": "alex-smart-gadgets",
        "name": "Alexandria Smart Gadgets",
        "display_name": "أليكس جادجيتس — أجهزة المنزل الذكي والصوتيات",
        "contact_email": "hello@alexgadgets.eg",
        "phone": "+20 112 334 5566",
        "currency": "EGP",
        "sector": "smart_home",
        "primary_color": "#06b6d4",
        "secondary_color": "#3b82f6",
        "accent_color": "#14b8a6",
    },
    {
        "id": "tenant-nile-mobile",
        "slug": "nile-mobile-store",
        "name": "Nile Mobile Store",
        "display_name": "متجر النيل للموبايلات والشواحن الأصلية",
        "contact_email": "support@nilemobile.eg",
        "phone": "+20 122 776 8899",
        "currency": "EGP",
        "sector": "mobile_accessories",
        "primary_color": "#f97316",
        "secondary_color": "#ef4444",
        "accent_color": "#f59e0b",
    },
    {
        "id": "tenant-delta-electronics",
        "slug": "delta-electronics",
        "name": "Delta Electronics Hub",
        "display_name": "دلتا إلكترونكس — قطع الغيار وملحقات الكمبيوتر",
        "contact_email": "contact@deltaelectronics.eg",
        "phone": "+20 155 443 2211",
        "currency": "EGP",
        "sector": "pc_hardware",
        "primary_color": "#10b981",
        "secondary_color": "#059669",
        "accent_color": "#34d399",
    },
]

CATEGORY_TEMPLATES = [
    ("الهواتف الذكية", "Smartphones", "smartphones", "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300"),
    ("أجهزة اللابتوب والكمبيوتر", "Laptops & Computers", "laptops-computers", "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300"),
    ("الصوتيات والسماعات", "Audio & Speakers", "audio-speakers", "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=300"),
    ("الشواحن والكابلات", "Chargers & Cables", "chargers-cables", "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=300"),
    ("الساعات الذكية والأساور", "Smart Watches & Bands", "smart-watches", "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300"),
    ("ملحقات الجيمنج والألعاب", "Gaming Gear & Accessories", "gaming-gear", "https://images.unsplash.com/photo-1612287232070-5b5cb88456a6?w=300"),
    ("الشاشات والتلفزيونات", "Monitors & Screens", "monitors-screens", "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=300"),
    ("وسائط التخزين والهاردات", "Storage & SSDs", "storage-ssds", "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=300"),
    ("باور بانك والبطاريات", "Power Banks & Batteries", "power-banks", "https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=300"),
    ("الكاميرات ومعدات التصوير", "Cameras & Photography", "cameras-photography", "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=300"),
    ("أجهزة الشبكات والراوترات", "Networking & Routers", "networking-routers", "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=300"),
    ("إكسسوارات السيارات الذكية", "Smart Car Accessories", "smart-car-acc", "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=300"),
    ("أجهزة المنزل الذكي والإضاءة", "Smart Home & Lighting", "smart-home", "https://images.unsplash.com/photo-1558002038-1055907df827?w=300"),
    ("حقائب وجرابات الحماية", "Bags & Protection Cases", "bags-cases", "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300"),
    ("قطع غيار ومكونات داخلية", "PC Parts & Components", "pc-components", "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=300"),
    ("لوحات المفاتيح والماوسات", "Keyboards & Mice", "keyboards-mice", "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300"),
]

BRANDS_DATA = [
    ("Apple", ["iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 14", "MacBook Pro M3", "MacBook Air M2", "iPad Pro 12.9", "AirPods Pro 2", "Apple Watch Ultra 2"], 8000, 75000),
    ("Samsung", ["Galaxy S24 Ultra", "Galaxy S24+", "Galaxy Z Fold 5", "Galaxy Z Flip 5", "Galaxy A55", "Galaxy Buds 2 Pro", "Galaxy Watch 6"], 3500, 68000),
    ("Xiaomi", ["Redmi Note 13 Pro+", "Xiaomi 14 Ultra", "Poco X6 Pro", "Mi Band 8", "Redmi Buds 5 Pro", "Xiaomi Power Bank 20000mAh"], 850, 32000),
    ("Anker", ["Soundcore Liberty 4 NC", "735 GaN 65W Charger", "PowerCore 24000mAh", "Soundcore Motion Boom", "Anker 310 USB-C Cable"], 250, 6500),
    ("JBL", ["Flip 6 Waterproof Speaker", "Charge 5", "Tune 760NC Headphones", "Boombox 3", "JBL Wave Flex Earbuds"], 950, 18500),
    ("Sony", ["WH-1000XM5 Noise Cancelling", "WF-1000XM5 Earbuds", "PlayStation 5 Slim Console", "DualSense Wireless Controller"], 2200, 32000),
    ("Dell", ["XPS 15 OLED", "G15 Gaming Laptop", "Inspiron 15 3520", "UltraSharp 27 4K Monitor"], 14000, 85000),
    ("Lenovo", ["Legion Pro 5 Gaming", "ThinkPad X1 Carbon Gen 11", "IdeaPad 3 Slim", "Lenovo Tab M11"], 9500, 72000),
    ("Asus", ["ROG Strix G16", "Zenbook 14 OLED", "TUF Gaming A15", "ROG Swift Gaming Monitor"], 15000, 95000),
    ("Logitech", ["MX Master 3S Wireless Mouse", "MX Keys Advanced Keyboard", "G Pro X Superlight", "C920 HD Pro Webcam"], 1200, 8500),
    ("Kingston", ["Fury Beast 32GB DDR5 RAM", "KC3000 2TB PCIe 4.0 NVMe SSD", "Canvas Go! Plus 128GB MicroSD"], 450, 7500),
    ("Ugreen", ["Nexode 100W GaN Fast Charger", "USB-C Multiport Hub 9-in-1", "Cat 7 Ethernet Cable 5M", "Car Phone Mount MagSafe"], 180, 3800),
]

ARABIC_FIRST_NAMES = [
    "أحمد", "محمد", "محمود", "مصطفى", "عمرو", "كريم", "عمر", "يوسف", "طارق", "حسام", 
    "إسلام", "علي", "خالد", "حازم", "شريف", "رامي", "وليد", "هاني", "أشرف", "سامح",
    "سارة", "مريم", "نور", "ياسمين", "آية", "دينا", "رنا", "مي", "هبة", "ندى", 
    "فاطمة", "أميرة", "شاهندة", "منى", "ريهام", "شروق", "إنجي", "نهى", "هند", "بسنت"
]

ARABIC_LAST_NAMES = [
    "الشناوي", "السعيد", "المنشاوي", "رضوان", "المهدي", "الجيار", "فاروق", "عطية", "البدري",
    "الصاوي", "الألفي", "عثمان", "زهران", "النجار", "غنيم", "هلال", "والي", "الباز", "شاهين",
    "الشافعي", "العربي", "مختار", "الحداد", "الخولى", "علام", "درويش", "سليمان", "ياسين",
    "عفيفي", "عوض", "البرنس", "مهران", "شحاتة", "الرفاعي", "بركات", "أبو النجا", "منصور"
]

EGYPT_LOCATIONS = [
    ("Cairo", "Nasr City", "شارع عباس العقاد، الحي السابع"),
    ("Cairo", "Maadi", "شارع 9، بالقرب من محطة المترو"),
    ("Cairo", "New Cairo", "التجمع الخامس، شارع التسعين الشمالي"),
    ("Cairo", "Heliopolis", "ميدان الكوربة، شارع بغداد"),
    ("Cairo", "Zamalek", "شارع 26 يوليو، بجوار ماريوت"),
    ("Cairo", "Shubra", "شارع شبرا الرئيسي، بالقرب من محطة مسرة"),
    ("Giza", "Dokki", "شارع مصدق، تقاطع محيي الدين أبو العز"),
    ("Giza", "Mohandessin", "شارع جامعة الدول العربية، ميدان سفنكس"),
    ("Giza", "6th of October", "الحي المتميز، المحور المركزي"),
    ("Giza", "Sheikh Zayed", "بيفرلي هيلز، البوابة 2"),
    ("Giza", "Haram", "شارع فيصل الرئيسي، محطة العشرين"),
    ("Alexandria", "Smouha", "ميدان فيكتور عمانويل، عمارة الأطباء"),
    ("Alexandria", "Sidi Gaber", "طريق الجيش، الكورنيش بجوار تيفولي"),
    ("Alexandria", "Miami", "شارع جمال عبد الناصر، عمارة الفيروز"),
    ("Alexandria", "Roushdy", "شارع سوريا، بجوار مدرسة سان مارك"),
    ("Dakahlia", "Mansoura", "شارع الجمهورية، أمام بوابة الجامعة"),
    ("Gharbia", "Tanta", "شارع البحر، ميدان الساعة"),
    ("Sharqia", "Zagazig", "شارع المحافظة، أمام كلية الطب"),
    ("Port Said", "Port Said City", "شارع محمد علي، حي الشرق"),
    ("Suez", "Suez City", "شارع الجيش، حي الأربعين"),
    ("Ismailia", "Ismailia City", "حي الإفرنج، شارع عرابي"),
    ("Assiut", "Assiut City", "شارع النميس، حي شرق"),
    ("Red Sea", "Hurghada", "شارع الشيراتون، الكوثر"),
]

PHONE_PREFIXES = ["+20 100", "+20 101", "+20 102", "+20 111", "+20 112", "+20 114", "+20 120", "+20 122", "+20 127", "+20 155"]

PAYMENT_METHODS = ["CARD", "INSTAPAY", "FAWRY", "COD"]
ORDER_STATUSES = ["DELIVERED", "DELIVERED", "DELIVERED", "DELIVERED", "SHIPPED", "PROCESSING", "CONFIRMED", "PENDING", "CANCELLED"]

COUPON_CODES = [
    ("WELCOME10", "percent", 10.0, 500.0),
    ("SAVE20", "percent", 20.0, 2000.0),
    ("TECHZONE50", "fixed", 50.0, 400.0),
    ("EID2025", "percent", 15.0, 1000.0),
    ("RAMADAN25", "percent", 25.0, 3000.0),
    ("BLACKFRIDAY", "percent", 30.0, 2500.0),
    ("FLASH100", "fixed", 100.0, 1500.0),
    ("SUPERDEAL", "percent", 12.0, 800.0),
    ("FREESHIP", "fixed", 55.0, 600.0),
    ("GAWDAH15", "percent", 15.0, 1200.0),
]


def generate_sql_dataset(output_path: Path):
    print("=" * 70)
    print("🚀 TechZone ERP & E-Commerce 30,000-Row Dataset Generator")
    print(f"Target: PostgreSQL Script ({output_path.name})")
    print("=" * 70)

    total_counter = 0

    with open(output_path, "w", encoding="utf-8") as f:
        # 1. Header & Setup
        f.write("-- TechZone ERP & E-Commerce Platform 30,000-Row PostgreSQL Seed Dataset\n")
        f.write(f"-- Generated on: {datetime.datetime.utcnow().isoformat()}Z\n")
        f.write("-- Dialect: PostgreSQL 14+ (UUID-OSSP, JSONB, Timestamptz)\n\n")
        f.write("BEGIN;\n\n")
        f.write("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";\n\n")

        # -------------------------------------------------------------
        # 1. TENANTS (5 rows)
        # -------------------------------------------------------------
        print("🔹 [1/12] Generating 5 Tenants...")
        f.write("-- =============================================================\n")
        f.write("-- 1. TENANTS (5 rows)\n")
        f.write("-- =============================================================\n")
        f.write("INSERT INTO tenants (id, slug, name, logo_url, currency, theme_config, created_at, updated_at) VALUES\n")
        tenant_values = []
        for t in TENANT_DEFS:
            theme_json = {
                "mode": "dark",
                "primaryColor": t["primary_color"],
                "secondaryColor": t["secondary_color"],
                "accentColor": t["accent_color"],
                "backgroundDark": "#020617",
                "backgroundLight": "#f8fafc",
            }
            tenant_values.append(f"({escape_sql(t['id'])}, {escape_sql(t['slug'])}, {escape_sql(t['name'])}, 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200', {escape_sql(t['currency'])}, {escape_sql(theme_json)}, '{START_DATE.strftime('%Y-%m-%d %H:%M:%S%z')}', '{END_DATE.strftime('%Y-%m-%d %H:%M:%S%z')}')")
        f.write(",\n".join(tenant_values) + ";\n\n")
        total_counter += len(TENANT_DEFS)

        # -------------------------------------------------------------
        # 2. STORE SETTINGS (5 rows)
        # -------------------------------------------------------------
        print("🔹 [2/12] Generating 5 Store Settings...")
        f.write("-- 2. STORE SETTINGS (5 rows)\n")
        f.write("INSERT INTO store_settings (tenant_id, display_name, currency, business_sector, contact_email, contact_phone, shipping_zones, payment_gateways, bosta_api_key, paymob_api_key, updated_at) VALUES\n")
        settings_values = []
        for t in TENANT_DEFS:
            shipping_json = {"carrier": "Bosta Express", "default_rate": 45, "cairo_giza": 45, "alexandria": 50, "delta_canal": 55, "upper_egypt": 65}
            payment_json = {"paymob_active": True, "instapay_active": True, "fawry_active": True, "cod_active": True}
            settings_values.append(f"({escape_sql(t['id'])}, {escape_sql(t['display_name'])}, {escape_sql(t['currency'])}, {escape_sql(t['sector'])}, {escape_sql(t['contact_email'])}, {escape_sql(t['phone'])}, {escape_sql(shipping_json)}, {escape_sql(payment_json)}, 'bosta_sec_live_981726', 'paymob_key_live_281920', '{END_DATE.strftime('%Y-%m-%d %H:%M:%S%z')}')")
        f.write(",\n".join(settings_values) + ";\n\n")
        total_counter += len(TENANT_DEFS)

        # -------------------------------------------------------------
        # 3. THEME CONFIG (5 rows)
        # -------------------------------------------------------------
        print("🔹 [3/12] Generating 5 Theme Configs...")
        f.write("-- 3. THEME CONFIG (5 rows)\n")
        f.write("INSERT INTO theme_config (tenant_id, mode, primary_color, secondary_color, accent_color, background_dark, background_light, logo_url, font_family, generated_at) VALUES\n")
        theme_values = []
        for t in TENANT_DEFS:
            theme_values.append(f"({escape_sql(t['id'])}, 'dark', {escape_sql(t['primary_color'])}, {escape_sql(t['secondary_color'])}, {escape_sql(t['accent_color'])}, '#020617', '#f8fafc', 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200', 'Cairo, sans-serif', '{START_DATE.strftime('%Y-%m-%d %H:%M:%S%z')}')")
        f.write(",\n".join(theme_values) + ";\n\n")
        total_counter += len(TENANT_DEFS)

        # -------------------------------------------------------------
        # 4. USERS (25 rows)
        # -------------------------------------------------------------
        print("🔹 [4/12] Generating 25 Users (Owners, Staff, Cashiers)...")
        f.write("-- 4. USERS (25 rows)\n")
        f.write("INSERT INTO users (id, tenant_id, email, full_name, phone, role, password_hash, created_at) VALUES\n")
        user_values = []
        roles = ["owner", "manager", "cashier", "inventory_officer", "support"]
        for t_idx, t in enumerate(TENANT_DEFS):
            for r_idx, r in enumerate(roles):
                u_id = f"usr_{t['slug']}_{r}_{r_idx+1}"
                u_name = f"{random.choice(ARABIC_FIRST_NAMES)} {random.choice(ARABIC_LAST_NAMES)}"
                u_email = f"{r}.{t_idx+1}.{r_idx+1}@{t['slug']}.eg"
                u_phone = f"{random.choice(PHONE_PREFIXES)} {random.randint(1000, 9999)}"
                user_values.append(f"({escape_sql(u_id)}, {escape_sql(t['id'])}, {escape_sql(u_email)}, {escape_sql(u_name)}, {escape_sql(u_phone)}, {escape_sql(r)}, 'pbkdf2:sha256:260000$mock_hash', '{START_DATE.strftime('%Y-%m-%d %H:%M:%S%z')}')")
        f.write(",\n".join(user_values) + ";\n\n")
        total_counter += len(user_values)

        # -------------------------------------------------------------
        # 5. CATEGORIES (80 rows = 16 categories * 5 tenants)
        # -------------------------------------------------------------
        print("🔹 [5/12] Generating 80 Categories...")
        f.write("-- 5. CATEGORIES (80 rows)\n")
        f.write("INSERT INTO categories (id, tenant_id, name_ar, name_en, slug, parent_id, image_url, sort_order, is_active, created_at) VALUES\n")
        category_values = []
        all_category_ids = []
        tenant_category_map: Dict[str, List[str]] = {t["id"]: [] for t in TENANT_DEFS}

        for t in TENANT_DEFS:
            for c_idx, c in enumerate(CATEGORY_TEMPLATES):
                cat_id = f"cat_{t['slug']}_{c[2]}"
                tenant_category_map[t["id"]].append(cat_id)
                all_category_ids.append(cat_id)
                cat_slug = f"{c[2]}-{t['slug']}"
                date_str = START_DATE.strftime('%Y-%m-%d %H:%M:%S%z')
                category_values.append(
                    f"({escape_sql(cat_id)}, {escape_sql(t['id'])}, {escape_sql(c[0])}, {escape_sql(c[1])}, "
                    f"{escape_sql(cat_slug)}, NULL, {escape_sql(c[3])}, {c_idx+1}, TRUE, '{date_str}')"
                )
        f.write(",\n".join(category_values) + ";\n\n")
        total_counter += len(category_values)

        # -------------------------------------------------------------
        # 6. PRODUCTS (2,500 rows)
        # -------------------------------------------------------------
        print("🔹 [6/12] Generating 2,500 Products...")
        f.write("-- 6. PRODUCTS (2,500 rows)\n")
        
        products_per_batch = 500
        total_products = 2500
        created_products: List[Dict[str, Any]] = []

        product_idx = 0
        while product_idx < total_products:
            batch_values = []
            current_batch_size = min(products_per_batch, total_products - product_idx)
            for _ in range(current_batch_size):
                p_num = product_idx + 1
                tenant = random.choice(TENANT_DEFS)
                t_id = tenant["id"]
                cat_id = random.choice(tenant_category_map[t_id])
                brand_tuple = random.choice(BRANDS_DATA)
                brand_name = brand_tuple[0]
                model_name = random.choice(brand_tuple[1])
                min_p, max_p = brand_tuple[2], brand_tuple[3]
                
                price = round(random.uniform(min_p, max_p), 2)
                cost_price = round(price * random.uniform(0.68, 0.82), 2)  # Realistic 18-32% gross margin
                compare_price = round(price * random.uniform(1.10, 1.25), 2) if random.random() > 0.4 else None

                p_id = f"prod_{p_num:05d}"
                sku = f"SKU-{brand_name[:3].upper()}-{p_num:05d}"
                name_ar = f"{brand_name} {model_name} أصلي مع ضمان محلي"
                name_en = f"Original {brand_name} {model_name} Official Warranty"
                slug = f"{brand_name.lower()}-{model_name.lower().replace(' ', '-')}-{p_num}"
                desc_ar = f"منتج {name_ar} بمواصفات عالية الجودة وضمان معتمد لمدة عام كامل مع دعم فني متواصل."
                desc_en = f"High performance {name_en} with official 1-year warranty and express delivery."
                
                # Stock distribution: 6% out of stock, 12% low stock, 82% healthy stock
                stock_rand = random.random()
                if stock_rand < 0.06:
                    stock_qty = 0
                elif stock_rand < 0.18:
                    stock_qty = random.randint(1, 4)
                else:
                    stock_qty = random.randint(10, 280)
                
                low_stock_threshold = random.randint(5, 12)
                featured = (random.random() < 0.15)
                images = [f"https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600", f"https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600"]
                attributes = {"brand": brand_name, "warranty_months": 12, "color": random.choice(["Black", "Silver", "Blue", "Titanium"])}
                p_created = random_date(START_DATE, START_DATE + datetime.timedelta(days=200))

                prod_dict = {
                    "id": p_id,
                    "tenant_id": t_id,
                    "category_id": cat_id,
                    "name_ar": name_ar,
                    "name_en": name_en,
                    "price": price,
                    "cost_price": cost_price,
                    "sku": sku,
                    "stock_qty": stock_qty,
                }
                created_products.append(prod_dict)

                batch_values.append(
                    f"({escape_sql(p_id)}, {escape_sql(t_id)}, {escape_sql(cat_id)}, {escape_sql(name_ar)}, {escape_sql(name_en)}, "
                    f"{escape_sql(slug)}, {escape_sql(desc_ar)}, {escape_sql(desc_en)}, {price}, {cost_price}, {escape_sql(compare_price)}, "
                    f"{escape_sql(sku)}, {stock_qty}, {low_stock_threshold}, {escape_sql(images)}, {escape_sql(attributes)}, TRUE, {escape_sql(featured)}, "
                    f"{escape_sql(p_created)}, {escape_sql(p_created)})"
                )
                product_idx += 1

            f.write("INSERT INTO products (id, tenant_id, category_id, name_ar, name_en, slug, description_ar, description_en, price, cost_price, compare_price, sku, stock_qty, low_stock_threshold, images, attributes, is_active, featured, created_at, updated_at) VALUES\n")
            f.write(",\n".join(batch_values) + ";\n\n")

        total_counter += total_products

        # -------------------------------------------------------------
        # 7. PRODUCT VARIANTS (3,500 rows)
        # -------------------------------------------------------------
        print("🔹 [7/12] Generating 3,500 Product Variants...")
        f.write("-- 7. PRODUCT VARIANTS (3,500 rows)\n")
        total_variants = 3500
        variants_per_batch = 700
        variant_idx = 0
        storage_options = [("128GB", 0.0), ("256GB", 2500.0), ("512GB", 6000.0), ("1TB", 11000.0)]
        colors = ["أسود فلكي / Space Black", "فضي / Silver", "أزرق تيتانيوم / Blue Titanium", "أبيض سيراميك / White"]

        while variant_idx < total_variants:
            batch_values = []
            current_batch_size = min(variants_per_batch, total_variants - variant_idx)
            for _ in range(current_batch_size):
                v_num = variant_idx + 1
                base_prod = created_products[variant_idx % len(created_products)]
                opt = storage_options[v_num % len(storage_options)]
                color = colors[v_num % len(colors)]
                
                v_id = f"var_{v_num:05d}"
                v_name = f"{base_prod['name_ar']} - {opt[0]} ({color})"
                v_sku = f"{base_prod['sku']}-V{v_num:03d}"
                v_price_mod = opt[1]
                v_stock = random.randint(0, 85)
                v_attrs = {"storage": opt[0], "color": color}

                batch_values.append(
                    f"({escape_sql(v_id)}, {escape_sql(base_prod['id'])}, {escape_sql(v_name)}, {escape_sql(v_sku)}, {v_price_mod}, {v_stock}, {escape_sql(v_attrs)})"
                )
                variant_idx += 1

            f.write("INSERT INTO product_variants (id, product_id, name, sku, price_modifier, stock_qty, attributes) VALUES\n")
            f.write(",\n".join(batch_values) + ";\n\n")

        total_counter += total_variants

        # -------------------------------------------------------------
        # 8. CUSTOMERS (4,000 rows)
        # -------------------------------------------------------------
        print("🔹 [8/12] Generating 4,000 Customers...")
        f.write("-- 8. CUSTOMERS (4,000 rows)\n")
        total_customers = 4000
        cust_per_batch = 1000
        cust_idx = 0
        created_customers: List[Dict[str, Any]] = []

        while cust_idx < total_customers:
            batch_values = []
            current_batch_size = min(cust_per_batch, total_customers - cust_idx)
            for _ in range(current_batch_size):
                c_num = cust_idx + 1
                tenant = random.choice(TENANT_DEFS)
                first = random.choice(ARABIC_FIRST_NAMES)
                mid = random.choice(ARABIC_FIRST_NAMES)
                last = random.choice(ARABIC_LAST_NAMES)
                c_name = f"{first} {mid} {last}"
                
                loc = random.choice(EGYPT_LOCATIONS)
                c_gov, c_city, c_addr = loc[0], loc[1], loc[2]
                c_phone = f"{random.choice(PHONE_PREFIXES)} {random.randint(100, 999)} {random.randint(1000, 9999)}"
                c_email = f"user_{c_num:04d}@{random.choice(['gmail.com', 'outlook.com', 'yahoo.com', 'icloud.com'])}"
                c_created = random_date(START_DATE, END_DATE - datetime.timedelta(days=30))

                c_id = f"cust_{c_num:05d}"
                cust_dict = {
                    "id": c_id,
                    "tenant_id": tenant["id"],
                    "name": c_name,
                    "phone": c_phone,
                    "gov": c_gov,
                    "city": c_city,
                    "addr": c_addr,
                    "email": c_email,
                }
                created_customers.append(cust_dict)

                batch_values.append(
                    f"({escape_sql(c_id)}, {escape_sql(tenant['id'])}, {escape_sql(c_name)}, {escape_sql(c_phone)}, {escape_sql(c_email)}, "
                    f"{escape_sql(c_gov)}, {escape_sql(c_city)}, {escape_sql(c_addr)}, 0, 0.0, NULL, {escape_sql(c_created)})"
                )
                cust_idx += 1

            f.write("INSERT INTO customers (id, tenant_id, name, phone, email, governorate, city, address, total_orders, total_spent, last_order_at, created_at) VALUES\n")
            f.write(",\n".join(batch_values) + ";\n\n")

        total_counter += total_customers

        # -------------------------------------------------------------
        # 9. COUPONS (50 rows = 10 codes * 5 tenants)
        # -------------------------------------------------------------
        print("🔹 [9/12] Generating 50 Coupons...")
        f.write("-- 9. COUPONS (50 rows)\n")
        f.write("INSERT INTO coupons (id, tenant_id, code, type, value, min_order, max_uses, used_count, is_active, expires_at, created_at) VALUES\n")
        coupon_values = []
        for t in TENANT_DEFS:
            for c_idx, coup in enumerate(COUPON_CODES):
                coup_id = f"coup_{t['slug']}_{c_idx+1}"
                max_u = random.randint(150, 600)
                used_u = random.randint(10, max_u - 20)
                exp_date = END_DATE + datetime.timedelta(days=random.randint(60, 365))
                coupon_values.append(
                    f"({escape_sql(coup_id)}, {escape_sql(t['id'])}, {escape_sql(coup[0])}, {escape_sql(coup[1])}, {coup[2]}, {coup[3]}, "
                    f"{max_u}, {used_u}, TRUE, {escape_sql(exp_date)}, '{START_DATE.strftime('%Y-%m-%d %H:%M:%S%z')}')"
                )
        f.write(",\n".join(coupon_values) + ";\n\n")
        total_counter += len(coupon_values)

        # -------------------------------------------------------------
        # 10. ORDERS (14,000 rows)
        # -------------------------------------------------------------
        print("🔹 [10/12] Generating 14,000 Orders (E-Commerce & ERP Transactions)...")
        f.write("-- 10. ORDERS (14,000 rows)\n")
        total_orders = 14000
        orders_per_batch = 1000
        order_idx = 0
        created_order_ids: List[str] = []

        # Tracking customer spent & orders to update later if needed
        customer_order_stats: Dict[str, Dict[str, Any]] = {c["id"]: {"orders": 0, "spent": 0.0, "last_order": None} for c in created_customers}

        while order_idx < total_orders:
            batch_values = []
            current_batch_size = min(orders_per_batch, total_orders - order_idx)
            for _ in range(current_batch_size):
                o_num = order_idx + 1
                o_id = f"ord_eg_{o_num:06d}"
                created_order_ids.append(o_id)

                customer = random.choice(created_customers)
                t_id = customer["tenant_id"]

                # Generate 1 to 3 items per order from products of the same tenant
                tenant_prods = [p for p in created_products if p["tenant_id"] == t_id]
                if not tenant_prods:
                    tenant_prods = created_products[:50]
                
                num_items = random.choices([1, 2, 3], weights=[0.65, 0.25, 0.10])[0]
                selected_prods = random.sample(tenant_prods, k=min(num_items, len(tenant_prods)))
                
                order_items_json = []
                subtotal = 0.0
                for p in selected_prods:
                    qty = random.choices([1, 2, 3], weights=[0.85, 0.12, 0.03])[0]
                    line_total = round(p["price"] * qty, 2)
                    subtotal += line_total
                    order_items_json.append({
                        "productId": p["id"],
                        "name": p["name_ar"],
                        "price": p["price"],
                        "qty": qty,
                        "lineTotal": line_total
                    })

                subtotal = round(subtotal, 2)
                shipping_cost = random.choice([40.0, 45.0, 50.0, 60.0])
                discount = round(random.choice([0.0, 0.0, 0.0, 50.0, 100.0, subtotal * 0.1]), 2)
                if discount > subtotal:
                    discount = 0.0
                total = round(subtotal + shipping_cost - discount, 2)

                status = random.choice(ORDER_STATUSES)
                pay_method = random.choice(PAYMENT_METHODS)
                
                if status == "DELIVERED":
                    pay_status = "PAID"
                elif status == "CANCELLED":
                    pay_status = "REFUNDED" if pay_method != "COD" else "UNPAID"
                elif pay_method in ["CARD", "INSTAPAY"]:
                    pay_status = "PAID"
                else:
                    pay_status = "UNPAID"

                o_created = random_date(START_DATE, END_DATE)
                o_updated = o_created + datetime.timedelta(hours=random.randint(2, 72))

                pay_ref = f"{pay_method}-{random.randint(1000000, 9999999)}" if pay_status == "PAID" else None
                bosta_tracking = f"BOSTA-AWB-{random.randint(10000000, 99999999)}" if status in ["SHIPPED", "DELIVERED"] else None

                ship_addr = {
                    "name": customer["name"],
                    "phone": customer["phone"],
                    "governorate": customer["gov"],
                    "city": customer["city"],
                    "address": customer["addr"]
                }

                # Update stats
                customer_order_stats[customer["id"]]["orders"] += 1
                customer_order_stats[customer["id"]]["spent"] += total
                if customer_order_stats[customer["id"]]["last_order"] is None or o_created > customer_order_stats[customer["id"]]["last_order"]:
                    customer_order_stats[customer["id"]]["last_order"] = o_created

                batch_values.append(
                    f"({escape_sql(o_id)}, {escape_sql(t_id)}, NULL, {escape_sql(status)}, {escape_sql(order_items_json)}, "
                    f"{subtotal}, {shipping_cost}, {discount}, {total}, {escape_sql(pay_method)}, {escape_sql(pay_status)}, "
                    f"{escape_sql(pay_ref)}, {escape_sql(bosta_tracking)}, {escape_sql(ship_addr)}, "
                    f"{escape_sql(o_created)}, {escape_sql(o_updated)})"
                )
                order_idx += 1

            f.write("INSERT INTO orders (id, tenant_id, user_id, status, items, subtotal, shipping_cost, discount, total, payment_method, payment_status, payment_ref, bosta_tracking_number, shipping_address, created_at, updated_at) VALUES\n")
            f.write(",\n".join(batch_values) + ";\n\n")

        total_counter += total_orders

        # -------------------------------------------------------------
        # 11. ORDER STATUS LOG (5,000 rows)
        # -------------------------------------------------------------
        print("🔹 [11/12] Generating 5,000 Order Status Logs...")
        f.write("-- 11. ORDER STATUS LOG (5,000 rows)\n")
        total_logs = 5000
        logs_per_batch = 1000
        log_idx = 0
        status_transitions = [
            ("CONFIRMED", "تم تأكيد الطلب بنجاح ومراجعته من قسم المبيعات."),
            ("PROCESSING", "جاري تجهيز وتغليف الشحنة في المخزن المركزي."),
            ("SHIPPED", "تم تسليم الشحنة لشركة بوسطة للشحن وإصدار بوليصة التتبع."),
            ("DELIVERED", "تم تسليم الطلب للعميل واستلام التحصيل بنجاح."),
            ("CANCELLED", "تم إلغاء الطلب بناء على رغبة العميل أو عدم توافر المخزون."),
        ]

        while log_idx < total_logs:
            batch_values = []
            current_batch_size = min(logs_per_batch, total_logs - log_idx)
            for _ in range(current_batch_size):
                l_num = log_idx + 1
                l_id = f"log_{l_num:06d}"
                target_ord = created_order_ids[log_idx % len(created_order_ids)]
                transition = random.choice(status_transitions)
                l_date = random_date(START_DATE, END_DATE)

                batch_values.append(
                    f"({escape_sql(l_id)}, {escape_sql(target_ord)}, {escape_sql(transition[0])}, {escape_sql(transition[1])}, 'system_worker', {escape_sql(l_date)})"
                )
                log_idx += 1

            f.write("INSERT INTO order_status_log (id, order_id, status, note, created_by, created_at) VALUES\n")
            f.write(",\n".join(batch_values) + ";\n\n")

        total_counter += total_logs

        # -------------------------------------------------------------
        # 12. ANALYTICS DAILY (830 rows)
        # -------------------------------------------------------------
        print("🔹 [12/12] Generating 830 Daily Analytics Summaries...")
        f.write("-- 12. ANALYTICS DAILY (830 rows)\n")
        f.write("INSERT INTO analytics_daily (id, tenant_id, date, orders_count, revenue, new_customers, top_products) VALUES\n")
        
        analytics_values = []
        cur_date = START_DATE.date()
        target_tenant = "tenant-moustafa-tech"
        top_sample_prods = [
            {"name": "Apple iPhone 15 Pro Max", "units": 14, "revenue": 868000.0},
            {"name": "Samsung Galaxy S24 Ultra", "units": 10, "revenue": 540000.0},
            {"name": "JBL Flip 6 Waterproof Speaker", "units": 28, "revenue": 140000.0},
            {"name": "Anker 735 GaN 65W Charger", "units": 45, "revenue": 65250.0},
        ]

        for day_i in range(830):
            day_id = f"daily_mt_{(cur_date + datetime.timedelta(days=day_i)).strftime('%Y%m%d')}"
            day_date = cur_date + datetime.timedelta(days=day_i)
            day_orders = random.randint(8, 48)
            day_rev = round(random.uniform(35000.0, 240000.0), 2)
            day_custs = random.randint(3, 18)
            analytics_values.append(
                f"({escape_sql(day_id)}, {escape_sql(target_tenant)}, {escape_sql(day_date)}, {day_orders}, {day_rev}, {day_custs}, {escape_sql(top_sample_prods)})"
            )

        f.write(",\n".join(analytics_values) + ";\n\n")
        total_counter += len(analytics_values)

        # Final commit
        f.write("COMMIT;\n\n")
        f.write(f"-- SUMMARY: {total_counter} rows successfully populated.\n")

    print("=" * 70)
    print(f"🎉 Successfully generated {total_counter:,} rows into:")
    print(f"   {output_path.resolve()}")
    print("=" * 70)
    return total_counter


def load_into_database(sql_path: Path):
    """Loads the generated SQL file directly into the database configured in DATABASE_URL or .env"""
    from backend.config import DATABASE_URL
    from sqlalchemy import create_engine, text

    print(f"Connecting to database: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL}")
    engine = create_engine(DATABASE_URL)
    
    with open(sql_path, "r", encoding="utf-8") as f:
        sql_content = f.read()

    print("Executing 30,000-row SQL import transaction...")
    with engine.begin() as conn:
        # Split on statements or execute raw blocks
        conn.execute(text(sql_content))
    print("Database import completed successfully!")


if __name__ == "__main__":
    out_dir = Path(__file__).resolve().parent
    out_file = out_dir / "dataset_30000_erp.sql"
    
    if "--load" in sys.argv:
        if not out_file.exists():
            generate_sql_dataset(out_file)
        load_into_database(out_file)
    else:
        if len(sys.argv) > 1 and sys.argv[1].endswith(".sql"):
            out_file = Path(sys.argv[1])
        generate_sql_dataset(out_file)
