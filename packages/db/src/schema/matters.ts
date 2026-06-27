import { sql } from "drizzle-orm";
import {
  date,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { organisations, users } from "./auth";
import { clients } from "./clients";
import {
  billingTypeEnum,
  eventTypeEnum,
  matterStatusEnum,
  matterTypeEnum,
  taskPriorityEnum,
  taskStatusEnum,
} from "./enums";
import { createdAt, deletedAt, updatedAt, uuidPk } from "./_shared";

// Spec §3.2 — matters, matter_team, matter_events, tasks.

export const matters = pgTable("matters", {
  id: uuidPk(),
  organisationId: uuid("organisation_id")
    .notNull()
    .references(() => organisations.id),
  matterNumber: text("matter_number").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  type: matterTypeEnum("type").notNull(),
  practiceArea: text("practice_area").notNull(),
  status: matterStatusEnum("status").notNull(),
  court: text("court"),
  suitNumber: text("suit_number"),
  judge: text("judge"),
  jurisdiction: text("jurisdiction").notNull().default("NG"),
  clientId: uuid("client_id").references(() => clients.id),
  leadLawyerId: uuid("lead_lawyer_id").references(() => users.id),
  billingType: billingTypeEnum("billing_type"),
  hourlyRate: numeric("hourly_rate", { precision: 12, scale: 2 }),
  fixedFee: numeric("fixed_fee", { precision: 12, scale: 2 }),
  currency: text("currency").notNull().default("NGN"),
  openedAt: date("opened_at").notNull().default(sql`CURRENT_DATE`),
  closedAt: date("closed_at"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  deletedAt: deletedAt(),
});

export const matterTeam = pgTable(
  "matter_team",
  {
    matterId: uuid("matter_id")
      .notNull()
      .references(() => matters.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    role: text("role").notNull().default("MEMBER"),
    addedAt: timestamp("added_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.matterId, table.userId] }),
  }),
);

export const matterEvents = pgTable("matter_events", {
  id: uuidPk(),
  organisationId: uuid("organisation_id")
    .notNull()
    .references(() => organisations.id),
  matterId: uuid("matter_id")
    .notNull()
    .references(() => matters.id),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  type: eventTypeEnum("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  eventDate: timestamp("event_date", { withTimezone: true }).notNull(),
  court: text("court"),
  outcome: text("outcome"),
  createdAt: createdAt(),
});

export const tasks = pgTable("tasks", {
  id: uuidPk(),
  organisationId: uuid("organisation_id")
    .notNull()
    .references(() => organisations.id),
  matterId: uuid("matter_id").references(() => matters.id),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  assignedTo: uuid("assigned_to").references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  status: taskStatusEnum("status").notNull(),
  priority: taskPriorityEnum("priority").notNull(),
  dueDate: date("due_date"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});
