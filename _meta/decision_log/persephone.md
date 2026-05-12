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
