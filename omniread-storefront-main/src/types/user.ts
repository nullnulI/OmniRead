/* Copyright (c) 2026, Yao Zeran
 * 
 * The user related types and interfaces. */


export type UserRole = "CUSTOMER" | "INVENTORY_ADMIN" | "SUPPLIER" | "SYSTEM_ADMIN";
export type UserType = "reader" | "author";


export interface UserMetadata {
  id: string;
  email: string;
  name: string;
  role?: UserRole;
}


export interface ReaderProfile {
  role: 'reader';
  id: string;

  subscribedUserIds?: string[];
}


export interface AuthorProfile {
  role: 'author';
  id: string;

  penName: string;
  authorBio: string;

  authorIdentity?: AuthorIdentity; 

  subscribedUserIds?: string[];
}


export interface AuthorIdentity {
  name: string;
  country: string; // iso
  id: string;
}


export type UserProfile = ReaderProfile | AuthorProfile;


export interface User {
  id: string;
  email: string;
  name: string;
  role: UserType;
  subscribedAuthors: string[];
  metadata: UserMetadata;
  profile?: UserProfile;
}

export interface BackendUser {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  status?: string;
  supplierCompanyName?: string;
}

export function mapBackendUser(user: BackendUser): User {
  return {
    id: String(user.id),
    email: user.email,
    name: user.fullName,
    role: "reader",
    subscribedAuthors: [],
    metadata: {
      id: String(user.id),
      email: user.email,
      name: user.fullName,
      role: user.role,
    },
    profile: {
      id: String(user.id),
      role: "reader",
      subscribedUserIds: [],
    },
  };
}
