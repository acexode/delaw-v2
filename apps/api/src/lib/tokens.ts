import { db, refreshTokens } from "@delaw/db";
import type { FastifyInstance, FastifyRequest } from "fastify";

import { env } from "../config/env";
import { randomToken, sha256 } from "./crypto";

// Access token payload (spec §4 / task): { sub, orgId, role, email }.
export interface AccessTokenPayload {
  sub: string;
  orgId: string;
  role: string;
  email: string;
}

// Short-lived token issued mid-login when 2FA is enabled; exchanged at
// /totp/challenge for the real token pair.
export interface ChallengeTokenPayload {
  sub: string;
  typ: "totp_challenge";
}

export function signAccessToken(
  app: FastifyInstance,
  payload: AccessTokenPayload,
): string {
  // expiresIn (15m) comes from the @fastify/jwt sign config (spec §8.1).
  return app.jwt.sign(payload);
}

export function signChallengeToken(
  app: FastifyInstance,
  userId: string,
): string {
  const payload: ChallengeTokenPayload = { sub: userId, typ: "totp_challenge" };
  return app.jwt.sign(payload as unknown as AccessTokenPayload, {
    expiresIn: "5m",
  });
}

export interface IssuedRefreshToken {
  token: string;
  expiresAt: Date;
}

// Creates a new opaque refresh token, persisting only its SHA-256 hash
// (spec §8.1: rotating, revocable, 30-day).
export async function issueRefreshToken(
  request: FastifyRequest,
  userId: string,
  organisationId: string,
): Promise<IssuedRefreshToken> {
  const token = randomToken(32);
  const expiresAt = new Date(
    Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  );
  await db.insert(refreshTokens).values({
    organisationId,
    userId,
    tokenHash: sha256(token),
    userAgent: request.headers["user-agent"] ?? null,
    ipAddress: request.ip,
    expiresAt,
  });
  return { token, expiresAt };
}
