"""Dual review gate API routes (Pandora Wave 3).

Owner: Pandora (Wave 3).

Three endpoints per ``_meta/handoff_log/wave2_asclepius_to_pandora.md``
"Backend endpoints to implement":

- ``POST /api/refactor/simulate``
- ``POST /api/refactor/{simulation_id}/accept``
- ``POST /api/refactor/{simulation_id}/discard``

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

import logging
import uuid
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query, status
from fastapi.responses import FileResponse

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

router = APIRouter(prefix="/api/refactor", tags=["refactor"])


# ---------------------------------------------------------------------------
# Endpoint state (per-request singletons; Cycle 2 wire to app.state)
# ---------------------------------------------------------------------------


def _get_proposal_author() -> ProposalAuthor:
    return ProposalAuthor()


def _get_simulation_engine() -> SimulationEngine:
    return SimulationEngine()


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
