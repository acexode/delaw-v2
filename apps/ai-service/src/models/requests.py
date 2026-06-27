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
    content_type: ContentType | None = None


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


class IngestRequest(BaseModel):
    content_type: ContentType
    jurisdiction: str = "NG"
    title: str = Field(min_length=1)
    citation: str | None = None
    court: str | None = None
    date: str | None = None
    full_text: str = Field(min_length=1)
    source: str | None = None


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
