"""Activity query service (Demeter Wave 3).

Implements ActivityData fetch per `_meta/contracts/boreas-to-demeter.md` +
`demeter-to-boreas.md`. Aggregates from pr_events +
`commit_frequency_per_building` + `ownership_distribution` materialized views.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Literal

import asyncpg
from pydantic import BaseModel, Field

logger = logging.getLogger("demeter.activity")


# ---------- Pydantic response models ----------


class CommitActivity(BaseModel):
    date: str
    building_commits: dict[str, int] = Field(default_factory=dict)


class Contributor(BaseModel):
    github_login: str
    avatar_url: str = ""
    share_percent: float


class OwnershipDistributionItem(BaseModel):
    building_id: str
    primary_owner_login: str
    primary_owner_avatar: str = ""
    primary_owner_share_percent: float
    contributors: list[Contributor] = Field(default_factory=list)


class HotspotIntensity(BaseModel):
    building_id: str
    intensity: float
    commit_count: int
    last_commit_at: str


class ActivitySummary(BaseModel):
    total_commits: int
    unique_contributors: int
    most_active_building: str
    most_active_owner: str


class ActivityData(BaseModel):
    timeline: list[CommitActivity]
    hotspots: list[HotspotIntensity]
    ownership: list[OwnershipDistributionItem]
    summary: ActivitySummary


# ---------- Query service ----------


class ActivityQueryService:
    """Serves /api/activity from Postgres materialized views."""

    def __init__(self, pool: asyncpg.Pool) -> None:
        self._pool = pool

    async def fetch_activity(
        self,
        days: int,
        repo: str,
        district: str | None,
        user: str | int,
    ) -> ActivityData:
        """Fetch ActivityData for the given window.

        Wave-Fixing #2 cycle 1: `days` typed as plain `int` (caller snaps to
        30/60/90 at API edge). Avoid Pydantic strict-literal 422 on str query
        input.
        """
        since = datetime.now(timezone.utc) - timedelta(days=days)
        async with self._pool.acquire() as conn:
            timeline = await self._fetch_timeline(conn, repo, since)
            hotspots = await self._fetch_hotspots(conn, repo, since)
            ownership = await self._fetch_ownership(conn, repo)
            summary = await self._fetch_summary(conn, repo, since)
            return ActivityData(
                timeline=timeline,
                hotspots=hotspots,
                ownership=ownership,
                summary=summary,
            )

    async def _fetch_timeline(
        self, conn: asyncpg.Connection, repo: str, since: datetime
    ) -> list[CommitActivity]:
        try:
            if repo == "all":
                rows = await conn.fetch(
                    """
                    SELECT date,
                           JSONB_OBJECT_AGG(building_id, commit_count) AS building_commits
                    FROM commit_frequency_per_building
                    WHERE date >= $1
                    GROUP BY date
                    ORDER BY date;
                    """,
                    since,
                )
            else:
                rows = await conn.fetch(
                    """
                    SELECT date,
                           JSONB_OBJECT_AGG(building_id, commit_count) AS building_commits
                    FROM commit_frequency_per_building
                    WHERE repo_full_name = $1 AND date >= $2
                    GROUP BY date
                    ORDER BY date;
                    """,
                    repo,
                    since,
                )
        except asyncpg.UndefinedTableError:
            return []
        result = []
        for r in rows:
            bc = r["building_commits"]
            if isinstance(bc, str):
                import json

                bc = json.loads(bc)
            result.append(
                CommitActivity(
                    date=r["date"].isoformat(),
                    building_commits={k: int(v) for k, v in (bc or {}).items()},
                )
            )
        return result

    async def _fetch_hotspots(
        self, conn: asyncpg.Connection, repo: str, since: datetime
    ) -> list[HotspotIntensity]:
        try:
            if repo == "all":
                rows = await conn.fetch(
                    """
                    SELECT building_id,
                           SUM(commit_count)::INTEGER AS total_commits,
                           MAX(last_commit_at) AS last_commit_at
                    FROM commit_frequency_per_building
                    WHERE date >= $1
                    GROUP BY building_id
                    ORDER BY total_commits DESC NULLS LAST LIMIT 200;
                    """,
                    since,
                )
            else:
                rows = await conn.fetch(
                    """
                    SELECT building_id,
                           SUM(commit_count)::INTEGER AS total_commits,
                           MAX(last_commit_at) AS last_commit_at
                    FROM commit_frequency_per_building
                    WHERE repo_full_name = $1 AND date >= $2
                    GROUP BY building_id
                    ORDER BY total_commits DESC NULLS LAST LIMIT 200;
                    """,
                    repo,
                    since,
                )
        except asyncpg.UndefinedTableError:
            return []
        max_count = max((int(r["total_commits"] or 0) for r in rows), default=1) or 1
        return [
            HotspotIntensity(
                building_id=r["building_id"],
                intensity=float(int(r["total_commits"] or 0) / max_count),
                commit_count=int(r["total_commits"] or 0),
                last_commit_at=(r["last_commit_at"] or datetime.now(timezone.utc)).isoformat(),
            )
            for r in rows
        ]

    async def _fetch_ownership(
        self, conn: asyncpg.Connection, repo: str
    ) -> list[OwnershipDistributionItem]:
        try:
            if repo == "all":
                rows = await conn.fetch(
                    "SELECT building_id, primary_owner_login, primary_owner_share_percent, "
                    "contributors FROM ownership_distribution LIMIT 200;"
                )
            else:
                rows = await conn.fetch(
                    "SELECT building_id, primary_owner_login, primary_owner_share_percent, "
                    "contributors FROM ownership_distribution "
                    "WHERE repo_full_name = $1 LIMIT 200;",
                    repo,
                )
        except asyncpg.UndefinedTableError:
            return []
        result = []
        for r in rows:
            contribs_raw = r["contributors"] or []
            if isinstance(contribs_raw, str):
                import json

                contribs_raw = json.loads(contribs_raw)
            contributors = [
                Contributor(
                    github_login=c.get("github_login", "unknown"),
                    share_percent=float(c.get("share_percent", 0.0)),
                )
                for c in (contribs_raw or [])
            ]
            result.append(
                OwnershipDistributionItem(
                    building_id=r["building_id"],
                    primary_owner_login=r["primary_owner_login"] or "unknown",
                    primary_owner_share_percent=float(
                        r["primary_owner_share_percent"] or 0.0
                    ),
                    contributors=contributors,
                )
            )
        return result

    async def _fetch_summary(
        self, conn: asyncpg.Connection, repo: str, since: datetime
    ) -> ActivitySummary:
        if repo == "all":
            row = await conn.fetchrow(
                """
                SELECT
                    COUNT(*) FILTER (WHERE event_type = 'pr.merged') AS total_commits,
                    COUNT(DISTINCT author_login) AS unique_contributors
                FROM pr_events WHERE received_at >= $1;
                """,
                since,
            )
        else:
            row = await conn.fetchrow(
                """
                SELECT
                    COUNT(*) FILTER (WHERE event_type = 'pr.merged') AS total_commits,
                    COUNT(DISTINCT author_login) AS unique_contributors
                FROM pr_events
                WHERE repo_full_name = $1 AND received_at >= $2;
                """,
                repo,
                since,
            )
        return ActivitySummary(
            total_commits=int(row["total_commits"] or 0) if row else 0,
            unique_contributors=int(row["unique_contributors"] or 0) if row else 0,
            most_active_building="",
            most_active_owner="",
        )


__all__ = [
    "ActivityQueryService",
    "ActivityData",
    "CommitActivity",
    "Contributor",
    "OwnershipDistributionItem",
    "HotspotIntensity",
    "ActivitySummary",
]
