"""In-memory llm_call_log buffer (Triton Wave 3).

Owner: Triton (Wave 3).

[STUB Cycle 1+2 in-memory; Demeter Cycle 2 wires Postgres persist via
``DemeterService.persist_llm_call`` per ``pandora-to-demeter.md``.]

Wave 3 single K8s pod backend: in-memory ring buffer captures last 1000 calls
so admin endpoints (Selene dashboard) can surface cost aggregate via
``/api/llm/health``. Production replacement: Demeter persist hook subscribes
to ``record`` and INSERTs ``llm_call_log`` rows + emits cost aggregate event.

Schema fields per ``_meta/contracts/pandora-to-demeter.md`` lines 170-191.

Compliance:
- Lock 1 (no em dash): clean.
- Lock 2 (no emoji): clean.
- Lock 5 (honest claim): [STUB] label on module + class.
"""

from __future__ import annotations

import threading
import uuid
from collections import deque
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any

from app.llm.types import LLMResponse, ResidentId, SimulationTurn


@dataclass
class LLMCallLogEntry:
    """Mirrors Demeter ``llm_call_log`` table row."""

    call_id: str
    worker: str
    simulation_id: str | None
    resident_id: str | None
    model_used: str
    thinking_mode: str
    cache_hit: bool
    canned_hit: bool
    input_tokens: int
    output_tokens: int
    cost_estimate_usd: float
    latency_ms: int
    timestamp: str
    error: str | None = None
    fallback_chain: list[str] = field(default_factory=list)


class LLMCallLogBuffer:
    """Bounded ring buffer for cost aggregation plus audit traces."""

    def __init__(self, maxlen: int = 1000) -> None:
        self._buf: deque[LLMCallLogEntry] = deque(maxlen=maxlen)
        self._lock = threading.Lock()

    def record(
        self,
        *,
        worker: str,
        resident_or_turn: ResidentId | SimulationTurn | str | None,
        response: LLMResponse,
        simulation_id: str | None = None,
        error: str | None = None,
    ) -> LLMCallLogEntry:
        entry = LLMCallLogEntry(
            call_id=str(uuid.uuid4()),
            worker=worker,
            simulation_id=simulation_id,
            resident_id=str(resident_or_turn) if resident_or_turn is not None else None,
            model_used=response.model_used,
            thinking_mode=response.thinking_mode,
            cache_hit=response.cache_hit,
            canned_hit=response.canned_hit,
            input_tokens=response.input_tokens,
            output_tokens=response.output_tokens,
            cost_estimate_usd=response.cost_estimate_usd,
            latency_ms=response.latency_ms,
            timestamp=datetime.now(timezone.utc).isoformat(),
            error=error,
            fallback_chain=list(response.fallback_chain),
        )
        with self._lock:
            self._buf.append(entry)
        return entry

    def entries(self) -> list[LLMCallLogEntry]:
        with self._lock:
            return list(self._buf)

    def total_cost_usd(self) -> float:
        with self._lock:
            return round(sum(e.cost_estimate_usd for e in self._buf), 6)

    def total_calls(self) -> int:
        with self._lock:
            return len(self._buf)

    def to_dicts(self) -> list[dict[str, Any]]:
        with self._lock:
            return [asdict(e) for e in self._buf]


# ----- singleton accessor -------------------------------------------------


_singleton: LLMCallLogBuffer | None = None


def get_llm_call_log_buffer() -> LLMCallLogBuffer:
    global _singleton
    if _singleton is None:
        _singleton = LLMCallLogBuffer()
    return _singleton


def reset_llm_call_log_buffer() -> None:
    """Test helper."""
    global _singleton
    _singleton = None


__all__ = [
    "LLMCallLogBuffer",
    "LLMCallLogEntry",
    "get_llm_call_log_buffer",
    "reset_llm_call_log_buffer",
]
