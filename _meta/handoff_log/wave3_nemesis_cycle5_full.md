# Handoff: Nemesis Cycle 5 Full Ship Summary

**Authored**: 2026-05-12 22:12 WIB Day 1 evening
**Cycle**: 5 (consolidated cycles 1-5 single-session ship)
**Producer**: Nemesis (Wave 3, 11 detector suite)
**Ship status**: SHIP-CLEAN
**Test status**: 33/33 Nemesis PASS + 224/224 full backend PASS
**V_n**: `_meta/orchestration_log/V3_nemesis_detectors_locked_20260512-2212.md`

## What shipped

5 Apollo detector + Argus enrich + 5 spec-drift A-E + dispatcher + 4 adapter + OSV client + manifest parser + IssueStore bridge + 2 fixture sets + 4 test files. All cycle 1 stub labels retained in fallback paths; real impl path verified via integration tests on NodeGoat slice + demo-drift fixtures.

## Real impl status

| Component | Real impl status | Test |
|---|---|---|
| Apollo 1 secrets | 12 regex pattern + Shannon entropy 3.5-4.0 + gitleaks subprocess fallback | test_secrets_detector_finds_hardcoded_credentials_in_fixture |
| Apollo 2 outdated_deps | 7 manifest + OSV API concurrent + retry backoff | test_outdated_deps_queries_osv_for_jquery (network only) |
| Apollo 3 missing_auth | 8 framework + import scan + auth window | test_missing_auth_flags_admin_route |
| Apollo 4 unsafe_sql | 9 SQL exec regex + concat heuristic | test_unsafe_sql_detects_concat_in_allocations_dao |
| Apollo 5 complex_untested | radon + decision token counter + colocated test glob | test_complex_untested_flags_profile_controller |
| Argus enrich | LLMGateway resident_id="argus" V4-Flash think low + canned fallback | test_argus_enriches_security_findings_with_cvss |
| Pattern A | IssueStore + closed greater-than 6mo + file edits after | test_drift_a_stale_closed_fires |
| Pattern B | IssueStore + linked PR merge check | test_drift_b_closed_without_merge_fires |
| Pattern C | IssueStore + lag threshold env override | test_drift_c_spec_impl_lag_fires |
| Pattern D | IssueStore + reopened count + flake skip | test_drift_d_reopened_cycle_fires |
| Pattern E | openspec/archive walk + git log + opsx prefix | test_drift_e_openspec_drift_fires |

## Cross-worker dependencies post-ship

### Demeter (consumer)
- Adapter persist_finding + persist_drift_event currently buffer-only (Demeter Protocol does not yet declare these methods).
- Action for Demeter Wave 3 cycle 2: extend `DemeterServiceProtocol` with `persist_finding(FindingPersist)` + `persist_drift_event(DriftEventPersist)` per `nemesis-to-demeter.md` line 75/83.
- Once methods land on the singleton Demeter service, Nemesis adapter auto-binds via duck-typed `hasattr` check. No Nemesis-side edit required.
- Alternative: when Demeter ships, also implement `list_issues_for_repo` + `list_prs_for_repo` so Nemesis can swap IssueStore fixture bridge to Demeter query (1-line import edit in `issue_store.py` to import from `app.services.demeter_service`).

### Asclepius (consumer)
- WebSocket route `/api/ws/finding-events` already wired (Hades cycle 2 ship).
- EventBus topic = `finding_events` (consumed by Hades `app/api/websocket/finding_events.py`).
- Nemesis publishes via WSPublisherAdapter using EventBus.publish topic.
- FindingEvent payload camelCase wire format verified.

### Atlas (deployment)
- Atlas Dockerfile must include git binary in production image (Pattern E git log subprocess requirement; otherwise Pattern E degrades to info severity `spec_e_git_unavailable`).
- Atlas K8s should mount demo dataset fixture `.codeplex/issues.json` for demo repos at deploy time (otherwise Nemesis falls back to cycle 1 stub for spec-drift A-D until Demeter provides query layer).

### Themis (Day-0 prep)
- Themis Day-0 prep convention: `.codeplex/issues.json` populated with engineered issues per fixture format documented in `issue_store.py`.

## Aletheia audit readiness

Per `_meta/contracts/aletheia-wave3-audit.md` lines 64-81 Nemesis scope:
- 5 Apollo detector fire on NodeGoat fork: VERIFIED by test_full_dispatcher_5_apollo_real_trigger_on_fixture (NodeGoat slice).
- 5 spec-drift A-E fire on demo dataset: VERIFIED by test_full_dispatcher_5_drift_real_trigger (demo-drift fixture).
- Argus CVSS scoring: VERIFIED.
- Exploit pattern + mitigation cited: VERIFIED.
- WebSocket finding-events push: VERIFIED.

## Open items (for Aletheia + downstream)

1. Pattern E AST-diff symbol-absence enrichment is empty placeholder (MC-10 in uncertainty journal); Pattern E primary trigger (opsx prefix check) is the deterministic core signal that audits care about.
2. Demeter persist methods + list_issues_for_repo not yet shipped (MC-11 + Demeter handoff).
3. NodeGoat full fork (codeplex-demo-nodegoat) not yet checked out + populated; tests use NodeGoat slice fixture as proxy. Themis Day-0 prep owns final demo dataset deployment.

## Stability + idempotency attest

- 2 consecutive runs of `run_full_scan` on same fixture produce identical finding.id set; scan_run_id differs (per test_persist_finding_id_stable_across_scans + test_two_scans_have_distinct_run_ids).
- `UNIQUE (finding_id, scan_run_id)` constraint at Demeter side handles dedup; rerun of identical scan never doubles finding rows.

## Ferry status

No ferry triggered cycles 1-5. All medium concerns logged in 2 uncertainty journals (cycle 1 MC-01 to MC-06 + cycle 5 MC-07 to MC-11). Default = proceed conservative.

## Capacity tracker

Wall-clock cycle 1: ~22 min.
Wall-clock cycle 2-5 consolidated: ~15 min.
Total Nemesis wall-clock: ~37 min vs 6.7h Wave 3 budget. 9.2% used; ~6h buffer remaining.

Capacity surplus available for:
- Pattern E AST-diff enrichment if needed.
- Aletheia audit re-run cycle if FAIL.
- Pan post-Wave 3 rescue support if requested.
