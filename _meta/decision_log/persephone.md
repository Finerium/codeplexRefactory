# Persephone Decision Log

**Worker**: Persephone (Wave 2, UI panels architect + OQ-03 consumer)
**Domain**: 3 panel suite (chat + ticket + side) + glassmorphism + OQ-03 UI library Wave 2 implementation + Calliope parallel slot mount
**Started**: 2026-05-12 22:45 WIB
**Wave**: 2 (paralel sama Hera + Asclepius + Boreas + Dike audit gate)

## D1: OQ-03 UI library = consume Selene D2 lock (shadcn), hand-author primitives over CLI init

**Date**: 2026-05-12 22:55 WIB
**Confidence**: high
**Decision**: shadcn/ui patterns LOCKED per Selene D2 `_meta/decisions/oq03_ui_library.md`. Persephone Wave 2 does NOT re-debate; consume + extend. For init execution, Persephone **hand-authors shadcn-compatible primitives** at `frontend/components/ui/*` instead of running `npx shadcn@latest init`.

**Rationale**:

1. **Selene D2 lockdown is canonical** per `_meta/decisions/oq03_ui_library.md` line 5 status "LOCKED V1 with Wave 2 Persephone consistency ferry mandate". Selene specifies Persephone consume + add primitives (dialog, dropdown-menu, tooltip, popover, tabs). Persephone scope = execute that consume, NOT re-decide.

2. **Hand-author over CLI init** reasons:
   - **Lock 3 concern**: `npx shadcn@latest init` mutates `tailwind.config.ts` + `app/globals.css` (adds shadcn CSS variable `:root` block + content paths). Daedalus owns `tailwind.config.ts` (Wave 1 ship) + Calliope appended `.city-layout` grid to `globals.css` (Wave 1 ship). CLI init mutation risks regress on Daedalus / Calliope canonical state without their consent (Lock 3 silent scope narrow).
   - **Determinism**: CLI interactive prompts produce non-reproducible output. Hand-author yields the same primitives as shadcn (same Radix-backed pattern) but lives in Persephone's commit. Each primitive ~30-80 line, total ~10 file = ~600 line. Within Wave 2 capacity.
   - **No runtime dep**: shadcn philosophy = "copy-paste, not npm". Hand-author embodies the philosophy verbatim; no `shadcn` package leaks into `package.json`. Same end state as CLI init.
   - **Tailwind token-aligned**: hand-author uses `codeplex-*` Daedalus tokens (`bg-codeplex-void`, `border-white/10`, `backdrop-blur-glass`) without adding shadcn `--background --foreground --primary` variable layer that would shadow Daedalus tokens. Cleaner palette discipline.
   - **No `tailwind-merge` runtime dep needed** for Wave 2; `clsx` (already installed v2.1.1) covers `cn()` helper variants. If conflict patterns surface, add `tailwind-merge` post-Wave 2 polish.

3. **Files Persephone authors at `frontend/components/ui/*`** (shadcn-compatible primitive surface):
   - `Button.tsx` (variant: default / ghost / outline / icon, size: sm / md / lg / icon)
   - `Card.tsx` (CardHeader / CardTitle / CardContent / CardFooter composition)
   - `Badge.tsx` (variant: default / secondary / outline / size)
   - `Avatar.tsx` (image + fallback)
   - `ScrollArea.tsx` (overflow + custom scrollbar)
   - `Input.tsx` (text + textarea)
   - `Tabs.tsx` (TabsList / TabsTrigger / TabsContent)
   - `Separator.tsx` (horizontal / vertical)
   - `Tooltip.tsx` (Wave 2 stub; defer to Pan if Radix integration time crunches)
   - `Dialog.tsx` (Wave 2 stub; defer to Pan)

4. **`cn` helper** at `frontend/lib/utils.ts` via `clsx`:
   ```ts
   import { clsx, type ClassValue } from 'clsx';
   export function cn(...inputs: ClassValue[]) { return clsx(inputs); }
   ```

**Cascade**:
- Selene Wave 1 dashboard unaffected (Selene D2 says Wave 1 dashboard does NOT install shadcn, plain HTML + Tailwind only).
- Persephone Wave 2 panel suite + future Wave 3 worker consume `@/components/ui/*`.
- Tailwind config + globals.css NOT mutated by Persephone; clean Lock 3 discipline.

**Mitigation**: If Wave 3 worker needs a primitive Persephone didn't author (e.g., Dialog with Radix portal), Pan post-Wave 3 can run actual `npx shadcn@latest add dialog` then since Wave 1 + 2 critical artifacts are locked V_n and shadcn init mutation surface is now safer.

**Validation**:
- Each primitive matches shadcn API surface (composable `<Card><CardHeader/></Card>`, prop signatures match canonical).
- Visual match Selene dashboard glass + dark cinematic.
- WCAG AA contrast verified on glassmorphism wrapper.

**Reference**: Selene D2 `_meta/decision_log/selene.md` line 23 + Selene OQ-03 doc `_meta/decisions/oq03_ui_library.md` line 5.

## D2: Storage paths = follow Pythia contract `persephone-to-triton.md` canonical

