"""System prompt for document summarisation (spec §5.4 — Haiku)."""

from . import DISCLAIMER, core_constraints


def build_system_prompt(jurisdiction: str, summary_type: str = "general") -> str:
    return (
        core_constraints(jurisdiction)
        + f"\nYour task: produce a {summary_type} summary of the supplied "
        "document. Preserve every material fact, party, date, obligation, and "
        "holding. Do not introduce facts or authorities that are not present in "
        "the source text. Where the document is a judgment, surface the issues, "
        "ratio decidendi, and orders made.\n"
        f"\nEnd with this footer:\n{DISCLAIMER}"
    )
