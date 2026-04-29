package com.omniread.backend.dto;

import com.omniread.backend.entity.InventoryRecord;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class InventoryResponse {

    private Long id;
    private Long productId;
    private String productTitle;
    private Integer quantityOnHand;
    private Integer reservedQuantity;
    private Integer reorderThreshold;
    private Integer safetyStock;
    private Integer supplierLeadTimeDays;
    private LocalDateTime lastRestockedAt;

    public static InventoryResponse from(InventoryRecord record) {
        return InventoryResponse.builder()
            .id(record.getId())
            .productId(record.getProduct().getId())
            .productTitle(record.getProduct().getTitle())
            .quantityOnHand(record.getQuantityOnHand())
            .reservedQuantity(record.getReservedQuantity())
            .reorderThreshold(record.getReorderThreshold())
            .safetyStock(record.getSafetyStock())
            .supplierLeadTimeDays(record.getSupplierLeadTimeDays())
            .lastRestockedAt(record.getLastRestockedAt())
            .build();
    }
}
