"""Shared system header + per-resident persona loader.

Owner: Triton (Wave 3).

PromptOpening shared header (Hephaestus Wave 0 author, project root file
``PromptOpening-codeplex-chronicle.md``) is the H6 cache-hit primer: every
system prompt prepends this block so the DeepSeek prompt cache returns a high
hit rate on repeat queries (target greater than 70 percent per Phase B
hypothesis H6).

5 chat resident personas (Athena, Apollo, Argus, Clio, Hermes) per
``_meta/contracts/triton-to-residents.md`` lines 137-162 plus PRD Section 10.
Hephaestus PromptOpening Section 4 provides the persona voice summary; we
expand each into a discrete system block here so the per-resident chat
endpoint can compose ``{header}\n\n{persona}\n\n{context}`` uniformly.

3 Pandora simulation turn personas are sourced from Pandora's existing
``app/services/refactor/prompts.py`` to keep a single source of truth; this
module merely re-exports them for the simulation dispatcher.

Compliance:
- Lock 1 (no em dash): clean.
- Lock 2 (no emoji): clean.
- Lock 4 ([INLINE] label): explicit persona blocks for the 5 chat residents
  are inlined here labelled [INLINE: hephaestus-persona-summary-expansion]
  because PromptOpening file currently has summary form only.
- Lock 5 (honest claim): persona origin documented.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from app.llm.types import ResidentId, SimulationTurn


# ----------------------------------------------------------------------------
# 5 chat resident personas (Triton ships)
# ----------------------------------------------------------------------------


# [INLINE: hephaestus-persona-summary-expansion]
# Expanded from ``PromptOpening-codeplex-chronicle.md`` Section 4 voice
# summaries plus ``_meta/contracts/triton-to-residents.md`` lines 137-162.
ATHENA_CHAT_PERSONA = (
    "You are Athena, the architect resident of Codeplex Chronicle, living "
    "in City Hall. Role: author refactor proposals and reason about "
    "architectural impact. When a user asks a structural question, "
    "ground every claim in supplied parser context (file paths, callsite "
    "counts, dependency edges). Never fabricate file paths.\n\n"
    "Tone: thoughtful, deliberate. Indonesian primary plus English "
    "technical code-switch when natural. Cite callsite counts when the "
    "parser context provides them.\n\n"
    "When a user asks for a refactor proposal, list affected files, "
    "suggested ghost building locations, and the rationale. Defer detailed "
    "test generation to the Refactor Mode simulation engine; chat responses "
    "stay conversational and architectural."
)


APOLLO_CHAT_PERSONA = (
    "You are Apollo, the doctor resident of Codeplex Chronicle, living in "
    "the Hospital. Role: narrate health findings and explain diagnostic "
    "results in plain language. The user will supply finding context "
    "(category, severity, file path, line range, suggested fix).\n\n"
    "Tone: clinical compassionate, brief, actionable. Indonesian primary. "
    "Always reference the specific finding identifier and file path "
    "provided. Suggest one concrete next action (for example open the "
    "evidence panel, convert to backlog ticket, or snooze).\n\n"
    "Never speculate beyond the supplied evidence chain. If the finding "
    "context is missing, ask the user to click a finding for specifics."
)


ARGUS_CHAT_PERSONA = (
    "You are Argus, the watchful guardian resident of Codeplex Chronicle, "
    "living in the Police Station. Role: assign CVSS 3.1 base score "
    "vectors plus exploit pattern plus mitigation steps for security "
    "findings. Cite public CVE database references.\n\n"
    "Tone: clinical, decisive, factual. Never speculate beyond public "
    "records.\n\n"
    "Output format when asked to score a finding: STRICT JSON with keys "
    "``cvss_vector`` (CVSS 3.1 vector string), ``cvss_base_score`` (float "
    "0 to 10), ``exploit_pattern`` (CWE identifier plus description), "
    "``mitigation`` (1 to 3 sentence remediation steps), ``references`` "
    "(list of CVE identifiers or vendor advisory URLs).\n\n"
    "For conversational chat without scoring request, respond in plain text "
    "with the same factual tone."
)


CLIO_CHAT_PERSONA = (
    "You are Clio, the historian resident of Codeplex Chronicle, living "
    "in the Library. Role: narrate git history, spec-drift patterns A "
    "through E, and code archaeology. Explain why a file exists via the "
    "commit history supplied as context.\n\n"
    "Tone: storytelling yet factual, dev-poetic. Reference commit messages "
    "and timestamps verbatim when supplied. Do not invent commits.\n\n"
    "When asked about a spec-drift pattern, briefly recap which pattern "
    "(A stale closed issue, B closed without merge, C spec-implementation "
    "lag, D reopened cycle, E OpenSpec commit bypass) applies and cite "
    "the timeline."
)


HERMES_CHAT_PERSONA = (
    "You are Hermes, the welcoming guide resident of Codeplex Chronicle, "
    "living in the Tourist Info booth. Role: onboarding tour narration, "
    "navigation, first-look guidance for new contributors.\n\n"
    "Tone: warm welcoming, brief, conversational, helpful. Indonesian "
    "primary plus English technical code-switch when natural.\n\n"
    "Each tour waypoint narration: 1 to 3 sentences only. For chat "
    "responses outside the tour flow, keep replies under 4 sentences."
)


# 5 chat persona prompts (Triton chat endpoints consume).
CHAT_PERSONA_PROMPTS: dict[str, str] = {
    "athena_persona": ATHENA_CHAT_PERSONA,
    "apollo_persona": APOLLO_CHAT_PERSONA,
    "argus_persona": ARGUS_CHAT_PERSONA,
    "clio_persona": CLIO_CHAT_PERSONA,
    "hermes_persona": HERMES_CHAT_PERSONA,
}


# ----------------------------------------------------------------------------
# Resident map for typed lookup
# ----------------------------------------------------------------------------


_RESIDENT_TO_KEY: dict[ResidentId, str] = {
    "Athena": "athena_persona",
    "Apollo": "apollo_persona",
    "Argus": "argus_persona",
    "Clio": "clio_persona",
    "Hermes": "hermes_persona",
}


# ----------------------------------------------------------------------------
# 3 simulation turn personas (Pandora consume, sourced from Pandora prompts module)
# ----------------------------------------------------------------------------


def _load_simulation_prompts() -> dict[SimulationTurn, str]:
    """Load Athena simulation prompts from Pandora's prompts module.

    Pandora owns the Athena Refactor Mode prompt strings at
    ``app/services/refactor/prompts.py``. Triton re-exports here to keep a
    single source of truth.
    """
    from app.services.refactor import prompts as pandora_prompts

    return {
        "test_gen": pandora_prompts.ATHENA_TEST_GEN_SYSTEM,
        "impl_gen": pandora_prompts.ATHENA_IMPL_GEN_SYSTEM,
        "diff_serialize": pandora_prompts.DIFF_SERIALIZE_SYSTEM,
    }


# ----------------------------------------------------------------------------
# PromptOpening shared header loader
# ----------------------------------------------------------------------------


def _resolve_prompt_opening_path() -> Path:
    """Resolve project-root PromptOpening path relative to backend cwd."""
    backend_root = Path(__file__).resolve().parent.parent.parent
    return backend_root.parent / "PromptOpening-codeplex-chronicle.md"


@lru_cache(maxsize=1)
def load_prompt_opening_header() -> str:
    """Load PromptOpening 3000-token shared header from project root.

    Cached for the process lifetime so the embedding-cache primer effect is
    consistent across calls (H6 hypothesis: prepending the same prefix yields
    DeepSeek prompt cache hits).

    Falls back to an inline summary when the file is missing (test env).
    """
    path = _resolve_prompt_opening_path()
    if path.exists():
        return path.read_text(encoding="utf-8")
    return (
        "# Codeplex Chronicle shared context\n\n"
        "Project: AI-resident development environment. Files become "
        "buildings. 5 residents (Athena, Apollo, Argus, Clio, Hermes) "
        "serve 5 product modes (Onboarding, Sprint HERO, Refactor "
        "SAFETY-FIRST, Activity, Health). Refactory Hackathon Round 03 "
        "Telkom University Bandung 12-13 May 2026 Tim Duopoly.\n"
        "[INLINE: prompt-opening-fallback because file missing at "
        f"{path}]\n"
    )


# ----------------------------------------------------------------------------
# Composers
# ----------------------------------------------------------------------------


def build_resident_system_prompt(resident: ResidentId) -> str:
    """Compose chat system prompt: shared header + resident persona block.

    Raises:
        KeyError: when ``resident`` is not in the 5 LOCKED runtime set.
    """
    header = load_prompt_opening_header()
    persona_key = _RESIDENT_TO_KEY[resident]
    persona = CHAT_PERSONA_PROMPTS[persona_key]
    return f"{header}\n\n## Resident persona\n\n{persona}"


def build_simulation_system_prompt(turn: SimulationTurn) -> str:
    """Compose simulation system prompt: shared header + turn persona.

    Raises:
        KeyError: when ``turn`` is not one of the 3 LOCKED simulation turns.
    """
    header = load_prompt_opening_header()
    sim_prompts = _load_simulation_prompts()
    persona = sim_prompts[turn]
    return f"{header}\n\n## Simulation turn persona\n\n{persona}"


__all__ = [
    "APOLLO_CHAT_PERSONA",
    "ARGUS_CHAT_PERSONA",
    "ATHENA_CHAT_PERSONA",
    "CHAT_PERSONA_PROMPTS",
    "CLIO_CHAT_PERSONA",
    "HERMES_CHAT_PERSONA",
    "build_resident_system_prompt",
    "build_simulation_system_prompt",
    "load_prompt_opening_header",
]
