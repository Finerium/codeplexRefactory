"""Dual review gate API routes (Pandora Wave 3).

Owner: Pandora (Wave 3).

Endpoints per ``_meta/handoff_log/wave2_asclepius_to_pandora.md``
"Backend endpoints to implement" + Wave-Fixing #2 Cycle 1 rescue R-1
SSE proposal-streaming endpoint added per PRD Section 9.3 step 4
("side panel auto-generate OpenSpec change folder live"):

- ``POST /api/refactor/propose`` SSE stream of proposal authoring +
  OpenSpec change folder live drafting (NEW Wave-Fixing #2 Cycle 1).
- ``POST /api/refactor/simulate`` 202 Accepted + background 3-turn run.
- ``POST /api/refactor/{simulation_id}/accept`` OQ-09 download diff.
- ``POST /api/refactor/{simulation_id}/discard`` cleanup drafts/.

Plus a small ``GET /api/refactor/{simulation_id}/accept-info`` helper
the Asclepius UI can hit before the download to verify the diff is
ready (Wave 3 nice-to-have, not in critical path).

Accept implements OQ-09 default download diff: returns a
``FileResponse`` with ``media_type='application/octet-stream'`` and
``filename='refactor.diff'``. The Pandora ferry conditions LOCKED bar:
OQ-09 Accept changes scope is Pandora authority but coordinated with
Atlas deploy (file mount paths). Atlas mounts ``DRAFTS_ROOT`` to a
persistent volume so the diff survives between simulate + accept calls
within the same session.

Compliance: Lock 1 (no em dash). Lock 2 (no emoji). Lock 3 + AD-19.
"""

from __future__ import annotations

import asyncio
import json
import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import AsyncIterator, Optional

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query, status
from fastapi.responses import FileResponse, StreamingResponse

from app.services.refactor.demeter_adapter import get_demeter_adapter
from app.services.refactor.drafts_isolation import (
    cleanup_simulation_dir,
    simulation_dir,
)
from app.services.refactor.github_issue_fallback import (
    draft_github_issue,
    has_openspec_folder,
)
from app.services.refactor.openspec_generator import OpenSpecGenerator
from app.services.refactor.proposal_author import (
    ProposalAuthor,
    sanitize_change_name,
)
from app.services.refactor.simulation_engine import SimulationEngine

from .schemas import (
    AcceptInfoResponse,
    DiscardResponse,
    SimulateRequest,
    SimulateResponse,
)

logger = logging.getLogger(__name__)

# Wave-Fixing #2 Cycle 1 (Pandora rescue R-1, STAMP=20260513-0313):
# prefix is "/refactor" because the parent app mounts ``api_router`` under
# ``/api`` in ``main.py``. Previously this was "/api/refactor" which caused
# the routes to resolve to ``/api/api/refactor/*`` (double prefix). Frontend
# /api/refactor/simulate returned 404 because of this mismatch.
router = APIRouter(prefix="/refactor", tags=["refactor"])


# ---------------------------------------------------------------------------
# Endpoint state (per-request singletons; Cycle 2 wire to app.state)
# ---------------------------------------------------------------------------


def _get_proposal_author() -> ProposalAuthor:
    return ProposalAuthor()


def _get_simulation_engine() -> SimulationEngine:
    return SimulationEngine()


# ---------------------------------------------------------------------------
# Propose (SSE stream) - Wave-Fixing #2 Cycle 1 (Pandora rescue R-1)
# ---------------------------------------------------------------------------


def _sse_event(event_type: str, data: dict) -> str:
    """Serialize a Server-Sent Event frame.

    Per the HTML5 EventSource spec, each frame is ``event: <name>\\n``
    plus ``data: <json>\\n\\n``. The frontend uses a fetch-streaming
    consumer (NOT EventSource) so it can issue a POST + read text-frame
    chunks; the framing is still SSE so the same parser handles both.
    """
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    return f"event: {event_type}\ndata: {payload}\n\n"


