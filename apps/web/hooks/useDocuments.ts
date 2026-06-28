"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type {
  DocumentDetail,
  DocumentListItem,
  Folder,
  TemplateSummary,
  UpdateDocumentRequest,
} from "@delaw/types";

import { ApiError, documentsApi, foldersApi } from "@/lib/api-client";

export type LoadStatus = "idle" | "loading" | "complete" | "error";
export type SaveStatus = "idle" | "saving" | "saved" | "error";

function describeError(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return err instanceof Error ? err.message : "Something went wrong";
}

export interface DocumentFilters {
  folderId?: string;
  matterId?: string;
  type?: string;
  status?: string;
  search?: string;
}

/** The org's folder tree (flat list). */
export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");

  const load = useCallback(() => {
    setStatus("loading");
    foldersApi
      .list()
      .then((res) => {
        setFolders(res.folders);
        setStatus("complete");
      })
      .catch(() => setStatus("error"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { folders, status, reload: load };
}

/** The documents hub list, filtered server-side. */
export function useDocuments(filters: DocumentFilters) {
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const key = JSON.stringify(filters);

  const load = useCallback(() => {
    const parsed = JSON.parse(key) as DocumentFilters;
    setStatus("loading");
    setError(null);
    documentsApi
      .list(parsed)
      .then((res) => {
        setDocuments(res.documents);
        setStatus("complete");
      })
      .catch((err) => {
        setError(describeError(err));
        setStatus("error");
      });
  }, [key]);

  useEffect(() => {
    load();
  }, [load]);

  return { documents, status, error, reload: load };
}

/** A single document for the editor. */
export function useDocument(id: string | null) {
  const [data, setData] = useState<DocumentDetail | null>(null);
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!id) return;
    setStatus("loading");
    setError(null);
    documentsApi
      .get(id)
      .then((res) => {
        setData(res.document);
        setStatus("complete");
      })
      .catch((err) => {
        setError(describeError(err));
        setStatus("error");
      });
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, status, error, reload: load };
}

/** The template library, filtered by category + source. */
export function useTemplates(category: string, source: string) {
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");

  useEffect(() => {
    let active = true;
    setStatus("loading");
    documentsApi
      .templates({
        category: category === "All" ? undefined : category,
        source: source === "all" ? undefined : source,
      })
      .then((res) => {
        if (!active) return;
        setTemplates(res.templates);
        setStatus("complete");
      })
      .catch(() => active && setStatus("error"));
    return () => {
      active = false;
    };
  }, [category, source]);

  return { templates, status };
}

/**
 * Debounced auto-save for the editor. Call `schedule(patch)` on every change;
 * it saves 500ms after the last change. Exposes save status + a `retry` for the
 * last failed payload, and `saveNow` to flush immediately (e.g. before export).
 */
export function useAutoSave(id: string | null, debounceMs = 500) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<UpdateDocumentRequest>({});

  const flush = useCallback(async () => {
    if (!id) return;
    const payload = pending.current;
    if (Object.keys(payload).length === 0) return;
    pending.current = {};
    setStatus("saving");
    try {
      await documentsApi.update(id, payload);
      setStatus("saved");
      setLastSavedAt(new Date());
    } catch {
      // Re-stage the payload so a retry resends it.
      pending.current = { ...payload, ...pending.current };
      setStatus("error");
    }
  }, [id]);

  const schedule = useCallback(
    (patch: UpdateDocumentRequest) => {
      pending.current = { ...pending.current, ...patch };
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        void flush();
      }, debounceMs);
    },
    [flush, debounceMs],
  );

  const saveNow = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    await flush();
  }, [flush]);

  const retry = useCallback(() => {
    void flush();
  }, [flush]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return { status, lastSavedAt, schedule, saveNow, retry };
}
