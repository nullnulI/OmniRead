package com.omniread.backend.service.impl;

import com.omniread.backend.dto.ProcurementWebhookPayload;
import com.omniread.backend.service.WebhookService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
@Slf4j
public class WebhookServiceImpl implements WebhookService {

    @Value("${omniread.webhook.procurement.url:}")
    private String procurementWebhookUrl;

    private final WebClient webClient;

    public WebhookServiceImpl(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    @Override
    public void dispatchProcurement(ProcurementWebhookPayload payload) {
        if (procurementWebhookUrl == null || procurementWebhookUrl.isBlank()) {
            log.info("Procurement webhook not configured, skipping dispatch for PR: {}", payload.getRequestNumber());
            return;
        }

        try {
            webClient.post()
                .uri(procurementWebhookUrl)
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(String.class)
                .block();

            log.info("Procurement webhook dispatched successfully for PR: {}", payload.getRequestNumber());
        } catch (Exception e) {
            log.error("Failed to dispatch procurement webhook for PR: {} - {}",
                payload.getRequestNumber(), e.getMessage());
        }
    }
}