@router.post("/propose")
async def propose(
    req: SimulateRequest,
    repo_root: Optional[str] = Query(default=None),
) -> StreamingResponse:
    """SSE stream of Athena proposal authoring + OpenSpec change folder live.

    Wave-Fixing #2 Cycle 1 rescue R-1 (STAMP=20260513-0313):
    Per PRD Section 9.3 step 4 ("side panel auto-generate OpenSpec
    change folder live"), the frontend Refactor side panel needs a
    streaming surface so the proposal/design/tasks text appears
    chunk-by-chunk while Athena thinks. This endpoint emits an SSE
    stream the frontend consumes via fetch + ReadableStream.

    Stream sequence:
    1. ``event: proposal.started`` (simulation_id assigned)
    2. ``event: proposal.ghost`` (ghost building hints per ghost,
       streamed one-by-one so the city renders ghosts as they arrive)
    3. ``event: proposal.openspec.proposal_md`` (proposal.md content)
    4. ``event: proposal.openspec.design_md`` (design.md content)
    5. ``event: proposal.openspec.tasks_md`` (tasks.md content)
    6. ``event: proposal.complete`` (full RefactorProposalEvent JSON)
    7. ``event: proposal.simulate_ready`` (simulation_id + websocket_url
       so the frontend can POST /simulate next or auto-trigger)

    The endpoint does NOT run the 3-turn simulation; that's reserved
    for ``POST /simulate``. The Run Simulation button in the UI calls
    /simulate after the user reviews the proposal stream.

    Returns:
        StreamingResponse with ``media_type='text/event-stream'``.
    """
    author = _get_proposal_author()

    async def _stream() -> AsyncIterator[bytes]:
        try:
            # Step 1: kick off the proposal authoring.
            proposal = await author.analyze_intent(
                user_intent=req.user_intent,
                repo_slug=req.repo_slug,
            )

            base_slug = sanitize_change_name(proposal.title)
            simulation_id = f"{base_slug}-{uuid.uuid4().hex[:6]}"
            proposal.openspec_change_path = f"openspec/changes/{simulation_id}/"

            yield _sse_event(
                "proposal.started",
                {
                    "simulation_id": simulation_id,
                    "title": proposal.title,
                    "summary": proposal.summary,
                    "user_intent": proposal.user_intent,
                    "complexity": proposal.complexity,
                },
            ).encode("utf-8")

            # Brief yield so the frontend renders the started frame
            # before the heavier ghost + openspec frames land.
            await asyncio.sleep(0.05)

            # Step 2: stream each ghost building hint individually so
            # the city renders them progressively (matches PRD Section
            # 9.3 step 3 "3 ghost buildings appear with animated dashed
            # outline").
            for ghost in proposal.ghost_hints:
                yield _sse_event(
                    "proposal.ghost",
                    {
                        "simulation_id": simulation_id,
                        "ghost": ghost.model_dump(mode="json"),
                    },
                ).encode("utf-8")
                await asyncio.sleep(0.05)

            # Step 3: generate the OpenSpec change folder (or GitHub
            # Issue fallback) and stream each markdown file content.
            repo_path = Path(repo_root) if repo_root else Path(".")
            openspec_change_path = proposal.openspec_change_path
            generated_paths_pairs: list[tuple[str, Path]] = []

            if has_openspec_folder(repo_path):
                generator = OpenSpecGenerator(repo_root=repo_path)
                folder_a, _folder_b = generator.generate(proposal)
                # OpenSpec v1.0 layout: proposal.md + design.md + tasks.md
                # always under the change folder; stream them in the order
                # the side panel renders cards.
                for kind in ("proposal_md", "design_md", "tasks_md"):
                    file_path = folder_a / f"{kind.replace('_md', '.md')}"
                    generated_paths_pairs.append((kind, file_path))
            else:
                draft = draft_github_issue(proposal, repo_slug=req.repo_slug)
                openspec_change_path = draft.to_url()
                proposal.openspec_change_path = openspec_change_path
                yield _sse_event(
                    "proposal.fallback.github_issue",
                    {
                        "simulation_id": simulation_id,
                        "issue_url": openspec_change_path,
                        "issue_title": draft.title,
                        "issue_body_preview": draft.body[:400],
                    },
                ).encode("utf-8")

            # Stream each markdown file the generator wrote.
            for kind, file_path in generated_paths_pairs:
                try:
                    body = file_path.read_text(encoding="utf-8")
                except OSError:
                    body = ""
                yield _sse_event(
                    f"proposal.openspec.{kind}",
                    {
                        "simulation_id": simulation_id,
                        "path": str(file_path),
                        "body": body,
                    },
                ).encode("utf-8")
                await asyncio.sleep(0.05)

            # Step 4: emit the canonical RefactorProposalEvent envelope
            # so the frontend can ingest it through the same store path
            # used by the WebSocket subscription.
            yield _sse_event(
                "proposal.complete",
                {
                    "type": "simulation.proposal",
                    "simulationId": simulation_id,
                    "openspecChangePath": openspec_change_path,
                    "title": proposal.title,
                    "summary": proposal.summary,
                    "userIntent": proposal.user_intent,
                    "ghostBuildings": [
                        g.model_dump(mode="json") for g in proposal.ghost_hints
                    ],
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                },
            ).encode("utf-8")

            # Step 5: signal the user can now POST /simulate.
            yield _sse_event(
                "proposal.simulate_ready",
                {
                    "simulation_id": simulation_id,
                    "websocket_url": "/api/ws/refactor-events",
                    "simulate_url": "/api/refactor/simulate",
                },
            ).encode("utf-8")

        except Exception as err:  # pragma: no cover - defensive
            logger.exception("propose SSE stream failed: %s", err)
            yield _sse_event(
                "proposal.error",
                {"error": f"{type(err).__name__}: {err}"},
            ).encode("utf-8")

    return StreamingResponse(
        _stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # disable nginx buffering
        },
    )


