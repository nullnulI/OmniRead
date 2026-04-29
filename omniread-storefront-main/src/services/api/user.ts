/* Copyright (c) 2026, Yao Zeran 
 * 
 * The api services that fetch user data from the backend server. */


import type { User } from "@/types/user";
import type { EpubIdentifier } from "@/types/epub";

import { fetchJson } from "@/services/http";



export async function fetchUser(userId: number | string) {
  return fetchJson<User>(`/users/${userId}`);
}


export async function fetchUserEpubView(userId: number | string, epubId: EpubIdentifier) {
  void userId;
  void epubId;
  return null;
}

