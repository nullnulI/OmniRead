/* Copyright (c) 2026, Yao Zeran
 *
 * The section that renders books in cart. */


import Image from "next/image";

import styles from "./CartSection.module.css";

import type { CartItem } from "@/types/cart";


interface CartSectionProps {
	readonly items: CartItem[];
	readonly onChangeQuantity: (itemId: number, quantity: number) => void;
	readonly onRemove: (itemId: number) => void;
}


function Cart({ items, onChangeQuantity, onRemove }: Readonly<CartSectionProps>) {
	if (items.length === 0) {
		return <p className={styles.description}>Your cart is empty.</p>;
	}

	return (
		<div className={styles.list}>
			{items.map((item) => (
				<article key={item.id} className={styles.card}>
					<div className={styles.coverFrame}>
						<Image
							src="/sample/cover/dune-cover.jpg"
							alt={item.title}
							fill
							sizes="80px"
							className={styles.coverImage}
						/>
					</div>

					<div className={styles.content}>
						<div className={styles.headerRow}>
							<div>
								<h3 className={styles.title}>{item.title}</h3>
								<p className={styles.author}>{item.authorName}</p>
								<p className={styles.typeBadge}>{item.sku}</p>
							</div>

							<p className={styles.price}>${Number(item.lineTotal).toFixed(2)}</p>
						</div>

						<div className={styles.footerRow}>
							<div className={styles.quantityControl}>
								<button
									className={styles.quantityButton}
									aria-label="Decrease quantity"
									type="button"
									disabled={item.quantity <= 1}
									onClick={() => onChangeQuantity(item.id, item.quantity - 1)}
								>
									-
								</button>
								<span className={styles.quantity}>{item.quantity}</span>
								<button
									className={styles.quantityButton}
									aria-label="Increase quantity"
									type="button"
									onClick={() => onChangeQuantity(item.id, item.quantity + 1)}
								>
									+
								</button>
							</div>

							<button className={styles.removeButton} type="button" onClick={() => onRemove(item.id)}>
								Remove
							</button>
						</div>
					</div>
				</article>
			))}
		</div>
	);
};


function CartSection(props: Readonly<CartSectionProps>) {
	return (
		<section className={styles.section}>

			<div>
				<p className={styles.kicker}>Cart</p>
				<h1 className={styles.title}>Books in your cart</h1>
				<p className={styles.description}>Review your items before checkout.</p>
			</div>

			<Cart {...props} />

		</section>
	);
};


export default CartSection;
