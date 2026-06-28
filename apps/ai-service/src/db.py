"""asyncpg connection pool and pgvector queries against `legal_content`.

Connection management plus the raw SQL used by the retrieval and ingest
layers. Column names match the Drizzle schema verbatim (spec §3.2). The vector
operator `<=>` is cosine distance, matching the ivfflat `vector_cosine_ops`
index; the full-text predicate mirrors the GIN index expression
(`to_tsvector('english', title || ' ' || full_text)`) — both defined in
infrastructure/scripts/indexes.sql.
"""

from __future__ import annotations

from datetime import date as _date
from typing import Any
from uuid import UUID

import asyncpg
from pgvector.asyncpg import register_vector

from .config import get_settings

_pool: asyncpg.Pool | None = None

# Columns returned for every search result (no embedding / full_text payload).
_RESULT_COLUMNS = """
    id, type, jurisdiction, title, citation, suit_number, court,
    year, authority_status, source, source_url, summary, subject_area
"""


def _filter_clause(
    params: list[Any],
    *,
    jurisdictions: list[str] | None,
    content_types: list[str] | None,
    courts: list[str] | None,
    subject_areas: list[str] | None,
    year_from: int | None,
    year_to: int | None,
) -> str:
    """Build an ANDed WHERE fragment, appending bind params positionally.

    Each branch grows `params` and references the new `$N`, so the fragment can
    be spliced into queries that already use leading params (e.g. the embedding
    or the tsquery text). Returns ``TRUE`` when no filters are supplied.
    """
    clauses: list[str] = []
    if jurisdictions:
        params.append(jurisdictions)
        clauses.append(f"jurisdiction = ANY(${len(params)})")
    if content_types:
        params.append(content_types)
        clauses.append(f"type::text = ANY(${len(params)})")
    if courts:
        params.append(courts)
        clauses.append(f"court = ANY(${len(params)})")
    if subject_areas:
        params.append(subject_areas)
        clauses.append(
            "EXISTS (SELECT 1 FROM unnest(subject_area) AS sa "
            f"WHERE sa ILIKE ANY(${len(params)}))"
        )
    if year_from is not None:
        params.append(year_from)
        clauses.append(f"year >= ${len(params)}")
    if year_to is not None:
        params.append(year_to)
        clauses.append(f"year <= ${len(params)}")
    return " AND ".join(clauses) if clauses else "TRUE"


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
    *,
    jurisdictions: list[str] | None = None,
    content_types: list[str] | None = None,
    courts: list[str] | None = None,
    subject_areas: list[str] | None = None,
    year_from: int | None = None,
    year_to: int | None = None,
    limit: int = 12,
) -> list[dict[str, Any]]:
    params: list[Any] = [query_embedding]
    where = _filter_clause(
        params,
        jurisdictions=jurisdictions,
        content_types=content_types,
        courts=courts,
        subject_areas=subject_areas,
        year_from=year_from,
        year_to=year_to,
    )
    params.append(limit)
    sql = f"""
        SELECT {_RESULT_COLUMNS},
               1 - (embedding <=> $1) AS score
        FROM legal_content
        WHERE {where}
        ORDER BY embedding <=> $1
        LIMIT ${len(params)}
    """
    rows = await get_pool().fetch(sql, *params)
    return [dict(row) for row in rows]


async def fulltext_search(
    query: str,
    *,
    jurisdictions: list[str] | None = None,
    content_types: list[str] | None = None,
    courts: list[str] | None = None,
    subject_areas: list[str] | None = None,
    year_from: int | None = None,
    year_to: int | None = None,
    limit: int = 12,
) -> list[dict[str, Any]]:
    params: list[Any] = [query]
    where = _filter_clause(
        params,
        jurisdictions=jurisdictions,
        content_types=content_types,
        courts=courts,
        subject_areas=subject_areas,
        year_from=year_from,
        year_to=year_to,
    )
    params.append(limit)
    sql = f"""
        SELECT {_RESULT_COLUMNS},
               ts_rank_cd(
                   to_tsvector('english', title || ' ' || full_text),
                   websearch_to_tsquery('english', $1)
               ) AS score
        FROM legal_content
        WHERE to_tsvector('english', title || ' ' || full_text)
              @@ websearch_to_tsquery('english', $1)
          AND {where}
        ORDER BY score DESC
        LIMIT ${len(params)}
    """
    rows = await get_pool().fetch(sql, *params)
    return [dict(row) for row in rows]


async def insert_legal_content(
    *,
    content_type: str,
    jurisdiction: str,
    title: str,
    citation: str | None,
    suit_number: str | None,
    court: str | None,
    date_decided: str | None,
    year: int | None,
    subject_area: list[str] | None,
    full_text: str,
    summary: str | None,
    ratio: str | None,
    authority_status: str,
    source: str | None,
    source_url: str | None,
    embedding: list[float],
) -> UUID:
    # asyncpg binds a `date` column to a datetime.date, not an ISO string.
    parsed_date = _date.fromisoformat(date_decided) if date_decided else None
    sql = """
        INSERT INTO legal_content
            (type, jurisdiction, title, citation, suit_number, court,
             date_decided, year, subject_area, full_text, summary, ratio,
             authority_status, source, source_url, embedding)
        VALUES ($1::content_type, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15, $16)
        RETURNING id
    """
    return await get_pool().fetchval(
        sql,
        content_type,
        jurisdiction,
        title,
        citation,
        suit_number,
        court,
        parsed_date,
        year,
        subject_area,
        full_text,
        summary,
        ratio,
        authority_status,
        source,
        source_url,
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
