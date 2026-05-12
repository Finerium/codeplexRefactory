"""Findings + 1-click GitHub issue routes (Demeter Wave 3).

POST /api/findings/{finding_id}/to-issue:
  Convert Nemesis finding into GitHub issue. Evidence chain pre-filled body,
  suggested labels (category + severity).

GET /api/findings/by-building/{building_id}:
  List open findings per building. Consumed by Asclepius glow rendering.

GET /api/dashboard:
  Selene dashboard data per `selene-to-demeter.md`.

GET /api/activity:
  Boreas activity data per `boreas-to-demeter.md`.

GET /api/cost/summary:
  Cost aggregation summary per Hafiz $5 budget tracker.

POST /api/cost/drain:
  Drain Triton in-memory ring buffer to Postgres.
"""
from __future__ import annotations

import logging
from typing import Any, Literal

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.services.activity_query import ActivityData, ActivityQueryService
from app.services.auth_session import require_session
from app.services.cost_tracking import CostTrackingService
from app.services.dashboard_query import DashboardData, DashboardQueryService
from app.services.demeter_real import DemeterRealService
from app.services.demeter_service import get_demeter_service
from app.services.github_issue_create import (
    GitHubIssueCreator,
    IssueCreateRequest,
    IssueCreateResult,
    build_evidence_body,
    suggest_label,
)

logger = logging.getLogger("demeter.api.findings")

router = APIRouter(tags=["findings"])


# ---------- dependency helpers ----------


def _require_real_demeter() -> DemeterRealService:
    """Get real Demeter service. Raise 503 if stub still active.

    Real Demeter ships via FastAPI lifespan asyncpg pool init.
    """
    svc = get_demeter_service()
    if not isinstance(svc, DemeterRealService):
        raise HTTPException(
            status_code=503,
            detail="demeter event store offline (real service not registered)",
        )
    return svc


# ---------- 1-click issue ----------


class IssueCreateBody(BaseModel):
    """Optional override fields. Defaults pull from finding row."""

    title_override: str | None = None
    body_append: str | None = None
    labels_append: list[str] = []
    repo_override: str | None = None


@router.post("/findings/{finding_id}/to-issue", response_model=IssueCreateResult)
async def finding_to_issue(
    finding_id: str,
    body: IssueCreateBody | None = None,
    scan_run_id: str | None = Query(None),
    session: dict = Depends(require_session),
    demeter: DemeterRealService = Depends(_require_real_demeter),
) -> IssueCreateResult:
    """Convert finding to a GitHub issue.

    Requires authenticated session (write:issues scope).
    """
    if not session.get("is_authenticated") and not _allow_stub_session():
        raise HTTPException(status_code=401, detail="authentication required")

    finding = await _lookup_finding(demeter, finding_id, scan_run_id)
    if finding is None:
        raise HTTPException(status_code=404, detail="finding not found")

    body_payload = body or IssueCreateBody()

    user_row = await _lookup_user_for_session(demeter, session)
    if user_row is None or not user_row.get("encrypted_access_token"):
        raise HTTPException(
            status_code=403,
            detail="user has no encrypted token on file; re-auth required",
        )

    issue_request = IssueCreateRequest(
        repo_full_name=body_payload.repo_override or finding["repo_full_name"],
        title=body_payload.title_override or f"[Codeplex] {finding['title']}",
        body=(
            build_evidence_body(finding)
            + ("\n\n" + body_payload.body_append if body_payload.body_append else "")
        ),
        labels=suggest_label(finding.get("category"), finding.get("severity"))
        + body_payload.labels_append,
    )

    creator = GitHubIssueCreator()
    try:
        result = await creator.create_issue(
            encrypted_token=user_row["encrypted_access_token"],
            request=issue_request,
        )
    except httpx.HTTPStatusError as exc:
        logger.warning("github issue create rejected: %s", exc.response.status_code)
        raise HTTPException(
            status_code=502,
            detail=f"GitHub API rejected: HTTP {exc.response.status_code}",
        ) from exc
    except ValueError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    # Update finding row: status='ticketed', linked_issue_number set.
    await _mark_finding_ticketed(
        demeter,
        finding_id=finding_id,
        scan_run_id=finding["scan_run_id"],
        issue_number=result.issue_number,
    )
    return result


