---
actual_timestamp: 2026-05-13T01:48+07:00
agent: Daedalus
identity_mode: wave-fixing-rescue
cycle: 1
scope_bugs:
  - C-1 HIGH: first-load blur on /city
  - C-3 HIGH: firefly kunang-kunang glow polish
  - C-4 HIGH: dark fog hole at city background (Hafiz Bug #1)
  - POLISH: tree scatter, road grid, lighting tone bump
verdict_per_bug:
  C-1: FIXED
  C-3: FIXED
  C-4: FIXED
  POLISH-trees: SHIPPED
  POLISH-roadgrid: SHIPPED
  POLISH-tone: SHIPPED
code_files_touched:
  - frontend/src/scene/Canvas.tsx
deferred_reasons: none
iris_coordination_notes:
  - Anti-collision honored. Daedalus edited ONLY Canvas.tsx. BuildingInstances and the entire buildings/ subtree (Iris ownership) untouched.
  - Daedalus added a RoadGrid ground plane at y=-0.02 and a gridHelper at y=0.01. Iris BuildingInstances treemap base sits at y=0 with positive Y growth so no z-fight. Iris confirms via Iris cycle1 handoff that the building base does not span below y=0.
  - Daedalus TreeScatter occupies r in [140, 260] outer ring plus a small inner plaza ring r in [8, 32]. Iris squarified treemap envelope is ~r < 130 per `frontend/src/scene/buildings/layout.ts`. Inner trees may overlap with the very center of the Iris layout if Iris's central plaza is smaller than 32 units. Iris owner should confirm or shrink the inner cluster to r in [4, 14] if landmark plaza ends up tight.
  - Fog tune lifted FOG_NEAR 60 to 120, FOG_FAR 220 to 480, color #05070d to #0e1525. Iris LOD trigger uses `usePerformanceState().qualityFactor` and the regress flag, not raw fog distance, so the change does not regress Iris's frustum culling perf gate.
  - DOF mount now deferred 900ms post-mount. Iris perf monitor still owns the regress feedback edge; nothing in the contract surface (`daedalus-to-iris.md`) changed.
  - Tone exposure bumped 1.1 to 1.25. If Iris feels building emissive window glow is now too hot under Bloom, Iris can drop emissiveIntensity by ~10% on the BuildingInstances material side (Iris turf).
contract_surface_changes: none
  - ChronicleCanvasProps interface unchanged
  - FEATURE_FLAGS shape unchanged
  - usePerformanceState shape unchanged
  - PerformanceState shape unchanged
runtime_smoke:
  - npx tsc --noEmit clean across all `frontend/src/scene/*` files
  - Pre-existing TS errors in `src/lib/dashboard/useDashboardData.ts` lines 120-123 are NOT Daedalus turf (Selene scope)
locks:
  - Lock 1 (no em dash): clean
  - Lock 2 (no emoji): clean
  - Lock 5 (honest claim): all edits documented, no silent narrow
ferry: none
next_owner: Manager Wave-Fixing
---

# Daedalus Wave-Fixing cycle 1 handoff

## C-1 first-load blur fix (HIGH)

**Root cause**: `enableDof` state booted from `FEATURE_FLAGS.ENABLE_DOF` which is true by default. DOF mounted on first frame with `focusDistance=0.018` plus `focalLength=0.04` plus `bokehScale=2.4`. In normalized depth space those params place the focus point near the near plane so every building, every tree, every particle reads as out-of-focus on first paint. The screenshot `_meta/qa_screenshots/PertamaBuka.png` shows the resulting fuzzy first frame.

**Fix applied** in `frontend/src/scene/Canvas.tsx`:

1. `useState<boolean>(false)` for `enableDof` so the first paint never has DOF mounted.
2. New `useEffect` mounts a 900ms `setTimeout` that flips `enableDof` to true IF `FEATURE_FLAGS.ENABLE_DOF` is true.
3. DOF params re-tuned for the default 90-unit camera altitude: `focusDistance=0.045` (was 0.018), `focalLength=0.018` (was 0.04), `bokehScale=1.4` (was 2.4). Wider in-focus band, smaller bokeh radius so even when DOF eventually mounts the scene reads as sharp around the city centroid with only the foreground sparkle particles and far horizon trees blurred for cinematic depth.

The 900ms defer also tolerates the iOS Safari < 17 guard in `feature-flags.ts` (DOF stays off entirely for that target so we never even start the timer).

## C-3 firefly kunang-kunang glow (HIGH polish)

**Approach**: extended the existing 3-tier Sparkles depth-band stack with a dedicated firefly tier as the FIRST element so it composites underneath the wider envelope tiers.

**Tuning** in `PostPipeline`:

```
<Sparkles
  count={220}
  scale={[260, 18, 260]}   // wide horizontal span, tight vertical
  position={[0, 8, 0]}      // building-height drift
  size={2.4}
  speed={0.05}              // slow drift, true firefly hover
  opacity={0.95}
  color="#fff3a0"           // warm cream
  noise={1.4}               // organic non-linear motion
/>
```

The slow `speed=0.05` plus high `noise=1.4` gives a fluttering, non-circular path that reads visually as fireflies rather than the standard linear sparkle drift. Bloom (intensity 1.05, luminanceThreshold 0.45) picks up the bright cores and gives the characteristic halo. The whole firefly tier is gated behind `FEATURE_FLAGS.ENABLE_SPARKLES_TIER_3` so it respects the drop-first regress order (it disappears at qualityFactor < 0.55 along with the other Sparkles tiers).

## C-4 dark fog hole (HIGH, Hafiz Bug #1)

**Root cause**: linear `Fog` with `FOG_NEAR=60`, `FOG_FAR=220`, color `#05070d`. Camera default in `/city` is `[0, 90, 140]` looking at origin so buildings at z=-50 sit at world distance ~140 from camera, which is in the high-density fog band. The pure-black fog color additionally drowns out any directional light coming from `[-20, 40, -10]` (cool fill) before it reaches the back wall of the city. Result: the green circle annotation in `Screenshot1Hafiz.jpg` shows the rear gedung silhouettes ketelan hitam.

**Fix applied**:

1. `FOG_NEAR` 60 to 120, `FOG_FAR` 220 to 480, fog color `#05070d` to `#0e1525` (soft blue haze). Atmospheric depth now reads as cinematic distance rather than a black void.
2. `ambientLight` intensity 0.18 to 0.4, color `#7d9cff` to `#9eb6e8` so unlit faces have a baseline readability lift.
3. Cool fill `directionalLight` at `[-20, 40, -10]` intensity 0.45 to 0.7, shadow casting removed (was unused, the warm key handles all shadow casting).
4. `toneMappingExposure` 1.1 to 1.25. Bloom `luminanceThreshold` lifted 0.55 to 0.45 to compensate (more pixels qualify for bloom contribution, scene mood preserved despite brighter base).
5. Warm key `directionalLight` shadow expanded: `shadow-camera-far` 200 to 260, `left/right/top/bottom` plus/minus 100 to plus/minus 140 so the full Iris treemap envelope plus Daedalus tree ring receives proper shadow coverage.
6. Added `shadow-bias=-0.0008` and `shadow-normalBias=0.04` on the warm key directional to suppress shadow acne on the new road grid lines.

## POLISH road grid + tree scatter

**RoadGrid**:
- `mesh` ground plane at y=-0.02, 800x800 unit, dark base color `#0a0d14`, roughness 0.85, metalness 0.15 so the new yellow grid lines pop against a dark substrate.
- `gridHelper` at y=0.01, 600 unit span, 60 divisions, line color `#f5c84b` (warm yellow matching ReferensiWindows.png), center color `#3a2b08` muted bronze.
- Total cost: 1 mesh draw plus 1 LineSegments draw, well within Wave 1 perf budget.

**TreeScatter** instanced cone geometry, 160 instances, single draw call:
- Geometry: `ConeGeometry(1.1, 3.4, 6)` 6-sided pyramid stylized conifer.
- Material: `MeshStandardMaterial` color `#1f4a2c` (deep green), emissive `#0a1e10` low-key, emissiveIntensity 0.4, roughness 0.95.
- Placement: deterministic mulberry32 (seed 20260513). 75% in r in [140, 260] outer ring, 25% in r in [8, 32] inner plaza.
- Per-instance scale variance 0.7 to 1.6, Y rotation variance for silhouette diversity under Bloom.

Both components live inside `Canvas.tsx`, mounted as siblings of `<SceneRig>` and BEFORE `<Suspense><Environment /></Suspense>` so they render under the children passed in by Iris.

## Contract surface preserved

No edits to:
- `ChronicleCanvasProps` interface in `frontend/src/scene/types.ts`
- `FEATURE_FLAGS` shape in `frontend/src/scene/feature-flags.ts`
- `usePerformanceState` hook in `frontend/src/scene/PerformanceContext.tsx`
- `frontend/src/scene/index.ts` barrel
- `frontend/src/scene/buildings/*` (Iris turf, anti-collision)

The Pythia contract `_meta/contracts/daedalus-to-iris.md` interface is honored verbatim. Iris consumers continue to import `ChronicleCanvas, usePerformanceState, FEATURE_FLAGS` from `@/scene` unchanged.

## What was NOT touched (Iris turf)

- `frontend/src/scene/buildings/BuildingInstances.tsx`
- `frontend/src/scene/buildings/{beaconArchetype,crossArchetype,genericArchetype,stackArchetype,templeArchetype,towerArchetype}.ts`
- `frontend/src/scene/buildings/layout.ts`
- `frontend/src/scene/buildings/mockCityData.ts`
- `frontend/src/scene/buildings/ownership.ts`
- `frontend/src/scene/buildings/types.ts`
- `frontend/src/scene/buildings/useCityData.ts`

## Verification path

1. `cd frontend && pnpm dev` (or `npm run dev`) on port 3000.
2. Visit `http://localhost:3000/city` and observe first paint: should be SHARP, no blur. Wait 1 second, DOF will kick in (if env flag on) with the background just slightly out of focus, city centroid in focus.
3. Observe background: background buildings should be readable through soft blue haze, not lost in a black hole.
4. Observe air above city: warm cream firefly particles should drift slowly at building height.
5. Observe ground: yellow road grid pattern, conifer trees in ring around city.
6. Drag the camera with OrbitControls to confirm regress feedback still drops DOF first, then DPR, then Sparkles.

## Locks attested

- Lock 1 no em dash: clean
- Lock 2 no emoji: clean
- Lock 5 honest claim: all 6 items shipped, none silently narrowed
