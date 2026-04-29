/* Copyright (c) 2026, Yao Zeran
 *
 * The book details and sales info page. */


import ListedBook from "@/features/book/components/ListedBook";


async function BookPage({ params }: Readonly<{ params : Promise<{ id : string }> }>) {
  const { id } = await params;

  return (
    <main className="w-full px-4 py-6 md:px-6 md:py-8">
      <ListedBook bookId={id} />
    </main>
  );
}


export default BookPage;
