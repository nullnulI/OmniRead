package com.omniread.backend.service;

import com.omniread.backend.dto.AutoProcurementRequest;
import com.omniread.backend.dto.CreateProcurementRequest;
import com.omniread.backend.dto.ProcurementResponse;
import com.omniread.backend.dto.UpdateProcurementStatusRequest;
import java.util.List;

public interface ProcurementService {

    List<ProcurementResponse> listRequests();

    List<ProcurementResponse> listSupplierRequests(Long supplierId);

    ProcurementResponse createRequest(CreateProcurementRequest request);

    List<ProcurementResponse> autoGenerateRequests(AutoProcurementRequest request);

    ProcurementResponse updateStatus(
        Long requestId,
        UpdateProcurementStatusRequest request,
        Long actorId,
        boolean supplierActor
    );
}
