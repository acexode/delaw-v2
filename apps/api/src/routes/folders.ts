import { db, documents, folders } from "@delaw/db";
import { and, asc, eq, isNull } from "drizzle-orm";
import type { FastifyPluginAsync } from "fastify";

import { badRequest, notFound } from "../lib/errors";
import {
  createFolderSchema,
  folderIdParamSchema,
  updateFolderSchema,
} from "../schemas/document.schemas";

async function loadFolder(orgId: string, id: string) {
  const [folder] = await db
    .select()
    .from(folders)
    .where(
      and(
        eq(folders.id, id),
        eq(folders.organisationId, orgId),
        isNull(folders.deletedAt),
      ),
    )
    .limit(1);
  if (!folder) {
    throw notFound("Folder not found");
  }
  return folder;
}

export const folderRoutes: FastifyPluginAsync = async (app) => {
  // GET /folders — flat list of the org's folder tree (spec §4.4).
  app.get("/", { preHandler: [app.authenticate] }, async (request) => {
    const rows = await db
      .select({
        id: folders.id,
        name: folders.name,
        parentId: folders.parentId,
        matterId: folders.matterId,
        createdAt: folders.createdAt,
      })
      .from(folders)
      .where(
        and(
          eq(folders.organisationId, request.orgId),
          isNull(folders.deletedAt),
        ),
      )
      .orderBy(asc(folders.name));

    return { folders: rows };
  });

  // POST /folders — create a folder (spec §4.4).
  app.post("/", { preHandler: [app.authenticate] }, async (request, reply) => {
    const input = createFolderSchema.parse(request.body);

    if (input.parentId) {
      await loadFolder(request.orgId, input.parentId);
    }

    const [created] = await db
      .insert(folders)
      .values({
        organisationId: request.orgId,
        name: input.name,
        parentId: input.parentId ?? null,
        matterId: input.matterId ?? null,
        createdBy: request.userId,
      })
      .returning();

    return reply.status(201).send({ folder: created });
  });

  // PATCH /folders/:id — rename / move (spec §4.4).
  app.patch("/:id", { preHandler: [app.authenticate] }, async (request) => {
    const { id } = folderIdParamSchema.parse(request.params);
    const input = updateFolderSchema.parse(request.body);
    await loadFolder(request.orgId, id);

    if (input.parentId) {
      if (input.parentId === id) {
        throw badRequest("A folder cannot be its own parent");
      }
      await loadFolder(request.orgId, input.parentId);
    }

    const values: Record<string, unknown> = {};
    if (input.name !== undefined) values.name = input.name;
    if (input.parentId !== undefined) values.parentId = input.parentId;

    const [updated] = await db
      .update(folders)
      .set(values)
      .where(
        and(eq(folders.id, id), eq(folders.organisationId, request.orgId)),
      )
      .returning();

    return { folder: updated };
  });

  // DELETE /folders/:id — soft delete with a safety check (spec §4.4).
  app.delete("/:id", { preHandler: [app.authenticate] }, async (request) => {
    const { id } = folderIdParamSchema.parse(request.params);
    await loadFolder(request.orgId, id);

    const [child] = await db
      .select({ id: folders.id })
      .from(folders)
      .where(
        and(
          eq(folders.parentId, id),
          eq(folders.organisationId, request.orgId),
          isNull(folders.deletedAt),
        ),
      )
      .limit(1);
    if (child) {
      throw badRequest("Move or delete the sub-folders first");
    }

    const [doc] = await db
      .select({ id: documents.id })
      .from(documents)
      .where(
        and(
          eq(documents.folderId, id),
          eq(documents.organisationId, request.orgId),
          isNull(documents.deletedAt),
        ),
      )
      .limit(1);
    if (doc) {
      throw badRequest("Move or delete the documents in this folder first");
    }

    await db
      .update(folders)
      .set({ deletedAt: new Date() })
      .where(
        and(eq(folders.id, id), eq(folders.organisationId, request.orgId)),
      );

    return { success: true };
  });
};
