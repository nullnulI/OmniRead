package com.omniread.backend.repository;

import com.omniread.backend.entity.ShoppingCart;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ShoppingCartRepository extends JpaRepository<ShoppingCart, Long> {

    Optional<ShoppingCart> findByCustomerId(Long customerId);
}
