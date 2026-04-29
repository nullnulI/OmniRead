import type { Order, OrderStatus, PaymentStatus } from "@/types/order";

import { fetchJson } from "@/services/http";


export async function fetchMyOrders(): Promise<Order[]> {
  return fetchJson<Order[]>("/orders/me");
}

export async function fetchAdminOrders(): Promise<Order[]> {
  return fetchJson<Order[]>("/orders/admin");
}

export async function updateOrderStatus(
  orderId: number,
  status: OrderStatus,
  paymentStatus?: PaymentStatus,
): Promise<Order> {
  return fetchJson<Order>(`/orders/${orderId}/status`, {
    method: "PUT",
    body: JSON.stringify({ status, paymentStatus }),
  });
}
