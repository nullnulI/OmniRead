package com.omniread.backend.dto;

import com.omniread.backend.entity.StockoutForecast;
import com.omniread.backend.entity.enums.StockoutRisk;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ForecastResponse {

    private Long id;
    private Long productId;
    private LocalDate forecastDate;
    private LocalDate targetDate;
    private Integer predictedDemand;
    private Integer predictedStock;
    private StockoutRisk stockoutRisk;
    private BigDecimal confidenceScore;
    private String modelVersion;
    private Long auditId;

    public static ForecastResponse from(StockoutForecast forecast) {
        return ForecastResponse.builder()
            .id(forecast.getId())
            .productId(forecast.getProduct().getId())
            .forecastDate(forecast.getForecastDate())
            .targetDate(forecast.getTargetDate())
            .predictedDemand(forecast.getPredictedDemand())
            .predictedStock(forecast.getPredictedStock())
            .stockoutRisk(forecast.getStockoutRisk())
            .confidenceScore(forecast.getConfidenceScore())
            .modelVersion(forecast.getModelVersion())
            .auditId(forecast.getAudit() != null ? forecast.getAudit().getId() : null)
            .build();
    }
}
