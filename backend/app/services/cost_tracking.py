"""Cost tracking service (Demeter Wave 3).

Aggregates `llm_call_log.cost_estimate_usd` per session/worker/resident +
drains Triton in-memory LLMCallLogBuffer to Postgres on demand or schedule.

Hafiz budget: $5 throwaway. Soft-warn threshold $4.50 per PRD Section 18.8.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any

import asyncpg

from app.services.demeter_real import (
    DemeterRealService,
    LLMCallLogPersist,
    make_call_id,
)
from app.services.llm_call_log_buffer import (
    LLMCallLogBuffer,
    get_llm_call_log_buffer,
)

logger = logging.getLogger("demeter.cost")


# Per PRD Section 18.8 cost protection (Hafiz $5 budget throwaway).
SOFT_WARN_THRESHOLD_USD = 4.50
HARD_HALT_THRESHOLD_USD = 4.90


class CostTrackingService:
    """Aggregate llm_call_log costs + drain in-memory buffer to Postgres."""

    def __init__(
        self,
        demeter: DemeterRealService,
        buffer: LLMCallLogBuffer | None = None,
    ) -> None:
        self._demeter = demeter
        self._buffer = buffer or get_llm_call_log_buffer()

    async def aggregate_session_cost(
        self,
        since: datetime | None = None,
    ) -> dict[str, Any]:
        """Return cost summary for session.

        Shape:
          {
            total_usd: float,
            total_calls: int,
            by_worker: {worker: usd},
            by_model: {model: usd},
            budget_remaining_usd: float,
            warn_threshold_reached: bool,
            halt_threshold_reached: bool,
          }
        """
        if since is None:
            since = datetime.now(timezone.utc) - timedelta(hours=24)

        async with self._demeter.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT
                    COALESCE(SUM(cost_estimate_usd), 0)::FLOAT AS total_usd,
                    COUNT(*) AS total_calls
                FROM llm_call_log WHERE timestamp >= $1;
                """,
                since,
            )
            by_worker_rows = await conn.fetch(
                """
                SELECT worker, COALESCE(SUM(cost_estimate_usd), 0)::FLOAT AS usd
                FROM llm_call_log WHERE timestamp >= $1
                GROUP BY worker;
                """,
                since,
            )
            by_model_rows = await conn.fetch(
                """
                SELECT model_used, COALESCE(SUM(cost_estimate_usd), 0)::FLOAT AS usd
                FROM llm_call_log WHERE timestamp >= $1
                GROUP BY model_used;
                """,
                since,
            )

        total_usd = float(row["total_usd"] or 0.0) if row else 0.0
        total_calls = int(row["total_calls"] or 0) if row else 0
        by_worker = {r["worker"]: float(r["usd"]) for r in by_worker_rows}
        by_model = {r["model_used"]: float(r["usd"]) for r in by_model_rows}
        budget_remaining = max(0.0, HARD_HALT_THRESHOLD_USD - total_usd)

        return {
            "total_usd": round(total_usd, 6),
            "total_calls": total_calls,
            "by_worker": by_worker,
            "by_model": by_model,
            "budget_remaining_usd": round(budget_remaining, 6),
            "warn_threshold_reached": total_usd >= SOFT_WARN_THRESHOLD_USD,
            "halt_threshold_reached": total_usd >= HARD_HALT_THRESHOLD_USD,
            "soft_warn_threshold_usd": SOFT_WARN_THRESHOLD_USD,
            "hard_halt_threshold_usd": HARD_HALT_THRESHOLD_USD,
        }

    async def drain_buffer_to_postgres(self) -> int:
        """Drain Triton in-memory ring buffer entries into Postgres llm_call_log.

        Returns count of rows persisted. Skips entries already in DB by call_id
        (ON CONFLICT DO NOTHING).
        """
        entries = self._buffer.entries()
        persisted = 0
        for entry in entries:
            try:
                persist = LLMCallLogPersist(
                    call_id=entry.call_id,
                    worker=_normalize_worker(entry.worker),
                    simulation_id=entry.simulation_id,
                    resident_id=_normalize_resident(entry.resident_id),
                    model_used=_normalize_model(entry.model_used),
                    thinking_mode=entry.thinking_mode or "disabled",
                    cache_hit=entry.cache_hit,
                    canned_hit=entry.canned_hit,
                    input_tokens=entry.input_tokens,
                    output_tokens=entry.output_tokens,
                    cost_estimate_usd=entry.cost_estimate_usd,
                    latency_ms=entry.latency_ms,
                    timestamp=entry.timestamp,
                    error=entry.error,
                )
                await self._demeter.log_llm_call(persist)
                persisted += 1
            except Exception as exc:
                logger.warning("drain entry skip call_id=%s err=%s", entry.call_id, exc)
        return persisted

    async def log_call_direct(
        self,
        *,
        worker: str,
        model_used: str,
        thinking_mode: str,
        input_tokens: int,
        output_tokens: int,
        cost_estimate_usd: float,
        latency_ms: int = 0,
        simulation_id: str | None = None,
        resident_id: str | None = None,
        cache_hit: bool = False,
        canned_hit: bool = False,
        error: str | None = None,
    ) -> str:
        """Insert one row to llm_call_log directly. Returns call_id."""
        call_id = make_call_id()
        persist = LLMCallLogPersist(
            call_id=call_id,
            worker=_normalize_worker(worker),
            simulation_id=simulation_id,
            resident_id=_normalize_resident(resident_id),
            model_used=_normalize_model(model_used),
            thinking_mode=thinking_mode,
            cache_hit=cache_hit,
            canned_hit=canned_hit,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cost_estimate_usd=cost_estimate_usd,
            latency_ms=latency_ms,
            timestamp=datetime.now(timezone.utc).isoformat(),
            error=error,
        )
        await self._demeter.log_llm_call(persist)
        return call_id


# ---------- normalizers (worker + model + resident_id literal compat) ----------


def _normalize_worker(w: str) -> str:
    """Map free-form worker name to contract literal."""
    allowed = {
        "pandora",
        "nemesis",
        "triton-residents",
        "boreas-onboarding",
        "triton-chat",
        "triton-onboarding",
        "triton-security",
        "triton-simulation",
    }
    if w in allowed:
        return w
    if w.startswith("triton"):
        return "triton-residents"
    return "triton-residents"


def _normalize_model(m: str) -> str:
    """Map model alias to canonical."""
    if m in ("V4-Flash", "V4-Pro", "deepseek-v4-flash", "deepseek-v4-pro"):
        return m
    low = m.lower()
    if "flash" in low:
        return "deepseek-v4-flash"
    if "pro" in low:
        return "deepseek-v4-pro"
    return "deepseek-v4-flash"


def _normalize_resident(r: str | None) -> str | None:
    if r is None:
        return None
    if r in ("Athena", "Apollo", "Argus", "Clio", "Hermes"):
        return r
    cap = r.capitalize()
    if cap in ("Athena", "Apollo", "Argus", "Clio", "Hermes"):
        return cap
    return None


__all__ = [
    "CostTrackingService",
    "SOFT_WARN_THRESHOLD_USD",
    "HARD_HALT_THRESHOLD_USD",
]
