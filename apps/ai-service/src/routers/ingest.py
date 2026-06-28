"""Legal content ingestion endpoint (spec §5.6).

Normalises the incoming record, generates a document-level embedding, and
stores it to `legal_content`. The embedding column is NOT NULL, so embedding
happens before insert.
"""

from fastapi import APIRouter, Depends

from ..dependencies import require_service_secret
from ..models.requests import IngestRequest
from ..models.responses import IngestResponse
from ..services import embeddings
from .. import db

router = APIRouter(
    prefix="/internal",
    tags=["ingest"],
    dependencies=[Depends(require_service_secret)],
)


def _derive_year(date: str | None) -> int | None:
    if date and len(date) >= 4 and date[:4].isdigit():
        return int(date[:4])
    return None


@router.post("/ingest", response_model=IngestResponse)
async def ingest(body: IngestRequest) -> IngestResponse:
    embedding = await embeddings.generate_embedding(f"{body.title}\n\n{body.full_text}")
    content_id = await db.insert_legal_content(
        content_type=body.content_type,
        jurisdiction=body.jurisdiction,
        title=body.title,
        citation=body.citation,
        suit_number=body.suit_number,
        court=body.court,
        date_decided=body.date,
        year=body.year if body.year is not None else _derive_year(body.date),
        subject_area=body.subject_area,
        full_text=body.full_text,
        summary=body.summary,
        ratio=body.ratio,
        authority_status=body.authority_status,
        source=body.source,
        source_url=body.source_url,
        embedding=embedding,
    )
    return IngestResponse(id=str(content_id))
