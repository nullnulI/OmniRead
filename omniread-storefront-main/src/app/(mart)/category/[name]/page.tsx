/* Copyright (c) 2026, Yao Zeran
 *
 * The list of books classified based on category page. */


import { fetchBooksByCategoryName } from "@/services/api/book";
import BookShowcase from "@/features/home/components/BookShowcase";


async function CategoryPage({ params }: Readonly<{ params : { name : string } }>) {

  const books = await fetchBooksByCategoryName(params.name);

  return (
    <main className="w-full px-4 py-6 md:px-6 md:py-8">
      <h1 className="mb-6 text-3xl font-semibold text-slate-900">Category: {decodeURIComponent(params.name)}</h1>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {books.map((book) => <BookShowcase key={book.id} book={book} />)}
      </div>
    </main>
  );
}


export default CategoryPage;
