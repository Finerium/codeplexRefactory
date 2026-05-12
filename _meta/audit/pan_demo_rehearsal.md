---
audit_run_id: pan-demo-rehearsal-cycle1-20260512-2355
timestamp: 2026-05-12T23:55:00+0700
auditor: Pan (post-Wave 3 universal worker)
duty: 1 of 4 (demo rehearsal 3x consecutive)
effort_tier: max
result: PASS
total_trials: 3
passed: 3
failed: 0
mid_run_recovery: false
target_url: https://duopoly.hackathon.sev-2.com
sc04_satisfied: true
ferries: 0
---

# Duty 1: Demo Rehearsal 3x Consecutive (Pan Wave 3+1)

## Summary

Pan spawn 2026-05-12 23:55 WIB Day 1 evening, ~6 min post Aletheia PASS-with-deferred handoff. Demo rehearsal SC-04 independent re-verify executed via `tests/smoke_test_e2e.py` 3x consecutive trial against live deploy `https://duopoly.hackathon.sev-2.com`.

Verdict: **PASS (3/3 trial PASS, 0 mid-run recovery)**.

## Trial timing log

| Trial | Total ms | GET / | /start | OAuth start | /city | /api/llm/health | /dashboard | /api/dashboard | Status |
|---|---|---|---|---|---|---|---|---|---|
| Trial 1 | 11908 | 11405 (cold) | 73 | 65 | 89 | 70 | 36 | 74 | PASS |
| Trial 2 | 1680 | 1279 | 73 | 58 | 48 | 77 | 75 | 69 | PASS |
| Trial 3 | 1743 | 1198 | 79 | 66 | 108 | 104 | 115 | 71 | PASS |

All 7 step PASS per trial. Trial 1 cold cache GET / dominates (11.4s), subsequent trials warm-cache sub-1.3s. All trials << 120s budget per SC-04. Variance vs Aletheia run (4264+4325+924ms) explained by independent cold-cache moment (current Pan run hits cold cache at 11.4s, decay to 1.2s by Trial 2).

## SC-04 ship criteria verification

Per PRD Section 19.2 + Atlas-to-production contract:
- [x] 3x consecutive trial run (TRIALS=3)
- [x] All trials PASS (3/3 = 100%)
- [x] No mid-run recovery in any trial (zero retry, zero error)
- [x] Total time per trial < 120 sec budget (max 11.9s observed = 10x margin)
- [x] INSECURE_TLS=1 demo workaround per D-Atlas-21 Traefik self-signed cert

## Cumulative evidence chain (Atlas + Aletheia + Pan)

| Run | Time | Trial 1 | Trial 2 | Trial 3 | Verdict |
|---|---|---|---|---|---|
| Atlas pre-flight | 23:37 WIB | 677ms | 657ms | 660ms | PASS |
| Aletheia audit | 23:45 WIB | 4264ms | 4325ms | 924ms | PASS |
| Pan re-verify | 23:55 WIB | 11908ms | 1680ms | 1743ms | PASS |

3 independent run total = 9 trial PASS, 0 fail, 0 mid-run recovery. SC-04 strict satisfied across the board.

## Browser flow Day 2 owner

Per Aletheia handoff Section "Pan task list Day 2" + this audit Section 5.2 deferred:
- Browser cert click-through on Traefik self-signed cert = manual Day 2 jam 11 (Hafiz physical operator + Ghaisan remote backup)
- Live OAuth consent walkthrough = manual Day 2 jam 11-13 with real GitHub.com redirect chain
- 1-click GitHub issue Hybrid Layer 1 flow = manual Day 2 jam 11-13

Pan HTTP smoke covers backend chain; Day 2 manual covers browser visual + interactive chain.

## Output evidence file

- `/tmp/pan_demo_rehearsal_output.txt` (full smoke test stdout dump)
- This audit doc (`_meta/audit/pan_demo_rehearsal.md`)

## V1 Orch decision

Duty 1 verdict: **PASS**. SC-04 maintained third time independent. No ferry. Pan Duty 2 (slide deck template) proceed.

Pan Day 2 jam 11 demo rehearsal hand-off: Hafiz physical operator runs browser flow with cert click-through + Hermes tour live + Health Mode 1-click issue Hybrid Layer 1. HTTP path verified clean by Pan (this Duty 1) + Atlas + Aletheia (3 independent run, 9 PASS, 0 fail).
