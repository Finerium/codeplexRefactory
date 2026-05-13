# Decision Log: Daedalus (Wave 1)

Append-only. Each decision entry follows the template: id, date, summary, alternatives considered, chosen path, downstream impact, confidence, reference anchors.

## D1: Frontend package layout uses `frontend/` root with `app/` App Router beside `src/scene/`

**Date**: 2026-05-12 18:30 WIB
**Confidence**: High (PRD Section 17 + CLAUDE.md project structure both pin `frontend/`).

**Summary**: Frontend project lives in `frontend/` at repo root. Next.js 16 App Router is rooted at `frontend/app/`. Scene scaffold lives in `frontend/src/scene/`. Path alias `@/scene` resolves to `frontend/src/scene/index.ts`.

**Alternatives considered**:
- `frontend/src/app/` (Next.js supports this via `src/` flag): rejected because Iris already started under `frontend/src/...` and Calliope/Hestia spawned an early `src/app/layout.tsx` skeleton. To avoid conflict between two layout roots, the Daedalus root layout sits in `frontend/app/layout.tsx`. The Calliope-authored `src/app/` tree gets superseded once Calliope reads `_meta/handoff_log/wave1_daedalus_to_iris.md` plus the conventions skill.
- Single `frontend/app/scene/` colocated under App Router routes: rejected because the scene module ships TypeScript types Iris + Hera + Boreas + Persephone all consume; keeping it under `src/scene/` matches the Pythia contract storage location verbatim.

**Chosen**: `frontend/app/` for routes (App Router), `frontend/src/scene/` for Canvas + buildings (Iris subtree).

**Downstream impact**: Calliope must consume the `app/layout.tsx` written here. If Calliope ships a competing layout under `app/`, V1 Orch resolves; Daedalus does not re-author. The `src/app/layout.tsx` left by Calliope is dead code under Next.js 16 unless `pageExtensions` plus `experimental.appDir` source dir was set, which the next.config.ts here does NOT enable.

**References**: PRD Section 17.2, CLAUDE.md Architecture block, Pythia contract `daedalus-to-iris.md` Storage location.

## D2: Raw `<instancedMesh>` adopted in smoke test, signaling pattern to Iris

**Date**: 2026-05-12 18:35 WIB
**Confidence**: High (Phase B Topic D research anchor 7 r3f issue 3306, explicit lock).

**Summary**: The Daedalus smoke harness (`frontend/src/scene/__smoke__/canvas.smoke.tsx`) mounts a placeholder 8-cube city via raw `<instancedMesh>` primitive plus `setMatrixAt` plus `instanceMatrix.needsUpdate = true`. This is the same pattern Iris is expected to use across all 5 archetype meshes per the Pythia contract `iris-to-hera.md` schema.

**Alternatives considered**:
- Drei `<Instances>` plus `<Instance>` JSX: rejected per r3f issue 3306. Even at 8 cubes the smoke would set a bad precedent.
- Plain `<mesh>` cloned 8 times: rejected because the smoke explicitly exercises the InstancedMesh code path Iris will scale to 300.

**Chosen**: raw `<instancedMesh>` primitive in smoke.

**Downstream impact**: Iris BuildingInstances composite continues this pattern. Eunomia H1 audit benchmarks 60fps at 200 to 300 buildings using the same code path; Daedalus smoke verifies the path itself is correct.

**References**: Phase B Topic D anchor 7, Metis Section 8 anchor list, Pythia contract daedalus-to-iris.md Asumption 1.

## D3: Drop-first feature flag ladder uses three monotonic stages with hysteresis

**Date**: 2026-05-12 18:38 WIB
**Confidence**: High (PRD AD-12 + Section 13.4 explicit).

**Summary**: PerformanceMonitor.onChange callback delivers a 0 to 1 factor. The ladder is:
- Factor under 0.85: turn DepthOfField off.
- Factor under 0.70: drop pixel ratio cap from 2 to 1.
- Factor under 0.55: turn Sparkles tier 3 off.

