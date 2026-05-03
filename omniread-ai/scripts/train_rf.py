"""
Random Forest Training Script for OmniRead AI Forecasting Service

Usage:
    python scripts/train_rf.py [--lookback-days 90] [--min-samples 30]

This script:
1. Queries historical sales data from MySQL
2. Generates training labels using heuristic-based stockout detection
3. Trains a RandomForest model
4. Saves the model to models/random_forest-v1.0/model.joblib
"""

import argparse
import math
import sys
import warnings
from datetime import date, timedelta
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import yaml
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error

warnings.filterwarnings("ignore")

CONFIG_PATH = Path(__file__).parent.parent / "config.yaml"
MODELS_DIR = Path(__file__).parent.parent / "models" / "random_forest-v1.0"


def load_config() -> dict:
    with open(CONFIG_PATH) as f:
        return yaml.safe_load(f)


def create_database_engine(url: str):
    from sqlalchemy import create_engine, text
    return create_engine(url, pool_pre_ping=True, pool_recycle=3600)


def fetch_sales_time_series(engine, product_id: int, lookback_days: int) -> list[dict]:
    since = date.today() - timedelta(days=lookback_days)
    with engine.connect() as conn:
        rows = conn.execute(
            text("""
                SELECT DATE(o.created_at) AS sale_date, SUM(oi.quantity) AS qty
                FROM order_items oi
                JOIN orders o ON o.id = oi.order_id
                WHERE oi.product_id = :pid
                  AND o.created_at >= :since
                  AND o.status IN ('SHIPPED', 'COMPLETED', 'PAID')
                GROUP BY DATE(o.created_at)
                ORDER BY sale_date
            """),
            {"pid": product_id, "since": since}
        ).mappings().all()
    return [dict(r) for r in rows]


def fetch_all_products(engine) -> list[dict]:
    with engine.connect() as conn:
        rows = conn.execute(
            text("""
                SELECT p.id, p.category, p.book_type,
                       ir.quantity_on_hand, ir.reserved_quantity,
                       ir.safety_stock, ir.supplier_lead_time_days
                FROM products p
                JOIN inventory_records ir ON p.id = ir.product_id
                WHERE p.status = 'ACTIVE'
            """)
        ).mappings().all()
    return [dict(r) for r in rows]


def compute_daily_features(sales_by_day: dict, today: date, lookback_days: int) -> dict:
    daily_series = [
        sales_by_day.get(today - timedelta(days=i), 0)
        for i in range(lookback_days)
    ]
    total_sales = sum(daily_series)
    velocity = total_sales / lookback_days if lookback_days else 0.0
    mean_val = velocity
    std_val = 0.0
    if len(daily_series) >= 2:
        variance = sum((x - mean_val) ** 2 for x in daily_series) / (len(daily_series) - 1)
        std_val = math.sqrt(variance)

    last_order_date = max(sales_by_day.keys()) if sales_by_day else None
    days_since_last_order = (today - last_order_date).days if last_order_date else lookback_days

    dow = today.weekday()
    dow_sin = math.sin(2 * math.pi * dow / 7)
    dow_cos = math.cos(2 * math.pi * dow / 7)

    return {
        "sales_velocity": velocity,
        "sales_std": std_val,
        "days_since_last_order": days_since_last_order,
        "day_of_week_sin": dow_sin,
        "day_of_week_cos": dow_cos,
    }


def generate_label_from_heuristic(
    sales_by_day: dict,
    current_stock: int,
    safety_stock: int,
    lead_time_days: int,
    horizon: int = 7
) -> float:
    """Use heuristic formula as pseudo-label for training.

    Formula: predicted_stockout_day = stock / velocity
    This generates a "reasonable" stockout day based on sales velocity.
    """
    daily_series = list(sales_by_day.values())
    if not daily_series:
        return float(horizon)

    velocity = sum(daily_series) / max(len(daily_series), 1)
    if velocity <= 0:
        return float(horizon)

    predicted_day = current_stock / velocity
    return float(min(predicted_day, horizon))


