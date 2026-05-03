import random
from datetime import date, timedelta
import sys

random.seed(42)

# Generate sales for products 9011-9020 over 90 days
# Each product has different sales velocity
products_params = {
    9011: {"vel": 2.0, "var": 0.5},
    9012: {"vel": 1.5, "var": 0.3},
    9013: {"vel": 3.0, "var": 0.8},
    9014: {"vel": 1.0, "var": 0.2},
    9015: {"vel": 2.5, "var": 0.6},
    9016: {"vel": 1.8, "var": 0.4},
    9017: {"vel": 2.2, "var": 0.5},
    9018: {"vel": 0.8, "var": 0.2},
    9019: {"vel": 1.2, "var": 0.3},
    9020: {"vel": 2.8, "var": 0.7},
}

start_date = date.today() - timedelta(days=90)

# Generate sales records
sales_records = []
for pid, params in products_params.items():
    for day_offset in range(90):
        expected_sales = params["vel"]
        if random.random() < 0.75:  # 75% chance of having sales
            qty = max(1, int(random.gauss(expected_sales, params["var"])))
            sale_date = start_date + timedelta(days=day_offset)
            sales_records.append((pid, qty, sale_date))

# Generate order + order_item records
sql = []
order_id = 10000
for pid, qty, sale_date in sales_records:
    order_id += 1
    sql.append(f"({order_id}, 'ORD-{order_id}', 9001, 'PAID', 'PAID', {qty*10}, 0, {qty*10}, 'Test Address', '{sale_date}')")

# Insert orders
print("INSERT IGNORE INTO orders (id, order_number, customer_id, status, payment_status, subtotal, shipping_fee, total_amount, shipping_address, created_at) VALUES")
print(",".join(sql[:100]) + ";" if len(sql) > 100 else ",".join(sql) + ";")
print(f"-- Total {len(sql)} orders generated, {len(sales_records)} sales records")
