import {
  type AnyPgColumn,
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  uuid,
  vector,
} from "drizzle-orm/pg-core";

import { organisations, users } from "./auth";
import { matters } from "./matters";
import { docStatusEnum, docTypeEnum } from "./enums";
import { createdAt, deletedAt, updatedAt, uuidPk } from "./_shared";

// Spec §3.2 — documents, folders. document_versions supports the "Save new
// version snapshot" endpoint (spec §4.4) and is not defined inline in §3.2.

export const folders = pgTable("folders", {
  id: uuidPk(),
  organisationId: uuid("organisation_id")
    .notNull()
    .references(() => organisations.id),
  parentId: uuid("parent_id").references((): AnyPgColumn => folders.id),
  matterId: uuid("matter_id").references(() => matters.id),
  name: text("name").notNull(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: createdAt(),
  deletedAt: deletedAt(),
});

export const documents = pgTable("documents", {
  id: uuidPk(),
  organisationId: uuid("organisation_id")
    .notNull()
    .references(() => organisations.id),
  folderId: uuid("folder_id").references(() => folders.id),
  matterId: uuid("matter_id").references(() => matters.id),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  type: docTypeEnum("type").notNull(),
  status: docStatusEnum("status").notNull().default("DRAFT"),
  content: text("content"),
  contentHtml: text("content_html"),
  fileUrl: text("file_url"),
  fileName: text("file_name"),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  wordCount: integer("word_count"),
  jurisdiction: text("jurisdiction").default("NG"),
  version: integer("version").notNull().default(1),
  isTemplate: boolean("is_template").notNull().default(false),
  metadata: jsonb("metadata").notNull().default({}),
  // pgvector — semantic search. Requires `CREATE EXTENSION vector` on the DB.
  embedding: vector("embedding", { dimensions: 1536 }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  deletedAt: deletedAt(),
});

export const documentVersions = pgTable("document_versions", {
  id: uuidPk(),
  organisationId: uuid("organisation_id")
    .notNull()
    .references(() => organisations.id),
  documentId: uuid("document_id")
    .notNull()
    .references(() => documents.id),
  version: integer("version").notNull(),
  title: text("title").notNull(),
  content: text("content"),
  contentHtml: text("content_html"),
  wordCount: integer("word_count"),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  deletedAt: deletedAt(),
});
