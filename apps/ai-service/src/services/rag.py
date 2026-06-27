"""Full RAG research pipeline (spec §5.2).

Implements the retrieval-augmented generation flow end to end and streams
results as an async generator of events:

    {"type": "token",   "text": "..."}      # incremental answer tokens
    {"type": "sources", "sources": [...]}    # final sources array (with cited flag)
    {"type": "done"}

Persistence to `research_sessions` (step 10) is performed by the Node.js API,
which holds the organisation/user context; this service is stateless.
"""

from __future__ import annotations

import re
from collections.abc import AsyncIterator
from typing import Any
from uuid import UUID

from .. import db
from ..config import get_settings
from ..models.requests import SearchFilters
from ..models.responses import ResearchSource
from ..prompts import hallucination_guard
from ..prompts import research as research_prompt
from . import llm, retrieval

_CITATION_PATTERN = re.compile(r"\[(\d+)\]")


def _extract_cited_indices(answer: str) -> set[int]:
    return {int(match) for match in _CITATION_PATTERN.findall(answer)}


def _build_source_context(results: list, texts: dict[str, dict[str, Any]]) -> list[dict]:
    sources: list[dict] = []
    for result in results:
        text = texts.get(result.id, {})
        summary = text.get("summary") or text.get("ratio") or text.get("snippet")
        sources.append(
            {
                "title": result.title,
                "citation": result.citation,
                "court": result.court,
                "year": result.year,
                "authority_status": result.authority_status,
                "summary": summary,
            }
        )
    return sources


async def research(
    query: str,
    jurisdiction: str = "NG",
    mode: str = "QUICK",
    matter_context: str | None = None,
) -> AsyncIterator[dict[str, Any]]:
    settings = get_settings()

    # Step 3 — query preprocessing: mode shapes retrieval depth and filters.
    content_type = "CASE_LAW" if mode == "CASE_LAW" else None
    chunk_limit = (
        settings.context_chunks_deep if mode == "DEEP" else settings.context_chunks_quick
    )

    # Steps 4–5 — hybrid retrieval + re-ranking.
    results = await retrieval.hybrid_search(
        query,
        jurisdiction,
        SearchFilters(content_type=content_type),
        limit=chunk_limit,
    )

    # Hallucination guard — no grounding means no answer (spec §5.5).
    if not results:
        yield {"type": "token", "text": hallucination_guard(jurisdiction)}
        yield {"type": "sources", "sources": []}
        yield {"type": "done"}
        return

    # Step 6 — context assembly.
    texts = await db.fetch_source_texts([UUID(r.id) for r in results])
    source_context = _build_source_context(results, texts)
    system_prompt = research_prompt.build_system_prompt(
        jurisdiction, source_context, matter_context
    )

    # Steps 7–8 — LLM call with token streaming.
    answer_parts: list[str] = []
    async for delta in llm.stream_text(
        system=system_prompt,
        messages=[{"role": "user", "content": query}],
        model=settings.research_model,
        max_tokens=settings.research_max_tokens,
    ):
        answer_parts.append(delta)
        yield {"type": "token", "text": delta}

    # Step 9 — citation extraction: map [n] references back to retrieved sources.
    cited = _extract_cited_indices("".join(answer_parts))
    sources = [
        ResearchSource(
            index=index,
            id=result.id,
            title=result.title,
            citation=result.citation,
            court=result.court,
            year=result.year,
            authority_status=result.authority_status,
            source_url=result.source_url,
            cited=index in cited,
        ).model_dump()
        for index, result in enumerate(results, start=1)
    ]
    yield {"type": "sources", "sources": sources}
    yield {"type": "done"}
