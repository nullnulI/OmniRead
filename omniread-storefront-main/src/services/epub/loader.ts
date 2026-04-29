/* Copyright (c) 2026, Yao Zeran
 *
 * EPUB loader service for loading EPUB files from various sources
 *   (File, ArrayBuffer, URL) and extracting the ZIP archive contents. */

import type { EpubFile } from "@/types/epub";
import JSZip from "jszip";


export class EpubLoadError extends Error {
	constructor(message: string) {
		super(`EPUB Load Error: ${message}`);
		this.name = "EpubLoadError";
	}
}


/* Helper: Load JSZip library dynamically */
async function loadZipLibrary(): Promise<typeof JSZip> {
	try {
		return JSZip;
	} catch {
		throw new EpubLoadError(
			"JSZip library not available. Install 'jszip' package to parse EPUB files."
		);
	}
}


/* Public API: Load EPUB from File
 *
 * Reads a File object and extracts all files from the EPUB archive.
 * Returns a map of file paths to EpubFile objects. */
export async function loadEpubFromFile(file: File): Promise<Map<string, EpubFile>> {
	if (!file) {
		throw new EpubLoadError("File is required");
	}

	const buffer = await file.arrayBuffer();
	return loadEpubFromArrayBuffer(buffer, file.name);
}


/* Public API: Load EPUB from ArrayBuffer
 *
 * Parses an ArrayBuffer containing EPUB data and extracts all files.
 * Returns a map of file paths to EpubFile objects. */
export async function loadEpubFromArrayBuffer(
	buffer: ArrayBuffer,
	fileName?: string,
): Promise<Map<string, EpubFile>> {
	if (!buffer || buffer.byteLength === 0) {
		throw new EpubLoadError("ArrayBuffer is empty");
	}
	void fileName;

	try {
		const JSZip = await loadZipLibrary();
		const zip = new JSZip();
		await zip.loadAsync(buffer);

		const files = new Map<string, EpubFile>();

		// Iterate through all files in the ZIP
		zip.forEach((relativePath, file) => {
			// Skip directories
			if (file.dir) return;

			// Normalize path (use forward slashes)
			const normalizedPath = relativePath.replace(/\\/g, "/");

			files.set(normalizedPath, {
				path: normalizedPath,
				data: "", // Will be populated below
			});
		});

		// Extract file contents
		const extractPromises = Array.from(files.entries()).map(async ([path, fileEntry]) => {
			try {
				const zipFile = zip.file(path);
				if (!zipFile) return;

				// Determine if binary or text based on extension
				const isBinary = isBinaryFile(path);

				if (isBinary) {
					const arrayBuffer = await zipFile.async("arraybuffer");
					fileEntry.data = arrayBuffer;
					fileEntry.mediaType = getMediaType(path);
				} else {
					const text = await zipFile.async("text");
					fileEntry.data = text;
					fileEntry.mediaType = getMediaType(path);
				}
			} catch (error) {
				console.warn(`Failed to extract file ${path}:`, error);
			}
		});

		await Promise.all(extractPromises);

		if (files.size === 0) {
			throw new EpubLoadError("EPUB archive appears to be empty");
		}

		return files;
	} catch (error) {
		if (error instanceof EpubLoadError) throw error;
		throw new EpubLoadError(`Failed to load EPUB: ${error instanceof Error ? error.message : String(error)}`);
	}
}


/* Public API: Load EPUB from URL
 *
 * Fetches an EPUB file from a URL and extracts all files.
 * Returns a map of file paths to EpubFile objects. */
export async function loadEpubFromUrl(url: string): Promise<Map<string, EpubFile>> {
	if (!url) {
		throw new EpubLoadError("URL is required");
	}

	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new EpubLoadError(`HTTP ${response.status}: ${response.statusText}`);
		}

		const buffer = await response.arrayBuffer();
		return loadEpubFromArrayBuffer(buffer, url);
	} catch (error) {
		if (error instanceof EpubLoadError) throw error;
		throw new EpubLoadError(`Failed to fetch EPUB from URL: ${error instanceof Error ? error.message : String(error)}`);
	}
}


/* Helper: Check if file is binary based on extension */
function isBinaryFile(path: string): boolean {
	const binaryExtensions = [
		".jpg",
		".jpeg",
		".png",
		".gif",
		".webp",
		".svg",
		".ttf",
		".otf",
		".woff",
		".woff2",
		".mp3",
		".mp4",
		".m4a",
	];

	const ext = path.toLowerCase().substring(path.lastIndexOf("."));
	return binaryExtensions.includes(ext);
}


/* Helper: Get media type based on file extension */
function getMediaType(path: string): string {
	const mediaTypes: Record<string, string> = {
		".xhtml": "application/xhtml+xml",
		".html": "text/html",
		".htm": "text/html",
		".xml": "application/xml",
		".css": "text/css",
		".js": "application/javascript",
		".json": "application/json",
		".txt": "text/plain",
		".jpg": "image/jpeg",
		".jpeg": "image/jpeg",
		".png": "image/png",
		".gif": "image/gif",
		".webp": "image/webp",
		".svg": "image/svg+xml",
		".ttf": "font/ttf",
		".otf": "font/otf",
		".woff": "font/woff",
		".woff2": "font/woff2",
		".mp3": "audio/mpeg",
		".mp4": "video/mp4",
		".m4a": "audio/mp4",
		".ncx": "application/x-dtbncx+xml",
	};

	const ext = path.toLowerCase().substring(path.lastIndexOf("."));
	return mediaTypes[ext] || "application/octet-stream";
}
