package com.omniread.backend.repository;

import com.omniread.backend.entity.PredictionAudit;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PredictionAuditRepository extends JpaRepository<PredictionAudit, Long> {

    List<PredictionAudit> findByProductIdOrderByForecastDateDesc(Long productId);

    Optional<PredictionAudit> findByProductIdAndForecastDate(Long productId, LocalDate forecastDate);

    List<PredictionAudit> findByForecastDateOrderByRiskScoreDesc(LocalDate forecastDate);
}