import type { EpubIdentifier } from "@/types/epub";

import { fetchBinaryResource, fetchJson } from "../http";


const sampleEpubIdentifier: EpubIdentifier = {
  id: "isbn",
  scheme: "isbn",
  value: "123"
}


export async function fetchEpubIdentifier(id: string) {
  try {
    const identifier = await fetchJson<EpubIdentifier>("/book/epub_identifier", {
      query: { bookId: id }, 
    });
    return identifier;
  } catch { return sampleEpubIdentifier }
}


export async function fetchEpubFile(identifier: EpubIdentifier): Promise<ArrayBuffer> {
  try {
    return await fetchBinaryResource("/epub", {
      query: { id: identifier.id, value: identifier.value },
    });
  } catch {
    const sampleResponse = await fetch("/sample/epub-sample.epub");
    if (!sampleResponse.ok) {
      throw new Error("Failed to load sample EPUB");
    }
    return await sampleResponse.arrayBuffer();
  }
}
