"""Circuit breaker for DeepSeek API (Triton Wave 3 defensive layer).

Owner: Triton (Wave 3).

5 consecutive failures flip state to OPEN; OPEN waits ``cooldown_seconds``
before transitioning to HALF_OPEN. The first call in HALF_OPEN probes the
upstream; success closes the breaker, failure re-opens it.

Per-process state per PRD Section 17 single K8s pod replica. Distributed
breaker is Phase 2 post-hackathon scope.

Compliance:
- Lock 1 (no em dash): clean.
- Lock 2 (no emoji): clean.
- Lock 5 (honest claim): in-memory state is documented Wave 3 only.
"""

from __future__ import annotations

import time
from enum import Enum
from threading import Lock


class CircuitState(str, Enum):
    """Three-state machine."""

    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


class CircuitBreaker:
    """Threadsafe circuit breaker.

    Args:
        failure_threshold: number of consecutive failures that flip CLOSED to OPEN.
        cooldown_seconds: wait period before OPEN flips to HALF_OPEN.
    """

    def __init__(self, failure_threshold: int = 5, cooldown_seconds: int = 60) -> None:
        self._failure_threshold = failure_threshold
        self._cooldown_seconds = cooldown_seconds
        self._lock = Lock()
        self._state: CircuitState = CircuitState.CLOSED
        self._consecutive_failures = 0
        self._opened_at: float | None = None

    # ----- read --------------------------------------------------------

    @property
    def state(self) -> CircuitState:
        return self._state

    @property
    def consecutive_failures(self) -> int:
        return self._consecutive_failures

    def is_open(self) -> bool:
        """Return True when the breaker is OPEN and cooldown has not elapsed.

        Transitions OPEN to HALF_OPEN when cooldown is exhausted (and returns
        False so the caller probes the upstream).
        """
        with self._lock:
            if self._state is CircuitState.OPEN and self._opened_at is not None:
                if time.monotonic() - self._opened_at >= self._cooldown_seconds:
                    self._state = CircuitState.HALF_OPEN
                    return False
                return True
            return False

    # ----- write -------------------------------------------------------

    def record_failure(self) -> None:
        """Note a failure. Trips to OPEN when threshold met or in HALF_OPEN."""
        with self._lock:
            self._consecutive_failures += 1
            if self._state is CircuitState.HALF_OPEN:
                self._state = CircuitState.OPEN
                self._opened_at = time.monotonic()
                return
            if self._consecutive_failures >= self._failure_threshold:
                self._state = CircuitState.OPEN
                self._opened_at = time.monotonic()

    def record_success(self) -> None:
        """Note a success. Resets to CLOSED."""
        with self._lock:
            self._consecutive_failures = 0
            self._state = CircuitState.CLOSED
            self._opened_at = None


# ----- singleton accessor -------------------------------------------------


_singleton: CircuitBreaker | None = None


def get_circuit_breaker() -> CircuitBreaker:
    """Return process-wide singleton."""
    global _singleton
    if _singleton is None:
        from app.config import get_settings

        settings = get_settings()
        # PRD Section 18.4 LOCKED: 5 failure threshold + 60 second cooldown.
        # Per-worker overrides via env var still respected.
        _singleton = CircuitBreaker(
            failure_threshold=int(
                getattr(settings, "CIRCUIT_BREAKER_FAILURE_THRESHOLD", 5) or 5
            ),
            cooldown_seconds=int(
                getattr(settings, "CIRCUIT_BREAKER_COOLDOWN_SECONDS", 60) or 60
            ),
        )
    return _singleton


def reset_circuit_breaker() -> None:
    """Test helper to drop the singleton."""
    global _singleton
    _singleton = None


__all__ = [
    "CircuitBreaker",
    "CircuitState",
    "get_circuit_breaker",
    "reset_circuit_breaker",
]
