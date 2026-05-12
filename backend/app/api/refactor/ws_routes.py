"""WebSocket route for Refactor Mode event streaming (Pandora Wave 3).

Owner: Pandora (Wave 3).

Mounts ``/api/ws/refactor-events`` per contract
``_meta/contracts/pandora-to-asclepius.md`` lines 69-79. Hades's
WebSocket setup at ``backend/app/api/websocket.py`` adds the general
channel infrastructure; this module declares the refactor-specific
channel.

The Asclepius hook at
``frontend/src/modes/refactor/useSimulationEvents.ts`` connects with
``?simulationId=<id>`` query param.

Compliance: Lock 1 (no em dash). Lock 2 (no emoji).
"""

from __future__ import annotations

import asyncio
import logging
from typing import Optional

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from app.services.refactor.ws_publisher import (
    RefactorEventPublisher,
    serialise_event_for_ws,
)

logger = logging.getLogger(__name__)

ws_router = APIRouter(tags=["refactor-ws"])


# Wave-Fixing #2 Cycle 1 (Pandora rescue R-1, STAMP=20260513-0313):
# path is ``/ws/refactor-events`` because parent app mounts api_router under
# ``/api`` in ``main.py``. Previously this was ``/api/ws/refactor-events``
# which resolved to ``/api/api/ws/refactor-events`` (double prefix).
@ws_router.websocket("/ws/refactor-events")
async def refactor_events(
    websocket: WebSocket,
    simulationId: Optional[str] = Query(default=None),
) -> None:
    """Stream RefactorEvent messages for the given simulation_id.

    Behaviour:
    - If ``simulationId`` is missing, accept the socket then close
      with code 1008 (policy violation) + reason.
    - Otherwise accept, then iterate the bus subscription forever
      until the client disconnects.
    - Backfill: on connect, the subscriber receives any prior events
      from the in-memory history (max 64 per sim per
      ``ws_publisher.InMemoryRefactorBus`` constructor).
    """
    await websocket.accept()
    if not simulationId:
        await websocket.close(code=1008, reason="simulationId query param required")
        return

    publisher = RefactorEventPublisher()
    try:
        async for event in publisher.subscribe(simulationId, backfill=True):
            payload = serialise_event_for_ws(event)
            await websocket.send_text(payload)
    except WebSocketDisconnect:
        logger.info(
            "refactor_events_ws: client disconnected sim=%s",
            simulationId,
        )
    except asyncio.CancelledError:
        # Server shutdown; let it propagate so FastAPI cleans up the
        # async generator. The InMemoryRefactorBus subscribe loop's
        # finally block unsubscribes the queue.
        raise
    except Exception:  # pragma: no cover - defensive
        logger.exception(
            "refactor_events_ws: unexpected error sim=%s",
            simulationId,
        )
        try:
            await websocket.close(code=1011, reason="internal error")
        except Exception:  # pragma: no cover - already closed
            pass


__all__ = ["ws_router"]
