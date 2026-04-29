package com.omniread.backend.dto;

import com.omniread.backend.entity.CartItem;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItemResponse {

    private Long id;
    private Long productId;
    private String sku;
    private String title;
    private String authorName;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal lineTotal;

    public static CartItemResponse from(CartItem item) {
        BigDecimal unitPrice = item.getProduct().getPrice();
        return CartItemResponse.builder()
            .id(item.getId())
            .productId(item.getProduct().getId())
            .sku(item.getProduct().getSku())
            .title(item.getProduct().getTitle())
            .authorName(item.getProduct().getAuthorName())
            .quantity(item.getQuantity())
            .unitPrice(unitPrice)
            .lineTotal(unitPrice.multiply(BigDecimal.valueOf(item.getQuantity())))
            .build();
    }
}
