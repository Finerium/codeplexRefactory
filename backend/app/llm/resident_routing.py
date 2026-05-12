"""Per-resident DeepSeek routing config (LOCKED PRD Section 18.3).

Owner: Triton (Wave 3).

Anti-pattern Lock 4 critical: routing table is LOCKED. NEVER silently remap
(for example Apollo cannot be promoted to V4-Pro thinking high without a
PRD revision + V1 Orch approval). The pinned ``test_resident_routing`` smoke
guards every entry; CI failure on edit forces a ferry-or-revert decision.

Source:
- PRD Section 18.3 (per-resident routing locked table).
- PRD Section 18.6 (Refactor Mode 3 turn simulation routing).
- ``_meta/contracts/triton-to-residents.md`` lines 46-87.
- ``_meta/contracts/triton-to-pandora.md`` lines 25-129.

Compliance:
- Lock 1 (no em dash): clean.
- Lock 2 (no emoji): clean.
- Lock 4 (no silent assume): every entry references the source row.
"""

from __future__ import annotations

from typing import TypedDict

from app.llm.types import ResidentId, SimulationTurn, ThinkingMode


class ResidentRoutingConfig(TypedDict):
    """Per-resident routing entry.

    Fields:
    - ``prefer_pro``: route to V4-Pro when True, V4-Flash otherwise.
    - ``thinking_mode``: ``disabled`` / ``low`` / ``medium`` / ``high``.
    - ``max_tokens``: response cap matching the persona length budget.
    - ``persona_prompt_key``: lookup key in ``PERSONA_PROMPTS`` map.
    """

    prefer_pro: bool
    thinking_mode: ThinkingMode
    max_tokens: int
    persona_prompt_key: str


class SimulationRoutingConfig(TypedDict):
    """Per-simulation-turn routing entry."""

    prefer_pro: bool
    thinking_mode: ThinkingMode
    max_tokens: int
    persona_prompt_key: str


# PRD Section 18.3 LOCKED. Lock 4 no silent remap.
RESIDENT_ROUTING: dict[ResidentId, ResidentRoutingConfig] = {
    "Athena": {
        # PRD Section 18.3 row 1: refactor proposal author needs deep reasoning.
        "prefer_pro": True,
        "thinking_mode": "high",
        "max_tokens": 4000,
        "persona_prompt_key": "athena_persona",
    },
    "Apollo": {
        # PRD Section 18.3 row 2: deterministic detector narration, no reasoning.
        "prefer_pro": False,
        "thinking_mode": "disabled",
        "max_tokens": 600,
        "persona_prompt_key": "apollo_persona",
    },
    "Argus": {
        # PRD Section 18.3 row 3: CVSS scoring needs light structured reasoning.
        "prefer_pro": False,
        "thinking_mode": "low",
        "max_tokens": 400,
        "persona_prompt_key": "argus_persona",
    },
    "Clio": {
        # PRD Section 18.3 row 4: git history narration, no reasoning.
        "prefer_pro": False,
        "thinking_mode": "disabled",
        "max_tokens": 600,
        "persona_prompt_key": "clio_persona",
    },
    "Hermes": {
        # PRD Section 18.3 row 5: tour narration, no reasoning, brief cap.
        "prefer_pro": False,
        "thinking_mode": "disabled",
        "max_tokens": 300,
        "persona_prompt_key": "hermes_persona",
    },
}


# PRD Section 18.6 LOCKED for Pandora 3 turn refactor simulation engine.
SIMULATION_ROUTING: dict[SimulationTurn, SimulationRoutingConfig] = {
    "test_gen": {
        # Turn 1: failing test generation. V4-Pro think high.
        "prefer_pro": True,
        "thinking_mode": "high",
        "max_tokens": 4000,
        "persona_prompt_key": "athena_test_gen",
    },
    "impl_gen": {
        # Turn 2: implementation to make Turn 1 tests pass. V4-Pro think high.
        "prefer_pro": True,
        "thinking_mode": "high",
        "max_tokens": 6000,
        "persona_prompt_key": "athena_impl_gen",
    },
    "diff_serialize": {
        # Turn 3: serialize tests + impl into unified diff. V4-Flash non-think.
        "prefer_pro": False,
        "thinking_mode": "disabled",
        "max_tokens": 8000,
        "persona_prompt_key": "diff_serialize",
    },
}


def get_resident_routing(resident: ResidentId) -> ResidentRoutingConfig:
    """Return routing config for a runtime resident.

    Raises:
        KeyError: when ``resident`` is not one of the 5 LOCKED runtime
            residents. FastAPI endpoint maps to HTTP 422 with the valid list.
    """
    return RESIDENT_ROUTING[resident]


def get_simulation_routing(turn: SimulationTurn) -> SimulationRoutingConfig:
    """Return routing config for a Pandora 3 turn simulation step."""
    return SIMULATION_ROUTING[turn]


__all__ = [
    "RESIDENT_ROUTING",
    "ResidentRoutingConfig",
    "SIMULATION_ROUTING",
    "SimulationRoutingConfig",
    "get_resident_routing",
    "get_simulation_routing",
]
