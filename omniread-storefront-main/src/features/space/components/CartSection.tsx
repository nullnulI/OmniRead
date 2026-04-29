/* Copyright (c) 2026, Yao Zeran
 *
 * The cart section for books awaiting checkout. */


"use client";

import { useState, useEffect } from "react";

import { useAuthContext } from "@/features/auth/context/AuthProvider";

import type { CartItem } from "@/types/cart";

import CartShowcase from "@/features/space/components/CartShowcase";
import { fetchCartItems } from "@/services/api/cart";


function CartSection() {

	const auth = useAuthContext();

  const [items, setItems] = useState<CartItem[]>();

  useEffect(() => {
    if (!auth?.isAuthenticated) return;
		async function loadCartItems() {
			try {
				const data = await fetchCartItems();
				setItems(data);
			} catch {
				setItems([]);
			}
		}
		loadCartItems();
  }, [auth?.isAuthenticated])

	return (
		<section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm sm:p-7">
			<div className="mb-5 flex items-start justify-between gap-4">
				<div>
					<p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
						Cart
					</p>
					<h2 className="mt-1 text-2xl font-semibold text-slate-900">Saved for checkout</h2>
				</div>
				<span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
					{items?.length ?? 0} items
				</span>
			</div>

			<CartShowcase items={items} />
		</section>
	);
};

export default CartSection;
