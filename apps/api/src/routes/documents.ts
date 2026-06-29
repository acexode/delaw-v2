import {
  db,
  documentVersions,
  documents,
  matters,
  organisations,
  users,
} from "@delaw/db";
import { and, desc, eq, ilike, inArray, isNull, sql } from "drizzle-orm";
import type { FastifyPluginAsync } from "fastify";

import { env } from "../config/env";
import { AppError, badRequest, notFound } from "../lib/errors";
import {
  buildObjectKey,
  signedDownloadUrl,
  storageConfigured,
  uploadObject,
} from "../lib/storage";
import {
  DOCX_MIME,
  PDF_MIME,
  countWords,
  extractText,
} from "../lib/text-extract";
import {
  createDocumentSchema,
  createVersionSchema,
  documentIdParamSchema,
  listDocumentsQuerySchema,
  templatesQuerySchema,
  updateDocumentSchema,
  versionParamSchema,
} from "../schemas/document.schemas";

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50MB (task requirement)
const SYSTEM_ORG_SLUG = "delaw-official"; // holds DeLaw default templates

// The system org id is stable for the process lifetime; cache the lookup.
let systemOrgIdPromise: Promise<string | null> | null = null;
async function getSystemOrgId(): Promise<string | null> {
  if (!systemOrgIdPromise) {
    systemOrgIdPromise = db
      .select({ id: organisations.id })
      .from(organisations)
      .where(eq(organisations.slug, SYSTEM_ORG_SLUG))
      .limit(1)
      .then((rows) => rows[0]?.id ?? null)
      .catch(() => null);
  }
  return systemOrgIdPromise;
}

function initials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "?";
}

// Document fields safe to return (excludes the pgvector embedding).
const documentColumns = {
  id: documents.id,
  organisationId: documents.organisationId,
  folderId: documents.folderId,
  matterId: documents.matterId,
  createdBy: documents.createdBy,
  title: documents.title,
  type: documents.type,
  status: documents.status,
  content: documents.content,
  contentHtml: documents.contentHtml,
  fileUrl: documents.fileUrl,
  fileName: documents.fileName,
  fileSize: documents.fileSize,
  mimeType: documents.mimeType,
  wordCount: documents.wordCount,
  jurisdiction: documents.jurisdiction,
  version: documents.version,
  isTemplate: documents.isTemplate,
  metadata: documents.metadata,
  createdAt: documents.createdAt,
  updatedAt: documents.updatedAt,
};

