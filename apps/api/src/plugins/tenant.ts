import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { unauthorized } from "../lib/errors";

// Multi-tenancy / auth guard (spec §2.3). Decorates the root instance with an
// `authenticate` preHandler used on protected routes: it verifies the access
// JWT and attaches the tenant context (orgId, userId, userRole) to the request.
// Throws 401 if the token is missing/invalid or lacks tenant context.
export function registerTenancy(app: FastifyInstance): void {
  app.decorateRequest("userId", "");
  app.decorateRequest("orgId", "");
  app.decorateRequest("userRole", "");

  app.decorate(
    "authenticate",
    async function authenticate(request: FastifyRequest, _reply: FastifyReply) {
      try {
        await request.jwtVerify();
      } catch {
        throw unauthorized("Invalid or expired access token");
      }

      const { sub, orgId, role } = request.user;
      if (!sub || !orgId) {
        throw unauthorized("Token is missing tenant context");
      }

      request.userId = sub;
      request.orgId = orgId;
      request.userRole = role;
    },
  );
}
