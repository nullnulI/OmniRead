package com.omniread.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class AiPredictRequest {
    @JsonProperty("product_id")
    private Long productId;

    @JsonProperty("horizon_days")
    private Integer horizonDays = 7;

    @JsonProperty("lookback_days")
    private Integer lookbackDays = 14;
}