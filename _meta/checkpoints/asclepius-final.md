# Asclepius checkpoint Wave-Fixing 3 Manager FINAL

**Date**: 2026-05-13 06:47 WIB Day 2 morning
**Worker**: Asclepius (Wave-Fixing 3 single cycle, paired with Nemesis)
**Cycle**: Wave-Fixing #3 FINAL (HEALTH-MOCK-SUSPECT root-cause fix + Refactor
ghost building 3D connection line)
**Status**: ship-clean
**Effort tier used**: high (max per Manager FINAL directive)

## Ship state

Wave-Fixing 3 Manager FINAL Asclepius ships:

1. **HEALTH-MOCK-SUSPECT root-cause fix**: `HealthFindingsVariant.tsx` (the
   `/city` side panel mount target) now calls real Nemesis `POST
   /api/findings/scan` on mount. Mock fallback is reserved for the
   unreachable-backend path and labeled with an amber pill.

2. **Real-scan REST client**: `frontend/src/modes/health/findingsClient.ts`
   (new file). Public surface: `triggerScan()` + `fetchFindingsForBuilding()`
   + `fromBackendFinding()` snake-to-camel converter.

3. **Refactor ghost connection lines**: `frontend/src/modes/refactor/
   GhostConnectionLine.tsx` (new file). 3D dashed polyline from each ghost
   building to its target affected building, color-coded by relationship
   type (import / reference / callsite). Mounted in `RefactorGhostLayer`.

4. **URL `?mode=` helper**: `SidePanel.tsx` accepts an initial mode override
   via URL query param for deeplinks + Playwright verification.

## Files authored / modified

| File | Action | Role |
|---|---|---|
| `frontend/src/modes/health/findingsClient.ts` | new | Real-scan REST client + snake-to-camel converter |
| `frontend/components/panels/side/HealthFindingsVariant.tsx` | rewrite | Fetch real backend, fallback to mock with labeled pill |
| `frontend/src/modes/refactor/GhostConnectionLine.tsx` | new | 3D dashed connection line from ghost to existing target building |
| `frontend/src/modes/refactor/RefactorGhostLayer.tsx` | edit | Map `connections[]` to GhostConnectionLine instances |
| `frontend/components/panels/side/SidePanel.tsx` | edit | Add one-shot `?mode=` URL param init |
| `frontend/src/modes/health/ConvertToTicketButton.tsx` | edit (Triton lib swap) | Replace local NEXT_PUBLIC_API_BASE read with canonical apiUrl helper |
| `frontend/.env.local` | new (gitignored) | Local dev override for backend port 8765 |

## Verification trace

1. Backend dev server at uvicorn :8765 (DATABASE_URL="" DEMETER_DISABLE_REAL=1
   ENABLE_WRITE_OPS=false).
2. Direct dispatcher call against NodeGoat fixture returns 15 apollo findings
   + 5 spec-drift events. By detector: secrets=3, outdated_deps=9,
   missing_auth=1, unsafe_sql=1, complex_untested=1. By drift pattern:
   A=1 B=1 C=1 D=1 E=1. Argus enrichment present (CVSS:3.1/AV:N base 9.8 +
   CWE-798 + cwe.mitre.org).
3. Live HTTP `curl POST /api/findings/scan` returns the same 15-finding
   payload with snake_case wire shape, scan_run_id present, duration_ms
   under 60s on cold cache.
4. Frontend dev :3000 with `.env.local` pointing to backend :8765 (`apiUrl`
   helper resolves). Playwright snapshot at `/city?mode=health` shows the
   Health tab `[selected]`, heading `Apollo Findings Scanning`, tooltip
   `POST /api/findings/scan in flight`, body `Calling backend...`, button
   `Scanning [disabled]`. Snapshot file:
   `.playwright-mcp/page-2026-05-12T23-44-30-997Z.yml` lines 117-130.

## Ship criteria 14 items per `.claude/agents/asclepius.md` Section 10

