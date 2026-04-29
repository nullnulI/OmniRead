package com.omniread.backend.dto;

import java.util.ArrayList;
import java.util.List;
import javax.validation.Valid;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateOrderRequest {

    @NotNull
    private Long customerId;

    private String shippingAddress;

    @Valid
    @NotEmpty
    private List<OrderItemRequest> items = new ArrayList<>();
}
