import {
  db,
  emailVerifications,
  organisations,
  refreshTokens,
  subscriptions,
  users,
} from "@delaw/db";
import bcrypt from "bcrypt";
import { and, desc, eq, isNull } from "drizzle-orm";
import type {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { env } from "../config/env";
import {
  decryptSecret,
  encryptSecret,
  randomNumericOtp,
  randomToken,
  sha256,
} from "../lib/crypto";
import { badRequest, conflict, unauthorized } from "../lib/errors";
import {
  type AccessTokenPayload,
  type ChallengeTokenPayload,
  issueRefreshToken,
  signAccessToken,
  signChallengeToken,
} from "../lib/tokens";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  totpChallengeSchema,
  totpDisableSchema,
  totpVerifySchema,
  verifyEmailSchema,
} from "../schemas/auth.schemas";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from "../services/email";
import {
  buildKeyUri,
  buildQrDataUrl,
  generateTotpSecret,
  verifyTotpCode,
} from "../services/totp";

const BCRYPT_COST = 12; // spec §8.1
const REFRESH_COOKIE = "refresh_token";
const REFRESH_PATH = "/api/v1/auth";
const OTP_TTL_MS = 15 * 60 * 1000; // 15 minutes
const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour (spec §8.1)

type DbUser = typeof users.$inferSelect;

function setRefreshCookie(
  reply: FastifyReply,
  token: string,
  expiresAt: Date,
): void {
  reply.setCookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "strict",
    path: REFRESH_PATH,
    expires: expiresAt,
  });
}

function clearRefreshCookie(reply: FastifyReply): void {
  reply.clearCookie(REFRESH_COOKIE, { path: REFRESH_PATH });
}

function slugify(value: string): string {
  const base = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || "org";
}

async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name);
  let candidate = base;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const hit = await db
      .select({ id: organisations.id })
      .from(organisations)
      .where(eq(organisations.slug, candidate))
      .limit(1);
    if (hit.length === 0) {
      return candidate;
    }
    candidate = `${base}-${randomToken(2)}`;
  }
  return `${base}-${randomToken(4)}`;
}

function publicUser(user: DbUser) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    organisationId: user.organisationId,
    onboardingComplete: user.onboardingComplete,
    totpEnabled: user.totpEnabled,
  };
}

async function issueSession(
  app: FastifyInstance,
  reply: FastifyReply,
  request: FastifyRequest,
  user: DbUser,
): Promise<string> {
  const payload: AccessTokenPayload = {
    sub: user.id,
    orgId: user.organisationId,
    role: user.role,
    email: user.email,
  };
  const accessToken = signAccessToken(app, payload);
  const { token, expiresAt } = await issueRefreshToken(
    request,
    user.id,
    user.organisationId,
  );
  setRefreshCookie(reply, token, expiresAt);
  return accessToken;
}

