/* Copyright (c) 2026, Yao Zeran
 *
 * EPUB parser service for parsing EPUB files and extracting metadata,
 *   spine, manifest, and navigation information. */

import type {
	EpubDocument,
	EpubIdentifier,
	EpubMetadata,
	EpubManifestItem,
	EpubSpine,
	EpubSpineItemRef,
	EpubNavigation,
	EpubNavigationPoint,
	EpubLandmark,
	EpubPageListItem,
	EpubContributor,
	EpubResourceMap,
	EpubFile,
} from "@/types/epub";


export class EpubParseError extends Error {
	constructor(message: string) {
		super(`EPUB Parse Error: ${message}`);
		this.name = "EpubParseError";
	}
}


interface ParsedOPF {
	metadata: EpubMetadata;
	manifest: EpubManifestItem[];
	spine: EpubSpine;
}


/* Helper: Parse XML string and return Document object */
function parseXml(xmlString: string): Document {
	const parser = new DOMParser();
	const doc = parser.parseFromString(xmlString, "application/xml");
	if (doc.getElementsByTagName("parsererror").length > 0) {
		throw new EpubParseError("Invalid XML document");
	}
	return doc;
}


/* Helper: Extract text content from XML element */
function getElementText(element: Element, tagName: string, namespace?: string): string | undefined {
	const elements = namespace
		? element.getElementsByTagNameNS(namespace, tagName)
		: element.getElementsByTagName(tagName);

	if (elements.length === 0) return undefined;
	return elements[0].textContent || undefined;
}


/* Helper: Extract all text nodes from a list of elements */
function getElementsText(element: Element, tagName: string, namespace?: string): string[] {
	const elements = namespace
		? element.getElementsByTagNameNS(namespace, tagName)
		: element.getElementsByTagName(tagName);

	return Array.from(elements).map((el) => el.textContent || "").filter(Boolean);
}


/* Helper: Parse DC (Dublin Core) and OPF namespaces */
function parseMetadata(packageDoc: Element): EpubMetadata {
	const DC_NS = "http://purl.org/dc/elements/1.1/";
	const OPF_NS = "http://www.idpf.org/2007/opf";

	const metadataEl = packageDoc.getElementsByTagName("metadata")[0];
	if (!metadataEl) {
		throw new EpubParseError("No metadata element found in OPF");
	}

	// Parse identifiers
	const identifiers: EpubIdentifier[] = [];
	const identifierEls = metadataEl.getElementsByTagNameNS(DC_NS, "identifier");
	Array.from(identifierEls).forEach((el) => {
		const id = el.getAttribute("id");
		const scheme = el.getAttributeNS(OPF_NS, "scheme");
		const value = el.textContent || "";

		identifiers.push({
			id: id || `identifier-${identifiers.length}`,
			scheme: scheme || undefined,
			value,
		});
	});

	// Parse title
	const titleEls = metadataEl.getElementsByTagNameNS(DC_NS, "title");
	const title = titleEls.length > 0 ? titleEls[0].textContent || "Untitled" : "Untitled";

	// Parse language
	const langEls = metadataEl.getElementsByTagNameNS(DC_NS, "language");
	const language = langEls.length > 0 ? langEls[0].textContent || "en" : "en";

	// Parse creators (authors)
	const creators: EpubContributor[] = [];
	const creatorEls = metadataEl.getElementsByTagNameNS(DC_NS, "creator");
	Array.from(creatorEls).forEach((el) => {
		const role = el.getAttributeNS(OPF_NS, "role");
		const fileAs = el.getAttributeNS(OPF_NS, "file-as");
		creators.push({
			name: el.textContent || "",
			role: role || "aut",
			fileAs: fileAs || undefined,
		});
	});

	// Parse contributors
	const contributors: EpubContributor[] = [];
	const contributorEls = metadataEl.getElementsByTagNameNS(DC_NS, "contributor");
	Array.from(contributorEls).forEach((el) => {
		const role = el.getAttributeNS(OPF_NS, "role");
		const fileAs = el.getAttributeNS(OPF_NS, "file-as");
		contributors.push({
			name: el.textContent || "",
			role: role || undefined,
			fileAs: fileAs || undefined,
		});
	});

	// Parse publisher
	const publisher = getElementText(metadataEl, "publisher", DC_NS);

	// Parse description
	const description = getElementText(metadataEl, "description", DC_NS);

	// Parse rights
	const rights = getElementText(metadataEl, "rights", DC_NS);

	// Parse subjects (tags)
	const subjects = getElementsText(metadataEl, "subject", DC_NS);

	// Parse published date
	const publishedAt = getElementText(metadataEl, "issued", DC_NS) ||
		getElementText(metadataEl, "date", DC_NS);

	// Parse modified date
	const modifiedAt = getElementText(metadataEl, "modified", OPF_NS);

	// Parse cover image id
	const coverMeta = Array.from(metadataEl.getElementsByTagName("meta")).find(
		(el) => el.getAttribute("name") === "cover"
	);
	const coverId = coverMeta?.getAttribute("content") ?? undefined;

	return {
		title,
		language,
		identifiers,
		creators,
		contributors: contributors.length > 0 ? contributors : undefined,
		publisher,
		description,
		rights,
		subjects: subjects.length > 0 ? subjects : undefined,
		publishedAt,
		modifiedAt,
		coverId,
	};
}


