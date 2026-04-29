/* Copyright (c) 2026, Yao Zeran 
 * 
 * The api services that fetch book data from the backend server. */


import { Book, BookMetadata, BookSaleInfo, Category } from "@/types/book";

import { fetchJson } from "@/services/http";


interface BackendProduct {
  id: number;
  sku: string;
  isbn13?: string;
  title: string;
  authorName: string;
  publisher?: string;
  category?: string;
  bookType: "EBOOK" | "PHYSICAL" | "BUNDLE";
  price: number;
  coverImageUrl?: string;
  status: string;
}

const demoProducts: BackendProduct[] = [
  {
    id: 1,
    sku: "OMNI-PHY-001",
    isbn13: "9780134685991",
    title: "Effective Java",
    authorName: "Joshua Bloch",
    publisher: "Addison-Wesley",
    category: "Programming",
    bookType: "PHYSICAL",
    price: 58,
    status: "ACTIVE",
  },
  {
    id: 2,
    sku: "OMNI-PHY-002",
    isbn13: "9780201633610",
    title: "Design Patterns",
    authorName: "Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides",
    publisher: "Addison-Wesley",
    category: "Software Engineering",
    bookType: "PHYSICAL",
    price: 65,
    status: "ACTIVE",
  },
  {
    id: 3,
    sku: "OMNI-EBK-001",
    isbn13: "9781491950357",
    title: "Building Microservices",
    authorName: "Sam Newman",
    publisher: "O'Reilly Media",
    category: "Architecture",
    bookType: "EBOOK",
    price: 39,
    status: "ACTIVE",
  },
];


function fallbackCover(id: string | number) {
  const covers = [
    "/sample/cover/dune-cover.jpg",
    "/sample/cover/eminence-in-shadow-cover.jpg",
    "/sample/cover/solo-leveling-cover.jpg",
    "/sample/cover/spice-and-wolf-cover.jpg",
  ];
  const index = Math.abs(Number(id) || 0) % covers.length;
  return covers[index];
}


function toMetadata(product: BackendProduct): BookMetadata {
  return {
    id: String(product.id),
    epubIdentifier: product.bookType === "EBOOK"
      ? { id: "sample", scheme: "sample", value: "epub-sample" }
      : undefined,
    coverImage: product.coverImageUrl || fallbackCover(product.id),
    title: product.title,
    description: product.category
      ? `${product.title} is listed in ${product.category}.`
      : `${product.title} is available on OmniRead.`,
    authorIds: [product.authorName],
    publisherId: product.publisher,
    publishedDate: undefined,
  };
}


function toSaleInfo(product: BackendProduct): BookSaleInfo {
  if (product.bookType === "EBOOK") {
    return {
      digitalPrice: Number(product.price),
      digitalInventory: 9999,
    };
  }

  return {
    paperPrice: Number(product.price),
    paperInventory: 1,
  };
}


function toBook(product: BackendProduct): Book {
  return {
    metadata: toMetadata(product),
    saleinfo: toSaleInfo(product),
  };
}


export async function fetchProducts(): Promise<BackendProduct[]> {
  try {
    return await fetchJson<BackendProduct[]>("/books");
  } catch {
    return demoProducts;
  }
}


export async function fetchBookMetadata(bookId: string): Promise<BookMetadata> {
  const product = await fetchProduct(bookId);
  return toMetadata(product);
}


export async function fetchBookSaleInfo(bookId: string): Promise<BookSaleInfo> {
  const product = await fetchProduct(bookId);
  return toSaleInfo(product);
}


export async function fetchBook(bookId: string): Promise<Book> {
  const product = await fetchProduct(bookId);
  return toBook(product);
}


async function fetchProduct(bookId: string): Promise<BackendProduct> {
  try {
    return await fetchJson<BackendProduct>(`/books/${bookId}`);
  } catch {
    return demoProducts.find((product) => String(product.id) === String(bookId)) ?? demoProducts[0];
  }
}


export async function fetchCategories(): Promise<Category[]> {
  const products = await fetchProducts();
  const categoryNames = Array.from(
    new Set(products.map((product) => product.category).filter((value): value is string => Boolean(value)))
  );

  return categoryNames.map((name) => ({
    id: name,
    name,
    image: "https://via.placeholder.com/150",
  }));
}


export async function fetchBooksByCategoryName(categoryName: string): Promise<BookMetadata[]> {
  const products = await fetchProducts();
  return products
    .filter((product) => product.category?.toLowerCase() === decodeURIComponent(categoryName).toLowerCase())
    .map(toMetadata);
}


export async function fetchTrendingBooksMetadata(): Promise<BookMetadata[]> {
  const products = await fetchProducts();
  return products.map(toMetadata);
}


export async function fetchBooksRecommended(userId: string): Promise<Record<string, Book>> {
  void userId;
  const products = await fetchProducts();
  return Object.fromEntries(products.slice(0, 3).map((product) => [String(product.id), toBook(product)]));
}


export async function fetchAuthorDisplayName(bookId: string, authorId: string): Promise<string | null> {
  void bookId;
  return authorId || null;
}


export async function fetchAuthorDisplayNames(bookId: string, authorIds: string[]): Promise<string[]> {
  void bookId;
  return authorIds.filter((name) => Boolean(name && name.trim().length > 0));
}


export async function fetchPublisherDisplayName(bookId: string, publisherId: string): Promise<string> {
  void bookId;
  return publisherId || "Unknown Publisher";
}
