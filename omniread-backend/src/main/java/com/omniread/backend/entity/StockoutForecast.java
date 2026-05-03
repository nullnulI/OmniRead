package com.omniread.backend.entity;

import com.omniread.backend.entity.enums.StockoutRisk;
import java.math.BigDecimal;
import java.time.LocalDate;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.FetchType;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "stockout_forecasts")
public class StockoutForecast extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "forecast_date", nullable = false)
    private LocalDate forecastDate;

    @Column(name = "target_date", nullable = false)
    private LocalDate targetDate;

    @Column(name = "predicted_demand", nullable = false)
    private Integer predictedDemand = 0;

    @Column(name = "predicted_stock", nullable = false)
    private Integer predictedStock = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "stockout_risk", nullable = false, length = 40)
    private StockoutRisk stockoutRisk = StockoutRisk.LOW;

    @Column(name = "confidence_score", nullable = false, precision = 5, scale = 4)
    private BigDecimal confidenceScore = BigDecimal.ZERO;

    @Column(name = "model_version", nullable = false, length = 80)
    private String modelVersion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audit_id")
    private PredictionAudit audit;
}
