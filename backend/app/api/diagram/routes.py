"""Diagram HTTP routes (Phanes Wave-Fixing #2 cycle 1, Manager FINAL Cycle 2 extend).

PRD Section 17.3 line 1089 LOCKED: diagram pipeline ships JSON schema for
city renderer consumption. Endpoints:

- GET  /api/diagram/repos                          -> list registered repo ids
- GET  /api/diagram/{repo_id}                      -> DiagramArtifact (cache 60s)
- GET  /api/diagram/{repo_id}?refresh=true         -> force regenerate + WS push
- POST /api/diagram/{repo_id}/refresh              -> force regenerate + WS push

Manager FINAL Cycle 2 (D-Phanes-MF2-01): added `?refresh=true` GET query
parameter as a frictionless cache-bust path so the dashboard "Refresh"
button can fire a single GET instead of POST + GET sequence. Both the GET
query path and the POST `/refresh` path emit the same `diagram-update`
WebSocket event (frontend can react identically regardless of trigger).

Webhook side-effect: refresh emits `diagram-update` event on the diagram
WebSocket channel so subscribed frontend clients hot-swap city geometry
without polling.
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Query, status

from app.services.diagram import DiagramArtifact, get_diagram_service
from app.services.event_bus import get_event_bus

logger = logging.getLogger("phanes.api.diagram")

router = APIRouter(prefix="/diagram", tags=["diagram"])


@router.get("/repos")
async def list_repos() -> dict[str, list[str]]:
    """List registered repo ids (demo + datasets/ children)."""
    svc = get_diagram_service()
    return {"repos": svc.list_repos()}


@router.get("/{repo_id}", response_model=DiagramArtifact)
async def get_diagram(
    repo_id: str,
    refresh: bool = Query(
        default=False,
        description=(
            "When true, bypass the 60s in-process cache and force regenerate "
            "the artifact. Also emits a `diagram-update` event on the "
            "diagram_events WebSocket topic for hot-swap consumers."
        ),
    ),
) -> DiagramArtifact:
    """Return DiagramArtifact for repo_id (60s in-process cache).

    Manager FINAL Cycle 2 (D-Phanes-MF2-01): supports `?refresh=true` to
    bypass cache. Single-call cache bust for the Selene dashboard Refresh
    button; equivalent to POST `/refresh` but friendlier for plain GET.
    """
    if not repo_id or "/" in repo_id or ".." in repo_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"invalid repo_id: {repo_id!r}",
        )
    svc = get_diagram_service()
    if refresh:
        await svc.invalidate(repo_id)
    artifact = await svc.generate(repo_id, force=refresh)
    if artifact.render_errors and "repo_not_registered" in artifact.render_errors:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"repo_id not registered: {repo_id}",
        )

    # Emit WS event on force-refresh path so subscribers (frontend) can
    # hot-swap city geometry without polling. Symmetric with POST /refresh.
    if refresh:
        bus = get_event_bus()
        await bus.publish(
            "diagram_events",
            {
                "kind": "diagram-update",
                "repo_id": repo_id,
                "schema_version": artifact.schema_version,
                "generated_at_iso": artifact.generated_at_iso,
                "stats": artifact.stats,
            },
        )
        logger.info("diagram refresh (GET query) emitted repo_id=%s", repo_id)
    return artifact


@router.post("/{repo_id}/refresh", response_model=DiagramArtifact)
async def refresh_diagram(repo_id: str) -> DiagramArtifact:
    """Force regenerate diagram + emit `diagram-update` WS event."""
    if not repo_id or "/" in repo_id or ".." in repo_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"invalid repo_id: {repo_id!r}",
        )
    svc = get_diagram_service()
    await svc.invalidate(repo_id)
    artifact = await svc.generate(repo_id, force=True)
    if artifact.render_errors and "repo_not_registered" in artifact.render_errors:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"repo_id not registered: {repo_id}",
        )

    # Emit WS event for any subscribed frontend client.
    bus = get_event_bus()
    await bus.publish(
        "diagram_events",
        {
            "kind": "diagram-update",
            "repo_id": repo_id,
            "schema_version": artifact.schema_version,
            "generated_at_iso": artifact.generated_at_iso,
            "stats": artifact.stats,
        },
    )
    logger.info("diagram refresh emitted repo_id=%s", repo_id)
    return artifact
