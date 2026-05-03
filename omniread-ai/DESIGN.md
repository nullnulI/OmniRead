# OmniRead AI Forecasting Module Design

**Version:** 1.4
**Date:** 2026-05-01
**Status:** MVP-ready

---

## 1. Overview

### 1.1 Purpose

AI-powered 7-day stockout prediction to replace rules-v1.0. Spring Boot calls AI service via HTTP; LLM summaries are async and non-blocking.

### 1.2 Business Requirements (from SRS)

| ID | Requirement | Coverage |
|----|-------------|----------|
| REQ-4.3-2 | Rolling 7-day stockout predictions | ✅ 3-model ensemble |
| REQ-4.3-3 | Internal sales + supplier lead time only | ✅ AI reads order_items + inventory_records |
| REQ-4.3-4 | Visual timeline ranked by urgency | ✅ risk_score + risk_band in response |
| REQ-4.3-6 | Auto-trigger procurement when forecast below threshold | ✅ AI returns `procurement_recommendation`; Spring Boot dispatches |
| REQ-4.3-8 | Log all forecasts and procurement dispatch timestamps | ✅ `prediction_audit.created_at` + `procurement_requests.dispatched_at` |

### 1.3 Design Principles

| Principle | Description |
|-----------|-------------|
| Reliability over Accuracy | 3-model ensemble with clear fallback |
| Interpretability First | Feature attribution on every prediction |
| Async by Default | LLM does not block prediction response |
| Cold-Start Aware | Tiered fallback for products without history |

---

## 2. Architecture

**Component:** FastAPI service (port 8081) with 3 model ensemble, MySQL read-only access, async LLM processing.

```
Spring Boot (8080) ──HTTP──> AI Service (8081) ──read──> MySQL (3307)
                              │
                              ├── Random Forest
                              ├── Holt-Winters
                              └── Naive Baseline
                              │
                              └── LLM (async, Qwen2.5-7B)
```

**Data Access:** AI service is read-only to business DB. Spring Boot writes `prediction_audit`, `stockout_forecasts`, and `procurement_requests` using AI response payloads.

---

## 3. Data Model

### 3.1 Tables

| Table | Changes |
|-------|---------|
| `stockout_forecasts` | + `audit_id` FK to prediction_audit |
| `prediction_audit` | New: stores risk_score, attribution, LLM summary, counterfactual. **Full DDL in migration.sql.** Key fields: `risk_score DECIMAL(5,4)`, `attribution_scores JSON`, `llm_summary TEXT nullable`, `counterfactual_stock INT nullable` |
| `procurement_requests` | + `dispatched_at DATETIME NULL` for tracking (satisfies REQ-4.3-8) |
| `inventory_events` | **Deleted** - training labels computed on-demand from order_items |

### 3.2 Risk Mapping

| risk_score | band | LLM triggered |
|------------|------|--------------|
| [0.00, 0.25) | LOW | No |
| [0.25, 0.50) | MEDIUM | No |
| [0.50, 0.75) | HIGH | Yes |
| [0.75, 1.00] | CRITICAL | Yes |

### 3.3 Training Labels

Derived from `order_items` + `procurement_requests` (no new table needed):
1. Aggregate daily sales by product
2. Inferred restock events from fulfilled procurement
3. Compute actual_stockout_day = first day cumulative_sales >= restock_quantity

---

## 4. Algorithms

### 4.1 3-Model Ensemble

| Model | Strength | Attribution |
|-------|----------|-------------|
| Random Forest | Non-linearity | TreeExplainer SHAP |
| Holt-Winters | Trend + weekly seasonality | Uses statsmodels `.level/.trend/.season` state variables |
| Naive Baseline | Cold-start safe | Simple formula |

**Ensemble Formula:**
```
wi = softmax(-MAE_i / temperature)  # temperature = 2.0
final = Σ(wi * prediction_i) / Σ(wi)
```

### 4.2 Attribution (Unified Space)

All models map to unified attribution scores (sum = 1.0):
- RF: TreeExplainer SHAP values
- HW: Map trend→sales_trend, seasonal→seasonality, level→current_stock
- Naive: time_elapsed→days_ahead, volatility→sales_volatility

### 4.3 Counterfactual (Linear Approximation)

Instead of grid search (expensive), use attribution-based linear approximation:
```
risk_delta_per_unit = attribution["current_stock"] * current_risk / current_stock
stock_needed = ceil((current_risk - 0.5) / risk_delta_per_unit)
```
**Edge cases:** returns `null` if `current_stock=0` or `current_risk<0.5` or `attribution["current_stock"]<=0`.

### 4.4 Cold-Start Tiered Fallback

```
history_days == 0 OR category == NULL → global default (stockout_day=7, risk=0.5)
history_days < 7  → category average (precomputed daily)
history_days < 14 → Naive Baseline only (weight=1.0)
otherwise        → full 3-model ensemble
```

### 4.5 Retraining

- `baseline_mae`: frozen on first approved training (NOT auto-updated)
- Triggers: scheduled (30d), manual, or MAE > 1.2 * baseline (alert only)
- Min 30 samples required

---

## 5. LLM Integration

