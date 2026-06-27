"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type {
  LegalContent,
  ResearchRequest,
  ResearchSessionSummary,
  ResearchSource,
  SearchRequest,
  SearchResult,
} from "@delaw/types";

import {
  ApiError,
  researchApi,
  streamResearch,
} from "@/lib/api-client";

export type StreamStatus = "idle" | "loading" | "streaming" | "complete" | "error";

function describeError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.code === "INSUFFICIENT_CREDITS") return "INSUFFICIENT_CREDITS";
    return err.message;
  }
  return err instanceof Error ? err.message : "Something went wrong";
}

/**
 * Streams the RAG research answer for the given input. Manages the connection
 * lifecycle and exposes loading / streaming / complete / error states with a
 * `retry` for reconnection. Pass `null` to stay idle.
 */
export function useResearchStream(input: ResearchRequest | null) {
  const [status, setStatus] = useState<StreamStatus>("idle");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<ResearchSource[]>([]);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const key = input ? JSON.stringify(input) : null;

  const run = useCallback(async () => {
    if (!key) return;
    const parsed = JSON.parse(key) as ResearchRequest;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setStatus("loading");
    setAnswer("");
    setSources([]);
    setError(null);

    try {
      await streamResearch(parsed, {
        signal: ctrl.signal,
        onEvent: (event) => {
          if (event.type === "token") {
            setStatus("streaming");
            setAnswer((prev) => prev + event.text);
          } else if (event.type === "sources") {
            setSources(event.sources);
          } else if (event.type === "done") {
            setStatus("complete");
          }
        },
      });
      setStatus((prev) => (prev === "error" ? prev : "complete"));
    } catch (err) {
      if (ctrl.signal.aborted) return;
      setError(describeError(err));
      setStatus("error");
    }
  }, [key]);

  useEffect(() => {
    void run();
    return () => abortRef.current?.abort();
  }, [run]);

  return { status, answer, sources, error, retry: run };
}

/** The current user's most recent research queries. */
export function useRecentSearches(limit = 5) {
  const [sessions, setSessions] = useState<ResearchSessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    researchApi
      .recentSessions(limit)
      .then((res) => active && setSessions(res.sessions))
      .catch(() => active && setSessions([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [limit]);

  return { sessions, loading };
}

/** Hybrid search for the results list. */
export function useSearch(input: SearchRequest | null) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState<StreamStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const key = input ? JSON.stringify(input) : null;

  const run = useCallback(() => {
    if (!key) return;
    const parsed = JSON.parse(key) as SearchRequest;
    setStatus("loading");
    setError(null);
    researchApi
      .search(parsed)
      .then((res) => {
        setResults(res.results);
        setStatus("complete");
      })
      .catch((err) => {
        setError(describeError(err));
        setStatus("error");
      });
  }, [key]);

  useEffect(() => {
    run();
  }, [run]);

  return { results, status, error, retry: run };
}

/** Load a single authority for the case viewer. */
export function useCase(id: string | null) {
  const [data, setData] = useState<LegalContent | null>(null);
  const [status, setStatus] = useState<StreamStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!id) return;
    setStatus("loading");
    setError(null);
    researchApi
      .getCase(id)
      .then((res) => {
        setData(res.case);
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

  return { data, status, error, retry: load };
}
