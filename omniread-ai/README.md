# OmniRead AI Forecasting Service

Python FastAPI service that provides 7-day stockout predictions using an ensemble of ML models. Called by Spring Boot via HTTP; writes no data — only reads from the shared MySQL database.

## Setup

```powershell
cd omniread-ai
pip install -r requirements.txt
```

Requirements: `fastapi`, `uvicorn`, `pymysql`, `pandas`, `numpy`, `scikit-learn`, `shap`, `joblib`, `pydantic`

## Start

```powershell
python -m uvicorn app.main:app --host 127.0.0.1 --port 8081
```

Health check: `GET http://127.0.0.1:8081/health`

## Endpoints

### `POST /predict`

```json
// Request
{"product_id": 9001, "horizon_days": 7, "lookback_days": 14}

// Response (key fields)
{
  "code": 200,
  "data": {
    "prediction": {
      "product_id": 9001,
      "predicted_stockout_day": 3.5,
      "risk_score": 0.75,
      "risk_band": "CRITICAL",
      "predicted_demand": 210,
      "confidence_score": 0.82,
      "prediction_source": "ensemble"          // or "cold_start", "fallback"
    },
    "attribution": {
      "sales_velocity": 0.21,
      "current_stock": 0.18,
      "lead_time_days": 0.15,
      "sales_std": 0.14,
      "safety_stock": 0.12,
      "days_since_last_order": 0.11,
      "seasonality": 0.09
    },
    "counterfactual": {"stock_needed": 47, "risk_reduced_to": 0.5},
    "procurement_recommendation": {
      "should_trigger": true,
      "trigger_reason": "risk_score >= 0.75 AND stockout_day (3.5) <= lead_time (3)",
      "suggested_quantity": 13
    },
    "llm_summary_status": "disabled",
    "metadata": {"model_version": "ensemble-v1.4", "processing_time_ms": 12}
  }
}
```

### `GET /health`

```json
{"status": "healthy", "models_loaded": 3, "llm_available": false, "model_version": "ensemble-v1.4"}
```

## Models

| Model | Weight | Description |
|-------|--------|-------------|
| Random Forest | 0.5 | 100 trees, max_depth=10, feature importance from training |
| Holt-Winters | 0.3 | Additive trend+seasonality, period=7, smoothing 0.2/0.1/0.3 |
| Naive Baseline | 0.2 | Last observation carry-forward, fallback for short history |

### Cold-start Paths

When sales history < 14 days, the ensemble is not used. Instead:

| Path | Condition | Confidence |
|------|-----------|------------|
| `global_default` | No history at all | 0.5 |
| `category_avg` | Category has 90-day avg | 0.6 |
| `naive_only` | 7–13 days history | 0.7 |

Cold-start attribution has only 2 features: `days_ahead`, `sales_volatility`.

## Prediction Flow

1. `build_features()` — query sales velocity, stock levels, lead time from DB
2. `classify_path()` — decide cold_start vs ensemble
3. Run ensemble (or cold-start fallback)
4. `unify_attribution()` — SHAP-based feature importance, normalized to sum=1
5. `linear_counterfactual()` — how much stock needed to halve risk
6. `_procurement_decision()` — trigger if `risk >= 0.75 AND stockout <= lead_time`

## Scripts

| Script | Purpose |
|--------|---------|
| `train_rf.py` | Train Random Forest on historical sales, output to `models/ensemble-v1.4/` |
| `compute_weights.py` | Validate ensemble weights on held-out test set |
| `compute_category_avg.py` | Pre-compute average stockout day per category for cold-start |
| `seed_synthetic_data.py` | Generate synthetic order history for training |
| `gen_sales.py` / `gen_quick.py` | Quick test data generators |

## Configuration

See `config.yaml`:

```yaml
service:
  port: 8081

models:
  random_forest:
    n_estimators: 100
    max_depth: 10

ensemble:
  default_weights:
    random_forest: 0.5
    holt_winters: 0.3
    naive_baseline: 0.2

cold_start:
  min_history_days: 14
  global_default_stockout_day: 7
  global_default_risk: 0.5

risk:
  low_max: 0.25
  medium_max: 0.50
  high_max: 0.75

procurement:
  trigger_risk: 0.75
```

## Testing

```bash
pytest tests/ -v
```

End-to-end smoke test (`tests/test_smoke.py`):
1. Start AI service on port 8081
2. `POST /predict` with product 9001
3. Verify response has `prediction_source`, `attribution`, `procurement_recommendation`

## Database Schema

The AI service is read-only to MySQL. Schema is in `migration.sql`:

```sql
prediction_audit (shared with Spring Boot)
  id, product_id, forecast_date, horizon_days,
  model_version, predicted_stockout_day, risk_score,
  attribution_scores (JSON), counterfactual_stock,
  counterfactual_risk, llm_summary, llm_summary_status

stockout_forecasts
  id, product_id, forecast_date, target_date,
  predicted_demand, predicted_stock, stockout_risk,
  confidence_score, model_version, audit_id
```

## Phase Roadmap

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1 | ✅ Done | Cold-start rules, Naive Baseline |
| Phase 2 | ✅ Done | Ensemble (RF + HW + NB), SHAP attribution |
| Phase 3 | 🔜 TODO | Async LLM summary via OpenAI/Anthropic |
| Phase 4 | 🔜 TODO | 7-day shadow mode, A/B comparison |