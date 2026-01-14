/**
 * AWS Custom Lambda Authentication
 * 
 * This module handles authentication via your custom Lambda auth endpoint.
 * Tokens are stored locally and sent with each API request.
 */

import { AWS_CONFIG } from "./config";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  department?: string;
  roles?: string[];
}

export interface AuthSession {
  token: string;
  refreshToken?: string;
  expiresAt: number;
  user: AuthUser;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials extends LoginCredentials {
  name?: string;
  department?: string;
}

// Lambda auth response format
interface LambdaAuthResponse {
  statusCode?: number;
  body?: string;
  // Direct response format
  token?: string;
  refreshToken?: string;
  expiresIn?: number;
  user?: AuthUser;
  error?: string;
  message?: string;
}

/**
 * Get stored auth session
 */
export function getStoredSession(): AuthSession | null {
  try {
    const stored = localStorage.getItem(AWS_CONFIG.tokenStorageKey);
    if (!stored) return null;
    
    const session: AuthSession = JSON.parse(stored);
    
    // Check if expired
    if (session.expiresAt < Date.now()) {
      localStorage.removeItem(AWS_CONFIG.tokenStorageKey);
      return null;
    }
    
    return session;
  } catch {
    return null;
  }
}

/**
 * Store auth session
 */
function storeSession(session: AuthSession): void {
  localStorage.setItem(AWS_CONFIG.tokenStorageKey, JSON.stringify(session));
}

/**
 * Clear auth session
 */
export function clearSession(): void {
  localStorage.removeItem(AWS_CONFIG.tokenStorageKey);
}

/**
 * Get auth token for API requests
 */
export function getAuthToken(): string | null {
  const session = getStoredSession();
  return session?.token || null;
}

/**
 * Get current user
 */
export function getCurrentUser(): AuthUser | null {
  const session = getStoredSession();
  return session?.user || null;
}

/**
 * Parse Lambda proxy response
 */
function parseLambdaResponse(response: LambdaAuthResponse): LambdaAuthResponse {
  if (response.statusCode && response.body) {
    // Lambda proxy format
    try {
      return JSON.parse(response.body);
    } catch {
      return { error: response.body };
    }
  }
  // Direct response format
  return response;
}

/**
 * Login via Lambda auth endpoint
 */
export async function login(credentials: LoginCredentials): Promise<AuthSession> {
  const response = await fetch(`${AWS_CONFIG.apiGateway.authEndpoint}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(AWS_CONFIG.apiGateway.apiKey && { "x-api-key": AWS_CONFIG.apiGateway.apiKey }),
    },
    body: JSON.stringify(credentials),
  });

  const data: LambdaAuthResponse = await response.json();
  const parsed = parseLambdaResponse(data);

  if (!response.ok || parsed.error) {
    throw new Error(parsed.error || parsed.message || "Login failed");
  }

  if (!parsed.token || !parsed.user) {
    throw new Error("Invalid auth response: missing token or user");
  }

  const session: AuthSession = {
    token: parsed.token,
    refreshToken: parsed.refreshToken,
    expiresAt: Date.now() + (parsed.expiresIn || 3600) * 1000,
    user: parsed.user,
  };

  storeSession(session);
  return session;
}

/**
 * Signup via Lambda auth endpoint
 */
export async function signup(credentials: SignupCredentials): Promise<AuthSession> {
  const response = await fetch(`${AWS_CONFIG.apiGateway.authEndpoint}/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(AWS_CONFIG.apiGateway.apiKey && { "x-api-key": AWS_CONFIG.apiGateway.apiKey }),
    },
    body: JSON.stringify(credentials),
  });

  const data: LambdaAuthResponse = await response.json();
  const parsed = parseLambdaResponse(data);

  if (!response.ok || parsed.error) {
    throw new Error(parsed.error || parsed.message || "Signup failed");
  }

  if (!parsed.token || !parsed.user) {
    throw new Error("Invalid auth response: missing token or user");
  }

  const session: AuthSession = {
    token: parsed.token,
    refreshToken: parsed.refreshToken,
    expiresAt: Date.now() + (parsed.expiresIn || 3600) * 1000,
    user: parsed.user,
  };

  storeSession(session);
  return session;
}

/**
 * Logout - clears local session and optionally calls logout endpoint
 */
export async function logout(): Promise<void> {
  const token = getAuthToken();
  
  // Clear local session first
  clearSession();
  
  // Optionally notify backend
  if (token) {
    try {
      await fetch(`${AWS_CONFIG.apiGateway.authEndpoint}/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          ...(AWS_CONFIG.apiGateway.apiKey && { "x-api-key": AWS_CONFIG.apiGateway.apiKey }),
        },
      });
    } catch {
      // Ignore logout endpoint errors - session already cleared locally
    }
  }
}

/**
 * Refresh token if expired or about to expire
 */
export async function refreshSession(): Promise<AuthSession | null> {
  const session = getStoredSession();
  
  if (!session?.refreshToken) {
    return null;
  }
  
  // Refresh if expires within 5 minutes
  const shouldRefresh = session.expiresAt - Date.now() < 5 * 60 * 1000;
  
  if (!shouldRefresh) {
    return session;
  }
  
  try {
    const response = await fetch(`${AWS_CONFIG.apiGateway.authEndpoint}/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(AWS_CONFIG.apiGateway.apiKey && { "x-api-key": AWS_CONFIG.apiGateway.apiKey }),
      },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    });

    const data: LambdaAuthResponse = await response.json();
    const parsed = parseLambdaResponse(data);

    if (!response.ok || parsed.error || !parsed.token) {
      clearSession();
      return null;
    }

    const newSession: AuthSession = {
      token: parsed.token,
      refreshToken: parsed.refreshToken || session.refreshToken,
      expiresAt: Date.now() + (parsed.expiresIn || 3600) * 1000,
      user: parsed.user || session.user,
    };

    storeSession(newSession);
    return newSession;
  } catch {
    clearSession();
    return null;
  }
}
