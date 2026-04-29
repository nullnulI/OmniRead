/* Copyright (c) 2026, Yao Zeran 
 * 
 * The api services that fetch user space data from the backend server. */


import { fetchJson } from "@/services/http";

import { MailMessage } from "@/types/space";
import { Book } from "@/types/book";
import { fetchBooksRecommended } from "@/services/api/book";


const sampleMails: MailMessage[] = [
	{
		id: 1,
		sender: "Mina Author",
		subject: "New chapter announcement",
		content:
			"The next chapter is live. I also added a short note about the inspiration behind the desert city scenes.",
		time: "10m",
		unread: true,
	},
	{
		id: 2,
		sender: "Storefront Support",
		subject: "Your order is on the way",
		content:
			"Your latest book shipment has been packed and handed off to the courier. Tracking details are ready.",
		time: "1h",
	},
	{
		id: 3,
		sender: "Weekly Digest",
		subject: "Books you might like this week",
		content:
			"A new shortlist is ready based on your reading history, with more fantasy and strategy-heavy picks.",
		time: "Yesterday",
	},
];

const sampleRecentReadsIds: string[] = [
	"1", "2"
]

export async function fetchUserMails(userId: string) {
  try {
    return await fetchJson<MailMessage[]>(`/space/${userId}/mails`);
  } catch {
    return sampleMails;
  }
}


export async function fetchUserBooks(userId: string): Promise<Record<string, Book>> {
	try {
    return await fetchBooksRecommended(userId);
  } catch {
    return {};
  }
}


export async function fetchUserRecentReadsIds(userId: string): Promise<string[]> {
	try {
    return await fetchJson<string[]>(`/space/${userId}/recent-reads`);
  } catch {
    return sampleRecentReadsIds;
  }
}
