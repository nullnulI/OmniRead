import math
from datetime import date, timedelta

from app.utils.database import fetchall, fetchone


def build_features(product_id: int, lookback_days: int) -> dict:
    product = fetchone(
        """
        SELECT p.id, p.book_type, p.category, ir.quantity_on_hand, ir.reserved_quantity,
               ir.safety_stock, ir.supplier_lead_time_days, ir.reorder_threshold
        FROM products p
        LEFT JOIN inventory_records ir ON ir.product_id = p.id
        WHERE p.id = :pid
        """,
        pid=product_id,
    )
    if not product:
        raise LookupError(f"product {product_id} not found")

    today = date.today()
    since = today - timedelta(days=lookback_days)

    rows = fetchall(
        """
        SELECT DATE(o.created_at) AS sale_date, SUM(oi.quantity) AS qty
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE oi.product_id = :pid
          AND o.created_at >= :since
          AND o.status IN ('SHIPPED', 'COMPLETED', 'PAID')
        GROUP BY DATE(o.created_at)
        ORDER BY sale_date
        """,
        pid=product_id,
        since=since,
    )

    sales_by_day = {r["sale_date"]: int(r["qty"]) for r in rows}
    history_days = len(sales_by_day)
    daily_series = [sales_by_day.get(since + timedelta(days=i), 0) for i in range(lookback_days)]

    total_sales = sum(daily_series)
    sales_velocity = total_sales / lookback_days if lookback_days else 0.0
    sales_std = _std(daily_series, sales_velocity)

    current_stock = max(0, (product.get("quantity_on_hand") or 0) - (product.get("reserved_quantity") or 0))
    lead_time_days = product.get("supplier_lead_time_days") or 7
    safety_stock = product.get("safety_stock") or 0

    last_order_date = max(sales_by_day.keys()) if sales_by_day else None
    days_since_last_order = (today - last_order_date).days if last_order_date else lookback_days

    dow = today.weekday()
    dow_sin = math.sin(2 * math.pi * dow / 7)
    dow_cos = math.cos(2 * math.pi * dow / 7)

    return {
        "product_id": product_id,
        "category": product.get("category"),
        "book_type": product.get("book_type"),
        "history_days": history_days,
        "daily_series": daily_series,
        "sales_velocity": sales_velocity,
        "sales_std": sales_std,
        "current_stock": current_stock,
        "lead_time_days": int(lead_time_days),
        "safety_stock": int(safety_stock),
        "days_since_last_order": int(days_since_last_order),
        "day_of_week_sin": dow_sin,
        "day_of_week_cos": dow_cos,
    }


def _std(series: list[float], mean: float) -> float:
    if len(series) < 2:
        return 0.0
    variance = sum((x - mean) ** 2 for x in series) / (len(series) - 1)
    return variance ** 0.5
