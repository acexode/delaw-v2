import { inet, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { organisations, users } from "./auth";
import { createdAt, uuidPk } from "./_shared";

// Auth-support tables. Not in spec §3.2, but spec §8.1 explicitly calls for an
// "active sessions table" (revocable refresh tokens) and email OTP verification.
// Kept out of the locked users table; the users table is unchanged.

// Rotating refresh tokens (spec §8.1: 30-day, httpOnly cookie, rotated on use,
// revocable per session). Only the SHA-256 hash of the token is stored.
export const refreshTokens = pgTable("refresh_tokens", {
  id: uuidPk(),
  organisationId: uuid("organisation_id")
    .notNull()
    .references(() => organisations.id),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  tokenHash: text("token_hash").notNull().unique(),
  userAgent: text("user_agent"),
  ipAddress: inet("ip_address"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: createdAt(),
});

// Email verification OTPs (spec §4.2 verify-email / resend-verification). Only
// the SHA-256 hash of the OTP is stored; single-use via consumed_at.
export const emailVerifications = pgTable("email_verifications", {
  id: uuidPk(),
  organisationId: uuid("organisation_id")
    .notNull()
    .references(() => organisations.id),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  otpHash: text("otp_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: createdAt(),
});
