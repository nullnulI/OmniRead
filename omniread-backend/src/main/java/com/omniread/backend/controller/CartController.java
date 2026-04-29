package com.omniread.backend.controller;

import com.omniread.backend.dto.AddCartItemRequest;
import com.omniread.backend.dto.ApiResponse;
import com.omniread.backend.dto.CartResponse;
import com.omniread.backend.dto.CheckoutRequest;
import com.omniread.backend.dto.OrderResponse;
import com.omniread.backend.dto.UpdateCartItemRequest;
import com.omniread.backend.security.OmniReadUserDetails;
import com.omniread.backend.service.CartService;
import com.omniread.backend.service.TransactionService;
import javax.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/cart")
public class CartController {

    private final CartService cartService;
    private final TransactionService transactionService;

    @GetMapping
    public ApiResponse<CartResponse> getCart(@AuthenticationPrincipal OmniReadUserDetails principal) {
        return ApiResponse.success(cartService.getCart(principal.getId()));
    }

    @PostMapping("/items")
    public ApiResponse<CartResponse> addItem(
        @AuthenticationPrincipal OmniReadUserDetails principal,
        @Valid @RequestBody AddCartItemRequest request
    ) {
        return ApiResponse.success(cartService.addItem(principal.getId(), request));
    }

    @PutMapping("/items/{itemId}")
    public ApiResponse<CartResponse> updateItem(
        @AuthenticationPrincipal OmniReadUserDetails principal,
        @PathVariable Long itemId,
        @Valid @RequestBody UpdateCartItemRequest request
    ) {
        return ApiResponse.success(cartService.updateItem(principal.getId(), itemId, request));
    }

    @DeleteMapping("/items/{itemId}")
    public ApiResponse<CartResponse> removeItem(
        @AuthenticationPrincipal OmniReadUserDetails principal,
        @PathVariable Long itemId
    ) {
        return ApiResponse.success(cartService.removeItem(principal.getId(), itemId));
    }

    @DeleteMapping
    public ApiResponse<CartResponse> clearCart(@AuthenticationPrincipal OmniReadUserDetails principal) {
        return ApiResponse.success(cartService.clearCart(principal.getId()));
    }

    @PostMapping("/checkout")
    public ApiResponse<OrderResponse> checkout(
        @AuthenticationPrincipal OmniReadUserDetails principal,
        @Valid @RequestBody CheckoutRequest request
    ) {
        return ApiResponse.success(transactionService.checkoutCart(principal.getId(), request));
    }
}
