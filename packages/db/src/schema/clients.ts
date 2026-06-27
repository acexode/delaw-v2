import { pgTable, text, uuid } from "drizzle-orm/pg-core";

import { organisations, users } from "./auth";
import { clientTypeEnum } from "./enums";
import { createdAt, deletedAt, updatedAt, uuidPk } from "./_shared";

// Spec §3.2 — clients.

export const clients = pgTable("clients", {
  id: uuidPk(),
  organisationId: uuid("organisation_id")
    .notNull()
    .references(() => organisations.id),
  type: clientTypeEnum("type").notNull(),
  fullName: text("full_name").notNull(),
  companyName: text("company_name"),
  email: text("email"),
  phone: text("phone"),
  whatsapp: text("whatsapp"),
  address: text("address"),
  userId: uuid("user_id").references(() => users.id),
  assignedTo: uuid("assigned_to").references(() => users.id),
  notes: text("notes"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  deletedAt: deletedAt(),
});
