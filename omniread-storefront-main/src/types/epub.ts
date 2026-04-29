/* Copyright (c) 2026, Yao Zeran
 *
 * The epub related types and interfaces for parsing, rendering,
 *   and persisting reader state. */


/* XML-based Open Package File (OPF) for metadata
 * 
 *   <dc:identifier id="book_id">urn:uuid:1234...</dc:identifier>
 *   <dc:identifier id="isbn" opf:scheme="isbn">9781234567890</dc:identifier> */
export interface EpubIdentifier {
	id: string;
	scheme?: string;
	value: string;
}


/* The contributor of this epub
 * 
 *   role code: 
 *     aut-author, edt-editor, trl-translator, ill-illustrator, nar-narrator, pbl-publisher, etc.
 *   fileAs: for sorting last-names
 *   identifier: isni, orcid  */
export interface EpubContributor {
	name: string;
	role?: string;
	fileAs?: string;
	identifier?: string;
	language?: string;
}


/* Core of the epub's opf
 * 
 *   language: iso code, e.g., jp, en, fr, cn 
 *   rights: copyrights
 *   source: where epub originates, e.g., url, isbn
 *   subjects: tags, e.g., fiction 
 *   direction: overrides global reading direction if needed */
export interface EpubMetadata {
	title: string;
	subtitle?: string;
	language: string;
	identifiers: EpubIdentifier[];
	creators: EpubContributor[];
	contributors?: EpubContributor[];
	publisher?: string;
	description?: string;
	rights?: string;
	subjects?: string[];
	publishedAt?: string;
	modifiedAt?: string;
	source?: string;
	version?: string;
	direction?: EpubDirection;
	coverId?: string;
}


/* An epub is a zip file of assets, the current supported media types are 
 *
 *   html pages
 *   text
 *   images
 *   font */
export type EpubMediaType =
	| "application/xhtml+xml" | "application/xml" | "application/javascript"
	| "text/css" | "text/plain"
	| "image/jpeg" | "image/png" | "image/gif" | "image/webp" | "image/svg+xml"
	| "font/ttf" | "font/otf" | "font/woff" | "font/woff2"
	| "audio/mpeg" | "audio/mp4"
  | "video/mp4"
	| string;


/* The asset, called manifest, in opf zip 
 * 
 *   path: path to that asset
 *   fallback: e.g., video.mp4 → fallback → image.jpg 
 *   properties: nav, cover-image, scripted, mathml, svg, e.g., properties: ["nav"] 
 *   mediaOverlay: read-along audio books */
export interface EpubManifestItem {
	id: string;
	href: string;
	mediaType: EpubMediaType;
	fallback?: string;
	properties?: string[];
	mediaOverlay?: string;
}


/* The spine item reference, link between manifest and reading order
 *  
 *   linear: "no" → it should be skipped during normal reading.  
 *   properties: page spread mainly
 * 
 *   <itemref idref="page1" properties="page-spread-right"/> */
export interface EpubSpineItemRef {
	idref: string;
	linear?: "yes" | "no";
	properties?: string[];
}


/* The spine
 * 
 *   <spine>
 *     <itemref idref="chapter1"/>
 *     <itemref idref="chapter2"/>
 *     <itemref idref="appendix" linear="no"/>
 *    </spine>   */
export interface EpubSpine {
	tocId?: string;
	items: EpubSpineItemRef[];
  pageProgressionDirection?: EpubDirection;
}


/* Before epub 3 introduced modern navigation (landmarks + nav.xhtml), 
 *   this was the main way to define “jump points”.  */
export interface EpubGuideReference {
	type: string;
	title?: string;
	href: string;
}


export interface EpubNavigationPoint {
	id?: string;
	label: string;
	href: string;
	children?: EpubNavigationPoint[];
	playOrder?: number;
}


export interface EpubLandmark {
	type: string;
	title: string;
	href: string;
}


export interface EpubPageListItem {
	label: string;
	href: string;
	pageNumber?: number;
}


export interface EpubNavigation {
	toc: EpubNavigationPoint[];
	landmarks?: EpubLandmark[];
	pageList?: EpubPageListItem[];
}


