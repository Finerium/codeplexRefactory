"""Ticket aggregation service (Demeter Wave 3).

Aggregates from pr_events for Sprint Mode HERO: Story Done count + In Progress
count + per-status counts. Used by Selene dashboard burndown panel + sprint
status visualizers.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any

import asyncpg
from pydantic import BaseModel

logger = logging.getLogger("demeter.ticket")


# Maps PR/issue event types to sprint status buckets. Heuristic per PRD
# Section 9.2 (Sprint Mode HERO).
_STATUS_BUCKETS = {
    "issue.opened": "todo",
    "pr.opened": "in_progress",
    "pr.review_requested": "in_review",
    "pr.approved": "in_review",
    "pr.merged": "done",
    "issue.closed": "done",
}


class TicketStatusSummary(BaseModel):
    todo: int = 0
    in_progress: int = 0
    in_review: int = 0
    done: int = 0
    blocked: int = 0


class SprintTicketAggregate(BaseModel):
    repo_full_name: str
    window_days: int
    status: TicketStatusSummary
    total_story_points_done: int
    total_story_points_open: int


class TicketAggregationService:
    """Aggregate ticket state from pr_events for Sprint Mode."""

    def __init__(self, pool: asyncpg.Pool) -> None:
        self._pool = pool

    async def aggregate_for_repo(
        self,
        repo_full_name: str,
        window_days: int = 14,
    ) -> SprintTicketAggregate:
        since = datetime.now(timezone.utc) - timedelta(days=window_days)
        async with self._pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT event_type,
                       COUNT(*) AS cnt,
                       COALESCE(SUM(story_points), 0) AS points
                FROM pr_events
                WHERE repo_full_name = $1 AND received_at >= $2
                GROUP BY event_type;
                """,
                repo_full_name,
                since,
            )
        status = TicketStatusSummary()
        points_done = 0
        points_open = 0
        for r in rows:
            bucket = _STATUS_BUCKETS.get(r["event_type"])
            cnt = int(r["cnt"] or 0)
            points = int(r["points"] or 0)
            if bucket == "todo":
                status.todo += cnt
                points_open += points
            elif bucket == "in_progress":
                status.in_progress += cnt
                points_open += points
            elif bucket == "in_review":
                status.in_review += cnt
            elif bucket == "done":
                status.done += cnt
                points_done += points

        return SprintTicketAggregate(
            repo_full_name=repo_full_name,
            window_days=window_days,
            status=status,
            total_story_points_done=points_done,
            total_story_points_open=points_open,
        )

    async def aggregate_all_repos(self, window_days: int = 14) -> list[SprintTicketAggregate]:
        async with self._pool.acquire() as conn:
            repos = await conn.fetch("SELECT DISTINCT repo_full_name FROM pr_events;")
        return [await self.aggregate_for_repo(r["repo_full_name"], window_days) for r in repos]


__all__ = [
    "TicketAggregationService",
    "TicketStatusSummary",
    "SprintTicketAggregate",
]
