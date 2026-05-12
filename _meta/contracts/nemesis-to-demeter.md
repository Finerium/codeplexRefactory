# Contract: Nemesis to Demeter

**Edge type**: intra-wave (Wave 3 internal)
**Wave**: Wave 3 producer to Wave 3 consumer
**Status**: locked
**Authored**: 2026-05-12 16:11 WIB

## Producer

**Worker**: Nemesis (Wave 3)
**Domain**: 5 Apollo detector + Argus CVSS scoring + 5 spec-drift pattern A-E. Nemesis produces findings + drift events per scan run; events persist to Demeter's event store for dashboard aggregation + Asclepius glow trigger feedback (see `nemesis-to-asclepius.md`).

## Consumer

**Worker**: Demeter (Wave 3)
**Domain**: PostgreSQL event store. Demeter extends `hades-to-demeter.md` `DemeterService` interface with `persist_finding` + `persist_drift_event` methods + `finding_events` + `drift_log` schemas.

## Output schema (producer to consumer)

```python
# backend/app/services/demeter_service.py (Demeter extends from hades-to-demeter.md)
from pydantic import BaseModel
from typing import Literal


class FindingPersist(BaseModel):
    """Finding event Nemesis sends to Demeter."""
    finding_id: str  # Stable id (hash of building_id + line + category)
    building_id: str
    file_path: str
    line_start: int
    line_end: int
    category: Literal[
        "hardcoded-secret", "outdated-dependency", "missing-auth",
        "unsafe-sql", "complex-untested",
    ]
    severity: Literal["critical", "high", "medium", "low", "info"]
    title: str
    description: str
    suggested_fix: str
    /** Argus CVSS scoring if applicable (security findings). */
    cvss_vector: str | None
    cvss_base_score: float | None
    exploit_pattern: str | None  # CWE id + description
    /** Repo full name (owner/repo). */
    repo_full_name: str
    /** Detection scan run id grouping findings. */
    scan_run_id: str
    /** Detection timestamp ISO 8601. */
    detected_at: str


class DriftEventPersist(BaseModel):
    """Spec-drift event Nemesis sends to Demeter."""
    drift_id: str  # Stable id (hash of pattern + file_path + commit_sha)
    pattern: Literal["A", "B", "C", "D", "E"]
    pattern_label: str
    repo_full_name: str
    /** Affected file path (Patterns A, C, E) or issue number (Patterns B, D). */
    affected_resource: str
    /** Severity per detector heuristic. */
    severity: Literal["critical", "high", "medium", "low", "info"]
    /** Evidence: commit shas, file diffs, issue urls. */
    evidence: dict
    /** Detection scan run id. */
    scan_run_id: str
    /** Detection timestamp ISO 8601. */
    detected_at: str


# Extend DemeterService with new persist methods
class DemeterService:
    # ... existing methods from hades-to-demeter.md ...

    async def persist_finding(self, finding: FindingPersist) -> None:
        """Inserts row in `finding_events` table.

        UNIQUE constraint on (finding_id, scan_run_id) for idempotency.
        Triggers BuildingEvent publish via event_bus (consumed by Asclepius glow per nemesis-to-asclepius.md).
        """
        ...

    async def persist_drift_event(self, drift: DriftEventPersist) -> None:
        """Inserts row in `drift_log` table.

        Triggers materialized view refresh for `drift_summary_view`.
        """
        ...

    async def list_findings_for_building(
        self,
        building_id: str,
        status_filter: list[Literal["open", "snoozed", "ticketed", "resolved"]] | None = None,
    ) -> list[FindingPersist]:
        """Query findings for Asclepius glow rendering."""
        ...

    async def list_drift_events(
        self,
        repo_full_name: str,
        since: str | None = None,
    ) -> list[DriftEventPersist]:
        """Query drift events for dashboard summary."""
        ...
```

Nemesis consumer pattern:

```python
# backend/app/services/detectors/__init__.py (Nemesis)
from app.services.demeter_service import (
    get_demeter_service, FindingPersist, DriftEventPersist,
)


async def scan_repo_and_persist(repo_root: Path, repo_full_name: str) -> str:
    """Runs all detectors, persists findings + drift events.

    Returns scan_run_id for downstream feedback.
    """
    scan_run_id = generate_scan_run_id(repo_full_name)
    demeter = get_demeter_service()
    parser = get_parser_service()
    parsed = await parser.parse_repo(repo_root)

    # 5 Apollo detector pass
    apollo_findings = await detect_apollo_5(parsed)
    for finding in apollo_findings:
        # If security category, route to Argus for CVSS scoring via LLM
        if finding.category in ("hardcoded-secret", "missing-auth", "unsafe-sql"):
            cvss = await argus_cvss_score(finding)
            finding.cvss_vector = cvss.vector
            finding.cvss_base_score = cvss.base_score
            finding.exploit_pattern = cvss.exploit_pattern
        await demeter.persist_finding(FindingPersist(
            **finding.dict(),
            scan_run_id=scan_run_id,
            repo_full_name=repo_full_name,
        ))

    # 5 spec-drift pattern A-E pass
    drift_events = await detect_drift_a_through_e(repo_root, repo_full_name)
    for drift in drift_events:
        await demeter.persist_drift_event(DriftEventPersist(
            **drift.dict(),
            scan_run_id=scan_run_id,
        ))

    return scan_run_id
```

