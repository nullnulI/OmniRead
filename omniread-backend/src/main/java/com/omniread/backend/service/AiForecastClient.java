package com.omniread.backend.service;

import com.omniread.backend.dto.AiPredictRequest;
import com.omniread.backend.dto.AiPredictResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiForecastClient {

    private final WebClient aiServiceWebClient;

    public AiPredictResponse predict(AiPredictRequest request) {
        try {
            return aiServiceWebClient.post()
                .uri("/predict")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(AiPredictResponse.class)
                .block();
        } catch (WebClientResponseException e) {
            log.error("AI service returned error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("AI service error: " + e.getStatusCode());
        } catch (Exception e) {
            log.error("Failed to call AI service: {}", e.getMessage());
            throw new RuntimeException("AI service unavailable: " + e.getMessage());
        }
    }

    public boolean isHealthy() {
        try {
            aiServiceWebClient.get()
                .uri("/health")
                .retrieve()
                .bodyToMono(String.class)
                .block();
            return true;
        } catch (Exception e) {
            log.warn("AI service health check failed: {}", e.getMessage());
            return false;
        }
    }
}