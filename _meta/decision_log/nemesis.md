# Nemesis Decision Log

**Worker**: Nemesis (Wave 3, 11 detector suite)
**Started**: 2026-05-12 21:33 WIB Day 1 evening (Wave 3 batch spawn 20:55 WIB)
**Domain**: 5 Apollo detector + Argus security CVSS + 5 spec-drift A-E + dispatcher + 4 adapter

## Cycle 1 (2026-05-12 21:33 - 21:55 WIB, 22 min, stub ship)

### D-Nemesis-01: Adapter pattern for stub-and-sync
**What**: Author thin adapter layer `backend/app/services/detectors/adapters/{hades,triton,demeter,ws_publisher}_adapter.py` wrapping the 4 upstream services.
**Why**: Cycle 1 spawn batch parallel with Hades + Triton + Demeter + Pandora + Atlas. Adapter pattern lets Nemesis ship dispatcher + 11 detector signatures immediately, with graceful fallback to canned data when upstream not yet wired in a test fixture. Discovered upstream services already shipped REAL by sibling workers (parsers full, llm gateway full, event_bus full, demeter Protocol stub), so adapters connect-real-with-fallback rather than pure stub.
**Impact**: Cycle 2+ does not require breaking changes to adapters; they will auto-bind to real services as soon as those expose new methods (e.g., Demeter `persist_finding` + `persist_drift_event` cycle 2 ship).
**Alternative considered**: Direct import of real services without adapter. Rejected because Triton requires DEEPSEEK_API_KEY env var which is not set in test env, so direct binding would crash test collection. Adapter pattern lets `force_real=False` gracefully fall back to canned mode.

### D-Nemesis-02: Pydantic schema verbatim Pythia contracts
**What**: `types.py` defines `ApolloFinding`, `CVSSScore`, `FindingPersist`, `DriftEvent`, `DriftEventPersist`, `FindingEvent`, `ScanResult` matching Pythia contracts `nemesis-to-demeter.md` line 26-69 + `nemesis-to-asclepius.md` line 33-60 + `triton-to-nemesis.md` line 139 verbatim.
**Why**: Lock 16 (output match Pythia contract schema verbatim). Lock 4 (5-enum Severity + 5-enum FindingCategory kebab-case LOCKED, JANGAN add 6th enum).
**Impact**: Demeter cycle 2 SQL DDL `finding_events` + `drift_log` reads from these Pydantic models directly; Asclepius Wave 2 frontend `findingEvents.ts` TypeScript types are 1:1 mirror.
**Alternative considered**: Loose dataclass without Pydantic ConfigDict(extra="forbid"). Rejected because extra-forbid catches silent schema drift on Demeter/Asclepius downstream consume.

### D-Nemesis-03: Dispatcher single-entry orchestrator
**What**: `dispatcher.run_full_scan(repo_root, repo_full_name)` orchestrates parse to parallel Apollo 5 to Argus enrich to parallel drift 5 to persist to publish lifecycle.
**Why**: Single entry point per Pythia contract `nemesis-to-demeter.md` line 117 `scan_repo_and_persist` + `nemesis-to-asclepius.md` line 70 `scan_repo_and_publish_events`. Combined into one function so API endpoint + cron trigger + webhook handler all call the same path.
**Impact**: API route (`POST /api/scan-repo`, Hades-owned) and webhook handler (PR merged, Hades-owned) both call `run_full_scan`; Atlas K8s job for periodic scan calls the same. No code duplication.
**Alternative considered**: Separate `scan_and_persist` + `scan_and_publish` functions. Rejected because persist + publish are tightly coupled by scan_run_id grouping; splitting risks divergent scan_run_id semantics.

### D-Nemesis-04: Argus enrich post-Apollo, in-place mutation
**What**: `argus_security.enrich_findings(findings)` runs after all 5 Apollo detectors, mutates each finding's CVSS fields in place for security categories only.
**Why**: Argus consumes Apollo finding to assign CVSS via LLM; pipeline order Apollo to Argus to persist matches `triton-to-nemesis.md` line 116 consumer pattern. Mutation in place avoids list copy + preserves order. Non-security categories (outdated-dependency, complex-untested) bypass Argus per `nemesis-to-demeter.md` `SECURITY_CATEGORIES` filter.
**Impact**: Adds ~3 Triton calls per scan (one per security finding, cycle 1 stub canned, cycle 3 real V4-Flash think low). Cost budget OK within Hafiz $5 cap.
**Alternative considered**: Enrich at detection time (each detector calls Triton). Rejected because (a) coupling detector to LLM violates pure deterministic Apollo lane principle, (b) batches Triton calls poorly.

### D-Nemesis-05: Drift algo decision doc locked pre-cycle 1
**What**: Authored `_meta/decisions/nemesis_drift_algo.md` pre-implementation documenting AST-diff inferred algo per Phase B Topic 3c line 151 + 5 pattern A-E algorithmic primary trigger conditions.
**Why**: Lock 4 compliance (5 pattern A-E LOCKED PRD, JANGAN add Pattern F). Per worker prompt Section 8 "AST-diff spec-drift algo: full re-parse vs incremental diff" + ship criteria item 8. Phase B Topic 3c blind spot called out that algo not OpenSpec-native and must be Codeplex-specific module; documenting the inferred algo before code makes the pitch defensibility differentiator (PRD D17) verifiable.
**Impact**: Cycle 4 + 5 real impl follows the doc verbatim; Aletheia audit can verify pattern definitions match PRD Section 11.3 verbatim.
**Alternative considered**: Delay drift algo doc to cycle 5 ship. Rejected per worker prompt explicit "drift algo decision doc requirement" + Phase B `[INFERRED]` flag means uncertainty journal AND decision doc both required.

### D-Nemesis-06: Wire format camelCase aliases via Pydantic populate_by_name
**What**: `FindingEvent` Pydantic model uses `Field(alias="repoFullName")` for Python snake_case `repo_full_name` to emit camelCase JSON wire format via `model_dump(by_alias=True)`.
**Why**: Asclepius TypeScript consumer in `nemesis-to-asclepius.md` line 35-59 expects camelCase field names. Pydantic alias + populate_by_name=True lets Python code use snake_case while wire format stays TypeScript-friendly.
**Impact**: Smoke test `test_finding_event_payload_camelcase_aliases` validates wire format compliance. WS publisher adapter dumps with `by_alias=True` before publishing to event_bus topic.
**Alternative considered**: Snake_case Python internals + manual dict mapping at publish boundary. Rejected as fragile; Pydantic alias is single source of truth.

### Cycle 1 ship summary
- 14/14 Nemesis smoke test PASS (5 Apollo trigger + 5 drift trigger + Argus enrich + WS lifecycle + Demeter buffer + 4 enum lock + payload alias + adapter singleton).
- 176/176 full backend test suite PASS (no regression to Hades + Triton + Pandora + Demeter sibling tests).
- 18 files authored: types.py + dispatcher.py + 11 detector + 4 adapter + 1 smoke test + __init__.
- 4 mandatory artifact authored per cycle.
- Drift algo decision doc authored `_meta/decisions/nemesis_drift_algo.md` 220 line.
- All cycle 1 detector findings + drift events labeled `[STUB cycle-1]` per Lock 5 honest claim discipline.

## Cycle 2 (pending after Hades + Triton + Demeter cycle 2 full ship)

(awaiting upstream sync, no decisions yet)
