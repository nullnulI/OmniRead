package com.omniread.backend.dto;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StockUpdateRequest {

    @NotNull
    @Min(0)
    private Integer quantityOnHand;

    @Min(0)
    private Integer reorderThreshold;

    @Min(0)
    private Integer safetyStock;

    @Min(0)
    private Integer supplierLeadTimeDays;
}