export const authRoutes: FastifyPluginAsync = async (app) => {
  // POST /register — create org + first user (PARTNER). Spec §4.2.
  app.post("/register", async (request, reply) => {
    const input = registerSchema.parse(request.body);

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);
    if (existing.length > 0) {
      throw conflict("An account with this email already exists");
    }

    const slug = await uniqueSlug(input.organisationName);
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);

    const created = await db.transaction(async (tx) => {
      const [org] = await tx
        .insert(organisations)
        .values({
          name: input.organisationName,
          slug,
          type: input.organisationType,
          plan: input.plan,
          planStatus: "TRIALING",
          country: input.country,
        })
        .returning();
      if (!org) {
        throw new Error("Failed to create organisation");
      }

      const [user] = await tx
        .insert(users)
        .values({
          organisationId: org.id,
          email: input.email,
          passwordHash,
          fullName: input.fullName,
          role: "PARTNER",
          phone: input.phone ?? null,
        })
        .returning();
      if (!user) {
        throw new Error("Failed to create user");
      }

      await tx.insert(subscriptions).values({
        organisationId: org.id,
        plan: input.plan,
        status: "TRIALING",
      });

      return { org, user };
    });

    const otp = randomNumericOtp(6);
    await db.insert(emailVerifications).values({
      organisationId: created.org.id,
      userId: created.user.id,
      otpHash: sha256(otp),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    });
    await sendVerificationEmail(created.user.email, otp);
    await sendWelcomeEmail(created.user.email, created.user.fullName);

    const accessToken = await issueSession(app, reply, request, created.user);

    return reply.status(201).send({
      accessToken,
      user: publicUser(created.user),
      organisation: {
        id: created.org.id,
        name: created.org.name,
        slug: created.org.slug,
        type: created.org.type,
        plan: created.org.plan,
      },
    });
  });

  // POST /login — email + password. Returns a JWT pair, or a 2FA challenge.
  app.post(
    "/login",
    { config: { rateLimit: { max: 5, timeWindow: "15 minutes" } } },
    async (request, reply) => {
      const input = loginSchema.parse(request.body);

      const [user] = await db
        .select()
        .from(users)
        .where(and(eq(users.email, input.email), isNull(users.deletedAt)))
        .limit(1);

      if (!user || !user.isActive) {
        throw unauthorized("Invalid email or password");
      }
      const passwordOk = await bcrypt.compare(input.password, user.passwordHash);
      if (!passwordOk) {
        throw unauthorized("Invalid email or password");
      }

      if (user.totpEnabled) {
        const challengeToken = signChallengeToken(app, user.id);
        return reply.send({ totpRequired: true, challengeToken });
      }

      await db
        .update(users)
        .set({ lastLoginAt: new Date() })
        .where(eq(users.id, user.id));

      const accessToken = await issueSession(app, reply, request, user);
      return reply.send({ accessToken, user: publicUser(user) });
    },
  );

  // POST /logout — revoke the current refresh token. Spec §4.2 (Required).
  app.post(
    "/logout",
    { preHandler: app.authenticate },
    async (request, reply) => {
      const raw = request.cookies[REFRESH_COOKIE];
      if (raw) {
        await db
          .update(refreshTokens)
          .set({ revokedAt: new Date() })
          .where(eq(refreshTokens.tokenHash, sha256(raw)));
      }
      clearRefreshCookie(reply);
      return reply.send({ success: true });
    },
  );

  // POST /refresh — rotate the refresh token and mint a new access token.
  app.post("/refresh", async (request, reply) => {
    const raw = request.cookies[REFRESH_COOKIE];
    if (!raw) {
      throw unauthorized("Missing refresh token");
    }

    const [record] = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, sha256(raw)))
      .limit(1);

    if (
      !record ||
      record.revokedAt !== null ||
      record.expiresAt.getTime() < Date.now()
    ) {
      clearRefreshCookie(reply);
      throw unauthorized("Invalid or expired refresh token");
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, record.userId))
      .limit(1);
    if (!user || !user.isActive) {
      clearRefreshCookie(reply);
      throw unauthorized("Account is not active");
    }

    // Rotate: revoke the used token, issue a fresh one (spec §8.1).
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.id, record.id));

    const accessToken = await issueSession(app, reply, request, user);
    return reply.send({ accessToken });
  });

  // POST /verify-email — verify the emailed OTP (single-use, 15-min).
  app.post("/verify-email", async (request, reply) => {
    const input = verifyEmailSchema.parse(request.body);

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);
    if (!user) {
      throw badRequest("Invalid or expired verification code");
    }

    const [record] = await db
      .select()
      .from(emailVerifications)
      .where(
        and(
          eq(emailVerifications.userId, user.id),
          isNull(emailVerifications.consumedAt),
        ),
      )
      .orderBy(desc(emailVerifications.createdAt))
      .limit(1);

    if (
      !record ||
      record.expiresAt.getTime() < Date.now() ||
      record.otpHash !== sha256(input.otp)
    ) {
      throw badRequest("Invalid or expired verification code");
    }

    await db
      .update(emailVerifications)
      .set({ consumedAt: new Date() })
      .where(eq(emailVerifications.id, record.id));

    return reply.send({ success: true, verified: true });
  });

  // POST /resend-verification — issue a fresh OTP. Always 200 (no enumeration).
  app.post("/resend-verification", async (request, reply) => {
    const input = resendVerificationSchema.parse(request.body);

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        organisationId: users.organisationId,
      })
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    if (user) {
      const otp = randomNumericOtp(6);
      await db.insert(emailVerifications).values({
        organisationId: user.organisationId,
        userId: user.id,
        otpHash: sha256(otp),
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      });
      await sendVerificationEmail(user.email, otp);
    }

    return reply.send({ success: true });
  });

  // POST /forgot-password — email a reset link. Always 200 (no enumeration).
  app.post("/forgot-password", async (request, reply) => {
    const input = forgotPasswordSchema.parse(request.body);

    const [user] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(and(eq(users.email, input.email), isNull(users.deletedAt)))
      .limit(1);

    if (user) {
      const token = randomToken(32);
      await db
        .update(users)
        .set({ passwordResetToken: sha256(token), passwordResetAt: new Date() })
        .where(eq(users.id, user.id));
      await sendPasswordResetEmail(user.email, token);
    }

    return reply.send({ success: true });
  });

  // POST /reset-password — consume a reset token, set a new password.
  app.post("/reset-password", async (request, reply) => {
    const input = resetPasswordSchema.parse(request.body);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.passwordResetToken, sha256(input.token)))
      .limit(1);

    if (
      !user ||
      !user.passwordResetAt ||
      user.passwordResetAt.getTime() + RESET_TTL_MS < Date.now()
    ) {
      throw badRequest("Invalid or expired reset token");
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);
    await db
      .update(users)
      .set({ passwordHash, passwordResetToken: null, passwordResetAt: null })
      .where(eq(users.id, user.id));

    // Invalidate all existing sessions on password change.
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(refreshTokens.userId, user.id),
          isNull(refreshTokens.revokedAt),
        ),
      );

    return reply.send({ success: true });
  });

  // POST /totp/setup — generate secret, store encrypted, return QR. Required.
  app.post(
    "/totp/setup",
    { preHandler: app.authenticate },
    async (request, reply) => {
      const [user] = await db
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(eq(users.id, request.userId))
        .limit(1);
      if (!user) {
        throw unauthorized();
      }

      const secret = generateTotpSecret();
      await db
        .update(users)
        .set({ totpSecret: encryptSecret(secret) })
        .where(eq(users.id, user.id));

      const otpauthUrl = buildKeyUri(user.email, secret);
      const qrCode = await buildQrDataUrl(otpauthUrl);

      return reply.send({ secret, otpauthUrl, qrCode });
    },
  );

  // POST /totp/verify — confirm a code and enable 2FA. Required.
  app.post(
    "/totp/verify",
    { preHandler: app.authenticate },
    async (request, reply) => {
      const input = totpVerifySchema.parse(request.body);

      const [user] = await db
        .select({ id: users.id, totpSecret: users.totpSecret })
        .from(users)
        .where(eq(users.id, request.userId))
        .limit(1);
      if (!user || !user.totpSecret) {
        throw badRequest("TOTP has not been set up");
      }

      if (!(await verifyTotpCode(input.code, decryptSecret(user.totpSecret)))) {
        throw badRequest("Invalid TOTP code");
      }

      await db
        .update(users)
        .set({ totpEnabled: true })
        .where(eq(users.id, user.id));

      return reply.send({ success: true, totpEnabled: true });
    },
  );

  // POST /totp/disable — disable 2FA, confirmed with the account password.
  app.post(
    "/totp/disable",
    { preHandler: app.authenticate },
    async (request, reply) => {
      const input = totpDisableSchema.parse(request.body);

      const [user] = await db
        .select({ id: users.id, passwordHash: users.passwordHash })
        .from(users)
        .where(eq(users.id, request.userId))
        .limit(1);
      if (!user) {
        throw unauthorized();
      }

      if (!(await bcrypt.compare(input.password, user.passwordHash))) {
        throw unauthorized("Invalid password");
      }

      await db
        .update(users)
        .set({ totpEnabled: false, totpSecret: null })
        .where(eq(users.id, user.id));

      return reply.send({ success: true, totpEnabled: false });
    },
  );

  // POST /totp/challenge — complete a 2FA login, issue the JWT pair. Public.
  app.post("/totp/challenge", async (request, reply) => {
    const input = totpChallengeSchema.parse(request.body);

    let payload: ChallengeTokenPayload;
    try {
      payload = app.jwt.verify(
        input.challengeToken,
      ) as unknown as ChallengeTokenPayload;
    } catch {
      throw unauthorized("Invalid or expired challenge token");
    }

    if (payload.typ !== "totp_challenge" || !payload.sub) {
      throw unauthorized("Invalid challenge token");
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);
    if (!user || !user.totpEnabled || !user.totpSecret) {
      throw unauthorized("Two-factor authentication is not enabled");
    }

    if (!(await verifyTotpCode(input.code, decryptSecret(user.totpSecret)))) {
      throw unauthorized("Invalid TOTP code");
    }

    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    const accessToken = await issueSession(app, reply, request, user);
    return reply.send({ accessToken, user: publicUser(user) });
  });
};
