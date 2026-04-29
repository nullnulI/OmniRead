/* Copyright (c) 2026, Yao Zeran
 *
 * EPUB identifier utilities for managing and working with EPUB identifiers
 *   (ISBN, DOI, UUID, etc.) across the application. */


import type { EpubIdentifier } from "@/types/epub";
import type { Book, EpubBook } from "@/types/book";
import type {
	EpubDocument,
	EpubMetadata,
	EpubReaderState,
	EpubReadingStats,
	EpubLocation,
} from "@/types/epub";


export type IdentifierScheme = "isbn" | "doi" | "uuid" | "urn" | "url" | string;


/**
 * Extract identifier by scheme from EPUB metadata
 *
 * @param identifiers - List of EPUB identifiers
 * @param scheme - Scheme to filter by (isbn, doi, uuid, etc.)
 * @returns The identifier value or undefined
 */
export function getIdentifierByScheme(
	identifiers: EpubIdentifier[],
	scheme: IdentifierScheme,
): string | undefined {
	return identifiers.find(
		(id) =>
			id.scheme?.toLowerCase() === scheme.toLowerCase() ||
			id.id.toLowerCase().includes(scheme.toLowerCase()),
	)?.value;
}


/**
 * Extract the primary identifier from EPUB
 *
 * Priority: ISBN > UUID > URL > first identifier
 *
 * @param identifiers - List of EPUB identifiers
 * @returns The primary identifier value
 */
export function getPrimaryIdentifier(identifiers: EpubIdentifier[]): string | undefined {
	if (identifiers.length === 0) return undefined;

	// Try ISBN first (most common for books)
	const isbn = identifiers.find((id) => id.scheme?.toLowerCase() === "isbn")?.value;
	if (isbn) return isbn;

	// Try UUID
	const uuid = identifiers.find((id) => id.scheme?.toLowerCase() === "uuid")?.value;
	if (uuid) return uuid;

	// Try URL
	const url = identifiers.find((id) => id.scheme?.toLowerCase() === "url")?.value;
	if (url) return url;

	// Return first one
	return identifiers[0].value;
}


/**
 * Link a Book (mart item) to an EPUB file by identifier
 *
 * This creates the relationship between the sale item and the digital content.
 *
 * @param book - The book to update
 * @param epubIdentifier - ISBN, DOI, or other identifier
 * @returns Updated book object
 */
export function linkBookToEpub(
	book: Book,
	epubIdentifier: string,
): Book {
	return {
		...book,
		epubIdentifier,
	};
}


/**
 * Link a Book to an EPUB and include full EPUB document data
 *
 * @param book - The base book
 * @param epubIdentifier - ISBN or other identifier
 * @param epubData - Full EPUB data including metadata and document
 * @returns Complete EpubBook object
 */
export function createEpubBook(
	book: Book,
	epubIdentifier: string,
	epubData: {
		metadata: EpubMetadata;
		source: unknown;
		document?: EpubDocument;
		initialLocation?: EpubLocation;
		readerState?: EpubReaderState;
		readingStats?: EpubReadingStats;
	},
): EpubBook {
	return {
		...book,
		epubIdentifier,
		format: "epub",
		digitalPrice: book.digitalPrice || 9.99,
		epub: {
			metadata: epubData.metadata,
			source: epubData.source,
			document: epubData.document,
			initialLocation: epubData.initialLocation,
			readerState: epubData.readerState,
			readingStats: epubData.readingStats,
		},
	};
}


/**
 * Validate ISBN format
 *
 * Supports both ISBN-10 and ISBN-13 formats (with or without hyphens)
 *
 * @param isbn - ISBN string to validate
 * @returns true if valid ISBN format
 */
export function isValidIsbn(isbn: string): boolean {
	const cleaned = isbn.replace(/[-\s]/g, "");

	// ISBN-10: 10 digits
	if (cleaned.length === 10) {
		return /^\d{9}[\dX]$/.test(cleaned);
	}

	// ISBN-13: 13 digits starting with 978 or 979
	if (cleaned.length === 13) {
		return /^(978|979)\d{10}$/.test(cleaned);
	}

	return false;
}


/**
 * Format ISBN with standard hyphens
 *
 * Converts "9781234567890" to "978-1-234-56-789-0"
 *
 * @param isbn - ISBN string (with or without hyphens)
 * @returns Formatted ISBN or original if invalid
 */
