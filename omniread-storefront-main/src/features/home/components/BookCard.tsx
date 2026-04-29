/* Copyright (c) 2026, Yao Zeran
 * 
 * The book card component that recommend a book to the user, used in the 
 *   recommendation section of home page. */


"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

import styles from "./BookCard.module.css";

import { Book } from "@/types/book";
import { fetchAuthorDisplayNames, fetchPublisherDisplayName } from "@/services/api/book";


function BookCard({ book }: Readonly<{ book: Book; }>) {
  
  const href = `/book/${book.metadata.id}`;

  const [authorLine, setAuthorLine] = useState("Unknown Author");
  const [publisher, setPublisher] = useState("Unknown Publisher");

  useEffect(() => {
    async function loadData() {
      const authors = await fetchAuthorDisplayNames(book.metadata.id, book.metadata.authorIds);
      const nextAuthorLine = authors.length > 0 ? authors.join(", ") : "Unknown Author";

      const nextPublisher = book.metadata.publisherId
        ? await fetchPublisherDisplayName(book.metadata.id, book.metadata.publisherId)
        : "Unknown Publisher";

      setAuthorLine(nextAuthorLine);
      setPublisher(nextPublisher ?? "Unknown Publisher");
    }

    loadData();
    return;
  }, [book.metadata.authorIds, book.metadata.id, book.metadata.publisherId]);

  const publishDate = book.metadata.publishedDate ?? "Unknown";
  const isSoldOut = (book.saleinfo.paperInventory ?? 0) <= 0;

  return (
    <Link className={styles.cardLink} href={href}>
      <div className={styles.coverContainer}>
        <Image
          src={book.metadata.coverImage ?? "https://via.placeholder.com/150"}
          alt={book.metadata.title}
          fill
          sizes="150px"
          className={styles.coverImage}
        />
      </div>
      <div className={styles.content}>
        <div>

          <div className={styles.titleRow}>
            <h3 className={styles.title}>{book.metadata.title}</h3>
            <p className={styles.price}>
              Paper: ${book.saleinfo.paperPrice} / Digital: ${book.saleinfo.digitalPrice}
            </p>
          </div>

          <p className={styles.meta}>
            Author: {authorLine} | Publisher: {publisher} | Date: {publishDate}
          </p>

          <p className={styles.description}>{book.metadata.description ?? " no description available "}</p>

        </div>
        {isSoldOut && <p className={styles.soldOut}>Sold Out</p>}
      </div>
    </Link>
  );
};


export default BookCard;
