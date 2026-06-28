"""Citation check endpoint (spec §5.4, §5.6).

Resolution is pure retrieval — citations are extracted heuristically then
matched against `legal_content` via vector search. No LLM is involved, so the
service cannot invent or "verify" a citation that does not exist in the corpus.
"""

import re

from fastapi import APIRouter, Depends

from ..dependencies import require_service_secret
from ..models.requests import CitationCheckRequest
from ..models.responses import CitationCheckResponse, CitationMatch
from ..services import embeddings, retrieval

router = APIRouter(
    prefix="/internal",
    tags=["citations"],
    dependencies=[Depends(require_service_secret)],
)

# Heuristic: parenthetical-year citations referencing a known law reporter.
_CITATION_RE = re.compile(
    r"\(\d{4}\)[^.;\n]*?(?:NWLR|LPELR|FWLR|NLR|WRN|All\s?ER|SC|CA|AC|QB|WLR)[^.;\n]*",
    re.IGNORECASE,
)
_RESOLVE_THRESHOLD = 0.6


def _extract_citations(text: str) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []
    for match in _CITATION_RE.findall(text):
        normalised = " ".join(match.split())
        if normalised.lower() not in seen:
            seen.add(normalised.lower())
            ordered.append(normalised)
    return ordered


@router.post("/citation-check", response_model=CitationCheckResponse)
async def citation_check(body: CitationCheckRequest) -> CitationCheckResponse:
    citations = _extract_citations(body.text)
    matches: list[CitationMatch] = []
    for citation in citations:
        embedding = await embeddings.generate_embedding(citation)
        results = await retrieval.semantic_search(
            embedding, retrieval.build_db_filters(body.jurisdiction, None), limit=1
        )
        top = results[0] if results else None
        if top is not None and top.score >= _RESOLVE_THRESHOLD:
            matches.append(
                CitationMatch(
                    text=citation,
                    resolved=True,
                    content_id=top.id,
                    title=top.title,
                    citation=top.citation,
                    authority_status=top.authority_status,
                    score=top.score,
                )
            )
        else:
            matches.append(CitationMatch(text=citation, resolved=False))
    return CitationCheckResponse(matches=matches)
