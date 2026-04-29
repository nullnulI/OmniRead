package com.omniread.backend.service.impl;

import com.omniread.backend.dto.CheckoutRequest;
import com.omniread.backend.dto.CreateOrderRequest;
import com.omniread.backend.dto.OrderItemRequest;
import com.omniread.backend.dto.OrderResponse;
import com.omniread.backend.dto.UpdateOrderStatusRequest;
import com.omniread.backend.entity.CartItem;
import com.omniread.backend.entity.InventoryRecord;
import com.omniread.backend.entity.Order;
import com.omniread.backend.entity.OrderItem;
import com.omniread.backend.entity.Product;
import com.omniread.backend.entity.ShoppingCart;
import com.omniread.backend.entity.User;
import com.omniread.backend.entity.enums.ProductType;
import com.omniread.backend.entity.enums.OrderStatus;
import com.omniread.backend.entity.enums.PaymentStatus;
import com.omniread.backend.repository.CartItemRepository;
import com.omniread.backend.repository.InventoryRecordRepository;
import com.omniread.backend.repository.OrderRepository;
import com.omniread.backend.repository.ProductRepository;
import com.omniread.backend.repository.ShoppingCartRepository;
import com.omniread.backend.repository.UserRepository;
import com.omniread.backend.service.RedisLockService;
import com.omniread.backend.service.TransactionService;
import java.math.BigDecimal;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import static com.omniread.backend.config.RedisConfig.CART_CACHE;

@Service
@RequiredArgsConstructor
public class TransactionServiceImpl implements TransactionService {

    private static final Duration CHECKOUT_LOCK_TTL = Duration.ofSeconds(20);
    private static final Duration STOCK_LOCK_TTL = Duration.ofSeconds(20);

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final InventoryRecordRepository inventoryRecordRepository;
    private final ShoppingCartRepository shoppingCartRepository;
    private final CartItemRepository cartItemRepository;
    private final RedisLockService redisLockService;

