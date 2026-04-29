/* Copyright (c) 2026, Yao Zeran
 *
 * The mailbox section for incoming notifications and messages. */


"use client";


import { useEffect, useState } from "react";

import { useAuthContext } from "@/features/auth/context/AuthProvider";

import type { MailMessage } from "@/types/space";

import { fetchUserMails } from "@/services/api/space";
import { countUnreadMails } from "@/utils/common";


const MailMessageCard = ({ message }: Readonly<{ message: MailMessage }>) => {
  return (
    <article
      className={`rounded-2xl border p-4 transition-colors ${
        message.unread
          ? "border-amber-200 bg-amber-50/80"
          : "border-slate-200 bg-slate-50/70"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-slate-900">{message.sender}</h3>
          <p className="mt-1 text-sm text-slate-600">{message.subject}</p>
        </div>
        <span className="whitespace-nowrap text-xs text-slate-500">{message.time}</span>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-700">{message.content}</p>
    </article>
  )
}


function MailboxSection() {

	const auth = useAuthContext();
	
	const [mails, setMails] = useState<MailMessage[]>();

	useEffect(() => {
		if (!auth?.user?.metadata.id) return;
		async function loadMails() {
			const userId = auth.user?.metadata.id;
			if (!userId) return;
			const data = await fetchUserMails(userId);
			setMails(data);
		}
		loadMails();
	}, [auth]);


	const unreadCount = countUnreadMails(mails);
	const unreadLabel = unreadCount === 1 ? "new" : "news";

	return (
		<section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">

			<div className="mb-5 flex items-start justify-between gap-4">
				<div>
					<p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
						Message
					</p>
					<h2 className="mt-1 text-2xl font-semibold text-slate-900">Mailbox</h2>
				</div>
				<span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
					{unreadCount} {unreadLabel}
				</span>
			</div>

			<div className="space-y-3">
				{mails?.map((message) => (
					<MailMessageCard key={message.id} message={message} />
				))}
			</div>

		</section>
	);
};


export default MailboxSection;
