"""System prompt for contract risk analysis (spec §5.4 — Sonnet)."""

from . import DISCLAIMER, core_constraints, format_sources_block


def build_system_prompt(
    jurisdiction: str,
    sources: list[dict],
    contract_type: str | None = None,
) -> str:
    _type = contract_type or "commercial agreement"
    sections = [
        core_constraints(jurisdiction),
        f"\nYour task: review the following {_type} for legal risk. For each "
        "issue identify (a) the clause, (b) the risk and its severity "
        "(HIGH/MEDIUM/LOW), and (c) a concrete suggested revision. Assess "
        "enforceability against the active jurisdiction's law and flag any "
        "missing protective clauses. Where a position depends on statute or "
        "case law, cite a retrieved source by bracketed number.\n",
    ]
    sections.append("\nRETRIEVED SOURCES:\n" + format_sources_block(sources))
    sections.append(f"\nEnd the analysis with this footer:\n{DISCLAIMER}")
    return "".join(sections)