export const documentRoutes: FastifyPluginAsync = async (app) => {
  // GET /documents — list non-template docs for the org (spec §4.4).
  app.get(
    "/",
    { preHandler: [app.authenticate] },
    async (request) => {
      const query = listDocumentsQuerySchema.parse(request.query);

      const conditions = [
        eq(documents.organisationId, request.orgId),
        eq(documents.isTemplate, false),
        isNull(documents.deletedAt),
      ];
      if (query.folderId) conditions.push(eq(documents.folderId, query.folderId));
      if (query.matterId) conditions.push(eq(documents.matterId, query.matterId));
      if (query.type) conditions.push(eq(documents.type, query.type));
      if (query.status) conditions.push(eq(documents.status, query.status));
      if (query.search) {
        conditions.push(ilike(documents.title, `%${query.search}%`));
      }

      const rows = await db
        .select({
          id: documents.id,
          title: documents.title,
          type: documents.type,
          status: documents.status,
          folderId: documents.folderId,
          matterId: documents.matterId,
          matterTitle: matters.title,
          fileUrl: documents.fileUrl,
          fileName: documents.fileName,
          wordCount: documents.wordCount,
          version: documents.version,
          createdBy: documents.createdBy,
          editorName: users.fullName,
          editorAvatar: users.avatarUrl,
          updatedAt: documents.updatedAt,
        })
        .from(documents)
        .leftJoin(matters, eq(documents.matterId, matters.id))
        .leftJoin(users, eq(documents.createdBy, users.id))
        .where(and(...conditions))
        .orderBy(desc(documents.updatedAt));

      return {
        documents: rows.map((row) => ({
          ...row,
          editorInitials: initials(row.editorName),
        })),
      };
    },
  );

  // GET /documents/templates — DeLaw official + firm templates (spec §4.4).
  // Registered before "/:id" so the literal path wins.
  app.get(
    "/templates",
    { preHandler: [app.authenticate] },
    async (request) => {
      const query = templatesQuerySchema.parse(request.query);
      const systemOrgId = await getSystemOrgId();

      const orgIds: string[] = [];
      if (query.source !== "firm") {
        if (systemOrgId) orgIds.push(systemOrgId);
      }
      if (query.source !== "official") {
        orgIds.push(request.orgId);
      }
      if (orgIds.length === 0) {
        return { templates: [] };
      }

      const rows = await db
        .select({
          id: documents.id,
          organisationId: documents.organisationId,
          title: documents.title,
          type: documents.type,
          jurisdiction: documents.jurisdiction,
          metadata: documents.metadata,
          updatedAt: documents.updatedAt,
        })
        .from(documents)
        .where(
          and(
            inArray(documents.organisationId, orgIds),
            eq(documents.isTemplate, true),
            isNull(documents.deletedAt),
          ),
        )
        .orderBy(desc(documents.updatedAt));

      const templates = rows
        .map((row) => {
          const meta = (row.metadata ?? {}) as Record<string, unknown>;
          return {
            id: row.id,
            name: row.title,
            type: row.type,
            jurisdiction: row.jurisdiction,
            category: typeof meta.category === "string" ? meta.category : "General",
            source: row.organisationId === systemOrgId ? "official" : "firm",
            uses: typeof meta.uses === "number" ? meta.uses : 0,
          };
        })
        .filter((t) =>
          query.category && query.category !== "All"
            ? t.category === query.category
            : true,
        );

      return { templates };
    },
  );

  // POST /documents — create blank or from a template (spec §4.4).
  app.post(
    "/",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const input = createDocumentSchema.parse(request.body);

      let content = input.content ?? null;
      let contentHtml = input.contentHtml ?? null;
      const title = input.title;
      let type = input.type;

      if (input.templateId) {
        const systemOrgId = await getSystemOrgId();
        const allowedOrgs = systemOrgId
          ? [request.orgId, systemOrgId]
          : [request.orgId];
        const [template] = await db
          .select(documentColumns)
          .from(documents)
          .where(
            and(
              eq(documents.id, input.templateId),
              inArray(documents.organisationId, allowedOrgs),
              eq(documents.isTemplate, true),
              isNull(documents.deletedAt),
            ),
          )
          .limit(1);
        if (!template) {
          throw notFound("Template not found");
        }
        content = template.content;
        contentHtml = template.contentHtml;
        if (!input.content && !input.contentHtml) {
          // Default the new doc's type to the template's underlying type so the
          // produced document is not itself a TEMPLATE.
          type = template.type === "TEMPLATE" ? type : template.type;
        }
      }

      const wordCount = content ? countWords(content) : 0;

      const [created] = await db
        .insert(documents)
        .values({
          organisationId: request.orgId,
          createdBy: request.userId,
          title,
          type,
          status: input.status,
          content,
          contentHtml,
          folderId: input.folderId ?? null,
          matterId: input.matterId ?? null,
          jurisdiction: input.jurisdiction,
          wordCount,
        })
        .returning(documentColumns);

      return reply.status(201).send({ document: created });
    },
  );

  // GET /documents/:id — full document with content (spec §4.4).
  app.get(
    "/:id",
    { preHandler: [app.authenticate] },
    async (request) => {
      const { id } = documentIdParamSchema.parse(request.params);
      const document = await loadDocument(request.orgId, id);

      let downloadUrl: string | null = null;
      const fileKey = (document.metadata as Record<string, unknown>)?.fileKey;
      if (typeof fileKey === "string" && storageConfigured()) {
        downloadUrl = await signedDownloadUrl(fileKey).catch(() => null);
      }

      return { document: { ...document, downloadUrl } };
    },
  );

  // PATCH /documents/:id — update content / metadata (spec §4.4).
  app.patch(
    "/:id",
    { preHandler: [app.authenticate] },
    async (request) => {
      const { id } = documentIdParamSchema.parse(request.params);
      const input = updateDocumentSchema.parse(request.body);
      await loadDocument(request.orgId, id);

      const values: Record<string, unknown> = { updatedAt: new Date() };
      if (input.title !== undefined) values.title = input.title;
      if (input.type !== undefined) values.type = input.type;
      if (input.status !== undefined) values.status = input.status;
      if (input.folderId !== undefined) values.folderId = input.folderId;
      if (input.matterId !== undefined) values.matterId = input.matterId;
      if (input.contentHtml !== undefined) values.contentHtml = input.contentHtml;
      if (input.jurisdiction !== undefined)
        values.jurisdiction = input.jurisdiction;
      if (input.content !== undefined) {
        values.content = input.content;
        values.wordCount = countWords(input.content);
      }

      const [updated] = await db
        .update(documents)
        .set(values)
        .where(
          and(
            eq(documents.id, id),
            eq(documents.organisationId, request.orgId),
            isNull(documents.deletedAt),
          ),
        )
        .returning(documentColumns);

      return { document: updated };
    },
  );

  // DELETE /documents/:id — soft delete (spec §3.1 / §4.4).
  app.delete(
    "/:id",
    { preHandler: [app.authenticate] },
    async (request) => {
      const { id } = documentIdParamSchema.parse(request.params);
      await loadDocument(request.orgId, id);

      await db
        .update(documents)
        .set({ deletedAt: new Date() })
        .where(
          and(eq(documents.id, id), eq(documents.organisationId, request.orgId)),
        );

      return { success: true };
    },
  );

  // POST /documents/:id/upload — store a PDF/DOCX to R2, extract text (spec §4.4).
  app.post(
    "/:id/upload",
    { preHandler: [app.authenticate] },
    async (request) => {
      const { id } = documentIdParamSchema.parse(request.params);
      await loadDocument(request.orgId, id);

      if (!storageConfigured()) {
        throw new AppError(
          503,
          "STORAGE_UNCONFIGURED",
          "File storage is not configured on this environment.",
        );
      }

      const part = await request.file({ limits: { fileSize: MAX_UPLOAD_BYTES } });
      if (!part) {
        throw badRequest("No file provided");
      }

      const mimeType = part.mimetype;
      if (mimeType !== PDF_MIME && mimeType !== DOCX_MIME) {
        throw badRequest("Only PDF and DOCX files are accepted");
      }

      const buffer = await part.toBuffer();
      if (part.file.truncated || buffer.byteLength > MAX_UPLOAD_BYTES) {
        throw badRequest("File exceeds the 50MB limit");
      }

      let extracted: { text: string; wordCount: number };
      try {
        extracted = await extractText(buffer, mimeType);
      } catch {
        throw new AppError(
          422,
          "UNPROCESSABLE_FILE",
          "Could not read the uploaded file. It may be corrupt or password-protected.",
        );
      }

      const key = buildObjectKey(request.orgId, id, part.filename);
      await uploadObject(key, buffer, mimeType);

      const [updated] = await db
        .update(documents)
        .set({
          fileUrl: publicUrl(key),
          fileName: part.filename,
          fileSize: buffer.byteLength,
          mimeType,
          type: "UPLOADED",
          content: extracted.text,
          wordCount: extracted.wordCount,
          metadata: sql`${documents.metadata} || ${JSON.stringify({ fileKey: key })}::jsonb`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(documents.id, id),
            eq(documents.organisationId, request.orgId),
            isNull(documents.deletedAt),
          ),
        )
        .returning(documentColumns);

      const downloadUrl = await signedDownloadUrl(key).catch(() => null);
      return { document: { ...updated, downloadUrl } };
    },
  );

  // GET /documents/:id/versions — list snapshots, newest first (spec §4.4).
  app.get(
    "/:id/versions",
    { preHandler: [app.authenticate] },
    async (request) => {
      const { id } = documentIdParamSchema.parse(request.params);
      await loadDocument(request.orgId, id);

      const rows = await db
        .select({
          id: documentVersions.id,
          version: documentVersions.version,
          title: documentVersions.title,
          wordCount: documentVersions.wordCount,
          createdBy: documentVersions.createdBy,
          authorName: users.fullName,
          createdAt: documentVersions.createdAt,
        })
        .from(documentVersions)
        .leftJoin(users, eq(documentVersions.createdBy, users.id))
        .where(
          and(
            eq(documentVersions.documentId, id),
            eq(documentVersions.organisationId, request.orgId),
            isNull(documentVersions.deletedAt),
          ),
        )
        .orderBy(desc(documentVersions.version));

      return {
        versions: rows.map((row) => ({
          id: row.id,
          version: row.version,
          title: row.title,
          wordCount: row.wordCount,
          createdBy: row.createdBy,
          authorName: row.authorName,
          authorInitials: initials(row.authorName),
          createdAt: row.createdAt,
        })),
      };
    },
  );

  // GET /documents/:id/versions/:versionId — a single snapshot with content,
  // used to preview and restore an earlier version (spec §4.4).
  app.get(
    "/:id/versions/:versionId",
    { preHandler: [app.authenticate] },
    async (request) => {
      const { id, versionId } = versionParamSchema.parse(request.params);
      await loadDocument(request.orgId, id);

      const [row] = await db
        .select({
          id: documentVersions.id,
          version: documentVersions.version,
          title: documentVersions.title,
          content: documentVersions.content,
          contentHtml: documentVersions.contentHtml,
          wordCount: documentVersions.wordCount,
          createdBy: documentVersions.createdBy,
          authorName: users.fullName,
          createdAt: documentVersions.createdAt,
        })
        .from(documentVersions)
        .leftJoin(users, eq(documentVersions.createdBy, users.id))
        .where(
          and(
            eq(documentVersions.id, versionId),
            eq(documentVersions.documentId, id),
            eq(documentVersions.organisationId, request.orgId),
            isNull(documentVersions.deletedAt),
          ),
        )
        .limit(1);

      if (!row) {
        throw notFound("Version not found");
      }

      return {
        version: {
          ...row,
          authorInitials: initials(row.authorName),
        },
      };
    },
  );

  // POST /documents/:id/versions — snapshot current content (spec §4.4).
  app.post(
    "/:id/versions",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { id } = documentIdParamSchema.parse(request.params);
      const input = createVersionSchema.parse(request.body ?? {});
      const document = await loadDocument(request.orgId, id);

      const snapshot = await db.transaction(async (tx) => {
        const nextVersion = document.version + 1;
        const [version] = await tx
          .insert(documentVersions)
          .values({
            organisationId: request.orgId,
            documentId: id,
            version: nextVersion,
            title: document.title,
            content: document.content,
            contentHtml: document.contentHtml,
            wordCount: document.wordCount,
            createdBy: request.userId,
          })
          .returning();

        await tx
          .update(documents)
          .set({ version: nextVersion, updatedAt: new Date() })
          .where(eq(documents.id, id));

        if (!version) {
          throw new Error("Failed to create document version");
        }
        return version;
      });

      void input.label;
      return reply.status(201).send({
        version: {
          id: snapshot.id,
          version: snapshot.version,
          title: snapshot.title,
          wordCount: snapshot.wordCount,
          createdAt: snapshot.createdAt,
        },
      });
    },
  );
};

// R2_PUBLIC_URL is optional; fall back to the object key when absent.
function publicUrl(key: string): string {
  const base = env.R2_PUBLIC_URL?.replace(/\/$/, "");
  return base ? `${base}/${key}` : key;
}

async function loadDocument(orgId: string, id: string) {
  const [document] = await db
    .select(documentColumns)
    .from(documents)
    .where(
      and(
        eq(documents.id, id),
        eq(documents.organisationId, orgId),
        isNull(documents.deletedAt),
      ),
    )
    .limit(1);
  if (!document) {
    throw notFound("Document not found");
  }
  return document;
}
