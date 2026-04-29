package com.omniread.backend.dto;

import com.omniread.backend.entity.Order;
import com.omniread.backend.entity.enums.OrderStatus;
import com.omniread.backend.entity.enums.PaymentStatus;
import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class OrderResponse {

    private Long id;
    private String orderNumber;
    private Long customerId;
    private OrderStatus status;
    private PaymentStatus paymentStatus;
    private BigDecimal subtotal;
    private BigDecimal shippingFee;
    private BigDecimal totalAmount;
    private List<OrderLineResponse> items;

    public static OrderResponse from(Order order) {
        return OrderResponse.builder()
            .id(order.getId())
            .orderNumber(order.getOrderNumber())
            .customerId(order.getCustomer().getId())
            .status(order.getStatus())
            .paymentStatus(order.getPaymentStatus())
            .subtotal(order.getSubtotal())
            .shippingFee(order.getShippingFee())
            .totalAmount(order.getTotalAmount())
            .items(order.getItems().stream().map(OrderLineResponse::from).collect(Collectors.toList()))
            .build();
    }
}
