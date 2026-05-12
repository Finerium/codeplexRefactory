"""In-memory pub-sub event bus (Hades Wave 3).

Single-pod K8s replica per PRD Section 17 supports in-memory bus without
Redis or external broker (Pythia contract `hera-to-hades.md` Asumption 3).

Topics align with WebSocket channels:
- 'building_events'  (Hera Wave 2 consumes per `hera-to-hades.md`)
- 'refactor_events'  (Asclepius Wave 2 consumes, Pandora Wave 3 produces)
- 'finding_events'   (Asclepius Wave 2 consumes, Nemesis Wave 3 produces)

API:
- subscribe(topic) -> async iterator of events (queue-backed per subscriber)
- publish(topic, event) -> fan-out to all subscribers of that topic
- shutdown() -> close all queues, sentinel close to all subscribers

Cycle 1: real impl (no stub). Used by Hades webhook receiver + WebSocket
endpoints. Cycle 2+ unchanged.
"""
from __future__ import annotations

import asyncio
import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any

logger = logging.getLogger("hades.event_bus")

# Sentinel value: subscriber receives this to know publisher is shutting down.
_SHUTDOWN_SENTINEL = object()

# Maximum events queued per subscriber. Beyond this, oldest events dropped
# (subscriber lagging gets degraded delivery; alternative is to drop new event
# but old retention matters less than fresh state in Sprint Mode HERO demo).
_MAX_QUEUE_PER_SUBSCRIBER = 500


class EventBus:
    """In-memory async pubsub.

    Topic strings are arbitrary; current Hades topics:
    'building_events', 'refactor_events', 'finding_events'.
    """

    def __init__(self) -> None:
        self._subscribers: dict[str, set[asyncio.Queue]] = {}
        self._lock = asyncio.Lock()
        self._closed = False

    async def publish(self, topic: str, event: dict[str, Any]) -> int:
        """Fan-out event to all subscribers of topic. Returns count delivered.

        If subscriber queue full, oldest event dropped to make room (Hades
        prefers fresh state over historical events for real-time demo).
        """
        if self._closed:
            logger.warning("publish ignored, bus closed (topic=%s)", topic)
            return 0
        async with self._lock:
            subs = self._subscribers.get(topic, set()).copy()
        delivered = 0
        for q in subs:
            try:
                q.put_nowait(event)
                delivered += 1
            except asyncio.QueueFull:
                # Drop oldest, retry once.
                try:
                    q.get_nowait()
                    q.put_nowait(event)
                    delivered += 1
                    logger.warning(
                        "subscriber queue lagged, dropped oldest (topic=%s)", topic
                    )
                except Exception:
                    logger.error(
                        "subscriber queue critical, event dropped (topic=%s)", topic
                    )
        return delivered

    @asynccontextmanager
    async def subscribe(self, topic: str) -> AsyncIterator[asyncio.Queue]:
        """Context manager yielding subscriber queue.

        Usage:
            async with bus.subscribe('building_events') as q:
                while True:
                    event = await q.get()
                    if event is _SHUTDOWN_SENTINEL:
                        break
                    yield event
        """
        if self._closed:
            raise RuntimeError("EventBus is closed; cannot subscribe")
        q: asyncio.Queue = asyncio.Queue(maxsize=_MAX_QUEUE_PER_SUBSCRIBER)
        async with self._lock:
            self._subscribers.setdefault(topic, set()).add(q)
        try:
            yield q
        finally:
            async with self._lock:
                subs = self._subscribers.get(topic)
                if subs is not None:
                    subs.discard(q)
                    if not subs:
                        self._subscribers.pop(topic, None)

    async def subscriber_count(self, topic: str) -> int:
        """Diagnostic: count active subscribers per topic."""
        async with self._lock:
            return len(self._subscribers.get(topic, set()))

    async def shutdown(self) -> None:
        """Close bus, signal all subscribers via sentinel."""
        self._closed = True
        async with self._lock:
            all_queues = [q for subs in self._subscribers.values() for q in subs]
            self._subscribers.clear()
        for q in all_queues:
            try:
                q.put_nowait(_SHUTDOWN_SENTINEL)  # type: ignore[arg-type]
            except Exception:
                pass
        logger.info("EventBus shutdown signaled to %d subscribers", len(all_queues))

    @property
    def shutdown_sentinel(self) -> object:
        """Exposed so subscribers can compare against it."""
        return _SHUTDOWN_SENTINEL


_event_bus_singleton: EventBus | None = None


def get_event_bus() -> EventBus:
    """Singleton accessor (lazy)."""
    global _event_bus_singleton
    if _event_bus_singleton is None:
        _event_bus_singleton = EventBus()
    return _event_bus_singleton


def reset_event_bus() -> None:
    """Test helper: reset singleton."""
    global _event_bus_singleton
    _event_bus_singleton = None
