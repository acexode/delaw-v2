"""Research + search endpoints (spec §5.6)."""

from collections.abc import AsyncIterator

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from ..dependencies import require_service_secret
from ..models.requests import ResearchRequest, SearchRequest
from ..models.responses import SearchResponse
from ..services import rag, retrieval
from . import SSE_HEADERS, format_sse

router = APIRouter(
    prefix="/internal",
    tags=["research"],
    dependencies=[Depends(require_service_secret)],
)


@router.post("/research")
async def research(body: ResearchRequest) -> StreamingResponse:
    async def event_stream() -> AsyncIterator[str]:
        async for event in rag.research(
            query=body.query,
            jurisdiction=body.jurisdiction,
            mode=body.mode,
            matter_context=body.matter_context,
        ):
            yield format_sse(event)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers=SSE_HEADERS,
    )


@router.post("/search", response_model=SearchResponse)
async def search(body: SearchRequest) -> SearchResponse:
    results = await retrieval.hybrid_search(
        query=body.query,
        jurisdiction=body.jurisdiction,
        filters=body.filters,
        limit=body.limit,
    )
    return SearchResponse(results=results)
