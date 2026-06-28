import "dotenv/config";
import { z } from "zod";

// Loaded + validated once at startup. Import this module first so dotenv runs
// before anything reads process.env (e.g. the @delaw/db client).

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default("0.0.0.0"),
  WEB_ORIGIN: z.string().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_PRIVATE_KEY_BASE64: z.string().min(1, "JWT_PRIVATE_KEY_BASE64 is required"),
  JWT_PUBLIC_KEY_BASE64: z.string().min(1, "JWT_PUBLIC_KEY_BASE64 is required"),
  TOTP_ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-fA-F]{64}$/, "TOTP_ENCRYPTION_KEY must be 32 bytes (64 hex chars)"),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  RESEND_API_KEY: z.string().default(""),
  EMAIL_FROM: z.string().default("noreply@delaw.africa"),
  // Python AI service (spec §4.5 / §5.6). The API is the only caller; it
  // authenticates with the shared secret over the private network.
  AI_SERVICE_URL: z.string().default("http://localhost:8000"),
  AI_SERVICE_SECRET: z.string().default(""),
  // Cloudflare R2 — S3-compatible file storage (spec §9.1 / §14.2). Optional in
  // local dev; the upload route returns a clear error when unconfigured.
  R2_ACCOUNT_ID: z.string().default(""),
  R2_ACCESS_KEY_ID: z.string().default(""),
  R2_SECRET_ACCESS_KEY: z.string().default(""),
  R2_BUCKET_NAME: z.string().default(""),
  R2_PUBLIC_URL: z.string().default(""),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const message = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid environment configuration:\n${message}`);
}

const raw = parsed.data;

const decode = (b64: string) => Buffer.from(b64, "base64").toString("utf8");

export const env = {
  ...raw,
  jwtPrivateKey: decode(raw.JWT_PRIVATE_KEY_BASE64),
  jwtPublicKey: decode(raw.JWT_PUBLIC_KEY_BASE64),
  isProd: raw.NODE_ENV === "production",
  isTest: raw.NODE_ENV === "test",
};

export type Env = typeof env;
