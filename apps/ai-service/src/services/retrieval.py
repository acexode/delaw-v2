"""Hybrid retrieval — vector + full-text search with re-ranking (spec §5.2)."""

from __future__ import annotations

import asyncio
from typing import Any

from .. import db
from ..config import get_settings
from ..models.requests import SearchFilters
from ..models.responses import SearchResult
from . import embeddings

# Re-rank weights: semantic + keyword + recency + court authority (spec §5.2).
_W_SEMANTIC = 0.55
_W_KEYWORD = 0.25
_W_RECENCY = 0.10
_W_AUTHORITY = 0.10

# Status that is no longer good law is heavily downranked.
_OVERRULED_PENALTY = 0.5


def _to_result(row: dict[str, Any]) -> SearchResult:
    return SearchResult(
        id=str(row["id"]),
        type=str(row["type"]),
        jurisdiction=row["jurisdiction"],
        title=row["title"],
        citation=row.get("citation"),
        suit_number=row.get("suit_number"),
        court=row.get("court"),
        year=row.get("year"),
        authority_status=row.get("authority_status") or "GOOD_LAW",
        source=row.get("source"),
        source_url=row.get("source_url"),
        score=float(row.get("score") or 0.0),
    )


def _court_authority_weight(court: str | None) -> float:
    if not court:
        return 0.3
    lowered = court.lower()
    if "supreme" in lowered:
        return 1.0
    if "court of appeal" in lowered:
        return 0.7
    if "federal high" in lowered or "high court" in lowered:
        return 0.5
    return 0.3


def _recency_weight(year: int | None) -> float:
    if not year:
        return 0.3
    # Linearly scale 1980 -> 0.0, 2030 -> 1.0, clamped.
    return max(0.0, min(1.0, (year - 1980) / 50))


async def semantic_search(
    query_embedding: list[float],
    jurisdiction: str | None,
    content_type: str | None,
    limit: int = 12,
) -> list[SearchResult]:
    rows = await db.vector_search(query_embedding, jurisdiction, content_type, limit)
    return [_to_result(row) for row in rows]


async def keyword_search(
    query: str,
    jurisdiction: str | None,
    limit: int = 12,
    content_type: str | None = None,
) -> list[SearchResult]:
    rows = await db.fulltext_search(query, jurisdiction, content_type, limit)
    return [_to_result(row) for row in rows]


async def hybrid_search(
    query: str,
    jurisdiction: str | None,
    filters: SearchFilters | None = None,
    limit: int | None = None,
) -> list[SearchResult]:
    settings = get_settings()
    limit = limit or settings.retrieval_limit
    content_type = filters.content_type if filters else None

    query_embedding = await embeddings.generate_embedding(query)

    # Over-fetch from each retriever so the merge has candidates to re-rank.
    fetch = limit * 2
    semantic, keyword = await asyncio.gather(
        semantic_search(query_embedding, jurisdiction, content_type, fetch),
        keyword_search(query, jurisdiction, fetch, content_type),
    )

    return _merge_and_rerank(semantic, keyword, limit)


def _merge_and_rerank(
    semantic: list[SearchResult],
    keyword: list[SearchResult],
    limit: int,
) -> list[SearchResult]:
    merged: dict[str, SearchResult] = {}

    for result in semantic:
        result.semantic_score = result.score
        merged[result.id] = result

    max_keyword = max((r.score for r in keyword), default=0.0) or 1.0
    for result in keyword:
        normalised = result.score / max_keyword
        existing = merged.get(result.id)
        if existing is not None:
            existing.keyword_score = normalised
        else:
            result.keyword_score = normalised
            result.semantic_score = 0.0
            merged[result.id] = result

    for result in merged.values():
        semantic_score = result.semantic_score or 0.0
        keyword_score = result.keyword_score or 0.0
        combined = (
            _W_SEMANTIC * semantic_score
            + _W_KEYWORD * keyword_score
            + _W_RECENCY * _recency_weight(result.year)
            + _W_AUTHORITY * _court_authority_weight(result.court)
        )
        if result.authority_status == "OVERRULED":
            combined *= _OVERRULED_PENALTY
        result.score = round(combined, 6)

    ranked = sorted(merged.values(), key=lambda r: r.score, reverse=True)
    return ranked[:limit]