def prepare_training_data(engine, config: dict, lookback_days: int, min_history_days: int):
    """Prepare X, y from historical data for all products with sufficient history."""
    products = fetch_all_products(engine)
    all_records = []

    for product in products:
        pid = product["id"]
        current_stock = max(0, (product.get("quantity_on_hand") or 0) - (product.get("reserved_quantity") or 0))
        safety_stock = product.get("safety_stock") or 0
        lead_time_days = product.get("supplier_lead_time_days") or 7

        sales_rows = fetch_sales_time_series(engine, pid, lookback_days)
        if len(sales_rows) < min_history_days:
            continue

        sales_by_day = {r["sale_date"]: int(r["qty"]) for r in sales_rows}
        features = compute_daily_features(sales_by_day, date.today(), lookback_days)

        label = generate_label_from_heuristic(
            sales_by_day, current_stock, safety_stock, lead_time_days
        )

        record = {
            "product_id": pid,
            "current_stock": current_stock,
            "lead_time_days": lead_time_days,
            "safety_stock": safety_stock,
            "category": product.get("category") or "UNKNOWN",
            "category_encoded": hash(product.get("category") or "UNKNOWN") % 1000,
            **features,
            "label": label,
        }
        all_records.append(record)

    return pd.DataFrame(all_records)


def main():
    parser = argparse.ArgumentParser(description="Train Random Forest model")
    parser.add_argument("--lookback-days", type=int, default=90, help="Historical lookback period")
    parser.add_argument("--min-samples", type=int, default=30, help="Minimum training samples")
    parser.add_argument("--test-size", type=float, default=0.2, help="Test set proportion")
    args = parser.parse_args()

    config = load_config()
    print(f"[train_rf] Config loaded. Model version: {config.get('model_version')}")

    engine = create_database_engine(config["database"]["url"])

    print(f"[train_rf] Preparing training data (lookback={args.lookback_days}, min_history={args.min_samples})...")
    df = prepare_training_data(engine, config, args.lookback_days, args.min_samples)

    if len(df) < args.min_samples:
        print(f"[train_rf] ERROR: Only {len(df)} samples found, minimum {args.min_samples} required.")
        print("[train_rf] Consider running with --min-samples 10 for testing.")
        sys.exit(1)

    print(f"[train_rf] Prepared {len(df)} training samples")

    feature_names = [
        "sales_velocity", "sales_std", "current_stock", "lead_time_days",
        "safety_stock", "days_since_last_order",
        "day_of_week_sin", "day_of_week_cos"
    ]

    X = df[feature_names].values
    y = df["label"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=args.test_size, random_state=42
    )

    print(f"[train_rf] Training set: {len(X_train)}, Test set: {len(X_test)}")

    rf_config = config.get("models", {}).get("random_forest", {})
    model = RandomForestRegressor(
        n_estimators=rf_config.get("n_estimators", 100),
        max_depth=rf_config.get("max_depth", 10),
        min_samples_split=rf_config.get("min_samples_split", 5),
        random_state=42,
        n_jobs=-1,
    )

    print("[train_rf] Fitting RandomForest...")
    model.fit(X_train, y_train)

    y_pred_train = model.predict(X_train)
    y_pred_test = model.predict(X_test)
    mae_train = mean_absolute_error(y_train, y_pred_train)
    mae_test = mean_absolute_error(y_test, y_pred_test)

    print(f"[train_rf] MAE - Train: {mae_train:.3f}, Test: {mae_test:.3f}")

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    model_path = MODELS_DIR / "model.joblib"

    metadata = {
        "model": model,
        "feature_names": feature_names,
        "mae_train": mae_train,
        "mae_test": mae_test,
        "n_samples": len(df),
        "lookback_days": args.lookback_days,
        "trained_at": pd.Timestamp.now().isoformat(),
    }

    joblib.dump(metadata, model_path)
    print(f"[train_rf] Model saved to: {model_path}")

    print("[train_rf] Feature importances:")
    importances = dict(zip(feature_names, model.feature_importances_.tolist()))
    for feat, imp in sorted(importances.items(), key=lambda x: -x[1]):
        print(f"  {feat}: {imp:.4f}")

    print("[train_rf] Done!")


if __name__ == "__main__":
    main()
