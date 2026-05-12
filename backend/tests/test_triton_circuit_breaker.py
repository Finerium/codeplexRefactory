"""Circuit breaker state machine (Triton Wave 3 Cycle 2).

5 consecutive failures flip CLOSED to OPEN; OPEN waits cooldown then to
HALF_OPEN. Failure in HALF_OPEN re-opens; success closes.

Run locally:
    cd backend
    python -m pytest tests/test_triton_circuit_breaker.py -v

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

from app.services.circuit_breaker import CircuitBreaker, CircuitState


def test_breaker_starts_closed() -> None:
    cb = CircuitBreaker(failure_threshold=5, cooldown_seconds=60)
    assert cb.state is CircuitState.CLOSED
    assert cb.is_open() is False
    assert cb.consecutive_failures == 0


def test_breaker_opens_after_threshold_failures() -> None:
    cb = CircuitBreaker(failure_threshold=5, cooldown_seconds=60)
    for _ in range(4):
        cb.record_failure()
    assert cb.state is CircuitState.CLOSED
    cb.record_failure()
    assert cb.state is CircuitState.OPEN
    assert cb.is_open() is True


def test_breaker_resets_on_success() -> None:
    cb = CircuitBreaker(failure_threshold=5, cooldown_seconds=60)
    cb.record_failure()
    cb.record_failure()
    cb.record_success()
    assert cb.state is CircuitState.CLOSED
    assert cb.consecutive_failures == 0


def test_breaker_half_open_after_cooldown() -> None:
    cb = CircuitBreaker(failure_threshold=2, cooldown_seconds=0)
    cb.record_failure()
    cb.record_failure()
    assert cb.state is CircuitState.OPEN
    # cooldown 0 means is_open flips immediately to HALF_OPEN.
    assert cb.is_open() is False
    assert cb.state is CircuitState.HALF_OPEN


def test_breaker_half_open_failure_reopens() -> None:
    cb = CircuitBreaker(failure_threshold=1, cooldown_seconds=0)
    cb.record_failure()
    cb.is_open()  # transitions to HALF_OPEN.
    assert cb.state is CircuitState.HALF_OPEN
    cb.record_failure()
    assert cb.state is CircuitState.OPEN


def test_breaker_half_open_success_closes() -> None:
    cb = CircuitBreaker(failure_threshold=1, cooldown_seconds=0)
    cb.record_failure()
    cb.is_open()  # HALF_OPEN.
    cb.record_success()
    assert cb.state is CircuitState.CLOSED


def test_breaker_real_cooldown_blocks_until_elapsed() -> None:
    cb = CircuitBreaker(failure_threshold=1, cooldown_seconds=1)
    cb.record_failure()
    assert cb.is_open() is True
    time.sleep(1.05)
    assert cb.is_open() is False
    assert cb.state is CircuitState.HALF_OPEN
