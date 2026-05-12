"""Refactor Mode API package (Pandora Wave 3).

Exposes:
- ``router``: FastAPI APIRouter with the 3 dual review gate endpoints
  POST /api/refactor/simulate, POST /api/refactor/{id}/accept,
  POST /api/refactor/{id}/discard.
- ``ws_router``: FastAPI APIRouter with the WebSocket endpoint
  /api/ws/refactor-events.

Mount at the FastAPI app root via:

    from app.api.refactor import router as refactor_router, ws_router as refactor_ws_router
    app.include_router(refactor_router)
    app.include_router(refactor_ws_router)

Compliance: Lock 1 (no em dash). Lock 2 (no emoji).
"""

from .routes import router
from .ws_routes import ws_router

__all__ = ["router", "ws_router"]
