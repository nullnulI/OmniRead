package com.omniread.backend.service;

import com.omniread.backend.dto.AiPredictRequest;

public interface AiForecastService {
    void generateForProduct(Long productId, AiPredictRequest request);
}