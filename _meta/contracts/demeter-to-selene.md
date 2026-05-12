# Contract: Demeter to Selene (Feedback)

**Edge type**: feedback (Wave 3 to Wave 1)
**Wave**: Wave 3 producer to Wave 1 consumer
**Status**: locked
**Authored**: 2026-05-12 16:23 WIB

## Producer

**Worker**: Demeter (Wave 3)
**Domain**: PostgreSQL event store query layer + materialized views + cache layer. Demeter implements the `/api/dashboard` endpoint that Selene's `useDashboardData` hook fetches (request schema defined in `selene-to-demeter.md`). This feedback contract documents Demeter's implementation perspective + materialized view refresh strategy + cache invalidation on event ingest.

## Consumer

**Worker**: Selene (Wave 1)
**Domain**: Dashboard at `frontend/app/dashboard/page.tsx` consuming `DashboardData` via `useDashboardData` hook. Selene's request schema + response types are canonical (defined in `selene-to-demeter.md`). This contract documents what Demeter promises about freshness, ordering, and edge cases when populating the response.

## Output schema (producer to consumer)

Response schema matches `selene-to-demeter.md` `DashboardData` Pydantic models. Demeter populates each field from materialized views + on-the-fly queries:

```python
# backend/app/services/dashboard_query.py (Demeter)
from app.services.demeter_service import get_demeter_service
import asyncpg
from typing import Literal


class DashboardQueryService:
    """Serves /api/dashboard endpoint by querying Postgres materialized views + tables."""

    async def fetch_dashboard(
        self,
        range: Literal["today", "sprint", "quarter"],
        repo: str,
        sprint: str | None,
        user: int,
    ) -> DashboardData:
        """Aggregates dashboard data from event store."""

        # 1. Briefing: generated from current sprint + drift + open finding counts
        briefing = await self._generate_briefing(repo, sprint, user)

        # 2. KPI metrics from materialized views
        kpis = await self._fetch_kpis(range, repo, user)

        # 3. Velocity from `velocity_per_sprint` materialized view (last 8 sprints)
        velocity = await self._fetch_velocity(repo, user, sprints_back=8)

        # 4. Burndown from `pr_events` for current sprint
        burndown = await self._fetch_burndown(sprint or self._current_sprint(repo), repo)

        # 5. Milestones from `pr_events` GROUP BY milestone_number
        milestones = await self._fetch_milestones(repo, user)

        # 6. Contributors from `pr_events` GROUP BY author_login + sprint window
        contributors = await self._fetch_contributors(range, repo, user)

        # 7. Drifts from `drift_summary_view` materialized view (refreshed on drift_log insert)
        drifts = await self._fetch_drift_summary(repo)

        # 8. Refactor proposals from `proposals` table
        refactor_proposals = await self._fetch_proposals(repo, user)

        # 9. Cross-repo rail from `repo_status_view` materialized view
        repos = await self._fetch_repos(user)

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
            current_sprint=sprint or self._current_sprint(repo),
            last_refresh=datetime.utcnow().isoformat(),
        )
```

Briefing generation (Clio-narrated, but inline-templated for hackathon scope):

```python
async def _generate_briefing(self, repo: str, sprint: str | None, user: int) -> str:
    """Generates one-sentence briefing.

    Wave 3 default = template fill from counts:
      f"Sprint {sprint_label} ships in {days_remaining} days. Velocity holding at {points} points. {drift_count} drift pattern triggered in the {district_name} district."

    Future: Clio LLM call for narration; out of Wave 3 scope unless time allows.
    """
    ...
```

Materialized views Demeter authors:

```sql
-- backend/migrations/versions/004_materialized_views.py (Demeter)

-- Velocity per sprint
CREATE MATERIALIZED VIEW velocity_per_sprint AS
SELECT
    repo_full_name,
    payload->>'milestone_title' AS sprint_label,
    SUM(story_points) AS points_completed,
    MAX(payload->>'milestone_due_on')::timestamptz AS end_date
FROM pr_events
WHERE event_type = 'issue.closed'
  AND payload->>'milestone_title' IS NOT NULL
  AND payload->>'milestone_state' = 'closed'
GROUP BY repo_full_name, payload->>'milestone_title';

CREATE INDEX velocity_per_sprint_repo_idx ON velocity_per_sprint(repo_full_name);

-- Cycle time aggregate (PR opened -> merged median)
CREATE MATERIALIZED VIEW cycle_time_aggregate AS
SELECT
    repo_full_name,
    DATE_TRUNC('day', received_at) AS day,
    percentile_cont(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (merged_at - opened_at)) / 86400.0) AS median_days
FROM (
    SELECT
        repo_full_name,
        resource_number,
        MIN(CASE WHEN event_type = 'pr.opened' THEN received_at END) AS opened_at,
        MAX(CASE WHEN event_type = 'pr.merged' THEN received_at END) AS merged_at
    FROM pr_events
    GROUP BY repo_full_name, resource_number
) AS pr_lifecycle
WHERE merged_at IS NOT NULL
GROUP BY repo_full_name, day;

-- Drift summary
CREATE MATERIALIZED VIEW drift_summary_view AS
SELECT
    repo_full_name,
    pattern,
    pattern_label,
    COUNT(*) FILTER (WHERE evidence->>'resolved' = 'false') AS open_count,
    COUNT(*) AS total_count,
    CASE
        WHEN COUNT(*) = 0 THEN 0
        ELSE COUNT(*) FILTER (WHERE evidence->>'resolved' = 'true')::float / COUNT(*)
    END AS resolution_rate,
    MAX(severity) AS max_severity
FROM drift_log
GROUP BY repo_full_name, pattern, pattern_label;

-- Repo status (cross-repo rail)
CREATE MATERIALIZED VIEW repo_status_view AS
SELECT
    repo_full_name,
    repo_full_name AS label,  -- TODO: shorten via split('/')[-1]
    COUNT(*) FILTER (WHERE event_type = 'pr.opened' AND received_at > NOW() - INTERVAL '7 days') AS open_prs,
    COUNT(*) FILTER (WHERE event_type = 'issue.opened' AND received_at > NOW() - INTERVAL '7 days') AS open_issues,
    array_agg(DATE_TRUNC('day', received_at) ORDER BY received_at) FILTER (WHERE received_at > NOW() - INTERVAL '14 days') AS sparkline_days
FROM pr_events
GROUP BY repo_full_name;

-- Refresh trigger schedule
-- Wave 3 default: refresh on event insert via background task (BackgroundTasks per OQ-01).
-- Production option: pg_cron extension if available.
```