/* Helper: Parse manifest from OPF */
function parseManifest(packageDoc: Element): EpubManifestItem[] {
	const manifestEl = packageDoc.getElementsByTagName("manifest")[0];
	if (!manifestEl) {
		throw new EpubParseError("No manifest element found in OPF");
	}

	const items: EpubManifestItem[] = [];
	const itemEls = manifestEl.getElementsByTagName("item");

	Array.from(itemEls).forEach((el) => {
		const id = el.getAttribute("id");
		const href = el.getAttribute("href");
		const mediaType = el.getAttribute("media-type");

		if (!id || !href || !mediaType) {
			return; // Skip invalid items
		}

		const fallback = el.getAttribute("fallback") || undefined;
		const properties = el.getAttribute("properties")?.split(" ") || undefined;
		const mediaOverlay = el.getAttribute("media-overlay") || undefined;

		items.push({
			id,
			href: decodeURIComponent(href),
			mediaType,
			fallback,
			properties: properties && properties.length > 0 ? properties : undefined,
			mediaOverlay,
		});
	});

	return items;
}


/* Helper: Parse spine from OPF */
function parseSpine(packageDoc: Element): EpubSpine {
	const spineEl = packageDoc.getElementsByTagName("spine")[0];
	if (!spineEl) {
		throw new EpubParseError("No spine element found in OPF");
	}

	const tocId = spineEl.getAttribute("toc") || undefined;
	const pagesProgressionDirection = spineEl.getAttribute("page-progression-direction") as EpubSpine["pageProgressionDirection"];

	const items: EpubSpineItemRef[] = [];
	const itemRefEls = spineEl.getElementsByTagName("itemref");

	Array.from(itemRefEls).forEach((el) => {
		const idref = el.getAttribute("idref");
		if (!idref) return;

		const linear = el.getAttribute("linear") as "yes" | "no" | undefined;
		const properties = el.getAttribute("properties")?.split(" ") || undefined;

		items.push({
			idref,
			linear: linear || "yes",
			properties: properties && properties.length > 0 ? properties : undefined,
		});
	});

	return {
		tocId,
		items,
		pageProgressionDirection: pagesProgressionDirection,
	};
}


/* Helper: Parse NCX (EPUB2 table of contents) */
function parseNcx(ncxString: string): EpubNavigationPoint[] {
	const doc = parseXml(ncxString);
	const NCX_NS = "http://www.daisy.org/z3986/2005/ncx/";

	function parseNavPoint(element: Element): EpubNavigationPoint[] {
		const points: EpubNavigationPoint[] = [];
		const navPointEls = element.getElementsByTagNameNS(NCX_NS, "navPoint");

		Array.from(navPointEls).forEach((el) => {
			const id = el.getAttribute("id");
			const playOrder = el.getAttribute("playOrder");

			const labelEl = el.getElementsByTagNameNS(NCX_NS, "navLabel")[0];
			const label = labelEl?.getElementsByTagNameNS(NCX_NS, "text")[0]?.textContent || "Untitled";

			const contentEl = el.getElementsByTagNameNS(NCX_NS, "content")[0];
			const href = contentEl?.getAttribute("src") || "";

			const children = parseNavPoint(el);

			points.push({
				id: id || undefined,
				label,
				href,
				children: children.length > 0 ? children : undefined,
				playOrder: playOrder ? parseInt(playOrder, 10) : undefined,
			});
		});

		return points;
	}

	const docNavMapEl = doc.getElementsByTagNameNS(NCX_NS, "navMap")[0];
	if (docNavMapEl) {
		return parseNavPoint(docNavMapEl);
	}

	return [];
}


