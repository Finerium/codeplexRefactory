# Manager FINAL Cycle 2 Nemesis Ship Report

**Worker**: Nemesis (11 detector + dispatcher)
**Cluster**: F primary
**Authored**: 2026-05-13 02:12 WIB
**Status**: SHIP CLEAN

## Scope claimed

Bug #7 cross-cluster cause #2: 10 of 11 detectors carried internal silent
canned NodeGoat fallback paths that masquerade as user repo findings
whenever the user repo lacks a recognized manifest or `.codeplex/issues.json`
fixture. Cluster A Hades fixed the endpoint layer; Cluster F Nemesis here
fixes the detector layer.

## What changed

Real-data-only policy adopted across 5 Apollo + 5 spec-drift detectors. Each
detector now returns empty list when input absent instead of canned NodeGoat
stub. Honest info-severity records preserved (framework_unknown,
rate_limit_skipped, git_unavailable) per Lock 5.

10 detector files edited:
- `backend/app/services/detectors/secrets.py`
- `backend/app/services/detectors/outdated_deps.py`
- `backend/app/services/detectors/missing_auth.py`
- `backend/app/services/detectors/unsafe_sql.py`
- `backend/app/services/detectors/complex_untested.py`
- `backend/app/services/detectors/drift_a_stale_closed.py`
- `backend/app/services/detectors/drift_b_closed_without_merge.py`
- `backend/app/services/detectors/drift_c_spec_impl_lag.py`
- `backend/app/services/detectors/drift_d_reopened_cycle.py`
- `backend/app/services/detectors/drift_e_openspec_drift.py`

3 test files updated:
- `backend/tests/test_nemesis_detectors_smoke.py` (retarget to real fixture,
  add Bug #7 regression guard `test_no_silent_canned_nodegoat_for_unknown_repo`)
- `backend/tests/test_nemesis_cycle3_full_apollo_real.py` (drop drift-5-stub
  assertion, replace with empty-or-real)
- `backend/tests/test_nemesis_wave_fixing2_endpoints.py` (switch endpoint
  scan tests from `repo_full_name`-only to explicit `demo=true`)

## Real-browser equivalent evidence

```
$ git clone --depth 1 https://github.com/gadablotnok/web-esp32log.git /tmp/web-esp32log
$ curl -X POST http://localhost:8000/api/findings/scan \
    -H "Content-Type: application/json" \
    -d '{"repo_full_name":"gadablotnok/web-esp32log","repo_root":"/tmp/web-esp32log"}'
```

Pre-fix response (broken):
- outdated_deps: 1 finding "Outdated jquery 1.4.0 with known XSS CVE" - WRONG
  (web-esp32log has no jQuery and no package.json)
- drift A-E: 5 events referencing Issue #234, #189, #312, #405 + paths like
  app/auth/oauth.ts - WRONG (none exist in web-esp32log)

Post-fix response (clean):
- apollo_count_by_detector: secrets 0, outdated_deps 0, missing_auth 1,
  unsafe_sql 0, complex_untested 1
- drift_count_by_pattern: A 0, B 0, C 0, D 0, E 0
- 2 real findings derived from actual main.ts content
- ZERO NodeGoat canned strings (verified via substring scan on response)

## Pytest smoke

```
backend/tests/test_nemesis_detectors_smoke.py 15/15 PASS
backend/tests/test_nemesis_cycle2_apollo_real.py 7/7 PASS, 1 skip
backend/tests/test_nemesis_cycle3_full_apollo_real.py 4/4 PASS
backend/tests/test_nemesis_cycle5_full_drift_real.py 8/8 PASS
backend/tests/test_nemesis_wave_fixing2_endpoints.py 8/8 PASS
Total: 41 passed, 1 skipped
```

Full backend suite: 319 passed / 14 skipped / 5 unrelated failures (parser
language pack import, graphviz / eralchemy modules not installed, openspec
env). None in Nemesis scope.

## Anti-pattern Lock compliance

- Lock 1 (no em dash): clean
- Lock 2 (no emoji): clean
- Lock 4 (5 Apollo + 5 drift contract): preserved
- Lock 5 (real-browser evidence): curl + pytest pass + new guard test
- Lock 8 (no paid CVE): unchanged, OSV only
- Lock 10 (audit trail): decision log + checkpoint + this handoff authored

## Cross-cluster handoff

- Hades Cluster A: confirmed endpoint layer hardened. No further change needed.
- Asclepius Cluster F (frontend Health + Activity consumer): now receives
  honest empty arrays when user repo lacks matching evidence. Frontend cluster
  owner must render empty state instead of falling back to client-side demo.
- Demeter Cluster A+B+C: persist contract unchanged.
- Boreas Cluster B+F: Activity Mode commit timeline real data path independent.

## Time spent

- Pre-flight + audit: ~6 min
- Fix application: ~5 min
- Curl verification + pytest cycle: ~4 min
- Deliverable authoring: ~5 min
- Total: ~20 min wall-clock (well within 25-min ferry threshold)

## Ship verdict

CLEAN. Bug #7 cross-cluster cause #2 eliminated. Detectors no longer
masquerade canned NodeGoat as user repo findings.
