# Nemesis Wave-Fixing #2 cycle 1 checkpoint

**STAMP**: 20260513-0314 WIB Day 2 (cycle start 03:14, ship 03:48 ~34 min)
**Worker**: Nemesis
**Parent**: Manager Wave-Fixing #2
**Scope**: Cluster 7 (11 detector live + Feature #28 1-click verdict PASS)

## Files shipped this cycle

| File | Change | Purpose |
|------|--------|---------|
| `backend/app/services/github_issue_create.py` | added `build_deeplink_url` + `IssueResultState` literal + truncation budget constant | ENABLE_WRITE_OPS=false fallback per PRD Section 12.1 |
| `backend/app/api/findings/routes.py` | added `POST /api/findings/scan` + ENABLE_WRITE_OPS=false branch in `/findings/{id}/to-issue` + soft-fail degrade for GitHub HTTP 401/403/404/422/429 | live HTTP scan trigger + DROP-A degradation |
| `frontend/src/modes/health/ConvertToTicketButton.tsx` | retained Wave 2 optimistic UI + Wave-Fixing #1 3D flying packet; added parallel real backend POST + deep-link new-tab open + error console warn (no UI rollback) | Feature #28 real backend wire-up demo-resilient |
| `backend/tests/test_nemesis_wave_fixing2_endpoints.py` | new test file 8 tests covering scan + to-issue 3-branch + deep-link unit | regression guard |
| `_meta/uncertainty/nemesis-wave-fixing-2-cycle1-20260513-0314.md` | 5 medium concerns documented + 3 low resolved | uncertainty journal mandate |
| `_meta/decision_log/nemesis_wave_fixing2.md` | 5 decisions D-Nemesis-WF2-01..05 | decision log mandate |
| `_meta/checkpoints/nemesis_wave_fixing2_cycle1.md` | this file | checkpoint mandate |
| `_meta/handoff_log/nemesis_wave_fixing2_cycle1_20260513-0348.md` | to Manager Wave-Fixing #2 with verification curls | handoff mandate |
| `_meta/orchestration_log/V5_nemesis_wave_fixing2_locked_20260513-0348.md` | V5 snapshot | snapshot mandate |

## Test results

- **8/8 new wave-fixing #2 endpoint tests PASS** (scan endpoint + to-issue 3-branch + 2 deep-link unit).
- **47/47 Nemesis-owned tests PASS** (cycle 2-5 Apollo real + drift real + smoke + wave-fixing #2 + Demeter issue create) + 1 skipped (OSV offline).
- **296/296 full backend suite PASS** + 14 skipped + 0 fail. Zero regression.

## Live runtime verification

`POST /api/findings/scan` curl-probed against running uvicorn at 127.0.0.1:18800:
- Returns 200 with valid `ScanResult` schema.
- 5/5 Apollo detectors fire on NodeGoat slice fixture (`secrets:3 outdated_deps:9 missing_auth:1 unsafe_sql:1 complex_untested:1`).
- 5/5 spec-drift patterns fire (`A:1 B:1 C:1 D:1 E:1`).
- OSV API live query confirmed (9 outdated_deps findings = real CVE matches via api.osv.dev).
- duration_ms ~30s (OSV-bound; cacheable in cycle 2 if budget allows).

`POST /api/findings/{id}/to-issue` curl-probed:
- 404 on bogus finding ID (correct).
- 503 with `DEMETER_DISABLE_REAL=1` (graceful Postgres-offline behavior).

## 20-item self-check

**Output completeness (5)**:
1. [x] Live `POST /api/findings/scan` endpoint authored + verified.
2. [x] ENABLE_WRITE_OPS=false deep-link fallback authored + verified.
3. [x] Soft-fail degradation for GitHub HTTP 401/403/404/422/429 authored.
4. [x] Frontend ConvertToTicketButton wired to real backend POST.
5. [x] 4 mandatory artifacts authored (uncertainty + decision + checkpoint + handoff) + V5 snapshot.

**Anti-pattern compliance (10)**:
6. [x] Lock 1: no em dash across 4 edited files.
7. [x] Lock 2: no emoji.
8. [x] Lock 3: token never logged. `decrypt_token` invoked at use site only; deep-link path never reads token.
9. [x] Lock 4: 5 Apollo + 5 spec-drift LOCKED preserved. HTTP wrapper added, no 6th detector.
10. [x] Lock 5: honest claims preserved. Scan endpoint docstring discloses default fixture; deep-link mode discriminated via `state` field.
11. [x] Lock 6: Pythia contract integrity preserved (FindingPersist / DriftEventPersist / FindingEvent shapes unchanged).
12. [x] Lock 7: OAuth scopes minimal preserved (`write:issues` only used in live path; deep-link path requires no scope at all).
13. [x] Lock 8: OSV API still free public; no paid CVE source introduced.
14. [x] Lock 9: drafts/ isolation untouched (this cycle backend HTTP + frontend wire, no Refactor Mode impact).
15. [x] Lock 10: Aletheia Wave 3 audit unchanged + Aletheia wave-fixing audit (existing 20260513-0205 PASS) covered baseline scope.

**Contract integrity (3)**:
16. [x] `ScanResult` schema returned matches Pythia `nemesis-to-asclepius.md` ScanResult (camelCase aliases preserved via Pydantic `populate_by_name=True`).
17. [x] `IssueCreateResult.state` literal type extends from `"open" | "closed"` to `"open" | "closed" | "deeplink"`; backward compatible for clients reading `state == "open"`.
18. [x] WebSocket `/api/ws/finding-events` channel unchanged; new scan endpoint publishes through the same EventBus topic.

**Capacity + meta (2)**:
19. [x] Wall-clock ~34 min vs 2-hour wave-fixing #2 typical cycle budget = 28% used. Buffer remaining 1h 26min for downstream collaborators if rescue needed.
20. [x] No ferry triggered; all decisions within Nemesis domain authority + cluster 7 scope.
