/* Copyright (c) 2026, Yao Zeran 
 * 
 * The http api wrapper file. */


import { getAuthorizationHeader } from "@/utils/jwt";

const DEFAULT_TIMEOUT_MS = 10000;


/* Helper: Return the base url for the backend server */
function getBackendBaseUrl() {
  const DEFAULT_BACKEND_URL = "http://localhost:8080/api/v1";
  return (
    process.env.NEXT_PUBLIC_BACKEND_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.BACKEND_URL ??
    process.env.API_BASE_URL ??
    DEFAULT_BACKEND_URL
  );
}


/* Helper: Parse and build url into the form like:
 *   https://api.com/users?page=1&size=10&sort=name 
 * 
 * params:
 *   b: base 
 *   p: path
 *   q: query  */ 
function parseUrl(b: string, p: string, q?: Record<string, string | number | boolean>) {
  const base = b.replace(/\/$/, ""); // remove last slash '/'
  const path = p.startsWith("/") ? p : `/${p}`; // form as '/..'
  const url = new URL(base + path);
  if (q) {
    Object.entries(q).forEach(([k, v]) => {
      if (v !== undefined && v !== null) { url.searchParams.append(k, String(v)); }
    });
  }
  return url.toString();
}


/* Helper: Parse the response body and print it in the http error */
function parseResponseBody(response: Response) {
  const contentType = response.headers.get("content-type");
  if (response.status === 204) return undefined;
  if (contentType?.includes("application/json")) { return response.json(); }
  return response.text(); 
}


class HttpError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.body = body;
  }
}


type FetchOptions = RequestInit & {
  query?: Record<string, string | number | boolean>;
  timeout?: number;
};

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}


/* Fetch from the backend api: base + path url, 
 *   */
async function fetchJson<T>(path: string, options: FetchOptions = {}): Promise<T> {

  const { query, timeout, ...init } = options;
  const requestTimeout = timeout ?? DEFAULT_TIMEOUT_MS;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), requestTimeout);

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...init?.headers as Record<string, string>,
  };

  if (init.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  // Add JWT token to Authorization header if available
  const authHeader = getAuthorizationHeader();
  if (authHeader) {
    headers["Authorization"] = authHeader;
  }

  const response = await fetch(parseUrl(getBackendBaseUrl(), path, query), 
    {
      ...init,
      signal: init.signal ?? controller.signal,
      headers,
    }
  ).finally(() => clearTimeout(id));

  const body = await parseResponseBody(response);
  
  if (!response.ok) {
    throw new HttpError(
      body && typeof body === "object" && "message" in body
        ? String((body as { message?: unknown }).message)
        : `HTTP ${response.status}`,
      response.status,
      body
    );
  }
  if (response.status === 204) { return undefined as T; }

  if (
    body &&
    typeof body === "object" &&
    "code" in body &&
    "message" in body &&
    "data" in body
  ) {
    const apiBody = body as ApiResponse<T>;
    if (apiBody.code >= 400) {
      throw new HttpError(apiBody.message, apiBody.code, apiBody);
    }
    return apiBody.data;
  }

  return body as T;
}


/* Fetch from the backend api and return the raw binary response body. */
async function fetchBinaryResource(path: string, options: FetchOptions = {}): Promise<ArrayBuffer> {
  const { query, timeout, ...init } = options;
  const requestTimeout = timeout ?? DEFAULT_TIMEOUT_MS;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), requestTimeout);

  const response = await fetch(parseUrl(getBackendBaseUrl(), path, query),
    {
      ...init,
      signal: init.signal ?? controller.signal,
    }
  ).finally(() => clearTimeout(id));

  if (!response.ok) {
    const body = await parseResponseBody(response);
    throw new HttpError(
      body && typeof body === "object" && "message" in body
        ? String((body as { message?: unknown }).message)
        : `HTTP ${response.status}`,
      response.status,
      body,
    );
  }

  return await response.arrayBuffer();
}


const api = {
  get: <T>(path: string, options?: FetchOptions) =>
    fetchJson<T>(path, { ...options, method: "GET" }),

  post: <T>(path: string, body?: unknown, options?: FetchOptions) =>
    fetchJson<T>(path, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    }),

  put: <T>(path: string, body?: unknown, options?: FetchOptions) =>
    fetchJson<T>(path, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    }),

  delete: <T>(path: string, options?: FetchOptions) =>
    fetchJson<T>(path, { ...options, method: "DELETE" }),

  patch: <T>(path: string, body?: unknown, options?: FetchOptions) =>
    fetchJson<T>(path, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};


export { api, fetchBinaryResource, fetchJson, type FetchOptions, HttpError };
