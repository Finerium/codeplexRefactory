"""Demeter persist adapter (Pandora Wave 3).

Owner: Pandora (Wave 3).

[STUB Cycle 1, real Demeter Cycle 2 full impl]

Pandora persists 3 record categories per
``_meta/contracts/pandora-to-demeter.md`` lines 26-91:
1. ``ProposalPersist`` (one row per proposal)
2. ``SimulationEventPersist`` (one row per stage event, ~7 to 9 per sim)
3. ``LLMCallLog`` (one row per LLM call, ~3 per sim)

For Cycle 1 ship, Pandora declares a Protocol the simulation engine
calls + an in-memory ``StubDemeterAdapter`` so end-to-end tests run
without a real database. Cycle 2 swap: replace ``get_demeter_adapter``
with Demeter's ``DemeterService`` import from
``backend/app/services/demeter_service.py``.

Compliance: Lock 1 (no em dash). Lock 2 (no emoji). Lock 5 stub
labelled per docstring.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any, Literal, Optional, Protocol

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Persist record schemas (mirror of pandora-to-demeter.md)
# ---------------------------------------------------------------------------


@dataclass(slots=True)
class ProposalPersist:
    proposal_id: str
    user_intent: str
    openspec_change_path: str
    repo_full_name: str
    author_user_id: Optional[int]
    stage: Literal[
        "proposed", "simulating", "drafted", "accepted", "discarded", "archived"
    ]
    title: str
    summary: str
    affected_files: list[str]
    created_at: str  # ISO 8601


@dataclass(slots=True)
class SimulationEventPersist:
    simulation_id: str
    stage: str
    payload: dict[str, Any]
    timestamp: str


@dataclass(slots=True)
class LLMCallLog:
    call_id: str
    worker: str
    simulation_id: Optional[str]
    resident_id: Optional[str]
    model_used: Literal["V4-Flash", "V4-Pro"]
    thinking_mode: Literal["disabled", "low", "medium", "high"]
    cache_hit: bool
    canned_hit: bool
    input_tokens: int
    output_tokens: int
    cost_estimate_usd: float
    latency_ms: int
    timestamp: str
    error: Optional[str] = None


# ---------------------------------------------------------------------------
# Protocol
# ---------------------------------------------------------------------------


class DemeterAdapterProtocol(Protocol):
    """Demeter persist surface Pandora consumes.

    Real Demeter ``DemeterService`` (Cycle 2 ship target) implements
    this protocol. The stub below implements it in-memory for tests.
    """

    async def persist_proposal(self, proposal: ProposalPersist) -> None: ...
    async def update_proposal_stage(
        self,
        proposal_id: str,
        new_stage: str,
    ) -> None: ...
    async def persist_simulation_event(
        self,
        event: SimulationEventPersist,
    ) -> None: ...
    async def persist_llm_call(self, call: LLMCallLog) -> None: ...


# ---------------------------------------------------------------------------
# Stub in-memory implementation
# ---------------------------------------------------------------------------


@dataclass(slots=True)
class StubDemeterAdapter:
    """In-memory Demeter persist stub.

    [STUB Cycle 1, real Demeter Cycle 2 full impl]
    """

    proposals: dict[str, ProposalPersist] = field(default_factory=dict)
    simulation_events: list[SimulationEventPersist] = field(default_factory=list)
    llm_calls: list[LLMCallLog] = field(default_factory=list)

    async def persist_proposal(self, proposal: ProposalPersist) -> None:
        self.proposals[proposal.proposal_id] = proposal
        logger.info(
            "demeter_adapter: persisted proposal %s (stage=%s)",
            proposal.proposal_id,
            proposal.stage,
        )

    async def update_proposal_stage(
        self,
        proposal_id: str,
        new_stage: str,
    ) -> None:
        existing = self.proposals.get(proposal_id)
        if existing is None:
            logger.warning(
                "demeter_adapter: update_proposal_stage on missing proposal_id=%s",
                proposal_id,
            )
            return
        self.proposals[proposal_id] = ProposalPersist(
            proposal_id=existing.proposal_id,
            user_intent=existing.user_intent,
            openspec_change_path=existing.openspec_change_path,
            repo_full_name=existing.repo_full_name,
            author_user_id=existing.author_user_id,
            stage=new_stage,  # type: ignore[arg-type]
            title=existing.title,
            summary=existing.summary,
            affected_files=existing.affected_files,
            created_at=existing.created_at,
        )
        logger.info(
            "demeter_adapter: proposal %s stage -> %s",
            proposal_id,
            new_stage,
        )

    async def persist_simulation_event(
        self,
        event: SimulationEventPersist,
    ) -> None:
        self.simulation_events.append(event)
        logger.info(
            "demeter_adapter: persisted simulation_event sim=%s stage=%s",
            event.simulation_id,
            event.stage,
        )

    async def persist_llm_call(self, call: LLMCallLog) -> None:
        self.llm_calls.append(call)
        logger.info(
            "demeter_adapter: persisted llm_call %s worker=%s model=%s cost=%.4f",
            call.call_id,
            call.worker,
            call.model_used,
            call.cost_estimate_usd,
        )


# ---------------------------------------------------------------------------
# Singleton + factory (Cycle 2 swap site)
# ---------------------------------------------------------------------------


_singleton: Optional[DemeterAdapterProtocol] = None


def get_demeter_adapter() -> DemeterAdapterProtocol:
    """Return the singleton Demeter adapter.

    [STUB Cycle 1] Returns ``StubDemeterAdapter``. Cycle 2 swap:
    import Demeter's ``DemeterService`` and return that instead.
    """
    global _singleton
    if _singleton is None:
        _singleton = StubDemeterAdapter()
    return _singleton


def set_demeter_adapter(adapter: DemeterAdapterProtocol) -> None:
    """Override the singleton (used by tests + Cycle 2 swap)."""
    global _singleton
    _singleton = adapter


__all__ = [
    "DemeterAdapterProtocol",
    "LLMCallLog",
    "ProposalPersist",
    "SimulationEventPersist",
    "StubDemeterAdapter",
    "get_demeter_adapter",
    "set_demeter_adapter",
]
