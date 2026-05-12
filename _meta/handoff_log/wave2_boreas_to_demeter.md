# Handoff: Boreas (Wave 2) to Demeter (Wave 3)

**Date**: 2026-05-12 ~23:55 WIB Day 1
**Producer**: Boreas (Wave 2, Activity timeline scrubber + hotspot intensity + ownership heatmap)
**Consumer**: Demeter (Wave 3, PostgreSQL event store + materialized view query layer)
**Contract reference**: `_meta/contracts/boreas-to-demeter.md` + feedback `_meta/contracts/demeter-to-boreas.md` (both locked Wave 0 Pythia).

## What Boreas delivers

### Activity data shape (canonical Wave 2 frontend representation)

Boreas authored the canonical ActivityQuery + ActivityData + supporting types at:

```typescript
import type {
  ActivityQuery,
  ActivityData,
  CommitActivity,
  HotspotIntensity,
  OwnershipDistribution,
  OwnershipContributor,
  ActivitySummary,
  TimelineMarker,
  TimelineState,
} from '@/modes/activity';
```

Match against Pythia contract `_meta/contracts/boreas-to-demeter.md` Section "Output schema" lines 22-90:

- `ActivityQuery`: `days: 30 | 60 | 90`, `repo: string | 'all'`, optional `district`.
- `CommitActivity`: per-day ISO date + `buildingCommits: Record<buildingId, count>`.
- `HotspotIntensity`: per-building `intensity: number (0..1)` + `commitCount` + `lastCommitAt`.
- `OwnershipDistribution`: per-building `primaryOwnerLogin` + `primaryOwnerSharePercent` + `contributors[]`.
- `ActivitySummary`: `totalCommits`, `uniqueContributors`, `mostActiveBuilding`, `mostActiveOwner`.
- `ActivityData`: bundles all 4 above + `timelineMarkers[]` (Boreas extension) + `rangeDays` echo for state coherence.

**Schema extension over Pythia**: `ActivityData.timelineMarkers` + `ActivityData.rangeDays` are Boreas-added fields. Demeter Wave 3 should include them in the `/api/activity` response since the scrubber UI consumes both. The Pythia contract's `CommitActivity` covers daily counts but did not expose discrete event markers; Boreas adds the marker array directly so the rail UI does not need a second endpoint.

### Activity query interface

Per Pythia contract Section "Output schema" line 84-90, Boreas's frontend hook calls a single `/api/activity?days=X&repo=Y&district=Z` endpoint. Wave 2 stub at `frontend/src/modes/activity/useActivityData.ts` `fetchActivityData(query)` returns mock data deterministically. Wave 3 Demeter swap replaces the function body to call the real endpoint.

```typescript
// Wave 3 Demeter-aligned swap (pseudo)
export async function fetchActivityData(
  query: ActivityQuery
): Promise<ActivityData> {
  const params = new URLSearchParams();
  params.set('days', String(query.days));
  params.set('repo', query.repo);
  if (query.district) params.set('district', query.district);
  const response = await fetch(`/api/activity?${params.toString()}`, {
    credentials: 'include',
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthenticated');
    if (response.status === 503) throw new Error('Cache cold start');
    throw new Error(`Activity fetch failed: ${response.status}`);
  }
  return await response.json();
}
```

### Wave 2 mock dataset (deterministic)

Boreas authored `frontend/src/modes/activity/mockActivityData.ts` generating ActivityData from Iris `mockCityData` deterministically:

- **Commit count**: `Math.round(building.activity * days)` per building.
- **Per-day distribution**: pseudo-random bursty distribution via djb2 hash of `(buildingId, dayIndex)`.
- **Hotspot intensity**: normalized in window (max commit count = 1.0).
- **Ownership**: hash-derived primary owner from mock pool of 6 (`@backend-team`, `@frontend-team`, `@platform`, `@security`, `@data`, `@hafiz`). 70-90% primary share + 1-2 secondary contributors.
- **Timeline markers**: 2-4 marker per top 10 most active building. Event types weighted commit (60%) / pr_merged (30%) / release (10%).
- **Anchored "now"**: `Date.UTC(2026, 4, 12, 12, 0, 0)` = 2026-05-12T12:00:00Z (hackathon day 1 noon UTC). Used to prevent SSR hydration mismatch (decision: do NOT use `Date.now()` at module load). Wave 3 swap with real Demeter sources nowMs from server response.

Result for 30-day window with mock data: ~3816 total commits, 6 unique contributors, ~25 timeline markers.

### Activity Mode UI state Zustand store

Boreas chose Zustand over React Context per decision log D5 (perf: prevents re-render storm during scrubber drag at 60fps).

```typescript
import {
  useActivityStore,
  selectRangeDays,
  selectScrubberPosition,
  selectOwnershipHeatmapActive,
} from '@/modes/activity';
```

The store carries `TimelineState { rangeDays, scrubberPosition, ownershipHeatmapActive }` plus setter actions. Wave 3 Demeter consumes `rangeDays` via the store + drives `useActivityData()` hook which calls `fetchActivityData({ days: rangeDays, repo: 'all' })`.

## What Demeter Wave 3 must implement

### Backend endpoint per Pythia contract

```python
# backend/app/api/activity.py (Demeter authors Wave 3)
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from typing import Literal

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

class TimelineMarker(BaseModel):
    id: str
    timestamp: int  # unix ms
    event_type: Literal['commit', 'pr_merged', 'release']
    building_id: str
    title: str
    author_login: str | None = None

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
    timeline_markers: list[TimelineMarker]
    range_days: Literal[30, 60, 90]

@router.get("/api/activity", response_model=ActivityData)
async def get_activity(
    days: Literal[30, 60, 90] = Query(...),
    repo: str = Query('all'),
    district: str | None = Query(None),
    session: dict = Depends(require_session),
):
    ...
```

