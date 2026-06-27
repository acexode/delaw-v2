import { timestamp, uuid } from "drizzle-orm/pg-core";

// Reusable column builders. Functions (not shared instances) so every table
// gets a fresh column definition. Spec §3.1: UUID PKs via gen_random_uuid(),
// timestamptz created_at/updated_at, soft delete via nullable deleted_at.

export const uuidPk = () => uuid("id").primaryKey().defaultRandom();

export const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const deletedAt = () => timestamp("deleted_at", { withTimezone: true });