# ---------- finding lookup helpers ----------


async def _lookup_finding(
    demeter: DemeterRealService,
    finding_id: str,
    scan_run_id: str | None,
) -> dict[str, Any] | None:
    async with demeter.pool.acquire() as conn:
        if scan_run_id:
            row = await conn.fetchrow(
                "SELECT * FROM finding_events "
                "WHERE finding_id = $1 AND scan_run_id = $2;",
                finding_id,
                scan_run_id,
            )
        else:
            row = await conn.fetchrow(
                "SELECT * FROM finding_events WHERE finding_id = $1 "
                "ORDER BY detected_at DESC LIMIT 1;",
                finding_id,
            )
    return dict(row) if row else None


async def _lookup_user_for_session(
    demeter: DemeterRealService,
    session: dict,
) -> dict[str, Any] | None:
    user_id = session.get("user_id")
    if user_id is None or user_id == "anonymous-demo":
        return None
    try:
        github_id = int(user_id)
    except (TypeError, ValueError):
        return None
    return await demeter.get_user_by_github_id(github_id)


async def _mark_finding_ticketed(
    demeter: DemeterRealService,
    *,
    finding_id: str,
    scan_run_id: str,
    issue_number: int,
) -> None:
    async with demeter.pool.acquire() as conn:
        await conn.execute(
            """
            UPDATE finding_events SET status = 'ticketed', linked_issue_number = $3
            WHERE finding_id = $1 AND scan_run_id = $2;
            """,
            finding_id,
            scan_run_id,
            issue_number,
        )


def _allow_stub_session() -> bool:
    """Demo mode: allow stub anonymous session to call (development only).

    Production hardening: Hades cycle 2 will reject stub session at
    `require_session` level so this branch becomes unreachable.
    """
    from app.config import get_settings

    return not get_settings().is_production


# ---------- per-building list ----------


@router.get("/findings/by-building/{building_id}")
async def findings_by_building(
    building_id: str,
    status_filter: list[str] | None = Query(None),
    demeter: DemeterRealService = Depends(_require_real_demeter),
) -> list[dict[str, Any]]:
    """List findings for a building (Asclepius glow consumer)."""
    return await demeter.list_findings_for_building(building_id, status_filter)


# ---------- dashboard ----------


@router.get("/dashboard", response_model=DashboardData)
async def get_dashboard(
    range: Literal["today", "sprint", "quarter"] = Query("sprint"),
    repo: str = Query("all"),
    sprint: str | None = Query(None),
    session: dict = Depends(require_session),
    demeter: DemeterRealService = Depends(_require_real_demeter),
) -> DashboardData:
    """Dashboard endpoint serving Selene's useDashboardData hook."""
    service = DashboardQueryService(demeter.pool)
    return await service.fetch_dashboard(
        range=range, repo=repo, sprint=sprint, user=session.get("user_id", "anonymous")
    )


# ---------- activity ----------


@router.get("/activity", response_model=ActivityData)
async def get_activity(
    days: Literal[30, 60, 90] = Query(30),
    repo: str = Query("all"),
    district: str | None = Query(None),
    session: dict = Depends(require_session),
    demeter: DemeterRealService = Depends(_require_real_demeter),
) -> ActivityData:
    """Activity endpoint serving Boreas's timeline scrubber."""
    service = ActivityQueryService(demeter.pool)
    return await service.fetch_activity(
        days=days, repo=repo, district=district, user=session.get("user_id", "anonymous")
    )


# ---------- cost tracking ----------


@router.get("/cost/summary")
async def cost_summary(
    demeter: DemeterRealService = Depends(_require_real_demeter),
) -> dict[str, Any]:
    """Cost summary per Hafiz $5 budget tracker."""
    svc = CostTrackingService(demeter)
    return await svc.aggregate_session_cost()


@router.post("/cost/drain")
async def cost_drain(
    demeter: DemeterRealService = Depends(_require_real_demeter),
) -> dict[str, int]:
    """Drain Triton in-memory ring buffer to Postgres llm_call_log."""
    svc = CostTrackingService(demeter)
    persisted = await svc.drain_buffer_to_postgres()
    return {"persisted_rows": persisted}


__all__ = ["router"]