Pydantic alias generator bridges `snake_case` <-> `camelCase` per `selene-to-demeter.md` precedent.

### Materialized views per Pythia feedback contract

Per `_meta/contracts/demeter-to-boreas.md` line 95-154, Demeter ships 2 materialized views:

1. `commit_frequency_per_building` (refreshed hourly OR on pr_event insert via FastAPI BackgroundTasks): daily commit count + last commit timestamp per building.
2. `ownership_distribution` (refreshed nightly): 6-month blame proxy with `primary_owner_login` + `primary_owner_share_percent` + `contributors` JSONB.

For `timelineMarkers`, Demeter sources directly from `pr_events` filtered by `received_at > NOW() - INTERVAL '$days days'`, joining `pr_events.event_type`, `pr_events.building_id`, `pr_events.title`, `pr_events.author_login`.

### Performance + freshness

Per Pythia contract feedback Section "Asumption baked":
- Cached query < 300ms response.
- Cold fetch < 1.2s.
- Timeline data ordered ascending by date.
- Hotspot intensity normalized within window (max = 1.0).

## Asumption baked (Boreas to Demeter)

1. **Pythia schema canonical**: Boreas's types match Pythia verbatim. Demeter Pydantic models snake_case alias to camelCase via alias generator.
2. **Building id stability**: same id between Iris BuildingData + Demeter pr_events.building_id. Hades Wave 3 tree-sitter parser ensures this (per Iris handoff OQ-Iris-B).
3. **Anchored "now"**: Wave 3 Demeter responses use real server timestamp; Boreas frontend stops anchoring to constant once real data flows (React state carries timestamps through, hydration safe). Boreas's Wave 3 swap drops `ACTIVITY_ANCHORED_NOW_MS` usage in TimelineScrubber + TimelineMarkers + replaces with `nowMs` derived from `data.timeline[data.timeline.length - 1].date` (latest day in response).
4. **Hotspot threshold**: Boreas's HotspotGlow renders only intensity > 0.05 + cap at top 80 hotspots (perf bound). Demeter response may include all hotspots; frontend filters client-side.
5. **Ownership decal granularity**: Boreas decided per-district floor decal (D8) rather than per-building tint. The `OwnershipDistribution.primaryOwnerLogin` is consumed for district-level color derivation via `deriveOwnerColor` (Iris helper).
6. **Empty state**: per `demeter-to-boreas.md` edge case, empty timeline returns empty arrays. Boreas UI renders "no markers + 0 commits + 0 contributors" gracefully (current mock with 30 days always populated; tested empty path manually).

## Validation steps for Demeter consumer

1. Read `frontend/src/modes/activity/types.ts` to confirm types align with Pydantic.
2. Read `frontend/src/modes/activity/mockActivityData.ts` to inspect Wave 2 dataset shape + counts for parity reference.
3. Implement `/api/activity` endpoint matching the response_model.
4. Smoke test: `curl http://localhost:8000/api/activity?days=30&repo=all` returns valid ActivityData JSON within < 1.2s.
5. Swap `fetchActivityData` body in `useActivityData.ts` to call real endpoint + verify `/boreas-smoke?mode=activity` displays real timeline + hotspots + ownership decals.

## Edge case handling (Boreas owns frontend-side fallback)

- Empty pr_events: timeline empty arrays. Boreas displays "No markers" placeholder above scrubber rail (current implementation gracefully handles by rendering no marker dots).
- Repo not accessible (403): Wave 3 swap returns 403; Boreas frontend should surface empty state with "Repo unavailable" notice (deferred Pan polish).
- Building id not in materialized view: Demeter returns 0 intensity per `demeter-to-boreas.md` edge case. Boreas's HotspotGlow filters intensity > 0.05 so cold buildings are invisible (correct behavior).
- Materialized view refresh in progress: Demeter accepts concurrent refresh as no-op per Pythia contract. Boreas frontend retries via the next user interaction.

## Open questions (deferred)

- **Cache TTL**: Pythia contract suggests 30s shared cache. Boreas debounces scrubber drag at 100ms (frontend) + Demeter cache prevents request flood; no additional frontend debounce needed.
- **Real-time updates**: Wave 3 may want WebSocket push when new pr_event lands. Pythia contract leaves out of scope; Wave 2 polling on range toggle is sufficient for demo.
- **Per-language activity breakdown**: per `demeter-to-boreas.md` open question, not in PRD scope. Defer.

## Reference

- Pythia contract: `_meta/contracts/boreas-to-demeter.md` (request)
- Pythia feedback contract: `_meta/contracts/demeter-to-boreas.md` (response semantics)
- Boreas decision log: `_meta/decision_log/boreas.md` D5 + D7 + D8 + D9
- Boreas uncertainty journal: `_meta/uncertainty/boreas-cycle1-20260512-2350.md` U3 + U6
- PRD Section 9.4 (Activity Mode hotspot + ownership heatmap)
- PRD Section 18.7 (event store schema)

## Boreas ship status

- Activity Mode 7 component authored: TimelineScrubber + HotspotGlow + OwnershipHeatmap + TimelineMarkers + ActivityMode + types + useActivityData. Plus mockActivityData + store + queries + index = 11 activity source files.
- Zustand store ships at `frontend/src/modes/activity/store.ts` with 3 selectors + 4 actions.
- Smoke test at `/boreas-smoke?mode=activity` verified clean console + scrubber 30/60/90 toggle + ownership heatmap toggle + 25 timeline markers + 80-cap hotspots.
- TypeScript clean on Boreas-owned files.
- Demeter Wave 3 unblocked.