# ---------------------------------------------------------------------------
# Simulate
# ---------------------------------------------------------------------------


@router.post(
    "/simulate",
    response_model=SimulateResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def simulate(
    req: SimulateRequest,
    background: BackgroundTasks,
    repo_root: Optional[str] = Query(default=None),
) -> SimulateResponse:
    """Trigger the simulation engine for a user intent.

    Returns immediately with the simulation_id; the simulation engine
    runs in a background task and publishes events to
    ``/api/ws/refactor-events``.
    """

    author = _get_proposal_author()
    proposal = await author.analyze_intent(
        user_intent=req.user_intent,
        repo_slug=req.repo_slug,
    )

    # Derive simulation_id from the proposal title (deterministic) + a
    # short uuid suffix so concurrent users with similar intents do not
    # collide on the OpenSpec change folder name.
    base_slug = sanitize_change_name(proposal.title)
    simulation_id = f"{base_slug}-{uuid.uuid4().hex[:6]}"
    # Reassign the openspec_change_path so the change folder name
    # matches simulation_id (contract asclepius-to-pandora.md line 59).
    proposal.openspec_change_path = f"openspec/changes/{simulation_id}/"

    # OpenSpec change folder generation. Fallback: GitHub Issue draft.
    repo_path = Path(repo_root) if repo_root else Path(".")
    if has_openspec_folder(repo_path):
        generator = OpenSpecGenerator(repo_root=repo_path)
        generator.generate(proposal)
        openspec_change_path = proposal.openspec_change_path
    else:
        # Progressive degradation per PRD Section 11.
        draft = draft_github_issue(proposal, repo_slug=req.repo_slug)
        openspec_change_path = draft.to_url()
        proposal.openspec_change_path = openspec_change_path
        logger.info(
            "simulate: no openspec/ in repo root %s; using GitHub issue fallback url=%s",
            repo_path,
            openspec_change_path,
        )

    # Dispatch the simulation engine in a background task.
    engine = _get_simulation_engine()

    async def _run() -> None:
        await engine.run(
            simulation_id=simulation_id,
            proposal=proposal,
            author_user_id=req.author_user_id,
        )

    background.add_task(_run)

    return SimulateResponse(
        simulation_id=simulation_id,
        proposal_id=simulation_id,
        openspec_change_path=openspec_change_path,
        title=proposal.title,
        summary=proposal.summary,
        stage="simulating",
    )


# ---------------------------------------------------------------------------
# Accept (OQ-09 default download diff)
# ---------------------------------------------------------------------------


@router.get(
    "/{simulation_id}/accept-info",
    response_model=AcceptInfoResponse,
)
async def accept_info(simulation_id: str) -> AcceptInfoResponse:
    """Probe whether the diff is ready before downloading.

    Asclepius UI uses this to enable the Accept button on stage
    'completed'. Returns 404 if the diff file does not exist yet.
    """
    sim_dir = simulation_dir(simulation_id)
    diff_path = sim_dir / "diff.patch"
    if not diff_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"diff not yet ready for simulation_id={simulation_id}",
        )
    return AcceptInfoResponse(
        simulation_id=simulation_id,
        diff_path=str(diff_path),
        diff_size_bytes=diff_path.stat().st_size,
        stage="drafted",
    )


