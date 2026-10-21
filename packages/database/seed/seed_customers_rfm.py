# packages/database/seed/seed_customers_rfm.py
"""
Seeding script for Egyptian E-Commerce Customer RFM Segmentation (Slice 05: Renad Hakim).
Populates multi-order customer histories mapped to Egyptian governorates (Cairo, Giza, Alex, Mansoura, Tanta, Assiut)
with distinct purchasing distributions across all 5 RFM clusters.
"""
import random
import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Tuple

EGYPTIAN_GOVERNORATES = [
    ("Cairo", 0.40),
    ("Giza", 0.25),
    ("Alexandria", 0.15),
    ("Mansoura", 0.08),
    ("Tanta", 0.07),
    ("Assiut", 0.05),
]

ARABIC_NAMES = [
    ("Ahmed Mostafa", "ahmed.mostafa@example.eg", "+201012345001"),
    ("Mona El-Sayed", "mona.elsayed@example.eg", "+201112345002"),
    ("Omar Abdel-Rahman", "omar.rahman@example.eg", "+201212345003"),
    ("Nourhan Hassan", "nourhan.h@example.eg", "+201012345004"),
    ("Tarek Mahmoud", "tarek.m@example.eg", "+201512345005"),
    ("Salma Fathy", "salma.fathy@example.eg", "+201112345006"),
    ("Karim El-Ghazaly", "karim.ghazaly@example.eg", "+201212345007"),
    ("Yasmin Sherif", "yasmin.sherif@example.eg", "+201012345008"),
    ("Hossam Badawy", "hossam.badawy@example.eg", "+201512345009"),
    ("Mariam Kamel", "mariam.kamel@example.eg", "+201112345010"),
    ("Sherif Adel", "sherif.adel@example.eg", "+201212345011"),
    ("Dina Fawzy", "dina.fawzy@example.eg", "+201012345012"),
    ("Khaled Zaki", "khaled.zaki@example.eg", "+201112345013"),
    ("Aya Samir", "aya.samir@example.eg", "+201212345014"),
    ("Mahmoud Refaat", "mahmoud.refaat@example.eg", "+201512345015"),
    ("Reem Ezzat", "reem.ezzat@example.eg", "+201012345016"),
    ("Mostafa Allam", "mostafa.allam@example.eg", "+201112345017"),
    ("Heba Gamal", "heba.gamal@example.eg", "+201212345018"),
    ("Amr Helmy", "amr.helmy@example.eg", "+201512345019"),
    ("Fatma Shawky", "fatma.shawky@example.eg", "+201012345020"),
]

PRODUCT_SAMPLES = [
    ("prod_101", "JBL Flip 6 Waterproof Speaker", 5000.0),
    ("prod_102", "Anker Soundcore Motion+", 3200.0),
    ("prod_103", "Sony WH-1000XM5", 14500.0),
    ("prod_104", "Apple AirPods Pro 2nd Gen", 9800.0),
    ("prod_105", "Anker 65W GaN Fast Charger", 850.0),
    ("prod_106", "Samsung 45W USB-C Charger", 650.0),
    ("prod_107", "Baseus 100W Fast Cable 2M", 280.0),
    ("prod_108", "Spigen Tough Armor Case", 600.0),
    ("prod_109", "Joyroom Magnetic Power Bank 10000mAh", 1200.0),
]


def pick_city() -> str:
    r = random.random()
    cum = 0.0
    for city, weight in EGYPTIAN_GOVERNORATES:
        cum += weight
        if r <= cum:
            return city
    return "Cairo"


def generate_rfm_customer_pool(
    tenant_id: str = "tenant-demo-01",
    customer_count: int = 50,
    seed: int = 42,
) -> Tuple[List[Dict], List[Dict], List[Dict]]:
    """
    Generates synthetic customers, orders, and order items ensuring realistic distributions
    across all 5 standard RFM clusters.
    """
    random.seed(seed)
    now = datetime(2026, 10, 21, 12, 0, 0, tzinfo=timezone.utc)

    # Cluster archetype specifications (Recency days range, Frequency range, avg order spend)
    archetypes = [
        {"segment": "VIP Champions", "recency_range": (1, 14), "order_count_range": (8, 16), "items_per_order": (2, 4)},
        {"segment": "Loyal Customers", "recency_range": (15, 45), "order_count_range": (4, 8), "items_per_order": (1, 3)},
        {"segment": "New Customers", "recency_range": (1, 10), "order_count_range": (1, 2), "items_per_order": (1, 2)},
        {"segment": "At-Risk of Churn", "recency_range": (60, 120), "order_count_range": (5, 12), "items_per_order": (2, 4)},
        {"segment": "Hibernating / Lost", "recency_range": (130, 240), "order_count_range": (1, 2), "items_per_order": (1, 2)},
    ]

    customers = []
    orders = []
    order_items = []

    for i in range(customer_count):
        cust_id = f"cust_{uuid.uuid4().hex[:10]}"
        archetype = archetypes[i % len(archetypes)]
        name_info = ARABIC_NAMES[i % len(ARABIC_NAMES)]
        city = pick_city()

        customers.append(
            {
                "id": cust_id,
                "tenant_id": tenant_id,
                "name": f"{name_info[0]} #{i+1}",
                "email": f"user{i+1}.{name_info[1]}",
                "phone": name_info[2],
                "city": city,
                "rfm_segment": archetype["segment"],
                "created_at": (now - timedelta(days=random.randint(180, 365))).isoformat(),
            }
        )

        num_orders = random.randint(*archetype["order_count_range"])
        min_rec, max_rec = archetype["recency_range"]
        latest_recency_days = random.randint(min_rec, max_rec)

        order_dates = [now - timedelta(days=latest_recency_days)]
        for _ in range(num_orders - 1):
            prior_days = latest_recency_days + random.randint(7, 180)
            order_dates.append(now - timedelta(days=prior_days))
        order_dates.sort()

        for ord_date in order_dates:
            order_id = f"ord_{uuid.uuid4().hex[:10]}"
            items_count = random.randint(*archetype["items_per_order"])
            selected_products = random.sample(PRODUCT_SAMPLES, k=min(items_count, len(PRODUCT_SAMPLES)))

            order_total = 0.0
            for prod_id, prod_name, price in selected_products:
                qty = random.randint(1, 2)
                discount = 0.10 if random.random() < 0.25 else 0.0
                item_total = price * qty * (1.0 - discount)
                order_total += item_total

                order_items.append(
                    {
                        "id": f"item_{uuid.uuid4().hex[:10]}",
                        "order_id": order_id,
                        "product_id": prod_id,
                        "quantity": qty,
                        "unit_price": price,
                        "discount": discount,
                    }
                )

            orders.append(
                {
                    "id": order_id,
                    "tenant_id": tenant_id,
                    "customer_id": cust_id,
                    "status": "PAID",
                    "total": round(order_total, 2),
                    "currency": "EGP",
                    "payment_ref": f"PAYMOB-{random.randint(100000, 999999)}",
                    "shipping_awb": f"BOSTA-AWB-{random.randint(1000000, 9999999)}",
                    "created_at": ord_date.isoformat(),
                }
            )

    return customers, orders, order_items


if __name__ == "__main__":
    custs, ords, items = generate_rfm_customer_pool()
    print(f"Generated {len(custs)} customers, {len(ords)} orders, and {len(items)} order items.")
    segments = {}
    for c in custs:
        segments[c["rfm_segment"]] = segments.get(c["rfm_segment"], 0) + 1
    print("Segment distribution:", segments)
