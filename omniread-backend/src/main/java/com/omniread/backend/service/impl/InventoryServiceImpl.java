package com.omniread.backend.service.impl;

import com.omniread.backend.dto.ForecastResponse;
import com.omniread.backend.dto.InventoryResponse;
import com.omniread.backend.dto.LowStockResponse;
import com.omniread.backend.dto.StockUpdateRequest;
import com.omniread.backend.entity.InventoryRecord;
import com.omniread.backend.entity.Product;
import com.omniread.backend.repository.InventoryRecordRepository;
import com.omniread.backend.repository.ProductRepository;
import com.omniread.backend.repository.StockoutForecastRepository;
import com.omniread.backend.service.InventoryService;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InventoryServiceImpl implements InventoryService {

    private final InventoryRecordRepository inventoryRecordRepository;
    private final ProductRepository productRepository;
    private final StockoutForecastRepository stockoutForecastRepository;

    @Override
    @Transactional(readOnly = true)
    public InventoryResponse getInventory(Long productId) {
        InventoryRecord record = inventoryRecordRepository.findByProductId(productId)
            .orElseThrow(() -> new IllegalArgumentException("Inventory record not found: " + productId));
        return InventoryResponse.from(record);
    }

    @Override
    @Transactional
    public InventoryResponse updateStock(Long productId, StockUpdateRequest request) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new IllegalArgumentException("Book not found: " + productId));
        InventoryRecord record = inventoryRecordRepository.findByProductId(productId)
            .orElseGet(() -> {
                InventoryRecord newRecord = new InventoryRecord();
                newRecord.setProduct(product);
                return newRecord;
            });

        record.setQuantityOnHand(request.getQuantityOnHand());
        if (request.getReorderThreshold() != null) {
            record.setReorderThreshold(request.getReorderThreshold());
        }
        if (request.getSafetyStock() != null) {
            record.setSafetyStock(request.getSafetyStock());
        }
        if (request.getSupplierLeadTimeDays() != null) {
            record.setSupplierLeadTimeDays(request.getSupplierLeadTimeDays());
        }
        record.setLastRestockedAt(LocalDateTime.now());
        return InventoryResponse.from(inventoryRecordRepository.save(record));
    }

    @Override
    @Transactional(readOnly = true)
    public List<LowStockResponse> listLowStockRecords() {
        return inventoryRecordRepository.findLowStockRecords()
            .stream()
            .map(LowStockResponse::from)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ForecastResponse> listForecasts(Long productId) {
        return stockoutForecastRepository.findByProductIdOrderByTargetDateAsc(productId)
            .stream()
            .map(ForecastResponse::from)
            .collect(Collectors.toList());
    }
}
