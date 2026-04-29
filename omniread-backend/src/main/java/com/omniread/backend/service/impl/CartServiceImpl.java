package com.omniread.backend.service.impl;

import com.omniread.backend.dto.AddCartItemRequest;
import com.omniread.backend.dto.CartResponse;
import com.omniread.backend.dto.UpdateCartItemRequest;
import com.omniread.backend.entity.CartItem;
import com.omniread.backend.entity.Product;
import com.omniread.backend.entity.ShoppingCart;
import com.omniread.backend.entity.User;
import com.omniread.backend.repository.CartItemRepository;
import com.omniread.backend.repository.ProductRepository;
import com.omniread.backend.repository.ShoppingCartRepository;
import com.omniread.backend.repository.UserRepository;
import com.omniread.backend.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static com.omniread.backend.config.RedisConfig.CART_CACHE;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final ShoppingCartRepository shoppingCartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    @Cacheable(cacheNames = CART_CACHE, key = "#p0")
    public CartResponse getCart(Long customerId) {
        return CartResponse.from(getOrCreateCart(customerId));
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = CART_CACHE, key = "#p0")
    public CartResponse addItem(Long customerId, AddCartItemRequest request) {
        ShoppingCart cart = getOrCreateCart(customerId);
        Product product = productRepository.findById(request.getProductId())
            .orElseThrow(() -> new IllegalArgumentException("Book not found: " + request.getProductId()));

        CartItem item = cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId())
            .orElseGet(() -> {
                CartItem newItem = new CartItem();
                newItem.setCart(cart);
                newItem.setProduct(product);
                newItem.setQuantity(0);
                cart.getItems().add(newItem);
                return newItem;
            });
        item.setQuantity(item.getQuantity() + request.getQuantity());
        cartItemRepository.save(item);
        return CartResponse.from(cart);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = CART_CACHE, key = "#p0")
    public CartResponse updateItem(Long customerId, Long itemId, UpdateCartItemRequest request) {
        ShoppingCart cart = getOrCreateCart(customerId);
        CartItem item = findCustomerCartItem(cart, itemId);
        item.setQuantity(request.getQuantity());
        cartItemRepository.save(item);
        return CartResponse.from(cart);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = CART_CACHE, key = "#p0")
    public CartResponse removeItem(Long customerId, Long itemId) {
        ShoppingCart cart = getOrCreateCart(customerId);
        CartItem item = findCustomerCartItem(cart, itemId);
        cart.getItems().remove(item);
        cartItemRepository.delete(item);
        return CartResponse.from(cart);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = CART_CACHE, key = "#p0")
    public CartResponse clearCart(Long customerId) {
        ShoppingCart cart = getOrCreateCart(customerId);
        cartItemRepository.deleteAll(cart.getItems());
        cart.getItems().clear();
        return CartResponse.from(cart);
    }

    private ShoppingCart getOrCreateCart(Long customerId) {
        return shoppingCartRepository.findByCustomerId(customerId)
            .orElseGet(() -> {
                User customer = userRepository.findById(customerId)
                    .orElseThrow(() -> new IllegalArgumentException("Customer not found: " + customerId));
                ShoppingCart cart = new ShoppingCart();
                cart.setCustomer(customer);
                return shoppingCartRepository.save(cart);
            });
    }

    private CartItem findCustomerCartItem(ShoppingCart cart, Long itemId) {
        return cart.getItems()
            .stream()
            .filter(item -> item.getId().equals(itemId))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Cart item not found: " + itemId));
    }
}
