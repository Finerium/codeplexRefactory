"""Canned response latency benchmark (Triton Wave 3 Cycle 4).

PRD Section 18.5 target: top-10 canned demo questions return in less than
100ms. We benchmark each entry's lookup latency through the store.

Run locally:
    cd backend
    python -m pytest tests/test_triton_canned_latency.py -v

Compliance: Lock 1 (no em dash). Lock 2 (no emoji).
"""

from __future__ import annotations

import sys
import time
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.services.canned_responses import (
    CANNED_ENTRIES,
    get_canned_response_store,
    reset_canned_response_store,
)


@pytest.fixture(autouse=True)
def _reset() -> None:
    reset_canned_response_store()


def test_canned_lookup_under_100ms_per_query() -> None:
    """Each top-10 canned query resolves in less than 100ms (PRD Section 18.5)."""
    store = get_canned_response_store()
    # Use the first keyword of each entry as the demo query.
    queries = [entry.keywords[0] for entry in CANNED_ENTRIES]
    for q in queries:
        start = time.perf_counter()
        entry = store.lookup_by_query(q)
        elapsed_ms = (time.perf_counter() - start) * 1000.0
        assert entry is not None, f"Canned miss on '{q}'"
        assert elapsed_ms < 100.0, (
            f"Canned lookup '{q}' took {elapsed_ms:.2f} ms, exceeds 100ms PRD target"
        )


def test_canned_lookup_aggregate_under_100ms_for_full_set() -> None:
    """The aggregate over all top-10 entries also fits well within 100ms."""
    store = get_canned_response_store()
    queries = [entry.keywords[0] for entry in CANNED_ENTRIES]
    start = time.perf_counter()
    for q in queries:
        store.lookup_by_query(q)
    elapsed_ms = (time.perf_counter() - start) * 1000.0
    assert elapsed_ms < 100.0, (
        f"Aggregate top-10 lookup took {elapsed_ms:.2f} ms"
    )