export interface EpubPackage {
	metadata: EpubMetadata;
	manifest: EpubManifestItem[];
	spine: EpubSpine;
	navigation: EpubNavigation;
	guide?: EpubGuideReference[];
}


export interface EpubFile {
	path: string;
	data: ArrayBuffer | string;
	mediaType?: EpubMediaType;
	compressedSize?: number;
	uncompressedSize?: number;
}


/* A performance optimization layer over the manifest. 
 * 
 * Sample usage: 
 *   resources.byId["chapter1"] */
export interface EpubResourceMap {
	byId: Record<string, EpubManifestItem>;
	byHref: Record<string, EpubManifestItem>;
}


/* The reader cursor state context
 * 
 *   cfi: canonical fragment identifier, e.g., epubcfi(/6/14[xchapter1]!/4/2/6) 
 *   href: when cfi not available */
export interface EpubLocation {
	cfi?: string;
	href: string;
	spineIndex: number;
	progress: number;
	charOffset?: number;
	createdAt: string;
	updatedAt: string;
}


export interface EpubRange {
	startCfi: string;
	endCfi: string;
	href: string;
	spineIndex: number;
}


/* Read direction
 *
 *   ltr: left to right  */
export type EpubDirection = "ltr" | "rtl" | "default";


export type EpubLayout = "reflowable" | "pre-paginated";


export type EpubOrientation = "auto" | "portrait" | "landscape";


/* Two-page spread behavior: 
 * 
 *   none: always single page
 *   both: always two pages
 *   landscape: two pages in landscape 
 *   auto: user can decide  */
export type EpubSpread = "auto" | "none" | "landscape" | "both";


export type EpubTheme = "light" | "sepia" | "dark" | "system";


export type EpubReadingFlow = "paginated" | "scrolled";


export type EpubAnnotationType = "highlight" | "underline" | "note" | "bookmark";


export interface EpubAnnotation {
	id: string;
	type: EpubAnnotationType;
	range: EpubRange;
	color?: string;
	text?: string;
	note?: string;
	createdAt: string;
	updatedAt: string;
}


export interface EpubBookmark {
	id: string;
	title?: string;
	location: EpubLocation;
	createdAt: string;
}


export interface EpubSearchMatch {
	id: string;
	query: string;
	href: string;
	spineIndex: number;
	cfi?: string;
	preview: string;
	matchStart: number;
	matchEnd: number;
}


export interface EpubFontSettings {
	fontFamily?: string;
	fontSizePercent: number;
	lineHeight: number;
	letterSpacing?: number;
	wordSpacing?: number;
	marginPercent?: number;
}


export interface EpubViewSettings {
	theme: EpubTheme;
	flow: EpubReadingFlow;
	layout: EpubLayout;
	orientation: EpubOrientation;
	spread: EpubSpread;
	font: EpubFontSettings;
	enableHyphenation?: boolean;
	enableSelection?: boolean;
	enableTapToTurn?: boolean;
}


export interface EpubReaderState {
	bookId: number | string;
	location: EpubLocation;
	bookmarks: EpubBookmark[];
	annotations: EpubAnnotation[];
	lastOpenedAt: string;
	view: EpubViewSettings;
}


export interface EpubReadingStats {
	bookId: number | string;
	totalReadingTimeSec: number;
	currentStreakDays?: number;
	maxStreakDays?: number;
	completed: boolean;
	completedAt?: string;
	percentRead: number;
	wordsRead?: number;
	updatedAt: string;
}


export interface EpubDocument {
	bookId: number | string;
	package: EpubPackage;
	resources: EpubResourceMap;
	archivePath?: string;
	fileCount?: number;
	loadedAt: string;
}


export interface EpubPaginationInfo {
	totalLocations: number;
	currentLocationIndex: number;
	totalPagesApprox?: number;
	currentPageApprox?: number;
}


export interface EpubReaderSession {
	sessionId: string;
	bookId: number | string;
	startedAt: string;
	endedAt?: string;
	lastLocation: EpubLocation;
	pagination?: EpubPaginationInfo;
	isOffline?: boolean;
}
