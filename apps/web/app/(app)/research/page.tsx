"use client";

import { ChevronDown, Clock, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useRecentSearches } from "@/hooks/useResearch";
import type { ResearchMode } from "@delaw/types";

const MODES: { id: ResearchMode; label: string }[] = [
  { id: "QUICK", label: "Quick Answer" },
  { id: "DEEP", label: "Deep Research" },
  { id: "CASE_LAW", label: "Case Law Search" },
];

const FILTER_PILLS = [
  "Jurisdiction: Nigeria",
  "Court: All",
  "Date: 1960–2026",
  "Legal area",
  "Source: Case Law",
];

// Static until matter-derived suggestions exist (matters API not yet built).
const SUGGESTED = [
  {
    title: "Test for locus standi in Nigerian courts",
    matter: "General research",
  },
  {
    title: "Requirements for a valid compulsory land acquisition",
    matter: "Land & property",
  },
  {
    title: "Directors' fiduciary duties under CAMA 2020",
    matter: "Corporate advisory",
  },
  {
    title: "Admissibility of electronically generated evidence",
    matter: "Litigation",
  },
];

export default function ResearchHomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<ResearchMode>("QUICK");
  const { sessions, loading } = useRecentSearches(5);

  const submit = (q: string, m: ResearchMode = mode) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    const params = new URLSearchParams({
      q: trimmed,
      mode: m,
      jurisdiction: "NG",
    });
    router.push(`/research/results?${params.toString()}`);
  };

  return (
    <div className="flex flex-col items-center px-[30px] pb-[70px] pt-14">
      <div className="w-full max-w-[740px]">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[13px] border border-gold/30 bg-gold/10 text-gold">
            <Sparkles size={22} />
          </div>
          <h1 className="mb-2 font-serif text-[28px] font-semibold tracking-tight text-text-cream">
            What would you like to research?
          </h1>
          <p className="text-sm text-text-muted">
            Grounded in Nigerian case law, legislation &amp; regulations — every
            authority verified.
          </p>
        </div>

        <div className="mb-3.5 flex justify-center">
          <div className="inline-flex rounded-[10px] border border-line-default bg-bg-850 p-[3px]">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={`h-[30px] rounded-[7px] px-3.5 text-[12.5px] transition ${
                  mode === m.id
                    ? "bg-gold font-bold text-gold-ink"
                    : "font-semibold text-text-muted hover:text-text-body"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(query);
          }}
          style={{ boxShadow: "0 8px 30px rgba(0,0,0,.3)" }}
          className="flex items-center gap-3 rounded-[14px] border border-line-raised bg-bg-750 px-4 py-3.5 focus-within:border-gold"
        >
          <Search size={18} className="flex-none text-gold" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            placeholder="Can the State compulsorily acquire land for a private commercial purpose?"
            className="min-w-0 flex-1 border-none bg-transparent text-[14.5px] text-text-body outline-none"
          />
          <button
            type="submit"
            disabled={!query.trim()}
            style={{ background: "linear-gradient(135deg,#D4B25E,#C9A84C)" }}
            className="h-9 flex-none rounded-[10px] px-[18px] text-[13px] font-bold text-gold-ink disabled:opacity-50"
          >
            Research
          </button>
        </form>

        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {FILTER_PILLS.map((p, i) => (
            <span
              key={p}
              className="inline-flex h-[30px] items-center gap-1.5 rounded border border-line-strong bg-bg-750 px-3 text-[12px] font-medium text-text-secondary"
            >
              {i === 0 && <SlidersHorizontal size={13} />}
              {p}
              <ChevronDown size={13} className="text-text-faint" />
            </span>
          ))}
        </div>
      </div>

      <div className="mt-10 grid w-full max-w-[740px] grid-cols-2 gap-[18px]">
        <div>
          <div className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-text-faint">
            Recent searches
          </div>
          <div className="flex flex-col gap-[7px]">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[38px] animate-pulse rounded-[10px] border border-line-default bg-bg-750"
                />
              ))
            ) : sessions.length === 0 ? (
              <div className="rounded-[10px] border border-dashed border-line-default bg-bg-750 px-3 py-4 text-[12px] text-text-muted">
                No recent searches yet. Your research history will appear here.
              </div>
            ) : (
              sessions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => submit(s.query, (s.mode as ResearchMode) ?? "QUICK")}
                  className="flex items-center gap-2.5 rounded-[10px] border border-line-default bg-bg-750 px-3 py-2.5 text-left hover:border-line-accent"
                >
                  <Clock size={14} className="flex-none text-text-faint" />
                  <span className="truncate text-[12.5px] text-text-secondary">
                    {s.query}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-text-faint">
            Suggested from your matters
          </div>
          <div className="flex flex-col gap-[7px]">
            {SUGGESTED.map((t) => (
              <button
                key={t.title}
                type="button"
                onClick={() => submit(t.title)}
                className="rounded-[10px] border border-line-default bg-bg-750 px-3 py-2.5 text-left hover:border-gold"
              >
                <div className="text-[12.5px] font-medium leading-snug text-text-body">
                  {t.title}
                </div>
                <div className="mt-1 text-[11px] text-gold-muted">{t.matter}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
