# Testing Document — OmniRead MVP

## 1. Testing Strategy

### 1.1 Scope

Three-service system:
- **AI Service** (Python/FastAPI) — unit + smoke tests
- **Backend** (Spring Boot/Java) — integration tests (no unit tests currently)
- **Frontend** (Next.js/TypeScript) — component smoke tests

### 1.2 AI Service Tests (`omniread-ai/tests/`)

#### Smoke Test (`test_smoke.py`)
End-to-end functional test: start service → `POST /predict` with product 9001 → verify response structure.

```bash
cd omniread-ai
pytest tests/test_smoke.py -v
```

**Coverage:**
- Health endpoint returns `models_loaded >= 3`
- Predict returns `prediction_source` in `{ensemble, cold_start}`
- Attribution is a dict with float values summing ~1.0
- Procurement recommendation has `should_trigger` bool and `suggested_quantity` int
- Counterfactual has `stock_needed` and `risk_reduced_to`

**Test data:** `tests/fixtures/seed_test_data.sql` — product 9001 (AI Test Book) with 14 days of order history.

#### Running All AI Tests

```bash
cd omniread-ai
pytest tests/ -v --tb=short
```

### 1.3 Backend Tests

**Current state:** 0 tests. Backend was built without a test framework scaffold.

**Target:** Add 2 integration tests (see Section 3).

**Test categories needed:**
1. `AiForecastClientTest` — mock AI service response, verify parsing + audit creation
2. `ForecastServiceImplTest` — verify fallback to rules-v1.0 when AI is down

### 1.4 Frontend Tests

**Current state:** 0 tests. No Vitest/Jest framework installed.

**Target:** Add 1 component test.

### 1.5 Integration Testing Approach

Since there is no CI pipeline, integration tests are run manually before submission:

| Scenario | How to Run |
|----------|------------|
| AI smoke test | `cd omniread-ai && pytest tests/test_smoke.py -v` |
| Full flow (UI) | Start all 3 services → login → Operations → Generate Forecasts → verify audit in DB |
| Fallback flow | Kill AI service → Generate Forecasts → verify `model_version = rules-v1.0` in DB |
| Procurement trigger | Reset stock to 1 → Generate Forecasts → verify `procurement_requests` row created |

## 2. Test Scenarios

### TS-1: AI Service Health
**Step:** `GET /health`
**Expected:** `{status: "healthy", models_loaded: 3, llm_available: false}`
**Pass criteria:** HTTP 200, all fields present

### TS-2: Ensemble Prediction (Product 9001)
**Pre-condition:** AI service running, product 9001 has ≥ 14 days sales history, stock ≤ 10
**Step:** `POST /predict` with `{"product_id": 9001, "horizon_days": 7, "lookback_days": 14}`
**Expected:**
- `prediction.prediction_source == "ensemble"`
- `prediction.risk_score >= 0.7` (CRITICAL for low stock)
- `attribution` has 7 keys (or 2 keys if cold_start)
- `procurement_recommendation.should_trigger == true`
- `counterfactual.stock_needed > 0`
**Pass criteria:** HTTP 200, all fields match expected types

### TS-3: Cold-start Path (No History)
**Pre-condition:** Product with < 14 days order history
**Step:** `POST /predict` for that product
**Expected:**
- `prediction.prediction_source == "cold_start"`
- `prediction.confidence_score <= 0.7`
- `attribution` has 2 keys: `days_ahead`, `sales_volatility`
**Pass criteria:** Cold-start path selected

### TS-4: AI Fallback to Rules
**Pre-condition:** AI service is DOWN
**Step:** Spring Boot `POST /inventory/forecasts/generate` for product 9001
**Expected:**
- `stockout_forecasts.model_version == "rules-v1.0"`
- No `prediction_audit` row created (fallback skips audit)
- Forecast generated with rule-based risk
**Pass criteria:** DB query returns `rules-v1.0`, no audit row

