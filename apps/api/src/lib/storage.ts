import { randomUUID } from "node:crypto";

import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "../config/env";
import { AppError } from "./errors";

// Cloudflare R2 is S3-compatible (spec §9.1). Files are private; downloads use
// short-lived signed URLs (spec §8.2: 15-minute expiry, never public objects).

const SIGNED_URL_TTL_SECONDS = 15 * 60; // spec §8.2

let cachedClient: S3Client | null = null;

export function storageConfigured(): boolean {
  return Boolean(
    env.R2_ACCOUNT_ID &&
      env.R2_ACCESS_KEY_ID &&
      env.R2_SECRET_ACCESS_KEY &&
      env.R2_BUCKET_NAME,
  );
}

function client(): S3Client {
  if (!storageConfigured()) {
    throw new AppError(
      503,
      "STORAGE_UNCONFIGURED",
      "File storage is not configured on this environment.",
    );
  }
  if (!cachedClient) {
    cachedClient = new S3Client({
      region: "auto",
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return cachedClient;
}

/** A storage key namespaced by org + document, with a random suffix. */
export function buildObjectKey(
  orgId: string,
  documentId: string,
  fileName: string,
): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  return `documents/${orgId}/${documentId}/${randomUUID()}-${safeName}`;
}

export async function uploadObject(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  await client().send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

/** A time-limited download URL for a stored object (spec §8.2). */
export async function signedDownloadUrl(key: string): Promise<string> {
  return getSignedUrl(
    client(),
    new GetObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: key }),
    { expiresIn: SIGNED_URL_TTL_SECONDS },
  );
}
