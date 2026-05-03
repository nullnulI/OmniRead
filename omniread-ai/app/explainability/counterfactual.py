import math

TARGET_RISK = 0.5


def linear_counterfactual(
    current_stock: int,
    current_risk: float,
    attribution_current_stock: float,
) -> dict | None:
    """Linear approximation per DESIGN §4.3.

    Returns null when the formula is undefined: stock=0, risk already below target,
    or current_stock has non-positive attribution to risk.
    """
    if current_stock <= 0:
        return None
    if current_risk < TARGET_RISK:
        return None
    if attribution_current_stock <= 0:
        return None

    risk_delta_per_unit = attribution_current_stock * current_risk / current_stock
    if risk_delta_per_unit <= 0:
        return None
    extra = math.ceil((current_risk - TARGET_RISK) / risk_delta_per_unit)
    return {
        "stock_needed": int(current_stock + extra),
        "risk_reduced_to": round(TARGET_RISK, 4),
    }
