"""
Category Average Computation Script for OmniRead AI Forecasting Service

Precomputes category-level average stockout day and risk for cold-start products
with insufficient history (< 7 days). Results are cached to MySQL.

Usage:
    python scripts/compute_category_avg.py [--lookback-days 90]
"""

import argparse
import json
import warnings
from datetime import date, timedelta
from pathlib import Path

import pandas as pd
import yaml

warnings.filterwarnings("ignore")

CONFIG_PATH = Path(__file__).parent.parent / "config.yaml"
CACHE_DIR = Path(__file__).parent.parent / "cache"


def load_config() -> dict:
    with open(CONFIG_PATH) as f:
        return yaml.safe_load(f)


def create_database_engine(url: str):
    from sqlalchemy import create_engine, text
    return create_engine(url, pool_pre_ping=True, pool_recycle=3600)


def compute_category_averages(engine, lookback_days: int) -> dict[str, dict]:
    from sqlalchemy import text

    since = date.today() - timedelta(days=lookback_days)

    with engine.connect() as conn:
        rows = conn.execute(
            text("""
                SELECT
                    p.category,
                    p.id as product_id,
                    ir.quantity_on_hand,
                    ir.reserved_quantity,
                    ir.safety_stock,
                    ir.supplier_lead_time_days,
                    SUM(oi.quantity) as total_qty,
                    COUNT(DISTINCT DATE(o.created_at)) as active_days
                FROM products p
                JOIN inventory_records ir ON p.id = ir.product_id
                JOIN order_items oi ON p.id = oi.product_id
                JOIN orders o ON oi.order_id = o.id
                WHERE o.created_at >= :since
                  AND o.status IN ('SHIPPED', 'COMPLETED', 'PAID')
                  AND p.category IS NOT NULL
                  AND p.category != ''
                GROUP BY p.category, p.id, ir.quantity_on_hand, ir.reserved_quantity,
                         ir.safety_stock, ir.supplier_lead_time_days
            """),
            {"since": since}
        ).mappings().all()

    if not rows:
        return {}

    df = pd.DataFrame([dict(r) for r in rows])

    category_stats = {}
    for category, group in df.groupby("category"):
        if len(group) < 3:
            continue

        avg_velocity = group["total_qty"].sum() / (lookback_days * len(group))
        avg_stock = (group["quantity_on_hand"] - group["reserved_quantity"]).mean()
        avg_lead = group["supplier_lead_time_days"].mean()
        avg_safety = group["safety_stock"].mean()

        avg_stockout_day = float("inf")
        if avg_velocity > 0:
            avg_stockout_day = min(avg_stock / avg_velocity, 7.0)

        avg_risk = 1.0 - (avg_stockout_day / 7.0) if avg_stockout_day < float("inf") else 1.0

        category_stats[category] = {
            "avg_stockout_day": round(avg_stockout_day, 2),
            "avg_risk": round(max(0.0, min(1.0, avg_risk)), 4),
            "avg_velocity": round(avg_velocity, 4),
            "avg_stock": round(avg_stock, 2),
            "avg_lead_time": round(avg_lead, 1),
            "avg_safety_stock": round(avg_safety, 1),
            "sample_count": len(group),
        }

    return category_stats


def main():
    parser = argparse.ArgumentParser(description="Compute category-level averages for cold-start")
    parser.add_argument("--lookback-days", type=int, default=90, help="Historical lookback period")
    args = parser.parse_args()

    config = load_config()
    engine = create_database_engine(config["database"]["url"])

    print(f"[compute_category_avg] Computing category averages (lookback={args.lookback_days})...")
    stats = compute_category_averages(engine, args.lookback_days)

    if not stats:
        print("[compute_category_avg] No category data found. Using global defaults.")
        return

    print(f"[compute_category_avg] Computed for {len(stats)} categories:")
    for cat, data in sorted(stats.items(), key=lambda x: -x[1]["avg_risk"]):
        print(f"  {cat}: stockout_day={data['avg_stockout_day']}, risk={data['avg_risk']}")

    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache_path = CACHE_DIR / "category_avg.json"

    with open(cache_path, "w") as f:
        json.dump({
            "category_stats": stats,
            "computed_at": pd.Timestamp.now().isoformat(),
            "lookback_days": args.lookback_days,
        }, f, indent=2)

    print(f"[compute_category_avg] Cache saved to: {cache_path}")
    print("[compute_category_avg] Done!")


if __name__ == "__main__":
    main()
