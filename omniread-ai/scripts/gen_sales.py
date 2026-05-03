"""
Quick insert synthetic sales data using raw SQLAlchemy connections.
"""
import random
from datetime import date, timedelta
from sqlalchemy import create_engine, text
from sqlalchemy.pool import QueuePool

random.seed(42)

url = "mysql+pymysql://root:change-me-local-only@localhost:3306/omniread"
engine = create_engine(url, pool_pre_ping=True, poolclass=QueuePool, pool_size=5)

num_products = 10
num_days = 60
base_product_id = 9100

start_date = date.today() - timedelta(days=num_days)

print(f"[gen_sales] Generating sales for {num_products} products × {num_days} days...")

order_id = 40000
count = 0

for i in range(num_products):
    pid = base_product_id + i
    velocity = random.uniform(0.5, 3.0)
    volatility = velocity * 0.3

    for day in range(num_days):
        if random.random() < 0.7:
            qty = max(1, int(random.gauss(velocity, volatility)))
            sale_date = start_date + timedelta(days=day)
            order_id += 1

            with engine.begin() as conn:
                try:
                    conn.execute(text("""
                        INSERT INTO orders (id, order_number, customer_id, status, payment_status, subtotal, shipping_fee, total_amount, shipping_address, created_at)
                        VALUES (:oid, :onum, :cid, 'PAID', 'PAID', :sub, 0, :tot, 'Synthetic', :date)
                    """), {
                        "oid": order_id,
                        "onum": f"ORD-{order_id}",
                        "cid": pid,
                        "sub": qty * 10.0,
                        "tot": qty * 10.0,
                        "date": sale_date
                    })

                    conn.execute(text("""
                        INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total, created_at)
                        VALUES (:oid, :pid, :qty, :price, :total, :date)
                    """), {
                        "oid": order_id,
                        "pid": pid,
                        "qty": qty,
                        "price": 10.0,
                        "total": qty * 10.0,
                        "date": sale_date
                    })
                    count += 1
                except Exception as e:
                    print(f"Error: {e}")

    if (i + 1) % 5 == 0:
        print(f"[gen_sales] Progress: product {i+1}/{num_products}")

print(f"[gen_sales] Done! Inserted {count} sales records")
