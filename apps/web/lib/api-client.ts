import type {
  ApiErrorBody,
  CreateDocumentRequest,
  CreateFolderRequest,
  DocumentListResponse,
  DocumentResponse,
  DocumentVersionResponse,
  DocumentVersionsResponse,
  FolderResponse,
  FoldersResponse,
  ForgotPasswordRequest,
  LegalContentResponse,
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  RegisterRequest,
  RegisterResponse,
  ResearchRequest,
  ResearchSessionsResponse,
  ResearchStreamEvent,
  ResendVerificationRequest,
  ResetPasswordRequest,
  SearchRequest,
  SearchResponse,
  SessionResponse,
  SuccessResponse,
  TemplatesResponse,
  TotpChallengeRequest,
  UpdateDocumentRequest,
  UpdateFolderRequest,
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

/** Legal research endpoints (apps/api `/api/v1/ai/*`, spec §4.5). */
export const researchApi = {
  search: (input: SearchRequest) =>
    request<SearchResponse>("/api/v1/ai/research/search", {
      method: "POST",
      body: input,
    }),

  recentSessions: (limit = 5) =>
    request<ResearchSessionsResponse>(
      `/api/v1/ai/research/sessions?limit=${limit}`,
    ),

  getCase: (id: string) =>
    request<LegalContentResponse>(`/api/v1/ai/legal-content/${id}`),
};

interface DocumentListParams {
  folderId?: string;
  matterId?: string;
  type?: string;
  status?: string;
  search?: string;
}

/** Document + folder endpoints (apps/api `/api/v1/documents`, spec §4.4). */
export const documentsApi = {
  list: (params: DocumentListParams = {}) => {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) qs.set(key, value);
    }
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request<DocumentListResponse>(`/api/v1/documents${suffix}`);
  },

  get: (id: string) => request<DocumentResponse>(`/api/v1/documents/${id}`),

  create: (input: CreateDocumentRequest) =>
    request<DocumentResponse>("/api/v1/documents", {
      method: "POST",
      body: input,
    }),

  update: (id: string, input: UpdateDocumentRequest) =>
    request<DocumentResponse>(`/api/v1/documents/${id}`, {
      method: "PATCH",
      body: input,
    }),

  remove: (id: string) =>
    request<SuccessResponse>(`/api/v1/documents/${id}`, { method: "DELETE" }),

  listVersions: (id: string) =>
    request<DocumentVersionsResponse>(`/api/v1/documents/${id}/versions`),

  createVersion: (id: string, label?: string) =>
    request<DocumentVersionResponse>(`/api/v1/documents/${id}/versions`, {
      method: "POST",
      body: { label },
    }),

  templates: (params: { category?: string; source?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.category) qs.set("category", params.category);
    if (params.source) qs.set("source", params.source);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request<TemplatesResponse>(`/api/v1/documents/templates${suffix}`);
  },

  upload: (id: string, file: File) => uploadDocumentFile(id, file),
};

/** Folder endpoints (apps/api `/api/v1/folders`, spec §4.4). */
export const foldersApi = {
  list: () => request<FoldersResponse>("/api/v1/folders"),

  create: (input: CreateFolderRequest) =>
    request<FolderResponse>("/api/v1/folders", { method: "POST", body: input }),

  update: (id: string, input: UpdateFolderRequest) =>
    request<FolderResponse>(`/api/v1/folders/${id}`, {
      method: "PATCH",
      body: input,
    }),

  remove: (id: string) =>
    request<SuccessResponse>(`/api/v1/folders/${id}`, { method: "DELETE" }),
};

/**
 * Upload a PDF/DOCX to a document (multipart). The shared `request` helper only
 * sends JSON, so this issues its own fetch with the bearer token and a single
 * 401 refresh-and-retry, mirroring the rest of the client.
 */
async function uploadDocumentFile(
  id: string,
  file: File,
): Promise<DocumentResponse> {
  const open = async (): Promise<Response> => {
    const form = new FormData();
    form.append("file", file);
    const headers: Record<string, string> = {};
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(`${API_BASE}/api/v1/documents/${id}/upload`, {
      method: "POST",
      credentials: "include",
      headers,
      body: form,
    });
  };

  let res = await open();
  if (res.status === 401) {
    const refreshed = await refreshSession();
    if (refreshed) res = await open();
    else clearTokens();
  }

  if (!res.ok) {
    const parsed = (await parseBody(res)) as ApiErrorBody | null;
    throw new ApiError(
      res.status,
      parsed && typeof parsed === "object" ? parsed : null,
    );
  }
  return (await parseBody(res)) as DocumentResponse;
}

export interface ResearchStreamHandlers {
  onEvent: (event: ResearchStreamEvent) => void;
  signal?: AbortSignal;
}

/**
 * Stream POST /api/v1/ai/research as Server-Sent Events.
 *
 * Native EventSource cannot send a POST body or an Authorization header, so we
 * read the streamed response with fetch + a ReadableStream reader and parse the
 * SSE frames ourselves. Handles a single 401 refresh-and-retry like `request`.
 */
export async function streamResearch(
  input: ResearchRequest,
  { onEvent, signal }: ResearchStreamHandlers,
): Promise<void> {
  const open = async (): Promise<Response> => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    };
    const token = getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return fetch(`${API_BASE}/api/v1/ai/research`, {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify(input),
      signal,
    });
  };

  let res = await open();
  if (res.status === 401) {
    const refreshed = await refreshSession();
    if (refreshed) {
      res = await open();
    } else {
      clearTokens();
    }
  }

  if (!res.ok || !res.body) {
    const parsed = (await parseBody(res)) as ApiErrorBody | null;
    throw new ApiError(res.status, parsed && typeof parsed === "object" ? parsed : null);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const flush = (frame: string) => {
    const line = frame.split("\n").find((l) => l.startsWith("data:"));
    if (!line) return;
    try {
      onEvent(JSON.parse(line.slice(5).trim()) as ResearchStreamEvent);
    } catch {
      // Ignore keep-alives / malformed frames.
    }
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let sep: number;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      flush(buffer.slice(0, sep));
      buffer = buffer.slice(sep + 2);
    }
  }
}

export { request as apiRequest };
