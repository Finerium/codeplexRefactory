"""WebSocket /api/ws/diagram-events (Phanes Wave-Fixing #2 cycle 1).

Frontend `diagramConsumer.ts` (Iris coordinate, cityEngine hook) subscribes
here to receive `diagram-update` events triggered by:
1. POST /api/diagram/{repo_id}/refresh (explicit user action)
2. GitHub webhook -> diagram cache invalidate (future Hades wire)

Auth follows same pattern as Hades' building/refactor/finding WS endpoints:
query-param token, anonymous allowed in non-production env.
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status

from app.services.auth_session import verify_session_jwt
from app.services.event_bus import get_event_bus

logger = logging.getLogger("phanes.api.ws.diagram_events")

router = APIRouter()


def _allow_anonymous(settings_env: str) -> bool:
    return settings_env.lower() != "production"


@router.websocket("/ws/diagram-events")
async def diagram_events_ws(websocket: WebSocket) -> None:
    """Stream diagram-update JSON to authenticated client."""
    from app.config import get_settings

    settings = get_settings()

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
    logger.info("ws diagram-events connected user=%s", user_label)

    bus = get_event_bus()

    try:
        async with bus.subscribe("diagram_events") as q:
            while True:
                event = await q.get()
                if event is bus.shutdown_sentinel:
                    logger.info("ws diagram-events bus shutdown, closing")
                    break
                await websocket.send_json(event)
    except WebSocketDisconnect:
        logger.info("ws diagram-events disconnected user=%s", user_label)
    except Exception as exc:
        logger.warning(
            "ws diagram-events error user=%s: %s", user_label, exc
        )
        try:
            await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        except Exception:
            pass
