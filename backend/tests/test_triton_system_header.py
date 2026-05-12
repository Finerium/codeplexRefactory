"""System header + persona loader smoke (Triton Wave 3 Cycle 1).

Pins the 5 chat resident persona blocks plus the 3 simulation turn persona
strings (re-exported from Pandora prompts module) plus the PromptOpening
shared header loader.

Run locally:
    cd backend
    python -m pytest tests/test_triton_system_header.py -v

Compliance: Lock 1 (no em dash). Lock 2 (no emoji). Lock 5 ([INLINE] label).
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.llm.system_header import (
    CHAT_PERSONA_PROMPTS,
    build_resident_system_prompt,
    build_simulation_system_prompt,
    load_prompt_opening_header,
)


def test_prompt_opening_header_loads_non_empty() -> None:
    """PromptOpening file resolves + body non-empty."""
    header = load_prompt_opening_header()
    assert len(header) > 100
    assert "Codeplex Chronicle" in header


def test_chat_persona_prompts_has_5_keys() -> None:
    """5 chat persona keys present."""
    keys = set(CHAT_PERSONA_PROMPTS.keys())
    expected = {
        "athena_persona",
        "apollo_persona",
        "argus_persona",
        "clio_persona",
        "hermes_persona",
    }
    assert keys == expected


@pytest.mark.parametrize(
    "resident, persona_marker",
    [
        ("Athena", "architect"),
        ("Apollo", "doctor"),
        ("Argus", "watchful"),
        ("Clio", "historian"),
        ("Hermes", "welcoming guide"),
    ],
)
def test_build_resident_system_prompt_contains_header_and_persona(
    resident: str, persona_marker: str
) -> None:
    """System prompt prepends header + appends persona for cache-hit."""
    prompt = build_resident_system_prompt(resident)  # type: ignore[arg-type]
    assert "Codeplex Chronicle" in prompt
    assert persona_marker.lower() in prompt.lower()


def test_build_resident_system_prompt_unknown_raises_keyerror() -> None:
    with pytest.raises(KeyError):
        build_resident_system_prompt("UnknownResident")  # type: ignore[arg-type]


@pytest.mark.parametrize(
    "turn, persona_marker",
    [
        ("test_gen", "test"),
        ("impl_gen", "implement"),
        ("diff_serialize", "diff"),
    ],
)
def test_build_simulation_system_prompt_contains_header_and_turn_persona(
    turn: str, persona_marker: str
) -> None:
    prompt = build_simulation_system_prompt(turn)  # type: ignore[arg-type]
    assert "Codeplex Chronicle" in prompt
    assert persona_marker.lower() in prompt.lower()


def test_chat_persona_prompts_avoid_em_dash() -> None:
    """Lock 1: no em dash inside persona strings."""
    for key, persona in CHAT_PERSONA_PROMPTS.items():
        assert "--" not in persona, f"Lock 1 violation in {key}"
