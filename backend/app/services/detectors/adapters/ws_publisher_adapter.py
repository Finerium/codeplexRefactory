"""WebSocket /api/ws/finding-events publisher adapter.

Publishes FindingEvent payloads via the shared EventBus topic `finding_events`
so the FastAPI WebSocket route in `app/api/websocket/finding_events.py` fans
them out to Asclepius Wave 2 frontend. Buffers a diagnostic copy so smoke
tests can assert lifecycle.

Per _meta/contracts/nemesis-to-asclepius.md.
"""
from __future__ import annotations

import logging
from typing import Any

from app.services.detectors.types import FindingEvent

log = logging.getLogger("nemesis.ws_publisher")

EVENT_BUS_TOPIC = "finding_events"


class WSPublisherAdapter:
    """Publishes FindingEvent dicts to event bus topic + maintains diag buffer."""

    def __init__(self, real_bus: Any | None = None) -> None:
        self._real = real_bus
        self._is_stub = real_bus is None
        self._published: list[FindingEvent] = []

    @property
    def is_stub(self) -> bool:
        return self._is_stub

    @property
    def published(self) -> list[FindingEvent]:
        return list(self._published)

    def clear_buffer(self) -> None:
        self._published.clear()

    async def publish(self, event: FindingEvent) -> None:
        self._published.append(event)
        payload = event.model_dump(by_alias=True, exclude_none=True)
        if self._real is not None and hasattr(self._real, "publish"):
            try:
                await self._real.publish(EVENT_BUS_TOPIC, payload)
                return
            except Exception as exc:  # pragma: no cover - defensive
                log.warning("EventBus publish failed; buffered only: %s", exc)
        log.info(
            "[adapter ws.publish topic=%s] type=%s repo=%s",
            EVENT_BUS_TOPIC,
            event.type,
            event.repo_full_name,
        )


_singleton: WSPublisherAdapter | None = None


def get_ws_adapter(force_real: bool = False) -> WSPublisherAdapter:
    """Singleton accessor.

    Tries `app.services.event_bus.get_event_bus()`. Falls back to buffer-only
    when unavailable.
    """
    global _singleton
    if _singleton is not None:
        return _singleton

    real = None
    try:
        from app.services.event_bus import get_event_bus

        real = get_event_bus()
    except (ImportError, AttributeError):
        if force_real:
            raise
        real = None

    _singleton = WSPublisherAdapter(real_bus=real)
    return _singleton


def reset_ws_adapter() -> None:
    """Test helper: reset singleton so next call rebinds."""
    global _singleton
    _singleton = None
