# Handoff: Nemesis to Demeter (Wave 3 intra-wave)

**Authored**: 2026-05-12 21:54 WIB Day 1 evening
**Producer**: Nemesis (Wave 3, 11 detector suite)
**Consumer**: Demeter (Wave 3, PostgreSQL event store)
**Cycle status**: Nemesis cycle 1 stub SHIP-CLEAN, awaiting Demeter cycle 2 full

## Cycle 1 stub ship details

Nemesis cycle 1 ships:
- `FindingPersist` + `DriftEventPersist` Pydantic models at `backend/app/services/detectors/types.py`.
- 5 Apollo detector + 5 spec-drift A-E detector each emitting 1 stub finding / event.
- Dispatcher `run_full_scan` orchestrates parse to detect to enrich to persist to publish.
- `DemeterAdapter` at `backend/app/services/detectors/adapters/demeter_adapter.py` calls `persist_finding` + `persist_drift_event` via duck-typed delegation when methods exist on real `DemeterService`, falls back to in-memory buffer otherwise.
- 14/14 smoke test PASS verifying 5 FindingPersist + 5 DriftEventPersist captured per scan run.

## Schema reaffirmation per nemesis-to-demeter.md

### FindingPersist (line 26 verbatim match)

```python
class FindingPersist(BaseModel):
    model_config = ConfigDict(extra="forbid")
    finding_id: str
    building_id: str
    file_path: str
    line_start: int = Field(ge=1)
    line_end: int = Field(ge=1)
    category: Literal["hardcoded-secret", "outdated-dependency", "missing-auth", "unsafe-sql", "complex-untested"]
    severity: Literal["critical", "high", "medium", "low", "info"]
    title: str
    description: str
    suggested_fix: str
    cvss_vector: str | None = None
    cvss_base_score: float | None = None
    exploit_pattern: str | None = None
    repo_full_name: str
    scan_run_id: str
    detected_at: str  # ISO 8601 UTC string with trailing 'Z'
```

### DriftEventPersist (line 53 verbatim match)

```python
class DriftEventPersist(BaseModel):
    model_config = ConfigDict(extra="forbid")
    drift_id: str
    pattern: Literal["A", "B", "C", "D", "E"]
    pattern_label: str
    repo_full_name: str
    affected_resource: str  # file_paths[0] OR f"issue-{id}" OR f"pr-{number}"
    severity: Literal["critical", "high", "medium", "low", "info"]
    evidence: dict[str, Any]  # JSONB serializable
    scan_run_id: str
    detected_at: str  # ISO 8601 UTC string with trailing 'Z'
```

## What Demeter Wave 3 cycle 2 must implement

Per `nemesis-to-demeter.md` line 75 + 83 + 154-198 + 202:

1. **Method `async def persist_finding(self, finding: FindingPersist) -> None`** on `DemeterServiceProtocol` + concrete service. Inserts row into `finding_events` table. UNIQUE constraint on `(finding_id, scan_run_id)` for idempotency. Triggers BuildingEvent publish (already wired via Nemesis ws_publisher_adapter; Demeter does not double-publish).

2. **Method `async def persist_drift_event(self, drift: DriftEventPersist) -> None`** on protocol + service. Inserts row into `drift_log` table. Triggers materialized view refresh for `drift_summary_view` (refresh strategy hourly per OQ-04, on-write trigger acceptable for demo).

3. **Alembic migration 002** at `backend/migrations/versions/002_finding_drift_schema.py`:
   - `finding_events` table per SQL DDL at `nemesis-to-demeter.md` line 157.
   - `drift_log` table per SQL DDL at line 187.
   - Indexes: `finding_events_building_idx`, `finding_events_repo_idx`, `finding_events_severity_idx`, `finding_events_status_idx`, `drift_log_repo_idx`, `drift_log_pattern_idx`.

4. **Query methods**:
   - `async def list_findings_for_building(building_id, status_filter)` for Asclepius glow rendering.
   - `async def list_drift_events(repo_full_name, since)` for dashboard summary.

5. **Status state machine**: `status` column defaults `'open'`. Pandora Layer 2 Accept transitions to `'ticketed'` (linked_issue_number populated). User UI Snooze sets `'snoozed'`. Resolution sets `'resolved'`.

## What Nemesis cycle 2+ delivers to Demeter

Per cycle 2-5 plan (see `_meta/plans/nemesis-wave3-cycle-plan.md`):
- Cycle 2: real Apollo detector 1-3 (gitleaks + OSV API + 4 framework tree-sitter). Live FindingPersist payloads from NodeGoat fork.
- Cycle 3: real Apollo detector 4-5 + Argus CVSS via Triton real LLM call. Live cvss_vector / cvss_base_score / exploit_pattern populated for security categories.
- Cycle 4: real spec-drift A-B-C. Live DriftEventPersist payloads from demo dataset.
- Cycle 5: real spec-drift D-E + smoke 5/5 Apollo + 5/5 drift trigger on NodeGoat + demo dataset.

## Adapter delegation pattern

`DemeterAdapter.persist_finding` and `persist_drift_event` check `hasattr(real, 'persist_finding')` + `hasattr(real, 'persist_drift_event')` respectively. If methods exist, delegate AND buffer. If absent, buffer only + log.

Demeter Wave 3 cycle 2 ship triggers no changes on Nemesis side. Adapter auto-binds.

## Cross-checks for Demeter to verify

1. Severity enum 5-value match (Asclepius lock + Pythia lock).
2. Category enum 5-value kebab-case match (Asclepius lock + Pythia lock).
3. Pattern enum 5-value A-E uppercase match (Lock 4 PRD).
4. `evidence` field uses dict with JSONB-serializable values (str / int / float / bool / list / dict).
5. `detected_at` is ISO 8601 UTC string with trailing `Z` (NOT Python datetime object; persists as TIMESTAMPTZ in Postgres after parse).

## Ferry condition check

No ferry needed from Nemesis side. Per `triton-to-nemesis.md` + `nemesis-to-demeter.md` Pythia contract verbatim. Demeter Wave 3 owner please confirm Pydantic schema match + ack ASAP so cycle 2 integration smoke can pass.

## Aletheia audit cross-reference

Per `aletheia-wave3-audit.md` line 97-100:
- Migration `002_finding_drift_schema.py` exists and applied: Demeter cycle 2 owns.
- finding_events + drift_log tables populated post integration: cycle 2 to cycle 5 verifies.
- Cost tracking `llm_call_log` populated cumulative < $5: Triton + Demeter joint, Nemesis observes Argus call count = 3 per scan (security category findings).
