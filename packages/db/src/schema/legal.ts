import {
  type AnyPgColumn,
  date,
  integer,
  jsonb,
  pgTable,
  text,
  uuid,
  vector,
} from "drizzle-orm/pg-core";

import { contentTypeEnum } from "./enums";
import { createdAt, updatedAt, uuidPk } from "./_shared";

// Spec §3.2 — legal_content (Nigerian & African legal database).
// Shared global corpus: NOT tenant-scoped (no organisation_id), no soft delete.
// authority_status is free-text per spec §3.3 (GOOD_LAW | OVERRULED |
// DISTINGUISHED | DOUBTED, default GOOD_LAW).

export const legalContent = pgTable("legal_content", {
  id: uuidPk(),
  type: contentTypeEnum("type").notNull(),
  jurisdiction: text("jurisdiction").notNull(),
  title: text("title").notNull(),
  citation: text("citation"),
  suitNumber: text("suit_number"),
  court: text("court"),
  dateDecided: date("date_decided"),
  year: integer("year"),
  subjectArea: text("subject_area").array(),
  fullText: text("full_text").notNull(),
  summary: text("summary"),
  ratio: text("ratio"),
  authorityStatus: text("authority_status").notNull().default("GOOD_LAW"),
  overruledBy: uuid("overruled_by").references(
    (): AnyPgColumn => legalContent.id,
  ),
  source: text("source"),
  sourceUrl: text("source_url"),
  // pgvector — semantic search. Requires `CREATE EXTENSION vector` on the DB.
  embedding: vector("embedding", { dimensions: 1536 }).notNull(),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});
