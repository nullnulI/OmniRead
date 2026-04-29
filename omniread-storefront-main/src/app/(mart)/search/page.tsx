"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { fetchProducts } from "@/services/api/book";

interface SearchProduct {
  id: number;
  sku: string;
  isbn13?: string;
  title: string;
  authorName: string;
  publisher?: string;
  category?: string;
  bookType: string;
  price: number;
  status: string;
}

function matches(product: SearchProduct, query: string) {
  const haystack = [
    product.title,
    product.authorName,
    product.category,
    product.publisher,
    product.isbn13,
    product.sku,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function SearchContent() {
  const params = useSearchParams();
  const query = params.get("q")?.trim() ?? "";
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProducts() {
      setError("");
      setIsLoading(true);
      try {
        setProducts(await fetchProducts());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to search books");
      } finally {
        setIsLoading(false);
      }
    }
    loadProducts();
  }, []);

  const results = useMemo(
    () => query ? products.filter((product) => matches(product, query)) : products,
    [products, query],
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <p className="text-xs font-semibold uppercase text-slate-500">Search</p>
      <h1 className="mt-1 text-2xl font-semibold text-slate-900">
        {query ? `Results for "${query}"` : "All searchable books"}
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Matches title, author, category, publisher, ISBN, and SKU.
      </p>

      {error ? <p className="mt-4 rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      {isLoading ? <p className="mt-4 rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-600">Loading searchable books...</p> : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {results.map((product) => (
          <Link
            key={product.id}
            href={`/book/${product.id}`}
            className="rounded-lg border border-slate-200 bg-white p-4 text-slate-900 shadow-sm transition hover:border-slate-400"
          >
            <p className="text-xs font-semibold uppercase text-slate-500">{product.category ?? product.bookType}</p>
            <h2 className="mt-2 text-lg font-semibold">{product.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{product.authorName}</p>
            <p className="mt-3 text-sm text-slate-500">{product.sku} {product.isbn13 ? `/ ${product.isbn13}` : ""}</p>
            <p className="mt-3 font-semibold">${Number(product.price).toFixed(2)}</p>
          </Link>
        ))}
      </div>

      {!isLoading && results.length === 0 ? (
        <p className="mt-6 rounded-md border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">
          No books matched this search. Try a title, author, category, ISBN, or SKU.
        </p>
      ) : null}
    </main>
  );
}

export default SearchPage;

function SearchPage() {
  return (
    <Suspense fallback={<main className="mx-auto w-full max-w-6xl px-4 py-8">Loading search...</main>}>
      <SearchContent />
    </Suspense>
  );
}
