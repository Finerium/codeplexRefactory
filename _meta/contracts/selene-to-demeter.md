# Contract: Selene to Demeter

**Edge type**: cross-wave (Wave 1 to Wave 3)
**Wave**: Wave 1 producer to Wave 3 consumer
**Status**: locked
**Authored**: 2026-05-12 15:22 WIB

## Producer

**Worker**: Selene (Wave 1)
**Domain**: Dashboard at `frontend/app/dashboard/page.tsx`. Selene defines the data query shape (filter params, response schema) that Wave 3 Demeter implements as Postgres event store query layer. Wave 1 Selene ships mock JSON; Wave 3 Demeter swaps with real query layer matching the same contract.

## Consumer

**Worker**: Demeter (Wave 3)
**Domain**: PostgreSQL event store schema + cache layer + 1-click GitHub issue creation + ticket state aggregation + cost tracking + OpenSpec runtime integration. Demeter authors HTTP endpoints serving Selene's dashboard data queries from Postgres event tables (pr_events, simulation_events, finding_events, llm_call_log, drift_log) + materialized views (cycle_time_aggregate, lead_time_aggregate, ownership_distribution).

## Output schema (producer to consumer)

Selene defines the consumer query interface; Demeter implements as FastAPI endpoint.

```typescript
// frontend/src/lib/dashboard/queries.ts (Selene authors)

export interface DashboardQuery {
  /** Time range filter. */
  range: 'today' | 'sprint' | 'quarter';
  /** Repo filter; "all" aggregates cross-repo, full name for single repo. */
  repo: string | 'all';
  /** Sprint identifier override; default current sprint if omitted. */
  sprint?: string;
}

/** Endpoint: GET /api/dashboard
 *
 * Query params: range, repo, sprint (optional)
 * Response: 200 OK with DashboardData JSON
 * Errors: 401 unauthenticated, 500 server error, 503 cache cold start
 */
```

Demeter implements with Pydantic models matching Selene's TypeScript types:

```python
# backend/app/api/dashboard.py (Demeter Wave 3)
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from typing import Literal
from datetime import datetime
from app.auth import require_session
from app.services.dashboard_query import DashboardQueryService

router = APIRouter(prefix="/api/dashboard")


class KPIMetric(BaseModel):
    id: Literal["velocity", "cycle-time", "change-failure-rate", "deploys-this-week"]
    label: str
    value: float
    unit: Literal["points", "days", "percent", "count"]
    delta_percent: float


class VelocityPoint(BaseModel):
    sprint_label: str
    points_completed: int
    end_date: str  # ISO 8601


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
    avatar_url: str
    prs_opened: int
    prs_merged: int
    lines_added: int
    lines_deleted: int
    issues_opened: int
    issues_closed: int


class DriftSummary(BaseModel):
    pattern: Literal["A", "B", "C", "D", "E"]
    pattern_label: str
    count: int
    severity: Literal["critical", "high", "medium", "low", "info"]
    resolution_rate: float


class RefactorProposal(BaseModel):
    id: str
    title: str
    stage: Literal["proposed", "simulating", "drafted", "accepted", "archived"]
    author_resident: Literal["Athena", "user"]
    created_at: str
    openspec_change_path: str


class RepoStatus(BaseModel):
    full_name: str
    label: str
    open_prs: int
    open_issues: int
    status_dot: Literal["green", "yellow", "red", "gray"]
    sparkline: list[int]


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


@router.get("", response_model=DashboardData)
async def get_dashboard(
    range: Literal["today", "sprint", "quarter"] = Query(...),
    repo: str = Query("all"),
    sprint: str | None = Query(None),
    session: dict = Depends(require_session),
    service: DashboardQueryService = Depends(),
) -> DashboardData:
    """Returns dashboard data aggregating event store queries.

    Caching: 30-second TTL cache keyed by (range, repo, sprint, user).
    Fresh data via Postgres materialized views refreshed on webhook event ingest.
    """
    return await service.fetch_dashboard(range=range, repo=repo, sprint=sprint, user=session["user_id"])
```

