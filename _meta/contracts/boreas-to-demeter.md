# Contract: Boreas to Demeter

**Edge type**: cross-wave (Wave 2 to Wave 3)
**Wave**: Wave 2 producer to Wave 3 consumer
**Status**: locked
**Authored**: 2026-05-12 15:40 WIB

## Producer

**Worker**: Boreas (Wave 2)
**Domain**: Activity Mode: timeline scrubber 30/60/90 day toggle + drag scrubber, hotspot intensity glow encoding (mock commit frequency Wave 2), ownership heatmap toggle. Boreas defines the query interface for activity event data that Wave 3 Demeter implements as event-store query layer + materialized view aggregation.

## Consumer

**Worker**: Demeter (Wave 3)
**Domain**: PostgreSQL event store schema + cache + 1-click GitHub issue + ticket state aggregation + cost tracking + OpenSpec runtime. Demeter authors HTTP endpoints serving Boreas's activity timeline queries from `pr_events` + materialized views (ownership_distribution, commit_frequency_per_building).

## Output schema (producer to consumer)

Boreas defines query interface; Demeter implements.

```typescript
// frontend/src/modes/activity/queries.ts (Boreas authors)

export interface ActivityQuery {
  /** Time range in days from now. */
  days: 30 | 60 | 90;
  /** Optional repo filter; "all" aggregates. */
  repo: string | 'all';
  /** Optional district filter. */
  district?: string;
}

export interface CommitActivity {
  /** Date ISO 8601 (day granularity). */
  date: string;
  /** Per-building commit count this day. */
  buildingCommits: Record<string, number>;
}

export interface OwnershipDistribution {
  /** Building id. */
  buildingId: string;
  /** Top owner login. */
  primaryOwnerLogin: string;
  /** Top owner avatar URL. */
  primaryOwnerAvatar: string;
  /** Ownership share percentage 0..100. */
  primaryOwnerSharePercent: number;
  /** All contributors with share. */
  contributors: {
    githubLogin: string;
    avatarUrl: string;
    sharePercent: number;
  }[];
}

export interface HotspotIntensity {
  buildingId: string;
  /** Intensity 0..1 normalized within time window. */
  intensity: number;
  /** Commit count in window. */
  commitCount: number;
  /** Last commit timestamp ISO 8601. */
  lastCommitAt: string;
}

export interface ActivityData {
  /** Per-day activity series. */
  timeline: CommitActivity[];
  /** Building hotspot intensities aggregate. */
  hotspots: HotspotIntensity[];
  /** Ownership distribution per building. */
  ownership: OwnershipDistribution[];
  /** Window summary. */
  summary: {
    totalCommits: number;
    uniqueContributors: number;
    mostActiveBuilding: string;
    mostActiveOwner: string;
  };
}

/** Endpoint: GET /api/activity
 *
 * Query params: days (30 | 60 | 90), repo, district (optional)
 * Response: 200 OK with ActivityData JSON
 * Errors: 401 unauthenticated, 503 cache cold start
 */
```

Demeter implements:

```python
# backend/app/api/activity.py (Demeter Wave 3)
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from typing import Literal
from app.auth import require_session
from app.services.activity_query import ActivityQueryService

router = APIRouter(prefix="/api/activity")


class CommitActivity(BaseModel):
    date: str
    building_commits: dict[str, int]


class Contributor(BaseModel):
    github_login: str
    avatar_url: str
    share_percent: float


class OwnershipDistribution(BaseModel):
    building_id: str
    primary_owner_login: str
    primary_owner_avatar: str
    primary_owner_share_percent: float
    contributors: list[Contributor]


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
    ownership: list[OwnershipDistribution]
    summary: ActivitySummary


@router.get("", response_model=ActivityData)
async def get_activity(
    days: Literal[30, 60, 90] = Query(...),
    repo: str = Query("all"),
    district: str | None = Query(None),
    session: dict = Depends(require_session),
    service: ActivityQueryService = Depends(),
) -> ActivityData:
    return await service.fetch_activity(
        days=days, repo=repo, district=district, user=session["user_id"]
    )
```

## Storage location

- Frontend query interface: `frontend/src/modes/activity/queries.ts` (Boreas)
- Backend endpoint: `backend/app/api/activity.py` (Demeter Wave 3)
- Service layer: `backend/app/services/activity_query.py` (Demeter Wave 3)
- Postgres source: `pr_events` table (commit metadata ingested via webhook) + materialized view `ownership_distribution` (refreshed nightly + on webhook) + materialized view `commit_frequency_per_building` (refreshed hourly)
- Wave 2 mock: Boreas hardcodes 30-day mock dataset for demo; Wave 3 swap

## Asumption baked

1. JSON snake_case to camelCase consistent with `selene-to-demeter.md` (Pydantic alias generator).
2. Building id from Iris/Hera maps directly to file path or aggregated path; Demeter aggregates `pr_events.files_changed` per building.
3. Ownership distribution computed via blame proxy: top contributor by lines changed in last 6 months per building.
4. Hotspot intensity normalized to [0..1] within query window (max intensity = 1.0 = building with most commits).
5. Materialized views refresh frequency: ownership_distribution nightly is acceptable for hackathon demo (real-time not required for ownership lens); commit_frequency_per_building hourly handles demo activity timeline freshness.
6. Repo aggregation (`repo=all`) joins across all repos user has access to.

## Validation steps

**Producer responsibility (Boreas)**:
- Query interface in `queries.ts` matches backend endpoint signature.
- Timeline scrubber displays per-day intensity correctly per `CommitActivity.buildingCommits`.
- Hotspot glow intensity drives building visual emission via Iris instancedMesh attribute update.
- Ownership heatmap toggle re-colors buildings by `OwnershipDistribution.primaryOwnerLogin` distinct color palette.
- Smoke test: scrub timeline 30/60/90 days, hotspot intensities update, ownership heatmap re-colors.

**Consumer responsibility (Demeter)**:
- Implement endpoint matching contract.
- Materialized views refresh on schedule (Postgres pg_cron extension if available, else FastAPI background task).
- All Pydantic models match Boreas's TypeScript types field-by-field.
- Smoke test: Boreas's hook fetches successfully Wave 3, scrubber displays real data.

## Edge case handling

- Empty event store (no commits ingested): Demeter returns empty arrays + summary with zero counts. Boreas displays empty state placeholder "No activity yet."
- Repo not accessible: Demeter excludes from `repo=all` aggregation; single repo query 403.
- Building id not in materialized view (new file just added): Demeter falls back to 0 intensity; Boreas treats as cold building.
- Date range crosses repo creation date: Demeter clamps to repo creation date; summary annotated with effective range.

## Open questions

- 6-month ownership window: should we expose as parameter? Wave 3 lock at 6 months hardcoded; Pan Day 2 polish may expose if rehearsal feedback warrants.
- Cross-repo ownership aggregation: same person may own different buildings in different repos; ownership_distribution view scopes per repo, frontend stitches across repos (display per-repo lens).

## Reference

- Metis Agentic Structure md Section 2 DAG: Boreas Activity timeline state consumed by Wave 3 Demeter event-store query layer
- Metis Section 5.4 Boreas + Section 5.6 Demeter ship criteria
- PRD Section 9.4 (Activity Mode hotspot tracking + ownership heatmap)
- PRD Section 18.7 (event store schema)
- Contract `selene-to-demeter.md` (sibling pattern, dashboard data query)
