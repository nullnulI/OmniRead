# UML Diagrams — OmniRead MVP

All diagrams use [Mermaid](https://mermaid.js.org/) syntax. Render in GitHub, VS Code (Mermaid preview), or any Mermaid-compatible viewer.

---

## 1. System Architecture

```mermaid
graph TB
    subgraph Frontend["Frontend (Next.js - Port 3000)"]
        UI["Operations UI\n/ Customer Portal\n/ Reader"]
    end

    subgraph Backend["Spring Boot Backend (Port 8080)"]
        API["REST API Controllers"]
        SVC["Service Layer\n• ForecastService\n• InventoryService\n• AiForecastService"]
        CLIENT["AiForecastClient\n(WebClient HTTP)"]
    end

    subgraph AI["AI Forecasting Service (Python - Port 8081)"]
        FASTAPI["FastAPI\napp.main:app"]
        ROUTES["routes.py\n• POST /predict\n• GET /health"]
        MODELS["Ensemble Models\n• RandomForest\n• HoltWinters\n• NaiveBaseline"]
        EXPLAIN["Explainability\n• SHAP adapter\n• Attribution mapper\n• Counterfactual"]
    end

    subgraph Data["Data Layer"]
        DB[(MySQL 3307\nomniread DB)]
    end

    UI -->|"REST /api/v1/..."| API
    API --> SVC
    SVC -->|HTTP POST /predict| CLIENT
    CLIENT -->|健康检查 /health| FASTAPI
    FASTAPI --> ROUTES
    ROUTES --> MODELS
    MODELS --> EXPLAIN
    EXPLAIN -->|read only| DB
    SVC -->|read/write| DB
```

---

## 2. Class Diagram (AI Service)

```mermaid
classDiagram
    class AiResponse {
        +Integer code
        +String message
        +AiResponseData data
    }

    class AiResponseData {
        +Prediction prediction
        +ModelOutputs modelOutputs
        +Map~String, Double~ attribution
        +Counterfactual counterfactual
        +ProcurementRecommendation procurementRecommendation
        +String llmSummaryStatus
        +Metadata metadata
    }

    class Prediction {
        +Long productId
        +BigDecimal predictedStockoutDay
        +BigDecimal riskScore
        +String riskBand
        +Integer predictedDemand
        +BigDecimal confidenceScore
        +String predictionSource
    }

    class ProcurementRecommendation {
        +Boolean shouldTrigger
        +String triggerReason
        +Integer suggestedQuantity
        +String supplierHint
    }

    class Counterfactual {
        +Integer stockNeeded
        +BigDecimal riskReducedTo
    }

    class AttributionMapper {
        +unify_attribution(rf, hw, ctx, source) Map~String, Double~
        +_heuristic_importance(ctx) Map~String, Float~
    }

    class SHAPAdapter {
        +compute_shap_values(ctx) Map~String, Float~
        +is_available() Boolean
    }

    class Ensemble {
        +combine(predictions, weights) Float
    }

    class ColdStartDetector {
        +classify_path(history_days, category) String
        +get_category_avg(category) Map
    }

    AiResponseData --> Prediction
    AiResponseData --> ProcurementRecommendation
    AiResponseData --> Counterfactual
    AttributionMapper --> SHAPAdapter
    AttributionMapper --> Ensemble
```

---

## 3. Sequence Diagram — Forecast Generation Flow

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend\n(Next.js)
    participant API as Spring Boot\nREST API
    participant ForecastSvc as ForecastServiceImpl
    participant AiClient as AiForecastClient
    participant AI as AI Service\n(FastAPI)
    participant DB as MySQL

    User->>UI: Click "Generate Forecasts"
    UI->>API: POST /inventory/forecasts/generate
    API->>ForecastSvc: generateForAllProducts()
    ForecastSvc->>ForecastSvc: aiEnabled && tryAiForecast(productId) ?

    alt AI Enabled + Healthy
        ForecastSvc->>AiClient: isHealthy()
        AiClient->>AI: GET /health
        AI-->>AiClient: {"status":"healthy","models_loaded":3}
        AiClient-->>ForecastSvc: true

        ForecastSvc->>AiClient: predict(AiPredictRequest)
        AiClient->>AI: POST /predict
        AI->>AI: build_features(productId)
        AI->>AI: classify_path(historyDays, category)
        AI->>AI: run ensemble / cold_start
        AI->>AI: compute attribution (SHAP)
        AI->>AI: compute counterfactual
        AI->>AI: compute procurement_recommendation
        AI-->>AiClient: AiPredictResponse (ensemble)

        AiClient-->>ForecastSvc: response
        ForecastSvc->>ForecastSvc: savePredictionAudit(product, data)
        ForecastSvc->>DB: INSERT prediction_audit
        ForecastSvc->>DB: INSERT 7 × stockout_forecasts
        ForecastSvc->>ForecastSvc: triggerProcurement() if should_trigger
        ForecastSvc->>DB: INSERT procurement_request

    else AI Disabled / Unavailable
        ForecastSvc-->>ForecastSvc: fallback to rules-v1.0
        ForecastSvc->>DB: INSERT stockout_forecasts (model_version="rules-v1.0")
        Note over ForecastSvc: No prediction_audit written for fallback
    end

    ForecastSvc-->>API: ForecastSummaryResponse
    API-->>UI: {generatedCount: 7, forecasts: [...]}
    UI-->>User: Show success message
```

---

## 4. Sequence Diagram — Procurement Trigger Flow

```mermaid
sequenceDiagram
    participant AI as AI Service\n(/predict)
    participant Spring as Spring Boot\n(AiForecastServiceImpl)
    participant DB as MySQL
    participant Webhook as WebhookService

    AI->>AI: _procurement_decision(risk, stockout, lead)
    Note over AI: risk >= 0.75 AND stockout <= lead_time
    AI-->>Spring: {procurement_recommendation: {should_trigger: true, qty: 13}}

    Spring->>DB: existsByProductIdAndStatusIn(productId, OPEN) ?
    DB-->>Spring: false (no open PR)

    Spring->>DB: findInventoryRecord(productId)
    DB-->>Spring: InventoryRecord {qty: 1, reserved: 0, lead: 3}

    Spring->>DB: findByRole(SUPPLIER)
    DB-->>Spring: User {role: SUPPLIER}

    Spring->>Spring: suggestedQty = max(13, safety*2) = 13
    Spring->>DB: INSERT procurement_request
    Note over DB: status=SENT, requestNumber="PR-ABCD1234"

    Spring->>Webhook: dispatchProcurement(payload)
    Webhook->>Webhook: HTTP POST to supplier webhook URL
    Note over Webhook: Fire-and-forget, async
```

---

## 5. Dialog Map (UI Navigation)

```mermaid
flowchart LR
    subgraph Entry["Entry Points"]
        LOGIN[/"Login Page\n/logout"]
        HOME[/"Home\n/"]
    end

    subgraph Customer["Customer Flow"]
        SHOP[/"Shop\n/shop"]
        CART[/"Cart\n/cart"]
        ORDERS[/"My Orders\n/orders"]
        BOOK[/"Book Detail\n/book/:id"]
        EPUB[/"EPUB Reader\n/reader/:id"]
    end

    subgraph Operations["Operations Flow"]
        OPS[/"Operations Portal\n/operations"]
        STOCK[/"Stock Settings\n(Edit product)"]
        FORECAST[/"Forecast Panel\n(AI detail expand)"]
        PROC[/"Procurement\nRequests"]
    end

    LOGIN -->|Success| HOME
    HOME -->|role=ADMIN| OPS
    HOME -->|role=CUSTOMER| SHOP
    SHOP --> BOOK
    BOOK --> CART
    CART --> ORDERS
    ORDERS --> HOME

    OPS --> STOCK
    OPS --> FORECAST
    OPS --> PROC
    STOCK -->|Select product| OPS

    style LOGIN fill:#e1f5fe
    style OPS fill:#fff3e0
    style SHOP fill:#e8f5e9
    style BOOK fill:#e8f5e9
```

---

## 6. Class Diagram — Backend Domain Model

```mermaid
classDiagram
    class Product {
        +Long id
        +String sku
        +String isbn13
        +String title
        +String authorName
        +BigDecimal price
        +BookType bookType
        +ProductStatus status
    }

    class InventoryRecord {
        +Long id
        +Product product
        +Integer quantityOnHand
        +Integer reservedQuantity
        +Integer safetyStock
        +Integer reorderThreshold
        +Integer supplierLeadTimeDays
    }

    class StockoutForecast {
        +Long id
        +Product product
        +LocalDate forecastDate
        +LocalDate targetDate
        +Integer predictedDemand
        +Integer predictedStock
        +StockoutRisk stockoutRisk
        +BigDecimal confidenceScore
        +String modelVersion
        +PredictionAudit audit
    }

    class PredictionAudit {
        +Long id
        +Product product
        +LocalDate forecastDate
        +Integer horizonDays
        +String modelVersion
        +BigDecimal predictedStockoutDay
        +BigDecimal riskScore
        +String predictionSource
        +BigDecimal confidenceScore
        +String attributionScores (JSON)
        +Integer counterfactualStock
        +BigDecimal counterfactualRisk
        +String llmSummary
        +String llmSummaryStatus
    }

    class ProcurementRequest {
        +Long id
        +String requestNumber
        +Product product
        +User supplier
        +Integer requestedQuantity
        +ProcurementStatus status
        +String triggerReason
        +String externalRequestId
    }

    class OrderItem {
        +Long id
        +Product product
        +Integer quantity
        +BigDecimal unitPrice
    }

    Product "1" --> "0..1" InventoryRecord
    Product "1" --> "*" StockoutForecast
    Product "1" --> "*" PredictionAudit
    Product "1" --> "*" ProcurementRequest
    Product "1" --> "*" OrderItem
    PredictionAudit "1" --> "*" StockoutForecast
```

---

## 7. Sequence Diagram — AI Detail Panel Expansion (Frontend)

```mermaid
sequenceDiagram
    participant Page as OperationsPage.tsx
    participant Table as ProductInventoryTable
    participant Row as Table Row (9001)
    participant State as React State\n(expandedAudit, audits)
    participant Panel as AiDetailPanel

    Page->>Table: render rows with latestRisk(forecasts)
    Table->>Row: render Forecast cell
    Row->>Row: risk.auditId = 123 exists
    Row->>Row: render "AI detail" button

    Row->>State: onToggleAudit(auditId=123)
    State->>State: setExpandedAudit(123)
    State-->>Row: expandedAudit=123

    Row->>Row: expandedAudit === risk.auditId ? render inline Panel : null
    Row->>Panel: audit={audits[9001]}
    Panel->>Panel: parse attribution entries
    Panel->>Panel: compute maxAttr for bar widths
    Panel->>Panel: render RiskAssessment card
    Panel->>Panel: render Attribution bars (7 features)
    Panel->>Panel: render ProcurementCard (if should_trigger)
    Panel->>Panel: render Counterfactual card
```

---

*Diagrams version 1.0 — for Submission #3 (Week 9)*
*Generated from code analysis 2026-05-03*