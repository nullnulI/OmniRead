/* Copyright (c) 2026, Yao Zeran
 * 
 * The book related types and interfaces. */


import type {
  EpubDocument,
  EpubIdentifier,
  EpubMetadata,
  EpubReaderState,
  EpubReadingStats,
} from "@/types/epub";


export interface BookMetadata {
  /* identifier
   * 
   *   id: system unique identifier
   *   epubIdentifier: point to epub file  */

  id: string;
  epubIdentifier?: EpubIdentifier;
  badgeIdentifier?: string;

  /* meta info 
   * 
   *   coverImage: url string  */

  title: string;
  coverImage?: string;
  description?: string;
  edition?: string;
  
  authorIds: string[];
  contributorIds?: string[];

  /* a book may not be published
   * 
   *   so it does not have a physcial form existing yet  */
  publisherId?: string;
  publishedDate?: string;

  seriesId?: string;
}


export interface Series {
  id: string,

  name: string,
  coverImage?: string,
  description?: string,

  authorIds: string[],

  publisherId?: string,
}


export interface Category {
  id: string;

  name: string;
  image?: string;
}


export interface BookSaleInfo {
  paperPrice?: number;
  paperInventory?: number;

  digitalPrice?: number;
  digitalInventory?: number;
}


export interface EpubInfo {
  metadata: EpubMetadata;
  sourcePath?: string;
}


export interface Book {
  metadata: BookMetadata;
  saleinfo: BookSaleInfo;
  epubinfo?: EpubInfo;
  epubIdentifier?: string;
  digitalPrice?: number;
}

export interface EpubBook extends Book {
  epubIdentifier: string;
  format: "epub";
  digitalPrice: number;
  epub: {
    metadata: EpubMetadata;
    source: unknown;
    document?: EpubDocument;
    initialLocation?: unknown;
    readerState?: EpubReaderState;
    readingStats?: EpubReadingStats;
  };
}
