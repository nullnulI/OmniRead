package com.omniread.backend.entity;

import com.omniread.backend.entity.enums.ProcurementStatus;
import java.time.LocalDateTime;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.FetchType;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "procurement_requests")
public class ProcurementRequest extends BaseEntity {

    @Column(name = "request_number", nullable = false, unique = true, length = 64)
    private String requestNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id", nullable = false)
    private User supplier;

    @Column(name = "requested_quantity", nullable = false)
    private Integer requestedQuantity;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 40)
    private ProcurementStatus status = ProcurementStatus.AUTO_GENERATED;

    @Column(name = "trigger_reason", nullable = false)
    private String triggerReason;

    @Column(name = "external_request_id", length = 120)
    private String externalRequestId;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
