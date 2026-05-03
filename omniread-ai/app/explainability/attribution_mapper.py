from app.config import CONFIG
from app.explainability.shap_adapter import SHAPAdapter


_SHAP_ADAPTER: SHAPAdapter | None = None


def _get_shap_adapter() -> SHAPAdapter:
    global _SHAP_ADAPTER
    if _SHAP_ADAPTER is None:
        _SHAP_ADAPTER = SHAPAdapter()
    return _SHAP_ADAPTER


def unify_attribution(rf_model, hw_model, ctx: dict, source: str) -> dict[str, float]:
    """Map per-model attributions to a unified feature space normalized to sum=1.

    Phase 2: Uses SHAP TreeExplainer for RF when model is trained.
    Falls back to heuristic importance when SHAP is unavailable (Phase 1 behavior).
    """
    if source == "cold_start":
        return {"days_ahead": 0.6, "sales_volatility": 0.4}

    weights = CONFIG["ensemble"]["default_weights"]

    shap_adapter = _get_shap_adapter()
    if shap_adapter.is_available():
        rf_attr = shap_adapter.compute_shap_values(ctx)
    else:
        rf_attr = rf_model.feature_importances() or _heuristic_importance(ctx)

    hw_attr = _holt_winters_attribution(hw_model)
    naive_attr = {"days_ahead": 0.5, "sales_volatility": 0.5}

    combined: dict[str, float] = {}
    for attr, w in (
        (rf_attr, weights["random_forest"]),
        (hw_attr, weights["holt_winters"]),
        (naive_attr, weights["naive_baseline"]),
    ):
        for k, v in attr.items():
            combined[k] = combined.get(k, 0.0) + v * w

    total = sum(combined.values())
    if total <= 0:
        return {}
    return {k: round(v / total, 4) for k, v in combined.items()}


def _heuristic_importance(ctx: dict) -> dict[str, float]:
    """Phase 1 placeholder until RF is trained: weight by feature magnitudes."""
    raw = {
        "sales_velocity": ctx["sales_velocity"],
        "current_stock": 1.0 / max(ctx["current_stock"], 1),
        "lead_time_days": ctx["lead_time_days"] / 14.0,
        "sales_volatility": ctx["sales_std"],
    }
    total = sum(raw.values()) or 1.0
    return {k: v / total for k, v in raw.items()}


def _holt_winters_attribution(hw_model) -> dict[str, float]:
    decomp = getattr(hw_model, "last_decomposition", None)
    if not decomp:
        return {"sales_trend": 0.5, "seasonality": 0.5}
    trend = abs(decomp.get("trend", 0.0))
    seasonal = abs(decomp.get("season_amplitude", 0.0))
    level = abs(decomp.get("level", 0.0))
    total = trend + seasonal + level or 1.0
    return {
        "sales_trend": trend / total,
        "seasonality": seasonal / total,
        "current_stock": level / total,
    }
