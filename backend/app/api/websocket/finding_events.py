"""WebSocket /api/ws/finding-events (Hades Wave 3).

Producer: Nemesis Wave 3 (5 Apollo detector + Argus CVSS findings).
Consumer: Asclepius Wave 2 health glow trigger.
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status

from app.services.auth_session import verify_session_jwt
from app.services.event_bus import get_event_bus

logger = logging.getLogger("hades.api.ws.finding_events")

router = APIRouter()


@router.websocket("/ws/finding-events")
async def finding_events_ws(websocket: WebSocket) -> None:
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
    logger.info("ws finding-events connected user=%s", user_label)

    bus = get_event_bus()
    try:
        async with bus.subscribe("finding_events") as q:
            while True:
                event = await q.get()
                if event is bus.shutdown_sentinel:
                    break
                await websocket.send_json(event)
    except WebSocketDisconnect:
        logger.info("ws finding-events disconnected user=%s", user_label)
    except Exception as exc:
        logger.warning("ws finding-events error user=%s: %s", user_label, exc)
        try:
            await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        except Exception:
            pass
