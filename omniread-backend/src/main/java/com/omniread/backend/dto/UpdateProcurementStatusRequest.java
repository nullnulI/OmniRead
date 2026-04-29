package com.omniread.backend.dto;

import com.omniread.backend.entity.enums.ProcurementStatus;
import javax.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateProcurementStatusRequest {

    @NotNull
    private ProcurementStatus status;

    private String externalRequestId;
}
