import {
  boolean,
  date,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { organisations, users } from "./auth";
import { clients } from "./clients";
import { matters } from "./matters";
import { invoiceStatusEnum } from "./enums";
import { createdAt, deletedAt, updatedAt, uuidPk } from "./_shared";

// Spec §3.2 — time_entries, invoices. invoice_line_items supports invoice
// generation from time entries (spec §4.6) and is not defined inline in §3.2.

export const invoices = pgTable("invoices", {
  id: uuidPk(),
  organisationId: uuid("organisation_id")
    .notNull()
    .references(() => organisations.id),
  matterId: uuid("matter_id").references(() => matters.id),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id),
  invoiceNumber: text("invoice_number").notNull(),
  status: invoiceStatusEnum("status").notNull(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
  discount: numeric("discount", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 })
    .notNull()
    .default("7.5"),
  taxAmount: numeric("tax_amount", { precision: 12, scale: 2 }).notNull(),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("NGN"),
  dueDate: date("due_date").notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  paymentRef: text("payment_ref"),
  notes: text("notes"),
  createdAt: createdAt(),
});

export const timeEntries = pgTable("time_entries", {
  id: uuidPk(),
  organisationId: uuid("organisation_id")
    .notNull()
    .references(() => organisations.id),
  matterId: uuid("matter_id")
    .notNull()
    .references(() => matters.id),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  description: text("description").notNull(),
  durationMins: integer("duration_mins").notNull(),
  rate: numeric("rate", { precision: 12, scale: 2 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("NGN"),
  isBillable: boolean("is_billable").notNull().default(true),
  isInvoiced: boolean("is_invoiced").notNull().default(false),
  invoiceId: uuid("invoice_id").references(() => invoices.id),
  date: date("date").notNull(),
  createdAt: createdAt(),
});

export const invoiceLineItems = pgTable("invoice_line_items", {
  id: uuidPk(),
  organisationId: uuid("organisation_id")
    .notNull()
    .references(() => organisations.id),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id),
  timeEntryId: uuid("time_entry_id").references(() => timeEntries.id),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 12, scale: 2 })
    .notNull()
    .default("1"),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  deletedAt: deletedAt(),
});
