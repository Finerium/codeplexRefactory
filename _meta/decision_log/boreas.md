# Decision Log: Boreas (Wave 2)

**Worker**: Boreas, north wind + directed movement
**Wave**: 2 (visual mode layer, Onboarding + Activity combined)
**Spawn**: 2026-05-12, post Eunomia Wave 1 cycle 2 PASS
**Ferry budget**: HIGH bar, 5 trigger
**Effort tier**: max (orchestrator override beats YAML high frontmatter)

---

## D1: Pythia contract wins over agent.md mock types when schemas diverge

**Date**: 2026-05-12 23:00 WIB, cycle 1 plan stage.
**Decision**: Source of truth for `TourScript` + `TourWaypoint` + `TourVariant` + `ActivityData` + ownership/hotspots/timeline types is the locked Pythia contract trio (`_meta/contracts/boreas-to-triton.md`, `_meta/contracts/boreas-to-demeter.md`, `_meta/contracts/demeter-to-boreas.md`). Agent.md `.claude/agents/boreas.md` Section 3 ships a simplified schema variant for prompt brevity (`narrationCue: string`, flat hotspot record, underscore tour variants). When the two diverge, Pythia wins.

**Specific reconciliations**:
- Tour variant identifiers use hyphen + suffix per Pythia: `'generic-30sec' | 'sprint-goal' | 'feature-scoped' | 'cross-onboarding'`, NOT agent.md's `'generic_30s' | 'sprint_scoped' | ...`.
- `TourWaypoint` carries `index`, `targetBuildingId`, `cameraOffset`, `lookAtOffset`, `pauseDurationMs`, `transitionDurationMs`, `narrationPromptContext` (rich object), per Pythia. The agent.md `narrationCue: string` simplification rolls into `narrationPromptContext.purpose`.
- `ActivityData` carries `timeline` (per-day commit count series), `hotspots` (normalized intensity), `ownership` (top contributor + distribution), `summary` (aggregate stats). Agent.md's flat `timeRangeDays` + `intensityFactor` simplification expressed via `hotspots[].intensity`.
- `TimelineState` (UI state, internal to Boreas) follows the agent.md shape: `rangeDays: 30 | 60 | 90`, `scrubberPosition: number (0..1)`, `ownershipHeatmapActive: boolean`. This is internal UI state, no cross-wave contract.

**Why**: Item 16 of Boreas 20-item self-check is "TourScript + TourWaypoint + ActivityData + TimelineState types match Pythia contracts". Pythia is locked Wave 0 + Triton/Demeter Wave 3 will consume against the Pythia schema. Mismatch = Wave 3 cascade break.

**Cascade impact**: Triton Wave 3 implements `/api/onboarding/narration` against the Pythia `NarrationRequest` Pydantic. Demeter Wave 3 implements `/api/activity` against the Pythia `ActivityData` Pydantic. Both downstream consumer contracts are stable.

**Confidence**: HIGH. Pythia contracts are explicit, locked, signed-off Wave 0.

---

## D2: Camera fly architecture, GSAP timeline + useFrame lookAt drive

**Date**: 2026-05-12 23:05 WIB, cycle 1 plan stage.
**Decision**: Camera fly orchestration uses GSAP 3.13.0 timeline (already in `frontend/package.json`) to sequence per-waypoint `position` tween + dwell pauses, with a sibling animated `lookAtTarget` vector that drives `camera.lookAt(lookAtTarget)` inside `useFrame` each frame. OrbitControls from Drei (mounted by Daedalus ChronicleCanvas) MUST be suppressed during the fly window: we grab the singleton via `useThree(state => state.controls)` cast as `OrbitControls`-impl + flip `enabled = false` for the duration, restoring on tour complete or user-interrupt.

**Why not pure useFrame + lerp**:
- Waypoint dwell pauses (2-3s per landmark for narration legibility) are easier to compose as a GSAP timeline keyframe with `+=delay` markers than a custom phase machine inside useFrame.
- Easing curves (`power2.inOut`, `expo.inOut`) are first-class in GSAP, while useFrame + `THREE.MathUtils.lerp` requires manual cubic-bezier reconstruction.
- GSAP can run outside the r3f frame loop (uses its own ticker) but its property writes hit `camera.position.x/y/z` mutation, which r3f reads each frame without re-render. The pattern is well-established (`gsap.to(camera.position, ...)`).

