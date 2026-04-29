/* Copyright (c) 2026, Yao Zeran
 *
 * EPUB service index file - exports all EPUB-related utilities. */

export { parseEpubPackage, EpubParseError } from "@/services/epub/parser";
export {
	loadEpubFromFile,
	loadEpubFromArrayBuffer,
	loadEpubFromUrl,
	EpubLoadError,
} from "@/services/epub/loader";