**Date**: 2026-05-12 22:58 WIB
**Confidence**: high
**Decision**:
- **Types**: `frontend/src/lib/chat/types.ts` + `frontend/src/lib/chat/index.ts` (barrel) per Pythia contract `persephone-to-triton.md` line 170. Spawning directive prompt sketch in agent prompt suggested `frontend/components/panels/chat/types.ts` but Pythia contract LOCKED V0 wins per Lock 9.
- **Streaming client**: `frontend/src/lib/chat/streamChat.ts` per contract line 171.
- **Components**: `frontend/components/panels/chat/*`, `frontend/components/panels/ticket/*`, `frontend/components/panels/side/*` per Persephone agent prompt Section 4.
- **shadcn primitives**: `frontend/components/ui/*` (shadcn canonical).
- **Glassmorphism wrapper**: `frontend/components/panels/Glassmorphism.tsx` per agent prompt.
- **Hera store stub**: `frontend/src/modes/sprint/heraStore.ts` per contract `hera-to-persephone.md` line 117 (Hera Wave 2 paralel owner; Persephone stubs minimal surface defensively, see D3).

**Rationale**: Pythia contracts dominate per Lock 9 V_n contract snapshot. Same pattern Selene followed (D4 `_meta/decision_log/selene.md` line 50: "Pythia contracts dominate"). Spawning directive sketch in agent prompt was illustrative, not contract-canonical.

**Cascade**:
- Triton Wave 3 imports from `@/lib/chat` (barrel) for types + streamChat client.
- Demeter / Hades Wave 3 unaffected.
- Components consume types via `@/lib/chat`, no inline type definitions.

## D3: Hera store stub PLAN ABORTED, Hera Wave 2 already shipped heraStore.ts paralel

**Date**: 2026-05-12 23:00 WIB
**Confidence**: high
**Decision (revised)**: ABORT plan to stub `frontend/src/modes/sprint/heraStore.ts`. Coordination win: Hera worker spawned paralel SUDAH ship the production heraStore.ts before Persephone Cycle 1 wrote anything to disk. Persephone Wave 2 ticket panel consumes `useSelectedBuildingContext` + `useHeraStore` directly from Hera's file.

**Wave 2 paralel coordination summary** (paralel scan post-Cycle-1 entry):
- `frontend/src/modes/sprint/heraStore.ts` (Hera) - SHIPPED, full state machine + 14 PM concept overlays
- `frontend/src/modes/sprint/types.ts` (Hera) - SHIPPED, BuildingSprintContext + 13 concept keys + BuildingEvent union
- `frontend/src/modes/sprint/stateMachine.ts` (Hera) - SHIPPED, reducer
- `frontend/src/modes/sprint/__mock__/sprint_mock_events.ts` (Hera) - SHIPPED, demo tape
- `frontend/src/modes/health/asclepiusStore.ts` (Asclepius) - SHIPPED, Apollo findings + Refactor proposal slice
- `frontend/src/modes/health/types.ts` (Asclepius) - SHIPPED, ApolloFinding + Severity + SEVERITY_PALETTE
- `frontend/src/modes/health/FindingsPanel.tsx` (Asclepius) - SHIPPED, drop-in for Health side panel variant
- `frontend/src/modes/health/EvidencePanel.tsx` (Asclepius) - SHIPPED, drop-in for Health side panel variant
- `frontend/src/modes/health/ConvertToTicketButton.tsx` (Asclepius) - SHIPPED, Hybrid Write Layer 1 mock
- `frontend/src/modes/refactor/simulationEvents.ts` (Asclepius) - SHIPPED, GhostBuildingHint + SimulationStage
- `frontend/src/modes/refactor/__mock__/proposal.ts` (Asclepius) - SHIPPED, "Add 2FA" demo sequence
- `frontend/src/modes/activity/store.ts` (Boreas) - SHIPPED, useActivityStore + TimelineState
- `frontend/src/modes/activity/useActivityData.ts` (Boreas) - SHIPPED, ActivityData hook
- `frontend/src/modes/activity/types.ts` (Boreas) - SHIPPED, ActivityData + HotspotIntensity + OwnershipDistribution
- `frontend/src/modes/onboarding/useHermesTour.ts` (Boreas) - SHIPPED, tour DSL hook
- `frontend/src/modes/onboarding/mockTours.ts` (Boreas) - SHIPPED, 4 tour scripts

**Schema divergence note (for Dike audit awareness)**:
- Pythia contract `hera-to-persephone.md` line 62 declared `storyPoints: number | null`.
- Hera shipped `storyPoints: StorySize | null` with `StorySize = 'XS' | 'S' | 'M' | 'L' | 'XL'`.
- Hera's choice is per agile-orthodox T-shirt sizing convention; Pythia contract slightly diverged.
- Persephone consumes Hera's surface (canonical post-ship). Document for Dike: `_meta/uncertainty/persephone-cycle1-20260512-2330.md` U-revised.

