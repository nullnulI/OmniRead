package com.omniread.backend.service.impl;

import com.omniread.backend.dto.ForecastResponse;
import com.omniread.backend.dto.ForecastSummaryResponse;
import com.omniread.backend.dto.GenerateForecastRequest;
import com.omniread.backend.entity.InventoryRecord;
import com.omniread.backend.entity.StockoutForecast;
import com.omniread.backend.entity.enums.ProductType;
import com.omniread.backend.entity.enums.StockoutRisk;
import com.omniread.backend.repository.InventoryRecordRepository;
import com.omniread.backend.repository.OrderItemRepository;
import com.omniread.backend.repository.StockoutForecastRepository;
import com.omniread.backend.service.ForecastService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ForecastServiceImpl implements ForecastService {

    private static final String MODEL_VERSION = "rules-v1.0";

    private final InventoryRecordRepository inventoryRecordRepository;
    private final OrderItemRepository orderItemRepository;
    private final StockoutForecastRepository stockoutForecastRepository;

    @Override
    @Transactional
    public ForecastSummaryResponse generateForProduct(Long productId, GenerateForecastRequest request) {
        InventoryRecord record = inventoryRecordRepository.findByProductId(productId)
            .orElseThrow(() -> new IllegalArgumentException("Inventory record not found: " + productId));
        List<ForecastResponse> forecasts = generateForecasts(record, normalize(request));
        return ForecastSummaryResponse.builder()
            .generatedCount(forecasts.size())
            .forecasts(forecasts)
            .build();
    }

    @Override
    @Transactional
    public ForecastSummaryResponse generateForAllProducts(GenerateForecastRequest request) {
        GenerateForecastRequest normalizedRequest = normalize(request);
        List<ForecastResponse> forecasts = new ArrayList<>();
        for (InventoryRecord record : inventoryRecordRepository.findAll()) {
            if (record.getProduct().getBookType() != ProductType.EBOOK) {
                forecasts.addAll(generateForecasts(record, normalizedRequest));
            }
        }
        return ForecastSummaryResponse.builder()
            .generatedCount(forecasts.size())
            .forecasts(forecasts)
            .build();
    }

    private List<ForecastResponse> generateForecasts(InventoryRecord record, GenerateForecastRequest request) {
        if (record.getProduct().getBookType() == ProductType.EBOOK) {
            return new ArrayList<>();
        }

        LocalDate forecastDate = LocalDate.now();
        BigDecimal dailyDemand = estimateDailyDemand(record.getProduct().getId(), request.getLookbackDays());
        int predictedStock = record.getQuantityOnHand() - record.getReservedQuantity();
        List<StockoutForecast> savedForecasts = new ArrayList<>();

        for (int day = 1; day <= request.getHorizonDays(); day++) {
            int predictedDemand = dailyDemand.multiply(BigDecimal.valueOf(day))
                .setScale(0, RoundingMode.CEILING)
                .intValue();
            predictedStock = record.getQuantityOnHand() - record.getReservedQuantity() - predictedDemand;

            LocalDate targetDate = forecastDate.plusDays(day);
            StockoutForecast forecast = stockoutForecastRepository
                .findByProductIdAndForecastDateAndTargetDate(record.getProduct().getId(), forecastDate, targetDate)
                .orElseGet(StockoutForecast::new);

            forecast.setProduct(record.getProduct());
            forecast.setForecastDate(forecastDate);
            forecast.setTargetDate(targetDate);
            forecast.setPredictedDemand(predictedDemand);
            forecast.setPredictedStock(predictedStock);
            forecast.setStockoutRisk(resolveRisk(predictedStock, record.getSafetyStock(), record.getSupplierLeadTimeDays(), day));
            forecast.setConfidenceScore(resolveConfidence(dailyDemand, day, request.getHorizonDays()));
            forecast.setModelVersion(MODEL_VERSION);
            savedForecasts.add(stockoutForecastRepository.save(forecast));
        }

        return savedForecasts.stream()
            .map(ForecastResponse::from)
            .collect(Collectors.toList());
    }

    private BigDecimal estimateDailyDemand(Long productId, Integer lookbackDays) {
        LocalDateTime since = LocalDateTime.now().minusDays(lookbackDays);
        Long quantitySold = orderItemRepository.sumQuantitySoldSince(productId, since);
        if (quantitySold == null || quantitySold == 0) {
            return BigDecimal.ONE;
        }
        return BigDecimal.valueOf(quantitySold)
            .divide(BigDecimal.valueOf(lookbackDays), 4, RoundingMode.HALF_UP)
            .max(BigDecimal.ONE);
    }

    private StockoutRisk resolveRisk(int predictedStock, int safetyStock, int leadTimeDays, int day) {
        if (predictedStock <= 0) {
            return StockoutRisk.CRITICAL;
        }
        if (day <= leadTimeDays && predictedStock <= safetyStock) {
            return StockoutRisk.HIGH;
        }
        if (predictedStock <= safetyStock) {
            return StockoutRisk.MEDIUM;
        }
        return StockoutRisk.LOW;
    }

    private BigDecimal resolveConfidence(BigDecimal dailyDemand, int day, int horizonDays) {
        BigDecimal baseConfidence = dailyDemand.compareTo(BigDecimal.ONE) > 0
            ? BigDecimal.valueOf(0.82)
            : BigDecimal.valueOf(0.55);
        BigDecimal horizonPenalty = BigDecimal.valueOf(day)
            .divide(BigDecimal.valueOf(horizonDays), 4, RoundingMode.HALF_UP)
            .multiply(BigDecimal.valueOf(0.12));
        return baseConfidence.subtract(horizonPenalty)
            .max(BigDecimal.valueOf(0.35))
            .setScale(4, RoundingMode.HALF_UP);
    }

    private GenerateForecastRequest normalize(GenerateForecastRequest request) {
        GenerateForecastRequest normalized = request == null ? new GenerateForecastRequest() : request;
        if (normalized.getHorizonDays() == null) {
            normalized.setHorizonDays(7);
        }
        if (normalized.getLookbackDays() == null) {
            normalized.setLookbackDays(14);
        }
        return normalized;
    }
}
