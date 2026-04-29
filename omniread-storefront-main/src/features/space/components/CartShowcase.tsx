/* Copyright (c) 2026, Yao Zeran
 *
 * The cart component that lists books waiting for checkout. */


import Link from "next/link";
import Image from "next/image";

import type { CartItem } from "@/types/cart";


function CartItemShowcase({ item }: Readonly<{ item: CartItem }>) {
	return (
		<article key={item.id} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-3">
			<div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl">
				<Image
					src="/sample/cover/dune-cover.jpg"
					alt={item.title}
					fill
					sizes="64px"
					className="object-cover"
				/>
			</div>

			<div className="min-w-0 flex-1">
				<h3 className="truncate font-semibold text-slate-900">{item.title}</h3>
				<p className="mt-1 text-sm text-slate-600">Qty {item.quantity}</p>
				<p className="mt-2 text-sm font-medium text-slate-800">${Number(item.lineTotal).toFixed(2)}</p>
			</div>
		</article>
	)
}

function CartShowcase({ items }: Readonly<{ items: CartItem[] | undefined }>) {
	if (!items || items.length === 0) return <p className="text-sm text-slate-500">No saved cart items.</p>;

	const total = items.reduce((sum, item) => sum + Number(item.lineTotal), 0);
	const href = "/cart";

	return (
		<div className="space-y-4">
			{items.map((item) => (<CartItemShowcase key={item.id} item={item} />))}

			<div className="rounded-2xl bg-slate-900 px-4 py-4 text-white">
				<div className="flex items-center justify-between gap-4 text-sm text-slate-200">
					<span>Estimated total</span>
					<span className="text-base font-semibold text-white">${total.toFixed(2)}</span>
				</div>
				<Link href={href} className="mt-4 block w-full rounded-full bg-white px-4 py-3 text-center text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100">
					Checkout
				</Link>
			</div>
		</div>
	);
};


export default CartShowcase;
