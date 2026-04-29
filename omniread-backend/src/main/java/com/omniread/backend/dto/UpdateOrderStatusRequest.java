package com.omniread.backend.dto;

import com.omniread.backend.entity.enums.OrderStatus;
import com.omniread.backend.entity.enums.PaymentStatus;
import javax.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateOrderStatusRequest {

    @NotNull
    private OrderStatus status;

    private PaymentStatus paymentStatus;
}
