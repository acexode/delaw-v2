"""System prompts for DeLaw AI tasks (spec §5.5).

Shared building blocks here enforce the five legal-specific constraints on
every prompt: jurisdiction anchoring, citation discipline, authority checking,
disclaimer injection, and the hallucination guard.
"""

from __future__ import annotations

from typing import Iterable

# Jurisdiction code -> (country, legal-system adjective).
JURISDICTIONS: dict[str, tuple[str, str]] = {
    "NG": ("Nigeria", "Nigerian"),
    "GH": ("Ghana", "Ghanaian"),
    "KE": ("Kenya", "Kenyan"),
    "ZA": ("South Africa", "South African"),
    "OHADA": ("the OHADA region", "OHADA"),
}

DISCLAIMER = (
    "DeLaw AI assists your research and is not a substitute for professional "
    "legal judgment. Verify all citations against the primary source before "
    "relying on them."
)


def jurisdiction_names(jurisdiction: str) -> tuple[str, str]:
    return JURISDICTIONS.get(jurisdiction.upper(), (jurisdiction, jurisdiction))


def hallucination_guard(jurisdiction: str) -> str:
    _, adjective = jurisdiction_names(jurisdiction)
    return f"I could not find relevant {adjective} authority on this point."


def core_constraints(jurisdiction: str) -> str:
    country, adjective = jurisdiction_names(jurisdiction)
    guard = hallucination_guard(jurisdiction)
    return (
        f"You are DeLaw AI, a legal research assistant for {adjective} law.\n\n"
        "You must operate under these non-negotiable constraints:\n"
        f"1. JURISDICTION ANCHORING: The active jurisdiction is {country} "
        f"({jurisdiction}). Apply only {adjective} law. Never apply US, UK, or "
        "other foreign law unless the user explicitly asks for a comparison.\n"
        "2. CITATION DISCIPLINE: Only cite cases, statutes, or authorities that "
        "appear in the RETRIEVED SOURCES provided below. Never produce a "
        "citation from your training data or memory. Reference a source using "
        "its bracketed number, e.g. [1], [2].\n"
        "3. AUTHORITY CHECKING: Before relying on an authority, check its "
        "authority_status in the source metadata. Do not present an OVERRULED "
        "authority as good law; flag DISTINGUISHED or DOUBTED authorities "
        "explicitly.\n"
        f"4. HALLUCINATION GUARD: If the retrieved sources do not contain "
        "sufficient information to answer, respond exactly with: "
        f'"{guard}" — do not speculate or invent authority.\n'
        "5. DISCLAIMER: Every response must end with the disclaimer footer "
        "provided to you.\n"
    )


def format_sources_block(sources: Iterable[dict]) -> str:
    """Render retrieved sources as a numbered context block for the prompt."""
    lines: list[str] = []
    for idx, src in enumerate(sources, start=1):
        citation = src.get("citation") or "no citation on record"
        court = src.get("court") or "unknown court"
        year = src.get("year") or "n.d."
        status = src.get("authority_status") or "GOOD_LAW"
        lines.append(
            f"[{idx}] {src.get('title')} — {citation} ({court}, {year}). "
            f"Authority status: {status}."
        )
        summary = src.get("summary") or src.get("ratio")
        if summary:
            lines.append(f"    Summary: {summary}")
    return "\n".join(lines) if lines else "(no sources retrieved)"
