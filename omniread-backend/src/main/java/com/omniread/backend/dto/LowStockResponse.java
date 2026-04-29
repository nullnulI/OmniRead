package com.omniread.backend.dto;

import com.omniread.backend.entity.InventoryRecord;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LowStockResponse {

    private Long productId;
    private String sku;
    private String title;
    private Integer quantityOnHand;
    private Integer reservedQuantity;
    private Integer availableQuantity;
    private Integer reorderThreshold;
    private Integer suggestedQuantity;
    private Integer supplierLeadTimeDays;

    public static LowStockResponse from(InventoryRecord record) {
        int availableQuantity = record.getQuantityOnHand() - record.getReservedQuantity();
        int suggestedQuantity = Math.max(record.getReorderThreshold() + record.getSafetyStock() - availableQuantity, 1);
        return LowStockResponse.builder()
            .productId(record.getProduct().getId())
            .sku(record.getProduct().getSku())
            .title(record.getProduct().getTitle())
            .quantityOnHand(record.getQuantityOnHand())
            .reservedQuantity(record.getReservedQuantity())
            .availableQuantity(availableQuantity)
            .reorderThreshold(record.getReorderThreshold())
            .suggestedQuantity(suggestedQuantity)
            .supplierLeadTimeDays(record.getSupplierLeadTimeDays())
            .build();
    }
}
