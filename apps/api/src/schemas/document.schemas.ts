import { z } from "zod";

// Request schemas for the document + folder routes (spec §4.4). Enum values are
// verbatim from spec §3.3 (doc_type, doc_status).

export const docTypeSchema = z.enum([
  "PLEADING",
  "CONTRACT",
  "BRIEF",
  "MEMO",
  "TEMPLATE",
  "RESEARCH",
  "GENERATED",
  "UPLOADED",
]);

export const docStatusSchema = z.enum(["DRAFT", "REVIEW", "FINAL", "ARCHIVED"]);

const uuid = z.string().uuid();

export const listDocumentsQuerySchema = z.object({
  folderId: uuid.optional(),
  matterId: uuid.optional(),
  type: docTypeSchema.optional(),
  status: docStatusSchema.optional(),
  search: z.string().trim().max(200).optional(),
});

export const createDocumentSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(300),
  type: docTypeSchema.default("MEMO"),
  status: docStatusSchema.default("DRAFT"),
  folderId: uuid.nullish(),
  matterId: uuid.nullish(),
  content: z.string().optional(),
  contentHtml: z.string().optional(),
  jurisdiction: z.string().trim().min(2).max(8).default("NG"),
  // Copy content/title/type from an existing template (spec §4.4 "from template").
  templateId: uuid.optional(),
});

export const updateDocumentSchema = z
  .object({
    title: z.string().trim().min(1).max(300).optional(),
    type: docTypeSchema.optional(),
    status: docStatusSchema.optional(),
    folderId: uuid.nullable().optional(),
    matterId: uuid.nullable().optional(),
    content: z.string().optional(),
    contentHtml: z.string().optional(),
    jurisdiction: z.string().trim().min(2).max(8).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "No fields provided to update",
  });

export const createVersionSchema = z.object({
  // Optional label stored on the snapshot (defaults to "Manual save").
  label: z.string().trim().max(120).optional(),
});

export const documentIdParamSchema = z.object({ id: uuid });

export const templatesQuerySchema = z.object({
  category: z.string().trim().max(80).optional(),
  source: z.enum(["official", "firm", "all"]).default("all"),
});

export const createFolderSchema = z.object({
  name: z.string().trim().min(1, "Folder name is required").max(120),
  parentId: uuid.nullish(),
  matterId: uuid.nullish(),
});

export const updateFolderSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    parentId: uuid.nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "No fields provided to update",
  });

export const folderIdParamSchema = z.object({ id: uuid });

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type CreateFolderInput = z.infer<typeof createFolderSchema>;
