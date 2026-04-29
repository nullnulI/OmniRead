"use client";

import { useEffect, useMemo, useState } from "react";

import type { EpubDocument, EpubFile, EpubIdentifier, EpubManifestItem } from "@/types/epub";
import { fetchEpubFile } from "@/services/api/epub";
import { loadEpubFromArrayBuffer, parseEpubPackage } from "@/services/epub";


function getPackageBasePath(document: EpubDocument) {
	const archivePath = document.archivePath ?? "";
	const lastSlash = archivePath.lastIndexOf("/");
	return lastSlash >= 0 ? archivePath.slice(0, lastSlash + 1) : "";
}


function getFile(files: Map<string, EpubFile>, document: EpubDocument, item: EpubManifestItem | null) {
	if (!item) return null;
	const direct = files.get(item.href);
	if (direct) return direct;
	return files.get(`${getPackageBasePath(document)}${item.href}`) ?? null;
}


function sanitizeChapterHtml(html: string) {
	if (typeof DOMParser === "undefined") return html;
	const parser = new DOMParser();
	const doc = parser.parseFromString(html, "application/xhtml+xml");
	doc.querySelectorAll("script").forEach((script) => script.remove());
	const body = doc.querySelector("body");
	return body?.innerHTML || html;
}


function getInitialReadableIndex(document: EpubDocument) {
	const readableIndex = document.package.spine.items.findIndex((item) => {
		const manifestItem = document.resources.byId[item.idref];
		const label = `${item.idref} ${manifestItem?.id ?? ""} ${manifestItem?.href ?? ""}`.toLowerCase();
		return !label.includes("toc") && !label.includes("nav") && !label.includes("copyright");
	});

	return readableIndex >= 0 ? readableIndex : 0;
}


function EpubReader({ identifier }: Readonly<{ identifier: EpubIdentifier }>) {
	const { id, scheme, value } = identifier;
	const [files, setFiles] = useState<Map<string, EpubFile> | null>(null);
	const [document, setDocument] = useState<EpubDocument | null>(null);
	const [spineIndex, setSpineIndex] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		async function loadEpub() {
			setLoading(true);
			setError(null);
			try {
				const nextIdentifier = { id, scheme, value };
				const epubBuffer = await fetchEpubFile(nextIdentifier);
				const nextFiles = await loadEpubFromArrayBuffer(epubBuffer, `${value}.epub`);
				const nextDocument = await parseEpubPackage(nextFiles, value);

				if (!cancelled) {
					setFiles(nextFiles);
					setDocument(nextDocument);
					setSpineIndex(getInitialReadableIndex(nextDocument));
				}
			} catch (err) {
				if (!cancelled) {
					setError(err instanceof Error ? err.message : "Failed to load EPUB");
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		}

		loadEpub();
		return () => {
			cancelled = true;
		};
	}, [id, scheme, value]);

	const spineItem = document?.package.spine.items[spineIndex];
	const manifestItem = spineItem ? document?.resources.byId[spineItem.idref] ?? null : null;
	const chapterFile = files && document ? getFile(files, document, manifestItem) : null;
	const chapterHtml = useMemo(() => {
		if (!chapterFile || typeof chapterFile.data !== "string") return "<p>No readable chapter content.</p>";
		return sanitizeChapterHtml(chapterFile.data);
	}, [chapterFile]);

	if (loading) {
		return <main className="p-6">Loading EPUB...</main>;
	}

	if (error) {
		return <main className="p-6">Failed to load EPUB: {error}</main>;
	}

	if (!document) {
		return <main className="p-6">No EPUB data loaded.</main>;
	}

	const totalChapters = document.package.spine.items.length;
	const canGoPrevious = spineIndex > 0;
	const canGoNext = spineIndex < totalChapters - 1;

	return (
		<main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 md:px-8">
			<section className="mx-auto flex max-w-5xl flex-col gap-4">
				<div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
					<p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">EPUB Reader</p>
					<h1 className="mt-1 text-2xl font-semibold">{document.package.metadata.title}</h1>
					<p className="mt-1 text-sm text-slate-600">
						Chapter {spineIndex + 1} of {totalChapters}
					</p>
				</div>

				<div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
					<button
						type="button"
						disabled={!canGoPrevious}
						onClick={() => setSpineIndex((value) => Math.max(0, value - 1))}
						className="rounded-md border border-slate-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
					>
						Previous
					</button>
					<select
						value={spineIndex}
						onChange={(event) => setSpineIndex(Number(event.target.value))}
						className="min-w-52 rounded-md border border-slate-300 px-3 py-2 text-sm"
					>
						{document.package.spine.items.map((item, index) => (
							<option key={`${item.idref}-${index}`} value={index}>
								{index + 1}. {document.resources.byId[item.idref]?.id ?? item.idref}
							</option>
						))}
					</select>
					<button
						type="button"
						disabled={!canGoNext}
						onClick={() => setSpineIndex((value) => Math.min(totalChapters - 1, value + 1))}
						className="rounded-md border border-slate-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
					>
						Next
					</button>
				</div>

				<article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-8">
					<div
						className="prose max-w-none leading-7"
						dangerouslySetInnerHTML={{ __html: chapterHtml }}
					/>
				</article>
			</section>
		</main>
	);
}


export default EpubReader;
