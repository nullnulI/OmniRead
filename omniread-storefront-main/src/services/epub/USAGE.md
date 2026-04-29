/* Copyright (c) 2026, Yao Zeran
 *
 * EPUB Parser and Reader Usage Guide
 *
 * This document provides examples of how to use the EPUB parser and reader components
 * in your application. */


/**
 * BASIC WORKFLOW
 *
 * 1. Load EPUB from File, ArrayBuffer, or URL
 * 2. Parse EPUB to extract metadata, spine, manifest, and navigation
 * 3. Display using EpubReader component with navigation controls
 * 4. Track reading progress and persist reader state
 */


/* ============================================================================
 * EXAMPLE 1: Load and Parse EPUB from File
 * ============================================================================ */

import { loadEpubFromFile, parseEpubPackage } from "@/services";

async function handleFileUpload(file: File) {
	try {
		// Step 1: Load EPUB archive
		const epubFiles = await loadEpubFromFile(file);
		console.log(`Loaded ${epubFiles.size} files from EPUB`);

		// Step 2: Parse EPUB structure
		const bookId = 12345; // ISBN or other identifier
		const document = await parseEpubPackage(epubFiles, bookId);

		// Step 3: Access metadata
		console.log("Title:", document.package.metadata.title);
		console.log("Authors:", document.package.metadata.creators);
		console.log("Language:", document.package.metadata.language);
		console.log("Identifiers:", document.package.metadata.identifiers);

		// Step 4: Access table of contents
		console.log("Chapters:", document.package.navigation.toc);

		return document;
	} catch (error) {
		console.error("Failed to load EPUB:", error);
	}
}


/* ============================================================================
 * EXAMPLE 2: Load EPUB from URL
 * ============================================================================ */

import { loadEpubFromArrayBuffer, loadEpubFromUrl } from "@/services";

async function loadEpubFromRemote(url: string) {
	try {
		// Load and parse in one go
		const epubFiles = await loadEpubFromUrl(url);
		const document = await parseEpubPackage(epubFiles, "isbn-from-url");

		return document;
	} catch (error) {
		console.error("Failed to load EPUB from URL:", error);
	}
}


/* ============================================================================
 * EXAMPLE 3: Use EpubReader Component
 * ============================================================================ */

import { EpubReader } from "@/features/reader/components/EpubReader";
import type { EpubLocation } from "@/types/epub";

function MyEpubReaderPage({ epubDocument }: { epubDocument: EpubDocument }) {
	const handleLocationChange = (location: EpubLocation) => {
		// Save reading progress to database
		console.log(`Reading progress: ${Math.round(location.progress * 100)}%`);

		// Persist to backend
		// await persistReaderState(epubDocument.bookId, location);
	};

	return (
		<EpubReader
			document={epubDocument}
			onLocationChange={handleLocationChange}
			initialLocation={savedLocation} // From database
			viewSettings={{
				theme: "sepia",
				flow: "paginated",
				font: {
					fontFamily: "Georgia, serif",
					fontSizePercent: 110,
					lineHeight: 1.8,
				},
			}}
			onError={(error) => console.error("Reader error:", error)}
		/>
	);
}


/* ============================================================================
 * EXAMPLE 4: Linking Book (Mart Item) to EPUB
 * ============================================================================ */

import type { Book, EpubBook } from "@/types/book";

// Book types now include epubIdentifier for linking

const bookWithEpub: Book = {
	id: 12345,
	title: "Sample Book",
	coverImage: "/cover.jpg",
	authorId: 1,
	authorName: "Author Name",
	publisherId: 1,
	publisherName: "Publisher",
	publishDate: "2026-01-01",
	digitalPrice: 9.99,
	isSoldOut: false,

	// NEW: Link book to EPUB file by ISBN
	epubIdentifier: "978-1-234567-89-0",
};

// EpubBook extends Book with full EPUB metadata and content
const epubBook: EpubBook = {
	...bookWithEpub,
	format: "epub",
	digitalPrice: 9.99,
	epub: {
		metadata: {
			title: "Sample Book",
			language: "en",
			identifiers: [
				{ id: "uuid", value: "urn:uuid:12345" },
				{ id: "isbn", scheme: "isbn", value: "978-1-234567-89-0" },
			],
			creators: [{ name: "Author Name", role: "aut" }],
		},
		source: {
			downloadUrl: "https://example.com/books/sample.epub",
			fileSizeBytes: 1024000,
		},
		document, // Loaded EpubDocument from parseEpubPackage
		initialLocation: {
			href: "chapter1.xhtml",
			spineIndex: 0,
			progress: 0,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		},
		readerState: {
			bookId: 12345,
			location: {
				href: "chapter1.xhtml",
				spineIndex: 0,
				progress: 0.15,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			},
			bookmarks: [],
			annotations: [],
			lastOpenedAt: new Date().toISOString(),
			view: {
				theme: "light",
				flow: "paginated",
				layout: "reflowable",
				orientation: "auto",
				spread: "auto",
				font: { fontFamily: "serif", fontSizePercent: 100, lineHeight: 1.5 },
			},
		},
	},
};


