package com.omniread.backend.controller;

import com.omniread.backend.dto.ApiResponse;
import com.omniread.backend.dto.CreateOrderRequest;
import com.omniread.backend.dto.OrderResponse;
import com.omniread.backend.dto.UpdateOrderStatusRequest;
import com.omniread.backend.security.OmniReadUserDetails;
import com.omniread.backend.service.TransactionService;
import java.util.List;
import javax.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/orders")
public class OrderController {

    private final TransactionService transactionService;

    @PostMapping
    public ApiResponse<OrderResponse> createOrder(
        @AuthenticationPrincipal OmniReadUserDetails principal,
        @Valid @RequestBody CreateOrderRequest request
    ) {
        request.setCustomerId(principal.getId());
        return ApiResponse.success(transactionService.createOrder(request));
    }

    @GetMapping("/me")
    public ApiResponse<List<OrderResponse>> listMyOrders(@AuthenticationPrincipal OmniReadUserDetails principal) {
        return ApiResponse.success(transactionService.listCustomerOrders(principal.getId()));
    }

    @GetMapping("/customers/{customerId}")
    public ApiResponse<List<OrderResponse>> listCustomerOrders(@PathVariable Long customerId) {
        return ApiResponse.success(transactionService.listCustomerOrders(customerId));
    }

    @GetMapping("/admin")
    public ApiResponse<List<OrderResponse>> listAllOrders() {
        return ApiResponse.success(transactionService.listAllOrders());
    }

    @PutMapping("/{orderId}/status")
    public ApiResponse<OrderResponse> updateOrderStatus(
        @PathVariable Long orderId,
        @Valid @RequestBody UpdateOrderStatusRequest request
    ) {
        return ApiResponse.success(transactionService.updateOrderStatus(orderId, request));
    }
}