JSON serialization note: Pydantic `field_alias` converts snake_case Python field names to camelCase JSON output to match TypeScript expectation.

```python
class Config:
    populate_by_name = True
    alias_generator = lambda s: ''.join([s.split('_')[0]] + [w.capitalize() for w in s.split('_')[1:]])
```

## Storage location

- Frontend query interface: `frontend/src/lib/dashboard/queries.ts` (Selene)
- Backend endpoint: `backend/app/api/dashboard.py` (Demeter Wave 3)
- Service layer: `backend/app/services/dashboard_query.py` (Demeter Wave 3)
- Postgres source tables: `pr_events`, `simulation_events`, `finding_events`, `llm_call_log`, `drift_log` (Demeter authors schema per PRD Section 18.7)
- Materialized views: `cycle_time_aggregate`, `lead_time_aggregate`, `ownership_distribution` (Demeter authors)

## Asumption baked

1. JSON serialization snake_case to camelCase consistency via Pydantic alias generator. If Selene observes mismatch, document at handoff time.
2. 30-second TTL cache layer reasonable for dashboard freshness; PR webhook events trigger materialized view refresh (Demeter authors refresh trigger).
3. Auth dependency `require_session` is shared with Hades OAuth implementation; session JWT verified per request.
4. Cross-repo aggregation (`repo=all`) joins across all repos user has access to (Demeter authors authorization check based on session user_id + GitHub repo access scope).
5. Sparkline data (last 14 days commit count) computed from `pr_events` GROUP BY day; materialized view caches the result.

## Validation steps

**Producer responsibility (Selene)**:
- `queries.ts` exports query interface matching backend endpoint signature.
- `useDashboardData` hook fetches with correct query params on initial mount + on filter change.
- TypeScript types mirror Pydantic schema (validated via `pnpm tsc --noEmit`).
- Wave 1 mock data shape passes Pydantic validation (manual check: load mock JSON, verify all fields present).

**Consumer responsibility (Demeter)**:
- Implement endpoint at `/api/dashboard` matching contract signature exactly.
- All Pydantic models match Selene's TypeScript types field-by-field (camelCase JSON output).
- Cache layer TTL 30 seconds, key-namespaced per user + filter combination.
- Smoke test: Selene's `useDashboardData` hook fetches successfully Wave 3 swap, displays real data on dashboard route.
- Authorization: deny request if session user lacks access to requested repo (HTTP 403).

## Edge case handling

- Empty event store (fresh install, no PRs ingested): Demeter returns DashboardData with empty arrays + briefing fallback "No activity yet. Connect a repository to begin."
- Materialized view refresh stale: Demeter accepts stale data up to 5 minutes; fresh refresh triggered async on next event ingest.
- Repo not accessible to user (GitHub access revoked): Demeter excludes repo from `repo=all` aggregation; single repo query returns 403.
- Sprint identifier invalid (not found in milestones table): Demeter returns 404 with error body.
- Database connection failure: Demeter returns 503 with retry-after header; Selene displays cached data + "Connection issue, retrying..." overlay.

## Open questions

- Sprint identifier source: GitHub Milestones API or internal sprint table? PRD Section 9.2 references Milestones for Sprint Mode HERO. Demeter Wave 3 ingests via webhook + sync; sprint identifier = milestone number string.
- Burndown ideal calculation: linear from sprint start total points; Demeter computes on the fly. If sprint already ended, return final state.

## Reference

- Metis Agentic Structure md Section 2 DAG: Selene dashboard data query shape consumed by Wave 3 Demeter event-store
- Metis Section 5.2 Selene + Section 5.6 Demeter ship criteria
- PRD Section 9.2 (Sprint Mode HERO) + Section 9.4 (Activity Mode) + Section 9.5 (Health Mode)
- PRD Section 11 (spec-drift patterns A-E definitions)
- PRD Section 18.7 (event store schema)
- Pythia decision log + sourceoftruth Section 11.3
