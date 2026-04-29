"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuthContext } from "@/features/auth/context/AuthProvider";
import {
  autoGenerateProcurementRequests,
  createProduct,
  fetchForecasts,
  fetchInventory,
  fetchLowStockRecords,
  fetchMyProcurementRequests,
  fetchOperationProducts,
  fetchProcurementRequests,
  generateAllForecasts,
  updateInventoryStock,
  updateProduct,
  updateProcurementStatus,
} from "@/services/api/inventory";
import { fetchAdminOrders, updateOrderStatus } from "@/services/api/order";
import type {
  ForecastRecord,
  InventoryRecord,
  LowStockRecord,
  ProductPayload,
  ProcurementRequest,
  ProcurementStatus,
  ProductSummary,
  StockoutRisk,
  StockUpdatePayload,
} from "@/types/inventory";
import type { Order, OrderStatus } from "@/types/order";
import type { UserRole } from "@/types/user";

import styles from "./page.module.css";

interface ProductInventoryRow {
  product: ProductSummary;
  inventory: InventoryRecord | null;
  forecasts: ForecastRecord[];
}

type StockDraft = Record<string, string>;
type ProductDraft = Record<string, string>;

const OPEN_PROCUREMENT_STATUSES: ProcurementStatus[] = [
  "DRAFT",
  "AUTO_GENERATED",
  "APPROVED",
  "SENT",
  "ACKNOWLEDGED",
];

function roleLabel(role?: UserRole) {
  if (role === "INVENTORY_ADMIN") return "Inventory Administrator";
  if (role === "SYSTEM_ADMIN") return "System Administrator";
  if (role === "SUPPLIER") return "Supplier";
  return "Customer";
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Operation failed";
}

function riskClass(risk?: StockoutRisk) {
  if (risk === "CRITICAL") return `${styles.pill} ${styles.riskCritical}`;
  if (risk === "HIGH") return `${styles.pill} ${styles.riskHigh}`;
  if (risk === "MEDIUM") return `${styles.pill} ${styles.riskMedium}`;
  if (risk === "LOW") return `${styles.pill} ${styles.riskLow}`;
  return styles.pill;
}

function statusClass(status: ProcurementStatus) {
  if (status === "FULFILLED") return `${styles.pill} ${styles.statusDone}`;
  if (status === "CANCELLED") return `${styles.pill} ${styles.statusCancelled}`;
  return `${styles.pill} ${styles.statusOpen}`;
}

function canApproveRequest(status: ProcurementStatus) {
  return status === "DRAFT" || status === "AUTO_GENERATED";
}

function canSendRequest(status: ProcurementStatus) {
  return status === "APPROVED" || status === "ACKNOWLEDGED";
}

function canConfirmReceipt(status: ProcurementStatus) {
  return status === "SENT" || status === "ACKNOWLEDGED";
}

function canCancelRequest(status: ProcurementStatus) {
  return status !== "FULFILLED" && status !== "CANCELLED";
}

function canAcknowledgeRequest(status: ProcurementStatus) {
  return status === "APPROVED" || status === "SENT";
}

function canMarkRequestShipped(status: ProcurementStatus) {
  return status === "ACKNOWLEDGED";
}

function canMoveOrderTo(status: OrderStatus, nextStatus: OrderStatus) {
  if (nextStatus === "FULFILLING") return status === "PENDING" || status === "PAID";
  if (nextStatus === "SHIPPED") return status === "FULFILLING";
  if (nextStatus === "COMPLETED") return status === "SHIPPED";
  if (nextStatus === "CANCELLED") return status !== "COMPLETED" && status !== "CANCELLED";
  return false;
}

function latestRisk(forecasts: ForecastRecord[]) {
  const priority: Record<StockoutRisk, number> = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    CRITICAL: 4,
  };
  return forecasts.reduce<ForecastRecord | null>((highest, forecast) => {
    if (!highest) return forecast;
    return priority[forecast.stockoutRisk] > priority[highest.stockoutRisk] ? forecast : highest;
  }, null);
}

