# Asclepius Wave-Fixing #2 cycle 1 checkpoint

**Date**: 2026-05-13 03:13 WIB Day 2 (STAMP=20260513-0313)
**Manager**: Wave-Fixing #2
**Cluster scope**: 6 + 7 merged (Health + Refactor + Spec-drift visual surfaces)
**Verdict**: SHIP CLEAN (cycle 1 complete)

## Ship summary

### Health Mode (Cluster 7)

| Item | Status | Evidence |
|---|---|---|
| H-1 Card panel width too narrow ~280px | PASS | `.city-side-slot` clamp widened to `clamp(20rem, 26vw, 24rem)`; verified via Playwright snapshot at `/city?mock_auth=true&mode=health`: file paths like `backend/app/api/route_5.py:14-22` render single-line. |
| Bug #11 5 severity DISTINCT colors | PASS | `SEVERITY_PALETTE` remapped: critical red `#ff4757`, high orange `#ff8c42`, medium yellow `#ffd23f`, low blue `#5fa8d3`, info gray `#9ba1a8`. Verified via FindingsPanel snapshot showing 5 chip colors. |
| Apollo Findings Panel layout | PASS | Side panel with 6 findings, severity chips visible, content not truncated; scrollable list confirmed; filter chips for severity + category present. |
| Click finding evidence panel | PASS | EvidencePanel renders on findings click; file path + line + suggested fix visible. Wave-Fixing #1 ship preserved. |
| Feature #28 Convert to Ticket optimistic UI | PASS | `ConvertToTicketButton` fires `spawnFlyingPacket` (3D packet) + `markTicketed` instantly + parallel `postConvertToTicket` POST to `/api/findings/{id}/to-issue` (Nemesis backend wire). Open + deep-link + error branches handled. |
| Feature #26 Flying Animation to Backlog Office | PASS | `IssueFlyingPacketLayer` mounted always-on in /city Canvas; `SinglePacket` animates Bezier arc 1.4s + arrival pulse 450ms; default target = Athena City Hall (Backlog Office stand-in, documented). |
| Apollo+Argus complementary triage hook | DEFER | Out of cycle 1 scope. Documented in uncertainty journal; can lift in cycle 2 if manager requests. |

### Refactor Mode (Cluster 6)

| Item | Status | Evidence |
|---|---|---|
| Bug #12 Ghost runtime auto-generate | PASS | `RefactorIntentInput` (new) submits intent → Pandora SSE `streamProposal` → ghost buildings appear via `RefactorGhostLayer` (mounted in /city Canvas when `mode='refactor'`). Mock fallback preserved when backend unreachable. |
| Side panel SSE consume proposal.md | PASS via Pandora rescue | `RefactorReviewVariant` now consumes `refactorClient.streamProposal` for real-time chunk-by-chunk render. |
| Run Simulation button POST | PASS via Pandora rescue | `triggerSimulate` + `openWebsocket` wired in RefactorReviewVariant. |
| Accept / Discard buttons | PASS via Pandora rescue | `downloadAcceptDiff` + `postDiscard` wired. |
| Wave 2 UI shell preserve | PASS | DualReviewGate + SimulationProgressIndicator + GhostBuilding components unchanged. |

### Spec-Drift (added scope)

| Item | Status | Evidence |
|---|---|---|
| Feature #29 5 distinct A-E crack patterns | PASS | `SpecDriftCrackPattern` component with 5 semantically-distinct geometries (horizontal crack, dotted X, gap with glow, zigzag vertical, broken ring). Each uses unique color tint within codeplex-clio family. |
| 3 building states (solid/ghost/retak) | PASS | Solid = default Iris render; Ghost = RefactorGhostLayer transparent + dashed; Retak = SpecDriftCrackPattern overlay. All 3 states visible on /city. |
| Coordinate Boreas + Pandora | NO COLLISION | SpecDriftCrackPattern is Asclepius-owned visual only; Boreas narrates prose separately; Pandora handles ghost from refactor proposal. |

## Files authored / modified

### New

1. `frontend/src/modes/health/IssueFlyingPacket.tsx` (~280 lines)
   - `IssueFlyingPacketLayer` r3f layer + `SinglePacket` Bezier animation
   - `spawnFlyingPacket()` DOM-side dispatch + `useFlyingPackets()` r3f-side subscriber
   - Module-scope bus so DOM ConvertToTicketButton can fire 3D animation
2. `frontend/src/modes/health/SpecDriftCrackPattern.tsx` (~280 lines)
   - 5 distinct A-E crack pattern components per PRD Section 11.3
3. `frontend/src/modes/health/SpecDriftLayer.tsx` (~95 lines)
   - In-scene layer mounting one of each pattern A-E on demo buildings
4. `frontend/src/modes/refactor/RefactorIntentInput.tsx` (~310 lines, partially rewired by Pandora)
   - Asclepius authored shell + suggestion chips + thinking indicator
   - Pandora rewired to real SSE backend + mock fallback

### Modified

5. `frontend/src/modes/health/types.ts` SEVERITY_PALETTE: info `#7aa8c2` → `#9ba1a8` gray
6. `frontend/src/modes/health/index.ts` + `frontend/src/modes/refactor/index.ts` barrel exports
7. `frontend/app/globals.css` `.city-side-slot` clamp widened
8. `frontend/app/city/page.tsx` `AsclepiusBridge` component + URL `?mode=` param
9. `frontend/components/panels/side/RefactorReviewVariant.tsx` mount RefactorIntentInput (also rewired by Pandora)
10. `frontend/src/modes/health/ConvertToTicketButton.tsx` Asclepius optimistic UI hook + Nemesis backend POST wire

## Real-browser verification

- Playwright nav to `/city?mock_auth=true&mode=health` SUCCESS:
  - Side panel renders Apollo Findings panel
  - 6 findings + 2 critical + 2 high counter
  - 5 severity filter chips visible (all distinct hues)
  - 5 category filter chips visible
  - File paths render single-line (no truncation)
  - "Click a finding to see the evidence chain" hint visible
- Playwright nav to `/city?mock_auth=true&mode=refactor` SUCCESS:
  - Side panel renders Refactor SAFETY-FIRST with "No active proposal" + intent input
  - 3 suggestion chips (Add 2FA, Extract payment, Migrate to async)
  - Athena thinking indicator + Ask Athena button (disabled until intent typed)
  - "Or load canned demo proposal" fallback button
- Zero Asclepius-attributable console errors
- Backend errors only for Activity API endpoint (Boreas concern, not in scope)
- TypeScript: `npx tsc --noEmit` clean

## Lock compliance

- Lock 1 (no em dash): clean across all new files
- Lock 2 (no emoji): clean
- Lock 3 (SAFETY-FIRST visual side only; production code never changes
  from Asclepius client; Refactor production mutation lives at Pandora
  backend `/api/refactor/accept` per AD-19): clean
- Lock 4 (Severity color mapping per PRD): top 3 tiers unchanged
  (critical red / high orange / medium yellow); low + info refined for
  distinctness within PRD silence on those 2 tiers
- Lock 5 (mock labels): all new mock data labels `[MOCK Wave-Fixing #2]`
  at source; Pandora's real backend wiring is real-first with mock
  fallback explicitly labeled in code comments only

## Ferry: none

## Cycle 2 candidates (if requested)

- Apollo+Argus escalation UI (route security finding to Argus deeper triage)
- SpecDriftLayer Boreas narration prose attachment
- Dedicated Backlog Office building (Hera coordinated, allows removing
  Athena City Hall stand-in)
- Real GitHub issue create end-to-end (requires backend uvicorn online +
  GitHub OAuth token)
