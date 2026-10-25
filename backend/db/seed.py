# backend/db/seed.py
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.db.database import SessionLocal, init_db
from backend.models import (
    Tenant,
    StoreSettings,
    ThemeConfig,
    User,
    Category,
    Product,
    Coupon,
    Customer,
    Order,
    AgentSession,
    AgentMessage,
)

def seed_database():
    init_db()
    db = SessionLocal()
    try:
        tenant_id = "tenant-moustafa-tech"
        slug = "-moustafa-tech--102"

        existing = db.query(Tenant).filter_by(id=tenant_id).first()
        if existing:
            print("Database already seeded with Moustafa Tech store.")
            return

        # 1. Create Tenant
        store_tenant = Tenant(
            id=tenant_id,
            slug=slug,
            name="Moustafa Tech",
            currency="EGP",
            logo_url="https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&auto=format&fit=crop&q=80",
            theme_config={
                "mode": "dark",
                "primaryColor": "#0ea5e9",
                "secondaryColor": "#6366f1",
                "accentColor": "#10b981",
                "backgroundDark": "#020617",
                "backgroundLight": "#f8fafc",
            },
        )
        db.add(store_tenant)

        # 2. Store Settings
        settings = StoreSettings(
            tenant_id=tenant_id,
            display_name="Moustafa Tech — بيع موبايلات وإلكترونيات",
            currency="EGP",
            business_sector="electronics",
            contact_email="owner@moustafatech.eg",
            contact_phone="+20 100 123 4567",
            shipping_zones={
                "carrier": "Bosta Express",
                "default_rate": 45,
                "cairo_giza": 45,
                "alexandria": 50,
                "delta_canal": 55,
                "upper_egypt": 65,
            },
            payment_gateways={
                "paymob_active": True,
                "instapay_active": True,
                "fawry_active": True,
                "cod_active": True,
            },
        )
        db.add(settings)

        # 3. Theme Config
        theme = ThemeConfig(
            tenant_id=tenant_id,
            mode="dark",
            primary_color="#0ea5e9",
            secondary_color="#6366f1",
            accent_color="#10b981",
            background_dark="#020617",
            background_light="#f8fafc",
            logo_url="https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&auto=format&fit=crop&q=80",
            font_family="Cairo, sans-serif",
        )
        db.add(theme)

        # 4. Owner User
        owner = User(
            id="user-owner-01",
            tenant_id=tenant_id,
            email="moustafa@techzone.eg",
            full_name="مصطفى ماهر",
            phone="+20 102 345 6789",
            role="owner",
            password_hash="pbkdf2:sha256:owner_secret_hash",
        )
        db.add(owner)

        # 5. Categories
        cat_phones = Category(
            id="cat_phones",
            tenant_id=tenant_id,
            name_ar="الهواتف الذكية",
            name_en="Smartphones",
            slug="smartphones",
            sort_order=1,
            is_active=True,
            image_url="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&auto=format&fit=crop&q=80",
        )
        cat_audio = Category(
            id="cat_audio",
            tenant_id=tenant_id,
            name_ar="الصوتيات والسماعات",
            name_en="Audio & Speakers",
            slug="audio-speakers",
            sort_order=2,
            is_active=True,
            image_url="https://images.unsplash.com/photo-1545454675-3531b543be5d?w=300&auto=format&fit=crop&q=80",
        )
        cat_chargers = Category(
            id="cat_chargers",
            tenant_id=tenant_id,
            name_ar="الشواحن والملحقات",
            name_en="Chargers & Accessories",
            slug="chargers-accessories",
            sort_order=3,
            is_active=True,
            image_url="https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=300&auto=format&fit=crop&q=80",
        )
        db.add_all([cat_phones, cat_audio, cat_chargers])

        # 6. Seed Products
        p1 = Product(
            id="prod_101",
            tenant_id=tenant_id,
            category_id="cat_audio",
            name_ar="سماعة سبيكر JBL Flip 6 مقاومة للماء",
            name_en="JBL Flip 6 Waterproof Portable Bluetooth Speaker",
            slug="jbl-flip-6-speaker",
            description_ar="سماعة بلوتوث أصلية بصوت نقي وعميق وبطارية تدوم حتى 12 ساعة متواصلة ومقاومة للماء والغبار بمعيار IP67.",
            price=5000.0,
            cost_price=3800.0,
            compare_price=5800.0,
            sku="SPK-JBL-01",
            stock_qty=72,
            low_stock_threshold=10,
            featured=True,
            images=[
                "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80",
            ],
            attributes={"brand": "JBL", "color": "Black", "battery_hours": 12, "waterproof": "IP67"},
        )

        p2 = Product(
            id="prod_102",
            tenant_id=tenant_id,
            category_id="cat_phones",
            name_ar="آيفون 15 بروماكس 256 جيجابايت تيتانيوم",
            name_en="Apple iPhone 15 Pro Max 256GB Natural Titanium",
            slug="iphone-15-pro-max",
            description_ar="أقوى هاتف من آبل بشريحة A17 Pro وهيكل من التيتانيوم خفيف الوزن وكاميرا بيريسكوب 5x وتقنية Dynamic Island.",
            price=62000.0,
            cost_price=53000.0,
            compare_price=66000.0,
            sku="PHN-IP15PM-256",
            stock_qty=18,
            low_stock_threshold=5,
            featured=True,
            images=[
                "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&auto=format&fit=crop&q=80",
            ],
            attributes={"brand": "Apple", "storage": "256GB", "color": "Natural Titanium", "ram": "8GB"},
        )

        p3 = Product(
            id="prod_103",
            tenant_id=tenant_id,
            category_id="cat_phones",
            name_ar="سامسونج جالاكسي S24 ألترا الذكي الذكاء الاصطناعي",
            name_en="Samsung Galaxy S24 Ultra 5G AI Phone",
            slug="samsung-galaxy-s24-ultra",
            description_ar="مدعوم بميزات Galaxy AI مع قلم S Pen مدمج وشاشة مسطحة بدقة QHD+ وكاميرا بدقة 200 ميجابكسل.",
            price=54000.0,
            cost_price=46000.0,
            compare_price=59000.0,
            sku="PHN-S24U-512",
            stock_qty=14,
            low_stock_threshold=5,
            featured=True,
            images=[
                "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&auto=format&fit=crop&q=80",
            ],
            attributes={"brand": "Samsung", "storage": "512GB", "color": "Titanium Gray", "ram": "12GB"},
        )

        p4 = Product(
            id="prod_104",
            tenant_id=tenant_id,
            category_id="cat_chargers",
            name_ar="شاحن أنكر 65 واط GaN سريع 3 منافذ",
            name_en="Anker 735 Charger (GaNPrime 65W) 3 Ports",
            slug="anker-65w-gan-charger",
            description_ar="شاحن حائطي سريع للغاية من أنكر بتقنية GaNPrime يدعم شحن اللابتوب والموبايل والتابلت في وقت واحد بحماية فائقة.",
            price=1450.0,
            cost_price=920.0,
            compare_price=1750.0,
            sku="CHG-ANK-65W",
            stock_qty=64,
            low_stock_threshold=12,
            featured=False,
            images=[
                "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80",
            ],
            attributes={"brand": "Anker", "power": "65W", "ports": "2x USB-C + 1x USB-A"},
        )

        p5 = Product(
            id="prod_105",
            tenant_id=tenant_id,
            category_id="cat_chargers",
            name_ar="كابل شحن مجدول USB-C إلى USB-C طول 2 متر 100W",
            name_en="Braided USB-C to USB-C Fast Charging Cable 2M 100W",
            slug="braided-usbc-cable-2m",
            description_ar="كابل فائق المتانة يدعم قدرة شحن تصل حتى 100 واط مع سرعة نقل بيانات عالية ومقاومة للقطع.",
            price=320.0,
            cost_price=110.0,
            compare_price=450.0,
            sku="CAB-USBC-2M",
            stock_qty=85,
            low_stock_threshold=15,
            featured=False,
            images=[
                "https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=600&auto=format&fit=crop&q=80",
            ],
            attributes={"length": "2M", "wattage": "100W", "material": "Nylon Braided"},
        )

        p6 = Product(
            id="prod_106",
            tenant_id=tenant_id,
            category_id="cat_chargers",
            name_ar="كيبورد ميكانيكي انجليزي للألعاب بإضاءة RGB",
            name_en="Mechanical Gaming English Keyboard RGB",
            slug="mechanical-english-keyboard-rgb",
            description_ar="لوحة مفاتيح ميكانيكية احترافية بالحروف الإنجليزية مع إضاءة RGB مخصصة واستجابة سريعة جداً للألعاب والبرمجة.",
            price=1250.0,
            cost_price=850.0,
            compare_price=1600.0,
            sku="PRD-913A85",
            stock_qty=40,
            low_stock_threshold=5,
            featured=True,
            images=[
                "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80",
            ],
            attributes={"layout": "English", "switch": "Blue Mechanical", "rgb": True},
        )

        p7 = Product(
            id="prod_107",
            tenant_id=tenant_id,
            category_id="cat_chargers",
            name_ar="ماوس وايرلس دقيق مع بطارية قابلة لإعادة الشحن",
            name_en="Precision Wireless Optical Mouse Rechargeable",
            slug="precision-wireless-mouse",
            description_ar="ماوس لاسلكي مريح لليد بحساسية عالية وبطارية تدوم طويلاً مع أزرار صامتة تماماً.",
            price=450.0,
            cost_price=280.0,
            compare_price=600.0,
            sku="PRD-74EFA9",
            stock_qty=55,
            low_stock_threshold=10,
            featured=True,
            images=[
                "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&auto=format&fit=crop&q=80",
            ],
            attributes={"connectivity": "Wireless 2.4GHz + Bluetooth", "dpi": 1600},
        )

        db.add_all([p1, p2, p3, p4, p5, p6, p7])

        # 7. Seed Coupons
        c1 = Coupon(
            id="coup_welcome",
            tenant_id=tenant_id,
            code="WELCOME10",
            type="percent",
            value=10.0,
            min_order=500.0,
            max_uses=200,
            used_count=18,
            is_active=True,
        )
        c2 = Coupon(
            id="coup_save20",
            tenant_id=tenant_id,
            code="SAVE20",
            type="percent",
            value=20.0,
            min_order=2000.0,
            max_uses=50,
            used_count=12,
            is_active=True,
        )
        db.add_all([c1, c2])

        # 8. Seed Sample Customers
        cust1 = Customer(
            id="cust_001",
            tenant_id=tenant_id,
            name="أحمد محمود السعيد",
            phone="+20 101 234 5678",
            email="ahmed.said@gmail.com",
            governorate="Cairo",
            city="Nasr City",
            address="شارع عباس العقاد، عمارة 14",
            total_orders=3,
            total_spent=72500.0,
        )
        cust2 = Customer(
            id="cust_002",
            tenant_id=tenant_id,
            name="سارة إبراهيم الشناوي",
            phone="+20 112 987 6543",
            email="sara.shennawy@outlook.com",
            governorate="Giza",
            city="Dokki",
            address="شارع مصدق، برج الأطباء",
            total_orders=1,
            total_spent=5000.0,
        )
        db.add_all([cust1, cust2])

        # 9. Seed Orders
        ord1 = Order(
            id="ord_eg_109283",
            tenant_id=tenant_id,
            status="CONFIRMED",
            items=[{"productId": "prod_101", "name": "JBL Flip 6", "price": 5000.0, "qty": 1}],
            subtotal=5000.0,
            shipping_cost=45.0,
            discount=500.0,
            total=4545.0,
            payment_method="INSTAPAY",
            payment_status="PAID",
            payment_ref="INSTA-9812739",
            bosta_tracking_number="BOSTA-AWB-8271639",
            shipping_address={"name": "أحمد محمود", "phone": "+20 101 234 5678", "city": "Cairo", "address": "مدينة نصر"},
        )
        ord2 = Order(
            id="ord_eg_109284",
            tenant_id=tenant_id,
            status="PENDING",
            items=[{"productId": "prod_104", "name": "Anker 65W GaN", "price": 1450.0, "qty": 2}],
            subtotal=2900.0,
            shipping_cost=45.0,
            discount=0.0,
            total=2945.0,
            payment_method="CARD",
            payment_status="PAID",
            payment_ref="PAYMOB-761230",
            bosta_tracking_number="BOSTA-AWB-8271640",
            shipping_address={"name": "سارة إبراهيم", "phone": "+20 112 987 6543", "city": "Giza", "address": "الدقي"},
        )
        db.add_all([ord1, ord2])

        # 10. Initial Agent Session
        sess = AgentSession(
            id="sess_init_moustafa",
            tenant_id=tenant_id,
            title="محادثة تأسيس المتجر والتخفيضات",
        )
        db.add(sess)

        msg1 = AgentMessage(
            id="msg_001",
            session_id="sess_init_moustafa",
            role="assistant",
            content="أهلاً بك يا مصطفى في TechZone! متجرك 'Moustafa Tech' جاهز الآن بكامل بوابات الدفع وشحن بوسطة، وجاهز لتنفيذ أي أوامر للمنتجات والتسعير والطلبات.",
            card_type="text",
        )
        db.add(msg1)

        db.commit()
        print("[SUCCESS] Database successfully seeded for 'Moustafa Tech' store (-moustafa-tech--102).")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Seeding error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