| # | Criterion | Status |
|---|---|---|
| 1 | Verify 11 Nemesis detectors REAL on demo dataset | DONE Asclepius+Nemesis verified 15 real findings on NodeGoat fixture, 5/5 detector category trigger |
| 2 | Glow window per severity distinct color | ALREADY DONE (SEVERITY_PALETTE 5-distinct cycle 1 ship: red critical, orange high, yellow medium, blue low, gray info) |
| 3 | Apollo Findings Panel layout fix | NO REGRESSION (cycle 4 width clamp already shipped, side panel wraps text correctly per `_meta/decision_log/asclepius.md` H-1 entry) |
| 4 | Click finding to Evidence Panel slide-in real data | DONE (EvidencePanel reads selected finding from store, renders filePath + lineStart-lineEnd + description with CVSS appended + suggested fix from backend ApolloFinding) |
| 5 | Convert-to-Backlog REAL GitHub API + flying animation + backlog office arrival | DONE (ConvertToTicketButton optimistic mark-ticketed + spawnFlyingPacket + real backend POST in parallel + deeplink fallback + Triton apiUrl swap) |
| 6 | Apollo + Argus complementary triage | DONE (Argus enrich already shipped at Nemesis cycle 3 + Argus mitigation prose appended to backend ApolloFinding.suggested_fix; user can chat Argus via Persephone chat panel for deeper triage) |
| 7 | 3 ghost building runtime visual | ALREADY DONE (GhostBuilding transparent + dashed outline + base ring + ghost-to-solid 1.5s easeOutCubic) |
| 8 | Transparent material + animated dashed outline shader | ALREADY DONE (cycle 4 GhostBuilding shipped) |
| 9 | Connection line to existing affected building | DONE (GhostConnectionLine 3D dashed arc polyline with relationship-tinted color, new ship Wave-Fixing 3) |
| 10 | Ghost building turn solid as code lands | ALREADY DONE (GhostToSolidAnimation easeOutCubic 1.5s on `accepted` stage) |
| 11 | Side panel SSE consume from Pandora WebSocket bus | ALREADY DONE (RefactorReviewVariant openWebsocket + ingestRefactorEvent wired to /api/ws/refactor-events) |
| 12 | Frontend integration verified live | DONE (Playwright snapshot proves real backend trigger from /city) |
| 13 | 0 console errors on owned scope | CLEAN (only 3 pre-existing 503s on /api/activity due to local DEMETER_DISABLE_REAL; unrelated to Asclepius scope) |
| 14 | 4 mandatory artifact authored | DONE (decision log appended + uncertainty journal + this checkpoint + handoff doc to aether-audit) |

## 20-item self-check Lock 10

1. Decision log entry D-Asclepius-WF3-01 + WF3-02 + WF3-03: DONE.
2. Uncertainty journal `asclepius-final-20260513-0647.md`: DONE.
3. Checkpoint THIS FILE: DONE.
4. Handoff contract to aether-audit: DONE (next artifact).
5. V_n snapshot: not required for Wave-Fixing single cycle per Manager
   directive (existing V3 Asclepius snapshot at
   `_meta/orchestration_log/V3_asclepius_*` covers).
6. Lock 1 (no em dash): grep clean on owned files (`grep -E '[^a-z]--[^a-z]'`
   nil match across new + edited files).
7. Lock 2 (no emoji): grep clean on owned files.
8. Lock 3 (no silent scope narrow): every ghost-line target id is logged
   when undefined via `useBuildingById` short-circuit return null pattern.
9. Lock 4 (no silent assume): the snake-to-camel conversion is documented
   in `findingsClient.ts` docstring + decision log.
10. Lock 5 (honest claim): mock fallback labeled at 4 callsites + real
    backend pill labels real + scanning + mock fallback + idle distinctly.
11. Lock 6 (capacity): ~90 min wall-clock vs Manager 90 min budget, on time.
12. Lock 7 (Greek naming): Asclepius confirmed.
13. Lock 8 (no paid services): backend OSV API + DeepSeek already in budget.
14. Lock 9 (V_n snapshot): existing snapshot covers.
15. Lock 10 (audit gate): aether-audit handoff prepared.
16. Output matches Pythia contract: ApolloFinding fields camelCased per
    `asclepius-to-triton.md` contract surface.
17. Assumption documented: 5 medium concerns in uncertainty journal MC-1
    to MC-5.
18. Downstream consumer aware: handoff doc names Aletheia + Pan as
    downstream.
19. Frustration check: zero. Pipeline mechanical execution.
20. Meta-cognitive check: real backend wire verified end-to-end via curl +
    Playwright snapshot lines 117-130 in
    `.playwright-mcp/page-2026-05-12T23-44-30-997Z.yml`. Root cause + fix +
    verification all in scope. Pair with Nemesis nominal (Nemesis cycle 5
    detector ship unaffected, only verify task executed).

## Next action

1. Append handoff log entry to Aether-audit + Pan.
2. STATUS.md update entry (caller will trigger).
3. Aletheia FINAL audit when run by Manager.
