package com.omniread.backend.dto;

import com.omniread.backend.entity.OrderItem;
import java.math.BigDecimal;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class OrderLineResponse {

    private Long productId;
    private String productTitle;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal lineTotal;

    public static OrderLineResponse from(OrderItem item) {
        return OrderLineResponse.builder()
            .productId(item.getProduct().getId())
            .productTitle(item.getProduct().getTitle())
            .quantity(item.getQuantity())
            .unitPrice(item.getUnitPrice())
            .lineTotal(item.getLineTotal())
            .build();
    }
}
