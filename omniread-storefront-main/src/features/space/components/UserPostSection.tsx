/* Copyright (c) 2026, Yao Zeran
 *
 * The user post section for book reviews and reading notes. */


"use client";


import { useAuthContext } from "@/features/auth/context/AuthProvider";
import { fetchBookMetadata } from "@/services";

import { BookReview } from "@/types/space";
import { useEffect, useState } from "react";


function BookReviewCard({ review }: Readonly<{ review: BookReview }>) {

	const [name, setName] = useState<string>();

	useEffect(() => {
		async function load() {
			try {
				const data = await fetchBookMetadata(review.bookId);
				setName(data.title);
			} catch {
				setName("Unknown book");
			}
		}
		load();
	}, [review])

  return (
    <article className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 transition-colors hover:bg-slate-50">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-slate-900">{name}</h3>
          <p className="mt-1 text-sm text-slate-500">Posted {review.date}</p>
        </div>
        <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
          {review.rating}/5
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-700">{review.content}</p>
    </article>
  )
}


const UserPostSection = () => {

	const { user } = useAuthContext();

	const [posts] = useState<BookReview[]>([]);

	if (!user) {
		return <div></div>;
	}

	const safePosts = posts ?? [];

	return (
		<section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
			<div className="mb-5 flex items-start justify-between gap-4">
				<div>
					<p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
						Posts
					</p>
					<h2 className="mt-1 text-2xl font-semibold text-slate-900">{user.metadata.name}&apos;s book reviews</h2>
				</div>
				<span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
					{safePosts.length} posts
				</span>
			</div>

			<div className="space-y-4">
				{safePosts.map((post) => (
					<BookReviewCard key={post.id} review={post}></BookReviewCard>
				))}
			</div>
		</section>
	);
};


export default UserPostSection;
