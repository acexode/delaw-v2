"use client";

import { ArrowLeft, BookOpen, Bookmark, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

import { AuthorityBadge } from "@/components/research/authority";
import { useResearchStream, useSearch } from "@/hooks/useResearch";
import { useRightPanel } from "@/lib/right-panel";
import type {
  ResearchMode,
  SearchResult,
} from "@delaw/types";

function CasePreview({
  result,
  onOpen,
  onSaveToMatter,
}: {
  result: SearchResult;
  onOpen: () => void;
  onSaveToMatter: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-line-subtle p-4">
        <div className="flex items-start justify-between gap-2.5">
          <div className="font-serif text-[15px] font-semibold leading-tight text-text-cream">
            {result.title}
          </div>
          <AuthorityBadge status={result.authority_status} />
        </div>
        {result.citation && (
          <div className="mt-1.5 font-mono text-[11.5px] text-gold">
            {result.citation}
          </div>
        )}
        <div className="mt-1 text-[11.5px] text-text-faint">
          {[result.court, result.year].filter(Boolean).join(" · ")}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 font-serif text-[12.5px] leading-relaxed text-text-secondary">
        {result.summary ?? "No summary available for this authority yet."}
      </div>
      <div className="flex flex-col gap-2.5 border-t border-line-subtle p-4">
        <button
          type="button"
          onClick={onOpen}
          style={{ background: "linear-gradient(135deg,#D4B25E,#C9A84C)" }}
          className="flex h-[38px] items-center justify-center gap-2 rounded-[10px] text-[13px] font-bold text-gold-ink"
        >
          <BookOpen size={15} /> Open full case
        </button>
        <button
          type="button"
          onClick={onSaveToMatter}
          className="flex h-9 items-center justify-center gap-2 rounded-[10px] border border-line-strong bg-bg-750 text-[12.5px] font-semibold text-text-body hover:border-line-accent"
        >
          <Bookmark size={14} /> Save to matter
        </button>
      </div>
    </div>
  );
}

function ResultsInner() {
  const router = useRouter();
  const params = useSearchParams();
  const query = params.get("q") ?? "";
  const mode = (params.get("mode") as ResearchMode) ?? "QUICK";
  const jurisdiction = params.get("jurisdiction") ?? "NG";

  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [savedNote, setSavedNote] = useState<string | null>(null);

  const researchInput = useMemo(
    () => (query ? { query, mode, jurisdiction } : null),
    [query, mode, jurisdiction],
  );
  const searchInput = useMemo(
    () =>
      query
        ? {
            query,
            jurisdiction,
            filters: mode === "CASE_LAW" ? { contentType: "CASE_LAW" as const } : {},
            limit: 12,
          }
        : null,
    [query, mode, jurisdiction],
  );

  const { status, answer, sources, error, retry } = useResearchStream(researchInput);
  const search = useSearch(searchInput);

  const citedSources = sources.filter((s) => s.cited);
  const chips = citedSources.length > 0 ? citedSources : sources.slice(0, 3);

  const openCase = (id: string) => router.push(`/research/${id}`);

  useRightPanel(
    selected ? (
      <CasePreview
        result={selected}
        onOpen={() => openCase(selected.id)}
        onSaveToMatter={() => setSavedNote(selected.id)}
      />
    ) : null,
  );

  return (
    <div className="overflow-y-auto px-6 pb-16 pt-5">
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/research")}
          className="flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-line-strong bg-bg-750 text-text-muted hover:border-line-accent hover:text-text-body"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13.5px] font-semibold text-text-body">
            {query || "Research"}
          </div>
          <div className="mt-0.5 text-[11.5px] text-text-faint">
            {search.status === "complete"
              ? `${search.results.length} authorities`
              : "Searching…"}{" "}
            · Nigeria · {mode.replace("_", " ").toLowerCase()}
          </div>
        </div>
      </div>

      {/* AI Answer panel */}
      <div
        className="overflow-hidden rounded-[14px] border border-line-raised"
        style={{
          background:
            "linear-gradient(160deg,rgba(201,168,76,.05),rgba(201,168,76,0) 60%),#101728",
        }}
      >
        <div className="flex items-center gap-2.5 border-b border-line-faint px-4 py-3">
          <span className="flex h-[23px] w-[23px] items-center justify-center rounded-md border border-gold/30 bg-gold/10 text-gold">
            <Sparkles size={13} />
          </span>
          <span className="font-serif text-sm font-semibold text-text-cream">
            AI Answer
          </span>
          <span className="rounded-full border border-gold/25 bg-gold/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-gold">
            GROUNDED
          </span>
        </div>
        <div className="px-4 py-4 text-[13.5px] leading-relaxed text-text-secondary">
          {status === "error" ? (
            <div className="flex flex-col items-start gap-3">
              <p className="text-text-muted">
                {error === "INSUFFICIENT_CREDITS"
                  ? "You have used all of your AI credits for this billing period."
                  : "The research request failed. Please try again."}
              </p>
              {error !== "INSUFFICIENT_CREDITS" && (
                <button
                  type="button"
                  onClick={retry}
                  className="rounded-lg border border-line-strong bg-bg-750 px-3 py-1.5 text-[12.5px] font-semibold text-text-body hover:border-line-accent"
                >
                  Retry
                </button>
              )}
            </div>
          ) : status === "loading" && !answer ? (
            <div className="flex flex-col gap-2.5">
              {[100, 92, 84].map((w) => (
                <div
                  key={w}
                  className="h-3 animate-pulse rounded bg-bg-600"
                  style={{ width: `${w}%` }}
                />
              ))}
            </div>
          ) : (
            <>
              <span className="whitespace-pre-wrap">{answer}</span>
              {(status === "streaming" || status === "loading") && (
                <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-gold align-text-bottom" />
              )}
              {chips.length > 0 && status === "complete" && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {chips.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => openCase(s.id)}
                      className="rounded-full border border-gold/25 bg-gold/10 px-2.5 py-1 font-mono text-[11px] text-gold hover:bg-gold/20"
                    >
                      {s.title}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Authorities list */}
      <div className="mb-3 mt-5 text-[11px] font-semibold uppercase tracking-[0.07em] text-text-faint">
        Authorities · ranked by relevance
      </div>

      {search.status === "error" ? (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-line-default bg-bg-750 p-5">
          <p className="text-[13px] text-text-muted">
            {search.error === "INSUFFICIENT_CREDITS"
              ? "You have used all of your AI credits for this billing period."
              : "Could not load authorities."}
          </p>
          {search.error !== "INSUFFICIENT_CREDITS" && (
            <button
              type="button"
              onClick={search.retry}
              className="rounded-lg border border-line-strong bg-bg-700 px-3 py-1.5 text-[12.5px] font-semibold text-text-body hover:border-line-accent"
            >
              Retry
            </button>
          )}
        </div>
      ) : search.status !== "complete" ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[120px] animate-pulse rounded-xl border border-line-default bg-bg-750"
            />
          ))}
        </div>
      ) : search.results.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line-default bg-bg-750 p-8 text-center">
          <h3 className="font-serif text-base text-text-cream">No authorities found</h3>
          <p className="mt-1 text-[13px] text-text-muted">
            Try rephrasing your query or widening the filters.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-[11px]">
          {search.results.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setSelected(a)}
              className={`rounded-[14px] border bg-bg-750 p-[15px] text-left transition ${
                selected?.id === a.id
                  ? "border-gold"
                  : "border-line-default hover:border-line-accent"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-serif text-[14.5px] font-semibold text-text-cream">
                    {a.title}
                  </div>
                  {a.citation && (
                    <div className="mt-0.5 font-mono text-[11.5px] text-gold">
                      {a.citation}
                    </div>
                  )}
                </div>
                <AuthorityBadge status={a.authority_status} />
              </div>
              {a.summary && (
                <p className="my-2.5 text-[12.5px] leading-relaxed text-text-muted">
                  {a.summary}
                </p>
              )}
              <div className="flex items-center gap-3 border-t border-line-subtle pt-2.5 text-[11px] text-text-faint">
                <span>{[a.court, a.year].filter(Boolean).join(" · ")}</span>
                <span className="font-semibold text-gold">
                  {Math.round(a.score * 100)}% match
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelected(a);
                    setSavedNote(a.id);
                  }}
                  className="ml-auto flex items-center gap-1.5 font-semibold text-gold"
                >
                  <Bookmark size={13} /> Save
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {savedNote && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-line-strong bg-bg-600 px-4 py-2.5 text-[12.5px] text-text-body shadow-card">
          Saving authorities to a matter is coming soon (matters API pending).
          <button
            type="button"
            onClick={() => setSavedNote(null)}
            className="ml-3 text-gold"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

export default function ResearchResultsPage() {
  return (
    <Suspense
      fallback={<div className="px-6 pt-5 text-[13px] text-text-muted">Loading…</div>}
    >
      <ResultsInner />
    </Suspense>
  );
}
