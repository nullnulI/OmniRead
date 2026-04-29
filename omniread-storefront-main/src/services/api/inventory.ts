import { fetchJson } from "@/services/http";
import type {
  ForecastRecord,
  ForecastSummary,
  InventoryRecord,
  LowStockRecord,
  ProcurementRequest,
  ProcurementStatus,
  ProductPayload,
  ProductSummary,
  StockUpdatePayload,
} from "@/types/inventory";

export async function fetchOperationProducts(): Promise<ProductSummary[]> {
  return fetchJson<ProductSummary[]>("/books/admin");
}

export async function createProduct(payload: ProductPayload): Promise<ProductSummary> {
  return fetchJson<ProductSummary>("/books", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateProduct(productId: number, payload: ProductPayload): Promise<ProductSummary> {
  return fetchJson<ProductSummary>(`/books/${productId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function fetchInventory(productId: number): Promise<InventoryRecord> {
  return fetchJson<InventoryRecord>(`/inventory/products/${productId}`);
}

export async function updateInventoryStock(
  productId: number,
  payload: StockUpdatePayload,
): Promise<InventoryRecord> {
  return fetchJson<InventoryRecord>(`/inventory/products/${productId}/stock`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function fetchForecasts(productId: number): Promise<ForecastRecord[]> {
  return fetchJson<ForecastRecord[]>(`/inventory/products/${productId}/forecasts`);
}

export async function generateAllForecasts(): Promise<ForecastSummary> {
  return fetchJson<ForecastSummary>("/inventory/forecasts/generate", {
    method: "POST",
    body: JSON.stringify({ horizonDays: 7, lookbackDays: 14 }),
  });
}

export async function fetchLowStockRecords(): Promise<LowStockRecord[]> {
  return fetchJson<LowStockRecord[]>("/inventory/low-stock");
}

export async function fetchProcurementRequests(): Promise<ProcurementRequest[]> {
  return fetchJson<ProcurementRequest[]>("/inventory/procurement-requests");
}

export async function fetchMyProcurementRequests(): Promise<ProcurementRequest[]> {
  return fetchJson<ProcurementRequest[]>("/inventory/procurement-requests/me");
}

export async function autoGenerateProcurementRequests(): Promise<ProcurementRequest[]> {
  return fetchJson<ProcurementRequest[]>("/inventory/procurement-requests/auto-generate", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function updateProcurementStatus(
  requestId: number,
  status: ProcurementStatus,
  externalRequestId?: string,
): Promise<ProcurementRequest> {
  return fetchJson<ProcurementRequest>(`/inventory/procurement-requests/${requestId}/status`, {
    method: "PUT",
    body: JSON.stringify({ status, externalRequestId }),
  });
}
