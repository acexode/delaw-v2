"""Document AI endpoints — proofread, summarise, contract analysis (spec §5.6).

These are well-defined, non-streaming LLM tasks. Proofreading and
summarisation operate purely on the supplied text; contract analysis is
RAG-grounded so any statutory/case references come from the corpus.
"""

from fastapi import APIRouter, Depends

from ..config import get_settings
from ..dependencies import require_service_secret
from ..models.requests import ContractAnalysisRequest, ProofreadRequest, SummariseRequest
from ..models.responses import DocumentResult
from ..prompts import contract as contract_prompt
from ..prompts import proofread as proofread_prompt
from ..prompts import summarise as summarise_prompt
from ..services import llm, retrieval

router = APIRouter(
    prefix="/internal",
    tags=["documents"],
    dependencies=[Depends(require_service_secret)],
)


@router.post("/proofread", response_model=DocumentResult)
async def proofread(body: ProofreadRequest) -> DocumentResult:
    settings = get_settings()
    result = await llm.complete(
        system=proofread_prompt.build_system_prompt(body.jurisdiction),
        messages=[{"role": "user", "content": body.text}],
        model=settings.proofread_model,
        max_tokens=settings.document_max_tokens,
    )
    return DocumentResult(result=result, model=settings.proofread_model)


@router.post("/summarise", response_model=DocumentResult)
async def summarise(body: SummariseRequest) -> DocumentResult:
    settings = get_settings()
    result = await llm.complete(
        system=summarise_prompt.build_system_prompt(body.jurisdiction, body.summary_type),
        messages=[{"role": "user", "content": body.text}],
        model=settings.summarise_model,
        max_tokens=settings.document_max_tokens,
    )
    return DocumentResult(result=result, model=settings.summarise_model)


@router.post("/analyse-contract", response_model=DocumentResult)
async def analyse_contract(body: ContractAnalysisRequest) -> DocumentResult:
    settings = get_settings()
    grounding_query = body.contract_type or body.text[:500]
    sources = await retrieval.hybrid_search(grounding_query, body.jurisdiction)
    source_context = [
        {
            "title": s.title,
            "citation": s.citation,
            "court": s.court,
            "year": s.year,
            "authority_status": s.authority_status,
            "summary": None,
        }
        for s in sources
    ]
    result = await llm.complete(
        system=contract_prompt.build_system_prompt(
            body.jurisdiction, source_context, body.contract_type
        ),
        messages=[{"role": "user", "content": body.text}],
        model=settings.contract_model,
        max_tokens=settings.document_max_tokens,
    )
    return DocumentResult(result=result, model=settings.contract_model)
