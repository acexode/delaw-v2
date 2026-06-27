import type {
  ApiErrorBody,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  RegisterRequest,
  RegisterResponse,
  ResendVerificationRequest,
  ResetPasswordRequest,
  SessionResponse,
  SuccessResponse,
  TotpChallengeRequest,
  VerifyEmailRequest,
  VerifyEmailResponse,
} from "@delaw/types";

import { clearTokens, getAccessToken, storeTokens } from "./auth";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
).replace(/\/$/, "");

const REFRESH_PATH = "/api/v1/auth/refresh";

/** Typed error thrown for any non-2xx API response. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly body: ApiErrorBody | null;

  constructor(status: number, body: ApiErrorBody | null, fallback?: string) {
    super(body?.message ?? fallback ?? `Request failed (${status})`);
    this.name = "ApiError";
    this.status = status;
    this.code = body?.error ?? "Error";
    this.body = body;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  /** Attach the bearer access token (default true). */
  auth?: boolean;
  /** Skip the refresh-and-retry dance on 401 (used by auth endpoints). */
  skipRefresh?: boolean;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

async function parseBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

let refreshInFlight: Promise<boolean> | null = null;

/** Rotate the refresh cookie for a new access token. De-duped across callers. */
async function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(`${API_BASE}${REFRESH_PATH}`, {
          method: "POST",
          credentials: "include",
        });
        if (!res.ok) {
          return false;
        }
        const data = (await parseBody(res)) as RefreshResponse | null;
        if (data?.accessToken) {
          storeTokens(data.accessToken);
          return true;
        }
        return false;
      } catch {
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

/**
 * Attempt to mint a fresh access token from the httpOnly refresh cookie.
 * Returns true when a new token was stored. Used by the route guard on load.
 */
export async function refreshAccessToken(): Promise<boolean> {
  return refreshSession();
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = "GET",
    body,
    auth = true,
    skipRefresh = false,
    headers = {},
    signal,
  } = options;

  const run = async (): Promise<Response> => {
    const finalHeaders: Record<string, string> = { ...headers };
    if (body !== undefined) {
      finalHeaders["Content-Type"] = "application/json";
    }
    if (auth) {
      const token = getAccessToken();
      if (token) {
        finalHeaders.Authorization = `Bearer ${token}`;
      }
    }
    return fetch(`${API_BASE}${path}`, {
      method,
      credentials: "include",
      headers: finalHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  };

  let res = await run();

  if (res.status === 401 && !skipRefresh) {
    const refreshed = await refreshSession();
    if (refreshed) {
      res = await run();
    } else {
      clearTokens();
    }
  }

  if (!res.ok) {
    const parsed = (await parseBody(res)) as ApiErrorBody | null;
    throw new ApiError(
      res.status,
      parsed && typeof parsed === "object" ? parsed : null,
    );
  }

  return (await parseBody(res)) as T;
}

/** Auth endpoints (apps/api `/api/v1/auth/*`). */
export const authApi = {
  register: (input: RegisterRequest) =>
    request<RegisterResponse>("/api/v1/auth/register", {
      method: "POST",
      body: input,
      auth: false,
      skipRefresh: true,
    }),

  login: (input: LoginRequest) =>
    request<LoginResponse>("/api/v1/auth/login", {
      method: "POST",
      body: input,
      auth: false,
      skipRefresh: true,
    }),

  totpChallenge: (input: TotpChallengeRequest) =>
    request<SessionResponse>("/api/v1/auth/totp/challenge", {
      method: "POST",
      body: input,
      auth: false,
      skipRefresh: true,
    }),

  logout: () =>
    request<SuccessResponse>("/api/v1/auth/logout", { method: "POST" }),

  verifyEmail: (input: VerifyEmailRequest) =>
    request<VerifyEmailResponse>("/api/v1/auth/verify-email", {
      method: "POST",
      body: input,
      auth: false,
      skipRefresh: true,
    }),

  resendVerification: (input: ResendVerificationRequest) =>
    request<SuccessResponse>("/api/v1/auth/resend-verification", {
      method: "POST",
      body: input,
      auth: false,
      skipRefresh: true,
    }),

  forgotPassword: (input: ForgotPasswordRequest) =>
    request<SuccessResponse>("/api/v1/auth/forgot-password", {
      method: "POST",
      body: input,
      auth: false,
      skipRefresh: true,
    }),

  resetPassword: (input: ResetPasswordRequest) =>
    request<SuccessResponse>("/api/v1/auth/reset-password", {
      method: "POST",
      body: input,
      auth: false,
      skipRefresh: true,
    }),
};

/** User endpoints. */
export const usersApi = {
  // NOTE: PATCH /api/v1/users/me/onboarding is not yet implemented on the API
  // (only the auth routes exist in this sprint). The onboarding page calls this
  // optimistically and tolerates a 404 — see follow-ups in the task report.
  updateOnboarding: (input: { completedItems: string[]; complete?: boolean }) =>
    request<SuccessResponse>("/api/v1/users/me/onboarding", {
      method: "PATCH",
      body: input,
    }),
};

export { request as apiRequest };