@router.post("/{simulation_id}/accept")
async def accept(simulation_id: str, cleanup: bool = Query(default=False)) -> FileResponse:
    """Accept the simulation result. Returns the diff as a download.

    Per PRD OQ-09 (LOCKED Metis recommendation): the Accept path
    returns a downloadable unified diff. NOT auto-PR-create (scope
    minimisation, no upgraded OAuth ``repo`` scope).

    The user applies the diff manually via ``git apply refactor.diff``
    or via their IDE patch tool.

    Per ``_meta/contracts/asclepius-to-pandora.md`` edge case:
    optional ``cleanup=true`` query deletes the drafts directory
    after the diff is served (the user downloads the file once).
    Default ``cleanup=false`` keeps the drafts intact so the user
    can re-download if the first attempt fails.
    """
    sim_dir = simulation_dir(simulation_id)
    diff_path = sim_dir / "diff.patch"
    if not diff_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"diff not yet ready for simulation_id={simulation_id}; "
                f"the simulation engine may still be running"
            ),
        )

    demeter = get_demeter_adapter()
    await demeter.update_proposal_stage(simulation_id, "accepted")

    # Publish accepted stage event so Asclepius runs the ghost-to-solid
    # animation. The publisher singleton matches the simulation engine.
    from app.services.refactor.types import SimulationEvent, SimulationEventPayload
    from app.services.refactor.ws_publisher import RefactorEventPublisher
    from datetime import datetime, timezone

    pub = RefactorEventPublisher()
    await pub.publish_stage(
        SimulationEvent(
            simulationId=simulation_id,
            stage="accepted",
            timestamp=datetime.now(timezone.utc).isoformat(),
            payload=SimulationEventPayload(diffFilePath=str(diff_path)),
        )
    )

    response = FileResponse(
        diff_path,
        media_type="application/octet-stream",
        filename=f"refactor-{simulation_id}.diff",
    )
    if cleanup:
        # Schedule the cleanup via response background, after the file
        # has been streamed to the client.
        from starlette.background import BackgroundTask

        def _do_cleanup() -> None:
            cleanup_simulation_dir(simulation_id)

        response.background = BackgroundTask(_do_cleanup)
    return response


# ---------------------------------------------------------------------------
# Discard
# ---------------------------------------------------------------------------


@router.post("/{simulation_id}/discard", response_model=DiscardResponse)
async def discard(simulation_id: str) -> DiscardResponse:
    """Discard the simulation result. Cleans up the drafts directory.

    Per ``_meta/contracts/pandora-to-asclepius.md`` Asumption 5:
    Pandora deletes drafts on Discard immediately.
    """
    demeter = get_demeter_adapter()
    await demeter.update_proposal_stage(simulation_id, "discarded")

    from app.services.refactor.types import SimulationEvent, SimulationEventPayload
    from app.services.refactor.ws_publisher import RefactorEventPublisher
    from datetime import datetime, timezone

    pub = RefactorEventPublisher()
    await pub.publish_stage(
        SimulationEvent(
            simulationId=simulation_id,
            stage="discarded",
            timestamp=datetime.now(timezone.utc).isoformat(),
            payload=SimulationEventPayload(),
        )
    )

    cleaned = cleanup_simulation_dir(simulation_id)
    return DiscardResponse(
        simulation_id=simulation_id,
        stage="discarded",
        drafts_cleaned=cleaned,
    )


__all__ = ["router"]
