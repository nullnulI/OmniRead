/* Copyright (c) 2026, Yao Zeran
 *
 * The listed book component used in book sales page. */


"use client";


import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import styles from "./ListedBook.module.css";

import type { Book } from "@/types/book";
import { addBookToCart } from "@/services/api/cart";
import { fetchAuthorDisplayNames, fetchBook, fetchPublisherDisplayName } from "@/services/api/book";
import { useAuthContext } from "@/features/auth/context/AuthProvider";


function ListedBook({ bookId }: Readonly<{ bookId: string }>) {
  const auth = useAuthContext();
  const [book, setBook] = useState<Book | null>(null);
  const [authorLine, setAuthorLine] = useState("Unknown Author");
  const [publisher, setPublisher] = useState("Unknown Publisher");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadBook() {
      try {
        const nextBook = await fetchBook(bookId);
        if (cancelled) return;
        setBook(nextBook);

        const authors = await fetchAuthorDisplayNames(bookId, nextBook.metadata.authorIds);
        const nextAuthorLine = authors.length > 0 ? authors.join(", ") : "Unknown Author";
        const nextPublisher = nextBook.metadata.publisherId
          ? await fetchPublisherDisplayName(bookId, nextBook.metadata.publisherId)
          : "Not published";

        if (!cancelled) {
          setAuthorLine(nextAuthorLine);
          setPublisher(nextPublisher);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load book");
        }
      }
    }

    loadBook();
    return () => {
      cancelled = true;
    };
  }, [bookId]);

  async function handleAddToCart() {
    setMessage(null);
    setError(null);
    if (!auth.isAuthenticated || !auth.user) {
      setError("Please login before adding books to your cart.");
      return;
    }
    if (auth.user.metadata.role !== "CUSTOMER") {
      setError("Only customer accounts can add books to the cart.");
      return;
    }

    try {
      await addBookToCart(auth.user.metadata.id, bookId, 1);
      setMessage("Added to cart.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add to cart");
    }
  }

  if (error && !book) {
    return <section className={styles.section}>{error}</section>;
  }

  if (!book) {
    return <section className={styles.section}>Loading book...</section>;
  }

  const metadata = book.metadata;
  const saleinfo = book.saleinfo;
  const publishDate = metadata.publishedDate ?? "Unknown";
  const description =
    metadata.description ??
    "A highly rated title with strong storytelling and immersive world building.";

  const paperPrice = saleinfo.paperPrice ?? 0;
  const digitalPrice = saleinfo.digitalPrice ?? paperPrice;
  const paperInventory = saleinfo.paperInventory ?? 1;
  const isSoldOut = paperInventory <= 0;
  const readerHref = `/reader/epub/sample/epub-sample`;

  return (
    <section className={styles.section}>
      <div className={styles.coverPanel}>
        <div className={styles.coverFrame}>
          <Image
            src={metadata.coverImage ?? "https://via.placeholder.com/150"}
            alt={metadata.title}
            fill
            className={styles.coverImage}
            sizes="(max-width: 1024px) 70vw, 260px"
          />
        </div>
      </div>

      <div className={styles.details}>
        <div>
          <p className={styles.kicker}>Book Detail</p>
          <h1 className={styles.title}>{metadata.title}</h1>
          <p className={styles.authorLine}>by {authorLine}</p>
        </div>

        <p className={styles.description}>{description}</p>

        <div className={styles.metaGrid}>
          <p>
            <span className={styles.metaLabel}>Author:</span> {authorLine}
          </p>
          <p>
            <span className={styles.metaLabel}>Publisher:</span> {publisher}
          </p>
          <p>
            <span className={styles.metaLabel}>Publish Date:</span> {publishDate}
          </p>
          <p>
            <span className={styles.metaLabel}>ISBN:</span> {metadata.id}
          </p>
        </div>

        {message ? <p className={styles.description}>{message}</p> : null}
        {error ? <p className={styles.description}>{error}</p> : null}
      </div>

      <aside className={styles.aside}>
        <h2 className={styles.asideTitle}>Purchase Options</h2>

        <div className={styles.optionCardPrimary}>
          <p className={styles.optionKickerPrimary}>Digital Edition</p>
          <p className={styles.price}>${digitalPrice.toFixed(2)}</p>
          <p className={styles.optionDescription}>Instant sample reader for the MVP demo.</p>
          <div className={styles.buttonGrid}>
            <button type="button" className={styles.secondaryButton} onClick={handleAddToCart}>
              Add to Cart
            </button>
            <Link href={readerHref} className={styles.primaryButton}>
              Read EPUB
            </Link>
          </div>
        </div>

        <div className={styles.optionCardSecondary}>
          <p className={styles.optionKickerSecondary}>Paper Edition</p>
          <p className={styles.price}>${paperPrice.toFixed(2)}</p>
          <p className={styles.optionDescription}>
            Stock: <span className={styles.stockLabel}>{isSoldOut ? "Sold Out" : "In Stock"}</span>
          </p>
          <div className={styles.buttonGrid}>
            <button type="button" disabled={isSoldOut} className={styles.secondaryButton} onClick={handleAddToCart}>
              Add to Cart
            </button>
            <button type="button" disabled={isSoldOut} className={styles.primaryButton} onClick={handleAddToCart}>
              Buy Now
            </button>
          </div>
        </div>
      </aside>
    </section>
  );
}


export default ListedBook;
