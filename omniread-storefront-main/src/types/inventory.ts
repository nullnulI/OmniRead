export type ProductType = "EBOOK" | "PHYSICAL" | "BUNDLE";
export type ProductStatus = "DRAFT" | "ACTIVE" | "INACTIVE" | "DISCONTINUED";
export type StockoutRisk = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ProcurementStatus =
  | "DRAFT"
  | "AUTO_GENERATED"
  | "APPROVED"
  | "SENT"
  | "ACKNOWLEDGED"
  | "FULFILLED"
  | "CANCELLED";

export interface ProductSummary {
  id: number;
  sku: string;
  isbn13?: string;
  title: string;
  authorName: string;
  publisher?: string;
  category?: string;
  description?: string;
  bookType: ProductType;
  price: number;
  coverImageUrl?: string;
  status: ProductStatus;
}

export interface ProductPayload {
  sku: string;
  isbn13?: string;
  title: string;
  authorName: string;
  publisher?: string;
  category?: string;
  description?: string;
  bookType: ProductType;
  price: number;
  coverImageUrl?: string;
  status: ProductStatus;
}

export interface InventoryRecord {
  id: number;
  productId: number;
  productTitle: string;
  quantityOnHand: number;
  reservedQuantity: number;
  reorderThreshold: number;
  safetyStock: number;
  supplierLeadTimeDays: number;
  lastRestockedAt?: string;
}

export interface LowStockRecord {
  productId: number;
  sku: string;
  title: string;
  quantityOnHand: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderThreshold: number;
  suggestedQuantity: number;
  supplierLeadTimeDays: number;
}

export interface ForecastRecord {
  id: number;
  productId: number;
  forecastDate: string;
  targetDate: string;
  predictedDemand: number;
  predictedStock: number;
  stockoutRisk: StockoutRisk;
  confidenceScore: number;
  modelVersion: string;
}

export interface ForecastSummary {
  generatedCount: number;
}

export interface ProcurementRequest {
  id: number;
  requestNumber: string;
  productId: number;
  productTitle: string;
  supplierId: number;
  supplierCompanyName?: string;
  requestedQuantity: number;
  status: ProcurementStatus;
  triggerReason: string;
  externalRequestId?: string;
  approvedAt?: string;
  completedAt?: string;
}

export interface StockUpdatePayload {
  quantityOnHand: number;
  reorderThreshold?: number;
  safetyStock?: number;
  supplierLeadTimeDays?: number;
}
