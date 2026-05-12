"""LLM gateway operational health endpoint (Triton Wave 3).

Owner: Triton (Wave 3).

Surface circuit breaker state + canned cache stats + cumulative cost so
Aletheia audit + Selene dashboard can validate the $5 Hafiz throwaway budget
plus the H6 cache-hit hypothesis.

Compliance:
- Lock 1 (no em dash): clean.
- Lock 2 (no emoji): clean.
- Lock 8 (paid services): cost surface for budget tracking.
"""

from __future__ import annotations

from fastapi import APIRouter

from app.services.canned_responses import get_canned_response_store
from app.services.circuit_breaker import get_circuit_breaker
from app.services.llm_call_log_buffer import get_llm_call_log_buffer

router = APIRouter(prefix="/llm", tags=["llm"])


@router.get("/health")
async def llm_health() -> dict[str, object]:
    """Surface gateway operational state for ops + Aletheia audit."""
    breaker = get_circuit_breaker()
    buf = get_llm_call_log_buffer()
    canned = get_canned_response_store()
    return {
        "circuit_state": breaker.state.value,
        "consecutive_failures": breaker.consecutive_failures,
        "canned_entries": len(canned),
        "calls_recorded": buf.total_calls(),
        "total_cost_usd": buf.total_cost_usd(),
    }