function emptyProductDraft(): ProductDraft {
  return {
    sku: "",
    isbn13: "",
    title: "",
    authorName: "",
    publisher: "",
    category: "",
    description: "",
    bookType: "PHYSICAL",
    price: "0",
    coverImageUrl: "",
    status: "ACTIVE",
  };
}

function productToDraft(product: ProductSummary): ProductDraft {
  return {
    sku: product.sku,
    isbn13: product.isbn13 ?? "",
    title: product.title,
    authorName: product.authorName,
    publisher: product.publisher ?? "",
    category: product.category ?? "",
    description: product.description ?? "",
    bookType: product.bookType,
    price: String(product.price),
    coverImageUrl: product.coverImageUrl ?? "",
    status: product.status,
  };
}

function draftToProductPayload(draft: ProductDraft): ProductPayload {
  return {
    sku: draft.sku.trim(),
    isbn13: draft.isbn13.trim() || undefined,
    title: draft.title.trim(),
    authorName: draft.authorName.trim(),
    publisher: draft.publisher.trim() || undefined,
    category: draft.category.trim() || undefined,
    description: draft.description.trim() || undefined,
    bookType: draft.bookType as ProductPayload["bookType"],
    price: Number(draft.price),
    coverImageUrl: draft.coverImageUrl.trim() || undefined,
    status: draft.status as ProductPayload["status"],
  };
}