Postgres schema (Demeter extends initial migration):

```sql
-- backend/migrations/versions/002_finding_drift_schema.py (Demeter Wave 3)

CREATE TABLE finding_events (
    id BIGSERIAL PRIMARY KEY,
    finding_id TEXT NOT NULL,
    scan_run_id TEXT NOT NULL,
    building_id TEXT NOT NULL,
    file_path TEXT NOT NULL,
    line_start INTEGER NOT NULL,
    line_end INTEGER NOT NULL,
    category TEXT NOT NULL,
    severity TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    suggested_fix TEXT,
    cvss_vector TEXT,
    cvss_base_score NUMERIC(3, 1),
    exploit_pattern TEXT,
    repo_full_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',  -- open | snoozed | ticketed | resolved
    linked_issue_number INTEGER,
    detected_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (finding_id, scan_run_id)
);
CREATE INDEX finding_events_building_idx ON finding_events(building_id);
CREATE INDEX finding_events_repo_idx ON finding_events(repo_full_name);
CREATE INDEX finding_events_severity_idx ON finding_events(severity);
CREATE INDEX finding_events_status_idx ON finding_events(status);


CREATE TABLE drift_log (
    id BIGSERIAL PRIMARY KEY,
    drift_id TEXT NOT NULL,
    pattern TEXT NOT NULL,
    pattern_label TEXT NOT NULL,
    repo_full_name TEXT NOT NULL,
    affected_resource TEXT NOT NULL,
    severity TEXT NOT NULL,
    evidence JSONB NOT NULL,
    scan_run_id TEXT NOT NULL,
    detected_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (drift_id, scan_run_id)
);
CREATE INDEX drift_log_repo_idx ON drift_log(repo_full_name);
CREATE INDEX drift_log_pattern_idx ON drift_log(pattern);
```

## Storage location

- DemeterService extensions: `backend/app/services/demeter_service.py` (Demeter)
- Migration: `backend/migrations/versions/002_finding_drift_schema.py` (Demeter)
- Nemesis scan orchestrator: `backend/app/services/detectors/__init__.py` (Nemesis)
- Apollo detectors: `backend/app/services/detectors/apollo_*.py` (Nemesis, 5 files)
- Drift detectors: `backend/app/services/detectors/drift_pattern_{a,b,c,d,e}.py` (Nemesis, 5 files)
- Argus security: `backend/app/services/detectors/argus_security.py` (Nemesis via `triton-to-nemesis.md`)

## Asumption baked

1. Findings persist with `status='open'` default; later state transitions (snoozed/ticketed/resolved) via separate Demeter methods (covered in `pandora-to-asclepius.md` + `demeter-to-selene.md`).
2. Scan run id groups findings from same detection pass; allows historical comparison + deduplication.
3. Drift event idempotency via (drift_id, scan_run_id) UNIQUE constraint; same drift across multiple scans creates multiple rows (audit trail).
4. Argus CVSS scoring is async per finding; security findings persist with cvss fields populated after LLM call.
5. Postgres JSONB for drift evidence supports flexible per-pattern schema (e.g., Pattern A includes file diff, Pattern E includes commit history).

## Validation steps

**Producer responsibility (Nemesis)**:
- `scan_repo_and_persist` returns scan_run_id; persists all findings + drift events for the run.
- Idempotency: re-running scan on same repo without changes produces no duplicate finding_events rows (UNIQUE constraint catches).
- Argus CVSS scoring fires only for security categories.
- Smoke test: NodeGoat fork scan persists 5+ Apollo findings + 5+ drift events.

**Consumer responsibility (Demeter)**:
- Migration creates `finding_events` + `drift_log` tables.
- Persist methods idempotent.
- `list_findings_for_building` returns findings filtered by status; supports Asclepius glow rendering query.
- `list_drift_events` supports dashboard aggregation.

## Edge case handling

- Persist on disconnected DB: Demeter retries up to 2 times; persistent failure logs + degraded response.
- Duplicate finding (scan re-run with same scan_run_id): UNIQUE constraint catches; INSERT...ON CONFLICT DO NOTHING returns success.
- Argus scoring fails (LLM outage): persist finding with cvss fields null; Argus marked degraded.
- Pattern E commit hook bypass detection requires git history access: Nemesis falls back to "commit hook hint" via marker comment if git history unavailable.

## Open questions

- Materialized view `drift_summary_view` refresh strategy: Wave 3 default = on-write trigger (Postgres rule or async background task per OQ-04 manual). Refresh frequency hourly acceptable for demo.
- Finding status state machine: open -> ticketed (1-click GitHub issue) handled by `demeter-to-selene.md` Hybrid Layer 1 + Pandora Accept flow.

## Reference

- Metis Agentic Structure md Section 2 DAG: Nemesis detection results event payload consumed by Demeter event-store
- Metis Section 5.6 Nemesis + Demeter ship criteria
- PRD Section 9.5 (Health Mode 5 Apollo detectors)
- PRD Section 11 (5 spec-drift patterns A-E)
- PRD Section 18.7 (event store schema overview)
- Contract `hades-to-demeter.md` (DemeterService base interface)
- Contract `triton-to-nemesis.md` (Argus CVSS scoring via LLM)
- Contract `nemesis-to-asclepius.md` (feedback edge, glow trigger)
