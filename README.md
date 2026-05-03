# OmniRead MVP

OmniRead is a full-stack monorepo for an online bookstore with AI-powered stockout forecasting. The system has three main layers: **Next.js storefront**, **Spring Boot backend**, and a **Python AI forecasting service**.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend  (Next.js → localhost:3000)                       │
│  Customer / Operations / Reader portals                      │
└────────────────────────────┬────────────────────────────────┘
                             │ REST API
┌────────────────────────────▼────────────────────────────────┐
│  Backend  (Spring Boot → localhost:8080)                     │
│  Auth / Inventory / Orders / Procurement / AI orchestration   │
└──────────┬───────────────────────────────┬──────────────────┘
           │                                │
    ┌──────▼──────┐              ┌─────────▼─────────┐
    │  MySQL 3307  │              │  AI Service 8081  │
    │  (Docker)    │              │  (Python + FastAPI│
    └──────────────┘              │   ensemble models) │
                                 └───────────────────┘
```

## Projects

| Directory | Description |
|-----------|-------------|
| `omniread-backend/` | Spring Boot REST API, JPA entities, service layer |
| `omniread-storefront-main/` | Next.js 14 (App Router), React, TypeScript |
| `omniread-ai/` | Python FastAPI AI forecasting service, scikit-learn models |
| `omniread-ai/scripts/` | Data generation and model training scripts |

## Quick Start

**Prerequisites:** Docker, Node.js 18+, Python 3.12+, Maven 3.9+

### 1. MySQL

```powershell
docker run -d --name omniread-mysql -p 3307:3306 -e MYSQL_ROOT_PASSWORD=change-me-local-only mysql:8
# Wait 10s for init, then create database
docker exec omniread-mysql mysql -uroot -pchange-me-local-only -e "CREATE DATABASE IF NOT EXISTS omniread"
docker exec omniread-mysql mysql -uroot -pchange-me-local-only omniread < omniread-backend/src/main/resources/schema.sql
docker exec omniread-mysql mysql -uroot -pchange-me-local-only omniread < omniread-backend/src/main/resources/seed.sql
docker exec omniread-mysql mysql -uroot -pchange-me-local-only omniread < omniread-ai/migration.sql
```

### 2. Spring Boot Backend

```powershell
cd omniread-backend
# Optional: seed AI test data
docker exec omniread-mysql mysql -uroot -pchange-me-local-only omniread < omniread-ai/tests/fixtures/seed_test_data.sql

$env:OMNIREAD_DATASOURCE_URL="jdbc:mysql://localhost:3307/omniread?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&useSSL=false&allowPublicKeyRetrieval=true"
$env:OMNIREAD_DATASOURCE_USERNAME="root"
$env:OMNIREAD_DATASOURCE_PASSWORD="change-me-local-only"
$env:OMNIREAD_JWT_SECRET="OmniReadSuperSecretKeyAtLeast32Chars!!"
$env:OMNIREAD_BOOTSTRAP_ADMIN_PASSWORD="change-me-admin-password"
$env:OMNIREAD_DEMO_INVENTORY_PASSWORD="change-me-inventory-password"
$env:OMNIREAD_DEMO_SUPPLIER_PASSWORD="change-me-supplier-password"
$env:OMNIREAD_DEMO_CUSTOMER_PASSWORD="change-me-customer-password"
$env:OMNIREAD_AI_ENABLED="true"
$env:OMNIREAD_AI_SERVICE_URL="http://localhost:8081"

