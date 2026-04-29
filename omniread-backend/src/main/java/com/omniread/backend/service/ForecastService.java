package com.omniread.backend.service;

import com.omniread.backend.dto.ForecastSummaryResponse;
import com.omniread.backend.dto.GenerateForecastRequest;

public interface ForecastService {

    ForecastSummaryResponse generateForProduct(Long productId, GenerateForecastRequest request);

    ForecastSummaryResponse generateForAllProducts(GenerateForecastRequest request);
}
