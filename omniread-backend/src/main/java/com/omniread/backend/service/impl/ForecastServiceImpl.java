package com.omniread.backend.service.impl;

import com.omniread.backend.dto.AiPredictRequest;
import com.omniread.backend.dto.ForecastResponse;
import com.omniread.backend.dto.ForecastSummaryResponse;
import com.omniread.backend.dto.GenerateForecastRequest;
import com.omniread.backend.entity.InventoryRecord;
import com.omniread.backend.entity.StockoutForecast;
import com.omniread.backend.entity.enums.ProductType;
import com.omniread.backend.entity.enums.StockoutRisk;
import com.omniread.backend.entity.PredictionAudit;
import com.omniread.backend.repository.InventoryRecordRepository;
import com.omniread.backend.repository.OrderItemRepository;
import com.omniread.backend.repository.PredictionAuditRepository;
import com.omniread.backend.repository.ProductRepository;
import com.omniread.backend.repository.StockoutForecastRepository;
import com.omniread.backend.service.AiForecastClient;
import com.omniread.backend.service.AiForecastService;
import com.omniread.backend.service.ForecastService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ForecastServiceImpl implements ForecastService {

    private static final String MODEL_VERSION_RULES = "rules-v1.0";
    private static final String MODEL_VERSION_AI = "ai-ensemble-v1.0";

    private final InventoryRecordRepository inventoryRecordRepository;
    private final OrderItemRepository orderItemRepository;
    private final StockoutForecastRepository stockoutForecastRepository;
    private final PredictionAuditRepository predictionAuditRepository;
    private final ProductRepository productRepository;
    private final AiForecastClient aiForecastClient;
    private final AiForecastService aiForecastService;

    @Value("${omniread.ai-service.enabled:false}")
    private boolean aiEnabled;

    @Override
    @Transactional
    public ForecastSummaryResponse generateForProduct(Long productId, GenerateForecastRequest request) {
        GenerateForecastRequest normalizedRequest = normalize(request);

        if (aiEnabled && tryAiForecast(productId, normalizedRequest)) {
            return ForecastSummaryResponse.builder()
                .generatedCount(normalizedRequest.getHorizonDays())
                .forecasts(List.of())
                .build();
        }

        InventoryRecord record = inventoryRecordRepository.findByProductId(productId)
            .orElseThrow(() -> new IllegalArgumentException("Inventory record not found: " + productId));
        List<ForecastResponse> forecasts = generateForecasts(record, normalizedRequest);
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
        int aiCount = 0;
        for (InventoryRecord record : inventoryRecordRepository.findAll()) {
            if (record.getProduct().getBookType() == ProductType.EBOOK) {
                continue;
            }
            Long productId = record.getProduct().getId();
            if (aiEnabled && tryAiForecast(productId, normalizedRequest)) {
                aiCount++;
            } else {
                forecasts.addAll(generateForecasts(record, normalizedRequest));
            }
        }
        log.info("generateForAllProducts: AI path={}, rules fallback={}", aiCount, forecasts.size());
        return ForecastSummaryResponse.builder()
            .generatedCount(aiCount + forecasts.size())
            .forecasts(forecasts)
            .build();
    }

    private boolean tryAiForecast(Long productId, GenerateForecastRequest request) {
        try {
            if (!aiForecastClient.isHealthy()) {
                log.warn("AI service is not healthy, falling back to rules-v1.0");
                return false;
            }

            AiPredictRequest aiRequest = new AiPredictRequest();
            aiRequest.setProductId(productId);
            aiRequest.setHorizonDays(request.getHorizonDays());
            aiRequest.setLookbackDays(request.getLookbackDays());

            aiForecastService.generateForProduct(productId, aiRequest);
            log.info("AI forecast generated successfully for product: {}", productId);
            return true;
        } catch (Exception e) {
            log.error("AI forecast failed for product: {}, falling back to rules-v1.0: {}",
                productId, e.getMessage());
            return false;
        }
    }

    private List<ForecastResponse> generateForecasts(InventoryRecord record, GenerateForecastRequest request) {
        if (record.getProduct().getBookType() == ProductType.EBOOK) {
            return new ArrayList<>();
        }

        LocalDate forecastDate = LocalDate.now();
        BigDecimal dailyDemand = estimateDailyDemand(record.getProduct().getId(), request.getLookbackDays());
        int predictedStock = record.getQuantityOnHand() - record.getReservedQuantity();

        PredictionAudit audit = new PredictionAudit();
        audit.setProduct(record.getProduct());
        audit.setForecastDate(forecastDate);
        audit.setHorizonDays(request.getHorizonDays());
        audit.setModelVersion(MODEL_VERSION_RULES);
        audit.setPredictionSource("fallback");
        audit.setConfidenceScore(BigDecimal.valueOf(0.55));
        audit.setPredictedStockoutDay(BigDecimal.valueOf(request.getHorizonDays()));
        audit.setRiskScore(BigDecimal.ZERO);
        predictionAuditRepository.save(audit);

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
            forecast.setAudit(audit);
            forecast.setForecastDate(forecastDate);
            forecast.setTargetDate(targetDate);
            forecast.setPredictedDemand(predictedDemand);
            forecast.setPredictedStock(predictedStock);
            forecast.setStockoutRisk(resolveRisk(predictedStock, record.getSafetyStock(), record.getSupplierLeadTimeDays(), day));
            forecast.setConfidenceScore(resolveConfidence(dailyDemand, day, request.getHorizonDays()));
            forecast.setModelVersion(MODEL_VERSION_RULES);
            savedForecasts.add(stockoutForecastRepository.save(forecast));

            if (day == 1) {
                int firstStockoutDay = predictedStock <= 0 ? 0 : (predictedStock >= record.getQuantityOnHand() ? request.getHorizonDays() : day);
                audit.setPredictedStockoutDay(BigDecimal.valueOf(firstStockoutDay));
                BigDecimal risk = BigDecimal.ONE.subtract(BigDecimal.valueOf(firstStockoutDay).divide(BigDecimal.valueOf(request.getHorizonDays()), 4, RoundingMode.HALF_UP));
                audit.setRiskScore(risk.max(BigDecimal.ZERO).min(BigDecimal.ONE));
                predictionAuditRepository.save(audit);
            }
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
