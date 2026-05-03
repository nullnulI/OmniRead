package com.omniread.backend.service;

import com.omniread.backend.dto.ProcurementWebhookPayload;

public interface WebhookService {
    void dispatchProcurement(ProcurementWebhookPayload payload);
}