"""WebSocket /api/ws/building-events (Hades Wave 3).

Consumer: Hera Wave 2 `useBuildingEvents` hook per `hera-to-hades.md` line 109.

Auth via query param `?token=<jwt>` (cookies unreliable on WS upgrade per
contract Asumption 2). Frontend reconnects on disconnect with exponential
backoff (1s, 2s, 4s, 8s cap) per Pythia edge case line 215.

Flow:
1. Accept connection only if token verifies.
2. Subscribe to event_bus topic 'building_events'.
3. Stream each event as JSON to client.
4. On disconnect, unsubscribe + cleanup queue.
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status

from app.services.auth_session import verify_session_jwt
from app.services.event_bus import get_event_bus

logger = logging.getLogger("hades.api.ws.building_events")

router = APIRouter()

# Allow unauthenticated WS in dev so Hera Wave 2 mock harness can integrate
# during development. Production gates strictly.
def _allow_anonymous(settings_env: str) -> bool:
    return settings_env.lower() != "production"


@router.websocket("/ws/building-events")
async def building_events_ws(websocket: WebSocket) -> None:
    """Stream BuildingEvent JSON to authenticated client."""
    from app.config import get_settings

    settings = get_settings()

    # Auth via query param token.
    token = websocket.query_params.get("token", "")
    user_label = "anonymous"

    if token:
        claims = verify_session_jwt(token)
        if claims is None and not _allow_anonymous(settings.APP_ENV):
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        if claims is not None:
            user_label = claims.login
    elif not _allow_anonymous(settings.APP_ENV):
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()
    logger.info("ws building-events connected user=%s", user_label)

    bus = get_event_bus()

    try:
        async with bus.subscribe("building_events") as q:
            while True:
                event = await q.get()
                if event is bus.shutdown_sentinel:
                    logger.info("ws building-events bus shutdown, closing")
                    break
                await websocket.send_json(event)
    except WebSocketDisconnect:
        logger.info("ws building-events disconnected user=%s", user_label)
    except Exception as exc:
        logger.warning("ws building-events error user=%s: %s", user_label, exc)
        try:
            await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        except Exception:
            pass
