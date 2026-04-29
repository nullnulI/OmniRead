package com.omniread.backend.repository;

import com.omniread.backend.entity.Order;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByOrderNumber(String orderNumber);

    List<Order> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    List<Order> findAllByOrderByCreatedAtDesc();
}
