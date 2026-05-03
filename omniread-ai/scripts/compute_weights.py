"""
Model Validation and Weight Calculation for OmniRead AI Ensemble

Computes per-model MAE on recent data and derives dynamic ensemble weights
using softmax with temperature scaling (DESIGN.md §4.2).

Usage:
    python scripts/compute_weights.py [--lookback-days 30]

This script:
1. Loads the trained RF model (if available)
2. Evaluates all 3 models on recent data
3. Computes per-model MAE
4. Outputs softmax weights for ensemble
"""

import argparse
import math
import warnings
from datetime import date, timedelta
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import yaml
from sklearn.metrics import mean_absolute_error

warnings.filterwarnings("ignore")

CONFIG_PATH = Path(__file__).parent.parent / "config.yaml"
MODELS_DIR = Path(__file__).parent.parent / "models"


def load_config() -> dict:
    with open(CONFIG_PATH) as f:
        return yaml.safe_load(f)


def create_database_engine(url: str):
    from sqlalchemy import create_engine, text
    return create_engine(url, pool_pre_ping=True, pool_recycle=3600)


def fetch_validation_data(engine, lookback_days: int, min_history_days: int) -> pd.DataFrame:
    from sqlalchemy import text

    since = date.today() - timedelta(days=lookback_days)
    with engine.connect() as conn:
        rows = conn.execute(
            text("""
                SELECT p.id as product_id, p.category,
                       ir.quantity_on_hand, ir.reserved_quantity,
                       ir.safety_stock, ir.supplier_lead_time_days,
                       DATE(o.created_at) AS sale_date,
                       SUM(oi.quantity) AS qty
                FROM products p
                JOIN inventory_records ir ON p.id = ir.product_id
                JOIN order_items oi ON p.id = oi.product_id
                JOIN orders o ON oi.order_id = o.id
                WHERE o.created_at >= :since
                  AND o.status IN ('SHIPPED', 'COMPLETED', 'PAID')
                GROUP BY p.id, DATE(o.created_at)
                ORDER BY p.id, sale_date
            """),
            {"since": since}
        ).mappings().all()

    if not rows:
        return pd.DataFrame()

    df = pd.DataFrame([dict(r) for r in rows])
    return df


def compute_maes(engine, config: dict, lookback_days: int, min_history_days: int) -> dict[str, float]:
    """Compute MAE for each model on recent data."""
    df = fetch_validation_data(engine, lookback_days, min_history_days)

    if len(df) < min_history_days:
        print(f"[compute_weights] WARNING: Only {len(df)} validation samples")
        return {}

    rf_model = None
    rf_path = Path(__file__).parent.parent / "models" / "random_forest-v1.0" / "model.joblib"
    if rf_path.exists():
        try:
            metadata = joblib.load(rf_path)
            rf_model = metadata["model"]
        except Exception:
            pass

    results = {"random_forest": [], "holt_winters": [], "naive_baseline": []}

    for pid, group in df.groupby("product_id"):
        if len(group) < min_history_days:
            continue

        sales_by_day = dict(zip(group["sale_date"], group["qty"]))
        current_stock = max(0, int(group.iloc[0]["quantity_on_hand"]) - int(group.iloc[0]["reserved_quantity"]))
        safety_stock = int(group.iloc[0]["safety_stock"])
        lead_time = int(group.iloc[0]["supplier_lead_time_days"])
        horizon = 7

        velocity = sum(sales_by_day.values()) / max(len(sales_by_day), 1)
        if velocity <= 0:
            continue

        actual_day = min(current_stock / velocity, horizon) if velocity > 0 else horizon
        if actual_day <= 0:
            actual_day = horizon

        hw_pred = min(horizon, (current_stock + safety_stock) / max(velocity, 0.1))
        naive_pred = min(horizon, current_stock / max(velocity, 0.1))

        results["holt_winters"].append(abs(hw_pred - actual_day))
        results["naive_baseline"].append(abs(naive_pred - actual_day))

        if rf_model is not None:
            feature_names = ["sales_velocity", "sales_std", "current_stock", "lead_time_days",
                           "safety_stock", "days_since_last_order", "day_of_week_sin", "day_of_week_cos"]
            x = np.array([[velocity, 0.0, current_stock, lead_time, safety_stock, 7, 0.0, 0.0]])
            rf_pred = float(rf_model.predict(x)[0])
            results["random_forest"].append(abs(rf_pred - actual_day))

    maes = {}
    for model, errors in results.items():
        if errors:
            maes[model] = sum(errors) / len(errors)

    return maes


def main():
    parser = argparse.ArgumentParser(description="Compute ensemble weights from validation MAE")
    parser.add_argument("--lookback-days", type=int, default=30, help="Validation lookback period")
    parser.add_argument("--min-samples", type=int, default=10, help="Minimum validation samples")
    args = parser.parse_args()

    config = load_config()
    engine = create_database_engine(config["database"]["url"])

    print(f"[compute_weights] Computing MAE for validation period: {args.lookback_days} days")
    maes = compute_maes(engine, config, args.lookback_days, args.min_samples)

    if not maes:
        print("[compute_weights] No validation data found. Using default weights.")
        weights = config["ensemble"]["default_weights"]
    else:
        print("[compute_weights] Per-model MAE:")
        for model, mae in sorted(maes.items(), key=lambda x: x[1]):
            print(f"  {model}: {mae:.3f}")

        from app.ensemble.weight_calculator import softmax_weights
        temperature = config["ensemble"].get("temperature", 2.0)
        weights = softmax_weights(maes, temperature)

        print(f"[compute_weights] Softmax weights (temperature={temperature}):")
        for model, w in sorted(weights.items(), key=lambda x: -x[1]):
            print(f"  {model}: {w:.4f}")

    weights_path = MODELS_DIR / "ensemble-v1.4" / "weights.json"
    weights_path.parent.mkdir(parents=True, exist_ok=True)

    import json
    with open(weights_path, "w") as f:
        json.dump({
            "weights": weights,
            "maes": maes,
            "computed_at": pd.Timestamp.now().isoformat(),
            "lookback_days": args.lookback_days,
        }, f, indent=2)

    print(f"[compute_weights] Weights saved to: {weights_path}")
    print("[compute_weights] Done!")


if __name__ == "__main__":
    main()
