# packages/database/seed/seed_olist_egypt.py
"""
Master ETL Seeding Script for Egyptian E-Commerce Analytics (Olist / AdventureWorks adapted)
Maps order transactions, customers, and order items across Cairo, Alexandria, Giza, Mansoura, and Tanta.
"""
import os
import sys
import random
import uuid
from datetime import datetime, timedelta

EGYPTIAN_CITIES = [
    ("Cairo", 0.45),
    ("Giza", 0.25),
    ("Alexandria", 0.15),
    ("Mansoura", 0.08),
    ("Tanta", 0.07),
]

ELECTRONICS_CATALOG = [
    {"name": "JBL Flip 6 Waterproof Speaker", "category": "Speakers", "price": 5000.0, "cost": 3800.0},
    {"name": "Anker Soundcore Motion+ Bluetooth Speaker", "category": "Speakers", "price": 3200.0, "cost": 2100.0},
    {"name": "Sony WH-1000XM5 Wireless Headphones", "category": "Headphones", "price": 14500.0, "cost": 10500.0},
    {"name": "Apple AirPods Pro 2nd Gen", "category": "Earbuds", "price": 9800.0, "cost": 7400.0},
    {"name": "Anker 65W GaN Fast Charger", "category": "Chargers", "price": 850.0, "cost": 420.0},
    {"name": "Samsung 45W USB-C Super Fast Charger", "category": "Chargers", "price": 650.0, "cost": 340.0},
    {"name": "Baseus 100W Fast Charging Cable 2M", "category": "Cables", "price": 280.0, "cost": 110.0},
    {"name": "Spigen Tough Armor Case iPhone 15", "category": "Cases", "price": 600.0, "cost": 220.0},
    {"name": "Joyroom Magnetic Power Bank 10000mAh", "category": "Power Banks", "price": 1200.0, "cost": 650.0},
]

def choose_city():
    r = random.random()
    cumulative = 0.0
    for city, weight in EGYPTIAN_CITIES:
        cumulative += weight
        if r <= cumulative:
            return city
    return "Cairo"

def generate_mock_analytical_dataset(num_orders: int = 500, tenant_id: str = "tenant-demo-01"):
    """
    Generates realistic order and profit analytics rows formatted for v_order_profit_analytics.
    """
    start_date = datetime.now() - timedelta(days=90)
    dataset = []

    for i in range(num_orders):
        order_id = f"ord_{uuid.uuid4().hex[:10]}"
        order_date = start_date + timedelta(
            days=random.randint(0, 90),
            hours=random.randint(9, 22),
            minutes=random.randint(0, 59)
        )
        city = choose_city()
        cust_id = f"cust_{uuid.uuid4().hex[:8]}"
        prod = random.choice(ELECTRONICS_CATALOG)
        qty = random.choices([1, 2, 3, 5], weights=[0.7, 0.2, 0.07, 0.03])[0]
        price = prod["price"]
        cost = prod["cost"]
        gross = price * qty
        total_cost = cost * qty
        net_profit = gross - total_cost

        status = random.choices(["delivered", "shipped", "cancelled"], weights=[0.88, 0.08, 0.04])[0]

        dataset.append({
            "order_id": order_id,
            "tenant_id": tenant_id,
            "order_date": order_date.isoformat(),
            "order_day": order_date.strftime("%Y-%m-%d"),
            "order_status": status,
            "customer_id": cust_id,
            "customer_name": f"Customer {i+1}",
            "customer_segment": random.choice(["retail", "vip", "wholesale"]),
            "city": city,
            "product_id": f"prod_{uuid.uuid4().hex[:8]}",
            "sku": f"SKU-{prod['category'][:3].upper()}-{random.randint(10, 99)}",
            "product_name": prod["name"],
            "category_id": f"cat_{prod['category'].lower()}",
            "category_name": prod["category"],
            "quantity": qty,
            "unit_price": price,
            "gross_revenue": gross,
            "unit_cost": cost,
            "total_cost": total_cost,
            "net_profit": net_profit if status != "cancelled" else 0.0,
        })

    return dataset

if __name__ == "__main__":
    orders = generate_mock_analytical_dataset(100)
    print(f"Generated {len(orders)} analytical orders for Egypt (Cairo, Alex, Giza, Mansoura, Tanta).")
    sample = orders[0]
    print(f"Sample row: Order {sample['order_id']} in {sample['city']} -> {sample['product_name']} | Net Profit: {sample['net_profit']} EGP")
