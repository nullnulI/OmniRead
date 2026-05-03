package com.omniread.backend.repository;

import com.omniread.backend.entity.ProcurementRequest;
import com.omniread.backend.entity.enums.ProcurementStatus;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProcurementRequestRepository extends JpaRepository<ProcurementRequest, Long> {

    Optional<ProcurementRequest> findByRequestNumber(String requestNumber);

    List<ProcurementRequest> findByStatusOrderByCreatedAtDesc(ProcurementStatus status);

    List<ProcurementRequest> findBySupplierIdOrderByCreatedAtDesc(Long supplierId);

    boolean existsByProductIdAndStatusIn(Long productId, List<ProcurementStatus> statuses);

    Optional<ProcurementRequest> findFirstByProductIdAndCreatedAtAfterOrderByCreatedAtDesc(Long productId, LocalDateTime after);

    List<ProcurementRequest> findByProductIdOrderByCreatedAtDesc(Long productId);
}