**Why not @react-spring/three**:
- Already-installed dependency footprint discipline: GSAP exists, react-spring would add ~12kb.
- GSAP timeline + scrubbable API matches the deterministic waypoint script DSL better than spring physics (springs are reactive, scripts are imperative).

**Implementation detail**:
- `CameraFly` is a leaf component mounted as r3f child inside `<ChronicleCanvas>`. It receives a `TourScript` + `onComplete` callback.
- On mount: grab `state.camera` + `state.controls` via `useThree`, store as refs.
- Build GSAP timeline: for each waypoint, push (a) a `position` tween from prev to next `cameraOffset` (over `transitionDurationMs`), (b) a `lookAtTarget` tween (sibling proxy vec3) from prev to next `lookAtOffset`, (c) a `pauseDurationMs` empty interval acting as dwell.
- Use `useFrame` to call `camera.lookAt(lookAtTarget.current)` every frame so the lookAt vector tween smoothly orients the camera.
- On cleanup OR user interrupt (pointer down detected on the canvas): kill timeline, restore `OrbitControls.enabled = true`, restore camera position via OrbitControls.target sync.

**Edge case**: Daedalus's OrbitControls has `autoRotate={!paused}`. We pass `paused={true}` to ChronicleCanvas via the OnboardingMode wrapper so auto-rotate stops + we control camera directly. Cleanup restores the prop via Persephone OR our OnboardingMode wrapper.

**Confidence**: HIGH. Pattern documented + Phase B anchors hold.

---

## D3: Boreas authors `OnboardingMode` + `ActivityMode` composite client components, NOT modifying frontend/app/city/page.tsx directly

**Date**: 2026-05-12 23:10 WIB, cycle 1 plan stage.
**Decision**: Boreas produces 2 root composite client components under `frontend/src/modes/onboarding/OnboardingMode.tsx` + `frontend/src/modes/activity/ActivityMode.tsx`. These components are mode-aware overlays consumable by Persephone or a future ModeRouter; they internally split into (a) r3f children for `<ChronicleCanvas>` (CameraFly, HotspotGlow, OwnershipHeatmap, TimelineMarkers) and (b) DOM overlay siblings (HermesNarrationOverlay, EndingSummaryPanel, TourVariantRouter, TimelineScrubber).

**Why not modify page.tsx**:
- Lock 3 (no silent scope narrow) inverse: also no silent scope EXPAND. Calliope owns `frontend/app/city/page.tsx`. Modifying it without a coordinated handoff cascades to Persephone Wave 2 (who replaces side panel) and Hera Wave 2 (who mounts SprintOverlay as a child). Three workers touching the same file in parallel = collision.
- Cleaner pattern: Boreas exports composables. Persephone's Wave 2 `@side/default.tsx` swap can import + mount `<OnboardingMode />` or `<ActivityMode />` based on mode-router state. The mode-router is Persephone scope per `_meta/contracts/calliope-to-wave2-panels.md` "Open questions" line 171 (Calliope reserves slot, Persephone owns `@side/[mode]/page.tsx` dynamic route).

**Boreas integration surface for Persephone**:
- `import { OnboardingMode } from '@/modes/onboarding';`
- `import { ActivityMode } from '@/modes/activity';`
- Both accept `{ active: boolean }` prop. When `active=true`, mount Canvas children + DOM overlays. When `active=false`, render `null` so OrbitControls + Iris BuildingInstances behave normally.
- They are r3f tree mount-pattern compatible: the Canvas children portion expects to be mounted INSIDE `<ChronicleCanvas>`. The DOM overlay portion expects to be mounted OUTSIDE Canvas (on `document.body` via portal OR adjacent absolute-positioned siblings of the Canvas).
- To keep parent integration simple, the public root `OnboardingMode`/`ActivityMode` is a **DOM-side composite** that itself owns a r3f-side child via Drei `<Html>` portal pattern OR exports a sibling `OnboardingCanvasLayer` + `OnboardingDomLayer` pair.

**Final shape**:
- `OnboardingMode.tsx` exports a parent that internally mounts `<OnboardingTourLayer />` (r3f canvas-tree component, expected to render inside Canvas via React portal or by being a child of ChronicleCanvas) AND `<OnboardingHud />` (DOM overlay covering narration + ending summary + variant router).
- For Wave 2 integration: the simplest contract is **two named exports** per mode: `OnboardingCanvasLayer` (mount inside Canvas) + `OnboardingHud` (mount outside Canvas). The composite `OnboardingMode` is a convenience for testing.
- Persephone Wave 2 will mount BOTH layers from the right places in the tree (HUD in side panel slot, Canvas layer as child of ChronicleCanvas at city/page.tsx tree).