/* Helper: Parse nav.xhtml (EPUB3 table of contents) */
function parseNavXhtml(navXhtmlString: string): {
	toc: EpubNavigationPoint[];
	landmarks?: EpubLandmark[];
	pageList?: EpubPageListItem[];
} {
	const doc = parseXml(navXhtmlString);
	const XHTML_NS = "http://www.w3.org/1999/xhtml";
	const EPUB_NS = "http://www.idpf.org/2007/ops";

	const toc: EpubNavigationPoint[] = [];
	const landmarks: EpubLandmark[] = [];
	const pageList: EpubPageListItem[] = [];

	// Parse TOC
	const tocNav = Array.from(doc.getElementsByTagNameNS(XHTML_NS, "nav")).find((nav) => {
		const epubType = nav.getAttributeNS(EPUB_NS, "type");
		return epubType === "toc";
	});

	if (tocNav) {
		function parseList(ol: Element): EpubNavigationPoint[] {
			const points: EpubNavigationPoint[] = [];
			const lis = ol.getElementsByTagNameNS(XHTML_NS, "li");

			Array.from(lis).forEach((li) => {
				const linkEl = li.getElementsByTagNameNS(XHTML_NS, "a")[0];
				if (!linkEl) return;

				const href = linkEl.getAttribute("href") || "";
				const label = linkEl.textContent || "Untitled";

				const nested = li.getElementsByTagNameNS(XHTML_NS, "ol")[0];
				const children = nested ? parseList(nested) : undefined;

				points.push({
					label,
					href,
					children,
				});
			});

			return points;
		}

		const ol = tocNav.getElementsByTagNameNS(XHTML_NS, "ol")[0];
		if (ol) {
			toc.push(...parseList(ol));
		}
	}

	// Parse landmarks
	const landmarksNav = Array.from(doc.getElementsByTagNameNS(XHTML_NS, "nav")).find((nav) => {
		const epubType = nav.getAttributeNS(EPUB_NS, "type");
		return epubType === "landmarks";
	});

	if (landmarksNav) {
		const lis = landmarksNav.getElementsByTagNameNS(XHTML_NS, "li");
		Array.from(lis).forEach((li) => {
			const linkEl = li.getElementsByTagNameNS(XHTML_NS, "a")[0];
			if (!linkEl) return;

			const href = linkEl.getAttribute("href") || "";
			const title = linkEl.textContent || "Untitled";
			const type = linkEl.getAttribute("epub:type") || "";

			landmarks.push({
				type,
				title,
				href,
			});
		});
	}

	// Parse page list
	const pageListNav = Array.from(doc.getElementsByTagNameNS(XHTML_NS, "nav")).find((nav) => {
		const epubType = nav.getAttributeNS(EPUB_NS, "type");
		return epubType === "page-list";
	});

	if (pageListNav) {
		const lis = pageListNav.getElementsByTagNameNS(XHTML_NS, "li");
		Array.from(lis).forEach((li, idx) => {
			const linkEl = li.getElementsByTagNameNS(XHTML_NS, "a")[0];
			if (!linkEl) return;

			const href = linkEl.getAttribute("href") || "";
			const label = linkEl.textContent || "";

			pageList.push({
				label,
				href,
				pageNumber: idx + 1,
			});
		});
	}

	return {
		toc: toc.length > 0 ? toc : [],
		landmarks: landmarks.length > 0 ? landmarks : undefined,
		pageList: pageList.length > 0 ? pageList : undefined,
	};
}


/* Helper: Build resource map for quick lookups by id or href */
function buildResourceMap(manifest: EpubManifestItem[]): EpubResourceMap {
	const byId: Record<string, EpubManifestItem> = {};
	const byHref: Record<string, EpubManifestItem> = {};

	manifest.forEach((item) => {
		byId[item.id] = item;
		byHref[item.href] = item;
	});

	return { byId, byHref };
}