export function formatIsbn(isbn: string): string {
	const cleaned = isbn.replace(/[-\s]/g, "");

	if (!isValidIsbn(cleaned)) {
		return isbn;
	}

	if (cleaned.length === 10) {
		// ISBN-10: X-XXXXXX-X-X
		return `${cleaned.substring(0, 1)}-${cleaned.substring(1, 7)}-${cleaned.substring(7, 9)}-${cleaned.substring(9)}`;
	}

	if (cleaned.length === 13) {
		// ISBN-13: XXX-X-XXXXXX-X-X
		return `${cleaned.substring(0, 3)}-${cleaned.substring(3, 4)}-${cleaned.substring(4, 10)}-${cleaned.substring(10, 12)}-${cleaned.substring(12)}`;
	}

	return isbn;
}


/**
 * Extract ISBN from various formats
 *
 * Handles:
 * - Plain ISBN with hyphens: "978-1-234567-89-0"
 * - ISBN from URN: "urn:isbn:9781234567890"
 * - ISBN from URL: "https://isbn.example.com/9781234567890"
 *
 * @param input - String that may contain an ISBN
 * @returns ISBN string or undefined
 */
export function extractIsbn(input: string): string | undefined {
	// Direct ISBN with hyphens
	const directIsbn = input.match(/(?:97[89][-\s]?)?(?:\d[-\s]?){9}[\dX]/i);
	if (directIsbn) {
		return directIsbn[0].replace(/[-\s]/g, "");
	}

	// From URN format
	const urnIsbn = input.match(/urn:isbn:(\d{10}|\d{13})/i);
	if (urnIsbn) {
		return urnIsbn[1];
	}

	// From URL
	const urlIsbn = input.match(/(?:97[89])?\d{10}(?:\d{3})?/);
	if (urlIsbn && isValidIsbn(urlIsbn[0])) {
		return urlIsbn[0];
	}

	return undefined;
}


/**
 * Resolve EPUB identifier from various sources
 *
 * Priority:
 * 1. Direct EPUB metadata identifiers
 * 2. Extracted from input string
 * 3. Generate UUID fallback
 *
 * @param input - String input or EPUB identifiers list
 * @returns Resolved identifier object
 */
export function resolveEpubIdentifier(
	input: string | EpubIdentifier[],
): { scheme: IdentifierScheme; value: string } {
	if (Array.isArray(input)) {
		// From EPUB metadata
		const primary = getPrimaryIdentifier(input);
		if (primary) {
			const found = input.find((id) => id.value === primary);
			return {
				scheme: found?.scheme || "isbn",
				value: primary,
			};
		}
	} else {
		// From string input
		const isbn = extractIsbn(input);
		if (isbn) {
			return {
				scheme: "isbn",
				value: isbn,
			};
		}

		// Fallback to input as-is
		return {
			scheme: "uuid",
			value: input,
		};
	}

	// Last resort: generate UUID
	return {
		scheme: "uuid",
		value: `urn:uuid:${generateUuid()}`,
	};
}


/**
 * Generate a simple UUID v4-like string
 *
 * @returns UUID string
 */
export function generateUuid(): string {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === "x" ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}


/**
 * Compare two EPUB identifiers for equality
 *
 * Handles different schemes and formats (e.g., with/without ISBN hyphens)
 *
 * @param id1 - First identifier
 * @param id2 - Second identifier
 * @returns true if identifiers represent the same resource
 */
export function identifiersEqual(
	id1: EpubIdentifier,
	id2: EpubIdentifier,
): boolean {
	// Same scheme and normalized value
	if (id1.scheme === id2.scheme) {
		const v1 = normalizeIdentifierValue(id1.value, id1.scheme);
		const v2 = normalizeIdentifierValue(id2.value, id2.scheme);
		return v1 === v2;
	}

	// If both are ISBNs (different schemes), compare normalized
	if (
		(id1.scheme?.toLowerCase() === "isbn" || id1.id.includes("isbn")) &&
		(id2.scheme?.toLowerCase() === "isbn" || id2.id.includes("isbn"))
	) {
		return (
			id1.value.replace(/[-\s]/g, "") ===
			id2.value.replace(/[-\s]/g, "")
		);
	}

	return false;
}


/**
 * Normalize identifier value for comparison
 *
 * @param value - Identifier value
 * @param scheme - Identifier scheme
 * @returns Normalized value
 */
function normalizeIdentifierValue(value: string, scheme?: string): string {
	if (scheme?.toLowerCase() === "isbn") {
		return value.replace(/[-\s]/g, "");
	}
	return value.toLowerCase().trim();
}
