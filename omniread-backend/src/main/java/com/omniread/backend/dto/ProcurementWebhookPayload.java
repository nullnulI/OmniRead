package com.omniread.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class ProcurementWebhookPayload {
    @JsonProperty("request_number")
    private String requestNumber;

    @JsonProperty("product_id")
    private Long productId;

    @JsonProperty("supplier_id")
    private Long supplierId;

    @JsonProperty("requested_quantity")
    private Integer requestedQuantity;

    @JsonProperty("trigger_reason")
    private String triggerReason;

    @JsonProperty("dispatched_at")
    private LocalDateTime dispatchedAt;
}