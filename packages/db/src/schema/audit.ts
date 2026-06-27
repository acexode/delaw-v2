import { inet, jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";

import { organisations, users } from "./auth";
import { createdAt, uuidPk } from "./_shared";

// Spec §3.2 — audit_logs.

export const auditLogs = pgTable("audit_logs", {
  id: uuidPk(),
  organisationId: uuid("organisation_id")
    .notNull()
    .references(() => organisations.id),
  userId: uuid("user_id").references(() => users.id),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: uuid("resource_id"),
  metadata: jsonb("metadata").notNull().default({}),
  ipAddress: inet("ip_address"),
  createdAt: createdAt(),
});
