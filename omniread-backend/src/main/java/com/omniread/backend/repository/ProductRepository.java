package com.omniread.backend.repository;

import com.omniread.backend.entity.Product;
import com.omniread.backend.entity.enums.ProductStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findBySku(String sku);

    boolean existsBySku(String sku);

    List<Product> findByStatus(ProductStatus status);
}
