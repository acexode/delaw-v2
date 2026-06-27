"""System prompt for legal research synthesis (spec §5.5)."""

from . import DISCLAIMER, core_constraints, format_sources_block


def build_system_prompt(
    jurisdiction: str,
    sources: list[dict],
    matter_context: str | None = None,
) -> str:
    sections = [
        core_constraints(jurisdiction),
        "\nYour task: answer the lawyer's research question by synthesising the "
        "retrieved sources below. Be precise, cite every proposition to a "
        "bracketed source number, and structure the answer with a short "
        "conclusion followed by the supporting reasoning.\n",
    ]
    if matter_context:
        sections.append(f"\nMATTER CONTEXT (for relevance only):\n{matter_context}\n")
    sections.append("\nRETRIEVED SOURCES:\n" + format_sources_block(sources))
    sections.append(f"\nEnd every response with this exact footer:\n{DISCLAIMER}")
    return "".join(sections)
