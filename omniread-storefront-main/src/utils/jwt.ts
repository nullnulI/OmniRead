/* Copyright (c) 2026, Yao Zeran
 * 
 * JWT token management utilities for client-side storage and retrieval. */


const TOKEN_KEY = "omniread_auth_token";
const TOKEN_EXPIRY_KEY = "omniread_auth_expiry";
const REFRESH_TOKEN_KEY = "omniread_refresh_token";

/**
 * Store JWT token in localStorage with expiry time.
 */
export function setToken(accessToken: string, expiresIn: number, refreshToken?: string): void {
  if (typeof window === "undefined") return; // SSR safe
  
  localStorage.setItem(TOKEN_KEY, accessToken);
  const expiryTime = Date.now() + expiresIn * 1000;
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());

  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

/**
 * Retrieve JWT token from localStorage if it hasn't expired.
 */
export function getToken(): string | null {
  if (typeof window === "undefined") return null; // SSR safe
  
  const token = localStorage.getItem(TOKEN_KEY);
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  
  if (!token || !expiry) return null;
  
  // Check if token has expired
  if (Date.now() > parseInt(expiry, 10)) {
    clearToken();
    return null;
  }
  
  return token;
}

/**
 * Clear JWT token from localStorage.
 */
export function clearToken(): void {
  if (typeof window === "undefined") return; // SSR safe
  
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * Retrieve refresh token from localStorage.
 */
export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null; // SSR safe
  return localStorage.getItem(REFRESH_TOKEN_KEY);
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
