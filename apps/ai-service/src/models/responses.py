"""Response models for the internal AI endpoints (spec §5.6)."""

from pydantic import BaseModel


class SearchResult(BaseModel):
    id: str
    type: str
    jurisdiction: str
    title: str
    citation: str | None = None
    suit_number: str | None = None
    court: str | None = None
    year: int | None = None
    authority_status: str = "GOOD_LAW"
    source: str | None = None
    source_url: str | None = None
    summary: str | None = None
    # Combined re-rank score; component scores retained for transparency.
    score: float = 0.0
    semantic_score: float | None = None
    keyword_score: float | None = None


class SearchResponse(BaseModel):
    results: list[SearchResult]


class ResearchSource(BaseModel):
    index: int
    id: str
    title: str
    citation: str | None = None
    court: str | None = None
    year: int | None = None
    authority_status: str = "GOOD_LAW"
    source_url: str | None = None
    cited: bool = False


class IngestResponse(BaseModel):
    id: str
    status: str = "ingested"


class CitationMatch(BaseModel):
    text: str
    resolved: bool
    content_id: str | None = None
    title: str | None = None
    citation: str | None = None
    authority_status: str | None = None
    score: float | None = None


class CitationCheckResponse(BaseModel):
    matches: list[CitationMatch]


class DocumentResult(BaseModel):
    result: str
    model: str