**Async pattern:** POST /predict returns immediately with `llm_summary_status: "pending"`. Client polls GET /predict/{id}/summary.

- **Trigger:** risk_score >= 0.5 only (HIGH/CRITICAL)
- **Cache:** key=`{product_id}:{risk_band}:{date}`, TTL=24h
- **Rate limit:** 10 calls/min; batch predictions use template fallback
- **Fallback:** template string if LLM unavailable

**Prompt (with injection defense):**
```
Context: Product ID {id}, Stock {stock}, Risk {risk}/{band}, Attribution {attr}
Output JSON: {"summary": string (max 200 chars), "recommendation": string (max 150 chars)}
```
Sanitization: integer validation, float bounds [0,1], string length truncation, no raw user text in prompt.

---

## 6. API & Integration

### 6.1 Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | /predict | Single product prediction (<500ms) |
| POST | /predict/batch | Batch prediction, no LLM inline (<10s) |
| GET | /predict/{id}/summary | Poll LLM summary (200=ready, 202=pending) |
| GET | /health | Service health + model status |

### 6.2 POST /predict Response

```json
{
  "code": 200,
  "data": {
    "prediction": {
      "product_id": 123,
      "predicted_stockout_day": 5.0,
      "risk_score": 0.87,
      "risk_band": "CRITICAL",
      "confidence_score": 0.82,
      "prediction_source": "ensemble"
    },
    "attribution": {
      "sales_velocity": 0.45,
      "current_stock": 0.30,
      "lead_time_days": 0.15,
      "sales_trend": 0.07,
      "seasonality": 0.03
    },
    "counterfactual": {"stock_needed": 32, "risk_reduced_to": 0.3},
    "procurement_recommendation": {
      "should_trigger": true,
      "trigger_reason": "risk_score >= 0.75 AND predicted_stockout_day (5) <= lead_time_days (7)",
      "suggested_quantity": 30,
      "supplier_hint": null
    },
    "llm_summary_status": "pending",
    "metadata": {"model_version": "ensemble-v1.4", "processing_time_ms": 245}
  }
}
```

### 6.3 Procurement Auto-Trigger

AI response includes `procurement_recommendation` when auto-trigger conditions are met:

**Trigger conditions (AI calculates, Spring Boot executes):**
- `risk_score >= 0.75` AND `predicted_stockout_day <= supplier_lead_time_days`

**suggested_quantity formula (AI calculates):**
```
suggested_quantity = max(safety_stock × 2, predicted_demand × lead_time_days / horizon_days)
```

**Spring Boot workflow on `should_trigger=true`:**
1. Check if `procurement_requests` already has a PENDING record for this `product_id` today (idempotency)
2. Create `procurement_requests` with `trigger_reason = "ai_auto"`, `external_request_id` pending
3. Dispatch Webhook to supplier
4. Record `dispatched_at` timestamp → satisfies REQ-4.3-8
5. Link `procurement_requests.id` to `prediction_audit.id` via `audit_id`

### 6.4 Spring Boot Fallback

If AI service unavailable: return rules-v1.0 prediction with `prediction_source: "fallback"`.

---

## 7. Operations

### 7.1 Deployment

- Runtime: Python 3.10+, FastAPI, port 8081
- Memory: ~350MB (AI only), ~4GB (with LLM)
- Dockerfile: includes HEALTHCHECK for startup sequencing
- LLM: volume-mounted Qwen2.5-7B weights (see README for acquisition)

### 7.2 Key Config

| Param | Value |
|-------|-------|
| ensemble temperature | 2.0 |
| cold_start threshold | 14 days |
| LLM cache TTL | 24h |
| LLM rate limit | 10/min |
| risk threshold | 0.5 |
| retrain schedule | 30 days |
| cooldown | 7 days |

### 7.3 Monitoring

Metrics: prediction_latency, prediction_count, prediction_source, llm_call_count, llm_fallback_count, cold_start_count, validation_mae_per_model

Alerts:
- AI service down → Critical
- Prediction latency >2s → Warning
- LLM fallback >20% → Warning
- MAE > 1.2 * baseline → Warning

### 7.4 Testing

| Scenario | Criteria |
|----------|----------|
| Single prediction | <500ms |
| Batch 100 products | <10s |
| LLM async | <30s or template fallback |
| Cold-start | Correct tiered fallback |

### 7.5 Implementation Plan

| Phase | Duration | Tasks |
|-------|----------|-------|
| 1 | Week 1 | Scaffold + DB + features + 3 models + ensemble + cold-start |
| 2 | Week 2 | Dynamic weights + SHAP + attribution + counterfactual |
| 3 | Week 3 | LLM async + cache + sanitization + fallback + procurement webhook integration |
| 4 | Week 4 | Shadow test + monitoring + docs |

---

## Appendix: Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-04-30 | Initial draft |
| 1.1 | 2026-04-30 | Added schema, async LLM, cold-start |
| 1.2 | 2026-04-30 | Fixed P0/P1 issues from review |
| 1.3 | 2026-04-30 | Simplified: 1100+ lines → ~400 lines |
| 1.4 | 2026-05-01 | Added procurement auto-trigger (REQ-4.3-6, REQ-4.3-8) |

---

*End of Document*