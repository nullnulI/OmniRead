package com.omniread.backend.repository;

import com.omniread.backend.entity.InventoryRecord;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface InventoryRecordRepository extends JpaRepository<InventoryRecord, Long> {

    Optional<InventoryRecord> findByProductId(Long productId);

    boolean existsByProductId(Long productId);

    @Query("select record from InventoryRecord record "
        + "join fetch record.product product "
        + "where product.bookType <> com.omniread.backend.entity.enums.ProductType.EBOOK "
        + "and (record.quantityOnHand - record.reservedQuantity) <= record.reorderThreshold")
    List<InventoryRecord> findLowStockRecords();
}