**Boreas does ship**: a smoke route `/boreas-smoke` at `frontend/app/boreas-smoke/page.tsx` that mounts BOTH onboarding + activity modes inside its own ChronicleCanvas wrap, with toggle buttons. This isolates Boreas-side verification without touching Calliope's page.tsx.

**Confidence**: HIGH. Avoids 3-worker Wave 2 collision + keeps parallel-route ownership clean.

---

## D4: Tour variant Wave 2 scope, generic-30sec fully populated + 3 placeholders shipped

**Date**: 2026-05-12 23:15 WIB, cycle 1 plan stage.
**Decision**: All 4 Pythia tour variants ship Wave 2 with deterministic mock script (per Pythia `boreas-to-triton.md` Asumption 3 + 4):
- `'generic-30sec'`: full 4 waypoint tour, ~30s total runtime, hits 4 of 5 landmarks (Athena temple + Hermes glass-cube + Apollo cross + Argus tower; Clio omitted by design = 5th landmark covered by `sprint-goal` variant which includes the recent commit cluster).
- `'sprint-goal'`: 5 waypoint tour, ~40s runtime, focuses sprint-scoped building cluster. Mock waypoints derived from `mockCityData.buildings` with `activity > 0.6` (active + recent commit proxy).
- `'feature-scoped'`: 3 waypoint tour, ~20s runtime, drills into the `frontend/src/onboarding/*` subtree as a representative feature district. Mock context `feature: 'onboarding'`.
- `'cross-onboarding'`: 3 waypoint tour, ~20s runtime, tours buildings owned by `@hafiz` (the mock CODEOWNERS handle). Mock context `targetUsername: 'hafiz'`.

**Top-3 district pick algorithm Wave 2 mock**:
- Per Pythia `boreas-to-triton.md` Asumption 4: `score = (ownership concentration * 0.5) + (recent activity intensity * 0.5)`.
- Wave 2 Boreas implements deterministic top-3 pick from `mockCityData.districts` ranked by aggregate sum of `building.activity` per district (proxy for activity intensity) + share of dominant owner. Mock weights pre-tuned so backend/app + frontend/src + tests land top-3 reliably across reload.
- Wave 3 Demeter swap implements real ranked query via `commit_frequency_per_building` materialized view.

**Why ship all 4**:
- Pythia Asumption 3 says only generic-30sec is mandatory + the other 3 are stretch. Wave 2 stretch budget allows shipping 3 placeholders because the script DSL itself is the deliverable; populating 4 vs 1 variant differs by ~20 lines of mock data, not architecturally significant.
- Dike Wave 2 audit item "Onboarding Mode: camera fly + Hermes narration overlay + 30-sec tour ending summary" is more defensible with 4 variants shipped (more demo-able + maps directly to PRD Section 9.1).

**Confidence**: HIGH. Mock script is bounded scope + Wave 3 swap clear.

---

## D5: Activity timeline state, zustand store

**Date**: 2026-05-12 23:20 WIB, cycle 1 plan stage.
**Decision**: Activity Mode UI state (`TimelineState`: `rangeDays`, `scrubberPosition`, `ownershipHeatmapActive`) lives in a Zustand store at `frontend/src/modes/activity/store.ts`. Zustand 5.0.13 is now in package.json (linter pass added it).

**Why Zustand not useState**:
- Multiple consumers: TimelineScrubber (DOM HUD) + HotspotGlow (Canvas tree) + OwnershipHeatmap (Canvas tree) + TimelineMarkers (Canvas tree) + ActivityMode (root) all read the same scrubberPosition + ownershipHeatmapActive. Lifting useState to ActivityMode root requires prop-drilling through both DOM tree + Canvas tree which crosses the r3f boundary awkwardly.
- Zustand crosses the Canvas boundary cleanly: r3f children call `useActivityStore()` directly + DOM siblings do the same.
- Daedalus's Pythia contract Asumption 4 says "React Context (not Zustand) for performance state". That governs PerformanceContext specifically. UI mode state is a different concern + Zustand is the canonical r3f pattern for cross-tree state.

**Why not React Context for activity state**:
- 60fps frame loop reads scrubberPosition: with Context, every consumer re-renders on every change. Zustand selectors only re-render the specific consumer that selects the changed slice. For a slider drag at 60fps, this is a meaningful perf delta.

