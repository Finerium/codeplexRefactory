# V3 Nemesis Cycle 1 Stub Snapshot (LOCKED)

**Lock 9 compliance**: critical artifact post-cycle locked.
**Timestamp**: 2026-05-12 21:57 WIB Day 1 evening (actual `date +%Y%m%d-%H%M` capture)
**Cycle**: 1 (stub ship)
**Wave**: 3 (active spawn batch)
**Worker**: Nemesis (11 detector suite)
**Ship status**: SHIP-CLEAN
**Test status**: 14/14 Nemesis smoke PASS + 176/176 full backend suite PASS

## Ship contents (18 source files + 6 artifact files)

### Source files (backend/)

```
backend/app/services/detectors/
  __init__.py                       17-symbol registry
  types.py                          7 Pydantic + 4 Literal enum + 2 const map + camelCase wire alias
  dispatcher.py                     run_full_scan single-entry orchestrator
  argus_security.py                 enrich_findings security-only in-place mutation
  secrets.py                        Apollo 1 stub
  outdated_deps.py                  Apollo 2 stub
  missing_auth.py                   Apollo 3 stub
  unsafe_sql.py                     Apollo 4 stub
  complex_untested.py               Apollo 5 stub
  drift_a_stale_closed.py           Pattern A stub
  drift_b_closed_without_merge.py   Pattern B stub
  drift_c_spec_impl_lag.py          Pattern C stub
  drift_d_reopened_cycle.py         Pattern D stub
  drift_e_openspec_drift.py         Pattern E stub
  adapters/__init__.py              4 adapter registry
  adapters/hades_adapter.py         ParserAdapter + canned ParsedRepo
  adapters/triton_adapter.py        TritonAdapter + canned CVSS by category + JSON parse fallback
  adapters/demeter_adapter.py       DemeterAdapter + duck-typed delegate + buffer
  adapters/ws_publisher_adapter.py  WSPublisherAdapter + EventBus topic finding_events publish

backend/tests/test_nemesis_detectors_smoke.py  14 test cases
```

### Artifact files (_meta/)

```
_meta/plans/nemesis-wave3-cycle-plan.md                          5-cycle plan
_meta/decisions/nemesis_drift_algo.md                            drift algo decision doc 220 line
_meta/decision_log/nemesis.md                                    6 cycle-1 decisions
_meta/uncertainty/nemesis-cycle1-20260512-2154.md                6 medium concerns
_meta/checkpoints/nemesis-cycle1.md                              checkpoint state snapshot
_meta/handoff_log/wave3_nemesis_to_demeter.md                    Demeter schema reaffirm + cycle 2+ delivery promise
_meta/handoff_log/wave3_nemesis_to_asclepius.md                  Asclepius WS contract reaffirm + lifecycle event chain
_meta/orchestration_log/V3_nemesis_cycle1_stub_20260512-2157.md  THIS FILE
```

## Test verification

```
$ cd backend && .venv/bin/python -m pytest tests/test_nemesis_detectors_smoke.py -v
============================== 14 passed in 0.41s ==============================

$ cd backend && .venv/bin/python -m pytest -q
============================= 176 passed in 1.88s ==============================
```

## 14 Nemesis smoke test cases

1. `test_dispatcher_runs_end_to_end` - dispatcher returns ScanResult with scan_run_id + cycle=stub-cycle-1.
2. `test_5_apollo_detectors_each_trigger_once` - all 5 Apollo emit 1 finding, detector_id enum lock verified.
3. `test_5_drift_patterns_each_trigger_once` - all 5 spec-drift A-E emit 1 event each, pattern enum lock verified.
4. `test_argus_enriches_security_findings_with_cvss` - 3 security findings (hardcoded-secret + missing-auth + unsafe-sql) get CVSS 3.1 vector + base_score + exploit_pattern + Argus mitigation appended.
5. `test_non_security_findings_not_enriched_with_cvss` - outdated-dependency + complex-untested findings have cvss fields None.
6. `test_websocket_publishes_scan_lifecycle` - 1 scan.started + 5 finding.detected + 1 scan.completed, scan_run_id matches across all.
7. `test_demeter_adapter_buffers_findings_and_drift` - 5 FindingPersist + 5 DriftEventPersist captured with matching scan_run_id.
8. `test_severity_enum_lock_compliance` - all findings + drift events use 5-enum severity (critical | high | medium | low | info).
9. `test_category_enum_kebab_lock_compliance` - all Apollo findings use 5-enum kebab-case category.
10. `test_pattern_enum_lock_compliance` - all drift events use 5-enum A-E uppercase pattern.
11. `test_finding_event_payload_camelcase_aliases` - wire format JSON uses repoFullName + scanRunId + buildingId + filePath + lineStart + lineEnd camelCase.
12. `test_two_scans_have_distinct_run_ids` - scan_run_id includes time.time_ns() nonce so two scans differ.
13. `test_persist_finding_id_stable_across_scans` - finding.id stable across scans (validates UNIQUE constraint idempotency rationale).
14. `test_adapters_singleton_persistence` - 4 adapter singletons identity stable across calls.