Each stage has a 0.1 hysteresis band to avoid flapping. Vignette plus Noise never drop (they merge into the same EffectComposer pass cheaply). Bloom never drops (defining mood per PRD Section 13.2). Third directional light stays unless its dedicated env flag is off (not regress-driven, owner kill switch).

**Alternatives considered**:
- Drop pixel ratio first (cheapest path): rejected because PRD AD-12 + Phase B anchor 8 both lock DOF-first as the canonical order. Drop pixel ratio is stage 2 by design.
- Drop Sparkles first: rejected. Sparkles tier-3 is the most distinctive visual element per anti-AI-slop discipline; dropping it first would gut the visual identity at the lightest perf nudge.
- Continuous factor-driven blend (e.g., bokeh scale interpolation): rejected for Wave 1 scope. Binary on/off is faster to validate empirically.

**Chosen**: monotonic 3-stage ladder with hysteresis 0.1.

**Downstream impact**: Iris LOD logic reads `regressing` flag from `usePerformanceState()`; it can layer its own LOD drops on top (drop window glow detail, simplify roof geometry) without overlapping the Daedalus ladder. Hera Wave 2 PM concept overlays should NOT mount during stage 2 plus (Hera reads `qualityFactor < 0.7` as gate).

**References**: PRD AD-12, PRD Section 13.4, Phase B Topic D anchor 8.

## D4: Drei `<Environment preset="night">` chosen over custom HDR for Wave 1

