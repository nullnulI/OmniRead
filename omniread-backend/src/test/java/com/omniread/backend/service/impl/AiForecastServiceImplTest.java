package com.omniread.backend.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.omniread.backend.dto.AiPredictRequest;
import com.omniread.backend.dto.AiPredictResponse;
import com.omniread.backend.entity.InventoryRecord;
import com.omniread.backend.entity.PredictionAudit;
import com.omniread.backend.entity.Product;
import com.omniread.backend.repository.InventoryRecordRepository;
import com.omniread.backend.repository.PredictionAuditRepository;
import com.omniread.backend.repository.ProductRepository;
import com.omniread.backend.repository.StockoutForecastRepository;
import com.omniread.backend.service.AiForecastClient;
import com.omniread.backend.service.WebhookService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AiForecastServiceImplTest {

    @Mock
    private AiForecastClient aiForecastClient;

    @Mock
    private WebhookService webhookService;

    @Mock
    private PredictionAuditRepository predictionAuditRepository;

    @Mock
    private InventoryRecordRepository inventoryRecordRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private StockoutForecastRepository stockoutForecastRepository;

    @Mock
    private com.omniread.backend.repository.ProcurementRequestRepository procurementRequestRepository;

    @Mock
    private com.omniread.backend.repository.UserRepository userRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private AiForecastServiceImpl createService() {
        return new AiForecastServiceImpl(
                aiForecastClient, webhookService, predictionAuditRepository,
                procurementRequestRepository, inventoryRecordRepository, productRepository,
                stockoutForecastRepository, userRepository, objectMapper
        );
    }

    @Test
    void generateForProduct_successfulEnsemblePrediction_createsAuditAndForecasts() {
        AiForecastServiceImpl service = createService();

        Product product = mock(Product.class);
        when(product.getId()).thenReturn(9001L);
        when(productRepository.findById(9001L)).thenReturn(Optional.of(product));

        InventoryRecord record = mock(InventoryRecord.class);
        when(record.getQuantityOnHand()).thenReturn(10);
        when(record.getReservedQuantity()).thenReturn(0);
        when(record.getSafetyStock()).thenReturn(5);
        when(inventoryRecordRepository.findByProductId(9001L)).thenReturn(Optional.of(record));

        AiPredictResponse response = buildMockAiResponse("ensemble", BigDecimal.valueOf(0.82), 3);
        when(aiForecastClient.predict(any(AiPredictRequest.class))).thenReturn(response);

        when(predictionAuditRepository.save(any(PredictionAudit.class)))
                .thenAnswer(inv -> { PredictionAudit a = inv.getArgument(0); a.setId(1L); return a; });

        AiPredictRequest request = new AiPredictRequest();
        request.setProductId(9001L);
        request.setHorizonDays(7);
        request.setLookbackDays(14);

        service.generateForProduct(9001L, request);

        ArgumentCaptor<PredictionAudit> auditCaptor = ArgumentCaptor.forClass(PredictionAudit.class);
        verify(predictionAuditRepository).save(auditCaptor.capture());
        PredictionAudit savedAudit = auditCaptor.getValue();

        assertEquals("ai-ensemble-v1.0", savedAudit.getModelVersion());
        assertEquals("ensemble", savedAudit.getPredictionSource());
        assertNotNull(savedAudit.getAttributionScores());
        assertTrue(savedAudit.getAttributionScores().contains("sales_velocity"));

        verify(stockoutForecastRepository, times(7)).save(any());
    }

    @Test
    void generateForProduct_procurementTriggered_createsProcurementRequest() {
        AiForecastServiceImpl service = createService();

        Product product = mock(Product.class);
        when(product.getId()).thenReturn(9001L);
        when(productRepository.findById(9001L)).thenReturn(Optional.of(product));

        InventoryRecord record = mock(InventoryRecord.class);
        when(record.getQuantityOnHand()).thenReturn(1);
        when(record.getReservedQuantity()).thenReturn(0);
        when(record.getSafetyStock()).thenReturn(5);
        when(inventoryRecordRepository.findByProductId(9001L)).thenReturn(Optional.of(record));

        when(procurementRequestRepository.existsByProductIdAndStatusIn(anyLong(), anyList())).thenReturn(false);

        com.omniread.backend.entity.User supplier = mock(com.omniread.backend.entity.User.class);
        when(userRepository.findByRole(com.omniread.backend.entity.enums.UserRole.SUPPLIER))
                .thenReturn(java.util.List.of(supplier));

        AiPredictResponse response = buildMockAiResponseWithProcurement("ensemble", true, 13);
        when(aiForecastClient.predict(any(AiPredictRequest.class))).thenReturn(response);

        when(predictionAuditRepository.save(any(PredictionAudit.class)))
                .thenAnswer(inv -> { PredictionAudit a = inv.getArgument(0); a.setId(1L); return a; });

        AiPredictRequest request = new AiPredictRequest();
        request.setProductId(9001L);
        request.setHorizonDays(7);
        request.setLookbackDays(14);

        service.generateForProduct(9001L, request);

        verify(webhookService).dispatchProcurement(any());
    }

    @Test
    void generateForProduct_nullResponse_throwsRuntimeException() {
        AiForecastServiceImpl service = createService();

        when(aiForecastClient.predict(any(AiPredictRequest.class))).thenReturn(null);

        AiPredictRequest request = new AiPredictRequest();
        request.setProductId(9001L);

        assertThrows(RuntimeException.class, () -> service.generateForProduct(9001L, request));
    }

    private AiPredictResponse buildMockAiResponse(String source, BigDecimal risk, double stockoutDay) {
        AiPredictResponse.AiResponseData data = AiPredictResponse.AiResponseData.builder()
                .prediction(AiPredictResponse.Prediction.builder()
                        .productId(9001L)
                        .predictedStockoutDay(BigDecimal.valueOf(stockoutDay))
                        .riskScore(risk)
                        .riskBand("CRITICAL")
                        .predictedDemand(100)
                        .confidenceScore(BigDecimal.valueOf(0.82))
                        .predictionSource(source)
                        .build())
                .attribution(java.util.Map.of("sales_velocity", 0.3, "current_stock", 0.2))
                .procurementRecommendation(AiPredictResponse.ProcurementRecommendation.builder()
                        .shouldTrigger(false)
                        .suggestedQuantity(0)
                        .build())
                .build();
        return AiPredictResponse.builder().code(200).message("success").data(data).build();
    }

    private AiPredictResponse buildMockAiResponseWithProcurement(String source, boolean trigger, int qty) {
        AiPredictResponse.AiResponseData data = AiPredictResponse.AiResponseData.builder()
                .prediction(AiPredictResponse.Prediction.builder()
                        .productId(9001L)
                        .predictedStockoutDay(BigDecimal.valueOf(3.5))
                        .riskScore(BigDecimal.valueOf(0.85))
                        .riskBand("CRITICAL")
                        .predictedDemand(100)
                        .confidenceScore(BigDecimal.valueOf(0.82))
                        .predictionSource(source)
                        .build())
                .attribution(java.util.Map.of("sales_velocity", 0.3, "current_stock", 0.2))
                .procurementRecommendation(AiPredictResponse.ProcurementRecommendation.builder()
                        .shouldTrigger(trigger)
                        .suggestedQuantity(qty)
                        .triggerReason("risk >= 0.75 AND stockout <= lead")
                        .build())
                .build();
        return AiPredictResponse.builder().code(200).message("success").data(data).build();
    }
}