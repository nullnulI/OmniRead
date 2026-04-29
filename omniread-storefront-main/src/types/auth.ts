/* Copyright (c) 2026, Yao Zeran
 * 
 * The authentication related types and interfaces. */


export interface EmailLoginPayload {
  email: string;
  password: string;
}


export interface EmailRegistrationPayload {
  email: string;
  name?: string;
  fullName?: string;
  password: string;
  verificationCode?: string;
}


export interface SentVerificationCodeResponse {
  success: boolean;
  expiresInSec: number;
}


export interface JwtToken {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  refreshToken?: string;
}


export interface AuthResponse {
  user: unknown;
  token: JwtToken;
}

export interface BackendAuthResponse {
  tokenType: "Bearer";
  accessToken: string;
  expiresInSeconds: number;
  userId: number;
  email: string;
  fullName: string;
  role: "CUSTOMER" | "INVENTORY_ADMIN" | "SUPPLIER" | "SYSTEM_ADMIN";
}
