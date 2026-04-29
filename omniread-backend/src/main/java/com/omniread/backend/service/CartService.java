package com.omniread.backend.service;

import com.omniread.backend.dto.AddCartItemRequest;
import com.omniread.backend.dto.CartResponse;
import com.omniread.backend.dto.UpdateCartItemRequest;

public interface CartService {

    CartResponse getCart(Long customerId);

    CartResponse addItem(Long customerId, AddCartItemRequest request);

    CartResponse updateItem(Long customerId, Long itemId, UpdateCartItemRequest request);

    CartResponse removeItem(Long customerId, Long itemId);

    CartResponse clearCart(Long customerId);
}
