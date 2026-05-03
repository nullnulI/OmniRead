package com.omniread.backend.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "prediction_audit")
public class PredictionAudit extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "forecast_date", nullable = false)
    private LocalDate forecastDate;

    @Column(name = "horizon_days", nullable = false)
    private Integer horizonDays = 7;

    @Column(name = "model_version", nullable = false, length = 80)
    private String modelVersion;

    @Column(name = "predicted_stockout_day", precision = 5, scale = 2)
    private BigDecimal predictedStockoutDay;

    @Column(name = "risk_score", nullable = false, precision = 5, scale = 4)
    private BigDecimal riskScore;

    @Column(name = "attribution_scores", columnDefinition = "JSON")
    private String attributionScores;

    @Column(name = "counterfactual_stock")
    private Integer counterfactualStock;

    @Column(name = "counterfactual_risk", precision = 5, scale = 4)
    private BigDecimal counterfactualRisk;

    @Column(name = "individual_model_outputs", columnDefinition = "JSON")
    private String individualModelOutputs;

    @Column(name = "llm_summary", columnDefinition = "TEXT")
    private String llmSummary;

    @Column(name = "llm_recommendation", columnDefinition = "TEXT")
    private String llmRecommendation;

    @Column(name = "llm_model_used", length = 100)
    private String llmModelUsed;

    @Column(name = "llm_generated_at")
    private LocalDateTime llmGeneratedAt;

    @Column(name = "prediction_source", nullable = false, length = 40)
    private String predictionSource = "ensemble";

    @Column(name = "confidence_score", precision = 5, scale = 4)
    private BigDecimal confidenceScore;
}