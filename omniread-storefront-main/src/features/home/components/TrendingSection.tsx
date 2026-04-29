/* Copyright (c) 2026, Yao Zeran
 * 
 * The trending book section of the home page */


import styles from "./TrendingSection.module.css";

import { fetchTrendingBooksMetadata } from "@/services";

import BookShowcase from "./BookShowcase";


async function TrendingSection() {

  const books = await fetchTrendingBooksMetadata();

  return (
    <section className={styles.section}>
      <div className={styles.headerRow}>
        <div>
          <p className={styles.kicker}>
            Trending now
          </p>
          <h2 className={styles.heading}>
            Trending Books
          </h2>
        </div>
      </div>

      <div className={styles.scrollRow}>
        {books.map((book) => (<BookShowcase key={book.id} book={book} />))}
      </div>
    </section>
  );
};


export default TrendingSection;