function OperationsPage() {
  const auth = useAuthContext();
  const role = auth.user?.metadata.role;
  const isAdmin = role === "INVENTORY_ADMIN" || role === "SYSTEM_ADMIN";
  const isSupplier = role === "SUPPLIER";

  const [rows, setRows] = useState<ProductInventoryRow[]>([]);
  const [lowStock, setLowStock] = useState<LowStockRecord[]>([]);
  const [requests, setRequests] = useState<ProcurementRequest[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [stockDraft, setStockDraft] = useState<StockDraft>({});
  const [productDraft, setProductDraft] = useState<ProductDraft>(emptyProductDraft());
  const [externalRequestId, setExternalRequestId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const selectedRow = useMemo(
    () => rows.find((row) => String(row.product.id) === selectedProductId),
    [rows, selectedProductId],
  );

  const openRequests = useMemo(
    () => requests.filter((request) => OPEN_PROCUREMENT_STATUSES.includes(request.status)),
    [requests],
  );

  const riskyProducts = useMemo(
    () => rows.filter((row) => {
      const risk = latestRisk(row.forecasts)?.stockoutRisk;
      return risk === "HIGH" || risk === "CRITICAL";
    }),
    [rows],
  );

  const loadAdminDashboard = useCallback(async () => {
    const [products, lowStockRecords, procurementRequests, adminOrders] = await Promise.all([
      fetchOperationProducts(),
      fetchLowStockRecords(),
      fetchProcurementRequests(),
      fetchAdminOrders(),
    ]);

    const productRows = await Promise.all(
      products.map(async (product) => {
        const [inventory, forecasts] = await Promise.all([
          fetchInventory(product.id).catch(() => null),
          fetchForecasts(product.id).catch(() => [] as ForecastRecord[]),
        ]);
        return { product, inventory, forecasts };
      }),
    );

    setRows(productRows);
    setLowStock(lowStockRecords);
    setRequests(procurementRequests);
    setOrders(adminOrders);
    if (!selectedProductId && productRows.length > 0) {
      setSelectedProductId(String(productRows[0].product.id));
    }
  }, [selectedProductId]);

  const loadSupplierPortal = useCallback(async () => {
    setRequests(await fetchMyProcurementRequests());
  }, []);

  const refresh = useCallback(async () => {
    if (!auth.isAuthenticated || (!isAdmin && !isSupplier)) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      if (isAdmin) {
        await loadAdminDashboard();
      } else {
        await loadSupplierPortal();
      }
    } catch (loadError) {
      setError(toErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [auth.isAuthenticated, isAdmin, isSupplier, loadAdminDashboard, loadSupplierPortal]);

  useEffect(() => {
    if (!auth.isLoading) {
      refresh();
    }
  }, [auth.isLoading, refresh]);

  useEffect(() => {
    if (!selectedRow?.inventory) {
      setStockDraft({});
      return;
    }
    setStockDraft({
      quantityOnHand: String(selectedRow.inventory.quantityOnHand),
      reorderThreshold: String(selectedRow.inventory.reorderThreshold),
      safetyStock: String(selectedRow.inventory.safetyStock),
      supplierLeadTimeDays: String(selectedRow.inventory.supplierLeadTimeDays),
    });
  }, [selectedRow]);

  useEffect(() => {
    if (selectedRow) {
      setProductDraft(productToDraft(selectedRow.product));
    }
  }, [selectedRow]);

  async function runAction(action: () => Promise<string>) {
    setIsWorking(true);
    setError("");
    setNotice("");
    try {
      const message = await action();
      setNotice(message);
      await refresh();
    } catch (actionError) {
      setError(toErrorMessage(actionError));
    } finally {
      setIsWorking(false);
    }
  }

  function submitStockUpdate() {
    if (!selectedRow) return;
    const payload: StockUpdatePayload = {
      quantityOnHand: Number(stockDraft.quantityOnHand),
      reorderThreshold: Number(stockDraft.reorderThreshold),
      safetyStock: Number(stockDraft.safetyStock),
      supplierLeadTimeDays: Number(stockDraft.supplierLeadTimeDays),
    };
    runAction(async () => {
      await updateInventoryStock(selectedRow.product.id, payload);
      return `${selectedRow.product.title} stock settings updated.`;
    });
  }

  function selectProductForEditing(productId: string) {
    setSelectedProductId(productId);
    const row = rows.find((candidate) => String(candidate.product.id) === productId);
    setProductDraft(row ? productToDraft(row.product) : emptyProductDraft());
  }

  function submitProduct() {
    const payload = draftToProductPayload(productDraft);
    runAction(async () => {
      if (selectedProductId) {
        await updateProduct(Number(selectedProductId), payload);
        return `${payload.title} updated.`;
      }
      const created = await createProduct(payload);
      setSelectedProductId(String(created.id));
      return `${payload.title} created.`;
    });
  }

  function startNewProduct() {
    setSelectedProductId("");
    setProductDraft(emptyProductDraft());
  }

  function changeStatus(requestId: number, status: ProcurementStatus) {
    runAction(async () => {
      await updateProcurementStatus(
        requestId,
        status,
        externalRequestId.trim() || undefined,
      );
      setExternalRequestId("");
      return `Procurement request marked ${status}.`;
    });
  }

  function changeOrderStatus(orderId: number, status: OrderStatus) {
    runAction(async () => {
      await updateOrderStatus(orderId, status, status === "PAID" ? "PAID" : undefined);
      return `Order marked ${status}.`;
    });
  }

  if (auth.isLoading || isLoading) {
    return <main className={styles.main}>Loading operations...</main>;
  }

  if (!auth.isAuthenticated) {
    return (
      <main className={styles.main}>
        <p className={styles.eyebrow}>Operations</p>
        <h1 className={styles.title}>Sign in required</h1>
        <p className={styles.subtitle}>
          Inventory and supplier workflows are role-protected.
        </p>
        <div className={styles.actionRow}>
          <Link className={styles.button} href="/login">Login</Link>
        </div>
      </main>
    );
  }

  if (!isAdmin && !isSupplier) {
    return (
      <main className={styles.main}>
        <p className={styles.eyebrow}>Operations</p>
        <h1 className={styles.title}>This portal is not available for {roleLabel(role)}</h1>
        <p className={styles.subtitle}>
          Customers can use the storefront, cart, orders, and reader pages.
        </p>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <div className={styles.headerRow}>
        <div>
          <p className={styles.eyebrow}>Operations</p>
          <h1 className={styles.title}>
            {isAdmin ? "Inventory Dashboard" : "Supplier Portal"}
          </h1>
          <p className={styles.subtitle}>
            Signed in as {auth.user?.metadata.name} / {roleLabel(role)}
          </p>
        </div>
        <div className={styles.actionRow}>
          <button className={styles.secondaryButton} onClick={refresh} disabled={isWorking}>
            Refresh
          </button>
          {isAdmin ? (
            <>
              <button
                className={styles.button}
                disabled={isWorking}
                onClick={() => runAction(async () => {
                  const summary = await generateAllForecasts();
                  return `Generated ${summary.generatedCount ?? 0} forecast rows.`;
                })}
              >
                Generate Forecasts
              </button>
              <button
                className={styles.secondaryButton}
                disabled={isWorking}
                onClick={() => runAction(async () => {
                  const generated = await autoGenerateProcurementRequests();
                  return `Created ${generated.length} procurement request(s).`;
                })}
              >
                Auto Procurement
              </button>
            </>
          ) : null}
        </div>
      </div>

      {notice ? <p className={styles.notice}>{notice}</p> : null}
      {error ? <p className={styles.error}>{error}</p> : null}

      {isAdmin ? (
        <AdminDashboard
          rows={rows}
          lowStock={lowStock}
          requests={requests}
          orders={orders}
          openRequests={openRequests}
          riskyProducts={riskyProducts}
          selectedProductId={selectedProductId}
          stockDraft={stockDraft}
          productDraft={productDraft}
          externalRequestId={externalRequestId}
          isWorking={isWorking}
          onSelectProduct={selectProductForEditing}
          onStockDraftChange={setStockDraft}
          onProductDraftChange={setProductDraft}
          onSubmitProduct={submitProduct}
          onStartNewProduct={startNewProduct}
          onSubmitStockUpdate={submitStockUpdate}
          onExternalRequestIdChange={setExternalRequestId}
          onChangeStatus={changeStatus}
          onChangeOrderStatus={changeOrderStatus}
        />
      ) : (
        <SupplierPortal
          requests={requests}
          externalRequestId={externalRequestId}
          isWorking={isWorking}
          onExternalRequestIdChange={setExternalRequestId}
          onChangeStatus={changeStatus}
        />
      )}
    </main>
  );
}

function AdminDashboard({
  rows,
  lowStock,
  requests,
  orders,
  openRequests,
  riskyProducts,
  selectedProductId,
  stockDraft,
  productDraft,
  externalRequestId,
  isWorking,
  onSelectProduct,
  onStockDraftChange,
  onProductDraftChange,
  onSubmitProduct,
  onStartNewProduct,
  onSubmitStockUpdate,
  onExternalRequestIdChange,
  onChangeStatus,
  onChangeOrderStatus,
}: {
  rows: ProductInventoryRow[];
  lowStock: LowStockRecord[];
  requests: ProcurementRequest[];
  orders: Order[];
  openRequests: ProcurementRequest[];
  riskyProducts: ProductInventoryRow[];
  selectedProductId: string;
  stockDraft: StockDraft;
  productDraft: ProductDraft;
  externalRequestId: string;
  isWorking: boolean;
  onSelectProduct: (value: string) => void;
  onStockDraftChange: (draft: StockDraft) => void;
  onProductDraftChange: (draft: ProductDraft) => void;
  onSubmitProduct: () => void;
  onStartNewProduct: () => void;
  onSubmitStockUpdate: () => void;
  onExternalRequestIdChange: (value: string) => void;
  onChangeStatus: (requestId: number, status: ProcurementStatus) => void;
  onChangeOrderStatus: (orderId: number, status: OrderStatus) => void;
}) {
  const selectedRow = rows.find((row) => String(row.product.id) === selectedProductId);

  return (
    <>
      <section className={styles.grid} aria-label="Inventory summary">
        <Metric label="Catalog items" value={rows.length} />
        <Metric label="Low stock" value={lowStock.length} />
        <Metric label="Risk alerts" value={riskyProducts.length} />
        <Metric label="Open procurement" value={openRequests.length} />
      </section>

      <ProductManagement
        rows={rows}
        selectedProductId={selectedProductId}
        productDraft={productDraft}
        isWorking={isWorking}
        onSelectProduct={onSelectProduct}
        onProductDraftChange={onProductDraftChange}
        onSubmitProduct={onSubmitProduct}
        onStartNewProduct={onStartNewProduct}
      />

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Product Inventory</h2>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Book</th>
                <th>Inventory</th>
                <th>Thresholds</th>
                <th>Forecast</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const risk = latestRisk(row.forecasts);
                const available = row.inventory
                  ? row.inventory.quantityOnHand - row.inventory.reservedQuantity
                  : null;
                return (
                  <tr key={row.product.id}>
                    <td>
                      <strong>{row.product.title}</strong>
                      <p className={styles.finePrint}>{row.product.sku} / {row.product.bookType}</p>
                    </td>
                    <td>
                      {row.inventory ? (
                        <>
                          <strong>{available}</strong>
                          <p className={styles.finePrint}>
                            {row.inventory.quantityOnHand} on hand, {row.inventory.reservedQuantity} reserved
                          </p>
                        </>
                      ) : (
                        <span className={styles.muted}>No inventory record</span>
                      )}
                    </td>
                    <td>
                      {row.inventory ? (
                        <>
                          Reorder at {row.inventory.reorderThreshold}
                          <p className={styles.finePrint}>
                            Safety {row.inventory.safetyStock}, lead {row.inventory.supplierLeadTimeDays} days
                          </p>
                        </>
                      ) : (
                        <span className={styles.muted}>Not configured</span>
                      )}
                    </td>
                    <td>
                      {risk ? (
                        <>
                          <span className={riskClass(risk.stockoutRisk)}>{risk.stockoutRisk}</span>
                          <p className={styles.finePrint}>
                            {risk.targetDate}: stock {risk.predictedStock}, demand {risk.predictedDemand}
                          </p>
                        </>
                      ) : (
                        <span className={styles.muted}>No forecast yet</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Stock Settings</h2>
        </div>
        <div className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="product">Book</label>
            <select
              id="product"
              value={selectedProductId}
              onChange={(event) => onSelectProduct(event.target.value)}
            >
              {rows.map((row) => (
                <option key={row.product.id} value={row.product.id}>
                  {row.product.title}
                </option>
              ))}
            </select>
          </div>
          <NumberField
            label="On hand"
            value={stockDraft.quantityOnHand ?? ""}
            onChange={(value) => onStockDraftChange({ ...stockDraft, quantityOnHand: value })}
          />
          <NumberField
            label="Reorder threshold"
            value={stockDraft.reorderThreshold ?? ""}
            onChange={(value) => onStockDraftChange({ ...stockDraft, reorderThreshold: value })}
          />
          <NumberField
            label="Safety stock"
            value={stockDraft.safetyStock ?? ""}
            onChange={(value) => onStockDraftChange({ ...stockDraft, safetyStock: value })}
          />
          <NumberField
            label="Lead time days"
            value={stockDraft.supplierLeadTimeDays ?? ""}
            onChange={(value) => onStockDraftChange({ ...stockDraft, supplierLeadTimeDays: value })}
          />
          <div className={styles.formActions}>
            <button
              className={styles.button}
              onClick={onSubmitStockUpdate}
              disabled={isWorking || !selectedRow}
            >
              Save Stock
            </button>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Low Stock Alerts</h2>
        </div>
        {lowStock.length > 0 ? (
          <div className={styles.cardGrid}>
            {lowStock.map((record) => (
              <article className={styles.requestCard} key={record.productId}>
                <div className={styles.cardTop}>
                  <h3 className={styles.cardTitle}>{record.title}</h3>
                  <span className={`${styles.pill} ${styles.riskHigh}`}>LOW</span>
                </div>
                <p className={styles.finePrint}>{record.sku}</p>
                <p>
                  Available {record.availableQuantity}; reorder threshold {record.reorderThreshold}.
                </p>
                <p className={styles.finePrint}>
                  Suggested replenishment: {record.suggestedQuantity} units, lead time {record.supplierLeadTimeDays} days.
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>No low-stock books right now.</div>
        )}
      </section>

      <ProcurementSection
        title="Procurement Queue"
        requests={requests}
        externalRequestId={externalRequestId}
        isAdmin
        isWorking={isWorking}
        onExternalRequestIdChange={onExternalRequestIdChange}
        onChangeStatus={onChangeStatus}
      />

      <OrderManagement
        orders={orders}
        isWorking={isWorking}
        onChangeOrderStatus={onChangeOrderStatus}
      />
    </>
  );
}

function ProductManagement({
  rows,
  selectedProductId,
  productDraft,
  isWorking,
  onSelectProduct,
  onProductDraftChange,
  onSubmitProduct,
  onStartNewProduct,
}: {
  rows: ProductInventoryRow[];
  selectedProductId: string;
  productDraft: ProductDraft;
  isWorking: boolean;
  onSelectProduct: (value: string) => void;
  onProductDraftChange: (draft: ProductDraft) => void;
  onSubmitProduct: () => void;
  onStartNewProduct: () => void;
}) {
  const canSubmit = Boolean(productDraft.sku && productDraft.title && productDraft.authorName);

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Product Management</h2>
        <button className={styles.secondaryButton} type="button" onClick={onStartNewProduct} disabled={isWorking}>
          New Product
        </button>
      </div>
      <div className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="managedProduct">Edit product</label>
          <select
            id="managedProduct"
            value={selectedProductId}
            onChange={(event) => onSelectProduct(event.target.value)}
          >
            <option value="">Create a new product</option>
            {rows.map((row) => (
              <option key={row.product.id} value={row.product.id}>
                {row.product.title} ({row.product.status})
              </option>
            ))}
          </select>
        </div>
        <TextField
          label="SKU"
          value={productDraft.sku ?? ""}
          onChange={(value) => onProductDraftChange({ ...productDraft, sku: value })}
        />
        <TextField
          label="ISBN"
          value={productDraft.isbn13 ?? ""}
          onChange={(value) => onProductDraftChange({ ...productDraft, isbn13: value })}
        />
        <TextField
          label="Title"
          value={productDraft.title ?? ""}
          onChange={(value) => onProductDraftChange({ ...productDraft, title: value })}
        />
        <TextField
          label="Author"
          value={productDraft.authorName ?? ""}
          onChange={(value) => onProductDraftChange({ ...productDraft, authorName: value })}
        />
        <TextField
          label="Publisher"
          value={productDraft.publisher ?? ""}
          onChange={(value) => onProductDraftChange({ ...productDraft, publisher: value })}
        />
        <TextField
          label="Category"
          value={productDraft.category ?? ""}
          onChange={(value) => onProductDraftChange({ ...productDraft, category: value })}
        />
        <NumberField
          label="Price"
          value={productDraft.price ?? ""}
          onChange={(value) => onProductDraftChange({ ...productDraft, price: value })}
        />
        <div className={styles.field}>
          <label htmlFor="bookType">Book type</label>
          <select
            id="bookType"
            value={productDraft.bookType}
            onChange={(event) => onProductDraftChange({ ...productDraft, bookType: event.target.value })}
          >
            <option value="PHYSICAL">PHYSICAL</option>
            <option value="EBOOK">EBOOK</option>
            <option value="BUNDLE">BUNDLE</option>
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="productStatus">Status</label>
          <select
            id="productStatus"
            value={productDraft.status}
            onChange={(event) => onProductDraftChange({ ...productDraft, status: event.target.value })}
          >
            <option value="DRAFT">DRAFT</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
            <option value="DISCONTINUED">DISCONTINUED</option>
          </select>
        </div>
        <TextField
          label="Cover URL"
          value={productDraft.coverImageUrl ?? ""}
          onChange={(value) => onProductDraftChange({ ...productDraft, coverImageUrl: value })}
        />
        <div className={styles.fieldWide}>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={productDraft.description ?? ""}
            onChange={(event) => onProductDraftChange({ ...productDraft, description: event.target.value })}
          />
        </div>
        <div className={styles.formActions}>
          <button className={styles.button} type="button" disabled={isWorking || !canSubmit} onClick={onSubmitProduct}>
            {selectedProductId ? "Save Product" : "Create Product"}
          </button>
        </div>
      </div>
    </section>
  );
}

function SupplierPortal({
  requests,
  externalRequestId,
  isWorking,
  onExternalRequestIdChange,
  onChangeStatus,
}: {
  requests: ProcurementRequest[];
  externalRequestId: string;
  isWorking: boolean;
  onExternalRequestIdChange: (value: string) => void;
  onChangeStatus: (requestId: number, status: ProcurementStatus) => void;
}) {
  const active = requests.filter((request) => request.status !== "FULFILLED" && request.status !== "CANCELLED");
  return (
    <>
      <section className={styles.grid} aria-label="Supplier summary">
        <Metric label="Assigned requests" value={requests.length} />
        <Metric label="Active requests" value={active.length} />
        <Metric
          label="Units requested"
          value={requests.reduce((sum, request) => sum + request.requestedQuantity, 0)}
        />
      </section>
      <ProcurementSection
        title="Assigned Purchase Orders"
        requests={requests}
        externalRequestId={externalRequestId}
        isAdmin={false}
        isWorking={isWorking}
        onExternalRequestIdChange={onExternalRequestIdChange}
        onChangeStatus={onChangeStatus}
      />
    </>
  );
}

function ProcurementSection({
  title,
  requests,
  externalRequestId,
  isAdmin,
  isWorking,
  onExternalRequestIdChange,
  onChangeStatus,
}: {
  title: string;
  requests: ProcurementRequest[];
  externalRequestId: string;
  isAdmin: boolean;
  isWorking: boolean;
  onExternalRequestIdChange: (value: string) => void;
  onChangeStatus: (requestId: number, status: ProcurementStatus) => void;
}) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <div className={styles.field}>
          <label htmlFor="externalRequestId">Shipment / external ref</label>
          <input
            id="externalRequestId"
            value={externalRequestId}
            onChange={(event) => onExternalRequestIdChange(event.target.value)}
            placeholder="PO-1001"
          />
        </div>
      </div>
      {requests.length > 0 ? (
        <div className={styles.cardGrid}>
          {requests.map((request) => (
            <article className={styles.requestCard} key={request.id}>
              <div className={styles.cardTop}>
                <div>
                  <h3 className={styles.cardTitle}>{request.requestNumber}</h3>
                  <p className={styles.finePrint}>{request.productTitle}</p>
                </div>
                <span className={statusClass(request.status)}>{request.status}</span>
              </div>
              <p>
                {request.requestedQuantity} units requested from {request.supplierCompanyName ?? "supplier"}.
              </p>
              <p className={styles.finePrint}>{request.triggerReason}</p>
              {request.externalRequestId ? (
                <p className={styles.finePrint}>Reference: {request.externalRequestId}</p>
              ) : null}
              <div className={styles.cardActions}>
                {isAdmin ? (
                  <>
                    <button
                      className={styles.secondaryButton}
                      disabled={isWorking || !canApproveRequest(request.status)}
                      onClick={() => onChangeStatus(request.id, "APPROVED")}
                    >
                      Approve
                    </button>
                    <button
                      className={styles.secondaryButton}
                      disabled={isWorking || !canSendRequest(request.status)}
                      onClick={() => onChangeStatus(request.id, "SENT")}
                    >
                      Send
                    </button>
                    <button
                      className={styles.button}
                      disabled={isWorking || !canConfirmReceipt(request.status)}
                      onClick={() => onChangeStatus(request.id, "FULFILLED")}
                    >
                      Confirm Receipt
                    </button>
                    <button
                      className={styles.dangerButton}
                      disabled={isWorking || !canCancelRequest(request.status)}
                      onClick={() => onChangeStatus(request.id, "CANCELLED")}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className={styles.secondaryButton}
                      disabled={isWorking || !canAcknowledgeRequest(request.status)}
                      onClick={() => onChangeStatus(request.id, "ACKNOWLEDGED")}
                    >
                      Acknowledge
                    </button>
                    <button
                      className={styles.button}
                      disabled={isWorking || !canMarkRequestShipped(request.status)}
                      onClick={() => onChangeStatus(request.id, "SENT")}
                    >
                      Mark Shipped
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>No procurement requests to show.</div>
      )}
    </section>
  );
}

function OrderManagement({
  orders,
  isWorking,
  onChangeOrderStatus,
}: {
  orders: Order[];
  isWorking: boolean;
  onChangeOrderStatus: (orderId: number, status: OrderStatus) => void;
}) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Order Management</h2>
      </div>
      {orders.length > 0 ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order</th>
                <th>Payment</th>
                <th>Items</th>
                <th>Total</th>
                <th>Lifecycle</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <strong>{order.orderNumber}</strong>
                    <p className={styles.finePrint}>Customer #{order.customerId}</p>
                  </td>
                  <td>
                    <span className={statusClass(order.status === "CANCELLED" ? "CANCELLED" : "SENT")}>
                      {order.status}
                    </span>
                    <p className={styles.finePrint}>Payment {order.paymentStatus}</p>
                  </td>
                  <td>
                    {order.items.map((item) => (
                      <p className={styles.finePrint} key={`${order.id}-${item.productId}`}>
                        {item.productTitle} x {item.quantity}
                      </p>
                    ))}
                  </td>
                  <td>${Number(order.totalAmount).toFixed(2)}</td>
                  <td>
                    <div className={styles.cardActions}>
                      <button
                        className={styles.secondaryButton}
                        disabled={isWorking || !canMoveOrderTo(order.status, "FULFILLING")}
                        onClick={() => onChangeOrderStatus(order.id, "FULFILLING")}
                      >
                        Fulfill
                      </button>
                      <button
                        className={styles.secondaryButton}
                        disabled={isWorking || !canMoveOrderTo(order.status, "SHIPPED")}
                        onClick={() => onChangeOrderStatus(order.id, "SHIPPED")}
                      >
                        Ship
                      </button>
                      <button
                        className={styles.button}
                        disabled={isWorking || !canMoveOrderTo(order.status, "COMPLETED")}
                        onClick={() => onChangeOrderStatus(order.id, "COMPLETED")}
                      >
                        Deliver
                      </button>
                      <button
                        className={styles.dangerButton}
                        disabled={isWorking || !canMoveOrderTo(order.status, "CANCELLED")}
                        onClick={() => onChangeOrderStatus(order.id, "CANCELLED")}
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.empty}>No customer orders yet.</div>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.metric}>
      <p className={styles.metricLabel}>{label}</p>
      <p className={styles.metricValue}>{value}</p>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = label.toLowerCase().replaceAll(" ", "-");
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = label.toLowerCase().replaceAll(" ", "-");
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        min="0"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

export default OperationsPage;
