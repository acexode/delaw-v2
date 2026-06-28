"use client";

import {
  ArrowLeft,
  FilePlus2,
  LayoutTemplate,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { ApiError, documentsApi } from "@/lib/api-client";
import { DOC_TYPES, DOC_TYPE_META } from "@/lib/documents";
import type { DocType } from "@delaw/types";

type Mode = "choose" | "blank" | "upload";

const ACCEPT =
  ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function NewDocumentModal({
  open,
  onClose,
  folderId,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  folderId?: string | null;
  onCreated?: () => void;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("choose");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<DocType>("MEMO");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const reset = () => {
    setMode("choose");
    setTitle("");
    setType("MEMO");
    setBusy(false);
    setError(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const createBlank = async () => {
    const name = title.trim() || "Untitled document";
    setBusy(true);
    setError(null);
    try {
      const res = await documentsApi.create({
        title: name,
        type,
        folderId: folderId ?? null,
      });
      onCreated?.();
      router.push(`/documents/${res.document.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create document");
      setBusy(false);
    }
  };

  const handleFile = async (file: File) => {
    const baseName = file.name.replace(/\.[^.]+$/, "");
    setBusy(true);
    setError(null);
    try {
      const created = await documentsApi.create({
        title: baseName || "Uploaded document",
        type: "UPLOADED",
        folderId: folderId ?? null,
      });
      await documentsApi.upload(created.document.id, file);
      onCreated?.();
      router.push(`/documents/${created.document.id}`);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not upload the file",
      );
      setBusy(false);
    }
  };

  return (
    <div
      onClick={close}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(4,7,16,.62)] p-8 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[520px] max-w-[94vw] overflow-hidden rounded-2xl border border-line-raised bg-bg-800 shadow-card-lg"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line-faint p-5">
          <div className="flex items-center gap-2">
            {mode !== "choose" && (
              <button
                type="button"
                onClick={() => setMode("choose")}
                className="flex h-7 w-7 items-center justify-center rounded-md text-text-faint hover:bg-bg-hover hover:text-text-body"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div>
              <div className="font-serif text-[18px] font-semibold text-text-cream">
                New Document
              </div>
              <div className="text-[12px] text-text-muted">
                {mode === "blank"
                  ? "Start from a blank page"
                  : mode === "upload"
                    ? "Upload a PDF or DOCX file"
                    : "Choose how to begin"}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            className="flex h-7 w-7 items-center justify-center rounded-md text-text-faint hover:bg-bg-hover hover:text-text-body"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          {error && (
            <div className="mb-4 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-[12.5px] text-danger">
              {error}
            </div>
          )}

          {mode === "choose" && (
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  id: "blank" as const,
                  icon: FilePlus2,
                  label: "Blank",
                  desc: "Empty editor",
                  onClick: () => setMode("blank"),
                },
                {
                  id: "template" as const,
                  icon: LayoutTemplate,
                  label: "From Template",
                  desc: "Nigerian precedents",
                  onClick: () => {
                    close();
                    router.push("/documents/templates");
                  },
                },
                {
                  id: "upload" as const,
                  icon: Upload,
                  label: "Upload File",
                  desc: "PDF or DOCX",
                  onClick: () => setMode("upload"),
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={opt.onClick}
                  className="flex flex-col items-center gap-2.5 rounded-xl border border-line bg-bg-750 px-3 py-5 text-center transition hover:border-gold hover:bg-gold/5"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-[11px] border border-gold/30 bg-gold/10 text-gold">
                    <opt.icon size={18} />
                  </span>
                  <span className="text-[13px] font-semibold text-text-body">
                    {opt.label}
                  </span>
                  <span className="text-[11px] text-text-faint">{opt.desc}</span>
                </button>
              ))}
            </div>
          )}

          {mode === "blank" && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-text-faint">
                  Title
                </label>
                <input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !busy) void createBlank();
                  }}
                  placeholder="e.g. Statement of Claim — Okafor v. GTBank"
                  className="h-10 w-full rounded-[10px] border border-line-strong bg-bg-750 px-3 text-[13.5px] text-text-body outline-none focus:border-gold"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-text-faint">
                  Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {DOC_TYPES.filter(
                    (t) => !["GENERATED", "UPLOADED"].includes(t),
                  ).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`h-8 rounded-lg border px-3 text-[12px] font-semibold transition ${
                        type === t
                          ? "border-gold bg-gold/10 text-gold"
                          : "border-line-strong bg-bg-750 text-text-muted hover:border-line-accent"
                      }`}
                    >
                      {DOC_TYPE_META[t].label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => void createBlank()}
                style={{ background: "linear-gradient(135deg,#D4B25E,#C9A84C)" }}
                className="flex h-11 items-center justify-center gap-2 rounded-[11px] text-[14px] font-bold text-gold-ink disabled:opacity-60"
              >
                {busy && <Loader2 size={16} className="animate-spin" />}
                Create document
              </button>
            </div>
          )}

          {mode === "upload" && (
            <div className="flex flex-col gap-4">
              <input
                ref={fileRef}
                type="file"
                accept={ACCEPT}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFile(file);
                }}
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center gap-3 rounded-xl border-[1.5px] border-dashed border-line-accent bg-bg-850 px-6 py-9 text-center transition hover:border-gold hover:bg-gold/5 disabled:opacity-60"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-[13px] border border-line bg-bg-700 text-gold">
                  {busy ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Upload size={20} />
                  )}
                </span>
                <span className="text-[13.5px] font-semibold text-text-body">
                  {busy ? "Uploading…" : "Click to choose a file"}
                </span>
                <span className="text-[12px] text-text-faint">
                  PDF or DOCX · up to 50MB
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
