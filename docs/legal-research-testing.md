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

The search/research routes need rows in `legal_content`. Ingest a few Nigerian
authorities via the internal endpoint (requires the service secret):

```bash
curl -X POST http://localhost:8000/internal/ingest \
  -H "Content-Type: application/json" \
  -H "X-Service-Secret: <AI_SERVICE_SECRET>" \
  -d '{
    "content_type": "CASE_LAW",
    "jurisdiction": "NG",
    "title": "Bello v. Attorney-General of Oyo State",
    "citation": "(1986) 5 NWLR (Pt. 45) 828, SC",
    "court": "Supreme Court",
    "date": "1986-12-15",
    "full_text": "The appellant'\''s land at Bodija, Ibadan was compulsorily acquired ...",
    "source": "seed"
  }'
```

Repeat for a handful of cases (vary `authority_status`: `GOOD_LAW`,
`OVERRULED`, `DISTINGUISHED`) so the badges and ranking are visible.

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
