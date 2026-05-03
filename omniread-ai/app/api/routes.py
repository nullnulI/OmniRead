import json
import time
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.config import CONFIG
from app.cold_start.detector import classify_path
from app.ensemble.meta_learner import combine
from app.explainability.attribution_mapper import unify_attribution
from app.explainability.counterfactual import linear_counterfactual
from app.features.engineer import build_features
from app.models.holt_winters import HoltWintersModel
from app.models.naive_baseline import NaiveBaselineModel
from app.models.random_forest import RandomForestModel

router = APIRouter()

_RF = RandomForestModel(CONFIG["models"]["random_forest"])
_HW = HoltWintersModel(CONFIG["models"]["holt_winters"])
_NB = NaiveBaselineModel(CONFIG["models"]["naive_baseline"])

_STARTED_AT = time.time()

_WEIGHTS_PATH = Path(__file__).parent.parent.parent / "models" / "ensemble-v1.4" / "weights.json"


def _load_weights() -> dict:
    if _WEIGHTS_PATH.exists():
        try:
            with open(_WEIGHTS_PATH) as f:
                data = json.load(f)
                return data.get("weights", CONFIG["ensemble"]["default_weights"])
        except Exception:
            pass
    return CONFIG["ensemble"]["default_weights"]


class PredictRequest(BaseModel):
    product_id: int = Field(..., gt=0)
    horizon_days: int = Field(default=7, ge=1, le=30)
    lookback_days: int = Field(default=14, ge=1, le=90)


class BatchPredictRequest(BaseModel):
    product_ids: list[int]
    horizon_days: int = Field(default=7, ge=1, le=30)
    lookback_days: int = Field(default=14, ge=1, le=90)


@router.get("/health")
def health() -> dict:
    return {
        "status": "healthy",
        "models_loaded": 3,
        "llm_available": False,
        "uptime_seconds": int(time.time() - _STARTED_AT),
        "model_version": CONFIG.get("model_version"),
    }


@router.post("/predict")
def predict(req: PredictRequest) -> dict:
    start = time.perf_counter()
    try:
        ctx = build_features(req.product_id, req.lookback_days)
    except LookupError as e:
        raise HTTPException(status_code=404, detail=str(e))

    horizon = req.horizon_days
    path = classify_path(ctx["history_days"], ctx["category"])

    if path == "global_default":
        cs = CONFIG["cold_start"]
        predicted_stockout_day = float(cs["global_default_stockout_day"])
        risk = float(cs["global_default_risk"])
        confidence = 0.5
        individual = {}
        prediction_source = "cold_start"
    elif path == "category_avg":
        from app.cold_start.detector import get_category_avg
        cat_data = get_category_avg(ctx.get("category"))
        if cat_data:
            predicted_stockout_day = float(cat_data["avg_stockout_day"])
            risk = float(cat_data["avg_risk"])
        else:
            cs = CONFIG["cold_start"]
            predicted_stockout_day = float(cs["global_default_stockout_day"])
            risk = float(cs["global_default_risk"])
        confidence = 0.6
        individual = {}
        prediction_source = "cold_start"
    elif path == "naive_only":
        nb = _NB.predict(ctx, horizon)
        predicted_stockout_day = float(nb)
        risk = _stockout_to_risk(predicted_stockout_day, horizon)
        confidence = 0.7
        individual = {"naive_baseline": {"prediction": nb, "weight": 1.0}}
        prediction_source = "cold_start"
    else:
        predictions = {
            "random_forest": _RF.predict(ctx),
            "holt_winters": _HW.predict(ctx, horizon),
            "naive_baseline": _NB.predict(ctx, horizon),
        }
        weights = _load_weights()
        predicted_stockout_day = combine(predictions, weights)
        risk = _stockout_to_risk(predicted_stockout_day, horizon)
        confidence = 0.82
        individual = {
            m: {"prediction": p, "weight": weights[m]} for m, p in predictions.items()
        }
        prediction_source = "ensemble"

    risk_band = _risk_to_band(risk)
    attribution = unify_attribution(_RF, _HW, ctx, prediction_source)

    counterfactual = linear_counterfactual(
        current_stock=ctx["current_stock"],
        current_risk=risk,
        attribution_current_stock=attribution.get("current_stock", 0.0),
    )

    procurement_recommendation = _procurement_decision(
        risk_score=risk,
        predicted_stockout_day=predicted_stockout_day,
        lead_time_days=ctx["lead_time_days"],
        safety_stock=ctx["safety_stock"],
        predicted_demand=ctx["sales_velocity"] * horizon,
        horizon_days=horizon,
    )

    elapsed_ms = int((time.perf_counter() - start) * 1000)
    return {
        "code": 200,
        "message": "success",
        "data": {
            "prediction": {
                "product_id": req.product_id,
                "predicted_stockout_day": round(predicted_stockout_day, 2),
                "risk_score": round(risk, 4),
                "risk_band": risk_band,
                "predicted_demand": int(round(ctx["sales_velocity"] * horizon)),
                "confidence_score": confidence,
                "prediction_source": prediction_source,
            },
            "model_outputs": {"individual_models": individual},
            "attribution": attribution,
            "counterfactual": counterfactual,
            "procurement_recommendation": procurement_recommendation,
            "llm_summary_status": "disabled",  # Phase 3 will enable
            "metadata": {
                "model_version": CONFIG.get("model_version"),
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "processing_time_ms": elapsed_ms,
            },
        },
    }


@router.post("/predict/batch")
def predict_batch(req: BatchPredictRequest) -> dict:
    results = []
    for pid in req.product_ids:
        try:
            r = predict(PredictRequest(product_id=pid, horizon_days=req.horizon_days, lookback_days=req.lookback_days))
            results.append(r["data"])
        except HTTPException as e:
            results.append({"product_id": pid, "error": e.detail})
    return {"code": 200, "data": results}


def _stockout_to_risk(stockout_day: float, horizon: int) -> float:
    if horizon <= 0:
        return 0.5
    risk = 1.0 - (stockout_day / horizon)
    return max(0.0, min(1.0, risk))


def _risk_to_band(risk: float) -> str:
    r = CONFIG["risk"]
    if risk < r["low_max"]:
        return "LOW"
    if risk < r["medium_max"]:
        return "MEDIUM"
    if risk < r["high_max"]:
        return "HIGH"
    return "CRITICAL"


def _procurement_decision(
    risk_score: float,
    predicted_stockout_day: float,
    lead_time_days: int,
    safety_stock: int,
    predicted_demand: float,
    horizon_days: int,
) -> dict:
    trigger_risk = CONFIG["procurement"]["trigger_risk"]
    should_trigger = (
        risk_score >= trigger_risk
        and predicted_stockout_day <= lead_time_days
    )
    if not should_trigger:
        return {"should_trigger": False, "trigger_reason": None, "suggested_quantity": 0, "supplier_hint": None}
    if horizon_days <= 0:
        suggested = safety_stock * 2
    else:
        suggested = max(safety_stock * 2, int(predicted_demand * lead_time_days / horizon_days))
    return {
        "should_trigger": True,
        "trigger_reason": (
            f"risk_score >= {trigger_risk} AND stockout_day "
            f"({predicted_stockout_day:.1f}) <= lead_time ({lead_time_days})"
        ),
        "suggested_quantity": int(suggested),
        "supplier_hint": None,
    }
