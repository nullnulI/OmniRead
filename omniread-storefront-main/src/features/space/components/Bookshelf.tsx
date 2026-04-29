/* Copyright (c) 2026, Yao Zeran
 *
 * The bookshelf component that display user's books */


import Image from "next/image";

import type { Book } from "@/types/book";
import Link from "next/link";
import { useBookAuthors } from "@/hooks/book/useBookAuthors";
import { useBookPublishInfo } from "@/hooks/book/useBookPublishers";


function BookshelfItem({ book }: Readonly<{ book: Book }>) {

  const {authors} = useBookAuthors(book);
  const {date} = useBookPublishInfo(book);

  return (
    <Link href={`/reader/epub/sample/epub-sample`}>
      <article key={book.metadata.id}
        className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md"
      >
        <div className="relative h-52 w-full overflow-hidden">
          <Image
            src={book.metadata.coverImage ?? "https://via.placeholder.com/150"}
            alt={book.metadata.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        <div className="space-y-2 p-4">
          <h3 className="line-clamp-2 text-base font-semibold text-slate-900">{book.metadata.title}</h3>
          <p className="text-sm text-slate-600">{authors}</p>
          <p className="text-xs text-slate-500">Published {date}</p>
        </div>
      </article>
    </Link>
  )
}


function Bookshelf({ books }: Readonly<{ books: Book[] }>) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {books.map((book) => (<BookshelfItem key={book.metadata.id} book={book}/>))}
    </div>
  );
};

export default Bookshelf;
