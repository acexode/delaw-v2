import {
  boolean,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { organisations, users } from "./auth";
import { createdAt, deletedAt, updatedAt, uuidPk } from "./_shared";

// Supports the notifications module (spec §4.6: list, mark read, preferences).
// Not defined inline in §3.2; modelled on the standard tenant-scoped pattern.

export const notifications = pgTable("notifications", {
  id: uuidPk(),
  organisationId: uuid("organisation_id")
    .notNull()
    .references(() => organisations.id),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  resourceType: text("resource_type"),
  resourceId: uuid("resource_id"),
  isRead: boolean("is_read").notNull().default(false),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  deletedAt: deletedAt(),
});
