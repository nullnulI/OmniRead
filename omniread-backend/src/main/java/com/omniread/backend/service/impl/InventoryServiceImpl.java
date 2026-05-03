package com.omniread.backend.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.omniread.backend.dto.ForecastResponse;
import com.omniread.backend.dto.InventoryResponse;
import com.omniread.backend.dto.LowStockResponse;
import com.omniread.backend.dto.PredictionAuditResponse;
import com.omniread.backend.dto.PredictionAuditResponse.ProcurementRecommendationDetail;
import com.omniread.backend.dto.StockUpdateRequest;
import com.omniread.backend.entity.InventoryRecord;
import com.omniread.backend.entity.PredictionAudit;
import com.omniread.backend.entity.ProcurementRequest;
import com.omniread.backend.entity.Product;
import com.omniread.backend.repository.InventoryRecordRepository;
import com.omniread.backend.repository.PredictionAuditRepository;
import com.omniread.backend.repository.ProcurementRequestRepository;
import com.omniread.backend.repository.ProductRepository;
import com.omniread.backend.repository.StockoutForecastRepository;
import com.omniread.backend.service.InventoryService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InventoryServiceImpl implements InventoryService {

    private final InventoryRecordRepository inventoryRecordRepository;
    private final ProductRepository productRepository;
    private final StockoutForecastRepository stockoutForecastRepository;
    private final PredictionAuditRepository predictionAuditRepository;
    private final ProcurementRequestRepository procurementRequestRepository;
    private final ObjectMapper objectMapper;

    private static String deriveRiskBand(BigDecimal riskScore) {
        if (riskScore == null) return "UNKNOWN";
        if (riskScore.compareTo(BigDecimal.valueOf(0.75)) >= 0) return "CRITICAL";
        if (riskScore.compareTo(BigDecimal.valueOf(0.50)) >= 0) return "HIGH";
        if (riskScore.compareTo(BigDecimal.valueOf(0.25)) >= 0) return "MEDIUM";
        return "LOW";
    }

    @Override
    @Transactional(readOnly = true)
    public InventoryResponse getInventory(Long productId) {
        InventoryRecord record = inventoryRecordRepository.findByProductId(productId)
            .orElseThrow(() -> new IllegalArgumentException("Inventory record not found: " + productId));
        return InventoryResponse.from(record);
    }

    @Override
    @Transactional
    public InventoryResponse updateStock(Long productId, StockUpdateRequest request) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new IllegalArgumentException("Book not found: " + productId));
        InventoryRecord record = inventoryRecordRepository.findByProductId(productId)
            .orElseGet(() -> {
                InventoryRecord newRecord = new InventoryRecord();
                newRecord.setProduct(product);
                return newRecord;
            });

        record.setQuantityOnHand(request.getQuantityOnHand());
        if (request.getReorderThreshold() != null) {
            record.setReorderThreshold(request.getReorderThreshold());
        }
        if (request.getSafetyStock() != null) {
            record.setSafetyStock(request.getSafetyStock());
        }
        if (request.getSupplierLeadTimeDays() != null) {
            record.setSupplierLeadTimeDays(request.getSupplierLeadTimeDays());
        }
        record.setLastRestockedAt(LocalDateTime.now());
        return InventoryResponse.from(inventoryRecordRepository.save(record));
    }

    @Override
    @Transactional(readOnly = true)
    public List<LowStockResponse> listLowStockRecords() {
        return inventoryRecordRepository.findLowStockRecords()
            .stream()
            .map(LowStockResponse::from)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ForecastResponse> listForecasts(Long productId) {
        return stockoutForecastRepository.findByProductIdOrderByTargetDateAsc(productId)
            .stream()
            .map(ForecastResponse::from)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PredictionAuditResponse getLatestPredictionAudit(Long productId) {
        PredictionAudit audit = predictionAuditRepository
            .findByProductIdOrderByForecastDateDesc(productId)
            .stream()
            .findFirst()
            .orElse(null);

        if (audit == null) {
            return null;
        }

        Map<String, Double> attribution = parseJson(audit.getAttributionScores());

        PredictionAuditResponse.ProcurementRecommendationDetail procRec = null;
        if (audit.getCreatedAt() != null) {
            LocalDateTime oneMinuteAfter = audit.getCreatedAt().plusMinutes(1);
            List<ProcurementRequest> recentProcurements = procurementRequestRepository
                .findByProductIdOrderByCreatedAtDesc(audit.getProduct().getId());
            ProcurementRequest latestProc = recentProcurements.stream()
                .filter(p -> !p.getCreatedAt().isBefore(audit.getCreatedAt()))
                .filter(p -> !p.getCreatedAt().isAfter(oneMinuteAfter))
                .findFirst()
                .orElse(null);
            if (latestProc != null) {
                procRec = PredictionAuditResponse.ProcurementRecommendationDetail.builder()
                    .shouldTrigger(true)
                    .triggerReason(latestProc.getTriggerReason())
                    .suggestedQuantity(latestProc.getRequestedQuantity())
                    .build();
            }
        }

        return PredictionAuditResponse.builder()
            .id(audit.getId())
            .productId(audit.getProduct().getId())
            .forecastDate(audit.getForecastDate())
            .horizonDays(audit.getHorizonDays())
            .modelVersion(audit.getModelVersion())
            .predictedStockoutDay(audit.getPredictedStockoutDay())
            .riskScore(audit.getRiskScore())
            .riskBand(deriveRiskBand(audit.getRiskScore()))
            .predictionSource(audit.getPredictionSource())
            .confidenceScore(audit.getConfidenceScore())
            .attribution(attribution)
            .counterfactualStock(audit.getCounterfactualStock())
            .counterfactualRisk(audit.getCounterfactualRisk())
            .procurementRecommendation(procRec)
            .llmSummary(audit.getLlmSummary())
            .llmSummaryStatus("disabled") // TODO: read from audit field when Phase 3 LLM is enabled
            .createdAt(audit.getCreatedAt())
            .build();
    }

    private Map<String, Double> parseJson(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyMap();
        }
        try {
            return objectMapper.readValue(json,
                objectMapper.getTypeFactory().constructMapType(Map.class, String.class, Double.class));
        } catch (JsonProcessingException e) {
            return Collections.emptyMap();
        }
    }
}
