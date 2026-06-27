"""asyncpg connection pool and pgvector queries against `legal_content`.

Connection management plus the raw SQL used by the retrieval and ingest
layers. Column names match the Drizzle schema verbatim (spec §3.2). The vector
operator `<=>` is cosine distance, matching the ivfflat `vector_cosine_ops`
index; the full-text predicate mirrors the GIN index expression
(`to_tsvector('english', title || ' ' || full_text)`) — both defined in
infrastructure/scripts/indexes.sql.
"""

from __future__ import annotations

from typing import Any
from uuid import UUID

import asyncpg
from pgvector.asyncpg import register_vector

from .config import get_settings

_pool: asyncpg.Pool | None = None

# Columns returned for every search result (no embedding / full_text payload).
_RESULT_COLUMNS = """
    id, type, jurisdiction, title, citation, suit_number, court,
    year, authority_status, source, source_url
"""


async def _init_connection(conn: asyncpg.Connection) -> None:
    await register_vector(conn)


async def connect() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        settings = get_settings()
        _pool = await asyncpg.create_pool(
            settings.database_url,
            min_size=settings.db_pool_min_size,
            max_size=settings.db_pool_max_size,
            init=_init_connection,
        )
    return _pool


async def disconnect() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


def get_pool() -> asyncpg.Pool:
    if _pool is None:
        raise RuntimeError("Database pool is not initialised. Call connect() first.")
    return _pool


async def vector_search(
    query_embedding: list[float],
    jurisdiction: str | None,
    content_type: str | None,
    limit: int,
) -> list[dict[str, Any]]:
    sql = f"""
        SELECT {_RESULT_COLUMNS},
               1 - (embedding <=> $1) AS score
        FROM legal_content
        WHERE ($2::text IS NULL OR jurisdiction = $2)
          AND ($3::text IS NULL OR type = $3::content_type)
        ORDER BY embedding <=> $1
        LIMIT $4
    """
    rows = await get_pool().fetch(sql, query_embedding, jurisdiction, content_type, limit)
    return [dict(row) for row in rows]


async def fulltext_search(
    query: str,
    jurisdiction: str | None,
    content_type: str | None,
    limit: int,
) -> list[dict[str, Any]]:
    sql = f"""
        SELECT {_RESULT_COLUMNS},
               ts_rank_cd(
                   to_tsvector('english', title || ' ' || full_text),
                   websearch_to_tsquery('english', $1)
               ) AS score
        FROM legal_content
        WHERE to_tsvector('english', title || ' ' || full_text)
              @@ websearch_to_tsquery('english', $1)
          AND ($2::text IS NULL OR jurisdiction = $2)
          AND ($3::text IS NULL OR type = $3::content_type)
        ORDER BY score DESC
        LIMIT $4
    """
    rows = await get_pool().fetch(sql, query, jurisdiction, content_type, limit)
    return [dict(row) for row in rows]


async def insert_legal_content(
    *,
    content_type: str,
    jurisdiction: str,
    title: str,
    citation: str | None,
    court: str | None,
    date_decided: str | None,
    year: int | None,
    full_text: str,
    source: str | None,
    embedding: list[float],
) -> UUID:
    sql = """
        INSERT INTO legal_content
            (type, jurisdiction, title, citation, court,
             date_decided, year, full_text, source, embedding)
        VALUES ($1::content_type, $2, $3, $4, $5, $6::date, $7, $8, $9, $10)
        RETURNING id
    """
    return await get_pool().fetchval(
        sql,
        content_type,
        jurisdiction,
        title,
        citation,
        court,
        date_decided,
        year,
        full_text,
        source,
        embedding,
    )


async def update_embedding(content_id: UUID, embedding: list[float]) -> None:
    sql = "UPDATE legal_content SET embedding = $1, updated_at = NOW() WHERE id = $2"
    await get_pool().execute(sql, embedding, content_id)


async def fetch_source_texts(
    content_ids: list[UUID],
    snippet_chars: int = 2000,
) -> dict[str, dict[str, Any]]:
    """Fetch summary/ratio and a truncated full-text snippet for context assembly."""
    if not content_ids:
        return {}
    sql = """
        SELECT id, summary, ratio, left(full_text, $2) AS snippet
        FROM legal_content
        WHERE id = ANY($1::uuid[])
    """
    rows = await get_pool().fetch(sql, content_ids, snippet_chars)
    return {
        str(row["id"]): {
            "summary": row["summary"],
            "ratio": row["ratio"],
            "snippet": row["snippet"],
        }
        for row in rows
    }
