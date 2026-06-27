"""Embedding generation and storage (spec §5.3).

Uses OpenAI text-embedding-3-small (1536 dims). Bulk ingestion is batched in
groups of 100 to stay within request limits.
"""

from __future__ import annotations

from functools import lru_cache
from uuid import UUID

from openai import AsyncOpenAI

from .. import db
from ..config import get_settings


@lru_cache
def _client() -> AsyncOpenAI:
    return AsyncOpenAI(api_key=get_settings().openai_api_key)


def _prepare(text: str) -> str:
    """Collapse whitespace and cap length to stay under the model's token limit."""
    cleaned = " ".join(text.split())
    return cleaned[: get_settings().embedding_max_chars]


async def generate_embedding(text: str) -> list[float]:
    settings = get_settings()
    response = await _client().embeddings.create(
        model=settings.embedding_model,
        input=_prepare(text),
    )
    return response.data[0].embedding


async def batch_embed(texts: list[str]) -> list[list[float]]:
    settings = get_settings()
    batch_size = settings.embedding_batch_size
    embeddings: list[list[float]] = []
    for start in range(0, len(texts), batch_size):
        batch = [_prepare(t) for t in texts[start : start + batch_size]]
        response = await _client().embeddings.create(
            model=settings.embedding_model,
            input=batch,
        )
        embeddings.extend(item.embedding for item in sorted(response.data, key=lambda d: d.index))
    return embeddings


async def store_embedding(content_id: UUID, embedding: list[float]) -> None:
    await db.update_embedding(content_id, embedding)
