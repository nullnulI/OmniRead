/* Copyright (c) 2026 Yao Zeran
 * 
 * The user's book shelf section, including
 *   recently read: all the recently read books
 *   purchased: all the purchased books */


"use client";


import { useEffect, useState } from "react";

import { useAuthContext } from "@/features/auth/context/AuthProvider";

import { Book } from "@/types/book";

import { fetchUserBooks, fetchUserRecentReadsIds } from "@/services/api/space";

import Bookshelf from "@/features/space/components/Bookshelf";


const BookshelfSection = () => {
	
	const auth = useAuthContext();
	const userId = auth?.user?.metadata.id;

	const [loading, setLoading] = useState<boolean>(false);
	const [books, setBooks] = useState<Record<string, Book>>({});
	const [recentReadIds, setRecentReadIds] = useState<string[]>([]);

	useEffect(() => {
		if (!userId) {
			setBooks({});
			setRecentReadIds([]);
			setLoading(false);
			return;
		}
		const safeUserId = userId;

		let isMounted = true;

		async function loadBookshelf() {
			setLoading(true);

			try {
				const [userBooks, recentIds] = await Promise.all([
					fetchUserBooks(safeUserId),
					fetchUserRecentReadsIds(safeUserId),
				]);

				if (!isMounted) {
					return;
				}

				setBooks(userBooks);
				setRecentReadIds(recentIds);
			} catch {
				if (!isMounted) {
					return;
				}

				setBooks({});
				setRecentReadIds([]);
			} finally {
				if (isMounted) {
					setLoading(false);
				}
			}
		}

		loadBookshelf();

		return () => {
			isMounted = false;
		};
	}, [userId]);

	if (!userId) {
		return <div></div>;
	}

	if (loading) {
		return (
			<section className="space-y-8">
				<div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
					<p className="text-sm text-slate-500">Loading bookshelf...</p>
				</div>
			</section>
		);
	}

	const booksList = Object.values(books);
	const recentReadSet = new Set(recentReadIds);
	const recentBooks = recentReadIds
		.map((bookId) => books[bookId])
		.filter((book): book is Book => Boolean(book));
	const continueBooks = booksList.filter((book) => !recentReadSet.has(book.metadata.id));

	if (recentBooks.length === 0 && continueBooks.length === 0) {
		return <div></div>;
	}


	return (
		<section className="space-y-8">
			{recentBooks.length > 0 && (
				<div>
					<div className="mb-4 flex items-end justify-between gap-3">
						<h2 className="text-2xl font-semibold text-slate-900">Recently Read</h2>
					</div>
					<Bookshelf books={recentBooks} />
				</div>
			)}

			{continueBooks.length > 0 && (
				<div>
					<div className="mb-4 flex items-end justify-between gap-3">
						<h2 className="text-2xl font-semibold text-slate-900">Continue Reading</h2>
					</div>
					<Bookshelf books={continueBooks} />
				</div>
			)}
		</section>
	);
};


export default BookshelfSection;
