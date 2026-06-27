import type { AccessTokenClaims } from "@delaw/types";

// Client-side session helpers.
//
// The refresh token lives in an httpOnly cookie owned by the API and is never
// readable here. We only manage the short-lived (15 min) access token, kept in
// memory for the session and mirrored to localStorage so a page reload can
// rehydrate it before the first /refresh round-trip.

const ACCESS_TOKEN_KEY = "delaw.accessToken";

let inMemoryToken: string | null = null;

const isBrowser = (): boolean => typeof window !== "undefined";

export function storeTokens(accessToken: string): void {
  inMemoryToken = accessToken;
  if (isBrowser()) {
    try {
      window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    } catch {
      // localStorage may be unavailable (private mode); memory copy still works.
    }
  }
}

export function getAccessToken(): string | null {
  if (inMemoryToken) {
    return inMemoryToken;
  }
  if (isBrowser()) {
    try {
      inMemoryToken = window.localStorage.getItem(ACCESS_TOKEN_KEY);
    } catch {
      inMemoryToken = null;
    }
  }
  return inMemoryToken;
}

export function clearTokens(): void {
  inMemoryToken = null;
  if (isBrowser()) {
    try {
      window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    } catch {
      // ignore
    }
  }
}

/** Decode a JWT payload without verifying its signature (the API verifies). */
export function decodeToken(token: string): AccessTokenClaims | null {
  const segment = token.split(".")[1];
  if (!segment) {
    return null;
  }
  try {
    const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    const json = isBrowser()
      ? window.atob(padded)
      : Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json) as AccessTokenClaims;
  } catch {
    return null;
  }
}

/** The currently authenticated user, derived from the access-token claims. */
export function getCurrentUser(): AccessTokenClaims | null {
  const token = getAccessToken();
  if (!token) {
    return null;
  }
  return decodeToken(token);
}

/** True when a non-expired access token is present. */
export function isAuthenticated(): boolean {
  const claims = getCurrentUser();
  if (!claims?.exp) {
    return false;
  }
  return claims.exp * 1000 > Date.now();
}