**Date**: 2026-05-12 18:40 WIB
**Confidence**: High (capacity ship over polish; PRD Section 13.2 says cinematic but doesn't lock HDR file).

**Summary**: Wave 1 ships the Drei built-in "night" environment preset. Custom HDR (e.g., Poly Haven Kloofendal Misty Morning at 4K) is a Pan post-Wave 3 polish opportunity if capacity allows.

**Alternatives considered**:
- Custom HDR loaded via Drei `<Environment files="...">`: rejected for Wave 1. Adds asset hosting concerns plus a Suspense boundary that can stall the smoke boot under 3 seconds H1 assertion.
- Drei "city" preset: rejected. Bright daylight breaks the cinematic-dark mood (PRD locked dark mode default).
- Drei "sunset" preset: rejected. Beautiful but daylight tier; conflicts with night-themed Sparkles palette plus glowing window aesthetic.

**Chosen**: `<Environment preset="night" background={false}>`. background=false keeps clear color the codeplex-void hex.

**Downstream impact**: Iris ownership color encoding works against a near-black ambient. Pan post-Wave 3 may swap to custom HDR by editing one prop, zero downstream rewrite.

**References**: PRD Section 13.2 (HDRI sunset environment listed as ambitions stretch tier, not locked baseline), Pythia contract ship criteria.

## D5: PerformanceContext React Context, not Zustand store

**Date**: 2026-05-12 18:42 WIB
**Confidence**: High (Pythia contract Asumption 4 explicit lock).

**Summary**: usePerformanceState returns context value. Provider mounted INSIDE Canvas tree, so it is a child of r3f's RootState. Default value returned when used outside Canvas (graceful degradation for storybook-like isolation).

**Alternatives considered**:
- Zustand global store: rejected per Pythia Asumption 4. Performance state is local to the scene tree; cross-tree subscription not needed.
- r3f `useThree(state => state.performance)` direct: rejected because we add a 2-second debounce on top of the raw regress signal that the r3f state does not provide. Wrapping in a context lets us expose the debounced shape cleanly.

**Chosen**: React Context + custom useRegressDebounce hook.

**Downstream impact**: Iris imports `usePerformanceState` from `@/scene`. No store wiring required. If a future Wave 2 worker needs cross-tree perf state, they add a small adapter that bridges context to their own store.

**References**: Pythia contract daedalus-to-iris.md Asumption 4.

## D6: Smoke test mounts at `/__daedalus_smoke` route, removable post-audit

**Date**: 2026-05-12 18:44 WIB
**Confidence**: High.

**Summary**: `frontend/app/__daedalus_smoke/page.tsx` mounts CanvasSmokeHarness for self-validation plus Eunomia H1 60fps probe. NOT a panitia-facing route; underscore prefix signals internal usage.

**Alternatives considered**:
- Storybook setup: rejected for Wave 1 scope (would consume 30 to 60 minutes setup capacity).
- Vitest jsdom smoke: rejected because WebGL2 cannot run in jsdom; would test nothing meaningful.

**Chosen**: dedicated Next.js route for visual smoke. Pan post-Wave 3 can drop the route if PanitSubmission curation flags it.

**Downstream impact**: Eunomia audit script can probe `http://localhost:3000/__daedalus_smoke` directly with Drei `<Perf />` overlay. Calliope landing at `/` is independent.

## D7: Three.js Fog applied imperatively via useEffect, not JSX `<fog>` primitive

**Date**: 2026-05-12 18:45 WIB
**Confidence**: Medium. (See uncertainty journal entry C1.)

**Summary**: Linear fog applied via `scene.fog = new Fog(color, near, far)` inside a useEffect, cleanup sets `scene.fog = null` on unmount. The JSX `<fog>` primitive is supported but can race with HDRI environment loader on first frame (observed in r3f issue threads).

**Alternatives considered**:
- JSX `<fog attach="fog" args={[color, near, far]} />`: works in 90 percent of cases but the race with HDRI preset Suspense fallback has been observed.

**Chosen**: imperative fog set inside useEffect for deterministic ordering with environment Suspense boundary.

**References**: Uncertainty journal `_meta/uncertainty/daedalus-cycle1-20260512-1850.md` concern C1.

## D8: Wave-Fixing #2 cycle 1 brightness retune lifts ambient and exposure together

**Date**: 2026-05-13 03:14 WIB
**Confidence**: High.

**Summary**: Hafiz Screenshot1Hafiz.jpg shows a dark void in the sky around the back of the camera shot, with buildings near the horizon swallowed by fog. Manager Wave-Fixing #2 prompt mandates brightness parity with ReferensiWindows.png target frame. Three coordinated tweaks:
- `toneMappingExposure` raised from 1.25 to 1.4.
- `ambientLight.intensity` from 0.4 to 0.65, color shifted to a brighter twilight blue (`#a8c2ff`).
- Cool fill `directionalLight.intensity` from 0.7 to 0.95.
- Fog range widened: `NEAR` from 120 to 180, `FAR` from 480 to 620, color from `#0e1525` to a warmer `#15203a`.
- Added a single hemisphere light (`#7da7ff` sky / `#1b1230` ground) intensity 0.5 to give building roof tops a softer gradient instead of a single flat ambient.

**Alternatives considered**:
- Set `Environment background={true}` to paint the HDRI as sky. Rejected because the night HDRI at high intensity competes with the Bloom pass and produces blown-out highlights in the foreground.
- Add a second large mesh acting as a stand-in sky dome. Rejected because that path doubles the post-processing budget and is fragile across r3f Suspense boundaries.

**Chosen**: combined exposure + ambient + hemi + fog tune. No new scene primitive added.

**Downstream impact**: Iris BuildingInstances emissive shader (`onBeforeCompile` window grid) already tuned for warm pop against dim ambient. The lift means windows are slightly less dominant; Iris does NOT need to retune emissive intensity per body-grep of the rendered HTML which still shows the procedural window shader live.

**References**: PRD Section 13.2 (visual quality bar non-negotiable), Hafiz Screenshot1Hafiz.jpg.

## D9: Split RoadGrid out of Canvas.tsx into dedicated module with import-dep graph

**Date**: 2026-05-13 03:15 WIB
**Confidence**: High.

**Summary**: Wave-Fixing #1 cycle 1 RoadGrid was a 17-line inline function inside Canvas.tsx that emitted a gridHelper at fixed 60-division spacing. Wave-Fixing #2 cycle 1 promotes it to `frontend/src/scene/RoadGrid.tsx` and replaces the uniform grid with a deterministic import-dependency graph derived from the Iris building list. Strategy:
- Pull building list from `useCityData()` (Iris hook).
- For each active building (`activity >= 0.4`), pick 1 to 2 nearest same-district peers and emit a segment.
- For each landmark building, emit one cross-district hop to a random active building.
- Edges materialize as a single `<instancedMesh>` of tiny emissive yellow boxes, rotated to align with the segment direction.
- Mulberry32 seed locked to 20260513 so the graph is stable across reloads.

The result reads visually as glowing yellow streets snaking between building clusters, matching ReferensiWindows.png and PRD Section 13.1 mapping ("jalan glowing antar gedung = import dependency").

**Alternatives considered**:
- `THREE.LineSegments` with custom shader emitting glow: rejected because LineSegments cannot get the chunky "highway" feel ReferensiWindows.png target shows. Boxes scaled by length read better.
- Animated GLSL flow shader: rejected for Wave-Fixing scope (would consume 30 min on shader pipeline).

**Chosen**: instanced box geometry, per-edge length scale via Object3D dummy matrix.

**Downstream impact**: Wave 3 Hades parser emits real import edges; this module reads `useCityData()` so the swap is transparent (real Wave 3 will only need to update the edge derivation function, no consumer change).

**Compliance**: Lock 5 [MOCK Wave 1 import dependency edges, real Wave 3 Hades parser emits actual import graph via Demeter event store].

**References**: PRD Section 13.1 mapping, ReferensiWindows.png, prior `_meta/decision_log/daedalus.md` D6 anti-collision Iris ownership.

## D10: Split TreeScatter into dedicated module with district-coverage density

**Date**: 2026-05-13 03:15 WIB
**Confidence**: High.

**Summary**: Wave-Fixing #1 cycle 1 TreeScatter was a 90-line inline function emitting a uniform random ring of 160 cones. Wave-Fixing #2 cycle 1 promotes to `frontend/src/scene/TreeScatter.tsx` with three layered scatter strategies:
- Per-district clusters: each district gets `coverage * 18` trees inside its bounds where `coverage` is a stable djb2-hash mock value 0..1. Districts with high coverage feel "rimbun".
- Plaza filler: 30 trees scattered in the inner 8..30 radius around origin so the city center has a park feel.
- Outer ring belt: 140 trees in 150..260 radius so the city is framed by green.

Per PRD Section 13.1: "Pohon antar district | Density map ke test coverage (district well-tested rimbun, tanpa test botak)".

**Alternatives considered**:
- Single uniform scatter (Wave-Fixing #1 approach): rejected because it does not encode the test-coverage signal PRD calls for.
- GPU instancing with point sprites: rejected; ConeGeometry instancing already cheap at ~270 trees total.

**Chosen**: layered scatter with per-district density.

**Downstream impact**: Wave 3 Demeter event store replaces `mockCoverage(districtId)` with a measured per-district coverage value. Module consumer signature unchanged.

**Compliance**: Lock 5 [MOCK Wave 1 district test-coverage density, real Wave 3 Demeter event store].

**References**: PRD Section 13.1 mapping.

## D11: FlyingCars (Tier 2 stretch) shipped at single draw call cost

**Date**: 2026-05-13 03:16 WIB
**Confidence**: Medium. (See uncertainty entry on perf budget overlap with InstancedMesh BuildingInstances.)

**Summary**: New module `frontend/src/scene/FlyingCars.tsx` mounts 30 small emissive boxes orbiting at altitude 50..80 along 4 concentric loops with 4 lanes each. Per-instance color encodes a 5-microservice palette (amber Athena, mint Apollo, rose Argus, teal Clio, violet Hermes). `useFrame` updates the matrix every frame using a parametric circle formula with phase offset per car.

Per PRD Section 13.3 Tier 2: "Flying cars THREE.InstancedMesh ~30 cars looping along glowing yellow paths, color per microservice represent inter-district API call live". Manager Wave-Fixing #2 marks defer-able if capacity; we shipped because the math + draw count is cheap.

**Alternatives considered**:
- Bezier paths instead of circles: rejected because the Wave-Fixing window does not have capacity for path authoring + spline math; concentric loops read as cyberpunk flight lanes and ship the visual punch.
- Skip flying cars entirely: rejected because the visual delta is large and the cost is < 1 ms per frame.

**Chosen**: 4-ring concentric loops, 4 lanes per ring, single InstancedMesh.

**Downstream impact**: Wave 3 Demeter event store can replace `deriveCarConfigs()` with a function that streams real API-call source / destination pairs. Path math swap is local.

**Compliance**: Lock 5 [MOCK Wave 1 microservice color palette, real Wave 3 Demeter event store].

**References**: PRD Section 7.3 Stretch Tier 2, PRD Section 13.3.

## D12: CinematicIntro defers DOF + skip-on-input contract

**Date**: 2026-05-13 03:16 WIB
**Confidence**: High.

**Summary**: New module `frontend/src/scene/CinematicIntro.tsx` runs a 5-second GSAP camera glide from `[180, 12, 220]` (far sea-level pose) through `[130, 28, 180]` (midpoint) to the parent-provided `finalPosition`. OrbitControls disabled during play, restored on complete or user skip (any keydown or pointerdown).

Per PRD Section 7.3 Stretch Tier 1: "Cinematic intro 5 detik first load (camera glide low altitude masuk city center, residents wake-up sequence)". The wake-up lights sequence is wired indirectly via the existing Iris BuildingInstances emissive ramp; this module owns only the camera arc.

**Alternatives considered**:
- Custom requestAnimationFrame loop with manual easing: rejected; GSAP timeline gives ease functions out-of-box and the dependency is already in package.json (3.13.0).
- React-spring `useSpring` with chained keyframes: rejected; GSAP timeline composes more cleanly with the existing OrbitControls instance.

**Chosen**: GSAP timeline, OrbitControls disabled during play, skip-to-end on input.

**Downstream impact**: ChronicleCanvasProps gains `enableIntro` prop default true. Wave 2 + Wave 3 consumers (Calliope, Hestia, Selene preview corner mounts) can pass `enableIntro={false}` if they do not want the glide.

**References**: PRD Section 7.3 Stretch Tier 1, PRD Section 13.3.

## D13: DirectorMode auto-fly button + store for cross-tree state

**Date**: 2026-05-13 03:17 WIB
**Confidence**: High.

**Summary**: New module `frontend/src/scene/DirectorMode.tsx` ships two components:
1. `DirectorModeButton`: DOM-overlay pill mounted OUTSIDE the Canvas (sibling of ChronicleCanvas in `app/city/page.tsx`). Click toggles a `useDirectorStore().playing` flag.
2. `DirectorModeRunner`: lives INSIDE the Canvas, subscribes to the store. When playing flips true it runs a GSAP timeline visiting the 5 landmark resident buildings (Athena, Apollo, Argus, Clio, Hermes) for ~5s each plus 1.4s travel between, total ~25..30s.

Per PRD Section 7.3 Stretch Tier 1: "Director mode auto-fly through 5 highlights (pitch sendiri tanpa manual click)". Manager Wave-Fixing #2 prompt marks "super valuable pitch judge".

**Alternatives considered**:
- Single component inside Canvas with overlay rendered via `<Html>` from Drei: rejected because the button needs `position: fixed` outside the WebGL context, and Drei Html is for in-scene labels.
- Use the panel-context Zustand store: rejected because that store is Persephone-owned (anti-collision). Local `useDirectorStore` module-scoped keeps the API contained.

**Chosen**: split component with module-scoped Zustand store.

**Downstream impact**: ChronicleCanvasProps gains `enableDirectorMode` prop default true. The store API `useDirectorStore` is exported from `@/scene` barrel so any Wave 3 worker can drive the timeline programmatically.

**References**: PRD Section 7.3 Stretch Tier 1, PRD Section 13.3.

## D14: SprintModeControls collapse parity is Persephone ownership, not Daedalus

**Date**: 2026-05-13 03:18 WIB
**Confidence**: High.

**Summary**: Manager Wave-Fixing #2 prompt lists C-new-4 as Daedalus co-owned scope: "Sprint Mode panel hide toggle parity dengan CardKanan/CardKiri". Inspection of `app/city/page.tsx` shows Persephone Wave-Fixing #1 already shipped a `<SprintHud />` wrapper at `frontend/src/components/panels/sprint-hud` consuming `panelStore.sprintCollapsed`. Daedalus does NOT need to ship a competing collapse pattern. The remaining gap (if any) belongs to Persephone domain. Daedalus surfaces this verdict in handoff `_meta/handoff_log/wave-fixing-2_daedalus_to_manager-wf2_${STAMP}.md` so Manager can ferry to Persephone if Hafiz QA round 2 surfaced a regression there.

**Alternatives considered**:
- Author a Daedalus-side `<SprintControlsCollapse />` wrapping `<SprintModeControls />`: rejected because it would create a second source of truth competing with the Persephone wrapper, exact opposite of anti-collision discipline.

**Chosen**: no Daedalus code change for C-new-4; verdict DEFERRED-to-Persephone in handoff.

**Downstream impact**: If Persephone wrapper has a regression that does NOT show up in static analysis, Manager Wave-Fixing #2 spawns a Persephone Wave-Fixing #2 worker. Out of scope for Daedalus.

**References**: `frontend/app/city/page.tsx:120`, `frontend/src/components/panels/sprint-hud/` Persephone-authored module.

## D15: ChronicleCanvasProps backward-compatible extension via 3 default-true flags

**Date**: 2026-05-13 03:18 WIB
**Confidence**: High.

**Summary**: New props `enableIntro`, `enableDirectorMode`, `enableFlyingCars` added to `ChronicleCanvasProps`, all default true. Existing callers (Calliope preview mount, Hestia, Iris smoke, Daedalus smoke) continue to work without code change because the defaults match the new behavior.

**Alternatives considered**:
- Always-on, no prop: rejected because preview corner mounts (Calliope landing fixed background) MUST be able to disable the intro + director mode so they do not steal user input.
- Default false, opt-in via prop: rejected because the explicit user intent for /city route is "ship the full cinematic" and adding the prop everywhere would be churn.

**Chosen**: default true with prop override for preview contexts.

**Downstream impact**: Calliope marketing landing should consider passing `enableIntro={false} enableDirectorMode={false}` when the marketing page mounts ChronicleCanvas as a corner preview. Iris smoke can stay default. Documented in handoff.

**References**: Pythia contract `daedalus-to-iris.md` Output schema (the contract permits additive non-breaking changes to ChronicleCanvasProps).

## D16: Road edge derivation extracted to shared `roadEdges.ts`, FlyingCars rides the lit corridors

**Date**: 2026-05-13 09:04 WIB
**Confidence**: High.
**Cycle**: Manager FINAL Cycle 2 STAMP 20260513-0857

**Summary**: Ghaisan caps-lock directive "JARAK ANTAR KOTANYA LEBIH DILEBARIN LAGI, JALANNYA HARUS KELIATAN DAN MOBILNYA" demands the road network is visually obvious and the cars ride the roads, not orbit at altitude. Three coordinated edits:

1. New module `frontend/src/scene/roadEdges.ts` exports `deriveRoadEdges(buildings) -> RoadEdge[]` with each edge carrying `fromX/fromZ/toX/toZ/length/yaw`. Same algorithm as the previous inline implementation in `RoadGrid.tsx` (district peer short edges plus landmark long hops, Mulberry32 seeded stamp 20260513_0857) but length and yaw are pre-computed once so `FlyingCars` can interpolate without recomputing.
2. `RoadGrid.tsx` rewritten to consume `deriveRoadEdges`. Visibility bumped: thickness 0.6 to 1.2, emissive 1.4 to 2.8, height 0.08 to 0.18, ROAD_Y_OFFSET 0.02 to 0.05 to avoid z-fight at the higher emissive. Ground plane envelope 800 to 900 unit so the asphalt skirt extends past the widened 380 unit city.
3. `FlyingCars.tsx` rewritten end to end. Previous version had each car follow an independent circular orbit at altitude 50 to 80; new version assigns each car a starting edge plus parametric `t in [0, 1]`, advances `t` by `speed * delta / edge.length`, hops to a fresh deterministic edge on `t >= 1` with carryover so motion is continuous through building handovers. Hover altitude 0.85 unit above the road, gentle bob ~0.18 amplitude, 1.2 x 0.4 x 0.55 BoxGeometry, 5-color mock microservice palette unchanged. Frame-rate independent via `delta = elapsedTime - lastTime` with first-frame and tab-resume safety cap.

**Alternatives considered**:
- Keep orbital cars at altitude, just bump emissive: rejected. The Ghaisan caps-lock spec was explicit that cars must follow roads; orbiting cars do not solve the "JALANNYA HARUS KELIATAN DAN MOBILNYA" coupling.
- Use Three.js `CatmullRomCurve3` per edge for smoother turns: rejected because the mock graph has straight segment edges, the smoothing would add allocation per frame per car for a visual gain that is invisible at the [0, 130, 220] camera distance. Linear interpolation is fine.
- Re-derive edges inside `FlyingCars` independently: rejected because two independent derivations risk drifting out of sync if Wave 3 Hades swaps the edge source. Single source of truth via shared module.

**Chosen**: shared `roadEdges.ts` module, both `RoadGrid` and `FlyingCars` consume `deriveRoadEdges`. Linear interpolation between edge endpoints. Deterministic seeding.

**Downstream impact**:
- Wave 3 Hades parser replaces `deriveRoadEdges` body with a Demeter event-store-backed implementation that emits real import dependencies. The function signature `(BuildingData[]) => RoadEdge[]` stays stable, so RoadGrid and FlyingCars require zero downstream change. Documented in handoff.
- Iris LOD and per-floor hover scope unchanged; Iris does not touch this module.
- Hera Sprint overlay can subscribe to a future `useRoadEdges()` hook if a PR animation needs to know the edge graph. Out of scope for this cycle.

**References**: Manager FINAL Cycle 2 directive `_meta/orchestration_log/manager_final_cycle2_directive_20260513-0857.md` Cluster E Daedalus row.

## D17: Default camera position bumped from [0, 50, 80] to [0, 130, 220] to frame the widened city

**Date**: 2026-05-13 09:04 WIB
**Confidence**: High.
**Cycle**: Manager FINAL Cycle 2 STAMP 20260513-0857

**Summary**: Iris widened the city canvas from 320x320 to 380x380 unit and bumped STREET_GAP 3.6 to 5.2 + MIN_FOOTPRINT 2.4 to 3.4. The CityPage explicit `cameraPosition` already mounts at [0, 130, 220] but `DEFAULT_CAMERA_POSITION` in `Canvas.tsx` still held [0, 50, 80], a frame that sits inside the widened district padding and swallows the rooflines. Bumped the default so smoke harnesses, marketing preview embeds, and any caller that mounts ChronicleCanvas without an explicit `cameraPosition` resolves the whole 380 unit city at first paint.

**Alternatives considered**:
- Leave default at [0, 50, 80] and document the requirement to pass explicit cameraPosition: rejected. Default values are part of the contract surface; surprising callers with a default that no longer matches the city scale is a downstream foot-gun.
- Drop the default entirely (force callers to specify): rejected. Pythia contract `daedalus-to-iris.md` explicitly typed `cameraPosition?` as optional. Breaking that would cascade to Calliope landing + Iris smoke + Daedalus smoke + every preview embed.

**Chosen**: bump default to [0, 130, 220] mirroring the CityPage frame.

**Downstream impact**: Callers that need a tight close-up frame must now pass an explicit cameraPosition. Daedalus smoke (`canvas.smoke.tsx`) uses 22-unit radius placeholder buildings that will read as small dots at the new default but the smoke is dev-only and the harness author can supply a tighter cameraPosition prop when needed. CityPage already passes explicit [0, 130, 220], so no functional change there.

**References**: Pythia contract `daedalus-to-iris.md` ChronicleCanvasProps default values; Iris layout.ts STREET_GAP 5.2 + canvas envelope 380x380 (Manager FINAL Cycle 2 STAMP 20260513-0857).
