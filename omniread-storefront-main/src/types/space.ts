/* Copyright (c) 2026, Yao Zeran
 * 
 * Space related interfaces and types */


import type { BookMetadata, Category } from "@/types/book";


export interface DigitalBookshelf {
  bookIds?: BookMetadata[];
  bookCategoryMap?: Record<string, Category>;
}


export interface PhysicalBookBadges {
  bookIds?: BookMetadata[];
  bookCategoryMap?: Record<string, Category>;
}


export interface Badge {
  id: string;
  name: string;
  image?: string;
}


export interface BadgeDisplayBox {
  badgeIds?: Badge[];
}


export interface BookReview {
  id: string;

  bookId: string;
  writerId: string;

  rating: number; // book rating range from 0 - 100

  content: string;
  
  views: number;
  likes: number;
  dislikes: number;

  date: string;
}


export interface Comment {
  id: string;

  writer: string;
  
  content: string;

  views: number;
  likes:number;
  dislikes: number;
}


export interface MailMessage {
	id: number;

	sender: string;
	subject: string;

  content: string;

	time: string;

	unread?: boolean;
};
