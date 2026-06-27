import { z } from "zod";

// Request schemas for the AI proxy routes (spec §4.5).

export const contentTypeSchema = z.enum([
  "CASE_LAW",
  "STATUTE",
  "REGULATION",
  "COURT_RULE",
  "TREATY",
  "PRACTICE_DIRECTION",
]);

// research_sessions.mode is free-text (spec §3.3: QUICK | DEEP | CASE_LAW).
export const researchModeSchema = z.enum(["QUICK", "DEEP", "CASE_LAW"]);

export const researchSchema = z.object({
  query: z.string().trim().min(1, "Query is required").max(2000),
  jurisdiction: z.string().trim().min(2).max(8).default("NG"),
  mode: researchModeSchema.default("QUICK"),
  matterId: z.string().uuid().optional(),
  matterContext: z.string().max(8000).optional(),
});

export const searchSchema = z.object({
  query: z.string().trim().min(1, "Query is required").max(2000),
  jurisdiction: z.string().trim().min(2).max(8).default("NG"),
  filters: z
    .object({ contentType: contentTypeSchema.optional() })
    .default({}),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export type ResearchInput = z.infer<typeof researchSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
