"""FastAPI application entry (Hades Wave 3).

Boots: lifespan + CORS middleware + 4 API route group + /health + /.

Run dev:
    cd backend && uvicorn app.main:app --reload --port 8000

Stub-and-sync cycle:
- Cycle 1: all routes mount + signatures lock + smoke pass.
- Cycle 2: real impl swap in router modules (no main.py change).
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.config import get_settings

logger = logging.getLogger("hades.main")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """App lifespan.

    Startup: warm singletons (parser service + event bus + Demeter real service).
    Shutdown: close asyncpg pool + httpx clients + WebSocket connections.
    """
    settings = get_settings()
    logger.info(
        "Hades backend starting (env=%s domain=%s)",
        settings.APP_ENV,
        settings.APP_DOMAIN,
    )

    # Cycle 1: lazy module imports keep cold start <100ms here.
    # Cycle 2: warm parser cache + event bus subscribers on demand.
    from app.parsers.service import get_parser_service
    from app.services.event_bus import get_event_bus

    parser = get_parser_service()
    event_bus = get_event_bus()
    logger.info("Parser service + event bus ready (lazy-load deferred per H3 hypothesis)")

    # Demeter Wave 3 cycle 1: register real asyncpg-backed Demeter service.
    # Failure here logs and falls back to stub (so dev without Postgres still boots).
    # Env var `DEMETER_DISABLE_REAL=1` skips registration (used by Hades stub tests).
    demeter_pool = None
    import os as _os

    if _os.environ.get("DEMETER_DISABLE_REAL", "").lower() in ("1", "true", "yes"):
        logger.info("Demeter real service disabled via DEMETER_DISABLE_REAL env")
    else:
        try:
            from app.services.demeter_real import DemeterRealService, create_pool
            from app.services.demeter_service import set_demeter_service

            demeter_pool = await create_pool(settings.DATABASE_URL)
            set_demeter_service(DemeterRealService(demeter_pool))
            logger.info("Demeter real service registered (asyncpg pool ready)")
        except Exception as exc:
            logger.warning(
                "Demeter real service init failed (%s); stub remains active", exc
            )

    yield

    # Shutdown: close any persistent connections.
    if demeter_pool is not None:
        try:
            await demeter_pool.close()
        except Exception as exc:
            logger.warning("Demeter pool close failed: %s", exc)
    await event_bus.shutdown()
    logger.info("Hades backend stopped")


def create_app() -> FastAPI:
    """Application factory."""
    settings = get_settings()

    app = FastAPI(
        title="Codeplex Chronicle Backend",
        description=(
            "Hades Wave 3 foundation: FastAPI + tree-sitter 11-language parser + "
            "GitHub OAuth real flow + webhook HMAC + WebSocket 3 channel."
        ),
        version="0.1.0",
        lifespan=lifespan,
        docs_url="/api/docs" if not settings.is_production else None,
        redoc_url="/api/redoc" if not settings.is_production else None,
        openapi_url="/api/openapi.json" if not settings.is_production else None,
    )

    # CORS for frontend dev + production domain.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_allow_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["X-Hub-Signature-256", "X-GitHub-Delivery", "X-GitHub-Event"],
    )

    # Aggregate routers.
    app.include_router(api_router, prefix="/api")

    @app.get("/health", tags=["meta"])
    async def health() -> dict[str, str]:
        """Liveness probe (Atlas Wave 3 K8s consume)."""
        return {"status": "ok", "service": "hades-backend", "version": app.version}

    @app.get("/", tags=["meta"])
    async def root() -> dict[str, str]:
        """Root marker."""
        return {
            "service": "codeplex-chronicle-backend",
            "owner": "Hades Wave 3",
            "docs": "/api/docs",
        }

    return app


app = create_app()
