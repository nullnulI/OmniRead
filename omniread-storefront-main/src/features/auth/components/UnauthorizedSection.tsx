/* Copyright (c) 2026, Yao Zeran
 *
 * Unauthorized page component for pages requiring authentication. */


import Link from "next/link";

import styles from "./UnauthorizedSection.module.css";


function UnauthorizedSection() {

	const signinHref = "/login";
	const homeHref = "/";

	return (
		<section className={styles.card} aria-labelledby="unauthorized-title">
			<p className={styles.badge}>Unauthorized</p>
			<h1 id="unauthorized-title" className={styles.title}>You need to sign in</h1>
			<p className={styles.description}>
				This page is only available to authenticated users. Please sign in and try again.
			</p>
			<div className={styles.actions}>
				<Link href={signinHref} className={styles.primary}>Go to Sign In</Link>
				<Link href={homeHref} className={styles.secondary}>Return Home</Link>
			</div>
		</section>
	);
};


export default UnauthorizedSection;
