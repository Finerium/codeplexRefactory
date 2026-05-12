# Persephone Wave-Fixing #2 Cycle 1 Uncertainty Journal

**Worker**: Persephone (Wave-Fixing #2 Cluster 2 City UI rescue)
**Cycle**: WF2-1
**STAMP**: 20260513-0332
**Day 2 dini hari**: post Day 2 QA re-test surfacing C-new-4 + PRD 13.1 line 878 gaps

## Uncertainty items

### U1 (Medium): Building click click chain coverage in real-browser smoke

**Concern**: Playwright MCP cannot click WebGL canvas pixels precisely (raycaster + camera projection make coordinate-to-building mapping non-deterministic). The real-browser verify ship criterion #2 requires "click building -> side panel slide-in with FULL content". I cannot drive a click via the MCP tool surface.

**Mitigation applied**: Hera Wave-Fixing #2 cycle 1 already shipped `frontend/components/dev/SmokeClickInjector.tsx` which exposes `window.__codeplex_smoke_click(buildingId?)` + listens for `#smoke-click=<id>` URL hash. I leveraged this injector to dispatch a programmatic click on `backend/app/core/main.py` (Athena landmark) via `mcp__playwright__browser_navigate` to the hash URL. Result: full Side panel SelectedBuildingDetail + Ticket panel renders verified via subsequent `mcp__playwright__browser_snapshot`. End-to-end Iris bus -> Hera selectBuilding -> Persephone setSelectedBuildingId -> SelectedBuildingDetail + TicketPanel render chain PASS.

**Residual risk**: real user click on a physical 3D building face (mouse pointer on canvas) was not directly verified this cycle because MCP tooling does not support canvas raycaster click simulation. However: (a) the Iris bus is shared between SmokeClickInjector (verified) and the natural r3f `onClick` path; (b) Wave 1 Iris ship already verified the natural click via Daedalus dev console build; (c) Wave-Fixing #1 cycle Persephone confirmed building click -> ticket panel via Playwright canvas pointer.click(); (d) the dispatch entry point `useBuildingClickDispatch` is the same function consumed by both `BuildingInstances onClick` and `SmokeClickInjector`. Confidence: high that natural click works.

**Confidence**: medium (uncertainty journal entry per Persephone agent prompt confidence rubric).

### U2 (Medium): Sprint HUD collapsed state round-trip not Playwright-verified

**Concern**: I verified the `sprintCollapsed: false` (expanded) state via real-browser snapshot showing "Hide Sprint Mode HUD" button rendered. I did NOT round-trip click the hide button + verify the collapsed state renders + click restore + verify expanded returns. MCP playwright surface available to this session lacks a `browser_click` action (only navigate + snapshot + console messages).

**Mitigation applied**: code review verifies identical conditional render pattern to Wave-Fixing #1 chat panel collapse (`chatCollapsed`) + side panel collapse (`sideCollapsed`) which WERE Playwright-verified by Wave-Fixing #1 Persephone. Same panelStore + same Glassmorphism + same Tailwind class pattern + same Lucide chevron `<` / `>`. TypeScript compiles clean; CSS rules append cleanly inside `@layer components` no rule conflict; conditional render branch executes via `if (sprintCollapsed) return <collapsed>` early-return.

**Residual risk**: low. The risk that the hide button click handler doesn't fire is bounded by React standard `onClick` semantics + `setSprintCollapsed(true)` Zustand setter (identical to `setChatCollapsed` + `setSideCollapsed`).

**Confidence**: medium (would be high if Playwright click was available; uncertainty journal recommended per rubric).

### U3 (Low): Complexity heuristic accuracy

**Concern**: I derive complexity score from `BuildingData.height * 0.6 + activity * 0.4` (normalized to 0-100). This is a deterministic heuristic, NOT real cyclomatic complexity. Wave 3 swap will replace with backend Demeter materialized view.

**Mitigation applied**: title attribute on the badge says `"Complexity ${label}/100 (heuristic)"` and the badge text explicitly shows the bucket + score (e.g., "high 70/100"). This honesty surface signals to the demo that the value is heuristic. PRD line 878 says "complexity" without specifying cyclomatic vs heuristic, so the heuristic is contract-compatible.

**Confidence**: low (no risk; documentation honesty preserved).

### U4 (Low): LOC heuristic accuracy

**Concern**: I derive LOC from `BuildingData.height * 90` capped at min 10. This matches Iris's encoding direction (height encodes file size) but the exact slope is approximate.

**Mitigation applied**: same as U3, Wave 3 swap will fetch real `loc` field from Demeter `file_metadata` materialized view. Wave 2 heuristic is deterministic + demo-friendly.

**Confidence**: low.

## No ferry trigger

No critical block. No contract conflict. No anti-pattern violation. No decision outside Persephone domain. No downstream cascade risk.

Proceed conservative. Document uncertainty per Persephone agent prompt Section 4 confidence-based action rule.
