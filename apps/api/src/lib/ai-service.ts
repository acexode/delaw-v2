import { env } from "../config/env";
import { AppError } from "./errors";

// Thin client for the internal Python AI service (spec §5.6). The shared secret
// is sent as X-Service-Secret on every call. Never exposed to the frontend.

const BASE = env.AI_SERVICE_URL.replace(/\/$/, "");

function headers(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "X-Service-Secret": env.AI_SERVICE_SECRET,
  };
}

const badGateway = (message: string) =>
  new AppError(502, "AI_SERVICE_UNAVAILABLE", message);

/** Call a JSON endpoint and parse the JSON response. */
export async function aiServiceJson<T>(
  path: string,
  body: unknown,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    });
  } catch {
    throw badGateway("AI service is unreachable");
  }
  if (!res.ok) {
    throw badGateway(`AI service returned ${res.status}`);
  }
  return (await res.json()) as T;
}

/**
 * Open a streaming (SSE) connection to the AI service. Returns the raw web
 * Response so the caller can pipe `response.body` straight to the client while
 * also inspecting frames for persistence.
 */
export async function aiServiceStream(
  path: string,
  body: unknown,
): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    });
  } catch {
    throw badGateway("AI service is unreachable");
  }
  if (!res.ok || !res.body) {
    throw badGateway(`AI service returned ${res.status}`);
  }
  return res;
}