/* ============================================================================
 * EXAMPLE 5: Handle EPUB with Different Identifier Types
 * ============================================================================ */

type IdentifierType = "isbn" | "doi" | "uuid" | "urn";

function getIdentifierByType(
	identifiers: EpubIdentifier[],
	type: IdentifierType,
): string | undefined {
	return identifiers.find((id) => id.scheme === type || id.id.includes(type))?.value;
}

// Usage
const isbn = getIdentifierByType(epubBook.epub.metadata.identifiers, "isbn");
const doi = getIdentifierByType(epubBook.epub.metadata.identifiers, "doi");
const uuid = getIdentifierByType(epubBook.epub.metadata.identifiers, "uuid");

console.log("ISBN:", isbn); // 978-1-234567-89-0
console.log("DOI:", doi); // undefined
console.log("UUID:", uuid); // urn:uuid:12345


/* ============================================================================
 * EXAMPLE 6: Navigate EPUB Structure
 * ============================================================================ */

function printEpubStructure(document: EpubDocument) {
	const { package: pkg } = document;

	console.log("=== EPUB STRUCTURE ===");

	// Metadata
	console.log("\nMETADATA:");
	console.log("- Title:", pkg.metadata.title);
	console.log("- Authors:", pkg.metadata.creators.map((c) => c.name).join(", "));
	console.log("- Language:", pkg.metadata.language);

	// Navigation (Table of Contents)
	console.log("\nTABLE OF CONTENTS:");
	pkg.navigation.toc.forEach((chapter, idx) => {
		console.log(`${idx + 1}. ${chapter.label}`);
		chapter.children?.forEach((section, sidx) => {
			console.log(`   ${sidx + 1}. ${section.label}`);
		});
	});

	// Spine (Reading Order)
	console.log("\nSPINE (Reading Order):");
	pkg.spine.items.slice(0, 5).forEach((item, idx) => {
		const manifest = document.resources.byId[item.idref];
		console.log(`${idx + 1}. ${manifest?.id} (${manifest?.href})`);
	});

	// Landmarks
	if (pkg.navigation.landmarks) {
		console.log("\nLANDMARKS:");
		pkg.navigation.landmarks.forEach((landmark) => {
			console.log(`- ${landmark.title} (${landmark.type})`);
		});
	}
}


/* ============================================================================
 * EXAMPLE 7: Error Handling
 * ============================================================================ */

import { EpubParseError, EpubLoadError } from "@/services";

async function robustEpubLoading(file: File) {
	try {
		const epubFiles = await loadEpubFromFile(file);
		const document = await parseEpubPackage(epubFiles, "book-123");
		return document;
	} catch (error) {
		if (error instanceof EpubLoadError) {
			console.error("Failed to load EPUB file:", error.message);
			// Handle loading error (corrupted file, etc.)
		} else if (error instanceof EpubParseError) {
			console.error("Failed to parse EPUB:", error.message);
			// Handle parsing error (invalid structure, etc.)
		} else {
			console.error("Unknown error:", error);
		}
	}
}


/* ============================================================================
 * TYPE REFERENCE
 * ============================================================================ */

/*
Key Types Used:

1. EpubIdentifier
   - id: string (unique identifier within EPUB)
   - scheme?: string (isbn, doi, uuid, etc.)
   - value: string (actual identifier value)

2. EpubMetadata
   - title: string
   - language: string (ISO code: en, jp, fr, etc.)
   - identifiers: EpubIdentifier[]
   - creators: EpubContributor[]
   - contributors?: EpubContributor[]
   - publisher?: string
   - subjects?: string[] (tags/categories)

3. EpubDocument
   - bookId: number | string
   - package: EpubPackage
   - resources: EpubResourceMap (quick lookup maps)
   - loadedAt: string (ISO timestamp)

4. EpubLocation
   - href: string (file path)
   - spineIndex: number (position in reading order)
   - progress: number (0-1)
   - createdAt: string
   - updatedAt: string

5. Book (updated)
   - epubIdentifier?: string (ISBN or other identifier)

6. EpubReaderProps
   - document: EpubDocument
   - onLocationChange?: callback
   - initialLocation?: EpubLocation
   - viewSettings?: theme, flow, font, etc.
   - onError?: callback
*/


export {};