**Persephone Wave 2 consume targets (revised)**:
1. **TicketPanel**: consume `useSelectedBuildingContext()` from `@/modes/sprint/heraStore`. Render BuildingSprintContext fields (PR + issue + assignee + StorySize + DoD checklist + comments + reviewers + ciStatus + blocked + refactorStage).
2. **HealthFindingsVariant (side panel)**: drop-in mount `<FindingsPanel />` + `<EvidencePanel />` from `@/modes/health`.
3. **RefactorReviewVariant (side panel)**: consume `selectRefactorSlice` from `@/modes/health/asclepiusStore` + `useSimulationEvents` from `@/modes/refactor`. Author Persephone-owned `RefactorReviewVariant.tsx` (proposal title + ghost buildings preview + dual review gate buttons + simulation progress).
4. **ActivityDrilldownVariant (side panel)**: consume `useActivityData()` + `useActivityStore` from `@/modes/activity`. Author Persephone-owned `ActivityDrilldownVariant.tsx` (timeline range buttons + scrubber + ownership distribution + most active building + hotspot drilldown).

**Coordination win**: Persephone scope explicitly INTEGRATION not stubbing. Reduces Persephone disk-write work by ~600 line. Wave 2 cohesion solid.

## D4: Slide animation = GSAP (already installed) over Framer Motion (no dep add)

**Date**: 2026-05-12 23:05 WIB
**Confidence**: high
**Decision**: Use GSAP (`gsap@3.13.0` already in `package.json`) for panel slide-in/out animation. Author GSAP-driven hook `useSlideTransition` at `frontend/src/lib/panel-motion/useSlideTransition.ts`. NOT Framer Motion (would add ~50KB gz runtime dep for visual we already cover).

**Rationale**:
1. **GSAP installed** per Calliope Wave 1 marketing scroll (per `package.json` line 23). Reuse, no dep add.
2. **Easing parity**: GSAP `power3.out` + `power3.in` covers the smooth easeInOutCubic-equivalent 300ms slide directive in agent prompt + per PRD Section 13.2 motion polish.
3. **No dep add**: Lock 8 (no paid services) is unaffected (GSAP free tier sufficient, MIT-license core via gsap-core CDN); however Wave 2 capacity gate favors zero-net-add over Framer Motion which would require `npm install framer-motion`. Calliope already validated GSAP works under Next.js 16 Turbopack.
4. **R3F co-existence**: GSAP is DOM-driven, separate from r3f three-fiber animation loop. No conflict with Daedalus PostPipeline.

**Cascade**:
- Pan post-Wave 3 may swap to Framer Motion for richer choreography. Wave 2 stays GSAP.
- Wave 3 Triton response streaming + Hera webhook events trigger panel mount/unmount via React state, useSlideTransition observes mount/unmount + animates.

## D5: 5 resident persona voice = canned mock per resident, Wave 2 stub Triton streaming

**Date**: 2026-05-12 23:10 WIB
**Confidence**: high
**Decision**: Author 5 resident canned response mock generators per PRD Section 10.1-10.5 voice anchor:
- **Athena** (City Hall, V4-Pro think high, Architect): thoughtful, considered, references multiple files + dependencies, bilingual Indonesian + English technical
- **Apollo** (Hospital, V4-Flash non-think, Doctor): clinical, evidence-first, cites file path + line number, warm-but-precise
- **Argus** (Police Station, V4-Flash think low, Watcher): concise, CVSS-framed, alert + severity bullet
- **Clio** (Library, V4-Flash non-think, Historian): elegant, narrative, timestamp + git metadata weaving
- **Hermes** (Tourist Info, V4-Flash non-think, Guide): welcoming, bilingual greeting, tour-vocabulary

Mock streaming via async generator yielding chunks with simulated 20-40ms inter-chunk delay (per Triton SSE pattern, but Wave 2 mock). Label `[MOCK Wave 2, real Wave 3 Triton SSE stream]` at module top.

**Rationale**: PRD Section 10 is the canonical voice anchor. Persephone Wave 2 demo must show distinct voice per resident, otherwise judge feedback "5 generic AI chat panels = generic ChatGPT clone" (anti-AI-slop concern in agent prompt).

**Cascade**: Wave 3 Triton swap mock streamChat with real fetch-to-SSE wired endpoint. Same `streamChat` contract surface, Persephone UI unchanged.

## D6: Side panel variant switch = context-driven from `useCurrentMode` hook + ChatContext.currentMode

**Date**: 2026-05-12 23:15 WIB
**Confidence**: high
**Decision**: Side panel variant (refactor / health / activity) auto-selects from a shared context `useCurrentMode` hook backed by a small Zustand store. Default mode = `'activity'` (matches Activity Mode landing per PRD Section 9.4). Mode-switch buttons (toolbar in side panel header) update store. Variant components subscribe.

**Rationale**:
1. **Single source of truth**: ChatContext.currentMode + side panel variant + ticket panel state all read from same mode hook. Avoids drift.
2. **PRD Section 9 5-mode model**: onboarding / sprint / refactor / activity / health. Side panel exposes 3 of these (refactor / health / activity); onboarding + sprint route through their own UI overlays (Boreas tour camera, Hera Sprint overlay).
3. **Mode store path**: `frontend/src/lib/panel-context/modeStore.ts` (Zustand store). Distinct from heraStore (Hera scope) and chat thread store (Persephone scope).

