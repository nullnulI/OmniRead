package com.omniread.backend.repository;

import com.omniread.backend.entity.OrderItem;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    List<OrderItem> findByOrderId(Long orderId);

    @Query("select coalesce(sum(item.quantity), 0) from OrderItem item "
        + "where item.product.id = :productId and item.createdAt >= :since")
    Long sumQuantitySoldSince(@Param("productId") Long productId, @Param("since") LocalDateTime since);
}
