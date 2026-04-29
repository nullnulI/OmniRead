package com.omniread.backend.service;

import com.omniread.backend.dto.ForecastResponse;
import com.omniread.backend.dto.InventoryResponse;
import com.omniread.backend.dto.LowStockResponse;
import com.omniread.backend.dto.StockUpdateRequest;
import java.util.List;

public interface InventoryService {

    InventoryResponse getInventory(Long productId);

    InventoryResponse updateStock(Long productId, StockUpdateRequest request);

    List<LowStockResponse> listLowStockRecords();

    List<ForecastResponse> listForecasts(Long productId);
}
