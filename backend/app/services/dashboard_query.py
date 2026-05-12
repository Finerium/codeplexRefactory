"""Dashboard query service (Demeter Wave 3).

Implements DashboardData fetch per `_meta/contracts/selene-to-demeter.md` +
`demeter-to-selene.md`. Aggregates from pr_events + materialized views.

Wave 3 cycle 1: real Postgres query layer. Wave 1 Selene swaps mock JSON for
this real endpoint (already mounted at /api/dashboard via new findings router).
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Literal

import asyncpg
from pydantic import BaseModel, Field

logger = logging.getLogger("demeter.dashboard")


# ---------- Pydantic response models ----------


class KPIMetric(BaseModel):
    id: Literal["velocity", "cycle-time", "change-failure-rate", "deploys-this-week"]
    label: str
    value: float
    unit: Literal["points", "days", "percent", "count"]
    delta_percent: float = 0.0


class VelocityPoint(BaseModel):
    sprint_label: str
    points_completed: int
    end_date: str


class BurndownPoint(BaseModel):
    day: int
    ideal_remaining: float
    actual_remaining: float


class MilestoneProgress(BaseModel):
    id: str
    label: str
    percent_complete: float
    days_remaining: int
    blockers_count: int


class ContributorStats(BaseModel):
    github_login: str
    avatar_url: str = ""
    prs_opened: int = 0
    prs_merged: int = 0
    lines_added: int = 0
    lines_deleted: int = 0
    issues_opened: int = 0
    issues_closed: int = 0


class DriftSummary(BaseModel):
    pattern: Literal["A", "B", "C", "D", "E"]
    pattern_label: str
    count: int
    severity: Literal["critical", "high", "medium", "low", "info"]
    resolution_rate: float


class RefactorProposal(BaseModel):
    id: str
    title: str
    stage: Literal["proposed", "simulating", "drafted", "accepted", "archived", "discarded"]
    author_resident: Literal["Athena", "user"]
    created_at: str
    openspec_change_path: str


class RepoStatus(BaseModel):
    full_name: str
    label: str
    open_prs: int
    open_issues: int
    status_dot: Literal["green", "yellow", "red", "gray"]
    sparkline: list[int] = Field(default_factory=list)


class DashboardData(BaseModel):
    briefing: str
    kpis: list[KPIMetric]
    velocity: list[VelocityPoint]
    burndown: list[BurndownPoint]
    milestones: list[MilestoneProgress]
    contributors: list[ContributorStats]
    drifts: list[DriftSummary]
    refactor_proposals: list[RefactorProposal]
    repos: list[RepoStatus]
    current_sprint: str
    last_refresh: str


# ---------- Query service ----------


class DashboardQueryService:
    """Serves /api/dashboard from Postgres materialized views + tables."""

    def __init__(self, pool: asyncpg.Pool) -> None:
        self._pool = pool

    async def fetch_dashboard(
        self,
        range: Literal["today", "sprint", "quarter"],
        repo: str,
        sprint: str | None,
        user: str | int,
    ) -> DashboardData:
        async with self._pool.acquire() as conn:
            since = _range_since(range)
            current_sprint = sprint or "current"

            velocity = await self._fetch_velocity(conn, repo)
            drifts = await self._fetch_drift_summary(conn, repo)
            refactor_proposals = await self._fetch_proposals(conn, repo)
            repos = await self._fetch_repos(conn)
            contributors = await self._fetch_contributors(conn, repo, since)
            kpis = await self._fetch_kpis(conn, repo, since)
            milestones: list[MilestoneProgress] = []
            burndown: list[BurndownPoint] = []
            briefing = _briefing_template(current_sprint, drifts, refactor_proposals)

            return DashboardData(
                briefing=briefing,
                kpis=kpis,
                velocity=velocity,
                burndown=burndown,
                milestones=milestones,
                contributors=contributors,
                drifts=drifts,
                refactor_proposals=refactor_proposals,
                repos=repos,
                current_sprint=current_sprint,
                last_refresh=datetime.now(timezone.utc).isoformat(),
            )

    async def _fetch_velocity(
        self, conn: asyncpg.Connection, repo: str
    ) -> list[VelocityPoint]:
        try:
            if repo == "all":
                rows = await conn.fetch(
                    "SELECT sprint_label, points_completed, end_date "
                    "FROM velocity_per_sprint "
                    "ORDER BY end_date DESC NULLS LAST LIMIT 8;"
                )
            else:
                rows = await conn.fetch(
                    "SELECT sprint_label, points_completed, end_date "
                    "FROM velocity_per_sprint WHERE repo_full_name = $1 "
                    "ORDER BY end_date DESC NULLS LAST LIMIT 8;",
                    repo,
                )
        except asyncpg.UndefinedTableError:
            return []
        return [
            VelocityPoint(
                sprint_label=r["sprint_label"] or "unknown",
                points_completed=int(r["points_completed"] or 0),
                end_date=(r["end_date"] or datetime.now(timezone.utc)).isoformat(),
            )
            for r in rows
        ]

    async def _fetch_drift_summary(
        self, conn: asyncpg.Connection, repo: str
    ) -> list[DriftSummary]:
        try:
            if repo == "all":
                rows = await conn.fetch(
                    "SELECT pattern, pattern_label, total_count, max_severity, resolution_rate "
                    "FROM drift_summary_view ORDER BY pattern;"
                )
            else:
                rows = await conn.fetch(
                    "SELECT pattern, pattern_label, total_count, max_severity, resolution_rate "
                    "FROM drift_summary_view WHERE repo_full_name = $1 ORDER BY pattern;",
                    repo,
                )
        except asyncpg.UndefinedTableError:
            return []
        return [
            DriftSummary(
                pattern=r["pattern"],
                pattern_label=r["pattern_label"],
                count=int(r["total_count"]),
                severity=_severity_clamp(r["max_severity"]),
                resolution_rate=float(r["resolution_rate"] or 0.0),
            )
            for r in rows
        ]

    async def _fetch_proposals(
        self, conn: asyncpg.Connection, repo: str
    ) -> list[RefactorProposal]:
        if repo == "all":
            rows = await conn.fetch(
                "SELECT proposal_id, title, stage, created_at, openspec_change_path "
                "FROM proposals ORDER BY created_at DESC LIMIT 25;"
            )
        else:
            rows = await conn.fetch(
                "SELECT proposal_id, title, stage, created_at, openspec_change_path "
                "FROM proposals WHERE repo_full_name = $1 "
                "ORDER BY created_at DESC LIMIT 25;",
                repo,
            )
        return [
            RefactorProposal(
                id=r["proposal_id"],
                title=r["title"],
                stage=r["stage"],
                author_resident="Athena",
                created_at=r["created_at"].isoformat(),
                openspec_change_path=r["openspec_change_path"],
            )
            for r in rows
        ]

    async def _fetch_repos(self, conn: asyncpg.Connection) -> list[RepoStatus]:
        try:
            rows = await conn.fetch(
                "SELECT repo_full_name, label, open_prs, open_issues "
                "FROM repo_status_view ORDER BY repo_full_name;"
            )
        except asyncpg.UndefinedTableError:
            return []
        return [
            RepoStatus(
                full_name=r["repo_full_name"],
                label=r["label"].split("/")[-1] if "/" in r["label"] else r["label"],
                open_prs=int(r["open_prs"] or 0),
                open_issues=int(r["open_issues"] or 0),
                status_dot=_status_dot(int(r["open_prs"] or 0), int(r["open_issues"] or 0)),
                sparkline=[],
            )
            for r in rows
        ]

    async def _fetch_contributors(
        self, conn: asyncpg.Connection, repo: str, since: datetime
    ) -> list[ContributorStats]:
        if repo == "all":
            rows = await conn.fetch(
                """
                SELECT
                    author_login,
                    COUNT(*) FILTER (WHERE event_type = 'pr.opened') AS prs_opened,
                    COUNT(*) FILTER (WHERE event_type = 'pr.merged') AS prs_merged,
                    COALESCE(SUM(lines_added), 0) AS lines_added,
                    COALESCE(SUM(lines_deleted), 0) AS lines_deleted,
                    COUNT(*) FILTER (WHERE event_type = 'issue.opened') AS issues_opened,
                    COUNT(*) FILTER (WHERE event_type = 'issue.closed') AS issues_closed
                FROM pr_events
                WHERE received_at > $1 AND author_login IS NOT NULL
                GROUP BY author_login
                ORDER BY prs_merged DESC NULLS LAST LIMIT 20;
                """,
                since,
            )
        else:
            rows = await conn.fetch(
                """
                SELECT
                    author_login,
                    COUNT(*) FILTER (WHERE event_type = 'pr.opened') AS prs_opened,
                    COUNT(*) FILTER (WHERE event_type = 'pr.merged') AS prs_merged,
                    COALESCE(SUM(lines_added), 0) AS lines_added,
                    COALESCE(SUM(lines_deleted), 0) AS lines_deleted,
                    COUNT(*) FILTER (WHERE event_type = 'issue.opened') AS issues_opened,
                    COUNT(*) FILTER (WHERE event_type = 'issue.closed') AS issues_closed
                FROM pr_events
                WHERE repo_full_name = $1 AND received_at > $2 AND author_login IS NOT NULL
                GROUP BY author_login
                ORDER BY prs_merged DESC NULLS LAST LIMIT 20;
                """,
                repo,
                since,
            )
        return [
            ContributorStats(
                github_login=r["author_login"],
                prs_opened=int(r["prs_opened"] or 0),
                prs_merged=int(r["prs_merged"] or 0),
                lines_added=int(r["lines_added"] or 0),
                lines_deleted=int(r["lines_deleted"] or 0),
                issues_opened=int(r["issues_opened"] or 0),
                issues_closed=int(r["issues_closed"] or 0),
            )
            for r in rows
        ]

    async def _fetch_kpis(
        self, conn: asyncpg.Connection, repo: str, since: datetime
    ) -> list[KPIMetric]:
        if repo == "all":
            row = await conn.fetchrow(
                """
                SELECT
                    COALESCE(SUM(story_points), 0) AS points,
                    COUNT(*) FILTER (WHERE event_type = 'pr.merged') AS deploys
                FROM pr_events WHERE received_at > $1;
                """,
                since,
            )
        else:
            row = await conn.fetchrow(
                """
                SELECT
                    COALESCE(SUM(story_points), 0) AS points,
                    COUNT(*) FILTER (WHERE event_type = 'pr.merged') AS deploys
                FROM pr_events WHERE repo_full_name = $1 AND received_at > $2;
                """,
                repo,
                since,
            )
        points = float(row["points"] or 0) if row else 0.0
        deploys = int(row["deploys"] or 0) if row else 0
        return [
            KPIMetric(id="velocity", label="Velocity", value=points, unit="points"),
            KPIMetric(id="deploys-this-week", label="Deploys", value=float(deploys), unit="count"),
        ]


def _range_since(range: str) -> datetime:
    now = datetime.now(timezone.utc)
    if range == "today":
        return now - timedelta(days=1)
    if range == "sprint":
        return now - timedelta(days=14)
    return now - timedelta(days=90)


def _severity_clamp(v: Any) -> str:
    if v in ("critical", "high", "medium", "low", "info"):
        return v
    return "info"


def _status_dot(open_prs: int, open_issues: int) -> str:
    if open_prs > 20 or open_issues > 50:
        return "red"
    if open_prs > 5 or open_issues > 10:
        return "yellow"
    if open_prs == 0 and open_issues == 0:
        return "gray"
    return "green"


def _briefing_template(
    sprint: str, drifts: list[DriftSummary], proposals: list[RefactorProposal]
) -> str:
    drift_count = sum(d.count for d in drifts)
    proposal_count = len(proposals)
    if drift_count == 0 and proposal_count == 0:
        return "Quiet sprint. No drift detected, no refactor proposals pending."
    return (
        f"Sprint {sprint} active. {drift_count} drift event tracked, "
        f"{proposal_count} refactor proposal queued."
    )


__all__ = [
    "DashboardQueryService",
    "DashboardData",
    "KPIMetric",
    "VelocityPoint",
    "BurndownPoint",
    "MilestoneProgress",
    "ContributorStats",
    "DriftSummary",
    "RefactorProposal",
    "RepoStatus",
]
