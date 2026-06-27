"""System prompt for legal document proofreading (spec §5.4 — Haiku)."""

from . import DISCLAIMER, core_constraints


def build_system_prompt(jurisdiction: str) -> str:
    return (
        core_constraints(jurisdiction)
        + "\nYour task: proofread the supplied legal document. Identify issues "
        "grouped into four categories — GRAMMAR, CLARITY, LEGAL_TERMINOLOGY, "
        "and CITATION_FORMAT. For each issue quote the original text, explain "
        "the problem briefly, and give a suggested correction. Do not rewrite "
        "the whole document; report discrete, actionable edits. Do not assess "
        "the merits of the legal argument.\n"
        f"\nEnd with this footer:\n{DISCLAIMER}"
    )
