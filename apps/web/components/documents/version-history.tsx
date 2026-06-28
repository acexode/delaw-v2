"use client";

import { Loader2, Plus, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { documentsApi } from "@/lib/api-client";
import { relativeTime } from "@/lib/documents";
import type { DocumentVersionSummary } from "@delaw/types";

export function VersionHistory({
  documentId,
  onClose,
  onSaved,
}: {
  documentId: string;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const [versions, setVersions] = useState<DocumentVersionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    documentsApi
      .listVersions(documentId)
      .then((res) => setVersions(res.versions))
      .catch(() => setVersions([]))
      .finally(() => setLoading(false));
  }, [documentId]);

  useEffect(() => {
    load();
  }, [load]);

  const snapshot = async () => {
    setSaving(true);
    try {
      await documentsApi.createVersion(documentId);
      onSaved?.();
      load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[85] flex justify-end bg-[rgba(4,7,16,.5)] backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-[360px] max-w-[92vw] animate-rise flex-col border-l border-line-raised bg-bg-800 shadow-card-lg"
      >
        <div className="flex items-center justify-between border-b border-line-subtle px-5 py-4">
          <div>
            <div className="font-serif text-[16px] font-semibold text-text-cream">
              Version history
            </div>
            <div className="text-[12px] text-text-muted">
              Snapshots of this document
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-text-faint hover:bg-bg-hover hover:text-text-body"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-none px-5 py-3">
          <button
            type="button"
            onClick={() => void snapshot()}
            disabled={saving}
            className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-gold/40 bg-gold/10 text-[12.5px] font-semibold text-gold disabled:opacity-60"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Save current version
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-6">
          {loading ? (
            <div className="flex flex-col gap-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-lg border border-line bg-bg-700"
                />
              ))}
            </div>
          ) : versions.length === 0 ? (
            <p className="pt-4 text-[12.5px] text-text-muted">
              No saved versions yet. Save a snapshot to start a history.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {versions.map((v) => (
                <div
                  key={v.id}
                  className="rounded-lg border border-line bg-bg-750 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[12px] font-semibold text-gold">
                      v{v.version}
                    </span>
                    <span className="text-[11px] text-text-faint">
                      {relativeTime(v.createdAt)}
                    </span>
                  </div>
                  <div className="mt-1 truncate text-[12.5px] text-text-body">
                    {v.title}
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 text-[11px] text-text-muted">
                    {v.authorName && (
                      <span className="flex items-center gap-1.5">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full border border-line-accent bg-[linear-gradient(140deg,#2b3650,#1a2233)] text-[8px] font-bold text-gold">
                          {v.authorInitials ?? "?"}
                        </span>
                        {v.authorName}
                      </span>
                    )}
                    {v.wordCount != null && (
                      <span className="font-mono">{v.wordCount} words</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
