# Contract: Demeter to Boreas (Feedback)

**Edge type**: feedback (Wave 3 to Wave 2)
**Wave**: Wave 3 producer to Wave 2 consumer
**Status**: locked
**Authored**: 2026-05-12 16:26 WIB

## Producer

**Worker**: Demeter (Wave 3)
**Domain**: PostgreSQL event store query layer. Demeter implements `/api/activity` endpoint that Boreas's activity timeline scrubber fetches (request schema defined in `boreas-to-demeter.md`). This feedback contract documents Demeter's implementation perspective + materialized view refresh + edge cases.

## Consumer

**Worker**: Boreas (Wave 2)
**Domain**: Activity Mode: timeline scrubber 30/60/90 day + hotspot intensity glow + ownership heatmap. Boreas's request schema + response types are canonical (defined in `boreas-to-demeter.md`). This contract documents what Demeter promises about freshness + ordering + edge cases.

## Output schema (producer to consumer)

Response schema matches `boreas-to-demeter.md` `ActivityData` Pydantic models. Demeter populates each field from materialized views:

```python
# backend/app/services/activity_query.py (Demeter)
from app.services.demeter_service import get_demeter_service
from typing import Literal


class ActivityQueryService:
    """Serves /api/activity endpoint."""

    async def fetch_activity(
        self,
        days: Literal[30, 60, 90],
        repo: str,
        district: str | None,
        user: int,
    ) -> ActivityData:
        # 1. Timeline: daily commit counts from `commit_frequency_per_building` materialized view
        timeline = await self._fetch_timeline(days, repo, district)

        # 2. Hotspots: intensity normalized within window
        hotspots = await self._fetch_hotspots(days, repo, district)

        # 3. Ownership: from `ownership_distribution` materialized view
        ownership = await self._fetch_ownership(repo)

        # 4. Summary
        summary = await self._fetch_summary(days, repo, district)

        return ActivityData(
            timeline=timeline,
            hotspots=hotspots,
            ownership=ownership,
            summary=summary,
        )

    async def _fetch_timeline(
        self,
        days: int,
        repo: str,
        district: str | None,
    ) -> list[CommitActivity]:
        """Aggregates daily commit counts per building."""
        # SELECT date, JSONB_OBJECT_AGG(building_id, commit_count) AS building_commits
        # FROM commit_frequency_per_building
        # WHERE repo = $1 AND date > NOW() - INTERVAL '$2 days'
        # GROUP BY date ORDER BY date
        ...

    async def _fetch_hotspots(
        self,
        days: int,
        repo: str,
        district: str | None,
    ) -> list[HotspotIntensity]:
        """Returns building hotspot intensity normalized to [0..1] within window."""
        # Aggregate from commit_frequency_per_building; max commit count = 1.0 intensity
        ...

    async def _fetch_ownership(self, repo: str) -> list[OwnershipDistribution]:
        """Reads `ownership_distribution` materialized view."""
        ...

    async def _fetch_summary(
        self,
        days: int,
        repo: str,
        district: str | None,
    ) -> ActivitySummary:
        ...
```

Materialized views (extending `demeter-to-selene.md`):

