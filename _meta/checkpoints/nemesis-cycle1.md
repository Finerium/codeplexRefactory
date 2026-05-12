# Nemesis Cycle 1 Checkpoint

**Authored**: 2026-05-12 21:54 WIB Day 1 evening
**Cycle**: 1 (stub ship)
**Status**: SHIP-CLEAN
**Time used**: ~22 min (spawn 21:33 to ship 21:54 + 0:01 artifact authoring)
**Budget**: 60-90 min per cycle (5 cycle x 80 min ~ 6.7h Wave 3 share). Cycle 1 used 27% of single-cycle budget.

## State snapshot

### Files authored (18 files)

```
backend/app/services/detectors/
  __init__.py                       (registry + 17-symbol export)
  types.py                          (7 Pydantic models + 4 enum + 2 constant map + alias-camelCase wire format)
  dispatcher.py                     (run_full_scan single-entry orchestrator)
  argus_security.py                 (enrich_findings security-only mutation in place)
  secrets.py                        (Apollo 1: hardcoded-secret stub)
  outdated_deps.py                  (Apollo 2: outdated-dependency stub)
  missing_auth.py                   (Apollo 3: missing-auth stub)
  unsafe_sql.py                     (Apollo 4: unsafe-sql stub)
  complex_untested.py               (Apollo 5: complex-untested stub)
  drift_a_stale_closed.py           (Pattern A stub)
  drift_b_closed_without_merge.py   (Pattern B stub)
  drift_c_spec_impl_lag.py          (Pattern C stub)
  drift_d_reopened_cycle.py         (Pattern D stub)
  drift_e_openspec_drift.py         (Pattern E stub)
  adapters/__init__.py              (4 adapter registry export)
  adapters/hades_adapter.py         (ParserAdapter + canned NodeGoat ParsedRepo fallback)
  adapters/triton_adapter.py        (TritonAdapter + canned CVSS by category + JSON parse with regex fallback)
  adapters/demeter_adapter.py       (DemeterAdapter + buffer + duck-typed real delegate)
  adapters/ws_publisher_adapter.py  (WSPublisherAdapter + EventBus topic finding_events publish + buffer)

backend/tests/
  test_nemesis_detectors_smoke.py   (14 test cases)

_meta/
  decisions/nemesis_drift_algo.md   (220 line drift algo decision doc)
  decision_log/nemesis.md           (6 cycle-1 decision entries D-Nemesis-01 to D-Nemesis-06)
  uncertainty/nemesis-cycle1-20260512-2154.md (6 medium concerns MC-01 to MC-06)
  checkpoints/nemesis-cycle1.md     (this file)
  handoff_log/wave3_nemesis_to_demeter.md     (pending next step)
  handoff_log/wave3_nemesis_to_asclepius.md   (pending next step)
  plans/nemesis-wave3-cycle-plan.md (5-cycle implementation plan)
  orchestration_log/V3_nemesis_cycle1_stub_<stamp>.md (pending V_n snapshot)
```

### Test verification

- 14/14 `tests/test_nemesis_detectors_smoke.py` PASS in 0.41s.
- 176/176 full backend test suite PASS in 1.88s (no regression to Hades / Triton / Pandora / Demeter siblings).
- All 11 detector modules importable.
- All 4 adapter modules importable with graceful fallback.
- Dispatcher importable + executable.

### 11 detector signature matrix

| Detector | File | Signature | Stub trigger output |
|---|---|---|---|
| Apollo 1 secrets | `secrets.py` | `async def detect(repo_root, parsed_repo, repo_full_name)` | 1 finding, severity critical, category hardcoded-secret |
| Apollo 2 outdated_deps | `outdated_deps.py` | same | 1 finding, severity high, category outdated-dependency, cve_reference set |
| Apollo 3 missing_auth | `missing_auth.py` | same | 1 finding, severity critical, category missing-auth |
| Apollo 4 unsafe_sql | `unsafe_sql.py` | same | 1 finding, severity critical, category unsafe-sql |
| Apollo 5 complex_untested | `complex_untested.py` | same | 1 finding, severity medium, category complex-untested |
| Argus enrich | `argus_security.py` | `async def enrich_findings(findings)` | 3 security findings get CVSS 3.1 vector + base_score + exploit_pattern + Argus mitigation appended |
| Drift A stale_closed | `drift_a_stale_closed.py` | `async def detect(repo_root, repo_full_name)` | 1 event, severity medium, file_paths set, issue_id set |
| Drift B closed_without_merge | `drift_b_closed_without_merge.py` | same | 1 event, severity medium, evidence reason field set |
| Drift C spec_impl_lag | `drift_c_spec_impl_lag.py` | same | 1 event, severity medium, evidence lag_days set |
| Drift D reopened_cycle | `drift_d_reopened_cycle.py` | same | 1 event, severity high, evidence reopened_count set |
| Drift E openspec_drift | `drift_e_openspec_drift.py` | same | 1 event, severity high, evidence bypass_commits set |