/* Main: Parse EPUB OPF (package document) */
function parseOPF(opfString: string): ParsedOPF {
	const doc = parseXml(opfString);
	const packageEl = doc.getElementsByTagName("package")[0];

	if (!packageEl) {
		throw new EpubParseError("No package element found in OPF");
	}

	const metadata = parseMetadata(packageEl);
	const manifest = parseManifest(packageEl);
	const spine = parseSpine(packageEl);

	return { metadata, manifest, spine };
}


/* Main: Parse navigation (NCX or nav.xhtml) */
async function parseNavigation(
	files: Map<string, EpubFile>,
	manifest: EpubManifestItem[],
	spine: EpubSpine,
): Promise<EpubNavigation> {
	let toc: EpubNavigationPoint[] = [];
	let landmarks: EpubLandmark[] | undefined;
	let pageList: EpubPageListItem[] | undefined;

	// Try to find nav.xhtml (EPUB3)
	const navItem = manifest.find(
		(item) => item.properties?.includes("nav") && item.mediaType === "application/xhtml+xml"
	);

	if (navItem) {
		const navFile = files.get(navItem.href);
		if (navFile && typeof navFile.data === "string") {
			try {
				const navData = parseNavXhtml(navFile.data);
				toc = navData.toc;
				landmarks = navData.landmarks;
				pageList = navData.pageList;
			} catch (error) {
				console.warn("Failed to parse nav.xhtml:", error);
			}
		}
	}

	// Fallback: Try to find NCX (EPUB2)
	if (toc.length === 0 && spine.tocId) {
		const ncxItem = manifest.find((item) => item.id === spine.tocId);
		if (ncxItem) {
			const ncxFile = files.get(ncxItem.href);
			if (ncxFile && typeof ncxFile.data === "string") {
				try {
					toc = parseNcx(ncxFile.data);
				} catch (error) {
					console.warn("Failed to parse NCX:", error);
				}
			}
		}
	}

	// Fallback: Build TOC from spine if navigation is not available
	if (toc.length === 0) {
		toc = spine.items
			.filter((item) => item.linear !== "no")
			.map((item) => {
				const manifestItem = manifest.find((m) => m.id === item.idref);
				return {
					label: manifestItem?.id || item.idref,
					href: manifestItem?.href || "",
				};
			});
	}

	return {
		toc,
		landmarks,
		pageList,
	};
}


/* Public API: Parse complete EPUB archive
 *
 * Loads an EPUB file and extracts:
 * - Metadata (title, author, publisher, etc.)
 * - Manifest (list of resources)
 * - Spine (reading order)
 * - Navigation (table of contents, landmarks)
 *
 * Returns an EpubPackage with all parsed data */
export async function parseEpubPackage(
	files: Map<string, EpubFile>,
	bookId: number | string,
): Promise<EpubDocument> {
	if (files.size === 0) {
		throw new EpubParseError("No files provided");
	}

	// Find the OPF file (usually in META-INF/container.xml)
	const containerFile = files.get("META-INF/container.xml");
	if (!containerFile || typeof containerFile.data !== "string") {
		throw new EpubParseError("Missing META-INF/container.xml");
	}

	// Parse container.xml to find OPF location
	const containerDoc = parseXml(containerFile.data);
	const rootfilesEl = containerDoc.getElementsByTagName("rootfiles");

	if (!rootfilesEl || rootfilesEl.length === 0) {
		throw new EpubParseError("No rootfiles element in container.xml");
	}

	const rootfileEl = rootfilesEl[0].getElementsByTagName("rootfile")[0];
	if (!rootfileEl) {
		throw new EpubParseError("No rootfile element in container.xml");
	}

	const opfPath = rootfileEl.getAttribute("full-path");
	if (!opfPath) {
		throw new EpubParseError("No full-path attribute in rootfile element");
	}

	// Load and parse OPF
	const opfFile = files.get(opfPath);
	if (!opfFile || typeof opfFile.data !== "string") {
		throw new EpubParseError(`OPF file not found at ${opfPath}`);
	}

	const { metadata, manifest, spine } = parseOPF(opfFile.data);

	// Parse navigation
	const navigation = await parseNavigation(files, manifest, spine);

	// Build resource map
	const resources = buildResourceMap(manifest);

	return {
		bookId,
		package: {
			metadata,
			manifest,
			spine,
			navigation,
		},
		resources,
		archivePath: opfPath,
		fileCount: files.size,
		loadedAt: new Date().toISOString(),
	};
}
