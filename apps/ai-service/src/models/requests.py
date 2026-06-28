"""Request models for the internal AI endpoints (spec §5.6)."""

from typing import Literal

from pydantic import BaseModel, Field

ContentType = Literal[
    "CASE_LAW",
    "STATUTE",
    "REGULATION",
    "COURT_RULE",
    "TREATY",
    "PRACTICE_DIRECTION",
]
ResearchMode = Literal["QUICK", "DEEP", "CASE_LAW"]
ChatRole = Literal["user", "assistant"]


class SearchFilters(BaseModel):
    content_types: list[ContentType] | None = None
    courts: list[str] | None = None
    jurisdictions: list[str] | None = None
    subject_areas: list[str] | None = None
    year_from: int | None = None
    year_to: int | None = None


class ResearchRequest(BaseModel):
    query: str = Field(min_length=1)
    jurisdiction: str = "NG"
    mode: ResearchMode = "QUICK"
    matter_context: str | None = None


class SearchRequest(BaseModel):
    query: str = Field(min_length=1)
    jurisdiction: str = "NG"
    filters: SearchFilters = Field(default_factory=SearchFilters)
    limit: int = Field(default=12, ge=1, le=50)


AuthorityStatus = Literal["GOOD_LAW", "OVERRULED", "DISTINGUISHED", "DOUBTED"]


class IngestRequest(BaseModel):
    content_type: ContentType
    jurisdiction: str = "NG"
    title: str = Field(min_length=1)
    citation: str | None = None
    suit_number: str | None = None
    court: str | None = None
    date: str | None = None
    year: int | None = None
    subject_area: list[str] | None = None
    full_text: str = Field(min_length=1)
    summary: str | None = None
    ratio: str | None = None
    authority_status: AuthorityStatus = "GOOD_LAW"
    source: str | None = None
    source_url: str | None = None


class CitationCheckRequest(BaseModel):
    text: str = Field(min_length=1)
    jurisdiction: str = "NG"


class ChatMessage(BaseModel):
    role: ChatRole
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1)
    jurisdiction: str = "NG"
    matter_context: str | None = None


class ProofreadRequest(BaseModel):
    text: str = Field(min_length=1)
    jurisdiction: str = "NG"


class SummariseRequest(BaseModel):
    text: str = Field(min_length=1)
    jurisdiction: str = "NG"
    summary_type: str = "general"


class ContractAnalysisRequest(BaseModel):
    text: str = Field(min_length=1)
    jurisdiction: str = "NG"
    contract_type: str | None = None
