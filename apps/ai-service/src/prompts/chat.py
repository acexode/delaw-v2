"""System prompt for conversational legal chat (spec §5.4 — Haiku)."""

from . import DISCLAIMER, core_constraints, format_sources_block


def build_system_prompt(
    jurisdiction: str,
    sources: list[dict],
    matter_context: str | None = None,
) -> str:
    sections = [
        core_constraints(jurisdiction),
        "\nYou are in conversational mode. Keep replies concise and direct. "
        "Ground every legal assertion in the retrieved sources and cite them by "
        "bracketed number. If the question is conversational rather than legal, "
        "respond naturally without inventing citations.\n",
    ]
    if matter_context:
        sections.append(f"\nMATTER CONTEXT:\n{matter_context}\n")
    sections.append("\nRETRIEVED SOURCES:\n" + format_sources_block(sources))
    sections.append(f"\nEnd substantive legal answers with this footer:\n{DISCLAIMER}")
    return "".join(sections)
