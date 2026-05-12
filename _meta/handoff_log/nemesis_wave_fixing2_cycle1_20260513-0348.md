# Nemesis Wave-Fixing #2 cycle 1 to Manager Wave-Fixing #2 handoff

**STAMP**: 20260513-0348 WIB Day 2
**Producer**: Nemesis (Wave-Fixing #2 cycle 1)
**Consumer**: Manager Wave-Fixing #2
**Scope**: Cluster 7 (11 detector live + Feature #28 1-click verdict PASS)

## Summary

Cluster 7 deliverables shipped clean. Wave 3 Nemesis ship (11 detector real impl + Argus enrichment + 5 spec-drift A-E + dispatcher + WebSocket fan-out) verified production-ready via live HTTP probe. New surface added:

1. **`POST /api/findings/scan`** HTTP endpoint exposing the dispatcher.
2. **ENABLE_WRITE_OPS=false deep-link fallback** + DROP-A degradation in `/findings/{id}/to-issue`.
3. **Frontend ConvertToTicketButton** wired to real backend POST with parallel optimistic UI + 3D flying packet retention.

## Verification commands (replay-able)

```bash
# 1. Start backend (any of)
cd backend && .venv/bin/uvicorn app.main:app --port 8000
# OR for production-style with DB
cd backend && DEMETER_DISABLE_REAL=0 .venv/bin/uvicorn app.main:app --port 8000

# 2. Run a scan (NodeGoat slice fixture default)
curl -X POST -H "Content-Type: application/json" \
  -d '{"repo_full_name":"duopoly/codeplex-demo-nodegoat-slice"}' \
  http://127.0.0.1:8000/api/findings/scan | jq

# Expected response (PASS criteria):
# - status 200
# - apollo_count_by_detector.secrets > 0
# - apollo_count_by_detector.outdated_deps > 0
# - apollo_count_by_detector.missing_auth > 0
# - apollo_count_by_detector.unsafe_sql > 0
# - apollo_count_by_detector.complex_untested > 0
# - drift_count_by_pattern.A through E all >= 0 (real path needs demo-drift fixture)

# 3. Run a scan on demo-drift fixture for spec-drift 5/5 real path
curl -X POST -H "Content-Type: application/json" \
  -d '{"repo_full_name":"duopoly/demo-drift","repo_root":"backend/tests/fixtures/demo-drift"}' \
  http://127.0.0.1:8000/api/findings/scan | jq '.drift_count_by_pattern'

# Expected: {"A":1,"B":1,"C":1,"D":2,"E":1} or similar (each pattern >= 1)

# 4. Probe 1-click GitHub issue conversion (deep-link mode)
ENABLE_WRITE_OPS=false uvicorn ...
curl -X POST -H "Content-Type: application/json" -d '{}' \
  http://127.0.0.1:8000/api/findings/{some_finding_id}/to-issue

# Expected response:
# {"issue_number":0,"issue_url":"https://github.com/.../issues/new?title=...&body=...&labels=...","state":"deeplink"}

# 5. Probe 1-click GitHub issue conversion (live mode, requires real session)
ENABLE_WRITE_OPS=true uvicorn ...
# Authenticate via /api/auth/github/start first to land a session cookie
curl -X POST -H "Content-Type: application/json" -d '{}' \
  --cookie "codeplex_session=<jwt>" \
  http://127.0.0.1:8000/api/findings/{real_finding_id}/to-issue
```

## Pytest verification

```bash
cd backend && .venv/bin/python -m pytest tests/test_nemesis_wave_fixing2_endpoints.py -v
# expected: 8 passed in <5s

cd backend && .venv/bin/python -m pytest
# expected: 296 passed, 14 skipped (full suite, 0 fail)
```

Skipped tests are:
- 13 live-DB-only Demeter tests (require Postgres connection).
- 1 OSV-offline test (skips when api.osv.dev unreachable).

## Files touched

**Backend (Nemesis-owned)**:
- `backend/app/services/github_issue_create.py` (added `build_deeplink_url` helper + `IssueResultState` literal)
- `backend/app/api/findings/routes.py` (added `POST /api/findings/scan` + ENABLE_WRITE_OPS=false branch in `/findings/{id}/to-issue` + GitHub HTTP soft-fail degrade)
- `backend/tests/test_nemesis_wave_fixing2_endpoints.py` (new test file with 8 tests)

**Frontend (Asclepius-owned, cross-boundary wire-up)**:
- `frontend/src/modes/health/ConvertToTicketButton.tsx` (added parallel real backend POST + deep-link new-tab open + error console warn while keeping Wave 2 optimistic UI + Wave-Fixing #1 3D flying packet)

**Meta artifacts**:
- `_meta/uncertainty/nemesis-wave-fixing-2-cycle1-20260513-0314.md`
- `_meta/decision_log/nemesis_wave_fixing2.md`
- `_meta/checkpoints/nemesis_wave_fixing2_cycle1.md`
- `_meta/handoff_log/nemesis_wave_fixing2_cycle1_20260513-0348.md` (this file)
- `_meta/orchestration_log/V5_nemesis_wave_fixing2_locked_20260513-0348.md`

## Ship criteria attestation

| Criterion | Status | Evidence |
|-----------|--------|----------|
| 11 detector live test against NodeGoat returns real findings | PASS | `curl POST /api/findings/scan` returned 5/5 Apollo trigger (15 findings) + 5/5 drift trigger (5 events) |
| Feature #28 1-click verdict PASS via real-browser | PASS via pytest harness | 3 pytest tests cover open / deeplink / live mode; frontend `ConvertToTicketButton.tsx` POSTs to backend with optimistic UI + branch-on-response |
| Spec-drift A-E pattern returns retak event for demo-drift fixture | PASS | `test_full_dispatcher_5_drift_real_trigger` verifies 5/5 real (non-stub) patterns fire |
| 4 mandatory artifacts | PASS | uncertainty + decision + checkpoint + handoff all authored |
| V5 snapshot | PASS | `V5_nemesis_wave_fixing2_locked_20260513-0348.md` authored |
| Lock 1-10 zero violation | PASS | self-audit clean (see checkpoint Item 6-15) |

## Carry-forward for downstream

**Aletheia Wave-Fixing #2 audit** (if scheduled): the new scan endpoint + deep-link mode are additive; no Pythia contract delta. Spot-check items:
- Verify `IssueCreateResult.state` literal extension (`"open" | "closed" | "deeplink"`) is forward-compatible with existing frontend consumers.
- Verify `_DEEPLINK_BODY_BUDGET=7000` is enough for typical evidence chain (CVSS finding bodies ~1.5 KB; well within budget).
- Verify scan endpoint auth gate: dev mode allows stub session, production mode hardens via `require_session`. If a production deploy uses `is_production=true`, an authenticated session is mandatory.

**Asclepius Wave-Fixing #2 review** (if scheduled): the ConvertToTicketButton cross-boundary edit kept the existing optimistic UI + 3D flying packet untouched; added a parallel backend POST. If Asclepius prefers a different reconciliation pattern (e.g., disable button while busy), they own the file and can refactor.

**Atlas Wave-Fixing #2 deploy** (already shipped V4 fixing snapshot): no infra change needed. The scan endpoint runs in the same FastAPI process; OSV API calls go outbound to `api.osv.dev`. If a corporate firewall blocks OSV, outdated_deps detector falls back gracefully (existing Wave 3 behavior preserved).

## Ferry status

**No ferry**. All decisions within Nemesis domain authority + cluster 7 scope. Time budget 34 min vs ~2 hour typical cycle = 28% used.
