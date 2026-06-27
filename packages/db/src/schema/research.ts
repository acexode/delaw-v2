import { jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";

import { organisations, users } from "./auth";
import { matters } from "./matters";
import { createdAt, uuidPk } from "./_shared";

// Spec §3.2 — research_sessions. `mode` is free-text per §3.3
// (QUICK | DEEP | CASE_LAW).

export const researchSessions = pgTable("research_sessions", {
  id: uuidPk(),
  organisationId: uuid("organisation_id")
    .notNull()
    .references(() => organisations.id),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  matterId: uuid("matter_id").references(() => matters.id),
  query: text("query").notNull(),
  jurisdiction: text("jurisdiction").notNull().default("NG"),
  mode: text("mode").notNull(),
  aiAnswer: text("ai_answer"),
  sourcesUsed: jsonb("sources_used"),
  createdAt: createdAt(),
});
