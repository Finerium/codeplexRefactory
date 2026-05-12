"""Per-resident routing LOCKED smoke (Triton Wave 3 Cycle 1).

Pins PRD Section 18.3 routing table verbatim. Test failure on edit forces a
ferry-or-revert decision per Lock 4 (no silent assume routing remap).

Run locally:
    cd backend
    python -m pytest tests/test_triton_resident_routing.py -v

Compliance: Lock 1 (no em dash). Lock 2 (no emoji). Lock 4 (locked table).
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.llm.cost_estimator import estimate_cost_usd
from app.llm.resident_routing import (
    RESIDENT_ROUTING,
    SIMULATION_ROUTING,
    get_resident_routing,
    get_simulation_routing,
)


# ---------------------------------------------------------------------------
# PRD Section 18.3 LOCKED resident routing
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "resident, prefer_pro, thinking, max_tokens",
    [
        ("Athena", True, "high", 4000),
        ("Apollo", False, "disabled", 600),
        ("Argus", False, "low", 400),
        ("Clio", False, "disabled", 600),
        ("Hermes", False, "disabled", 300),
    ],
)
def test_resident_routing_locked_per_prd_18_3(
    resident: str,
    prefer_pro: bool,
    thinking: str,
    max_tokens: int,
) -> None:
    """Lock 4: PRD Section 18.3 routing rows pinned verbatim."""
    config = get_resident_routing(resident)  # type: ignore[arg-type]
    assert config["prefer_pro"] is prefer_pro
    assert config["thinking_mode"] == thinking
    assert config["max_tokens"] == max_tokens


def test_resident_routing_has_exactly_5_entries() -> None:
    assert set(RESIDENT_ROUTING.keys()) == {"Athena", "Apollo", "Argus", "Clio", "Hermes"}


def test_resident_routing_persona_keys_unique() -> None:
    keys = [config["persona_prompt_key"] for config in RESIDENT_ROUTING.values()]
    assert len(set(keys)) == len(keys)


def test_invalid_resident_raises_keyerror() -> None:
    with pytest.raises(KeyError):
        get_resident_routing("UnknownResident")  # type: ignore[arg-type]


# ---------------------------------------------------------------------------
# PRD Section 18.6 LOCKED simulation routing
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "turn, prefer_pro, thinking, max_tokens",
    [
        ("test_gen", True, "high", 4000),
        ("impl_gen", True, "high", 6000),
        ("diff_serialize", False, "disabled", 8000),
    ],
)
def test_simulation_routing_locked_per_prd_18_6(
    turn: str,
    prefer_pro: bool,
    thinking: str,
    max_tokens: int,
) -> None:
    config = get_simulation_routing(turn)  # type: ignore[arg-type]
    assert config["prefer_pro"] is prefer_pro
    assert config["thinking_mode"] == thinking
    assert config["max_tokens"] == max_tokens


def test_simulation_routing_has_exactly_3_turns() -> None:
    assert set(SIMULATION_ROUTING.keys()) == {"test_gen", "impl_gen", "diff_serialize"}


# ---------------------------------------------------------------------------
# Cost estimator pricing rows per PRD Section 18.1
# ---------------------------------------------------------------------------


def test_cost_estimator_v4_flash_rate() -> None:
    cost = estimate_cost_usd(1_000_000, 1_000_000, "V4-Flash")
    # $0.14 input + $0.28 output per 1M.
    assert cost == pytest.approx(0.42)


def test_cost_estimator_v4_pro_rate() -> None:
    cost = estimate_cost_usd(1_000_000, 1_000_000, "V4-Pro")
    # $1.74 input + $3.48 output per 1M.
    assert cost == pytest.approx(5.22)


def test_cost_estimator_handles_negative_tokens_as_zero() -> None:
    # Defensive: avoid negative cost in case caller passes bogus value.
    assert estimate_cost_usd(-100, -50, "V4-Flash") == 0.0
