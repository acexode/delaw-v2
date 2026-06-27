import {
  db,
  legalContent,
  organisations,
  researchSessions,
} from "@delaw/db";
import { and, desc, eq, sql } from "drizzle-orm";
import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";

import { aiServiceJson, aiServiceStream } from "../lib/ai-service";
import { AppError, notFound } from "../lib/errors";
import { researchSchema, searchSchema } from "../schemas/ai.schemas";

// AI proxy routes (spec §4.5). Each route enforces auth + AI-credit checks,
// then forwards to the internal Python AI service. Credit costs per spec §10.2.
const COST_QUICK = 3;
const COST_DEEP = 8;
const COST_SEARCH = 1;

const insufficientCredits = () =>
  new AppError(
    402,
    "INSUFFICIENT_CREDITS",
    "You have used all of your AI credits for this billing period.",
  );

/**
 * Atomically reserve `cost` credits for an organisation. The conditional
 * UPDATE only succeeds when the new total stays within quota, so concurrent
 * requests cannot overspend. Returns false when the org is over quota.
 */
async function reserveCredits(orgId: string, cost: number): Promise<boolean> {
  const rows = await db
    .update(organisations)
    .set({ aiCreditsUsed: sql`${organisations.aiCreditsUsed} + ${cost}` })
    .where(
      and(
        eq(organisations.id, orgId),
        sql`${organisations.aiCreditsUsed} + ${cost} <= ${organisations.aiCreditsQuota}`,
      ),
    )
    .returning({ used: organisations.aiCreditsUsed });
  return rows.length > 0;
}

/** Return reserved credits when a downstream AI call fails. */
async function refundCredits(orgId: string, cost: number): Promise<void> {
  await db
    .update(organisations)
    .set({ aiCreditsUsed: sql`GREATEST(${organisations.aiCreditsUsed} - ${cost}, 0)` })
    .where(eq(organisations.id, orgId));
}

interface ResearchSource {
  index: number;
  id: string;
  title: string;
  citation: string | null;
  court: string | null;
  year: number | null;
  authority_status: string;
  source_url: string | null;
  cited: boolean;
}

export const aiRoutes: FastifyPluginAsync = async (app) => {
  // POST /api/v1/ai/research — RAG research, streamed back as SSE.
  app.post(
    "/research",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const body = researchSchema.parse(request.body);
      const cost = body.mode === "DEEP" ? COST_DEEP : COST_QUICK;

      if (!(await reserveCredits(request.orgId, cost))) {
        throw insufficientCredits();
      }

      let aiRes: Response;
      try {
        aiRes = await aiServiceStream("/internal/research", {
          query: body.query,
          jurisdiction: body.jurisdiction,
          mode: body.mode,
          matter_context: body.matterContext ?? null,
        });
      } catch (error) {
        await refundCredits(request.orgId, cost);
        throw error;
      }

      reply.hijack();
      reply.raw.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      });

      const reader = aiRes.body!.getReader();
      const decoder = new TextDecoder();
      let answer = "";
      let sources: ResearchSource[] = [];
      let buffer = "";

      const onClose = () => reader.cancel().catch(() => undefined);
      request.raw.on("close", onClose);

      const consumeFrame = (frame: string) => {
        const line = frame.split("\n").find((l) => l.startsWith("data:"));
        if (!line) return;
        try {
          const event = JSON.parse(line.slice(5).trim());
          if (event.type === "token" && typeof event.text === "string") {
            answer += event.text;
          } else if (event.type === "sources" && Array.isArray(event.sources)) {
            sources = event.sources;
          }
        } catch {
          // Ignore malformed frames; the raw bytes are already forwarded.
        }
      };

      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          reply.raw.write(chunk);
          buffer += chunk;
          let sep: number;
          while ((sep = buffer.indexOf("\n\n")) !== -1) {
            consumeFrame(buffer.slice(0, sep));
            buffer = buffer.slice(sep + 2);
          }
        }
      } catch (error) {
        request.log.error(error, "research stream interrupted");
      } finally {
        request.raw.off("close", onClose);
        reply.raw.end();
      }

      // Persist the completed session (spec §5.2 step 10). The Node API holds
      // the tenant context the Python service intentionally does not.
      if (answer.trim().length > 0) {
        try {
          await db.insert(researchSessions).values({
            organisationId: request.orgId,
            userId: request.userId,
            matterId: body.matterId ?? null,
            query: body.query,
            jurisdiction: body.jurisdiction,
            mode: body.mode,
            aiAnswer: answer,
            sourcesUsed: sources,
          });
        } catch (error) {
          request.log.error(error, "failed to persist research session");
        }
      }
    },
  );

  // POST /api/v1/ai/research/search — hybrid vector + keyword search.
  app.post(
    "/research/search",
    { preHandler: [app.authenticate] },
    async (request) => {
      const body = searchSchema.parse(request.body);

      if (!(await reserveCredits(request.orgId, COST_SEARCH))) {
        throw insufficientCredits();
      }

      try {
        return await aiServiceJson("/internal/search", {
          query: body.query,
          jurisdiction: body.jurisdiction,
          filters: { content_type: body.filters.contentType ?? null },
          limit: body.limit,
        });
      } catch (error) {
        await refundCredits(request.orgId, COST_SEARCH);
        throw error;
      }
    },
  );

  // GET /api/v1/ai/research/sessions — recent research for the current user.
  app.get(
    "/research/sessions",
    { preHandler: [app.authenticate] },
    async (request) => {
      const { limit } = z
        .object({ limit: z.coerce.number().int().min(1).max(20).default(5) })
        .parse(request.query);

      const sessions = await db
        .select({
          id: researchSessions.id,
          query: researchSessions.query,
          jurisdiction: researchSessions.jurisdiction,
          mode: researchSessions.mode,
          createdAt: researchSessions.createdAt,
        })
        .from(researchSessions)
        .where(
          and(
            eq(researchSessions.organisationId, request.orgId),
            eq(researchSessions.userId, request.userId),
          ),
        )
        .orderBy(desc(researchSessions.createdAt))
        .limit(limit);

      return { sessions };
    },
  );

  // GET /api/v1/ai/legal-content/:id — a single authority for the case viewer.
  // legal_content is a shared global corpus (not tenant-scoped).
  app.get(
    "/legal-content/:id",
    { preHandler: [app.authenticate] },
    async (request) => {
      const { id } = z
        .object({ id: z.string().uuid("Invalid content id") })
        .parse(request.params);

      const [row] = await db
        .select()
        .from(legalContent)
        .where(eq(legalContent.id, id))
        .limit(1);

      if (!row) {
        throw notFound("Authority not found");
      }

      let overruledBy: { id: string; title: string; citation: string | null } | null =
        null;
      if (row.overruledBy) {
        const [parent] = await db
          .select({
            id: legalContent.id,
            title: legalContent.title,
            citation: legalContent.citation,
          })
          .from(legalContent)
          .where(eq(legalContent.id, row.overruledBy))
          .limit(1);
        overruledBy = parent ?? null;
      }

      return { case: { ...row, embedding: undefined, overruledByCase: overruledBy } };
    },
  );
};
