package com.omniread.backend.entity;

import java.time.LocalDateTime;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.JoinColumn;
import javax.persistence.OneToOne;
import javax.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "inventory_records")
public class InventoryRecord extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false, unique = true)
    private Product product;

    @Column(name = "quantity_on_hand", nullable = false)
    private Integer quantityOnHand = 0;

    @Column(name = "reserved_quantity", nullable = false)
    private Integer reservedQuantity = 0;

    @Column(name = "reorder_threshold", nullable = false)
    private Integer reorderThreshold = 0;

    @Column(name = "safety_stock", nullable = false)
    private Integer safetyStock = 0;

    @Column(name = "supplier_lead_time_days", nullable = false)
    private Integer supplierLeadTimeDays = 7;

    @Column(name = "last_restocked_at")
    private LocalDateTime lastRestockedAt;
}