```sql
-- backend/migrations/versions/005_activity_views.py (Demeter)

-- Commit frequency per building per day
CREATE MATERIALIZED VIEW commit_frequency_per_building AS
SELECT
    repo_full_name,
    building_id,
    DATE_TRUNC('day', received_at) AS date,
    COUNT(*) AS commit_count,
    MAX(received_at) AS last_commit_at
FROM pr_events
WHERE event_type = 'pr.merged'
  AND building_id IS NOT NULL
GROUP BY repo_full_name, building_id, DATE_TRUNC('day', received_at);

CREATE INDEX commit_freq_repo_building_idx ON commit_frequency_per_building(repo_full_name, building_id);
CREATE INDEX commit_freq_date_idx ON commit_frequency_per_building(date);


-- Ownership distribution (last 6 months blame proxy)
CREATE MATERIALIZED VIEW ownership_distribution AS
WITH author_contributions AS (
    SELECT
        repo_full_name,
        building_id,
        author_login,
        SUM(lines_added + lines_deleted) AS total_lines_changed
    FROM pr_events
    WHERE event_type = 'pr.merged'
      AND received_at > NOW() - INTERVAL '6 months'
      AND building_id IS NOT NULL
    GROUP BY repo_full_name, building_id, author_login
),
ranked AS (
    SELECT
        repo_full_name,
        building_id,
        author_login,
        total_lines_changed,
        SUM(total_lines_changed) OVER (PARTITION BY building_id) AS building_total,
        ROW_NUMBER() OVER (PARTITION BY building_id ORDER BY total_lines_changed DESC) AS rank
    FROM author_contributions
)
SELECT
    repo_full_name,
    building_id,
    MAX(CASE WHEN rank = 1 THEN author_login END) AS primary_owner_login,
    MAX(CASE WHEN rank = 1 THEN total_lines_changed::float / NULLIF(building_total, 0) * 100 END) AS primary_owner_share_percent,
    JSONB_AGG(
        JSONB_BUILD_OBJECT(
            'github_login', author_login,
            'share_percent', total_lines_changed::float / NULLIF(building_total, 0) * 100
        ) ORDER BY total_lines_changed DESC
    ) AS contributors
FROM ranked
GROUP BY repo_full_name, building_id;

CREATE INDEX ownership_repo_idx ON ownership_distribution(repo_full_name);
```

## Storage location

- Activity query service: `backend/app/services/activity_query.py` (Demeter)
- Materialized views: `backend/migrations/versions/005_activity_views.py` (Demeter)
- API endpoint: `backend/app/api/activity.py` (Demeter; defined in `boreas-to-demeter.md`)
- Cache layer: shared with `demeter-to-selene.md` 30-second TTL

## Asumption baked

1. Materialized view refresh frequency:
   - `commit_frequency_per_building`: refreshed on pr_event insert via FastAPI BackgroundTasks (eager) + scheduled hourly fallback.
   - `ownership_distribution`: refreshed nightly via scheduled background task; 6-month window doesn't require real-time freshness.
2. Building id determined by Hades parser when ingesting PR event; pr_events.building_id is the canonical mapping.
3. Hotspot intensity normalized within query window (max commit_count = 1.0 intensity).
4. Avatar URL for contributor resolved separately (Demeter joins users table for avatar_url).
5. Ownership share percentage clamped to [0, 100]; rare edge case where building_total = 0 returns 0% (NULLIF prevents division error).

## Validation steps

**Producer responsibility (Demeter)**:
- All materialized views refreshed within hour windows (commit_frequency hourly, ownership_distribution nightly).
- Activity endpoint response time < 300ms for cached, < 1.2s cold fetch.
- Timeline data ordered by date ascending.
- Hotspot intensity normalization correct (max = 1.0).
- Smoke test: scrub timeline 30/60/90 days, observe scrubber data correlates with mock pr_events.

**Consumer responsibility (Boreas)**:
- Defined in `boreas-to-demeter.md`; consume per Pydantic schema.
- Scrub UI debounced (avoid request flood); 100ms debounce reasonable.
- Empty state UI when no activity.
- Smoke test: timeline scrubber displays per-day intensity, ownership heatmap re-colors buildings by primary_owner_login distinct palette.

## Edge case handling

- Empty pr_events for repo: timeline shows empty days with 0 counts; hotspots empty array; ownership empty array.
- Avatar URL unavailable (user lookup fails): Boreas displays generic avatar placeholder.
- Materialized view refresh in progress (concurrent refresh attempt): Demeter accepts second refresh as no-op (Postgres handles).
- District filter applied but no buildings in district: Demeter returns empty arrays; Boreas shows empty state with district label.

## Open questions

- Per-language activity breakdown: not in PRD scope; could be Pan polish if rehearsal demand.
- Ownership confidence score (e.g., low if only 5% share): deferred; Wave 3 ships primary owner without confidence indicator.

## Reference

- Metis Agentic Structure md Section 2 DAG: Demeter event-store queries consumed by Boreas timeline scrubber, feedback edge
- Metis Section 5.4 Boreas + Section 5.6 Demeter ship criteria
- PRD Section 9.4 (Activity Mode hotspot tracking + ownership heatmap)
- PRD Section 18.7 (event store schema)
- Contract `boreas-to-demeter.md` (request schema definition; reverse direction)
- Contract `demeter-to-selene.md` (sibling feedback contract, dashboard queries)