mvn spring-boot:run
```

### 3. AI Forecasting Service (Python)

```powershell
cd omniread-ai
pip install -r requirements.txt  # fastapi uvicorn pymysql pandas scikit-learn shap joblib
python -m uvicorn app.main:app --host 127.0.0.1 --port 8081
```

### 4. Frontend (Next.js)

```powershell
cd omniread-storefront-main
npm install
npm run dev
# Open http://localhost:3000
```

## Demo Accounts

| Role | Email | Password |
|------|-------|---------|
| System Admin | `admin@omniread.local` | `change-me-admin-password` |
| Inventory Admin | `inventory@omniread.local` | `change-me-inventory-password` |
| Customer | `customer@omniread.local` | `change-me-customer-password` |
| Supplier | `supplier@omniread.local` | `change-me-supplier-password` |

## AI Forecasting Module (REQ-4.3)

### Requirement Coverage

| ID | Requirement | Evidence |
|----|-------------|----------|
| REQ-4.3-1 | Predict stockout 7 days ahead using sales history + lead time | `omniread-ai/app/api/routes.py` POST `/predict`, `PredictionAudit.predictedStockoutDay` column |
| REQ-4.3-2 | Classify risk as LOW / MEDIUM / HIGH / CRITICAL | `omniread-ai/config.yaml` risk thresholds, `StockoutRisk` enum in backend |
| REQ-4.3-3 | Use internal sales + supplier lead time (no external data) | `omniread-ai/app/features/engineer.py` — reads `order_items` + `inventory_records` only |
| REQ-4.3-4 | 7-day forecast, update on demand | `generateForProduct()` → 7 `StockoutForecast` rows per product, manual trigger from UI |
| REQ-4.3-5 | Explain top features per prediction | `unify_attribution()` in `attribution_mapper.py` returns 7-feature normalized map; stored in `prediction_audit.attribution_scores` JSON |
| REQ-4.3-6 | Auto-trigger procurement when risk ≥ 0.75 AND stockout ≤ lead time | `_procurement_decision()` in `routes.py:193`; `triggerProcurement()` in `AiForecastServiceImpl.java:169` |
| REQ-4.3-7 | Counterfactual: stock needed to reduce risk to target | `linear_counterfactual()` in `counterfactual.py`; stored in `prediction_audit.counterfactual_stock` |
| REQ-4.3-8 | LLM summary (Phase 3) | `llm_summary` column reserved in schema; `llm_summary_status: disabled` in API response |
| REQ-4.3-9 | Fallback to rules-v1.0 if AI unavailable | `ForecastServiceImpl.java:84` `tryAiForecast()` catches exceptions → returns `false` → `generateForecasts()` uses `MODEL_VERSION_RULES` |

### AI Service Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Returns `{status, models_loaded, llm_available, uptime_seconds, model_version}` |
| POST | `/predict` | Body: `{product_id, horizon_days, lookback_days}` → Prediction with attribution + procurement |
| POST | `/predict/batch` | Batch predict for multiple product IDs |

### Data Model

```
prediction_audit
├── model_version        -- "ai-ensemble-v1.0" or "rules-v1.0"
├── prediction_source    -- "ensemble" | "cold_start" | "fallback"
├── risk_score           -- 0.0–1.0
├── predicted_stockout_day
├── attribution_scores   -- JSON, 7 keys when ensemble
├── counterfactual_stock -- X units needed to halve risk
├── counterfactual_risk
└── llm_summary          -- Phase 3

stockout_forecasts (7 rows per product per run)
├── audit_id             -- FK to prediction_audit
├── target_date          -- day 1–7
├── predicted_stock      -- stock after N days demand
├── stockout_risk        -- LOW/MEDIUM/HIGH/CRITICAL
└── model_version
```

### Model Ensemble (ensemble-v1.4)

- **Random Forest** (weight 0.5): 100 trees, max_depth=10 — captures non-linear feature interactions
- **Holt-Winters** (weight 0.3): additive trend + seasonality, period=7 — captures trend + weekly patterns
- **Naive Baseline** (weight 0.2): last observation carry-forward — stable fallback
- **Cold-start fallback**: `global_default` / `category_avg` / `naive_only` when history < 14 days

See `omniread-ai/DESIGN.md` for full design document (4 version iterations, 251 lines).