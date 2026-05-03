"""
Synthetic Data Generator for OmniRead AI Training

Generates 50 SKUs × 60 days of sales data with restock events.
Each restock→stockout cycle produces 1 training sample for RF.

Usage:
    python scripts/seed_synthetic_data.py [--products 50] [--days 60] [--drop-existing]
"""

import argparse
import random
from datetime import date, timedelta
from pathlib import Path

import yaml

random.seed(42)

CONFIG_PATH = Path(__file__).parent.parent / "config.yaml"


def load_config() -> dict:
    with open(CONFIG_PATH) as f:
        return yaml.safe_load(f)


def create_database_engine(url: str):
    from sqlalchemy import create_engine, text
    return create_engine(url, pool_pre_ping=True, pool_recycle=3600)


def main():
    parser = argparse.ArgumentParser(description="Generate synthetic training data")
    parser.add_argument("--products", type=int, default=50, help="Number of products to create")
    parser.add_argument("--days", type=int, default=60, help="Number of days of sales history")
    parser.add_argument("--drop-existing", action="store_true", help="Drop existing synthetic products")
    args = parser.parse_args()

    config = load_config()
    engine = create_database_engine(config["database"]["url"])

    categories = ["Fiction", "Technology", "Science", "History", "Arts"]
    base_product_id = 9100

    print(f"[seed_synthetic] Generating {args.products} products × {args.days} days...")

    with engine.begin() as conn:
        from sqlalchemy import text

        if args.drop_existing:
            print("[seed_synthetic] Dropping existing synthetic products...")
            conn.execute(text("DELETE FROM order_items WHERE product_id >= :base_id"), {"base_id": base_product_id})
            conn.execute(text("DELETE FROM orders WHERE customer_id >= :base_id"), {"base_id": base_product_id})
            conn.execute(text("DELETE FROM inventory_records WHERE product_id >= :base_id"), {"base_id": base_product_id})
            conn.execute(text("DELETE FROM products WHERE id >= :base_id"), {"base_id": base_product_id})

    products_created = 0
    restock_cycles = 0
    total_samples = 0
    start_date = date.today() - timedelta(days=args.days)

    for i in range(args.products):
        product_id = base_product_id + i
        category = categories[i % len(categories)]

        initial_stock = random.randint(8, 30)
        safety_stock = random.randint(2, 6)
        lead_time = random.randint(5, 14)

        velocity = random.uniform(0.5, 3.0)
        volatility = velocity * random.uniform(0.2, 0.5)

        with engine.begin() as conn:
            from sqlalchemy import text

            conn.execute(text("""
                INSERT INTO products (id, sku, isbn13, title, author_name, category, book_type, price, status)
                VALUES (:pid, :sku, :isbn, :title, :author, :cat, 'PHYSICAL', :price, 'ACTIVE')
            """), {
                "pid": product_id,
                "sku": f"SYN-{product_id}",
                "isbn": f"9789{str(product_id).zfill(10)}",
                "title": f"Synthetic Book {product_id}",
                "author": f"Author {product_id % 100}",
                "cat": category,
                "price": round(random.uniform(19.90, 59.90), 2)
            })

            conn.execute(text("""
                INSERT INTO inventory_records
                (product_id, quantity_on_hand, reserved_quantity, reorder_threshold, safety_stock, supplier_lead_time_days)
                VALUES (:pid, :stock, 0, :reorder, :safety, :lead)
            """), {
                "pid": product_id,
                "stock": initial_stock,
                "reorder": safety_stock,
                "safety": safety_stock,
                "lead": lead_time
            })

        products_created += 1

        current_stock = initial_stock
        restock_threshold = safety_stock
        day_of_last_restock = 0
        last_restock_quantity = initial_stock

        order_id = 20000 + i * 1000
        day_samples = []

        for day in range(args.days):
            if current_stock <= 0:
                if last_restock_quantity > 0 and day > day_of_last_restock:
                    actual_stockout_day = day - day_of_last_restock
                    day_samples.append({
                        "product_id": product_id,
                        "restock_day": day_of_last_restock,
                        "actual_stockout_day": actual_stockout_day,
                    })
                    restock_cycles += 1
                    total_samples += 1

                current_stock = initial_stock
                last_restock_quantity = initial_stock
                day_of_last_restock = day
                lead_time = random.randint(5, 14)

            expected_sales = velocity + random.gauss(0, volatility)
            if expected_sales < 0:
                expected_sales = velocity * 0.5

            num_sales = 0
            if random.random() < 0.75:
                num_sales = max(1, int(random.gauss(expected_sales, volatility * 0.5)))

            if num_sales > 0 and current_stock > 0:
                sale_qty = min(num_sales, current_stock)
                current_stock -= sale_qty

                order_id += 1
                sale_date = start_date + timedelta(days=day)

                with engine.begin() as conn:
                    from sqlalchemy import text

                    conn.execute(text("""
                        INSERT INTO orders (id, order_number, customer_id, status, payment_status,
                            subtotal, shipping_fee, total_amount, shipping_address, created_at)
                        VALUES (:oid, :onum, :cid, 'PAID', 'PAID', :sub, 0, :tot, 'Synthetic', :date)
                    """), {
                        "oid": order_id,
                        "onum": f"ORD-{order_id}",
                        "cid": product_id,
                        "sub": sale_qty * 10.0,
                        "tot": sale_qty * 10.0,
                        "date": sale_date
                    })

                    conn.execute(text("""
                        INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total, created_at)
                        VALUES (:oid, :pid, :qty, :price, :total, :date)
                    """), {
                        "oid": order_id,
                        "pid": product_id,
                        "qty": sale_qty,
                        "price": 10.0,
                        "total": sale_qty * 10.0,
                        "date": sale_date
                    })

            if current_stock <= restock_threshold and random.random() < 0.3:
                current_stock += initial_stock
                last_restock_quantity = initial_stock
                day_of_last_restock = day

    print(f"[seed_synthetic] Done!")
    print(f"  Products created: {products_created}")
    print(f"  Restock cycles generated: {restock_cycles}")
    print(f"  Total training samples: {total_samples}")

    print(f"\n[seed_synthetic] Summary by category:")
    with engine.connect() as conn:
        from sqlalchemy import text
        rows = conn.execute(text("""
            SELECT category, COUNT(*) as cnt
            FROM products WHERE id >= :base_id
            GROUP BY category
        """), {"base_id": base_product_id}).mappings().all()
        for row in rows:
            print(f"  {row['category']}: {row['cnt']}")

    print(f"\n[seed_synthetic] Sample counts by product:")
    with engine.connect() as conn:
        from sqlalchemy import text
        rows = conn.execute(text("""
            SELECT p.id, p.category,
                   COUNT(DISTINCT o.id) as order_count,
                   COALESCE(SUM(oi.quantity), 0) as total_qty
            FROM products p
            LEFT JOIN order_items oi ON p.id = oi.product_id
            LEFT JOIN orders o ON oi.order_id = o.id
            WHERE p.id >= :base_id
            GROUP BY p.id, p.category
            ORDER BY total_qty DESC
            LIMIT 10
        """), {"base_id": base_product_id}).mappings().all()
        for row in rows:
            print(f"  Product {row['id']} ({row['category']}): {row['order_count']} orders, {row['total_qty']} units")

    print(f"\n[seed_synthetic] Ready for training!")
    print(f"  Run: python scripts/train_rf.py --min-samples 10 --lookback-days {args.days}")


if __name__ == "__main__":
    main()
