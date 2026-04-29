

"use client";


import { useEffect, useState } from "react";

import { Book } from "@/types/book";

import { fetchAuthorDisplayNames } from "@/services/api/book";


function useBookAuthors(book: Book) {

  const [loading, setLoading] = useState(true);
  const [authors, setAuthors] = useState("Unknown Author");

  useEffect(() => {
    if (!book?.metadata) return;
    async function load() {
      setLoading(true);
      try {
        const data = await fetchAuthorDisplayNames(
          book.metadata.id, book.metadata.authorIds
        );
        const str = data.length > 0 ? data.join(", ") : "Unknown Author";
        setAuthors(str);
      } catch (e) {
        console.error("Failed to load contributors", e);
      } finally { setLoading(false); }
    }
    load();
  }, [book]);
  
  return { authors, loading };
}


export { useBookAuthors };
