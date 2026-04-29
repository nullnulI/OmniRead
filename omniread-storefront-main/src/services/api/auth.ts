/* Copyright (c) 2026, Yao Zeran 
 * 
 * The api services that fetch and post auth data from the backend server. */


import { fetchJson } from "@/services/http";

import type {
  BackendAuthResponse,
  EmailLoginPayload,
  EmailRegistrationPayload,
  SentVerificationCodeResponse,
} from "@/types/auth";
import type { User } from "@/types/user";
import { mapBackendUser } from "@/types/user";

import { setToken } from "@/utils/jwt";


export async function sendEmailVerificationCode(email: string): Promise<SentVerificationCodeResponse> {
  if (!email.trim()) {
    throw new Error("Email is required");
  }

  return {
    success: true,
    expiresInSec: 300,
  };
}


function mapAuthResponse(response: BackendAuthResponse): User {
  setToken(response.accessToken, response.expiresInSeconds);
  return mapBackendUser({
    id: response.userId,
    email: response.email,
    fullName: response.fullName,
    role: response.role,
  });
}


export async function registerWithEmail(payload: EmailRegistrationPayload): Promise<User> {
  const response = await fetchJson<BackendAuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      fullName: payload.fullName ?? payload.name,
      email: payload.email,
      password: payload.password,
      role: "CUSTOMER",
    }),
  });
  return mapAuthResponse(response);
}


export async function loginWithEmail(payload: EmailLoginPayload): Promise<User> {
  const response = await fetchJson<BackendAuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return mapAuthResponse(response);
}


export async function fetchCurrentUser(): Promise<User> {
  const user = await fetchJson<import("@/types/user").BackendUser>("/auth/me");
  return mapBackendUser(user);
}
