/* Copyright (c) 2026, Yao Zeran
 * 
 * The recommendation section component of the home page */


"use client";


import { useEffect, useState } from "react";
import styles from "./RecommendationSection.module.css";

import { useAuthContext } from "@/features/auth/context/AuthProvider";

import type { Book } from "@/types/book";

import { fetchBooksRecommended } from "@/services";

import BookCard from "@/features/home/components/BookCard";


function RecommendedSection() {

  const auth = useAuthContext();

  const [loading, setLoading] = useState<boolean>(false);
  const [books, setBooks] = useState<Record<string, Book>>({});
  
  useEffect(() => {
    if (!auth.user) {
      setLoading(false);
      return;
    }
    const userId = auth.user.metadata.id;

    async function loadRecommendedBooks() {
      try {
        const data = await fetchBooksRecommended(userId);
        setBooks(data);
      } catch (err) {
        console.error("Failed to load recommended books", err);
        setBooks({});
      } finally {
        setLoading(false);
      }
    }
    setLoading(true);
    loadRecommendedBooks();

  }, [auth.user]);

  if (!auth.user) {
    return (
      <section className={styles.section}>
        <h2>Login to see recommendation</h2>
      </section>
    );
  }

  if (loading) {
    return (
      <section className={styles.section}>
        <h2 className={styles.heading}>Recommended</h2>
        <p>Loading recommendations...</p>
      </section>
    );
  }

  if (Object.keys(books).length === 0) { 
    return (
      <section className={styles.section}>
        <h2>No recommendations yet, add books to cart or start reading. </h2>
      </section>
    )
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Recommended</h2>
      <div className={styles.scrollRow}>
        <BookCard book={Object.values(books)[0]} />
      </div>
    </section>
  );
};


export default RecommendedSection;