### 4 adapter status

| Adapter | Real upstream availability | Stub fallback | Singleton accessor |
|---|---|---|---|
| Hades parser | REAL `app.parsers.get_parser_service` available | canned NodeGoat ParsedRepo via `_canned_nodegoat_repo` | `get_parser_adapter()` |
| Triton LLM | REAL `app.services.llm_client.get_llm_client` available (graceful fallback when DEEPSEEK_API_KEY unset) | canned CVSS per FindingCategory + JSON parse + regex fallback | `get_triton_adapter()` |
| Demeter persist | Protocol `DemeterServiceProtocol` exists, `persist_finding` + `persist_drift_event` cycle 2 add | buffer in memory, log payload | `get_demeter_adapter()` |
| WS publisher | REAL `app.services.event_bus.get_event_bus` available, topic `finding_events` route at `app/api/websocket/finding_events.py` already subscribes | buffer in memory, log payload | `get_ws_adapter()` |

### Dispatcher pipeline verified

```
scan.started  →  parse_repo  →  Apollo x5 parallel  →  Argus enrich (security only)
            →  Drift x5 parallel  →  Demeter persist findings + drift
            →  WS publish finding.detected x5  →  scan.completed (with summary)
```

Verified by `test_websocket_publishes_scan_lifecycle` + `test_demeter_adapter_buffers_findings_and_drift`.

## 20-item self-check (Lock 10 mandatory per cycle)

1. Decision log entry for D-Nemesis-01 to D-Nemesis-06: DONE at `_meta/decision_log/nemesis.md`.
2. Uncertainty journal for 6 MC entries: DONE at `_meta/uncertainty/nemesis-cycle1-20260512-2154.md`.
3. Checkpoint authored: THIS FILE.
4. Handoff contract to Demeter + Asclepius: PENDING next step (will author + commit before stop).
5. V_n snapshot for cycle 1 ship: PENDING next step.
6. Lock 1 no em dash: grep clean (verified via post-write check hook).
7. Lock 2 no emoji: grep clean.
8. Lock 3 no silent scope narrow: 11/11 detector authored, signatures match Pythia contract.
9. Lock 4 no silent assume: uncertainty journal + drift algo doc capture all.
10. Lock 5 honest claim discipline: every cycle 1 mock labeled [STUB cycle-1] inline + dispatcher reports `cycle="stub-cycle-1"`.
11. Lock 6 capacity: 22 min used, well within budget.
12. Lock 7 Greek naming: Nemesis confirmed.
13. Lock 8 no paid services: OSV free no-auth, DeepSeek $5 throwaway.
14. Lock 9 V_n snapshot pending next step.
15. Lock 10 audit gate: Aletheia mandatory post Wave 3, audit checklist `aletheia-wave3-audit.md` referenced in plan.
16. Output matches Pythia contract schema: 14/14 test verifies enum + alias compliance.
17. Asumption documented: drift algo decision doc + uncertainty journal cover.
18. Downstream consumer aware: 2 handoff log authoring next step.
19. Frustration check: zero. Schema work + adapter work + smoke = mechanical execution, no stuck.
20. Meta-cognitive check: 14/14 + 176/176 means cycle 1 is solid. Next step = handoff + V_n + STATUS update. Then await Wave 3 sync events (Hades cycle 2 ship, Triton cycle 2 ship, Demeter cycle 2 ship) before starting Nemesis cycle 2.

## Next action

1. Author `_meta/handoff_log/wave3_nemesis_to_demeter.md` (cycle 1 stub status + Pythia schema reaffirm).
2. Author `_meta/handoff_log/wave3_nemesis_to_asclepius.md` (WebSocket FindingEvent contract reaffirm).
3. Author `_meta/orchestration_log/V3_nemesis_cycle1_stub_20260512-2154.md` per Lock 9.
4. Update `STATUS.md` "Wave 3 progress" line Nemesis from "spawn pending" to "cycle 1 stub SHIP-CLEAN".
5. Commit cycle 1 ship.

Cycle 2 wait condition: Hades + Triton + Demeter cycle 2 full ship per their handoff log entries.

## Capacity remaining

Cycle 1: 22 min used. Remaining 4 cycles x ~80 min target = ~5h 20min. Plus 30 min artifact + Aletheia gate prep = ~5h 50min budget remaining. Aligns with Wave 3 effective window ~8.7h per STATUS Wave 2 buffer carry.