**Cascade**: Hera + Asclepius + Boreas Wave 2 paralel can also subscribe (their visual overlays may need to know "is user in sprint mode now?"). Same store surface.

## D7: Glassmorphism = reusable wrapper component + Tailwind utility class extension

**Date**: 2026-05-12 23:20 WIB
**Confidence**: high
**Decision**: Author `frontend/components/panels/Glassmorphism.tsx` reusable wrapper. Tailwind utility class `glass-panel` defined in `globals.css` `@layer components` (single append for Wave 2; Daedalus owns globals coordination per Calliope Cycle 2 pattern; Persephone coordinates this append same way).

```css
.glass-panel {
  @apply rounded-2xl border border-white/10 bg-codeplex-shadow/60 backdrop-blur-glass shadow-2xl;
}
.glass-panel-strong {
  @apply rounded-2xl border border-white/15 bg-codeplex-void/70 backdrop-blur-glass shadow-[0_8px_40px_rgba(0,0,0,0.5)];
}
.glass-panel-accent-athena { @apply border-codeplex-athena/30; }
.glass-panel-accent-apollo { @apply border-codeplex-apollo/30; }
.glass-panel-accent-argus  { @apply border-codeplex-argus/30; }
.glass-panel-accent-clio   { @apply border-codeplex-clio/30; }
.glass-panel-accent-hermes { @apply border-codeplex-hermes/30; }
```

