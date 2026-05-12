"""WebSocket /api/ws/refactor-events (Hades Wave 3).

Producer: Pandora Wave 3 (Refactor Mode simulation engine produces ghost
          building + simulation progress events).
Consumer: Asclepius Wave 2 refactor visual layer.

Pattern matches building_events_ws (auth + subscribe + stream).
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status

from app.services.auth_session import verify_session_jwt
from app.services.event_bus import get_event_bus

logger = logging.getLogger("hades.api.ws.refactor_events")

router = APIRouter()


@router.websocket("/ws/refactor-events")
async def refactor_events_ws(websocket: WebSocket) -> None:
    from app.config import get_settings

    settings = get_settings()
    token = websocket.query_params.get("token", "")
    user_label = "anonymous"

    if token:
        claims = verify_session_jwt(token)
        if claims is None and settings.is_production:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        if claims is not None:
            user_label = claims.login
    elif settings.is_production:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()
    logger.info("ws refactor-events connected user=%s", user_label)

    bus = get_event_bus()
    try:
        async with bus.subscribe("refactor_events") as q:
            while True:
                event = await q.get()
                if event is bus.shutdown_sentinel:
                    break
                await websocket.send_json(event)
    except WebSocketDisconnect:
        logger.info("ws refactor-events disconnected user=%s", user_label)
    except Exception as exc:
        logger.warning("ws refactor-events error user=%s: %s", user_label, exc)
        try:
            await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        except Exception:
            pass
