"use client";

import { Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useTemplates } from "@/hooks/useDocuments";
import { ApiError, documentsApi } from "@/lib/api-client";
import { TEMPLATE_CATEGORIES, badgeStyle } from "@/lib/documents";
import type { TemplateSummary } from "@delaw/types";

// Representative clause structure shown in the preview modal. Mirrors the DeLaw
// design (dashboard.dc.html structureFor) — a generic Nigerian precedent skeleton.
const PREVIEW_STRUCTURE = [
  { text: "PARTIES", head: true },
  { text: "This document is made between [PARTY A] and [PARTY B].", head: false },
  { text: "1.  DEFINITIONS & INTERPRETATION", head: true },
  { text: "2.  SCOPE / OBLIGATIONS OF THE PARTIES", head: true },
  { text: "3.  CONSIDERATION — [AMOUNT IN ₦]", head: false },
  { text: "4.  TERM & TERMINATION", head: true },
  { text: "5.  GOVERNING LAW & DISPUTE RESOLUTION — Nigeria", head: false },
  { text: "EXECUTION — [SIGNATURE BLOCKS / WITNESSES]", head: true },
];

export default function TemplatesPage() {
  const router = useRouter();
  const [category, setCategory] = useState("All");
  const [source, setSource] = useState<"all" | "official" | "firm">("all");
  const [preview, setPreview] = useState<TemplateSummary | null>(null);
  const [usingId, setUsingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { templates, status } = useTemplates(category, source);

  const use = async (tpl: TemplateSummary) => {
    setUsingId(tpl.id);
    setError(null);
    try {
      const res = await documentsApi.create({
        title: tpl.name,
        type: tpl.type,
        templateId: tpl.id,
      });
      router.push(`/documents/${res.document.id}`);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not load the template",
      );
      setUsingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-[1180px] px-6 pb-16 pt-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mb-1 font-serif text-[24px] font-semibold text-text-cream">
            Templates Library
          </h1>
          <p className="text-[13px] text-text-muted">
            Start from a vetted Nigerian precedent — clause-level,
            jurisdiction-aware.
          </p>
        </div>
        <div className="flex rounded-lg border border-line bg-bg-850 p-0.5">
          {(
            [
              ["all", "All"],
              ["official", "DeLaw Official"],
              ["firm", "Firm Custom"],
            ] as ["all" | "official" | "firm", string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setSource(id)}
              className={`h-[28px] rounded-[7px] px-3 text-[12px] font-semibold transition ${
                source === id
                  ? "bg-gold text-gold-ink"
                  : "text-text-muted hover:text-text-body"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {TEMPLATE_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`h-[30px] rounded-lg px-3 text-[12px] font-semibold transition ${
              category === c
                ? "bg-gold text-gold-ink"
                : "border border-line-strong bg-bg-750 text-text-muted hover:border-line-accent"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-[12.5px] text-danger">
          {error}
        </div>
      )}

      {status === "loading" ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-[260px] animate-pulse rounded-[14px] border border-line bg-bg-700"
            />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-line bg-bg-700 p-10 text-center">
          <h3 className="font-serif text-base text-text-cream">
            No templates found
          </h3>
          <p className="mt-1 text-[13px] text-text-muted">
            {source === "firm"
              ? "Your firm has not added any custom templates yet."
              : "Try a different category or source."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
          {templates.map((t) => (
            <TemplateCard
              key={t.id}
              tpl={t}
              busy={usingId === t.id}
              onUse={() => void use(t)}
              onPreview={() => setPreview(t)}
            />
          ))}
        </div>
      )}

      {preview && (
        <PreviewModal
          tpl={preview}
          busy={usingId === preview.id}
          onUse={() => void use(preview)}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}

function TemplateCard({
  tpl,
  busy,
  onUse,
  onPreview,
}: {
  tpl: TemplateSummary;
  busy: boolean;
  onUse: () => void;
  onPreview: () => void;
}) {
  const official = tpl.source === "official";
  return (
    <div className="overflow-hidden rounded-[14px] border border-line bg-bg-750 transition hover:border-line-accent">
      <div className="relative flex h-[120px] flex-col gap-1.5 border-b border-line-subtle bg-[linear-gradient(160deg,#0F1626,#0B1020)] px-[18px] py-4">
        <span
          className={`absolute right-2.5 top-2.5 rounded-[5px] px-[7px] py-0.5 text-[9px] font-bold tracking-[0.04em] ${
            official
              ? "border border-gold/30 bg-gold/10 text-gold"
              : "border border-line-accent bg-[rgba(139,149,168,.12)] text-text-muted"
          }`}
        >
          {official ? "DeLaw" : "Firm"}
        </span>
        <div className="h-[7px] w-[55%] rounded-[3px] bg-line-raised" />
        <div className="mt-1 h-[5px] w-[85%] rounded-[3px] bg-[#1f2a40]" />
        <div className="h-[5px] w-[78%] rounded-[3px] bg-[#1f2a40]" />
        <div className="h-[5px] w-[88%] rounded-[3px] bg-[#1f2a40]" />
        <div className="h-[5px] w-[40%] rounded-[3px] bg-[#1f2a40]" />
      </div>
      <div className="p-4">
        <div className="mb-2 font-serif text-[14.5px] font-semibold leading-[1.3] text-text-cream">
          {tpl.name}
        </div>
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <span
            style={badgeStyle("#C9A84C")}
            className="rounded-[5px] px-[7px] py-0.5 text-[9.5px] font-bold uppercase tracking-[0.04em]"
          >
            {tpl.category}
          </span>
          <span className="text-[10.5px] text-text-faint">
            {tpl.jurisdiction ?? "NG"}
            {tpl.uses > 0 ? ` · used ${tpl.uses}×` : ""}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onUse}
            className="flex h-[34px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-gold text-[12.5px] font-bold text-gold-ink disabled:opacity-60"
          >
            {busy && <Loader2 size={13} className="animate-spin" />}
            Use Template
          </button>
          <button
            type="button"
            onClick={onPreview}
            className="h-[34px] rounded-lg border border-line-strong px-3 text-[12.5px] font-semibold text-text-secondary hover:border-line-accent"
          >
            Preview
          </button>
        </div>
      </div>
    </div>
  );
}

function PreviewModal({
  tpl,
  busy,
  onUse,
  onClose,
}: {
  tpl: TemplateSummary;
  busy: boolean;
  onUse: () => void;
  onClose: () => void;
}) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(4,7,16,.62)] p-8 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[86vh] w-[560px] max-w-[94vw] overflow-y-auto rounded-2xl border border-line-raised bg-bg-800 shadow-card-lg"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line-faint p-5">
          <div>
            <div className="font-serif text-[19px] font-bold text-text-cream">
              {tpl.name}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span
                style={badgeStyle("#C9A84C")}
                className="rounded-[5px] px-[7px] py-0.5 text-[9.5px] font-bold uppercase tracking-[0.04em]"
              >
                {tpl.category}
              </span>
              <span className="text-[11px] text-text-faint">
                {tpl.jurisdiction ?? "NG"}
                {tpl.uses > 0 ? ` · used ${tpl.uses}×` : ""}
              </span>
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
        <div className="p-5">
          <div className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-text-faint">
            Structure
          </div>
          <div className="rounded-xl border border-line bg-bg-850 px-5 py-4 font-serif">
            {PREVIEW_STRUCTURE.map((ln, i) => (
              <div
                key={i}
                className={
                  ln.head
                    ? "mb-1 mt-2.5 text-[13px] font-semibold text-text-cream first:mt-0"
                    : "pl-3 text-[12.5px] leading-[1.7] text-text-muted"
                }
              >
                {ln.text}
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2.5 px-5 pb-5">
          <button
            type="button"
            disabled={busy}
            onClick={onUse}
            style={{ background: "linear-gradient(135deg,#D4B25E,#C9A84C)" }}
            className="flex h-[42px] flex-1 items-center justify-center gap-2 rounded-[10px] text-[14px] font-bold text-gold-ink disabled:opacity-60"
          >
            {busy && <Loader2 size={15} className="animate-spin" />}
            Use this template
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-[42px] rounded-[10px] border border-line-accent px-4 text-[14px] font-semibold text-text-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
