

import type { MailMessage } from "@/types/space";


export function countUnreadMails(messages: MailMessage[] | undefined) {
	if (!messages) return 0;
	return messages.reduce((count, message) => {
		return count + (message.unread ? 1 : 0);
	}, 0);
};