### TS-5: Procurement Auto-trigger
**Pre-condition:** AI service UP, product 9001 stock = 1
**Step:** `POST /predict` for product 9001
**Expected:**
- `procurement_recommendation.should_trigger == true`
- `procurement_recommendation.suggested_quantity >= 1`
- `procurement_recommendation.trigger_reason` mentions risk threshold
**Pass criteria:** Recommendation generated, quantity > 0

### TS-6: Counterfactual Calculation
**Step:** `POST /predict` for product 9001 (low stock)
**Expected:**
- `counterfactual.stock_needed >= 1`
- `counterfactual.risk_reduced_to <= 0.5` (target 50% risk)
**Pass criteria:** Both values are valid numbers

### TS-7: Batch Prediction
**Step:** `POST /predict/batch` with `{"product_ids": [9001, 9002], "horizon_days": 7}`
**Expected:**
- Response has 2 results array
- Each result has `prediction` object with `prediction_source`
**Pass criteria:** Array of 2 results returned

### TS-8: UI AI Detail Panel
**Pre-condition:** Audit record exists for product 9001 with model `ai-ensemble-v1.0`
**Step:** Login as admin → Operations → Select product 9001 → Click "AI detail" button
**Expected:**
- AI panel expands inline below table row
- Shows: risk band (CRITICAL/HIGH/LOW), attribution bar chart, procurement card, counterfactual
**Pass criteria:** Panel visible with all 4 sections

### TS-9: UI Generate Forecasts Flow
**Step:** Login as admin → Operations → Click "Generate Forecasts"
**Expected:**
- 7 forecast rows created per product (for all ebook-unsafe products)
- Latest forecast's `auditId` references `prediction_audit` row
- UI shows model version badge next to risk
**Pass criteria:** 7 rows per product, audit ID present

## 3. Backend Test Implementation Plan

### BT-1: AiForecastClientTest (Integration)

```java
// src/test/java/.../AiForecastClientTest.java
// Spring Boot test that mocks AI service HTTP responses
// Verifies: request serialization, response deserialization, audit creation
```

**Test cases:**
- `testPredictSuccess()` — mock 200 AI response → verify audit + forecasts created
- `testPredictConnectionFailure()` — mock connection error → verify exception thrown
- `testPredictMalformedResponse()` — mock JSON missing fields → verify graceful handling

### BT-2: ForecastServiceImplTest (Integration)

```java
// src/test/java/.../ForecastServiceImplTest.java
// Tests the fallback logic when AI service is unavailable
```

**Test cases:**
- `testAiEnabledAndHealthyFallsBackToRules()` — mock AI health=false → verify rules-v1.0 used
- `testAiDisabledUsesRules()` — `aiEnabled=false` → verify rules-v1.0 used
- `testGenerateForAllProductsWithEbookExclusion()` — verify ebooks skipped

## 4. Frontend Test Implementation Plan

### FT-1: Operations Page Component Test (Vitest)

```typescript
// storefront/tests/components/operations.test.tsx
// Test the AI detail inline expansion behavior
```

**Test cases:**
- `testAiDetailButtonExpandsInline()` — click AI detail → panel renders below row
- `testAiDetailPanelShowsAttribution()` — with mock audit data → verify 7 attribution bars
- `testRiskBadgeShowsCorrectColor()` — CRITICAL → red badge rendered

## 5. Coverage Summary

| Service | Framework | Current Coverage | Target |
|---------|-----------|-----------------|--------|
| AI Service | pytest | 1 smoke test | ✅ Done |
| Backend | JUnit | 0 tests | 2 integration tests |
| Frontend | Vitest | 0 tests | 1 component test |

## 6. Known Limitations

- No CI/CD pipeline — tests run manually
- No performance/load testing
- Phase 3 LLM tests not applicable (feature not built)
- Phase 4 shadow mode tests not applicable (feature not built)
- No security testing (authentication tested manually via Postman)
- Backend has no unit tests — only 2 integration tests planned

---
*Document version: 1.0 — created for Submission #3 (Week 9)*
*Last updated: 2026-05-03*