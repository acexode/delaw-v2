// Legal research domain types — shared between the Node API and web client.
// Mirror the AI proxy routes (apps/api/src/routes/ai.ts, spec §4.5) and the
// internal AI service search/research contracts (spec §5.6).

export type ResearchMode = "QUICK" | "DEEP" | "CASE_LAW";

export type ContentType =
  | "CASE_LAW"
  | "STATUTE"
  | "REGULATION"
  | "COURT_RULE"
  | "TREATY"
  | "PRACTICE_DIRECTION";

export type AuthorityStatus =
  | "GOOD_LAW"
  | "OVERRULED"
  | "DISTINGUISHED"
  | "DOUBTED";

export interface SearchFilters {
  contentTypes?: ContentType[];
  courts?: string[];
  jurisdictions?: string[];
  subjectAreas?: string[];
  yearFrom?: number;
  yearTo?: number;
}

export interface ResearchRequest {
  query: string;
  jurisdiction?: string;
  mode?: ResearchMode;
  matterId?: string;
  matterContext?: string;
}

export interface SearchRequest {
  query: string;
  jurisdiction?: string;
  filters?: SearchFilters;
  limit?: number;
}

/** A ranked authority returned by hybrid search. */
export interface SearchResult {
  id: string;
  type: string;
  jurisdiction: string;
  title: string;
  citation: string | null;
  suit_number: string | null;
  court: string | null;
  year: number | null;
  authority_status: string;
  source: string | null;
  source_url: string | null;
  summary: string | null;
  subject_area: string[] | null;
  score: number;
  semantic_score: number | null;
  keyword_score: number | null;
}

export interface SearchResponse {
  results: SearchResult[];
}

/** A source attached to the final research SSE event. */
export interface ResearchSource {
  index: number;
  id: string;
  title: string;
  citation: string | null;
  court: string | null;
  year: number | null;
  authority_status: string;
  source_url: string | null;
  cited: boolean;
}

/** SSE event frames emitted by POST /api/v1/ai/research. */
export type ResearchStreamEvent =
  | { type: "token"; text: string }
  | { type: "sources"; sources: ResearchSource[] }
  | { type: "done" };

export interface ResearchSessionSummary {
  id: string;
  query: string;
  jurisdiction: string;
  mode: ResearchMode | string;
  createdAt: string;
}

export interface ResearchSessionsResponse {
  sessions: ResearchSessionSummary[];
}

/** A full authority for the case viewer (GET /api/v1/ai/legal-content/:id). */
export interface LegalContent {
  id: string;
  type: ContentType | string;
  jurisdiction: string;
  title: string;
  citation: string | null;
  suitNumber: string | null;
  court: string | null;
  dateDecided: string | null;
  year: number | null;
  subjectArea: string[] | null;
  fullText: string;
  summary: string | null;
  ratio: string | null;
  authorityStatus: string;
  overruledBy: string | null;
  source: string | null;
  sourceUrl: string | null;
  createdAt: string;
  updatedAt: string;
  overruledByCase: { id: string; title: string; citation: string | null } | null;
}

export interface LegalContentResponse {
  case: LegalContent;
}
