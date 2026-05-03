-- OmniRead AI module schema migration
-- Apply AFTER omniread-backend/src/main/resources/init.sql

CREATE TABLE IF NOT EXISTS prediction_audit (
  id BIGINT NOT NULL AUTO_INCREMENT,
  product_id BIGINT NOT NULL,
  forecast_date DATE NOT NULL,
  horizon_days INT NOT NULL DEFAULT 7,
  model_version VARCHAR(80) NOT NULL,
  predicted_stockout_day DECIMAL(5,2) NULL,
  risk_score DECIMAL(5,4) NOT NULL,
  confidence_score DECIMAL(5,4) NULL,
  attribution_scores JSON NULL,
  counterfactual_stock INT NULL,
  counterfactual_risk DECIMAL(5,4) NULL,
  individual_model_outputs JSON NULL,
  llm_summary TEXT NULL,
  llm_recommendation TEXT NULL,
  llm_model_used VARCHAR(100) NULL,
  llm_generated_at DATETIME(6) NULL,
  prediction_source VARCHAR(40) NOT NULL DEFAULT 'ensemble',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY idx_audit_product_date (product_id, forecast_date),
  KEY idx_audit_source (prediction_source),
  CONSTRAINT fk_audit_product FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE stockout_forecasts
  ADD COLUMN audit_id BIGINT NULL AFTER model_version,
  ADD KEY idx_forecast_audit (audit_id),
  ADD CONSTRAINT fk_forecasts_audit FOREIGN KEY (audit_id) REFERENCES prediction_audit (id);

ALTER TABLE procurement_requests
  ADD COLUMN dispatched_at DATETIME(6) NULL AFTER completed_at;
