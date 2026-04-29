

"use client";


import { useEffect, useState } from "react";

import { Book } from "@/types/book";

import { fetchPublisherDisplayName } from "@/services/api/book";


function useBookPublishInfo(book: Book) {

  const unknown = "Unknown Publisher";
  const date = book.metadata.publishedDate ?? " Unkown Published Date";

  const [loading, setLoading] = useState(true);
  const [publisher, setPublisher] = useState(unknown);

  useEffect(() => {
    if (!book.metadata.publisherId) {
      setLoading(false); return;
    };
    async function load() {
      setLoading(true);
      try {
        const data = book.metadata.publisherId ? 
          await fetchPublisherDisplayName(book.metadata.id, book.metadata.publisherId) : unknown;
        setPublisher(data);
      } catch (e) {
        console.error("Failed to load contributors", e);
      } finally { setLoading(false); }
    }
    load();
  }, [book]);
  
  return { publisher, date, loading };
}


export { useBookPublishInfo };
