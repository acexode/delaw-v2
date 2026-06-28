"use client";

import {
  ArrowLeft,
  BookOpen,
  Bookmark,
  Check,
  Download,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

import { AuthorityBadge } from "@/components/research/authority";
import { useCase, useResearchStream, useSearch } from "@/hooks/useResearch";
import {
  buildFilters,
  checkedFromParams,
  dateFromParams,
  DATE_OPTIONS,
  FILTER_GROUPS,
  filterKey,
} from "@/lib/research-filters";
import type { ResearchMode, SearchResult } from "@delaw/types";

function FiltersRail({
  checked,
  toggle,
  dateValue,
  setDate,
  onClose,
}: {
  checked: Set<string>;
  toggle: (key: string) => void;
  dateValue: string;
  setDate: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <aside className="w-[212px] flex-none overflow-y-auto border-r border-line-subtle bg-bg-900 p-4">
      <div className="mb-4 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[13px] font-semibold text-text-body">
          <SlidersHorizontal size={14} /> Filters
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-text-faint hover:text-text-body"
        >
          <X size={15} />
        </button>
      </div>
      {FILTER_GROUPS.map((g) => (
        <div key={g.label} className="mb-4">
          <div className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.07em] text-text-faint">
            {g.label}
          </div>
          <div className="flex flex-col gap-2">
            {g.opts.map((o) => {
              const key = filterKey(g.label, o.value);
              const on = checked.has(key);
              return (
                <label
                  key={o.value}
                  className="flex cursor-pointer items-center gap-2.5 text-[12.5px] text-text-secondary"
                >
                  <span
                    onClick={() => toggle(key)}
                    className={`flex h-[17px] w-[17px] flex-none items-center justify-center rounded-[5px] border-[1.5px] ${
                      on
                        ? "border-gold bg-gold text-gold-ink"
                        : "border-line-accent text-transparent"
                    }`}
                  >
                    {on && <Check size={11} strokeWidth={3} />}
                  </span>
                  {o.label}
                </label>
              );
            })}
          </div>
        </div>
      ))}

      <div className="mb-4">
        <div className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.07em] text-text-faint">
          Date
        </div>
        <div className="flex flex-col gap-2">
          {DATE_OPTIONS.map((o) => {
            const on = dateValue === o.value;
            return (
              <label
                key={o.value}
                className="flex cursor-pointer items-center gap-2.5 text-[12.5px] text-text-secondary"
              >
                <span
                  onClick={() => setDate(o.value)}
                  className={`flex h-[17px] w-[17px] flex-none items-center justify-center rounded-full border-[1.5px] ${
                    on
                      ? "border-gold bg-gold text-gold-ink"
                      : "border-line-accent text-transparent"
                  }`}
                >
                  {on && <Check size={11} strokeWidth={3} />}
                </span>
                {o.label}
              </label>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

function PreviewPanel({
  result,
  onOpen,
  onSave,
}: {
  result: SearchResult;
  onOpen: () => void;
  onSave: () => void;
}) {
  const [tab, setTab] = useState<"full" | "summary">("summary");
  const detail = useCase(result.id);

  return (
    <aside className="flex w-[332px] flex-none flex-col border-l border-line-subtle bg-bg-900">
      <div className="border-b border-line-subtle p-[17px]">
        <div className="flex items-start justify-between gap-2.5">
          <div className="font-serif text-[15px] font-semibold leading-tight text-text-cream">
            {result.title}
          </div>
          <AuthorityBadge status={result.authority_status} />
        </div>
        {result.citation && (
          <div className="mt-[5px] font-mono text-[11.5px] text-gold">
            {result.citation}
          </div>
        )}
        <div className="mt-1 text-[11.5px] text-text-faint">
          {[result.court, result.year].filter(Boolean).join(" · ")}
        </div>
      </div>

      <div className="flex gap-[18px] border-b border-line-subtle px-[17px] pt-2.5">
        {(
          [
            ["full", "Full text"],
            ["summary", "AI summary"],
          ] as ["full" | "summary", string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`pb-2.5 text-[12.5px] ${
              tab === id
                ? "font-semibold text-text-cream shadow-[inset_0_-2px_0_#C9A84C]"
                : "text-text-muted hover:text-text-body"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-[17px] font-serif text-[12.5px] leading-[1.75] text-text-secondary">
        {tab === "summary" ? (
          (result.summary ?? detail.data?.summary) ||
          "No summary available for this authority yet."
        ) : detail.status === "loading" || detail.status === "idle" ? (
          <div className="flex flex-col gap-2">
            {[100, 96, 92, 88].map((w) => (
              <div
                key={w}
                className="h-3 animate-pulse rounded bg-bg-600"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        ) : (
          detail.data?.fullText ?? "Full text unavailable."
        )}
      </div>

      <div className="flex flex-none flex-col gap-2.5 border-t border-line-subtle p-4">
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
          onClick={onSave}
          className="flex h-9 items-center justify-center gap-2 rounded-[10px] border border-line-strong bg-bg-750 text-[12.5px] font-semibold text-text-body hover:border-line-accent"
        >
          <Bookmark size={14} /> Save to matter
        </button>
      </div>
    </aside>
  );
}

function ResultsInner() {
  const router = useRouter();
  const params = useSearchParams();
  const query = params.get("q") ?? "";
  const mode = (params.get("mode") as ResearchMode) ?? "QUICK";
  const jurisdiction = params.get("jurisdiction") ?? "NG";

  const [filtersOpen, setFiltersOpen] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  // Seed the rail from the filters the user chose on the research home page.
  const [checked, setChecked] = useState<Set<string>>(() =>
    checkedFromParams(params),
  );
  const [dateValue, setDateValue] = useState<string>(() => dateFromParams(params));

  const toggle = (key: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

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
            filters: buildFilters(checked, mode, dateValue),
            limit: 12,
          }
        : null,
    [query, mode, jurisdiction, checked, dateValue],
  );

  const { status, answer, sources, error, retry } = useResearchStream(researchInput);
  const search = useSearch(searchInput);

  const results = search.results;
  const selected =
    results.find((r) => r.id === selectedId) ?? results[0] ?? null;

  const citedSources = sources.filter((s) => s.cited);
  const chips = citedSources.length > 0 ? citedSources : sources.slice(0, 3);
  const openCase = (id: string) => router.push(`/research/${id}`);
  const modeLabel = mode.replace("_", " ").toLowerCase();

  const exportResults = () => {
    const lines = [
      `# ${query}`,
      "",
      "## AI Answer",
      answer || "(no answer)",
      "",
      "## Authorities",
      ...results.map(
        (r) =>
          `- ${r.title}${r.citation ? ` — ${r.citation}` : ""} (${[r.court, r.year]
            .filter(Boolean)
            .join(", ")})`,
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "research.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full min-h-0">
      {filtersOpen && (
        <FiltersRail
          checked={checked}
          toggle={toggle}
          dateValue={dateValue}
          setDate={setDateValue}
          onClose={() => setFiltersOpen(false)}
        />
      )}

      <div className="min-w-0 flex-1 overflow-y-auto px-[22px] pb-11 pt-[18px]">
        <div className="mb-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/research")}
            className="flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-line-strong bg-bg-750 text-text-muted hover:border-line-accent hover:text-text-body"
          >
            <ArrowLeft size={16} />
          </button>
          {!filtersOpen && (
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-line-strong bg-bg-750 px-2.5 text-[12.5px] font-semibold text-text-muted hover:text-text-body"
            >
              <SlidersHorizontal size={14} /> Filters
            </button>
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13.5px] font-semibold text-text-body">
              {query || "Research"}
            </div>
            <div className="mt-0.5 text-[11.5px] text-text-faint">
              {search.status === "complete"
                ? `${results.length} authorities`
                : "Searching…"}{" "}
              · Nigeria · {modeLabel}
            </div>
          </div>
          <button
            type="button"
            onClick={exportResults}
            className="flex h-[34px] items-center gap-1.5 rounded-md border border-line-strong bg-bg-750 px-3 text-[12.5px] font-semibold text-text-body hover:border-line-accent"
          >
            <Download size={14} /> Export
          </button>
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
            <span className="rounded-full border border-gold/25 bg-gold/10 px-[7px] py-0.5 text-[9px] font-bold tracking-[0.06em] text-gold">
              GROUNDED
            </span>
          </div>
          <div className="px-4 py-[15px] text-[13.5px] leading-[1.7] text-text-secondary">
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
                  <div className="mt-[11px] flex flex-wrap gap-[7px]">
                    {chips.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => openCase(s.id)}
                        className="inline-flex items-center rounded-md border border-gold/30 bg-gold/10 px-[9px] py-[3px] font-mono text-[10.5px] font-semibold text-gold hover:bg-gold/20"
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
        <div className="mb-[11px] mt-5 text-[11px] font-semibold uppercase tracking-[0.07em] text-text-faint">
          Authorities · ranked by relevance
        </div>

        {search.status === "error" ? (
          <div className="flex flex-col items-start gap-3 rounded-xl border border-line bg-bg-700 p-5">
            <p className="text-[13px] text-text-muted">
              {search.error === "INSUFFICIENT_CREDITS"
                ? "You have used all of your AI credits for this billing period."
                : "Could not load authorities."}
            </p>
            {search.error !== "INSUFFICIENT_CREDITS" && (
              <button
                type="button"
                onClick={search.retry}
                className="rounded-lg border border-line-strong bg-bg-750 px-3 py-1.5 text-[12.5px] font-semibold text-text-body hover:border-line-accent"
              >
                Retry
              </button>
            )}
          </div>
        ) : search.status !== "complete" ? (
          <div className="flex flex-col gap-[11px]">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-[110px] animate-pulse rounded-[13px] border border-line bg-bg-700"
              />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="rounded-[13px] border border-dashed border-line bg-bg-700 p-8 text-center">
            <h3 className="font-serif text-base text-text-cream">No authorities found</h3>
            <p className="mt-1 text-[13px] text-text-muted">
              Try rephrasing your query or widening the filters.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-[11px]">
            {results.map((a) => {
              const isSel = selected?.id === a.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setSelectedId(a.id)}
                  className={`rounded-[13px] px-4 py-3.5 text-left transition ${
                    isSel
                      ? "border-[1.5px] border-gold bg-bg-600"
                      : "border border-line bg-bg-700 hover:border-line-accent"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-serif text-[14.5px] font-semibold text-text-cream">
                        {a.title}
                      </div>
                      {a.citation && (
                        <div className="mt-[3px] font-mono text-[11.5px] text-gold">
                          {a.citation}
                        </div>
                      )}
                    </div>
                    <AuthorityBadge status={a.authority_status} />
                  </div>
                  {a.summary && (
                    <p className="my-2.5 text-[12.5px] leading-[1.55] text-text-muted">
                      {a.summary}
                    </p>
                  )}
                  <div className="flex items-center gap-3 border-t border-line-subtle pt-[9px] text-[11px] text-text-faint">
                    <span>{[a.court, a.year].filter(Boolean).join(" · ")}</span>
                    <span className="font-semibold text-gold">
                      {Math.round(a.score * 100)}% match
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedId(a.id);
                        setToast("Saving authorities to a matter is coming soon (matters API pending).");
                      }}
                      className="ml-auto flex items-center gap-1.5 font-semibold text-gold"
                    >
                      <Bookmark size={13} /> Save
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selected && (
        <PreviewPanel
          result={selected}
          onOpen={() => openCase(selected.id)}
          onSave={() =>
            setToast("Saving authorities to a matter is coming soon (matters API pending).")
          }
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-line-strong bg-bg-600 px-4 py-2.5 text-[12.5px] text-text-body shadow-card">
          {toast}
          <button type="button" onClick={() => setToast(null)} className="ml-3 text-gold">
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
