package com.omniread.backend.dto;

import com.omniread.backend.entity.ProcurementRequest;
import com.omniread.backend.entity.enums.ProcurementStatus;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ProcurementResponse {

    private Long id;
    private String requestNumber;
    private Long productId;
    private String productTitle;
    private Long supplierId;
    private String supplierCompanyName;
    private Integer requestedQuantity;
    private ProcurementStatus status;
    private String triggerReason;
    private String externalRequestId;
    private LocalDateTime approvedAt;
    private LocalDateTime completedAt;

    public static ProcurementResponse from(ProcurementRequest request) {
        return ProcurementResponse.builder()
            .id(request.getId())
            .requestNumber(request.getRequestNumber())
            .productId(request.getProduct().getId())
            .productTitle(request.getProduct().getTitle())
            .supplierId(request.getSupplier().getId())
            .supplierCompanyName(request.getSupplier().getSupplierCompanyName())
            .requestedQuantity(request.getRequestedQuantity())
            .status(request.getStatus())
            .triggerReason(request.getTriggerReason())
            .externalRequestId(request.getExternalRequestId())
            .approvedAt(request.getApprovedAt())
            .completedAt(request.getCompletedAt())
            .build();
    }
}
