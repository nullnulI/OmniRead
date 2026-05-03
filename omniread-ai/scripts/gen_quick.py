"""
Synthetic Data Generator for OmniRead AI Training
Quick and dirty version - generates data directly via docker exec.
"""

import random
from datetime import date, timedelta

random.seed(42)

categories = ["Fiction", "Technology", "Science", "History", "Arts"]
base_product_id = 9100
num_products = 50
num_days = 60

start_date = date.today() - timedelta(days=num_days)

print(f"[seed_synthetic] Generating {num_products} products × {num_days} days...")

# Generate products
products_sql = []
for i in range(num_products):
    pid = base_product_id + i
    category = categories[i % len(categories)]
    price = round(random.uniform(19.90, 59.90), 2)
    products_sql.append(
        f"({pid}, 'SYN-{pid}', '9789{str(pid).zfill(10)}', 'Synthetic Book {pid}', 'Author {pid % 100}', '{category}', 'PHYSICAL', {price}, 'ACTIVE')"
    )

products_sql = ",\n".join(products_sql)
print(f"[seed_synthetic] Generated {len(products_sql.split(','))} product VALUES")

# Generate inventory
inventory_sql = []
for i in range(num_products):
    pid = base_product_id + i
    stock = random.randint(8, 30)
    safety = random.randint(2, 6)
    lead = random.randint(5, 14)
    inventory_sql.append(
        f"({pid}, {stock}, 0, {safety}, {safety}, {lead})"
    )

inventory_sql = ",\n".join(inventory_sql)
print(f"[seed_synthetic] Generated {len(inventory_sql.split(','))} inventory VALUES")

# Generate sales data
print("[seed_synthetic] Generating sales data...")
sales_values = []
order_id_start = 30000
order_idx = 0

for i in range(num_products):
    pid = base_product_id + i
    velocity = random.uniform(0.5, 3.0)
    volatility = velocity * 0.3
    current_stock = random.randint(8, 30)

    for day in range(num_days):
        if random.random() < 0.7:
            qty = max(1, int(random.gauss(velocity, volatility)))
            sale_date = start_date + timedelta(days=day)
            order_id = order_id_start + order_idx
            order_idx += 1

            order_val = f"({order_id}, 'ORD-{order_id}', {pid}, 'PAID', 'PAID', {qty * 10}, 0, {qty * 10}, 'Test', '{sale_date}')"
            item_val = f"({order_id}, {pid}, {qty}, 10, {qty * 10}, '{sale_date}')"

            sales_values.append((order_val, item_val))

print(f"[seed_synthetic] Generated {len(sales_values)} sales records")

# Output SQL for verification
print(f"\n=== PRODUCTS SQL ({num_products} rows) ===")
print(products_sql[:500] + "..." if len(products_sql) > 500 else products_sql)

print(f"\n=== INVENTORY SQL ({num_products} rows) ===")
print(inventory_sql[:500] + "..." if len(inventory_sql) > 500 else inventory_sql)

print(f"\n[seed_synthetic] Total: {len(sales_values)} order/order_items pairs")
print("[seed_synthetic] Run the SQL manually via docker exec to insert data")
