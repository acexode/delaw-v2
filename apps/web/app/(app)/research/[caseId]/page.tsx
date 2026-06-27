"use client";

import { ArrowLeft, Bookmark, Highlighter, SquarePen } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { AuthorityBadge, authorityMeta } from "@/components/research/authority";
import { useCase } from "@/hooks/useResearch";

type Annotation = { id: string; quote: string; note: string; createdAt: string };

function loadAnnotations(caseId: string): Annotation[] {
  try {
    const raw = window.localStorage.getItem(`delaw:annotations:${caseId}`);
    return raw ? (JSON.parse(raw) as Annotation[]) : [];
  } catch {
    return [];
  }
}

type RightTab = "analysis" | "health" | "cited";

export default function CaseViewerPage() {
  const router = useRouter();
  const params = useParams<{ caseId: string }>();
  const caseId = params.caseId;
  const { data, status, error, retry } = useCase(caseId);

  const [tab, setTab] = useState<RightTab>("analysis");
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [draft, setDraft] = useState<{ quote: string; note: string } | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (caseId) setAnnotations(loadAnnotations(caseId));
  }, [caseId]);

  const persist = useCallback(
    (next: Annotation[]) => {
      setAnnotations(next);
      try {
        window.localStorage.setItem(
          `delaw:annotations:${caseId}`,
          JSON.stringify(next),
        );
      } catch {
        // localStorage unavailable; annotation kept in memory only.
      }
    },
    [caseId],
  );

  // Highlight-to-annotate: capture a non-empty text selection in the body.
  const onMouseUp = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (text && bodyRef.current && selection?.anchorNode && bodyRef.current.contains(selection.anchorNode)) {
      setDraft({ quote: text, note: "" });
    }
  };

  const saveAnnotation = () => {
    if (!draft || !draft.note.trim()) return;
    persist([
      ...annotations,
      {
        id: crypto.randomUUID(),
        quote: draft.quote,
        note: draft.note.trim(),
        createdAt: new Date().toISOString(),
      },
    ]);
    setDraft(null);
  };

  if (status === "loading" || status === "idle") {
    return (
      <div className="px-8 pt-10">
        <div className="mx-auto h-6 w-64 animate-pulse rounded bg-bg-600" />
        <div className="mx-auto mt-4 h-40 w-full max-w-[660px] animate-pulse rounded bg-bg-750" />
      </div>
    );
  }

  if (status === "error" || !data) {
    return (
      <div className="flex flex-col items-center gap-3 px-8 pt-16 text-center">
        <p className="text-[13px] text-text-muted">
          {error ? "Could not load this authority." : "Authority not found."}
        </p>
        <button
          type="button"
          onClick={retry}
          className="rounded-lg border border-line-strong bg-bg-750 px-3 py-1.5 text-[12.5px] font-semibold text-text-body hover:border-line-accent"
        >
          Retry
        </button>
      </div>
    );
  }

  const meta = authorityMeta(data.authorityStatus);
  const sections: { id: string; label: string }[] = [
    ...(data.summary ? [{ id: "sec-summary", label: "AI Summary" }] : []),
    { id: "sec-judgment", label: "Judgment" },
    ...(data.ratio ? [{ id: "sec-ratio", label: "Ratio decidendi" }] : []),
  ];

  return (
    <div className="flex h-full min-h-0">
      {/* Section navigation */}
      <aside className="w-[210px] flex-none overflow-y-auto border-r border-line-subtle bg-bg-900 p-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 text-[12.5px] font-semibold text-text-muted hover:text-text-body"
        >
          <ArrowLeft size={15} /> Back to results
        </button>
        <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.07em] text-text-faint">
          On this page
        </div>
        <div className="flex flex-col gap-0.5">
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() =>
                document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" })
              }
              className="rounded-md px-2 py-1.5 text-left text-[12.5px] text-text-secondary hover:bg-bg-750 hover:text-text-body"
            >
              {s.label}
            </button>
          ))}
        </div>
      </aside>

      {/* Judgment reading view */}
      <div className="flex flex-1 justify-center overflow-y-auto py-8" onMouseUp={onMouseUp}>
        <div className="w-[660px] max-w-[92%]" ref={bodyRef}>
          <AuthorityBadge status={data.authorityStatus} />
          <h1 className="mb-1.5 mt-3 font-serif text-[24px] font-bold leading-tight text-text-cream">
            {data.title}
          </h1>
          {data.citation && (
            <div className="font-mono text-[13px] text-gold">{data.citation}</div>
          )}
          <div className="mt-2 text-[12.5px] leading-relaxed text-text-muted">
            {[data.court, data.dateDecided, data.suitNumber]
              .filter(Boolean)
              .join(" · ")}
          </div>
          <div className="my-5 h-px bg-line-subtle" />

          {data.summary && (
            <section id="sec-summary" className="mb-6">
              <h3 className="mb-2 font-serif text-[15px] font-semibold text-text-cream">
                AI Summary
              </h3>
              <p className="font-serif text-[14.5px] leading-relaxed text-text-secondary">
                {data.summary}
              </p>
            </section>
          )}

          <section id="sec-judgment">
            <h3 className="mb-2 font-serif text-[15px] font-semibold text-text-cream">
              Judgment
            </h3>
            <div className="whitespace-pre-wrap font-serif text-[14.5px] leading-relaxed text-text-secondary">
              {data.fullText}
            </div>
          </section>

          {data.ratio && (
            <section id="sec-ratio" className="mt-6">
              <h3 className="mb-2 font-serif text-[15px] font-semibold text-text-cream">
                Ratio decidendi
              </h3>
              <div
                className="rounded-r-lg border-l-[3px] border-gold px-3.5 py-3 font-serif text-[14.5px] leading-relaxed text-text-secondary"
                style={{ background: "rgba(201,168,76,.07)" }}
              >
                {data.ratio}
              </div>
            </section>
          )}

          {annotations.length > 0 && (
            <section className="mt-8">
              <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.07em] text-text-faint">
                <Highlighter size={13} className="text-gold" /> Your notes
              </div>
              <div className="flex flex-col gap-2">
                {annotations.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-lg border border-line-default bg-bg-750 p-3"
                  >
                    <div className="border-l-2 border-gold/50 pl-2 font-serif text-[12.5px] italic text-text-muted">
                      “{a.quote}”
                    </div>
                    <div className="mt-1.5 flex items-start justify-between gap-2 text-[12.5px] text-text-secondary">
                      <span>{a.note}</span>
                      <button
                        type="button"
                        onClick={() => persist(annotations.filter((x) => x.id !== a.id))}
                        className="flex-none text-[11px] text-text-faint hover:text-danger"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Analysis / Authority Health / Cases Cited */}
      <aside className="flex w-[332px] flex-none flex-col border-l border-line-subtle bg-bg-900">
        <div className="flex gap-4 border-b border-line-subtle px-4 pt-3">
          {(
            [
              ["analysis", "AI Analysis"],
              ["health", "Authority Health"],
              ["cited", "Cases Cited"],
            ] as [RightTab, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`pb-2.5 text-[12.5px] font-semibold ${
                tab === id
                  ? "text-text-cream shadow-[inset_0_-2px_0_#C9A84C]"
                  : "text-text-muted hover:text-text-body"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {tab === "analysis" && (
            <div className="flex flex-col gap-4 text-[12.5px] leading-relaxed text-text-secondary">
              <div>
                <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-text-faint">
                  Holding / summary
                </div>
                <p>{data.summary ?? "No AI summary available for this authority yet."}</p>
              </div>
              <div>
                <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-text-faint">
                  Ratio decidendi
                </div>
                <p>{data.ratio ?? "Not available."}</p>
              </div>
              {data.subjectArea && data.subjectArea.length > 0 && (
                <div>
                  <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-text-faint">
                    Subject areas
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {data.subjectArea.map((s) => (
                      <span
                        key={s}
                        className="rounded border border-line-default bg-bg-750 px-2 py-0.5 text-[11px] text-text-secondary"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "health" && (
            <div className="rounded-xl border border-line-default bg-bg-750 p-3.5">
              <div
                className={`mb-2.5 flex items-center gap-1.5 text-[11px] font-bold tracking-wide ${meta.className.split(" ").find((c) => c.startsWith("text-")) ?? "text-success"}`}
              >
                {meta.icon} AUTHORITY HEALTH
              </div>
              <div className="flex flex-col gap-2 text-[12.5px]">
                <div className="flex justify-between">
                  <span className="text-text-muted">Status</span>
                  <span className="font-semibold">{meta.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Overruled by</span>
                  <span className="font-mono text-text-body">
                    {data.overruledByCase ? (
                      <button
                        type="button"
                        onClick={() => router.push(`/research/${data.overruledByCase!.id}`)}
                        className="text-gold"
                      >
                        {data.overruledByCase.title}
                      </button>
                    ) : (
                      "None"
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Followed / distinguished</span>
                  <span className="text-text-faint">Not tracked yet</span>
                </div>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-text-faint">
                Citation-graph treatment (followed / distinguished / cited-by) is
                not yet modelled in the corpus.
              </p>
            </div>
          )}

          {tab === "cited" && (
            <div className="rounded-xl border border-dashed border-line-default bg-bg-750 p-6 text-center text-[12.5px] text-text-muted">
              Cited-cases extraction is not available for this authority yet.
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2.5 border-t border-line-subtle p-4">
          <button
            type="button"
            onClick={() => router.push("/documents/new")}
            style={{ background: "linear-gradient(135deg,#D4B25E,#C9A84C)" }}
            className="flex h-[38px] items-center justify-center gap-2 rounded-[10px] text-[13px] font-bold text-gold-ink"
          >
            <SquarePen size={15} /> Use in document
          </button>
          <button
            type="button"
            disabled
            title="Saving to a matter is coming soon (matters API pending)."
            className="flex h-9 items-center justify-center gap-2 rounded-[10px] border border-line-strong bg-bg-750 text-[12.5px] font-semibold text-text-body opacity-60"
          >
            <Bookmark size={14} /> Add to matter
          </button>
        </div>
      </aside>

      {/* Annotation popover */}
      {draft && (
        <div className="fixed bottom-6 left-1/2 z-50 w-[360px] -translate-x-1/2 rounded-xl border border-line-strong bg-bg-700 p-4 shadow-card">
          <div className="mb-2 border-l-2 border-gold/50 pl-2 font-serif text-[12.5px] italic text-text-muted">
            “{draft.quote.length > 140 ? `${draft.quote.slice(0, 140)}…` : draft.quote}”
          </div>
          <textarea
            value={draft.note}
            autoFocus
            onChange={(e) => setDraft({ ...draft, note: e.target.value })}
            placeholder="Add a note about this passage…"
            className="h-20 w-full resize-none rounded-lg border border-line-default bg-bg-850 p-2.5 text-[12.5px] text-text-body outline-none focus:border-gold"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="rounded-lg px-3 py-1.5 text-[12.5px] font-semibold text-text-muted hover:text-text-body"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveAnnotation}
              disabled={!draft.note.trim()}
              style={{ background: "linear-gradient(135deg,#D4B25E,#C9A84C)" }}
              className="rounded-lg px-3.5 py-1.5 text-[12.5px] font-bold text-gold-ink disabled:opacity-50"
            >
              Save note
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
