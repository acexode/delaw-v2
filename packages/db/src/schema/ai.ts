import { integer, jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";

import { organisations, users } from "./auth";
import { matters } from "./matters";
import { createdAt, updatedAt, uuidPk } from "./_shared";

// Spec §3.2 — ai_chat_sessions, ai_chat_messages. `role` is free-text per §3.3
// (user | assistant).

export const aiChatSessions = pgTable("ai_chat_sessions", {
  id: uuidPk(),
  organisationId: uuid("organisation_id")
    .notNull()
    .references(() => organisations.id),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  matterId: uuid("matter_id").references(() => matters.id),
  title: text("title").notNull().default("New Chat"),
  jurisdiction: text("jurisdiction").default("NG"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const aiChatMessages = pgTable("ai_chat_messages", {
  id: uuidPk(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => aiChatSessions.id),
  role: text("role").notNull(),
  content: text("content").notNull(),
  sources: jsonb("sources"),
  tokensUsed: integer("tokens_used"),
  createdAt: createdAt(),
});
