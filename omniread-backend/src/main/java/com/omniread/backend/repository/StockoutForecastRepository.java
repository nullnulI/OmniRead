package com.omniread.backend.repository;

import com.omniread.backend.entity.StockoutForecast;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StockoutForecastRepository extends JpaRepository<StockoutForecast, Long> {

    List<StockoutForecast> findByProductIdOrderByTargetDateAsc(Long productId);

    List<StockoutForecast> findByForecastDateOrderByTargetDateAsc(LocalDate forecastDate);

    Optional<StockoutForecast> findByProductIdAndForecastDateAndTargetDate(
        Long productId,
        LocalDate forecastDate,
        LocalDate targetDate
    );
}
