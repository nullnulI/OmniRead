package com.omniread.backend.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.omniread.backend.dto.AiPredictRequest;
import com.omniread.backend.dto.AiPredictResponse;
import com.omniread.backend.dto.ProcurementWebhookPayload;
import com.omniread.backend.entity.InventoryRecord;
import com.omniread.backend.entity.PredictionAudit;
import com.omniread.backend.entity.ProcurementRequest;
import com.omniread.backend.entity.Product;
import com.omniread.backend.entity.StockoutForecast;
import com.omniread.backend.entity.User;
import com.omniread.backend.entity.enums.ProcurementStatus;
import com.omniread.backend.entity.enums.StockoutRisk;
import com.omniread.backend.entity.enums.UserRole;
import com.omniread.backend.repository.InventoryRecordRepository;
import com.omniread.backend.repository.PredictionAuditRepository;
import com.omniread.backend.repository.ProcurementRequestRepository;
import com.omniread.backend.repository.ProductRepository;
import com.omniread.backend.repository.StockoutForecastRepository;
import com.omniread.backend.repository.UserRepository;
import com.omniread.backend.service.AiForecastClient;
import com.omniread.backend.service.AiForecastService;
import com.omniread.backend.service.WebhookService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiForecastServiceImpl implements AiForecastService {

    private static final String MODEL_VERSION = "ai-ensemble-v1.0";
    private static final List<ProcurementStatus> OPEN_STATUSES = Arrays.asList(
        ProcurementStatus.DRAFT,
        ProcurementStatus.AUTO_GENERATED,
        ProcurementStatus.APPROVED,
        ProcurementStatus.SENT,
        ProcurementStatus.ACKNOWLEDGED
    );

    private final AiForecastClient aiForecastClient;
    private final WebhookService webhookService;
    private final PredictionAuditRepository predictionAuditRepository;
    private final ProcurementRequestRepository procurementRequestRepository;
    private final InventoryRecordRepository inventoryRecordRepository;
    private final ProductRepository productRepository;
    private final StockoutForecastRepository stockoutForecastRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void generateForProduct(Long productId, AiPredictRequest request) {
        AiPredictResponse response = aiForecastClient.predict(request);

        if (response == null || response.getData() == null) {
            throw new RuntimeException("Invalid AI service response");
        }

        AiPredictResponse.AiResponseData data = response.getData();
        AiPredictResponse.Prediction prediction = data.getPrediction();
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new IllegalArgumentException("Product not found: " + productId));

        int horizonDays = request.getHorizonDays() != null ? request.getHorizonDays() : 7;
        LocalDate forecastDate = LocalDate.now();
        PredictionAudit audit = savePredictionAudit(product, forecastDate, data, horizonDays);

        saveStockoutForecasts(product, forecastDate, prediction, audit, horizonDays);

        if (Boolean.TRUE.equals(data.getProcurementRecommendation().getShouldTrigger())) {
            triggerProcurement(product, data.getProcurementRecommendation());
        }
    }

    private PredictionAudit savePredictionAudit(Product product, LocalDate forecastDate,
            AiPredictResponse.AiResponseData data, int horizonDays) {
        PredictionAudit audit = new PredictionAudit();
        audit.setProduct(product);
        audit.setForecastDate(forecastDate);
        audit.setHorizonDays(horizonDays);
        audit.setModelVersion(MODEL_VERSION);
        audit.setPredictedStockoutDay(data.getPrediction().getPredictedStockoutDay());
        audit.setRiskScore(data.getPrediction().getRiskScore());
        audit.setPredictionSource(data.getPrediction().getPredictionSource());
        audit.setConfidenceScore(data.getPrediction().getConfidenceScore());

        try {
            if (data.getAttribution() != null) {
                audit.setAttributionScores(objectMapper.writeValueAsString(data.getAttribution()));
            }
            if (data.getModelOutputs() != null) {
                audit.setIndividualModelOutputs(objectMapper.writeValueAsString(data.getModelOutputs()));
            }
            if (data.getCounterfactual() != null) {
                audit.setCounterfactualStock(data.getCounterfactual().getStockNeeded());
                audit.setCounterfactualRisk(data.getCounterfactual().getRiskReducedTo());
            }
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize JSON fields: {}", e.getMessage());
        }

        return predictionAuditRepository.save(audit);
    }

    private void saveStockoutForecasts(Product product, LocalDate forecastDate,
            AiPredictResponse.Prediction prediction,
            PredictionAudit audit, int horizonDays) {

        BigDecimal dailyDemand = horizonDays > 0
            ? BigDecimal.valueOf(prediction.getPredictedDemand()).divide(BigDecimal.valueOf(horizonDays), 4, java.math.RoundingMode.HALF_UP)
            : BigDecimal.ZERO;

        InventoryRecord record = inventoryRecordRepository.findByProductId(product.getId())
            .orElseThrow(() -> new IllegalArgumentException("Inventory record not found: " + product.getId()));

        int currentStock = record.getQuantityOnHand() - record.getReservedQuantity();

        for (int day = 1; day <= horizonDays; day++) {
            int predictedDemand = dailyDemand.multiply(BigDecimal.valueOf(day))
                .setScale(0, java.math.RoundingMode.CEILING)
                .intValue();
            int predictedStock = currentStock - predictedDemand;

            LocalDate targetDate = forecastDate.plusDays(day);

            StockoutForecast forecast = stockoutForecastRepository
                .findByProductIdAndForecastDateAndTargetDate(product.getId(), forecastDate, targetDate)
                .orElseGet(StockoutForecast::new);
            forecast.setProduct(product);
            forecast.setForecastDate(forecastDate);
            forecast.setTargetDate(targetDate);
            forecast.setPredictedDemand(predictedDemand);
            forecast.setPredictedStock(predictedStock);
            forecast.setStockoutRisk(resolveRisk(predictedStock, record.getSafetyStock()));
            forecast.setConfidenceScore(prediction.getConfidenceScore());
            forecast.setModelVersion(MODEL_VERSION);
            forecast.setAudit(audit);

            stockoutForecastRepository.save(forecast);
        }
    }

    private StockoutRisk resolveRisk(int predictedStock, int safetyStock) {
        if (predictedStock <= 0) {
            return StockoutRisk.CRITICAL;
        }
        if (predictedStock <= safetyStock) {
            return StockoutRisk.HIGH;
        }
        if (predictedStock <= safetyStock * 2) {
            return StockoutRisk.MEDIUM;
        }
        return StockoutRisk.LOW;
    }

    private void triggerProcurement(Product product, AiPredictResponse.ProcurementRecommendation recommendation) {
        if (procurementRequestRepository.existsByProductIdAndStatusIn(product.getId(), OPEN_STATUSES)) {
            log.info("Open procurement request already exists for product: {}", product.getId());
            return;
        }

        User supplier = userRepository.findByRole(UserRole.SUPPLIER)
            .stream()
            .findFirst()
            .orElseThrow(() -> new IllegalStateException("No supplier available"));

        InventoryRecord record = inventoryRecordRepository.findByProductId(product.getId())
            .orElseThrow(() -> new IllegalArgumentException("Inventory record not found: " + product.getId()));

        int availableQuantity = record.getQuantityOnHand() - record.getReservedQuantity();
        int suggestedQuantity = Math.max(recommendation.getSuggestedQuantity(), 1);

        ProcurementRequest procurement = new ProcurementRequest();
        procurement.setRequestNumber("PR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        procurement.setProduct(product);
        procurement.setSupplier(supplier);
        procurement.setRequestedQuantity(suggestedQuantity);
        procurement.setStatus(ProcurementStatus.SENT);
        procurement.setTriggerReason(recommendation.getTriggerReason());
        procurement.setDispatchedAt(LocalDateTime.now());

        procurementRequestRepository.save(procurement);

        ProcurementWebhookPayload webhookPayload = ProcurementWebhookPayload.builder()
            .requestNumber(procurement.getRequestNumber())
            .productId(product.getId())
            .supplierId(supplier.getId())
            .requestedQuantity(suggestedQuantity)
            .triggerReason(recommendation.getTriggerReason())
            .dispatchedAt(procurement.getDispatchedAt())
            .build();

        webhookService.dispatchProcurement(webhookPayload);
    }
}