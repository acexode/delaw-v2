import {
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { organisations, users } from "./auth";
import { createdAt, deletedAt, updatedAt, uuidPk } from "./_shared";

// Spec §3.2 — workflows. workflow_runs records each execution (spec §4.6
// "trigger, test run") and is not defined inline in §3.2. `trigger_type` is
// free-text per §3.3.

export const workflows = pgTable("workflows", {
  id: uuidPk(),
  organisationId: uuid("organisation_id")
    .notNull()
    .references(() => organisations.id),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  triggerType: text("trigger_type").notNull(),
  triggerConfig: jsonb("trigger_config").notNull().default({}),
  steps: jsonb("steps").notNull().default([]),
  isActive: boolean("is_active").notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const workflowRuns = pgTable("workflow_runs", {
  id: uuidPk(),
  organisationId: uuid("organisation_id")
    .notNull()
    .references(() => organisations.id),
  workflowId: uuid("workflow_id")
    .notNull()
    .references(() => workflows.id),
  status: text("status").notNull().default("PENDING"),
  triggerPayload: jsonb("trigger_payload").notNull().default({}),
  result: jsonb("result"),
  error: text("error"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  deletedAt: deletedAt(),
});
