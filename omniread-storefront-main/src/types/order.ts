export type OrderStatus = "PENDING" | "PAID" | "FULFILLING" | "SHIPPED" | "COMPLETED" | "CANCELLED";
export type PaymentStatus = "UNPAID" | "AUTHORIZED" | "PAID" | "REFUNDED" | "FAILED";

export interface OrderLine {
  productId: number;
  productTitle: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerId: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  items: OrderLine[];
}
