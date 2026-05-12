# Handoff: Selene to Demeter (Wave 1 to Wave 3)

**Date**: 2026-05-12 21:15 WIB
**Producer**: Selene (Wave 1 dashboard executor)
**Consumer**: Demeter (Wave 3 PostgreSQL event-store + cache + dashboard query layer)
**Contract**: `_meta/contracts/selene-to-demeter.md`

## Output produced by Selene (Wave 1)

### Query interface (canonical, Demeter implements as FastAPI endpoint)

**Path**: `frontend/src/lib/dashboard/queries.ts`

```typescript
export interface DashboardQuery {
  range: 'today' | 'sprint' | 'quarter';
  repo: string | 'all';
  sprint?: string;
}

export interface DashboardQueryAPI {
  fetchDashboard(query: DashboardQuery): Promise<DashboardData>;
}

export function buildDashboardQueryString(query: DashboardQuery): string;
```

### Type contract (canonical, Demeter Pydantic models mirror)

**Path**: `frontend/src/lib/dashboard/types.ts`

The complete TypeScript schema for `DashboardData` and 14 sub-types is the canonical contract. Demeter Wave 3 Pydantic models MUST match field-by-field with camelCase JSON output via alias generator.

### Hook with Wave 3 swap stub

**Path**: `frontend/src/lib/dashboard/useDashboardData.ts`

Wave 1 returns mock data. Wave 3 swap: replace the `useEffect` body with:

```typescript
useEffect(() => {
  let cancelled = false;
  setLoading(true);
  const qs = buildDashboardQueryString({ range, repo, sprint });
  fetch(`/api/dashboard?${qs}`)
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`status ${r.status}`))))
    .then((json: DashboardData) => { if (!cancelled) { setData(json); setLoading(false); } })
    .catch((e) => { if (!cancelled) { setError(e); setLoading(false); } });
  return () => { cancelled = true; };
}, [range, repo, sprint]);
```

The swap is a single function replacement, no other Selene code changes needed.

## Demeter Wave 3 implementation expectations (per contract)

**Endpoint**: `GET /api/dashboard`

**Query params**:
- `range`: `today` | `sprint` | `quarter` (required)
- `repo`: full name (`codeplex/chronicle-core`) or `all` (required)
- `sprint`: sprint identifier override (optional, default current sprint)

**Response**: 200 OK with `DashboardData` JSON, camelCase keys via Pydantic alias generator

**Errors**:
- 401: unauthenticated (session JWT missing/invalid)
- 403: repo access denied (session user lacks GitHub access to requested repo)
- 404: sprint identifier not found in milestones table
- 500: server error
- 503: cache cold start (Selene displays cached data + retry overlay)

**Pydantic schema reference (from contract)**:

```python
# backend/app/api/dashboard.py
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from typing import Literal

router = APIRouter(prefix="/api/dashboard")

class DashboardData(BaseModel):
    briefing: str
    kpis: list[KPIMetric]
    velocity: list[VelocityPoint]
    burndown: list[BurndownPoint]
    burndown_meta: BurndownMeta  # Pydantic alias to burndownMeta JSON output
    contributors: list[ContributorStats]
    drifts: list[DriftSummary]
    refactor_proposals: list[RefactorProposal]  # alias to refactorProposals
    repos: list[RepoStatus]
    city_preview_meta: CityPreviewMeta  # alias to cityPreviewMeta
    current_sprint: str  # alias to currentSprint
    last_refresh: str  # alias to lastRefresh

class Config:
    populate_by_name = True
    alias_generator = lambda s: s.split('_')[0] + ''.join(w.capitalize() for w in s.split('_')[1:])
```

## Materialized view + query expectations

Per `selene-to-demeter.md` line 163-165:
- Source tables: `pr_events`, `simulation_events`, `finding_events`, `llm_call_log`, `drift_log`
- Materialized views: `cycle_time_aggregate`, `lead_time_aggregate`, `ownership_distribution`
- Sparkline data (14-day commit count): computed from `pr_events GROUP BY day`, cached in materialized view

