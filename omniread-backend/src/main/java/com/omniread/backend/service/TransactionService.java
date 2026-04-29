package com.omniread.backend.service;

import com.omniread.backend.dto.CreateOrderRequest;
import com.omniread.backend.dto.CheckoutRequest;
import com.omniread.backend.dto.OrderResponse;
import com.omniread.backend.dto.UpdateOrderStatusRequest;
import java.util.List;

public interface TransactionService {

    OrderResponse createOrder(CreateOrderRequest request);

    OrderResponse checkoutCart(Long customerId, CheckoutRequest request);

    List<OrderResponse> listCustomerOrders(Long customerId);

    List<OrderResponse> listAllOrders();

    OrderResponse updateOrderStatus(Long orderId, UpdateOrderStatusRequest request);
}
