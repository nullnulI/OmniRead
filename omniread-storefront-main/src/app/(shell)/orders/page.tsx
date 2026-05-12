"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuthContext } from "@/features/auth/context/AuthProvider";
import { fetchMyOrders } from "@/services/api/order";
import type { Order } from "@/types/order";

const ORDER_STEPS = [
	{ key: "PAID", label: "Placed" },
	{ key: "FULFILLING", label: "Packing" },
	{ key: "SHIPPED", label: "Shipped" },
	{ key: "COMPLETED", label: "Delivered" },
];

function orderProgress(status: string) {
	if (status === "COMPLETED") return 4;
	if (status === "SHIPPED") return 3;
	if (status === "FULFILLING") return 2;
	if (status === "PAID" || status === "PENDING") return 1;
	return 0;
}

function paymentLabel(status: Order["paymentStatus"]) {
	if (status === "PAID") return "Payment simulated and confirmed for this MVP.";
	if (status === "UNPAID") return "Legacy demo order before simulated payment confirmation.";
	return `Payment status: ${status}`;
}

function statusLabel(status: Order["status"]) {
	if (status === "PENDING") return "Placed";
	if (status === "PAID") return "Placed";
	if (status === "FULFILLING") return "Packing";
	if (status === "SHIPPED") return "Shipped";
	if (status === "COMPLETED") return "Delivered";
	return "Cancelled";
}


function OrdersPage() {
	const auth = useAuthContext();
	const isCustomer = auth.user?.metadata.role === "CUSTOMER";
	const [orders, setOrders] = useState<Order[]>();
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!auth.isAuthenticated || !isCustomer) return;

		async function loadOrders() {
			setError(null);
			try {
				const data = await fetchMyOrders();
				setOrders(data);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to load orders");
			}
		}

		loadOrders();
	}, [auth.isAuthenticated, isCustomer]);

	if (!auth.isLoading && !auth.isAuthenticated) {
		return (
			<main className="w-full px-4 py-6 md:px-6 md:py-8">
				<p className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-700">
					Please login to view your orders.
				</p>
			</main>
		);
	}

	if (!auth.isLoading && auth.isAuthenticated && !isCustomer) {
		return (
			<main className="w-full px-4 py-6 md:px-6 md:py-8">
				<p className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-700">
					Customer orders are only available for customer accounts.
				</p>
			</main>
		);
	}

	if (!orders && !error) {
		return <main className="w-full px-4 py-6 md:px-6 md:py-8">Loading orders...</main>;
	}

	return (
		<main className="w-full px-4 py-6 md:px-6 md:py-8">
			<div className="mb-6 flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="text-xs font-semibold uppercase text-slate-500">Orders</p>
					<h1 className="mt-1 text-2xl font-semibold text-slate-900">My Orders</h1>
				</div>
				<Link href="/" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white">
					Continue Shopping
				</Link>
			</div>

			{error ? (
				<p className="rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
			) : null}

			{orders?.length === 0 ? (
				<p className="rounded-md border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">
					No orders yet.
				</p>
			) : null}

			<div className="space-y-4">
				{orders?.map((order) => (
					<article key={order.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
						<div className="flex flex-wrap items-start justify-between gap-3">
							<div>
								<h2 className="text-base font-semibold text-slate-900">Order {order.orderNumber}</h2>
								<p className="mt-1 text-sm text-slate-500">
									{statusLabel(order.status)} / {order.paymentStatus}
								</p>
								<p className="mt-1 text-xs text-slate-500">{paymentLabel(order.paymentStatus)}</p>
							</div>
							<p className="text-lg font-semibold text-slate-900">
								${Number(order.totalAmount).toFixed(2)}
							</p>
						</div>

						{order.status === "CANCELLED" ? (
							<p className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
								This order has been cancelled.
							</p>
						) : (
							<div className="mt-4 grid gap-2 sm:grid-cols-4">
								{ORDER_STEPS.map((step, index) => {
									const isDone = orderProgress(order.status) >= index + 1;
									return (
										<div
											key={`${order.id}-${step.key}`}
											className={`rounded-md border px-3 py-2 text-sm ${
												isDone
													? "border-emerald-200 bg-emerald-50 text-emerald-800"
													: "border-slate-200 bg-slate-50 text-slate-500"
											}`}
										>
											<span className="font-medium">{step.label}</span>
										</div>
									);
								})}
							</div>
						)}

						<div className="mt-4 divide-y divide-slate-100">
							{order.items.map((item) => (
								<div key={`${order.id}-${item.productId}`} className="flex justify-between gap-4 py-3 text-sm">
									<div>
										<p className="font-medium text-slate-900">{item.productTitle}</p>
										<p className="text-slate-500">Qty {item.quantity}</p>
									</div>
									<p className="font-medium text-slate-900">${Number(item.lineTotal).toFixed(2)}</p>
								</div>
							))}
						</div>
					</article>
				))}
			</div>
		</main>
	);
}


export default OrdersPage;