## Cache + refresh expectations

- 30-second TTL cache layer, key-namespaced per `(range, repo, sprint, user)`
- PR webhook events trigger materialized view refresh (Demeter authors refresh trigger)
- Stale data acceptable up to 5 minutes during webhook ingest lag

## Authorization expectations

- Session JWT verified per request via shared `require_session` dependency (Hades OAuth implementation)
- Cross-repo aggregation (`repo=all`) joins across all repos user has GitHub access to
- Single repo query for repo not in user access returns 403

## Asumption baked

1. Demeter Pydantic models match Selene TypeScript types field-for-field with camelCase JSON output. Mismatch = Selene fetch hook breaks runtime.
2. Sprint identifier source: GitHub Milestones API. Mock data Wave 1 uses string labels like `Sprint 14`; Wave 3 real query joins on milestone number string.
3. Burndown ideal calculation: linear from sprint start total points; Demeter computes on the fly.
4. Empty event store handling: Demeter returns `DashboardData` with empty arrays + briefing fallback "No activity yet. Connect a repository to begin."

## Edge case handling

| Edge case | Selene side behavior | Demeter side responsibility |
|---|---|---|
| Empty event store | Empty arrays render placeholder cells (Designer "—" dashed boxes) | Return DashboardData with empty arrays + fallback briefing |
| Repo not accessible | Hook receives 403, sets `error`, dashboard shows "Data unavailable" overlay | Authorization check based on session user_id + GitHub repo access scope |
| Sprint identifier invalid | Hook receives 404, sets `error` | Return 404 with error body |
| Database connection failure | Hook receives 503, sets `error`, dashboard shows retry overlay | Return 503 with retry-after header |
| Materialized view refresh stale | Selene unaware, shows cached data | Accept stale up to 5 min, trigger async refresh on next event ingest |

## Validation done by Selene

- TypeScript types in `frontend/src/lib/dashboard/types.ts` exported and re-exported via `index.ts`
- Mock data shape passes TypeScript strict-mode check (no `any`, no `unknown`)
- Mock data field count matches Pythia contract field count
- `queries.ts` exports query interface matching backend endpoint signature exactly
- `useDashboardData` hook fetches with correct query params on initial mount + on filter change (Wave 1 stub re-runs effect on range/repo/sprint deps change)

## Validation needed by Demeter Wave 3

- [ ] Implement endpoint at `/api/dashboard` matching contract signature exactly
- [ ] All Pydantic models match Selene's TypeScript types field-by-field
- [ ] Cache layer TTL 30 seconds, key-namespaced per user + filter combination
- [ ] Smoke test: replace Selene `useDashboardData` stub body with real fetch, verify dashboard renders real data with no console error
- [ ] Authorization: deny request if session user lacks access to requested repo (HTTP 403)
- [ ] JSON serialization: snake_case Python field names emit camelCase JSON output via Pydantic alias generator

## Open questions for Demeter

1. **Sprint identifier source**: GitHub Milestones API or internal sprint table? Mock data uses "Sprint 14" string. Demeter must define sprint identifier mapping.
2. **Sparkline aggregation precision**: 14-day commit count? Or 14-day PR merge count? Selene mock data uses commit count proxy; Demeter confirms source.
3. **Briefing copy generation**: templated literal vs LLM-generated? Mock data is a static string; Wave 3 may generate via Athena (V4-Pro think high) for variety. Selene displays whatever Demeter ships.

## Ferry items (Selene to V1 Orch via this handoff)

None HIGH bar. Demeter Wave 3 contract matches Selene Wave 1 output verbatim.

## Closing

Demeter Wave 3 spawn unblocked. Selene's `frontend/src/lib/dashboard/queries.ts` + `types.ts` are the canonical contract surface. Demeter implements `/api/dashboard` matching these types + Selene replaces hook body with one-block fetch swap (5 line change).

Gas Demeter.
