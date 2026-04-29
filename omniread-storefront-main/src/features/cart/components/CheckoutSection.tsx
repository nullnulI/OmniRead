/* Copyright (c) 2026, Yao Zeran
 *
 * The section that renders checkout summary. */


import { useState } from "react";

import styles from "./CheckoutSection.module.css";

import type { CartItem } from "@/types/cart";


interface CheckoutSectionProps {
	readonly items: CartItem[];
	readonly onCheckout: (shippingAddress: string) => Promise<void>;
}


function Checkout({ items, onCheckout }: Readonly<CheckoutSectionProps>) {
	const [shippingAddress, setShippingAddress] = useState("123 OmniRead Street");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	
	const subtotal = items.reduce((sum, item) => sum + Number(item.lineTotal), 0);
	const shipping = subtotal >= 40 || subtotal === 0 ? 0 : 4.99;
	const total = subtotal + shipping;

	async function handleCheckout() {
		if (!shippingAddress.trim()) {
			setError("Shipping address is required.");
			return;
		}
		setIsSubmitting(true);
		setError(null);
		try {
			await onCheckout(shippingAddress);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Checkout failed");
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<div className={styles.card}>
			<h2 className={styles.heading}>Checkout Summary</h2>

			<div className={styles.summaryList}>
				<div className={styles.summaryRow}>
					<span>Subtotal</span>
					<span>${subtotal.toFixed(2)}</span>
				</div>
				<div className={styles.summaryRow}>
					<span>Shipping</span>
					<span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
				</div>
			</div>

			<div className={styles.divider} />

			<div className={styles.totalRow}>
				<span className={styles.totalLabel}>Order Total</span>
				<span className={styles.totalValue}>${total.toFixed(2)}</span>
			</div>

			<div className={styles.paymentBox}>
				<p className={styles.paymentTitle}>Simulated payment gateway</p>
				<p className={styles.note}>
					Stripe/PayPal is represented by an MVP confirmation step. Successful checkout marks the order as PAID.
				</p>
			</div>

			<label className={styles.note} htmlFor="shipping-address">
				Shipping address
			</label>
			<input
				id="shipping-address"
				value={shippingAddress}
				onChange={(event) => setShippingAddress(event.target.value)}
				className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
			/>

			{error ? <p className={styles.errorText}>{error}</p> : null}

			<button
				className={styles.checkoutButton}
				type="button"
				disabled={items.length === 0 || isSubmitting}
				onClick={handleCheckout}
			>
				{isSubmitting ? "Checking out..." : "Proceed to Checkout"}
			</button>

			<p className={styles.note}>The backend creates the order, records simulated payment, and updates stock.</p>
		</div>
	);
};


function CheckoutSection(props: Readonly<CheckoutSectionProps>) {
	return (
		<section className={styles.section}>
			<Checkout {...props} />
		</section>
	);
};

export default CheckoutSection;
