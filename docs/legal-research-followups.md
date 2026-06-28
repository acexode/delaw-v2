# Legal Research Module — Required Follow-ups

These items were deliberately **not** faked during the legal research build
(spec §4.5 / screens 11–13). Each is blocked on schema or API surface that does
not exist yet. They are tracked here so they are not lost.

## 1. Save-to-matter / "Save to matter" button

- **Where:** results right-panel preview, case viewer footer, results card "Save".
- **Current state:** shows a "coming soon" toast; no persistence.
- **Blocked on:**
  - Matters API (`/api/v1/matters`) — not implemented (only `auth` + `ai`
    routes exist so far).
  - A saved-authorities link table (e.g. `matter_authorities`) joining
    `matters` ↔ `legal_content`. Not in spec §3 schema.
- **To finish:** add the link table + migration, a
  `POST /api/v1/matters/:id/authorities` endpoint, and a matter-picker UI.

## 2. DB-backed annotations (highlight → save note)

- **Where:** case viewer (`/research/[caseId]`) highlight-to-annotate popover.
- **Current state:** notes persist to `localStorage`, keyed by case id.
- **Blocked on:** there is no annotations/notes table in the schema (spec §3).
- **To finish:** add an `annotations` table
  (`organisation_id`, `user_id`, `content_id`, `quote`, `note`, timestamps),
  a `POST/GET /api/v1/ai/legal-content/:id/annotations` endpoint, and swap the
  `localStorage` calls in the case viewer for the API.

## 3. Authority-health citation graph

- **Where:** case viewer → Authority Health tab
  (Followed by / Distinguished in / Cited by / Cases cited).
- **Current state:** `Status` and `Overruled by` are real (from
  `legal_content.authority_status` and the `overruled_by` FK). The rest show
  "Not tracked yet".
- **Blocked on:** the corpus models only a single `overruled_by` FK — there is
  no citation-edge/treatment model.
- **To finish:** add a `citation_edges` table
  (`from_content_id`, `to_content_id`, `treatment`
  ∈ FOLLOWED|DISTINGUISHED|OVERRULED|CITED), populate it during ingestion, and
  expand `GET /api/v1/ai/legal-content/:id` to aggregate counts + lists.

## 4. Results filters: Court / Legal area / Source type / Jurisdiction — DONE

- **Where:** results left filters rail (`/research/results`).
- **Current state:** **implemented server-side.** The filter rail is wired into
  the search request and the internal search query filters by `content_types`,
  `courts`, `jurisdictions`, `subject_areas`, and `year_from`/`year_to`
  (`subject_areas` match as substrings, so "Constitutional" matches
  "Constitutional Law"). A group with all/none of its options ticked imposes no
  constraint, so the default (all on) returns the full corpus.
- **Remaining:** there is no UI control for the **date range** yet — the API
  supports `year_from`/`year_to`, but the prototype rail has no date widget to
  drive it. Add a year-range control to the rail when desired. The research
  **home** filter pills are still display-only (the rail on the results page is
  the functional surface).

## 5. "Use in document"

- **Where:** case viewer footer.
- **Current state:** routes to `/documents/new`.
- **Blocked on:** the document editor / drafting module is not built yet.
- **To finish:** pass the selected authority into the editor (insert citation)
  once the documents module exists.

## 6. Matter-derived suggested topics (research home)

- **Where:** research home "Suggested topics" cards.
- **Current state:** 4 static cards (per the brief: "static for now").
- **Blocked on:** matters API + a suggestion source.
- **To finish:** derive suggestions from the user's active matters once the
  matters API exists.
