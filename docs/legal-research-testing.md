# Legal Research Module — How to Test

End-to-end test plan for the legal research module (API proxy + frontend,
spec §4.5 / screens 11–13). Run this together after the design review is done.

## Prerequisites

1. **PostgreSQL 16 + pgvector** running, with the schema migrated and the
   indexes from `infrastructure/scripts/indexes.sql` applied (pgvector
   extension, `ivfflat` embedding index, FTS GIN index).
2. **Redis** running (used elsewhere; not required for these routes).
3. **Environment**
   - `apps/ai-service/.env`: real `OPENAI_API_KEY` and `ANTHROPIC_API_KEY`,
     plus `DATABASE_URL` and `AI_SERVICE_SECRET`.
   - `apps/api/.env`: `AI_SERVICE_URL=http://localhost:8000` and the **same**
     `AI_SERVICE_SECRET` as the AI service, plus the usual API env
     (`DATABASE_URL`, JWT keys, etc.).
   - `apps/web`: `NEXT_PUBLIC_API_URL=http://localhost:4000` (default).

## Start the three services

```bash
# 1. Python AI service (from apps/ai-service, venv activated)
uvicorn src.main:app --reload --port 8000

# 2. Node API
pnpm --filter @delaw/api dev

# 3. Web app
pnpm --filter @delaw/web dev
```

Health checks: `GET http://localhost:8000/health` and
`GET http://localhost:4000/health` should both return `{ "status": "ok" }`.

## Seed some authorities

The search/research routes need rows in `legal_content`. A seed script ingests
12 real, citation-verified Nigerian authorities (8 cases + 4 statutes) via the
internal `/internal/ingest` endpoint, which embeds and stores each record. The
set deliberately varies `authority_status` so badges and ranking are visible:
10 `GOOD_LAW`, 1 `DOUBTED` (Mojekwu v. Mojekwu), and 1 `OVERRULED`
(Lakanmi v. AG Western State, nullified by Decree 28 of 1970).

```bash
# From apps/ai-service, with the venv active and the service running.
# Reads AI_SERVICE_SECRET from .env; embeds via OPENAI_API_KEY.
python seed_data.py
```

Expect `Ingested 12/12 records into legal_content.` Re-running appends
duplicates — `TRUNCATE legal_content;` first if you want a clean reseed.

Quick sanity check of retrieval (ranks Kubor v. Dickson + the Evidence Act
2011 top):

```bash
curl -X POST http://localhost:8000/internal/search \
  -H "Content-Type: application/json" \
  -H "X-Service-Secret: <AI_SERVICE_SECRET>" \
  -d '{"query":"admissibility of electronic evidence","jurisdiction":"NG","limit":3}'
```

To add more authorities, append entries to `RECORDS` in
`apps/ai-service/seed_data.py`. The ingest endpoint now accepts the full record
shape: `suit_number`, `subject_area` (string array), `summary`, `ratio`,
`authority_status`, `source_url`, and an explicit `year` (used when the exact
decision `date` is unknown).

## Test flow

1. **Auth** — register/login so the web app holds an access token.
2. **Research home** (`/research`)
   - [ ] Search bar, mode toggle (Quick / Deep / Case Law), and filter pills
         render per design.
   - [ ] "Recent searches" loads from `GET /api/v1/ai/research/sessions`
         (empty state on a fresh account).
   - [ ] Submitting a query navigates to `/research/results?q=...&mode=...`.
3. **Results** (`/research/results`)
   - [ ] AI Answer panel: shows loading skeleton, then streams tokens with a
         typing caret, then completes; citation chips appear.
   - [ ] Error state shows a Retry button (try with the AI service stopped).
   - [ ] Authorities list renders cards with citation, court/year, AI summary,
         relevance %, and the correct authority-status badge.
   - [ ] Clicking a card opens the preview; "Open full case" navigates to the
         case viewer.
4. **Case viewer** (`/research/[caseId]`)
   - [ ] Loads via `GET /api/v1/ai/legal-content/:id`; full text, section nav,
         and tabs render.
   - [ ] Authority Health shows real Status + Overruled-by.
   - [ ] Highlight text → annotation popover → save (persists across reload via
         localStorage).
5. **Credits**
   - [ ] After a research run, `organisations.ai_credits_used` increases by
         3 (Quick) or 8 (Deep), and search adds 1.
   - [ ] Set `ai_credits_used` near `ai_credits_quota` and confirm a **402**
         with `{ "error": "INSUFFICIENT_CREDITS" }` surfaces in the UI.
   - [ ] Stop the AI service and confirm credits are **refunded** (no net
         deduction on a failed call).
6. **Persistence**
   - [ ] After a completed research run, a row appears in `research_sessions`
         with `ai_answer` + `sources_used`, and shows up in "Recent searches".

## Known limitations during testing

See `docs/legal-research-followups.md` — save-to-matter, DB annotations,
citation-graph counts, and the Court/Date/Legal-area filters are stubbed or
display-only pending their APIs/schema.
