import { env } from "./config/env";

import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import Fastify, { type FastifyInstance } from "fastify";
import { ZodError } from "zod";

import { AppError } from "./lib/errors";
import { registerTenancy } from "./plugins/tenant";
import { aiRoutes } from "./routes/ai";
import { authRoutes } from "./routes/auth";

export async function buildServer(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: env.isTest
      ? false
      : {
          level: env.isProd ? "info" : "debug",
          // Never log credentials (spec §8.2).
          redact: ["req.headers.authorization", "req.headers.cookie"],
        },
    trustProxy: true,
  });

  // CORS — allow the web app origin with credentials (refresh cookie).
  await app.register(cors, {
    origin: env.WEB_ORIGIN,
    credentials: true,
  });

  // Cookies — refresh token transport (httpOnly, secure, sameSite strict).
  await app.register(cookie);

  // Rate limiting (spec §8.1). Global default; login is stricter per-route.
  await app.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: "1 minute",
    errorResponseBuilder: () => ({
      error: "Too Many Requests",
      message: "Rate limit exceeded. Please try again shortly.",
      statusCode: 429,
    }),
  });

  // JWT — RS256 asymmetric, 15-minute access tokens (spec §8.1).
  await app.register(jwt, {
    secret: { private: env.jwtPrivateKey, public: env.jwtPublicKey },
    sign: { algorithm: "RS256", expiresIn: env.ACCESS_TOKEN_TTL },
    verify: { algorithms: ["RS256"] },
  });

  registerTenancy(app);

  // Centralised error handler — consistent { error, message, statusCode } shape.
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: error.error,
        message: error.message,
        statusCode: error.statusCode,
      });
    }

    if (error instanceof ZodError) {
      const message = error.issues
        .map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`)
        .join("; ");
      return reply.status(400).send({
        error: "Bad Request",
        message,
        statusCode: 400,
      });
    }

    const statusCode = error.statusCode ?? 500;
    if (statusCode >= 500) {
      request.log.error(error);
    }
    return reply.status(statusCode).send({
      error: error.code ?? error.name ?? "Internal Server Error",
      message: statusCode >= 500 ? "Internal server error" : error.message,
      statusCode,
    });
  });

  app.get("/health", async () => ({ status: "ok", service: "delaw-api" }));

  await app.register(authRoutes, { prefix: "/api/v1/auth" });
  await app.register(aiRoutes, { prefix: "/api/v1/ai" });

  return app;
}