    @Override
    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request) {
        Map<String, String> stockLocks = acquireStockLocks(request.getItems()
            .stream()
            .map(OrderItemRequest::getProductId)
            .collect(Collectors.toList()));
        boolean releaseScheduled = false;
        try {
            OrderResponse response = createOrderWithLocks(request);
            scheduleUnlocks(stockLocks);
            releaseScheduled = true;
            return response;
        } finally {
            if (!releaseScheduled) {
                releaseLocks(stockLocks);
            }
        }
    }

    private OrderResponse createOrderWithLocks(CreateOrderRequest request) {
        User customer = userRepository.findById(request.getCustomerId())
            .orElseThrow(() -> new IllegalArgumentException("Customer not found: " + request.getCustomerId()));

        Order order = new Order();
        order.setOrderNumber("ORD-" + System.currentTimeMillis());
        order.setCustomer(customer);
        order.setShippingAddress(request.getShippingAddress());
        order.setStatus(OrderStatus.PAID);
        order.setPaymentStatus(PaymentStatus.PAID);

        BigDecimal subtotal = BigDecimal.ZERO;
        for (OrderItemRequest itemRequest : request.getItems()) {
            Product product = productRepository.findById(itemRequest.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("Book not found: " + itemRequest.getProductId()));
            deductStockIfRequired(product, itemRequest.getQuantity());
            subtotal = subtotal.add(addOrderItem(order, product, itemRequest.getQuantity()));
        }

        order.setSubtotal(subtotal);
        order.setTotalAmount(subtotal.add(order.getShippingFee()));
        return OrderResponse.from(orderRepository.save(order));
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = CART_CACHE, key = "#p0")
    public OrderResponse checkoutCart(Long customerId, CheckoutRequest request) {
        String checkoutLockKey = "lock:checkout:" + customerId;
        String checkoutToken = redisLockService.tryLock(checkoutLockKey, CHECKOUT_LOCK_TTL)
            .orElseThrow(() -> new IllegalStateException("Checkout is already in progress for this customer"));
        Map<String, String> locks = new LinkedHashMap<>();
        locks.put(checkoutLockKey, checkoutToken);
        boolean releaseScheduled = false;
        try {
            ShoppingCart cart = shoppingCartRepository.findByCustomerId(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Shopping cart not found"));
            if (cart.getItems().isEmpty()) {
                throw new IllegalArgumentException("Shopping cart is empty");
            }
            locks.putAll(acquireStockLocks(cart.getItems()
                .stream()
                .map(item -> item.getProduct().getId())
                .collect(Collectors.toList())));
            OrderResponse response = checkoutCartWithLocks(customerId, request, cart);
            scheduleUnlocks(locks);
            releaseScheduled = true;
            return response;
        } finally {
            if (!releaseScheduled) {
                releaseLocks(locks);
            }
        }
    }

    private OrderResponse checkoutCartWithLocks(Long customerId, CheckoutRequest request, ShoppingCart cart) {
        User customer = userRepository.findById(customerId)
            .orElseThrow(() -> new IllegalArgumentException("Customer not found: " + customerId));

        Order order = new Order();
        order.setOrderNumber("ORD-" + System.currentTimeMillis());
        order.setCustomer(customer);
        order.setShippingAddress(request.getShippingAddress());
        order.setStatus(OrderStatus.PAID);
        order.setPaymentStatus(PaymentStatus.PAID);

        BigDecimal subtotal = BigDecimal.ZERO;
        for (CartItem cartItem : cart.getItems()) {
            Product product = cartItem.getProduct();
            deductStockIfRequired(product, cartItem.getQuantity());
            subtotal = subtotal.add(addOrderItem(order, product, cartItem.getQuantity()));
        }

        order.setSubtotal(subtotal);
        order.setTotalAmount(subtotal.add(order.getShippingFee()));
        Order savedOrder = orderRepository.save(order);

        cartItemRepository.deleteAll(cart.getItems());
        cart.getItems().clear();

        return OrderResponse.from(savedOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> listCustomerOrders(Long customerId) {
        return orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)
            .stream()
            .map(OrderResponse::from)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> listAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc()
            .stream()
            .map(OrderResponse::from)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, UpdateOrderStatusRequest request) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));
        order.setStatus(request.getStatus());
        if (request.getPaymentStatus() != null) {
            order.setPaymentStatus(request.getPaymentStatus());
        }
        return OrderResponse.from(orderRepository.save(order));
    }

    private BigDecimal addOrderItem(Order order, Product product, Integer quantity) {
        BigDecimal lineTotal = product.getPrice().multiply(BigDecimal.valueOf(quantity));

        OrderItem item = new OrderItem();
        item.setProduct(product);
        item.setQuantity(quantity);
        item.setUnitPrice(product.getPrice());
        item.setLineTotal(lineTotal);
        order.addItem(item);
        return lineTotal;
    }

    private void deductStockIfRequired(Product product, Integer quantity) {
        if (product.getBookType() == ProductType.EBOOK) {
            return;
        }

        InventoryRecord record = inventoryRecordRepository.findByProductId(product.getId())
            .orElseThrow(() -> new IllegalArgumentException("Inventory record not found for book: " + product.getId()));
        int availableQuantity = record.getQuantityOnHand() - record.getReservedQuantity();
        if (availableQuantity < quantity) {
            throw new IllegalArgumentException("Insufficient stock for book: " + product.getTitle());
        }
        record.setQuantityOnHand(record.getQuantityOnHand() - quantity);
        inventoryRecordRepository.save(record);
    }

    private Map<String, String> acquireStockLocks(List<Long> productIds) {
        Map<String, String> locks = new LinkedHashMap<>();
        List<Long> sortedIds = productIds.stream()
            .distinct()
            .sorted()
            .collect(Collectors.toList());
        try {
            for (Long productId : sortedIds) {
                String key = "lock:stock:" + productId;
                String token = redisLockService.tryLock(key, STOCK_LOCK_TTL)
                    .orElseThrow(() -> new IllegalStateException("Stock is being updated for product: " + productId));
                locks.put(key, token);
            }
            return locks;
        } catch (RuntimeException ex) {
            releaseLocks(locks);
            throw ex;
        }
    }

    private void scheduleUnlocks(Map<String, String> locks) {
        if (locks.isEmpty()) {
            return;
        }
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            releaseLocks(locks);
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                releaseLocks(locks);
            }
        });
    }

    private void releaseLocks(Map<String, String> locks) {
        locks.forEach(redisLockService::unlock);
    }
}
