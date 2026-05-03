package com.omniread.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class PredictionAuditResponse {

    private Long id;

    @JsonProperty("product_id")
    private Long productId;

    @JsonProperty("forecast_date")
    private LocalDate forecastDate;

    @JsonProperty("horizon_days")
    private Integer horizonDays;

    @JsonProperty("model_version")
    private String modelVersion;

    @JsonProperty("predicted_stockout_day")
    private BigDecimal predictedStockoutDay;

    @JsonProperty("risk_score")
    private BigDecimal riskScore;

    @JsonProperty("risk_band")
    private String riskBand;

    @JsonProperty("prediction_source")
    private String predictionSource;

    @JsonProperty("confidence_score")
    private BigDecimal confidenceScore;

    @JsonProperty("attribution")
    private java.util.Map<String, Double> attribution;

    @JsonProperty("counterfactual_stock")
    private Integer counterfactualStock;

    @JsonProperty("counterfactual_risk")
    private BigDecimal counterfactualRisk;

    @JsonProperty("procurement_recommendation")
    private ProcurementRecommendationDetail procurementRecommendation;

    @JsonProperty("llm_summary")
    private String llmSummary;

    @JsonProperty("llm_summary_status")
    private String llmSummaryStatus;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    @Getter
    @Setter
    @Builder
    public static class ProcurementRecommendationDetail {
        @JsonProperty("should_trigger")
        private Boolean shouldTrigger;

        @JsonProperty("trigger_reason")
        private String triggerReason;

        @JsonProperty("suggested_quantity")
        private Integer suggestedQuantity;
    }
}