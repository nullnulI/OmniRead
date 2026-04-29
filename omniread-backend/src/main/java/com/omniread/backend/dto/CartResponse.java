package com.omniread.backend.dto;

import com.omniread.backend.entity.ShoppingCart;
import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;
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
public class CartResponse {

    private Long id;
    private Long customerId;
    private List<CartItemResponse> items;
    private BigDecimal subtotal;

    public static CartResponse from(ShoppingCart cart) {
        List<CartItemResponse> items = cart.getItems()
            .stream()
            .map(CartItemResponse::from)
            .collect(Collectors.toList());
        BigDecimal subtotal = items.stream()
            .map(CartItemResponse::getLineTotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        return CartResponse.builder()
            .id(cart.getId())
            .customerId(cart.getCustomer().getId())
            .items(items)
            .subtotal(subtotal)
            .build();
    }
}
