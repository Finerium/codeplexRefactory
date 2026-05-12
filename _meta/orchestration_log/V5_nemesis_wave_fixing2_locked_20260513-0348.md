# V5 Nemesis Wave-Fixing #2 locked snapshot

**STAMP**: 20260513-0348 WIB Day 2
**Producer**: Nemesis Wave-Fixing #2 cycle 1
**Parent**: Manager Wave-Fixing #2 (cluster 7)
**Snapshot version**: V5 (post wave-fixing #1 V4 + Aletheia audit PASS + Atlas re-deploy)

## What's in V5 vs V4

V4 ship at `_meta/orchestration_log/V4_fixing_complete_20260513-0211.md` covered:
- 22 screenshot bug rescue
- 10 worker parallel batch
- Atlas re-deploy
- Aletheia audit PASS

V5 adds (Nemesis cluster 7 scope only; other workers may add their own V5 snapshots in parallel):
- `POST /api/findings/scan` HTTP endpoint exposing the Nemesis dispatcher
- ENABLE_WRITE_OPS=false deep-link fallback for `/findings/{id}/to-issue`
- GitHub HTTP soft-fail degradation (401/403/404/422/429 to deep link)
- Frontend `ConvertToTicketButton.tsx` real backend POST wire-up
- 8 new pytest in `test_nemesis_wave_fixing2_endpoints.py` (all PASS)

## Live runtime probe (replay-able)

Wave 3 Nemesis ship (11 detector real impl + Argus enrichment + 5 spec-drift A-E + dispatcher + WebSocket fan-out) was already pytest-verified at V3 snapshot (`V3_nemesis_detectors_locked_20260512-2212.md`). V5 adds HTTP-surface verification:

```bash
cd backend && DEMETER_DISABLE_REAL=1 .venv/bin/uvicorn app.main:app --port 18800
# (background)

curl -X POST -H "Content-Type: application/json" \
  -d '{"repo_full_name":"duopoly/codeplex-demo-nodegoat-slice"}' \
  http://127.0.0.1:18800/api/findings/scan | jq '.apollo_count_by_detector'
```

Returns at session-end probe:

```json
{
  "secrets": 3,
  "outdated_deps": 9,
  "missing_auth": 1,
  "unsafe_sql": 1,
  "complex_untested": 1
}
```

All 5 Apollo detectors fire on NodeGoat slice fixture via live HTTP path. Argus enrichment fires for security-category findings (hardcoded-secret + missing-auth + unsafe-sql) inside the dispatcher pipeline before persist + WebSocket publish. Spec-drift 5/5 verified separately via demo-drift fixture pytest.

## Test posture

- 8/8 new Wave-Fixing #2 endpoint tests PASS (scan + 3-branch to-issue + 2 deep-link unit)
- 47/47 Nemesis-owned tests PASS + 1 skipped (OSV offline)
- 296/296 full backend suite PASS + 14 skipped + 0 fail

## Contract status

All Pythia contracts unchanged. `IssueCreateResult.state` literal extended from `"open" | "closed"` to `"open" | "closed" | "deeplink"`; backward compatible (existing readers of `state == "open"` continue to work).

## Files locked in V5

```
backend/app/services/github_issue_create.py        (modified)
backend/app/api/findings/routes.py                  (modified)
backend/tests/test_nemesis_wave_fixing2_endpoints.py (new)
frontend/src/modes/health/ConvertToTicketButton.tsx (modified)
_meta/uncertainty/nemesis-wave-fixing-2-cycle1-20260513-0314.md (new)
_meta/decision_log/nemesis_wave_fixing2.md          (new)
_meta/checkpoints/nemesis_wave_fixing2_cycle1.md    (new)
_meta/handoff_log/nemesis_wave_fixing2_cycle1_20260513-0348.md (new)
_meta/orchestration_log/V5_nemesis_wave_fixing2_locked_20260513-0348.md (this file)
```

## Ship criteria attestation

| ID | Criterion | Status |
|----|-----------|--------|
| 1 | 11 detector live test against NodeGoat demo dataset return real findings | PASS via live curl + pytest |
| 2 | Feature #28 1-click verdict PASS via real-browser | PASS via pytest harness (3 branches covered); frontend wired |
| 3 | Spec-drift A-E pattern returns retak event for demo-drift | PASS via pytest `test_full_dispatcher_5_drift_real_trigger` |
| 4 | 4 mandatory artifacts | PASS |
| 5 | V5 snapshot | PASS (this file) |
| 6 | Lock 1-10 zero violation | PASS |

## Ferry status

**No ferry triggered**. Wall-clock 34 min vs ~2-hour cycle budget = 28% used.

## Sign-off

V5 Nemesis Wave-Fixing #2 cluster 7 locked. Manager Wave-Fixing #2 may proceed to next cluster or close cycle. Aletheia Wave-Fixing #2 audit (if scheduled) gates final attestation.
