package com.omniread.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.Map;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class AiPredictResponse {
    private Integer code;
    private String message;
    private AiResponseData data;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public static class AiResponseData {
        private Prediction prediction;
        private ModelOutputs modelOutputs;
        private Map<String, Double> attribution;
        private Counterfactual counterfactual;
        private ProcurementRecommendation procurementRecommendation;
        private String llmSummaryStatus;
        private Metadata metadata;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public static class Prediction {
        private Long productId;
        private BigDecimal predictedStockoutDay;
        private BigDecimal riskScore;
        private String riskBand;
        private Integer predictedDemand;
        private BigDecimal confidenceScore;
        private String predictionSource;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public static class ModelOutputs {
        private Map<String, Object> individualModels;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public static class Counterfactual {
        private Integer stockNeeded;
        private BigDecimal riskReducedTo;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public static class ProcurementRecommendation {
        private Boolean shouldTrigger;
        private String triggerReason;
        private Integer suggestedQuantity;
        private String supplierHint;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public static class Metadata {
        private String modelVersion;
        private String generatedAt;
        private Integer processingTimeMs;
    }
}