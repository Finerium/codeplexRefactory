---
actual_timestamp: 20260513-0311 WIB Day 2 dini hari
agent: Iris (Wave-Fixing #2 rescue, marketing scene scope sole)
cycle: 1
consumer: Manager Wave-Fixing #2
cluster_scope:
  - C-2 window glow restore VERIFY
  - C-2-spacing building density VERIFY
  - Feature #21 verticality hero skyscraper LOC > 500
  - Feature #22 5 iconic landmark distinct VERIFY
  - Feature #34 wake-up sequence cinematic intro
  - Feature #35 verticality custom geometry
verdict_per_item:
  C-2_window_glow: PASS (verify, no regression WF#1 shader intact)
  C-2-spacing: PASS (verify, no regression WF#1 9.0 dist + r 9 unchanged)
  feature_21_verticality: PASS (NEW: 10% hero pick + 2x max height + tapered top + spire)
  feature_22_landmarks: PASS (verify, WF#1 5 archetype variant unchanged)
  feature_34_wake_up: PARTIAL (API hook + materials registered, Daedalus owns intro trigger)
  feature_35_verticality_geometry: PASS (covered by feature #21 implementation)
code_files_touched:
  - frontend/lib/marketing/cityEngine.ts (sole, +125 lines)
deferred_reasons: []
out_of_scope_observation:
  - "/city central r3f Canvas region renders black post-WF#1 (Daedalus + Iris production buildings turf). NOT my Cluster 1 scope per anti-collision matrix."
daedalus_coordination_notes:
  - "Daedalus CinematicIntro is consumer for setWakeUp(t). Ramp t 0 to 1 over 5-second intro window per PRD Section 13.3 stretch tier 1 #1. Materials: 7 emissive (1 spire group + 6 landmark beacon: athena beacon, apollo red beacon, argus eye, hermes pillar + cap + core)."
  - "Marketing landing (cityEngine direct mount via MarketingShell.tsx) NEVER calls setWakeUp. Default boot wakeUpT=1.0 (full lit) preserves WF#1 visual."
  - "Hero skyscraper spire antenna emissive color #ffd28a + toneMapped=false. NO Bloom pass on marketing scene (cityEngine.ts no postprocessing). Daedalus /city Bloom is separate concern."
ferry: NONE
auto_end: true
---

# Iris Wave-Fixing #2 handoff to Manager Wave-Fixing #2

## TL;DR

Cluster 1 scope all addressed. 4 PASS + 1 PARTIAL (Feature #34 wake-up,
cross-scope to Daedalus CinematicIntro trigger) + 0 FAIL + 0 DEFERRED.
One out-of-scope observation flagged: /city central canvas region renders
black post-WF#1, this is Daedalus + production buildings turf NOT my scope
per anti-collision file ownership matrix.

## Scope honored

- Owner: frontend/lib/marketing/cityEngine.ts (sole file edit). Marketing
  landing 3D backdrop, independent of /city production r3f scene.
- Avoided: frontend/src/scene/Canvas.tsx + RoadGrid + TreeScatter + FlyingCars
  + CinematicIntro + DirectorMode + BuildingInstances + landmark Hera Wave 2
  panels (Daedalus / Hera turf per dispatch directive).

## What shipped this cycle

### Feature #21 + #35: Verticality hero skyscraper (NEW)

cityEngine.ts changes:
- Building placement loop: added `hero: boolean` field on positions array
  via `rng() < 0.1` (about 10% of N=220 buildings, deterministic with
  mulberry32 seed 20260512).
- Hero height: `baseH * 2` (44 unit cap vs 24 baseline). Hero footprint
  bumped to 2.2-4.4 unit so silhouette reads as defined skyscraper not
  stretched matchstick.
- Two new InstancedMesh after the buildings loop:
  1. `heroTopMesh`: CylinderGeometry(0.42, 0.92, 1, 12) tapered top.
     Height min(3.8, p.w * 1.6) so taper proportional. Sits flush on top
     of base box at p.h. Same MeshStandardMaterial palette as buildings.
  2. `heroSpireMesh`: CylinderGeometry(0.07, 0.14, 1, 8) thin spire antenna.
     Above tapered top. MeshBasicMaterial color #ffd28a + toneMapped=false
     so spire emits visible glow even without Bloom postprocessing.
- Both use raw InstancedMesh per archetype, NOT Drei Instances, per Phase B
  anchor 7 + r3f #3306 + CLAUDE.md baseline.
- Hero count guarded with `Math.max(1, heroCount)` for empty edge case so
  InstancedMesh constructor never gets 0.

### Feature #34: Wake-up sequence API + emissive ramp wiring (PARTIAL)

cityEngine.ts changes:
- CityController interface: added `setWakeUp(t: number): void` method.
- Internal state: `wakeUpT` defaults 1.0 (full lit) so marketing direct
  mount behavior unchanged.
- `wakeUpMaterials` array: registry of 7 emissive material entries with
  baseColor snapshot:
  1. heroSpireMat (spire antenna warm #ffd28a)
  2. apolloBeaconMat (red #ff4d56)
  3. argusEyeMat (red #ff2a2a)
  4. hermesPillarMat (windowWarm)
  5. tiCapMat (windowWarm)
  6. hermesCoreMat (windowWarm)
  7. athenaBeaconMat (windowWarm)
- Tick loop: per frame `entry.material.color.copy(baseColor).multiplyScalar(wakeUpT)`
  for each registered material. Negligible perf (sub-microsecond per material).
- Cross-scope dependency: Daedalus CinematicIntro consumer-side trigger
  required to ramp wakeUpT from 0 to 1 over 5-second intro window.
  Marketing scene never triggers this; default boot stays at 1.0.

### C-2 + C-2-spacing + Feature #22: WF#1 ship verify (no regression)

No edits to WF#1 shipped code. Verification:
- onBeforeCompile procedural shader (lines 137 to 254) untouched, real-browser
  screenshot shows glowing window grid on building facades.
- Spacing 9.0 squared distance + inner ring radius 9 + reject threshold 10.5
  (lines 265 to 282) untouched, real-browser screenshot shows visible gaps
  between buildings.
- 5 archetype landmark cluster (lines 384 to 552 approximately) untouched
  except for the 5 wake-up beacon material registrations (signature-compat).
  Athena temple + Apollo cross + Argus tower + Clio book stack + Hermes
  glass cube all preserved geometry-wise.

## Real-browser verification

Playwright headless Chromium 1920x1080 viewport, dev server localhost:3000:

- `/tmp/iris_wf2_landing_hd.png` (1080p landing initial view): glowing
  window grid visible, multiple tall hero skyscrapers with tapered tops
  + spire antennas visible silhouette.
- `/tmp/iris_wf2_showcase.png` (1080p landing showcase anchor): tall
  hero tower center-top with clearly visible pointed spire antenna.
  Window grid pattern dense + warm-tint mix visible.
- `/tmp/iris_wf2_city.png` + `/tmp/iris_wf2_city_full.png`: /city route
  side panels render OK, central r3f Canvas region appears BLACK. OUT
  OF MY SCOPE (Daedalus + Iris production buildings turf). Flagged.

## Compliance check

- Lock 1 no em dash: clean (grep search returns 0 hits in cityEngine.ts).
- Lock 2 no emoji: clean (perl regex on Unicode emoji blocks returns 0 hits).
- Lock 5 honest: hero geometry is procedural BoxGeometry + CylinderGeometry
  composite, not asset load. Wake-up is real Color.multiplyScalar per frame
  per material, not no-op placeholder. Feature #34 listed PARTIAL not
  inflated to FIXED because Daedalus trigger is cross-scope.
- Lock 8 no skill drift: cityEngine.ts is sole edit. Anti-collision matrix
  honored: zero touch on frontend/src/scene/*.
- Lock 9 V_n snapshot ready: V5_iris_locked_20260513-0311.md authored.

## V_n snapshot reference

`_meta/orchestration_log/V5_iris_locked_20260513-0311.md`

## Out-of-scope observation for Manager dispatch

**/city central r3f Canvas renders BLACK in real-browser screenshot.**

This is the Daedalus + Iris production scene path (`frontend/src/scene/Canvas.tsx`
+ `frontend/src/scene/buildings/BuildingInstances.tsx`), NOT marketing
cityEngine path. Per Cluster 1 directive "Daedalus OWN ... don't edit these".

Possible causes (Manager dispatch to Daedalus or Iris production buildings
worker if confirms regression):
- Daedalus Canvas.tsx OrbitControls camera position default `[0, 50, 80]`
  looking at `[0, 0, 0]` with city centroid possibly far off-origin (Iris
  squarified treemap centroid at city.centroid). Camera may be pointing
  outside building cluster.
- BuildingInstances setMatrixAt may not be firing in React 19 strict mode
  useLayoutEffect (double-fire race).
- Daedalus EffectComposer DepthOfField focusDistance bug stuck on near
  plane (per WF#1 Iris handoff line 17 suggestion to Daedalus).
- Mock data useCityData returning empty buildings array (Iris production
  scope, mockCityData.ts).

Recommend Manager spawn Daedalus + Iris (production buildings, NOT me
the marketing Iris) Wave-Fixing #3 cycle if visual /city demo is needed for
panitia submission. Marketing landing is fine and is the primary public-
facing route at `https://duopoly.hackathon.sev-2.com/`.

## Capacity report

- Wall-clock: about 30 min (within 90 min ferry ceiling, well under)
- 4 mandatory artifacts authored + screenshot evidence + edits typecheck clean
- No ferry triggers hit (zero critical block, zero contract conflict, zero
  anti-pattern violation, zero Wave 2-3 architecture decision, zero
  downstream cascade risk)

## Auto-end status

`auto_end: true` per dispatch contract. Iris Wave-Fixing #2 cycle 1 OUT.
