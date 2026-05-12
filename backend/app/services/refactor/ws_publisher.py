"""WebSocket / event bus publisher for Refactor Mode events.

Owner: Pandora (Wave 3).

Pandora publishes ``RefactorProposalEvent`` (once at Turn 0) +
``SimulationEvent`` (at each stage transition) to the WebSocket
channel ``/api/ws/refactor-events`` per contract
``_meta/contracts/pandora-to-asclepius.md`` lines 16-65.

Wave 3 architecture: Hades owns the FastAPI WebSocket endpoint + the
process-local event bus (`backend/app/services/event_bus.py`). Pandora
exposes a thin publisher that subscribers consume via Hades' bus.

For Cycle 1 ship: Pandora declares the publisher locally with an
in-memory pub/sub queue so the simulation engine end-to-end tests
work without Hades. Cycle 2 swap: replace the publisher with Hades'
``event_bus.publish_refactor_event`` import.

Compliance: Lock 1 (no em dash). Lock 2 (no emoji). Lock 5 [STUB
Cycle 1] flag where the in-memory queue stands in for Hades' bus.
"""

from __future__ import annotations

import asyncio
import json
import logging
from collections import defaultdict, deque
from typing import Any, AsyncIterator, Callable, Optional

from .types import RefactorProposalEvent, SimulationEvent

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# In-memory pub/sub for Cycle 1 ship (replaced by Hades event_bus Cycle 2)
# ---------------------------------------------------------------------------


class InMemoryRefactorBus:
    """Process-local pub/sub for refactor events.

    [STUB Cycle 1, real Hades event_bus Cycle 2 full impl]

    Subscribers register per ``simulationId``. Publishes go to ALL
    subscribers matching the event's simulationId. The bus retains a
    rolling history (max 64 events per simulationId) so a late
    subscriber backfills missed stages.
    """

    def __init__(self, history_max: int = 64) -> None:
        self._subscribers: dict[str, list[asyncio.Queue[dict[str, Any]]]] = defaultdict(list)
        self._history: dict[str, deque[dict[str, Any]]] = defaultdict(
            lambda: deque(maxlen=history_max)
        )
        self._lock = asyncio.Lock()

    async def publish(self, simulation_id: str, event: dict[str, Any]) -> None:
        async with self._lock:
            self._history[simulation_id].append(event)
            queues = list(self._subscribers.get(simulation_id, ()))
        for queue in queues:
            try:
                queue.put_nowait(event)
            except asyncio.QueueFull:
                logger.warning(
                    "refactor bus: subscriber queue full, dropping event for sim=%s stage=%s",
                    simulation_id,
                    event.get("stage"),
                )

    async def subscribe(
        self,
        simulation_id: str,
        *,
        backfill: bool = True,
        max_queue_size: int = 256,
    ) -> AsyncIterator[dict[str, Any]]:
        queue: asyncio.Queue[dict[str, Any]] = asyncio.Queue(maxsize=max_queue_size)
        async with self._lock:
            self._subscribers[simulation_id].append(queue)
            history = list(self._history.get(simulation_id, ()))
        if backfill:
            for event in history:
                try:
                    queue.put_nowait(event)
                except asyncio.QueueFull:
                    break
        try:
            while True:
                event = await queue.get()
                yield event
        finally:
            async with self._lock:
                if queue in self._subscribers.get(simulation_id, []):
                    self._subscribers[simulation_id].remove(queue)

    async def history(self, simulation_id: str) -> list[dict[str, Any]]:
        async with self._lock:
            return list(self._history.get(simulation_id, ()))

    async def clear(self, simulation_id: str) -> None:
        async with self._lock:
            self._history.pop(simulation_id, None)


# ---------------------------------------------------------------------------
# Singleton + factory (Cycle 2 swap site)
# ---------------------------------------------------------------------------


_singleton: Optional[InMemoryRefactorBus] = None


def get_refactor_bus() -> InMemoryRefactorBus:
    """Return the singleton pub/sub bus.

    [STUB Cycle 1] Returns the in-memory bus. Cycle 2 swap: import
    Hades' ``event_bus`` module and return ``event_bus.refactor_bus``.
    """
    global _singleton
    if _singleton is None:
        _singleton = InMemoryRefactorBus()
    return _singleton


def set_refactor_bus(bus: InMemoryRefactorBus) -> None:
    """Override the singleton (used by tests + Cycle 2 swap)."""
    global _singleton
    _singleton = bus


# ---------------------------------------------------------------------------
# Public publisher API
# ---------------------------------------------------------------------------


class RefactorEventPublisher:
    """High-level publish API used by the simulation engine."""

    def __init__(self, bus: Optional[InMemoryRefactorBus] = None) -> None:
        self._bus = bus or get_refactor_bus()

    async def publish_proposal(self, event: RefactorProposalEvent) -> None:
        """Publish RefactorProposalEvent (Turn 0)."""
        payload = event.model_dump(mode="json")
        await self._bus.publish(event.simulationId, payload)
        logger.info(
            "refactor_publisher: published proposal for sim=%s title=%r",
            event.simulationId,
            event.title,
        )

    async def publish_stage(self, event: SimulationEvent) -> None:
        """Publish SimulationEvent (stages 1 through 9)."""
        payload = event.model_dump(mode="json")
        await self._bus.publish(event.simulationId, payload)
        logger.info(
            "refactor_publisher: published stage=%s for sim=%s",
            event.stage,
            event.simulationId,
        )

    async def history(self, simulation_id: str) -> list[dict[str, Any]]:
        return await self._bus.history(simulation_id)

    async def subscribe(
        self,
        simulation_id: str,
        *,
        on_event: Optional[Callable[[dict[str, Any]], None]] = None,
        backfill: bool = True,
    ) -> AsyncIterator[dict[str, Any]]:
        async for event in self._bus.subscribe(simulation_id, backfill=backfill):
            if on_event:
                on_event(event)
            yield event


# ---------------------------------------------------------------------------
# Convenience helpers
# ---------------------------------------------------------------------------


def serialise_event_for_ws(event: dict[str, Any]) -> str:
    """Serialise an event dict to a JSON string for WebSocket send."""
    return json.dumps(event, separators=(",", ":"), ensure_ascii=False)


__all__ = [
    "InMemoryRefactorBus",
    "RefactorEventPublisher",
    "get_refactor_bus",
    "serialise_event_for_ws",
    "set_refactor_bus",
]
