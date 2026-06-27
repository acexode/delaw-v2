"""Legal chat endpoint — streaming SSE with RAG grounding (spec §5.4, §5.6)."""

from collections.abc import AsyncIterator
from uuid import UUID

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from .. import db
from ..config import get_settings
from ..dependencies import require_service_secret
from ..models.requests import ChatRequest
from ..models.responses import ResearchSource
from ..prompts import chat as chat_prompt
from ..services import llm, retrieval
from . import SSE_HEADERS, format_sse

router = APIRouter(
    prefix="/internal",
    tags=["chat"],
    dependencies=[Depends(require_service_secret)],
)


def _latest_user_message(messages: list) -> str:
    for message in reversed(messages):
        if message.role == "user":
            return message.content
    return messages[-1].content


@router.post("/chat")
async def chat(body: ChatRequest) -> StreamingResponse:
    settings = get_settings()
    query = _latest_user_message(body.messages)
    results = await retrieval.hybrid_search(query, body.jurisdiction)

    texts = await db.fetch_source_texts([UUID(r.id) for r in results])
    source_context = [
        {
            "title": r.title,
            "citation": r.citation,
            "court": r.court,
            "year": r.year,
            "authority_status": r.authority_status,
            "summary": (texts.get(r.id, {}) or {}).get("summary")
            or (texts.get(r.id, {}) or {}).get("ratio")
            or (texts.get(r.id, {}) or {}).get("snippet"),
        }
        for r in results
    ]
    system_prompt = chat_prompt.build_system_prompt(
        body.jurisdiction, source_context, body.matter_context
    )
    history = [{"role": m.role, "content": m.content} for m in body.messages]

    async def event_stream() -> AsyncIterator[str]:
        async for delta in llm.stream_text(
            system=system_prompt,
            messages=history,
            model=settings.chat_model,
            max_tokens=settings.chat_max_tokens,
        ):
            yield format_sse({"type": "token", "text": delta})
        sources = [
            ResearchSource(
                index=index,
                id=r.id,
                title=r.title,
                citation=r.citation,
                court=r.court,
                year=r.year,
                authority_status=r.authority_status,
                source_url=r.source_url,
            ).model_dump()
            for index, r in enumerate(results, start=1)
        ]
        yield format_sse({"type": "sources", "sources": sources})
        yield format_sse({"type": "done"})

    return StreamingResponse(
        event_stream(), media_type="text/event-stream", headers=SSE_HEADERS
    )
