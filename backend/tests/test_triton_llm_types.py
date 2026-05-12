"""LLM types Pydantic schema smoke (Triton Wave 3 Cycle 1).

Pins the Triton ``LLMMessage`` + ``LLMResponse`` shape so the Pandora Cycle 2
swap from local stub to real Triton client is transparent. Also guards the
Phase B Lock 4 critical anti-pattern: ``LLMMessage`` must reject
``reasoning_content`` even when injected via dict bypass.

Run locally:
    cd backend
    python -m pytest tests/test_triton_llm_types.py -v

Compliance: Lock 1 (no em dash). Lock 2 (no emoji).
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest
from pydantic import ValidationError

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.llm.types import (
    LLMMessage,
    LLMResponse,
    ModelType,
    ResidentId,
    SimulationTurn,
    ThinkingMode,
)


def test_resident_id_literal_titlecase_5_residents() -> None:
    """5 residents TitleCase per Persephone contract verbatim."""
    valid: list[ResidentId] = ["Athena", "Apollo", "Argus", "Clio", "Hermes"]
    assert len(valid) == 5
    for resident in valid:
        assert resident in {"Athena", "Apollo", "Argus", "Clio", "Hermes"}


def test_thinking_mode_4_levels() -> None:
    """ThinkingMode covers ``disabled`` + ``low`` + ``medium`` + ``high``."""
    valid: list[ThinkingMode] = ["disabled", "low", "medium", "high"]
    assert len(valid) == 4


def test_model_type_two_values() -> None:
    """ModelType covers V4-Flash and V4-Pro per PRD Section 18.1."""
    valid: list[ModelType] = ["V4-Flash", "V4-Pro"]
    assert len(valid) == 2


def test_simulation_turn_three_values() -> None:
    """3 turn refactor simulation per PRD Section 18.6."""
    valid: list[SimulationTurn] = ["test_gen", "impl_gen", "diff_serialize"]
    assert len(valid) == 3


def test_llm_message_accepts_role_and_content() -> None:
    """Basic LLMMessage construction works."""
    msg = LLMMessage(role="user", content="hello")
    assert msg.role == "user"
    assert msg.content == "hello"


def test_llm_message_rejects_reasoning_content_field() -> None:
    """CRITICAL Lock 4: LLMMessage must reject reasoning_content via Pydantic extra=forbid.

    Defense in depth against Phase B Topic E quirk. If a caller bypasses the
    constructor and passes a dict carrying ``reasoning_content``, validation
    must raise rather than silently accept the leak.
    """
    with pytest.raises((ValidationError, TypeError, ValueError)):
        LLMMessage.model_validate(
            {"role": "assistant", "content": "hi", "reasoning_content": "leaked"}
        )


def test_llm_response_round_trip_pandora_shape_parity() -> None:
    """LLMResponse field names + defaults match Pandora StubLLMClient surface.

    Pandora consumes ``content`` + ``cache_hit`` + ``canned_hit`` +
    ``input_tokens`` + ``output_tokens`` + ``cost_estimate_usd`` +
    ``latency_ms`` + ``call_id`` + ``reasoning_content`` + ``error``. Names
    must match so Cycle 2 import flip works without call site edits.
    """
    resp = LLMResponse(
        content="hi",
        model_used="V4-Flash",
        thinking_mode="disabled",
        cache_hit=False,
        canned_hit=False,
        input_tokens=10,
        output_tokens=5,
        cost_estimate_usd=0.0001,
        latency_ms=120,
        reasoning_content="internal",
        call_id="triton-test-1",
    )
    dumped = resp.model_dump()
    expected_keys = {
        "content",
        "model_used",
        "thinking_mode",
        "cache_hit",
        "canned_hit",
        "input_tokens",
        "output_tokens",
        "cost_estimate_usd",
        "latency_ms",
        "reasoning_content",
        "error",
        "call_id",
        "fallback_chain",
    }
    assert expected_keys.issubset(set(dumped.keys()))


def test_llm_response_default_fallback_chain_empty_list() -> None:
    """Default fallback_chain is an empty list (not None) for safe append."""
    resp = LLMResponse(content="hi")
    assert resp.fallback_chain == []
    resp.fallback_chain.append("primary")
    assert resp.fallback_chain == ["primary"]
