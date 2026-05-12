# Handoff: Demeter (Wave 3) to Boreas (Wave 2)

**Edge**: feedback (Wave 3 producer to Wave 2 consumer)
**Authored**: 2026-05-12 22:25 WIB
**Producer**: Demeter (Wave 3 cycle 1 ship-clean)
**Consumer**: Boreas (Wave 2, activity timeline mock swap)

## What Demeter ships

- `GET /api/activity?days={30|60|90}&repo={full_name|all}&district={name?}` returns `ActivityData` Pydantic model.
- Response schema field-for-field match per `_meta/contracts/boreas-to-demeter.md` lines 105-156.
- Backed by Postgres materialized views (`commit_frequency_per_building`, `ownership_distribution`) + on-the-fly aggregation from `pr_events`.

## Schema contract verification

| Pydantic model              | Pythia contract location             | Match status |
|-----------------------------|--------------------------------------|--------------|
| ActivityData                | boreas-to-demeter.md L138-143        | EXACT        |
| CommitActivity              | boreas-to-demeter.md L105-108        | EXACT        |
| OwnershipDistributionItem   | boreas-to-demeter.md L116-122        | EXACT        |
| HotspotIntensity            | boreas-to-demeter.md L124-128        | EXACT        |
| Contributor                 | boreas-to-demeter.md L110-114        | EXACT        |
| ActivitySummary             | boreas-to-demeter.md L131-135        | EXACT        |

## Known gaps to address Wave 2 cycle 2

- **camelCase alias deferred**: same as Selene handoff, snake_case Python field names returned. Adapter or alias_generator next iteration.
- **HotspotIntensity normalization**: max commit_count in window = intensity 1.0. Window-relative not global-relative per contract Asumption 4.
- **Most active building + owner in summary**: returned as empty strings Wave 3 cycle 1; can populate from `commit_frequency_per_building` ORDER BY total DESC LIMIT 1 if needed.

## Caching + freshness

- `ownership_distribution` refresh nightly per contract Asumption 5; manual via `DemeterRealService.refresh_activity_views()`.
- `commit_frequency_per_building` refresh hourly; same manual hook.
- Scheduler deferred to Wave 3 cycle 2 polish.

## Validation evidence

- `test_activity_query_returns_data_shape` confirms ActivityData shape returns on empty + populated DB against live Refactory Postgres.
- 13/13 live persist tests PASS.

## Boreas consumer next step

Replace mock 30-day dataset at `frontend/src/modes/activity/queries.ts` `useActivityData` (or equivalent) with fetch to `http://localhost:8000/api/activity?days=30&repo=all`. Scrubber drag handler debounces fetch by 100ms per `boreas-to-demeter.md` Validation Step.