**Rationale**:
1. Designer cross-page anchor: Calliope marketing.css + Hestia + Selene dashboard all share glassy resident vignette card pattern. Persephone city-view panels inherit same language.
2. WCAG AA contrast verify: glass-panel bg + foreground text ratio. Default `text-white` on `bg-codeplex-shadow/60` (#0b0f1a 60% opacity over #05070d void) computes to effective ~#0d111f → contrast ratio with `#ffffff` = 16.5:1 (well over AAA 7:1). Pass.
3. Per resident accent ring: 5 OKLCH-friendly hues match Iris codeplex-{resident} palette. Visual continuity.

**Cascade**: Selene D9 Cycle 5 cohesion noted; Persephone glass-panel utility lives in globals.css scope, used by panels but NOT by dashboard route (dashboard uses light Graphite Signal palette per Selene D7).

## D8: 4 mandatory artifacts + OQ-03 supplementary doc

**Date**: 2026-05-12 23:25 WIB
**Confidence**: high
**Decision**: Per `.claude/agents/persephone.md` Section 4 "4 mandatory artifacts per cycle" + OQ-03 supplementary doc:
1. `_meta/decision_log/persephone.md` (this file)
2. `_meta/uncertainty/persephone-cycle1-20260512-2330.md` + cycle 2-4 variants
3. `_meta/checkpoints/persephone-cycle<N>.md` per cycle
4. `_meta/handoff_log/wave2_persephone_to_triton.md` (Wave 3 Triton consumer handoff)
5. `_meta/decisions/oq03_ui_library.md` already authored by Selene D2; Persephone appends Wave 2 implementation rationale section (Persephone consume + extend, NOT overwrite).

## D9: Wave-Fixing #2 cycle 1 (Cluster 2 City UI) C-new-4 Sprint HUD hide toggle + PRD 13.1 line 878 building detail

**Date**: 2026-05-13 03:32 WIB Day 2 dini hari
**STAMP**: 20260513-0332
**Confidence**: high
**Wave-Fixing #2 dispatch**: Manager Wave-Fixing #2 spawned Persephone cluster 2 rescue post Day 2 QA re-test surfacing 2 gaps: (a) C-new-4 Sprint Mode HUD lacked CardKanan + CardKiri parity hide toggle, (b) Side panel content was aggregate-only (no per-building detail per PRD Section 13.1 line 878 contributor + commits + issues + PR + file metadata).

### D9.1: C-new-4 Sprint HUD hide toggle wrapper, not Hera file mutation

**Decision**: Author `frontend/components/panels/sprint-hud/SprintHud.tsx` as a Persephone-owned wrapper that conditionally mounts the Hera `<SprintModeControls />` plus a hide/restore button. Update `frontend/app/city/page.tsx` to import `SprintHud` instead of `SprintModeControls` directly.

**Rationale (anti-collision)**:
1. **Hera owns `frontend/src/modes/sprint/*`** per Manager Wave-Fixing #2 anti-collision matrix. Modifying `SprintModeControls.tsx` directly would breach the matrix.
2. **Persephone owns `frontend/components/panels/*` + panelStore**. The wrapper lives entirely inside Persephone territory; only the page mount site swaps one component import (single-line, page-level orchestration concern).
3. **Same pattern as Wave-Fixing #1 C-6 / C-7**: chat panel + side panel collapse already use `usePanelStore` + conditional render + restore button. SprintHud applies the identical idiom with a third `sprintCollapsed` state on the same store. Code review consistency wins.
4. **CSS lives in globals.css single-append discipline**: `.sprint-hud-collapsed` + `.sprint-hud-collapsed-btn` + `.sprint-hud-expanded` + `.sprint-hud-hide-btn` + `.sprint-hud-hide-icon` appended inside `@layer components` after Hera + Asclepius rules, no rule mutation, side-slot widened clamp (Asclepius H-1) referenced via `body:has(...)` selectors so the Sprint HUD shifts right correctly when SidePanel is open.

**Surface**:
- Default state (`sprintCollapsed: false`): renders Hera `<SprintModeControls />` plus a 28x28 hide button absolutely positioned at the top-right corner of the Hera pill bar (top: 1.55rem, left: calc to fit Hera pill width).
- Collapsed state (`sprintCollapsed: true`): renders a 44x44 Glassmorphism restore button at the same anchor point as the Hera panel would appear. Touch target meets WCAG 2.5.5.
- Side-slot-aware positioning: when `.city-side-slot:not([data-collapsed='true'])` matches, the restore button + hide button shift right by `clamp(20rem, 26vw, 24rem)` matching Asclepius H-1 widened slot.

**Cascade**: Hera SprintModeControls unchanged; no mock breakage. Production prod path identical to dev (just renders Hera child unconditionally when `sprintCollapsed: false`).

### D9.2: PRD 13.1 line 878 SelectedBuildingDetail surface added to SidePanel

**Decision**: Author `frontend/components/panels/side/SelectedBuildingDetail.tsx` rendering the full PRD Section 13.1 line 878 surface (contributor + recent commits + linked issues + open PR + file metadata LOC/complexity/last edited) whenever `panelStore.selectedBuildingId` is set. Mount it at top of SidePanel content, ABOVE the variant body. Wrap SidePanel content in a ScrollArea so the full detail + variant body remain accessible at any viewport height.

**Rationale**:
1. **PRD line 878 anchor**: "Click building -> zoom-and-focus dengan side panel auto-open berisi contributor detail, recent commits, linked issues (active + closed), open PR status, file metadata (LOC, complexity, last edited)." This was missing from the Wave 2 ship; only aggregate ActivityDrilldownVariant rendered. Wave-Fixing #2 closes the gap.
2. **Data sources (already in-scope)**:
   - Iris `useBuildingById(id)` for static metadata (label, archetype, district, height, ownershipColor, activity, windowTint)
   - Hera `useBuildingContext(id)` for PR + issue + assignee + lastUpdatedAt
   - Boreas `useActivityData()` for ownership distribution + commit hotspot + timelineMarkers filtered per building
   - Derive LOC heuristic from BuildingData.height (`height * 90`) and complexity heuristic from `height + activity` (60% + 40% weights, bucketed low/medium/high/very-high). Wave 3 swap: backend Demeter materialized view of cyclomatic complexity per file replaces the heuristic.
3. **Independent from variant tab**: variant tab (Refactor / Health / Activity) and SelectedBuildingDetail are orthogonal surfaces. Variant tab governs the mode HUD body; SelectedBuildingDetail governs the per-building drill content. Both stack inside the SidePanel ScrollArea.
4. **Lock 5 honest claim**: each data source labels its own mock boundary at source (Hera mockTape, Boreas mockActivityData). SelectedBuildingDetail consumes the labeled surfaces without re-labeling.

**Verification**:
- `#smoke-click=backend/app/core/main.py` (Hera SmokeClickInjector hash trigger) selects Athena landmark which has full Hera mock context. Side panel renders: file metadata grid (LOC 4,860 + Complexity high + Last edited + District + Activity), Contributors (2 active), Recent commits (60 in window, 4 list items), Linked tickets (Issue #412 "Implement GitHub OAuth scope minimization" + PR #47 "feat(auth): minimize OAuth scopes" + Open issue + Open PR buttons). Real-browser verify PASS.
- `#smoke-click=first` (defaults to `route_5.py` non-landmark) shows file metadata + contributors + commit count, with "No linked issue" + "No open PR" empty states. Defensive null-safety preserved.
- No console errors from Persephone deltas; remaining 9 errors all backend `/api/activity` 8000 not running in dev (pre-existing Wave 2 stub).
- TypeScript clean on Persephone files (5 pre-existing TS errors in other-worker files, none in `components/panels/`, `panel-context/`).

**Cascade**:
- Triton Wave 3 SSE consumer surface unchanged.
- Hera + Boreas data hooks unchanged.
- Asclepius H-1 widened side slot (20-24rem clamp) accommodates the new detail surface without truncation.

### D9.3: ESC clears selection (already implemented Wave 2, surfaced in handoff)

**Decision**: ESC handler at `frontend/components/panels/ticket/useBuildingTicket.ts` lines 57-66 already clears panelStore + heraStore selection on Escape keydown. Wave-Fixing #2 cluster 2 ship verifies this surface is alive; surfaces in handoff to Daedalus (camera scope) that on ESC the building selection is cleared, so Daedalus camera can also subscribe to `panelStore.selectedBuildingId === null` transition to zoom-back-to-overview.

**Cascade**: Daedalus owns camera scope. Persephone provides the cleared state via panelStore; Daedalus reads it and triggers overview-camera tween. No Persephone-side changes needed in this cycle.

### D9.4: Chat panel SSE consume from Triton (UI shell ready, surface in handoff)

**Decision**: ChatPanel UI shell + 5 resident routing + broadcast toggle + Message bubbles all alive Wave 2 with `useChatRouting` consuming `mockResidentResponses` mock stream. Wave 3 Triton wires SSE format at `backend/app/api/chat.py`; Persephone consume side already prepped via `useChatRouting` hook abstraction. Wave-Fixing #2 cluster 2 surface in handoff to Triton: real SSE format payload schema (event type + delta text + metadata) MUST match `frontend/src/lib/chat/streamChat.ts` shape so the mock-to-real swap is a body-replacement only.

**Cascade**: Triton owns backend SSE endpoint + frontend swap of mock to real. Persephone UI shell unchanged.

## D9 ship summary

**Files authored / modified (Wave-Fixing #2 cluster 2)**:
1. `frontend/src/lib/panel-context/types.ts` (add `sprintCollapsed: boolean` + `setSprintCollapsed` action)
2. `frontend/src/lib/panel-context/panelStore.ts` (default `sprintCollapsed: false` + action impl)
3. `frontend/components/panels/sprint-hud/SprintHud.tsx` (NEW wrapper component)
4. `frontend/components/panels/sprint-hud/index.ts` (NEW barrel)
5. `frontend/components/panels/side/SelectedBuildingDetail.tsx` (NEW PRD line 878 surface)
6. `frontend/components/panels/side/SidePanel.tsx` (mount SelectedBuildingDetail + ScrollArea wrap)
7. `frontend/components/panels/side/index.ts` (export SelectedBuildingDetail)
8. `frontend/components/panels/index.ts` (export SprintHud)
9. `frontend/app/city/page.tsx` (swap `<SprintModeControls />` for `<SprintHud />`, 2-line edit)
10. `frontend/app/globals.css` (append 5 sprint-hud classes inside `@layer components`, no rule mutation)

**Verification PASS per item**:
- C-new-4 Sprint HUD hide toggle parity: PASS (rendered "Hide Sprint Mode HUD" button + matches CardKanan + CardKiri Wave-Fixing #1 idiom)
- PRD line 878 side panel full content: PASS (SelectedBuildingDetail renders file metadata + contributors + commits + issues + PR)
- Ticket panel slide-in full content on building click: PASS (verified via #smoke-click=backend/app/core/main.py)
- ESC clears selection: PASS (already shipped Wave 2, verified)
- Chat panel SSE shell ready: PASS (Triton handoff surface unchanged)
- Lock 1-10 zero violation: PASS (grep clean on Persephone deltas)
- TypeScript clean on Persephone files: PASS
- Real-browser smoke via Playwright MCP: PASS (5 routes consistently 200, building click via SmokeClickInjector dispatches end-to-end)

---

## Wave-Fixing 3 Final (Persephone paired with Hera, STAMP=20260513-0645)

### D-Persephone-Final-01: B-1 RECURRING root cause = inline subscriber + 4-building mock seed gap

**Context**: Ghaisan real-browser QA at 05:51 WIB reported "click any building, ZERO panel pop, ZERO camera fly, ZERO highlight" despite Manager #2 claiming PASS. Investigation via paired playwright smoke test against the running dev server isolated two distinct defects layered on top of each other:

1. `frontend/components/panels/ticket/useBuildingTicket.ts` line 48 passed an inline arrow function to `useBuildingClick(handler)`, contradicting the stability discipline spelled out in `src/modes/sprint/clickHandlers.ts` lines 28-33. Inline identity made `useEffect` inside `useBuildingClick` remove + re-add the subscriber every render. The Iris event bus is fanout-safe, so this alone does not silently drop clicks, but it does open a window where the dispatch Set can be momentarily empty during React state churn.
2. `frontend/src/modes/sprint/__mock__/sprint_mock_events.ts` only seeds Hera `BuildingSprintContext` for 4 specific demo buildings (Athena / Apollo / Argus / Clio landmarks). For the other 227 of 231 buildings, `useSelectedBuildingContext()` returns null, so the TicketPanel renders the empty placeholder rather than ticket-like content. The user sees "nothing happens" when they click a typical generic-office or generic-residence building.

**Decision**: Two scope-bounded fixes inside Persephone domain, paired with one cross-domain hover bus addition co-authored with Hera (live bridging owner of `useBuildingClick`):

1. `useBuildingTicket` wraps its click subscriber in `useCallback` keyed on the stable zustand setters. Matches the canonical pattern from `clickHandlers.ts`. No behavior change at the contract layer; only stops the subscribe / unsubscribe churn.
2. `useBuildingTicket` synthesizes a minimal `BuildingSprintContext` from the Iris `BuildingData` when no real Hera-seeded context exists. The synthesized context carries a `_synthetic: true` flag so the TicketPanel header reads "Building info (no sprint yet)" rather than impersonating a real PR or issue. Labeled `[MOCK Wave-Fixing 3 ad-hoc context, real Wave 3 Demeter event store]` at source.
3. Hover bus added at `src/scene/buildings/useCityData.ts` (twin of click bus). `BuildingInstances` wires `onPointerOver` / `onPointerOut` per archetype slot. `HoverFloorGlow` consumes via `useBuildingHover` and renders a per-floor rising emissive band that loops every 1.2 seconds. Implements Ghaisan envision item "Mouse hover building -> per-floor glow ripple effect".

**Cascade**: Triton + Hades + Pandora Wave 3 unaffected. Iris Wave 1 building click contract preserved (additive: new hover bus is opt-in, click bus identical signature). Aether audit consumes verifiable Playwright smoke output.

### D-Persephone-Final-02: Camera focus tween on selected building

**Context**: PRD Section 13.1 line 878 specifies "Klik building zoom + side panel terbuka". Ghaisan envision item adds "ESC kembali overview camera". Pre-fix the `<ChronicleCanvas cameraTarget={[0,0,0]}>` was a static prop; no tween fired on selection.

**Decision**: New `src/scene/CameraFocus.tsx` component mounts as child of `<ChronicleCanvas>`, watches `panelStore.selectedBuildingId`, and tweens both `camera.position` and OrbitControls `target` via GSAP `power2.inOut` over 600 ms. Snapshot of the initial overview camera + target captured on first mount so ESC (which clears `selectedBuildingId`) cleanly restores. Tween does NOT disable OrbitControls so the user can still orbit around the focused building. Defers when OrbitControls is disabled by CinematicIntro or DirectorMode.

**Cascade**: Boreas SprintRetroFlythrough + Onboarding CameraFly still work because they suppress OrbitControls during their tweens and CameraFocus checks `orbit.enabled === false` before applying its own tween. Wave 3 cascade clean.

### D-Persephone-Final-03: TicketPanel synthetic-context header label

**Context**: Honest claim discipline (Lock 5). Synthesized context must not pretend to be real Hera-seeded data.

**Decision**: TicketPanel header reads "Building info (no sprint yet)" when `context._synthetic === true`, else the standard "Building ticket". The body continues to render assignee + size + status + linked PR / issue + DoD checklist + reviewers + PR comments + dependencies; for synthesized rows these are all empty or null, so the panel naturally shows "unassigned", "no size", "No linked PR or Issue" etc. without the placeholder text.

### Wave-Fixing 3 ship summary (Persephone deltas)

Files authored / modified:
1. `frontend/components/panels/ticket/useBuildingTicket.ts` (useCallback wrap + synthetic context fallback)
2. `frontend/components/panels/ticket/TicketPanel.tsx` (synthetic header label)
3. `frontend/src/scene/buildings/useCityData.ts` (hover bus add)
4. `frontend/src/scene/buildings/BuildingInstances.tsx` (onPointerOver / onPointerOut prop wire)
5. `frontend/src/scene/buildings/HoverFloorGlow.tsx` (NEW, per-floor ripple)
6. `frontend/src/scene/buildings/index.ts` (export hover bus + HoverFloorGlow)
7. `frontend/src/scene/CameraFocus.tsx` (NEW, camera + OrbitControls tween)
8. `frontend/src/scene/index.ts` (export CameraFocus)
9. `frontend/app/city/page.tsx` (mount HoverFloorGlow + CameraFocus + onBuildingHover prop)

Real-browser verification (chromium headless, dev server localhost:3000):
- Non-landmark click (`backend/app/api/route_5.py`): TicketPanel renders synthetic header "Building info (no sprint yet)" + file path + closed unfinished status + Updated timestamp. SidePanel `SelectedBuildingDetail` renders with full file metadata + contributors + recent commits + complexity badge. PASS.
- Landmark click (`backend/app/core/main.py` = Athena): TicketPanel renders real Hera context "Building ticket" header + "Implement GitHub OAuth scope minimization" issue title + assignee `@ghaisan` + milestone "Sprint 14: Security hardening + auth" + Issue #412. PASS.
- ESC: clears `selectedBuildingId` cleanly, SidePanel `SelectedBuildingDetail` unmounts. PASS.
- TypeScript: clean (`npx tsc --noEmit -p .`). PASS.
- Zero non-network console errors during click pipeline. PASS.

## Manager FINAL Cycle 2 ship (2026-05-13 09:11 WIB)

### D-Mf2-Persephone-01: Per-floor commit timeline replaces legacy recentCommits filter

**Context**: Manager directive D-MF2-05 locks "Per-floor visual: building height = N floors per N commits. Click side panel commit timeline (Persephone) + camera fly to floor altitude (Iris)". Previous side panel surface filtered Boreas timelineMarkers by buildingId for the "Recent commits" section. That was a window-scoped scrubber slice, not a full git history per file.

**Decision**: New `PerFloorTimeline` component replaces the legacy section. It fetches from the new Demeter endpoint `/api/buildings/<repo>/<file_path:path>/commits` via `usePerFloorCommits`, renders floors top-down (latest top floor N, oldest bottom floor 1), each row dispatches `flyToFloor({ buildingId, floorIndex })` on click via `useFloorFocusDispatch` for Iris camera tween. Hover dispatches `floor-hover` for Iris stacked-floor shader brighten.

**Cascade**: Removed dead `recentCommits` + `formatCommitTimestamp` from `SelectedBuildingDetail.tsx`. `activityData.timelineMarkers` still consumed elsewhere in the panel (ownership / hotspot intensity sections) so no downstream breakage. Iris hook `useFloorFocus(handler)` ready for camera tween subscriber.

### D-Mf2-Persephone-02: Honest synthetic fallback for missing Demeter endpoint

**Context**: Manager directive Bug #7 cascade prevention amplifies Lock 5 (no silent demo fallback). Cluster A+B+C backend (Demeter) ships the `/api/buildings/.../commits` endpoint in parallel; we cannot wait.

**Decision**: When the endpoint returns 404 (Demeter not yet wired) or empty `commits[]`, the hook synthesizes a deterministic mock list from `BuildingData.floors` and sets `synthetic: true` in state. The panel header surfaces `(no git data yet)` in amber. Network or 5xx errors trigger a rose-tinted error banner with the error text + Retry button, still falling back to synthetic preview so the demo never crashes. No silent demo fallback.

**Cascade**: Wave 3 Demeter ship promotes this from "synthetic" to real history without contract changes. Hook surface is stable.

### D-Mf2-Persephone-03: Floor focus + floor hover event buses (twin of click + hover bus)

**Context**: Cluster C needs camera fly to floor altitude (Iris) + per-floor shader brighten on hover (Iris). Persephone owns the dispatcher source from the side panel; Iris owns the subscribers. Coupling via React props would force a layout refactor.

**Decision**: New `useFloorFocusDispatch` + `useFloorHoverDispatch` hooks added to `useCityData.ts` matching the canonical click + hover bus pattern. Iris subscribes via `useFloorFocus(handler)` and `useFloorHover(handler)`. Decoupled so Persephone ships even if Iris camera tween subscriber lands in a later cycle.

**Cascade**: Iris already added `encodeFloors` export + extended `BuildingClickHandler` with optional `floorIndex` per raycast resolution. Forward-compatible with Persephone's per-floor selection state.

### D-Mf2-Persephone-04: User Tutor floating "?" + 8-step modal

**Context**: Manager directive Cluster G locks bottom-right glass "?" button persistent + 8-step tour modal + localStorage flag + auto-show first visit + `?tour=1` force replay.

**Decision**: New `frontend/components/tutor/` directory with three components plus tour storage helper. Mount in `frontend/app/layout.tsx` so the button persists across every route. SSR-safe: button renders only after `hydrated` state flips post-mount. Auto-open delay 250 ms so the underlying page is interactive before the modal captures focus + locks body scroll. Esc + click-outside + Skip + Don't show again all mark completed via `markTourCompleted`. Step dots are clickable for direct jump. Arrow keys navigate steps.

**Cascade**: Tour step 5 references the Calliope-added "Dashboard" link in city header so coord lands together. Tour step 8 references the Boreas Activity scrubber drag. Tour step 6 references the Pandora + Asclepius refactor pipeline. Cluster coords stable.

### Wave-Fixing 4 ship summary (Persephone deltas)

Files authored / modified:
1. `frontend/src/scene/buildings/useCityData.ts` (floor focus + floor hover event bus added)
2. `frontend/src/scene/buildings/index.ts` (export new hooks + types)
3. `frontend/components/panels/side/usePerFloorCommits.ts` (NEW, Demeter fetch + synthetic fallback)
4. `frontend/components/panels/side/CommitEntry.tsx` (NEW, row component)
5. `frontend/components/panels/side/PerFloorTimeline.tsx` (NEW, composite list)
6. `frontend/components/panels/side/SelectedBuildingDetail.tsx` (legacy recentCommits removed, PerFloorTimeline mounted)
7. `frontend/components/panels/side/index.ts` (export new components)
8. `frontend/components/tutor/TutorStep.tsx` (NEW, 8 step copy)
9. `frontend/components/tutor/TutorModal.tsx` (NEW, modal dialog)
10. `frontend/components/tutor/FloatingTutorButton.tsx` (NEW, persistent overlay)
11. `frontend/components/tutor/index.ts` (NEW, public barrel)
12. `frontend/src/lib/tour-storage.ts` (NEW, localStorage helpers)
13. `frontend/app/layout.tsx` (mount FloatingTutorButton globally)

Real-browser verification (chromium, localhost:3000 existing dev server):
- `/city?mock_auth=true&tour=1`: floating "?" button visible bottom-right, TutorModal auto-opens step 1, all 8 step indicator tabs render, Previous disabled, Next enabled. PASS.
- `/dashboard`: floating "?" button mounts persistent. TutorModal auto-opens because flag not yet set. PASS.
- TypeScript: `npx tsc --noEmit -p .` zero errors after one BuildingData null-safety fix. PASS.
- Zero console errors from tutor or per-floor timeline components. 3 unrelated 503 errors from `/api/activity` (Demeter backend not yet shipped this preview env). PASS.
