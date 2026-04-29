package com.omniread.backend.controller;

import com.omniread.backend.dto.ApiResponse;
import com.omniread.backend.dto.AutoProcurementRequest;
import com.omniread.backend.dto.CreateProcurementRequest;
import com.omniread.backend.dto.ForecastResponse;
import com.omniread.backend.dto.ForecastSummaryResponse;
import com.omniread.backend.dto.GenerateForecastRequest;
import com.omniread.backend.dto.InventoryResponse;
import com.omniread.backend.dto.LowStockResponse;
import com.omniread.backend.dto.ProcurementResponse;
import com.omniread.backend.dto.StockUpdateRequest;
import com.omniread.backend.dto.UpdateProcurementStatusRequest;
import com.omniread.backend.security.OmniReadUserDetails;
import com.omniread.backend.service.ForecastService;
import com.omniread.backend.service.InventoryService;
import com.omniread.backend.service.ProcurementService;
import java.util.List;
import javax.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/inventory")
public class InventoryController {

    private final InventoryService inventoryService;
    private final ProcurementService procurementService;
    private final ForecastService forecastService;

    @GetMapping("/products/{productId}")
    public ApiResponse<InventoryResponse> getInventory(@PathVariable Long productId) {
        return ApiResponse.success(inventoryService.getInventory(productId));
    }

    @PutMapping("/products/{productId}/stock")
    public ApiResponse<InventoryResponse> updateStock(
        @PathVariable Long productId,
        @Valid @RequestBody StockUpdateRequest request
    ) {
        return ApiResponse.success(inventoryService.updateStock(productId, request));
    }

    @GetMapping("/products/{productId}/forecasts")
    public ApiResponse<List<ForecastResponse>> listForecasts(@PathVariable Long productId) {
        return ApiResponse.success(inventoryService.listForecasts(productId));
    }

    @PostMapping("/products/{productId}/forecasts/generate")
    public ApiResponse<ForecastSummaryResponse> generateProductForecasts(
        @PathVariable Long productId,
        @Valid @RequestBody(required = false) GenerateForecastRequest request
    ) {
        return ApiResponse.success(forecastService.generateForProduct(productId, request));
    }

    @PostMapping("/forecasts/generate")
    public ApiResponse<ForecastSummaryResponse> generateAllForecasts(
        @Valid @RequestBody(required = false) GenerateForecastRequest request
    ) {
        return ApiResponse.success(forecastService.generateForAllProducts(request));
    }

    @GetMapping("/low-stock")
    public ApiResponse<List<LowStockResponse>> listLowStockRecords() {
        return ApiResponse.success(inventoryService.listLowStockRecords());
    }

    @GetMapping("/procurement-requests")
    public ApiResponse<List<ProcurementResponse>> listProcurementRequests() {
        return ApiResponse.success(procurementService.listRequests());
    }

    @GetMapping("/procurement-requests/me")
    public ApiResponse<List<ProcurementResponse>> listMyProcurementRequests(
        @AuthenticationPrincipal OmniReadUserDetails principal
    ) {
        return ApiResponse.success(procurementService.listSupplierRequests(principal.getId()));
    }

    @PostMapping("/procurement-requests")
    public ApiResponse<ProcurementResponse> createProcurementRequest(
        @Valid @RequestBody CreateProcurementRequest request
    ) {
        return ApiResponse.success(procurementService.createRequest(request));
    }

    @PostMapping("/procurement-requests/auto-generate")
    public ApiResponse<List<ProcurementResponse>> autoGenerateProcurementRequests(
        @RequestBody(required = false) AutoProcurementRequest request
    ) {
        return ApiResponse.success(procurementService.autoGenerateRequests(
            request == null ? new AutoProcurementRequest() : request
        ));
    }

    @PutMapping("/procurement-requests/{requestId}/status")
    public ApiResponse<ProcurementResponse> updateProcurementStatus(
        @AuthenticationPrincipal OmniReadUserDetails principal,
        @PathVariable Long requestId,
        @Valid @RequestBody UpdateProcurementStatusRequest request
    ) {
        boolean supplierActor = principal.getAuthorities()
            .stream()
            .anyMatch(authority -> "ROLE_SUPPLIER".equals(authority.getAuthority()));
        return ApiResponse.success(procurementService.updateStatus(
            requestId,
            request,
            principal.getId(),
            supplierActor
        ));
    }
}
