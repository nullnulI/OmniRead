/* Copyright (c) 2026, Yao Zeran
 *
 * The cart page with two-column layout:
 *   left: books in cart
 *   right: checkout summary */

"use client";

import { useEffect, useState } from "react";

import type { CartItem } from "@/types/cart";

import CartSection from "@/features/cart/components/CartSection";
import CheckoutSection from "@/features/cart/components/CheckoutSection";
import { useAuthContext } from "@/features/auth/context/AuthProvider";
import { checkoutCart, fetchCartItems, removeCartItem, updateCartItem } from "@/services/api/cart";


function CartPage() {

	const auth = useAuthContext();
	const isCustomer = auth.user?.metadata.role === "CUSTOMER";

	const [items, setItems] = useState<CartItem[]>();
	const [loading, setLoading] = useState<boolean>(false);
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!auth?.isAuthenticated || !isCustomer) return;

		async function loadItemsInCart() {
			try {
				setError(null);
				const data = await fetchCartItems();
				setItems(data);
			} catch (err) {
				console.error("Failed to load items in cart.", err);
				setError(err instanceof Error ? err.message : "Failed to load cart");
				setItems([]);
			} finally {
				setLoading(false);
			}
		}
		setLoading(true);
		loadItemsInCart();
	}, [auth?.isAuthenticated, isCustomer])

	async function handleChangeQuantity(itemId: number, quantity: number) {
		try {
			setError(null);
			const cart = await updateCartItem(itemId, quantity);
			setItems(cart.items);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to update cart");
		}
	}

	async function handleRemove(itemId: number) {
		try {
			setError(null);
			const cart = await removeCartItem(itemId);
			setItems(cart.items);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to remove cart item");
		}
	}

	async function handleCheckout(shippingAddress: string) {
		setError(null);
		if (!shippingAddress.trim()) {
			setError("Shipping address is required for checkout.");
			return;
		}
		const order = await checkoutCart(shippingAddress);
		setItems([]);
		setMessage(`Order ${order.orderNumber} created successfully. Simulated payment is ${order.paymentStatus}.`);
	}

	if (!auth.isLoading && !auth.isAuthenticated) {
		return <main className="w-full px-4 py-6 md:px-6 md:py-8">Please login to view your cart.</main>;
	}

	if (!auth.isLoading && auth.isAuthenticated && !isCustomer) {
		return <main className="w-full px-4 py-6 md:px-6 md:py-8">Cart is only available for customer accounts.</main>;
	}

	if (!items || loading) return <main className="w-full px-4 py-6 md:px-6 md:py-8">Loading cart...</main>;

	return (
		<main className="w-full px-4 py-6 md:px-6 md:py-8">
			{message ? <p className="mb-4 rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}
			{error ? <p className="mb-4 rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
			<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
				<CartSection items={items} onChangeQuantity={handleChangeQuantity} onRemove={handleRemove} />
				<CheckoutSection items={items} onCheckout={handleCheckout} />
			</div>
		</main>
	);
};


export default CartPage;
