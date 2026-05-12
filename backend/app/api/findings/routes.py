"""Findings + 1-click GitHub issue routes (Demeter Wave 3 + Nemesis Wave-Fixing #2).

POST /api/findings/scan:
  Run the Nemesis 11-detector pipeline against a repo (default NodeGoat fixture).
  Returns ScanResult JSON: 5 Apollo findings + 5 spec-drift events + counts.
  Persists via Demeter + broadcasts FindingEvent over the finding_events bus
  for any subscribed WebSocket client (Asclepius glow consumer).

POST /api/findings/{finding_id}/to-issue:
  Convert Nemesis finding into GitHub issue. Evidence chain pre-filled body,
  suggested labels (category + severity). When ENABLE_WRITE_OPS=false (demo
  fallback or DROP-A OAuth scope denial), returns a synthetic IssueCreateResult
  with state="deeplink" and issue_url pointing at the GitHub "new issue" page
  with title/body/labels pre-filled as query params (PRD Section 12.1).

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
import urllib.parse
from pathlib import Path
from typing import Any, Literal

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.services.activity_query import ActivityData, ActivityQueryService
from app.services.auth_session import require_session
from app.services.cost_tracking import CostTrackingService
from app.services.dashboard_query import DashboardData, DashboardQueryService
from app.services.demeter_real import DemeterRealService
from app.services.demeter_service import get_demeter_service
from app.services.detectors.dispatcher import run_full_scan
from app.services.detectors.types import ScanResult
from app.services.github_issue_create import (
    GitHubIssueCreator,
    IssueCreateRequest,
    IssueCreateResult,
    build_deeplink_url,
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


def _build_deeplink_result(issue_request: IssueCreateRequest, reason: str) -> IssueCreateResult:
    """Synthetic IssueCreateResult for ENABLE_WRITE_OPS=false fallback.

    Returns a GitHub "new issue" deep link with title + body + labels pre-filled
    as URL query params. Frontend detects state="deeplink" and opens the link
    in a new tab; user reviews and submits manually. Per PRD Section 12.1.
    """
    url = build_deeplink_url(issue_request)
    logger.info("finding to-issue deeplink fallback (%s) repo=%s", reason, issue_request.repo_full_name)
    return IssueCreateResult(
        issue_number=0,
        issue_url=url,
        state="deeplink",
    )


@router.post("/findings/{finding_id}/to-issue", response_model=IssueCreateResult)
async def finding_to_issue(
    finding_id: str,
    body: IssueCreateBody | None = None,
    scan_run_id: str | None = Query(None),
    session: dict = Depends(require_session),
    demeter: DemeterRealService = Depends(_require_real_demeter),
) -> IssueCreateResult:
    """Convert finding to a GitHub issue.

    Three response modes:
    - **Live (200)**: `ENABLE_WRITE_OPS=true` + valid user token => real GitHub
      issue created, response carries issue_number + issue_url + state="open".
    - **Deep link (200, state="deeplink")**: `ENABLE_WRITE_OPS=false` OR no
      encrypted token on file => returns a GitHub `/issues/new?title=&body=...`
      URL with the evidence body pre-filled. Frontend opens in new tab for
      manual submit. Issue number = 0 to signal "not yet created".
    - **404**: finding_id not in finding_events table.
    """
    from app.config import get_settings

    if not session.get("is_authenticated") and not _allow_stub_session():
        raise HTTPException(status_code=401, detail="authentication required")

    finding = await _lookup_finding(demeter, finding_id, scan_run_id)
    if finding is None:
        raise HTTPException(status_code=404, detail="finding not found")

    body_payload = body or IssueCreateBody()
    settings = get_settings()

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

    # ENABLE_WRITE_OPS=false: short-circuit to deep link, no GitHub API call.
    if not settings.ENABLE_WRITE_OPS:
        return _build_deeplink_result(issue_request, reason="write_ops_disabled")

    user_row = await _lookup_user_for_session(demeter, session)
    if user_row is None or not user_row.get("encrypted_access_token"):
        # DROP-A condition (write scope denied / re-auth needed). Degrade to deep
        # link rather than 403 so demo flow never dead-ends.
        return _build_deeplink_result(issue_request, reason="no_user_token")

    creator = GitHubIssueCreator()
    try:
        result = await creator.create_issue(
            encrypted_token=user_row["encrypted_access_token"],
            request=issue_request,
        )
    except httpx.HTTPStatusError as exc:
        logger.warning("github issue create rejected: %s", exc.response.status_code)
        # Rate limit or scope denial: degrade to deep link rather than 502.
        if exc.response.status_code in (401, 403, 404, 422, 429):
            return _build_deeplink_result(issue_request, reason=f"http_{exc.response.status_code}")
        raise HTTPException(
            status_code=502,
            detail=f"GitHub API rejected: HTTP {exc.response.status_code}",
        ) from exc
    except (ValueError, httpx.HTTPError) as exc:
        logger.warning("github issue create transport failure: %s", exc)
        return _build_deeplink_result(issue_request, reason="transport_failure")

    # Update finding row: status='ticketed', linked_issue_number set.
    await _mark_finding_ticketed(
        demeter,
        finding_id=finding_id,
        scan_run_id=finding["scan_run_id"],
        issue_number=result.issue_number,
    )
    return result


# ---------- scan trigger ----------


_DEFAULT_DEMO_FIXTURE = (
    Path(__file__).resolve().parents[3] / "tests" / "fixtures" / "nodegoat-slice"
)


class ScanRequest(BaseModel):
    """Scan trigger payload.

    `repo_full_name` is required (used to tag findings + drift_log rows). When
    `repo_root` is omitted, the NodeGoat fixture slice ships with the backend
    is scanned (demo mode). In production, callers pass an absolute filesystem
    path to a checked-out repo.
    """

    repo_full_name: str = Field(min_length=3)
    repo_root: str | None = None


@router.post("/findings/scan", response_model=ScanResult)
async def trigger_scan(
    payload: ScanRequest | None = None,
    session: dict = Depends(require_session),
) -> ScanResult:
    """Trigger a full Nemesis scan run.

    Pipeline:
    1. Resolve repo_root (request override or default NodeGoat fixture).
    2. Run 5 Apollo detectors + Argus CVSS enrichment + 5 spec-drift detectors.
    3. Persist FindingPersist + DriftEventPersist via Demeter.
    4. Publish scan.started + finding.detected x N + scan.completed via
       EventBus to any subscribed WebSocket client.
    5. Return ScanResult JSON for caller introspection.

    The endpoint is unauthenticated in dev/demo mode (allow_stub_session true)
    so a fresh browser session can demo without an OAuth round-trip. Production
    hardens require_session at the dependency layer.
    """
    if not session.get("is_authenticated") and not _allow_stub_session():
        raise HTTPException(status_code=401, detail="authentication required")

    req = payload or ScanRequest(repo_full_name="duopoly/codeplex-demo-nodegoat-slice")

    if req.repo_root:
        repo_root = Path(req.repo_root).resolve()
    else:
        repo_root = _DEFAULT_DEMO_FIXTURE

    if not repo_root.exists() or not repo_root.is_dir():
        raise HTTPException(
            status_code=400,
            detail=f"repo_root not found or not a directory: {repo_root}",
        )

    try:
        result = await run_full_scan(repo_root, req.repo_full_name)
    except Exception as exc:  # noqa: BLE001
        logger.exception("scan failed repo=%s err=%s", req.repo_full_name, exc)
        raise HTTPException(
            status_code=500, detail=f"scan pipeline failed: {exc}"
        ) from exc

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
    aggregate: Literal["per-repo", "cross-repo"] = Query("per-repo"),
    session: dict = Depends(require_session),
    demeter: DemeterRealService = Depends(_require_real_demeter),
) -> DashboardData:
    """Dashboard endpoint serving Selene's useDashboardData hook.

    Wave-Fixing #2 cycle 1 addition (Selene multi-repo scope):
    `aggregate=cross-repo` returns rolled-up totals across all user-connected
    repos. When `aggregate=cross-repo` is set the `repo` filter is ignored and
    cross-repo sums are computed.
    """
    service = DashboardQueryService(demeter.pool)
    effective_repo = "all" if aggregate == "cross-repo" else repo
    data = await service.fetch_dashboard(
        range=range,
        repo=effective_repo,
        sprint=sprint,
        user=session.get("user_id", "anonymous"),
    )
    # When cross-repo requested attach an aggregate marker so consumer can label.
    if aggregate == "cross-repo":
        data.briefing = (
            f"Cross-repo aggregate across {len(data.repos)} repos. " + data.briefing
        )
    return data


# ---------- activity ----------


@router.get("/activity", response_model=ActivityData)
async def get_activity(
    days: int = Query(30, ge=30, le=90, description="Window size 30/60/90 days"),
    repo: str = Query("all"),
    district: str | None = Query(None),
    session: dict = Depends(require_session),
    demeter: DemeterRealService = Depends(_require_real_demeter),
) -> ActivityData:
    """Activity endpoint serving Boreas's timeline scrubber.

    Wave-Fixing #2 cycle 1 fix: `days` was `Literal[30, 60, 90]` which Pydantic
    parsed strictly even from query string -> 422 on str input. Switched to
    `int` with range bound + snap to nearest valid window in service layer.
    """
    # Snap to closest valid window (30/60/90) for downstream contract.
    valid_windows = (30, 60, 90)
    snapped_days = min(valid_windows, key=lambda v: abs(v - days))
    service = ActivityQueryService(demeter.pool)
    return await service.fetch_activity(
        days=snapped_days,
        repo=repo,
        district=district,
        user=session.get("user_id", "anonymous"),
    )


# ---------- cost tracking ----------


@router.get("/cost/summary")
async def cost_summary(
    auto_drain: bool = Query(True, description="Drain Triton buffer before aggregate"),
    demeter: DemeterRealService = Depends(_require_real_demeter),
) -> dict[str, Any]:
    """Cost summary per Hafiz $5 budget tracker.

    Wave-Fixing #2 cycle 1: defaults to `auto_drain=true` so the endpoint
    surfaces the freshest cost figure. The Triton in-memory buffer is drained
    to Postgres `llm_call_log` before the aggregate query runs. This closes
    the gap surfaced post-Triton smoke where `/api/llm/health.total_cost_usd`
    showed real DeepSeek spend but `/api/cost/summary.total_usd` was $0.0.
    """
    svc = CostTrackingService(demeter)
    drained = 0
    if auto_drain:
        try:
            drained = await svc.drain_buffer_to_postgres()
        except Exception as exc:
            logger.warning("auto-drain skipped: %s", exc)
    summary = await svc.aggregate_session_cost()
    summary["auto_drained_rows"] = drained
    return summary


@router.post("/cost/drain")
async def cost_drain(
    demeter: DemeterRealService = Depends(_require_real_demeter),
) -> dict[str, int]:
    """Drain Triton in-memory ring buffer to Postgres llm_call_log."""
    svc = CostTrackingService(demeter)
    persisted = await svc.drain_buffer_to_postgres()
    return {"persisted_rows": persisted}


# ---------- OpenSpec runtime ----------


@router.get("/openspec/list")
async def openspec_list() -> dict[str, Any]:
    """List OpenSpec specs (Folder A panitia-facing).

    Wave-Fixing #2 cycle 1 add: expose `openspec list --specs --json` over HTTP
    for Pan demo + Aletheia smoke verification.
    """
    from app.services.openspec_runtime import OpenSpecRuntime

    runtime = OpenSpecRuntime()
    specs = await runtime.list_specs_parsed()
    raw = await runtime.list_specs()
    return {
        "specs": specs,
        "success": raw.success,
        "returncode": raw.returncode,
        "stderr": raw.stderr if not raw.success else "",
    }


@router.get("/openspec/validate")
async def openspec_validate(
    change_id: str | None = Query(None, description="Change ID, omit for all"),
) -> dict[str, Any]:
    """Validate an OpenSpec change (or all)."""
    from app.services.openspec_runtime import OpenSpecRuntime

    runtime = OpenSpecRuntime()
    result = await runtime.validate(change_id)
    return {
        "success": result.success,
        "returncode": result.returncode,
        "stdout": result.stdout,
        "stderr": result.stderr,
    }


# ---------- demo seed (Wave-Fixing #2 cluster 4+8 rescue) ----------


@router.post("/demo/seed")
async def demo_seed(
    demeter: DemeterRealService = Depends(_require_real_demeter),
) -> dict[str, Any]:
    """Idempotent seed of realistic NodeGoat + fastapi-fullstack demo data.

    Wave-Fixing #2 cycle 1 cluster 4+8: populates pr_events + finding_events +
    drift_log so dashboard + activity matviews render non-empty for Selene +
    Boreas demo. Seed rows tagged `seed-demo-` prefix so panitia can
    distinguish from real OAuth events.
    """
    from app.services.demo_seed import DemoSeedService

    seeder = DemoSeedService(demeter)
    return await seeder.seed_all()


@router.post("/demo/refresh-views")
async def demo_refresh_views(
    demeter: DemeterRealService = Depends(_require_real_demeter),
) -> dict[str, str]:
    """Refresh all materialized views (Wave-Fixing #2 helper).

    Useful for verifying dashboard + activity queries serve fresh data after
    seed or after live OAuth webhook flow.
    """
    await demeter.refresh_dashboard_views()
    await demeter.refresh_activity_views()
    return {"status": "refreshed"}


__all__ = ["router"]