Cache invalidation:

```python
# backend/app/services/cache.py (Demeter)
class DashboardCache:
    """30-second TTL cache for /api/dashboard responses keyed by (range, repo, sprint, user)."""

    async def get(self, key: tuple) -> DashboardData | None:
        ...

    async def set(self, key: tuple, value: DashboardData, ttl: int = 30) -> None:
        ...

    async def invalidate_repo(self, repo_full_name: str) -> None:
        """Invalidates all cached entries for a repo. Called when pr_events insert detected."""
        ...


# Hooked into pr_events insert via Demeter service:
async def persist_pr_event(self, event: PREventPersist) -> None:
    await self._db.execute(...)  # INSERT
    await self._cache.invalidate_repo(event.repo_full_name)
    await self._schedule_view_refresh(event.repo_full_name)
```

## Storage location

- Dashboard query service: `backend/app/services/dashboard_query.py` (Demeter)
- Materialized views migration: `backend/migrations/versions/004_materialized_views.py` (Demeter)
- Cache layer: `backend/app/services/cache.py` (Demeter; in-memory dict Wave 3; could swap to Redis later)
- View refresh scheduler: `backend/app/services/view_refresh.py` (Demeter; FastAPI BackgroundTasks per OQ-01 Metis recommendation)
- API endpoint: `backend/app/api/dashboard.py` (Demeter; defined in `selene-to-demeter.md`)

## Asumption baked

1. Materialized views refresh on event insert (eager) + scheduled hourly fallback (in case eager fails).
2. Cache TTL 30 seconds reasonable for dashboard demo freshness; user perceives realtime via slight delay.
3. Cross-repo aggregation (`repo='all'`): query joins user.id -> users table -> filter by authorized repos (based on GitHub OAuth scope read:repo).
4. Briefing template-filled Wave 3 default; Clio LLM narration deferred unless time allows.
5. Materialized view storage size acceptable for hackathon scope (max 10000 rows per view across 5 demo repos).

## Validation steps

**Producer responsibility (Demeter)**:
- All materialized views refreshed within 1 minute of pr_event insert.
- Dashboard endpoint response time < 200ms for cached, < 800ms for cold fetch.
- Cache invalidated correctly on writes; subsequent fetch returns fresh data.
- Briefing template generates coherent sentence even with empty data sets.

**Consumer responsibility (Selene)**:
- Defined in `selene-to-demeter.md`; consume per Pydantic schema.
- Loading state UI while fetch in flight.
- Auto-refetch on filter change (range, repo, sprint).
- Smoke test: dashboard route loads, all 7 panels populate, charts render correctly.

## Edge case handling

- Empty event store (fresh install): all panels show empty state placeholders. Briefing falls back to "Connect a repository to begin."
- Materialized view stale (refresh failed): Demeter serves stale data up to 5 minutes with `X-Cache-Status: stale` header; client may show subtle staleness indicator.
- Cache stampede on cold start: Demeter uses singleflight pattern (asyncio.Lock per key) to prevent duplicate fetches.
- Database connection failure: 503 with retry-after header; Selene displays cached + retry overlay.

## Open questions

- pg_cron availability: Refactory Postgres may or may not have pg_cron extension. Wave 3 default = FastAPI BackgroundTasks (no Postgres extension needed); pg_cron deferred to production hardening.
- Briefing LLM narration: Clio could narrate sprint progress dynamically. Wave 3 = template; Pan Day 2 may implement if rehearsal feedback demands more polish.

## Reference

- Metis Agentic Structure md Section 2 DAG: Demeter event-store queries consumed by Selene dashboard, feedback edge
- Metis Section 5.2 Selene + Section 5.6 Demeter ship criteria
- PRD Section 9.4 (Activity Mode aggregation patterns shared with dashboard)
- PRD Section 18.7 (event store schema)
- PRD Section 25 OQ-01 (BackgroundTasks vs Celery)
- Contract `selene-to-demeter.md` (request schema definition; reverse direction)
- Contract `nemesis-to-demeter.md` + `pandora-to-demeter.md` + `hades-to-demeter.md` (event ingest sources)
