package com.omniread.backend.dto;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateProcurementRequest {

    @NotNull
    private Long productId;

    @NotNull
    private Long supplierId;

    @NotNull
    @Min(1)
    private Integer requestedQuantity;

    @NotBlank
    private String triggerReason;
}