**Store shape**:
```typescript
interface ActivityStore {
  rangeDays: 30 | 60 | 90;
  scrubberPosition: number; // 0..1
  ownershipHeatmapActive: boolean;
  setRangeDays: (r: 30 | 60 | 90) => void;
  setScrubberPosition: (p: number) => void;
  toggleOwnershipHeatmap: () => void;
}
```

**Wave 3 evolution**: Demeter adds `useActivityData(rangeDays)` hook (consumes the store's rangeDays + drives `/api/activity` fetch). The hook can live alongside the store or in a sibling `useActivityData.ts` file per the Boreas file list.

**Confidence**: HIGH.

---

## D6: Hermes narration overlay, canned bilingual line bank Wave 2

**Date**: 2026-05-12 23:25 WIB, cycle 1 plan stage.
**Decision**: Wave 2 Hermes narration text is a static line bank keyed by `(variant, waypoint.index)` pair, embedded inside `frontend/src/modes/onboarding/hermesLines.ts`. Bilingual Indonesian primary + English code-switch per PRD Section 19.2. Wave 3 Triton swap replaces the static bank with `fetchWaypointNarration(tourId, waypoint)` per Pythia `boreas-to-triton.md`.

**Voice**:
- Warm welcoming guide tone, 1-3 sentence max per waypoint, ~10-20 word per sentence (legibility during 2-3s dwell).
- Specifics: cite the building label + ownership in the line ("Ini City Hall, di sini Athena tinggal. Owner @backend-team punya kontrol arsitektur backend.") so it feels grounded.
- Code-switch: Indonesian conversational + English technical terms (e.g., "main entry point", "auth district").

**Line bank** authored Wave 2:
- generic-30sec: 4 waypoint lines (intro + Athena + Apollo + Hermes intro/outro).
- sprint-goal: 5 waypoint lines pegged to mock sprint goal "Sprint X: ship auth + health monitoring".
- feature-scoped: 3 waypoint lines pegged to feature "onboarding".
- cross-onboarding: 3 waypoint lines pegged to user "@hafiz".

**Confidence**: HIGH.

---

## D7: Hotspot glow encoding, per-building emissive billboard overlay (Canvas tree)

**Date**: 2026-05-12 23:30 WIB, cycle 1 plan stage.
**Decision**: Hotspot intensity glow is implemented as per-building **billboard sprite halo** mounted as r3f children inside ChronicleCanvas, positioned at the building's centroid Y+height. Sprite uses additive blending + emissive color tinted by intensity 0..1. Size scales linearly with intensity (1.0 = 4 world units radius, 0.0 = invisible). NOT a separate post-processing pass (Daedalus EffectComposer is locked + a new post pass risks regress threshold).

**Why billboard sprites**:
- Cheap, no shadow pass cost, no shader override.
- Reads at 60fps even with 240 buildings (worst case 240 sprite if all buildings are hot; mock data has ~30% high-activity so realistic ~80 visible glows).
- Halos can be color-tinted by ownership color when `ownershipHeatmapActive=true` per D8.

**Glow tint**: When `ownershipHeatmapActive=false`, halo uses fixed ember orange `#ff9966` (matches Daedalus warm key light) for the hot signal. When `ownershipHeatmapActive=true`, halo uses `building.ownershipColor` so ownership distribution reads visually.

**Implementation**:
- `<HotspotGlow data={ActivityData} />` r3f child component reads `hotspots[]` (Wave 2 mock) + maps to `<Sprite>` per building per intensity > 0.05 threshold.
- Three.js native `<sprite>` primitive + `<spriteMaterial>` with circular texture (procedural canvas-rendered gradient + cached).
- Position: building.position[0], building.position[1] + building.height + 2, building.position[2].

**Confidence**: HIGH.

---

## D8: Ownership heatmap toggle, recolor buildings via emissive overlay sprite stack (NOT mutate setColorAt)

**Date**: 2026-05-12 23:35 WIB, cycle 1 plan stage.
**Decision**: When `ownershipHeatmapActive=true`, we DO NOT mutate Iris's `BuildingInstances` `setColorAt` calls (Iris owns that surface + per-instance color encodes ownership AND activity tint per Iris handoff). Instead, Boreas mounts an additional translucent overlay sprite per building tinted by `building.ownershipColor` that visually amplifies the ownership distribution.

**Why not setColorAt mutation**:
- Iris's `applyInstanceMatrices` in `BuildingInstances.tsx` already sets per-instance color from `ownershipColor * tintScale`. Boreas mutating it would compete with Iris's `useLayoutEffect` re-run on data change.
- Cleaner: additive overlay = pure addition, removable cleanly on toggle off, no Iris state mutation.

**Implementation**:
- `<OwnershipHeatmap data={ActivityData} active={boolean} />` r3f child.
- For each building in `data.ownership[]`: render a tall narrow translucent sprite extruded from ground to building top, color = ownership color with alpha 0.25.
- Or alternative: floor-plane circle decal per district, color = district owner color, alpha 0.3 (district-level rather than building-level reads cleaner at city scale).
- **Chose alternative**: per-district floor decal. Reads cleaner + matches PRD 9.4 "ownership concentration per distrik" wording.

**Tradeoff**: per-building granularity is lost vs the district-level signal. PRD specifies district granularity ("heatmap warna by primary contributor"), so this is faithful.

**Confidence**: HIGH.

---

## D9: Timeline scrubber drag pattern, native HTML range input + onPointerMove fallback

**Date**: 2026-05-12 23:40 WIB, cycle 1 plan stage.
**Decision**: TimelineScrubber UI uses native HTML `<input type="range">` for the primary scrubber drag (accessible + keyboard navigable + frame-accurate per step=0.001), PLUS an overlay container with onPointerMove listener for fine-grained "scrub anywhere on the timeline rail" interaction. Range markers (commit/PR/release dots) are absolute-positioned children of the rail.

**Why native range**:
- Accessibility: keyboard arrow nav + screen reader compatible.
- Mobile drag: works without custom touch handling.
- Step = 0.001 of [0,1] gives 1000 discrete scrub positions across the range (frame-accurate for 30-day range = 30 day / 1000 = 43min granularity; for 90-day = 90day/1000 = 130min, both well under "1 commit per day average".

**Markers**:
- Render `data.timelineMarkers[]` (commit/PR/release events from ActivityData) as absolute-positioned dots over the rail, color-coded by event type.
- Click marker = snap scrubber to marker timestamp + emit `selectedMarker` event to open detail panel (Wave 3 Persephone wires real expand).

**Range toggle**:
- 30/60/90 day toggle = 3 segmented button. Switching range resets scrubberPosition to 0 (start of range) per Pythia agent.md UX expectation.

**Confidence**: HIGH.

---

## D10: Ending summary panel, glassmorphism card via Drei Html portal

**Date**: 2026-05-12 23:45 WIB, cycle 1 plan stage.
**Decision**: Ending summary panel renders as a centered DOM overlay (NOT inside Canvas) when tour completes. Implementation: a regular client component mounted as DOM sibling to ChronicleCanvas inside the smoke route + the OnboardingMode composite. Glassmorphism via Tailwind classes `bg-codeplex-shadow/70 backdrop-blur-glass border border-white/10` matching the Designer cross-page anchor.

**Content**:
- Starting file path: `endingSummary.primaryEntryPath` (e.g., `backend/app/core/main.py`). Future deep-link IDE Wave 3 stretch.
- Owner contact: `endingSummary.primaryOwnerLogin` + avatar URL. Wave 2 uses mock owner `@hafiz` for generic-30sec + `@backend-team` for sprint-goal.

**Animation**: fade-in 600ms after final waypoint dwell completes. Dismiss button restores camera to default OrbitControls position.

**Confidence**: HIGH.

---

## D11: Boreas smoke route, /boreas-smoke for isolated verification

**Date**: 2026-05-12 23:50 WIB, cycle 1 plan stage.
**Decision**: Boreas authors `frontend/app/boreas-smoke/page.tsx` mounting both modes inside its own ChronicleCanvas + Iris BuildingInstances combo, plus toggle buttons to switch modes. This is Boreas-side isolated verification, similar to Iris's `/iris-smoke` + Daedalus's `/daedalus-smoke` pattern (the renamed-without-double-underscore Eunomia cycle 2 directive).

**Why not modify city/page.tsx**:
- Per D3, Calliope owns `frontend/app/city/page.tsx`. Wave 2 mode integration is Persephone scope.
- Smoke route lets Dike Wave 2 audit Boreas-side artifacts isolated from Persephone Wave 2 mounting decisions.

**Smoke route file count budget**: 1 file (`frontend/app/boreas-smoke/page.tsx`) plus the 14 file boreas-owned source files = 15 total under Boreas authorship.

**Confidence**: HIGH.

---

## Decision log status

11 decisions locked Cycle 1 plan stage. All HIGH confidence. No ferry triggered.

