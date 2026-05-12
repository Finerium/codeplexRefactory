"""Canned response store (Triton Wave 3 Cycle 2).

Top-10 demo question entries per PRD Section 18.5. Latency check (sub-100ms)
deferred to ``test_triton_canned_latency.py`` Cycle 4.

Run locally:
    cd backend
    python -m pytest tests/test_triton_canned_responses.py -v

Compliance: Lock 1 (no em dash). Lock 2 (no emoji).
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.llm.types import LLMMessage
from app.services.canned_responses import (
    CANNED_ENTRIES,
    CannedResponseStore,
    get_canned_response_store,
    reset_canned_response_store,
)


@pytest.fixture(autouse=True)
def _reset() -> None:
    reset_canned_response_store()


def test_store_has_at_least_10_entries() -> None:
    assert len(CANNED_ENTRIES) >= 10
    assert len(get_canned_response_store()) >= 10


@pytest.mark.parametrize(
    "query, expected_key",
    [
        ("Give me a 30-second tour please", "hermes-tour-generic"),
        ("Show me last 24h activity", "activity-summary-24h"),
        ("What's wrong with this codebase?", "apollo-findings-summary"),
        ("Please add 2FA to login flow", "athena-2fa-proposal"),
        ("I want a tour for sprint goal", "hermes-sprint-tour"),
        ("Convert this finding to backlog ticket", "apollo-ticket-draft"),
        ("Why is auth/oauth.ts cracked?", "clio-pattern-a-drift"),
        ("Run simulation for 2FA proposal", "pandora-simulation-overview"),
        ("Show me velocity for sprint 14", "selene-velocity-sprint-14"),
        ("What's the contributor heatmap for payment district?", "activity-heatmap-payment"),
    ],
)
def test_lookup_by_query_top10_demo_questions(query: str, expected_key: str) -> None:
    store = get_canned_response_store()
    entry = store.lookup_by_query(query)
    assert entry is not None
    assert entry.key == expected_key


def test_lookup_miss_returns_none() -> None:
    store = get_canned_response_store()
    assert store.lookup_by_query("alien text qwerty 12345 unknown XXX") is None


def test_lookup_by_messages_finds_last_user_message() -> None:
    store = get_canned_response_store()
    entry = store.lookup_by_messages(
        [
            LLMMessage(role="system", content="ignored system"),
            LLMMessage(role="assistant", content="ignored assistant"),
            LLMMessage(role="user", content="give me a 30-second tour"),
        ]
    )
    assert entry is not None
    assert entry.key == "hermes-tour-generic"


def test_lookup_by_messages_returns_none_when_no_user_message() -> None:
    store = get_canned_response_store()
    assert store.lookup_by_messages([LLMMessage(role="system", content="hi")]) is None


def test_to_llm_response_carries_canned_hit_flag() -> None:
    store = get_canned_response_store()
    entry = store.lookup_by_query("give me a 30-second tour")
    assert entry is not None
    resp = CannedResponseStore.to_llm_response(entry, elapsed_ms=12)
    assert resp.canned_hit is True
    assert resp.cache_hit is False
    assert resp.cost_estimate_usd == 0.0
    assert resp.latency_ms == 12
    assert resp.fallback_chain == ["canned_hit"]


def test_canned_content_no_em_dash() -> None:
    for entry in CANNED_ENTRIES:
        assert "--" not in entry.content, f"Lock 1 violation in {entry.key}"