## Schema compliance verification

| Schema | Pythia contract source | Match |
|---|---|---|
| ApolloFinding | nemesis-to-demeter consumer pattern + asclepius schema | verified per test 8 + 9 + 11 |
| FindingPersist | nemesis-to-demeter.md line 26 | verified per test 7 |
| DriftEvent | drift detector internal model | verified per test 10 |
| DriftEventPersist | nemesis-to-demeter.md line 53 | verified per test 7 |
| FindingEvent | nemesis-to-asclepius.md line 33 | verified per test 6 + 11 (camelCase alias wire format) |
| CVSSScore | triton-to-nemesis.md line 139 | verified per test 4 |
| ScanResult | dispatcher output summary | verified per test 1 + 2 + 3 |

## Anti-pattern lock compliance

- Lock 1 (no em dash): grep clean across all 18 source + 6 artifact files.
- Lock 2 (no emoji): grep clean.
- Lock 3 (no silent scope narrow): 11/11 detector authored, dispatcher orchestrates all 10 (5 Apollo + 5 drift), Argus enriches 3 security categories.
- Lock 4 (no silent assume): uncertainty journal + drift algo decision doc cover all `[INFERRED]` + `[ASSUMED]` flags.
- Lock 5 (honest claim discipline): every cycle 1 mock labeled `[STUB cycle-1]` inline in docstring + description field + `cycle="stub-cycle-1"` ScanResult tag.
- Lock 6 (capacity): 22 min used vs 60-90 min budget (27% of single-cycle budget).
- Lock 7 (Greek naming): Nemesis confirmed per anti-collision matrix (distinct from runtime Argus resident).
- Lock 8 (no paid services): OSV API free no-auth + DeepSeek $5 throwaway. No Snyk / Mend.
- Lock 9 (V_n snapshot): THIS FILE.
- Lock 10 (audit gate): Aletheia mandatory post Wave 3, audit checklist `aletheia-wave3-audit.md` line 64-77 (5 Apollo) + line 71-77 (5 drift A-E) tracked in cycle plan Cycle 5.

## Capacity tracker post cycle 1

- Cycle 1 used: ~22 min (spawn 21:33 to artifact authoring complete 21:57).
- Remaining 4 cycles target: 4 x 80 min = 320 min = 5h 20min.
- Wave 3 share for Nemesis: ~6.7h.
- Net: ~5h 20min remaining budget vs cycle 2-5 ~5h 20min plan target. On track.
- Wave 3 cumulative buffer position (from Wave 2 STATUS): ~2h ahead nominal. Wave 3 effective window ~8.7h.

## Sync events awaiting

Cycle 2 starts when (any 2 of 3 trigger green-lights):
1. Hades cycle 2 full ship handoff at `_meta/handoff_log/wave3_hades_cycle2_full.md`.
2. Triton cycle 2 full ship handoff at `_meta/handoff_log/wave3_triton_cycle2_full.md`.
3. Demeter cycle 2 full ship handoff at `_meta/handoff_log/wave3_demeter_cycle2_full.md` (adds `persist_finding` + `persist_drift_event` to DemeterServiceProtocol).

Adapter pattern means Nemesis cycle 2 can start with only Hades + Triton ready (real parser + real LLM unlock Apollo 1-3 real impl). Demeter delegation auto-binds when methods land.

## Ferry status

No ferry triggered cycle 1. All 6 medium concerns logged in uncertainty journal. Default = proceed conservative.

## Lock 9 attest

This V_n snapshot is LOCKED for cycle 1. Subsequent edits illegal per Lock 9. Cycle 2 will produce V3_nemesis_cycle2_full snapshot.
