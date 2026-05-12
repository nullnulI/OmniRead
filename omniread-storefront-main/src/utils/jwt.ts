/* Copyright (c) 2026, Yao Zeran
 * 
 * JWT token management utilities for client-side storage and retrieval. */


const TOKEN_KEY = "omniread_auth_token";
const TOKEN_EXPIRY_KEY = "omniread_auth_expiry";
const REFRESH_TOKEN_KEY = "omniread_refresh_token";

function getTokenStorage(): Storage | null {
  if (typeof window === "undefined") return null; // SSR safe
  return window.sessionStorage;
}

/**
 * Store JWT token in tab-scoped sessionStorage with expiry time.
 */
export function setToken(accessToken: string, expiresIn: number, refreshToken?: string): void {
  const storage = getTokenStorage();
  if (!storage) return;
  
  storage.setItem(TOKEN_KEY, accessToken);
  const expiryTime = Date.now() + expiresIn * 1000;
  storage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());

  if (refreshToken) {
    storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

/**
 * Retrieve JWT token from tab-scoped sessionStorage if it hasn't expired.
 */
export function getToken(): string | null {
  const storage = getTokenStorage();
  if (!storage) return null;
  
  const token = storage.getItem(TOKEN_KEY);
  const expiry = storage.getItem(TOKEN_EXPIRY_KEY);
  
  if (!token || !expiry) return null;
  
  // Check if token has expired
  if (Date.now() > parseInt(expiry, 10)) {
    clearToken();
    return null;
  }
  
  return token;
}

/**
 * Clear JWT token from tab-scoped sessionStorage.
 */
export function clearToken(): void {
  const storage = getTokenStorage();
  if (!storage) return;
  
  storage.removeItem(TOKEN_KEY);
  storage.removeItem(TOKEN_EXPIRY_KEY);
  storage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * Retrieve refresh token from tab-scoped sessionStorage.
 */
export function getRefreshToken(): string | null {
  const storage = getTokenStorage();
  if (!storage) return null;
  return storage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Check if token exists and is valid.
 */
export function isTokenValid(): boolean {
  return getToken() !== null;
}

/**
 * Get Authorization header value for API requests.
 */
export function getAuthorizationHeader(): string | null {
  const token = getToken();
  return token ? `Bearer ${token}` : null;
}
