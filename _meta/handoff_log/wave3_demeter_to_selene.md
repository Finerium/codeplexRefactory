# Handoff: Demeter (Wave 3) to Selene (Wave 1)

**Edge**: feedback (Wave 3 producer to Wave 1 consumer)
**Authored**: 2026-05-12 22:25 WIB
**Producer**: Demeter (Wave 3 cycle 1 ship-clean)
**Consumer**: Selene (Wave 1, dashboard mock swap cycle 2)

## What Demeter ships

- `GET /api/dashboard?range={today|sprint|quarter}&repo={full_name|all}&sprint={id?}` returns `DashboardData` Pydantic model.
- Response schema field-for-field match per `_meta/contracts/selene-to-demeter.md` lines 56-132.
- Backed by Postgres materialized views (velocity_per_sprint, cycle_time_aggregate, lead_time_aggregate, drift_summary_view, repo_status_view) + on-the-fly aggregation from `pr_events` for KPIs + contributors.

## Schema contract verification

| Pydantic model        | Pythia contract location               | Match status |
|-----------------------|----------------------------------------|--------------|
| DashboardData         | selene-to-demeter.md L121-132          | EXACT        |
| KPIMetric             | selene-to-demeter.md L56-61            | EXACT        |
| VelocityPoint         | selene-to-demeter.md L64-67            | EXACT        |
| BurndownPoint         | selene-to-demeter.md L70-73            | EXACT        |
| MilestoneProgress     | selene-to-demeter.md L76-80            | EXACT        |
| ContributorStats      | selene-to-demeter.md L83-91            | EXACT        |
| DriftSummary          | selene-to-demeter.md L94-99            | EXACT        |
| RefactorProposal      | selene-to-demeter.md L102-107          | EXACT        |
| RepoStatus            | selene-to-demeter.md L110-117          | EXACT        |

## Known gaps to address Wave 1 cycle 2

- **camelCase alias not enabled** (per Asumption 1 in contract): Demeter returns snake_case. Selene either uses snake_case via `transformResponse` or Demeter adds `Config.alias_generator` at next iteration. Decision deferred to swap cycle.
- **BurndownPoint + MilestoneProgress empty arrays**: simplified Wave 3 cycle 1. Wave 3 cycle 2 may compute from `pr_events` GROUP BY day if needed.
- **RepoStatus.sparkline empty list**: Wave 3 cycle 2 may populate from per-day commit GROUP BY.

## Caching + freshness

- 30-second TTL cache layer per contract `demeter-to-selene.md` Asumption 2: DEFERRED. Demeter cycle 1 ships direct queries. Materialized views refresh on demand via `DemeterRealService.refresh_dashboard_views()`.
- Cache stampede protection (asyncio.Lock per key): DEFERRED.

## Validation evidence

- 13/13 live Postgres tests PASS in `tests/test_demeter_persist_live.py` against `103.185.52.138:1185/duopoly`.
- `test_dashboard_query_returns_data_shape` confirms DashboardData shape returns on empty + populated DB.

## Selene consumer next step

Replace mock JSON at `frontend/app/dashboard/page.tsx` `useDashboardData` hook with fetch to `http://localhost:8000/api/dashboard` (dev) or `https://duopoly.hackathon.sev-2.com/api/dashboard` (prod). Add error handler for 503 (Demeter not registered) + 401 (Hades cycle 2 auth tightening).
