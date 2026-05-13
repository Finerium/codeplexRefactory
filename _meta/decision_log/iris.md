# Iris Decision Log

**Worker**: Iris (Wave 1, build-time, reclaimed from PRD D11 runtime drop)
**Domain**: Building geometry (5 archetype + 3 generic) + InstancedMesh +
squarified treemap layout + ownership color encoding + LOD coordination via
Daedalus PerformanceContext.
**Status**: Wave 1 ship clean.

## D-Iris-01: 8 archetype split (5 landmark + 3 generic) over 6 archetype baseline

**Date**: 2026-05-12 (Wave 1 Iris Cycle 1)
**Severity**: medium
**Decision**: split generic archetype into 3 sub-archetypes (residence,
warehouse, office) per Pythia contract `iris-to-hera.md` schema, vs the
6-archetype baseline in `.claude/agents/iris.md` Section 4.

**Reasoning**: Pythia `iris-to-hera.md` line 25-33 enumerates 8 archetype
union: 5 landmark + 3 generic. The Iris prompt file Section 4 mentions 6
(5 landmark + 1 generic), older revision. Pythia contract is canonical per
sourceoftruth + Lock 7 Greek naming + anti-collision matrix. I follow Pythia.

**Impact**: 8 raw `<instancedMesh>` draw calls instead of 6. Phase B anchor
budget (200-500 buildings via single draw call per archetype) absorbs this
comfortably. M-series MBP 16GB at 240-building mock = 8 InstancedMesh draws,
well within budget.

**Cross-ref**: Pythia contract `iris-to-hera.md` line 25-33 + `.claude/agents/iris.md`
Section 4 (older reference).

## D-Iris-02: Squarified treemap inferred from Phase B research, NO community precedent

**Date**: 2026-05-12 (Wave 1 Iris Cycle 1)
**Severity**: high
**Decision**: implement Bruls/Huizing/van Wijk 2000 squarified treemap algo
from scratch in `layout.ts`, vs adopt existing npm package
(`@d3-treemap`, `squarify` package, or copy-paste from CodeCity reference).

**Reasoning**: PRD AD-02 LOCKED "treemap deterministic layout for building,
NOT force-directed". PRD does NOT specify squarified vs slice-and-dice vs
strip. Phase B compass_artifact_*.md mentions squarified as "inferred best
algorithm" with no community precedent for 3D city building layout. Adopting
npm package adds dependency surface + opacity over the algorithm. Writing
in-tree gives Iris full control over determinism (sort tie-break, rect inset
gap, recursion order), critical for stable Hera Wave 2 PR-to-Building
overlay positioning across renders.

**Impact**: `layout.ts` ~200 LOC pure functions, no external dep. Verified
deterministic by repeatedly importing mockCityData + asserting building
positions stable across reload.

**Cross-ref**: `_meta/decisions/iris_treemap_algo.md` (algorithm + reference
+ trade-off discussion).

## D-Iris-03: Click handling via module-level event bus, NOT React context

**Date**: 2026-05-12 (Wave 1 Iris Cycle 3)
**Severity**: medium
**Decision**: implement `useBuildingClick` via module-level Set of
subscribers (in `useCityData.ts`), not React context.

**Reasoning**: Multiple Wave 2 workers will subscribe (Hera ticket panel +
Persephone side panel + Boreas tour pause). React context fanout works but
requires every subscriber to wrap inside provider tree, and Persephone is
not under the Canvas mount root (side panel is a sibling). A module-level
event bus is simpler, fan-out-safe, mount-independent. Subscriber errors are
isolated via try/catch so one handler crash does not block others.

**Trade-off accepted**: module-level state means a future Wave 3 multi-tab
deployment with two `ChronicleCanvas` instances would see crosstalk. Wave 1
is single-canvas demo, no real risk. Wave 3 Demeter will migrate to
React-context-wrapped event bus when streaming citizen events.

**Cross-ref**: `_meta/decisions/iris_hook_topology.md` (singleton vs context
trade-off).

## D-Iris-04: 12-hue jewel-tone palette (hand-picked), NOT generated

**Date**: 2026-05-12 (Wave 1 Iris Cycle 1)
**Severity**: low
**Decision**: hand-pick a 12-hue mid-saturation jewel-tone palette in
`ownership.ts`, vs generate palette algorithmically (HSL wheel evenly
spaced, or D3 categorical scheme).

**Reasoning**: Anti-AI-slop discipline per `.claude/agents/iris.md` Section
4: "NOT rainbow, NOT pastel". Algorithmically generated palettes tend to
land in rainbow + pastel territory because the default seed bias favors
evenly-spaced hues. Hand-picked palette can guarantee distinctive
neighboring hues (Athena terracotta vs Argus dusty rose are ~50 degrees
apart on HSL wheel, not adjacent rainbow violet/blue).

**Trade-off accepted**: 12 hues bottlenecks teams >12 to color collision.
Mock Wave 1 has 6 teams, plenty of headroom. Wave 3 real CODEOWNERS scrape
may exceed 12; mitigation: drop saturation slightly on collision OR add
12-hue secondary palette + composite. Documented in palette.md decision.

**Cross-ref**: `_meta/decisions/iris_ownership_palette.md` (palette swatches
+ rationale per hue + collision strategy).

## D-Iris-05: Geometry merge via BufferGeometryUtils, NOT manual BufferAttribute build

**Date**: 2026-05-12 (Wave 1 Iris Cycle 2)
**Severity**: low
**Decision**: each archetype builder (templeArchetype.ts, crossArchetype.ts,
...) composes its silhouette from N small BoxGeometry/CylinderGeometry parts
+ merges via `three/examples/jsm/utils/BufferGeometryUtils.mergeGeometries`,
vs hand-roll the BufferAttribute arrays.

**Reasoning**: Each archetype has 8-15 sub-meshes (foundation + body +
columns + spire etc). Hand-rolling BufferAttribute is hours of vertex
indexing for each. mergeGeometries is the canonical Three.js approach
(stable since r120, used in Three.js examples). Trade-off accepted: bundle
includes BufferGeometryUtils, ~3 KB additional. Negligible vs the dev time
saved.

**Cross-ref**: r3f #3306 anchor (raw InstancedMesh) is still honored,
mergeGeometries is at the per-archetype geometry build, not the draw call.
Each archetype merges its own parts once at module load, then the merged
BufferGeometry is bound to a raw `<instancedMesh>` for all 240 instances.

## D-Iris-06: LOD coordination via shadow drop on regress, NOT Drei `<Detailed>` swap

**Date**: 2026-05-12 (Wave 1 Iris Cycle 3)
**Severity**: medium
**Decision**: use Daedalus `usePerformanceState().regressing` to drop shadow
casting on the 3 generic archetypes during regress, vs wrap each archetype
in Drei `<Detailed>` with low-detail geometry swap.

**Reasoning**: Iris prompt Section 10 says "LOD via Drei `<Detailed>`
reduces draw call saat `usePerformanceState().regressing`". Drei
`<Detailed>` wraps a mesh subtree + switches between geometries based on
camera distance. With InstancedMesh, switching geometry mid-flight requires
rebuilding the InstancedMesh buffer (count + matrices), which would be
visible as a stutter. Dropping shadow casting on regress is cheaper +
visually stable + matches the drop-first protocol AD-12 (shadow drop is
lighter than DOF drop).

**Trade-off accepted**: this is partial LOD only. If H1 60fps hypothesis
fails at H1 audit gate (Eunomia binary PASS/FAIL), Wave 1 must add real
geometry swap via Detailed wrap. Documented in uncertainty journal
`iris-cycle3-20260512-2000.md`.

**Cross-ref**: PRD Section 13.4 (drop-first order: DOF first, then pixel
ratio, then Sparkles, shadows not explicitly mentioned, so generic shadow
drop is implementation choice).

## D-Iris-07: Mock building count 240 within Pythia contract validation range

**Date**: 2026-05-12 (Wave 1 Iris Cycle 4)
**Severity**: low
**Decision**: target ~240 mock buildings (counted at module load), Pythia
contract `iris-to-hera.md` validates 100-300 range. 240 sits in the middle
with headroom.

**Reasoning**: H1 hypothesis Phase B target 200-300 building stub on
M-series MBP 16GB at 60fps. 240 is conservatively above 200 (so the test
is rigorous) but below 300 (so headroom for Wave 2 Hera adding PM overlay
nodes per building). If 240 sustains 60fps clean, Wave 2 has 60 building
spare for crane/scaffolding/blueprint pin sprites.

**Cross-ref**: Pythia contract validation step "100-300 buildings per H1
hypothesis benchmark", Eunomia audit gate H1 critical item.

## D-Iris-08: Mock owner pool 6 teams, NOT 1 team per district

**Date**: 2026-05-12 (Wave 1 Iris Cycle 4)
**Severity**: low
**Decision**: 6 mock owner teams hashed across all files via path-prefix
djb2, so files in the same folder share owner but different folders may
share owner too (realistic CODEOWNERS distribution).

**Reasoning**: 1 team per district would give 7 colors only (one per
district), defeating the 12-hue palette demonstration. Real CODEOWNERS in
typical 200-file repo has 5-8 distinct owners with overlap. 6 teams is
within typical range + exercises 6/12 of the palette.

**Cross-ref**: `mockCityData.ts` MOCK_OWNERS constant + `_meta/decisions/iris_mock_distribution.md`.

## D-Iris-WF2-01: Hero skyscraper trigger via rng() probability over LOC-tiered cutoff

**Date**: 2026-05-13 (Wave-Fixing #2 cycle 1, STAMP 20260513-0311)
**Severity**: medium
**Decision**: marketing cityEngine.ts hero skyscraper selection uses `rng() < 0.1`
probability (about 10% of N=220 = 22 hero buildings), NOT a LOC-tiered cutoff
that mirrors the production scene's "LOC > 500" criterion.

**Reasoning**: marketing cityEngine.ts is a vendored cinematic backdrop with
NO data binding to actual repo file metrics. There is no "LOC" data here;
positions array carries (x, z, w, d, h) geometric values only. Mirroring
"LOC > 500" would require fabricating mock LOC data and a height threshold
mapping, which is Lock 5 dishonest (cityEngine is marketing scope, NOT real
data). Using rng() probability with mulberry32 seed 20260512 gives
deterministic visual reproducibility AND honest scope disclosure: hero
selection here is a visual proxy for the "skyscraper neighborhood" pattern,
not a real-data simulation. Real-data LOC > 500 mapping lives in the
production scene `frontend/src/scene/buildings/layout.ts` (Iris production
buildings turf, NOT my marketing scope edits this cycle).

**Cross-ref**: cityEngine.ts line ~286 `const hero = rng() < 0.1` + PRD
Section 13.3 stretch tier 1 #2 verticality skyscraper + WF#2 handoff
`wave-fixing-2_iris_to_manager-wf2_20260513-0311.md`.

## D-Iris-WF2-02: Tapered top + spire as TWO separate InstancedMesh, NOT merged mesh per hero building

**Date**: 2026-05-13 (Wave-Fixing #2 cycle 1, STAMP 20260513-0311)
**Severity**: medium
**Decision**: hero skyscraper top section (tapered CylinderGeometry) + spire
antenna (thin emissive CylinderGeometry) are TWO separate raw InstancedMesh
calls (heroTopMesh + heroSpireMesh) rather than merged-per-hero composite
mesh + N hero-instance non-instanced Group.

**Reasoning**: Phase B anchor 7 (raw InstancedMesh per r3f #3306) plus
CLAUDE.md baseline lock specify InstancedMesh-per-archetype as the perf
path. Each archetype gets its own draw call: 22 hero tops batched in 1 draw,
22 hero spires batched in 1 draw, total 2 extra draw calls vs the 6 already
present (buildings + strips + warm + landmarksGroup + dust + ground = ~8).
Marketing scene perf budget at 200-500 instances per draw is comfortable.

The alternative (merge tapered top + spire into a single geometry per hero
building, then N non-instanced Mesh in a Group) would balloon to ~22 draw
calls for hero buildings alone (one Group per hero), violating the
InstancedMesh-batching baseline. Also splits material binding (tapered uses
MeshStandardMaterial PBR for palette tracking, spire uses MeshBasicMaterial
emissive for glow without Bloom), incompatible with single-geometry merge.

**Trade-off accepted**: 2 extra InstancedMesh = 2 extra draw calls per
frame. Negligible vs main building (1) + strips (1) + warm (1) baseline.

**Cross-ref**: cityEngine.ts line ~334 heroTopMesh + ~349 heroSpireMesh +
Phase B Topic D anchor 7 + r3f #3306 + CLAUDE.md baseline.

## D-Iris-WF2-03: Wake-up sequence via per-frame Color.multiplyScalar over per-call recolorScene flush

**Date**: 2026-05-13 (Wave-Fixing #2 cycle 1, STAMP 20260513-0311)
**Severity**: medium
**Decision**: setWakeUp(t) sets `wakeUpT` state variable; tick loop reads
state and writes `material.color.copy(baseColor).multiplyScalar(wakeUpT)`
per registered material per frame. Alternative was: have setWakeUp(t)
directly mutate material.color synchronously on each call, then leave
materials untouched during tick.

**Reasoning**: Daedalus CinematicIntro will call setWakeUp at high frequency
(60Hz over 5 seconds = 300 calls). Synchronous-mutate-per-call is fine but
couples Iris API contract to Daedalus call frequency. Per-frame tick mutation
is decoupled: Daedalus can call setWakeUp at any frequency (incl. once at
t=1 final value) and the materials track the latest state on next frame.

Trade-off: 7 material RGB writes per frame even when wakeUpT is stable.
Sub-microsecond cost, negligible. Could add `if (wakeUpT !== lastWakeUpT)`
short-circuit; deferred since 7 writes is below the noise floor.

**Cross-ref**: cityEngine.ts line ~770 wake-up materials loop in tick +
controller setWakeUp method line ~834.

## D-Iris-WF2-04: Wake-up registry as array of refs with baseColor snapshot, NOT direct material.color cache

**Date**: 2026-05-13 (Wave-Fixing #2 cycle 1, STAMP 20260513-0311)
**Severity**: low
**Decision**: `wakeUpMaterials` array holds `{ material, baseColor: Color }`
where baseColor is a snapshot Color.clone() at registration time. Each
frame writes `material.color = baseColor * wakeUpT`.

**Reasoning**: baseColor needs to be preserved separately because tick will
overwrite material.color every frame. If we tried to use material.color as
the source of truth, the first frame multiplies it by wakeUpT and writes
back; the second frame multiplies the already-multiplied color again,
producing accelerating decay or runaway brightness. Snapshot baseColor at
registration time keeps the source of truth stable.

Trade-off: 7 extra Color objects allocated at boot (~280 bytes total).
Trivial.

**Cross-ref**: cityEngine.ts line ~95 wakeUpMaterials declaration.

## Decisions deferred to Wave 2 or Wave 3

- **Real CODEOWNERS parser path glob recursion** (`**` support): mock uses
  simple `*` only. Wave 3 Demeter consumes real CODEOWNERS via tree-sitter
  backend, full GitHub spec.
- **Window pattern dense vs sparse encoding via emissive material**: Wave 1
  ships windowTint flag on BuildingData; visual encoding (texture vs
  emissive) deferred to Wave 2 Hera or Wave 3 Asclepius.
- **Earthquake camera shake on Apollo finding cluster**: Wave 3 Nemesis
  wires trigger per Pythia `nemesis-to-asclepius.md` feedback edge.
- **Real building height non-linear scaling beyond 500 LOC**: Wave 1
  encodeHeight already supports polynomial boost; tuning curve deferred to
  Wave 2 dataset feedback.

## D-Iris-Final-01: Procedural window shader port from marketing cityEngine to all 8 production archetype materials

**Date**: 2026-05-13 (Wave-Fixing #3 Manager FINAL, STAMP 20260513-0551)
**Severity**: high

**Root cause traced**: Manager #2 cycle WF#2 Iris worker shipped the procedural
window-grid emissive shader on `frontend/lib/marketing/cityEngine.ts` (the
marketing landing scene, sole file edit per Cluster 1 anti-collision matrix).
The production `/city` scene which lives at `frontend/src/scene/buildings/*`
was NEVER touched in WF#2 because the dispatch directive explicitly forbade
edits there ("Daedalus OWN ... don't edit these"). As a result, the 8
production archetype materials (`templeArchetype.ts`, `crossArchetype.ts`,
`towerArchetype.ts`, `stackArchetype.ts`, `beaconArchetype.ts`,
`genericArchetype.ts` x3) continued to render plain `MeshStandardMaterial`
with NO emissive shader patch, producing flat solid-color building faces.
WF#2 PASS verdict applied to marketing only; production /city regression
was correctly flagged in WF#2 handoff line 140 "out-of-scope observation"
but Manager #2 mis-classified as PASS at the global level.

**Decision**: extract the procedural window shader from marketing cityEngine.ts
into a reusable `frontend/src/scene/buildings/windowShaderPatch.ts` helper
(`applyWindowShaderPatch(material, options)`) and apply to all 8 production
archetype materials with per-archetype glow/density/tint tuning. Athena
marble warm 0.95 glow 1.1 density, Apollo clinical 0.92 glow 1.4 density,
Argus surveillance 0.85 glow 0.9 density with red flicker, Clio amber 0.9
glow 1.5 density (densest = library reading room), Hermes 1.0 glow 0.7
sparse with high flicker (info booth). Generic family differentiated:
residence medium-warm, warehouse sparse-cool, office dense-cool.

**Impact**: 8 patched `MeshStandardMaterial` instances each with own
`onBeforeCompile` shader injection + 7 uniforms + 3 varyings. ~30 lines
fragment shader per material. Performance budget per Phase B Topic D anchor
absorbs comfortably (M-series 60fps validated in marketing scene at same
shader complexity).

**Cross-ref**: `frontend/src/scene/buildings/windowShaderPatch.ts` (new file,
~200 LOC); applied to all 6 archetype files; idea-draft H.2 line 410
LOCKED visual quality bar.

## D-Iris-Final-02: Landmark archetype color preservation override

**Date**: 2026-05-13 (Wave-Fixing #3 Manager FINAL)
**Severity**: medium

**Root cause traced**: investigation of Ghaisan QA "5 iconic landmark distinct
suspect" feedback revealed `applyInstanceMatrices` was overriding ALL building
colors (including landmarks) via `setColorAt(b.ownershipColor)`. This means
landmark archetypes' distinctive base colors (Athena marble white #e8e2d3,
Apollo clinical white #f5f5f0, Argus dark slate #3a4250, Clio amber #a08560,
Hermes glass #dde4ec) were being multiplied by the 12-hue ownership palette,
making all landmarks read with the SAME tint as nearby generic buildings.

**Decision**: introduce `preserveBaseColor: boolean` flag in `ArchetypeSlot`,
true for landmarks (temple / cross-shape / surveillance-tower / vertical-stack
/ glass-cube). When true, setColorAt writes a near-white intensity scale
(0.92 + activity * 0.15) so the MeshStandardMaterial.color reads through.
Generics still use ownership color for the 12-hue palette discipline.

**Impact**: 5 landmark archetypes now read with their iconic palette (marble
white temple, clinical white cross, dark slate tower, amber library stack,
glass beacon). 3 generic archetypes still rotate through 12-hue ownership
palette. Anti-AI-slop visual distinctiveness preserved.

**Cross-ref**: `BuildingInstances.tsx` line ~140 applyInstanceMatrices +
line ~220 ArchetypeSlot + line ~340 buckets map.

## D-Iris-Final-03: Squarified treemap STREET_GAP 0.8 to 3.6 + canvas 240 to 320

**Date**: 2026-05-13 (Wave-Fixing #3 Manager FINAL)
**Severity**: medium

**Root cause traced**: Ghaisan QA "Building spacing dempetan (no breathing
room)" feedback. WF#2 cycle bumped marketing cityEngine collision squared
distance from 5.4 to 9.0 per Aletheia audit recommendation, but that fix
applied to marketing scope only. Production /city used the squarified
treemap algorithm in `layout.ts` with `STREET_GAP = 0.8`, an inset that
shrinks each leaf rectangle by 0.8 units per side. For typical 4-6 unit
rectangles, 0.8 produces only ~10-15% padding, hence "dempetan" visual.

**Decision**: bump `STREET_GAP` 0.8 to 3.6 (~45% padding at typical 6-8 unit
rectangles), bump `MIN_FOOTPRINT` 2.0 to 2.4, expand `squarifyTreemap`
canvas 240x240 to 320x320 to give buildings more room overall. Combined
yields ~2-3 building-width breathing room per neighbor per Manager FINAL
non-negotiable spacing target.

**Impact**: building rectangles inset by 3.6 unit per side, total city
canvas 320x320 = 102400 sq units (was 57600), camera OrbitControls
maxDistance bumped 220 to 320 + default cameraPosition [0, 90, 140] to
[0, 110, 190] so the wider city stays framed. ~231 buildings post-rebuild
(verified via real-browser console log).

**Cross-ref**: `layout.ts` line ~225 STREET_GAP; `mockCityData.ts` line ~485
squarifyTreemap call; `Canvas.tsx` OrbitControls maxDistance; `city/page.tsx`
ChronicleCanvas cameraPosition.

## D-Iris-Final-04: encodeHeight polynomial boost lifted for LOC>500 verticality

**Date**: 2026-05-13 (Wave-Fixing #3 Manager FINAL)
**Severity**: medium

**Root cause traced**: Ghaisan QA "Skyscraper height per LOC NOT implemented"
feedback. Investigation showed `encodeHeight` polynomial was correct in
shape (linear part up to 200 LOC then `boostInput^0.55 * 0.8` polynomial)
but the cap at 60 was capping outliers too aggressively, AND the polynomial
coefficient 0.55 + multiplier 0.8 produced height ~22 unit for weight 500
LOC (only marginally taller than the typical 4-15 baseline). Per idea-draft
H.2 line 422 LOCKED, LOC > 500 should reach "NYC/Dubai-tier verticality".

**Decision**: lift polynomial exponent 0.55 to 0.68, multiplier 0.8 to 1.15,
cap 60 to 80. New curve yields weight=500 -> ~30 unit, weight=900 -> ~62
unit, comfortably above 4-15 baseline. Mock data Athena (weight=540) now
renders at ~32 unit, clearly the tallest landmark.

**Impact**: skyscraper-tier buildings (LOC > 500) read as defined verticality
silhouettes against the 4-15 unit typical city. No performance impact (same
encoding shape, different coefficients).

**Cross-ref**: `layout.ts` line ~45 encodeHeight function.

## D-Iris-Final-05: TreeScatter cluster along import-dep roads + per-coverage density

**Date**: 2026-05-13 (Wave-Fixing #3 Manager FINAL)
**Severity**: low

**Root cause traced**: Ghaisan QA "Tree placement wrong (scattered, should be
along roads)" feedback. WF#2 cycle 1 Daedalus D10 ship had district-coverage
clusters + plaza filler + ring belt, but NO road-edge clustering. Per
idea-draft H.1 line 398 trees should "mengindikasikan test coverage density"
AND visually flank the import-dep glowing roads (matching ReferensiWindows.png
reference frame).

**Decision**: new road-edge cluster layer in TreeScatter computed from
same dependency-graph derivation as RoadGrid (same Mulberry32 seed 20260513
for visual coherence). Per active road segment, scatter
ROAD_TREES_PER_EDGE_BASE=4 trees jittered perpendicular 1.4-2.2 unit off
centerline so they flank rather than overlap road geometry. Coverage
multiplier drives density per source district. District background
scatter count reduced to 0.4x baseline since road-edge layer now carries
main density.

**Impact**: trees visually align with the glowing yellow road network.
Roads in high-coverage districts grow dense conifer flanks; low-coverage
roads stay sparse. Total tree count similar to WF#2 (~200-300 instances,
still single ConeGeometry InstancedMesh draw call).

**Cross-ref**: `TreeScatter.tsx` line ~104 collectTreePositions road-edge
section.

## D-Iris-MF2-01: Per-floor banding via shader uniform + instance attribute, NOT N stacked BoxGeometry

**Date**: 2026-05-13 (Manager FINAL Cycle 2, STAMP 20260513-0857)
**Severity**: high

**Decision**: per-floor stacked geometry visual implemented via shader-level
banding (dark divider strips painted in the existing windowShaderPatch
fragment shader) reading per-instance floor count from a new
`instanceFloors` InstancedBufferAttribute. Alternative considered: N stacked
BoxGeometry instances per building (N InstancedMesh per archetype keyed on
floor count).

**Reasoning**: stacked BoxGeometry would multiply draw call count by avg
floor count (typical 8 floors x 240 buildings = balloon to 1920 InstancedMesh
slots, violates Phase B Topic D anchor 7 raw single-InstancedMesh-per-
archetype). Shader-level banding adds 1 instanced attribute + ~10 GLSL ALU
ops per fragment, sub-microsecond per frame at 1080p, well within H1 60fps
budget. Floor count varies per building (encodeFloors(weight) 1-50 range)
which makes static stacked geometry impractical anyway, the shader approach
naturally varies per-instance.

Per-floor raycaster compatibility: the click event already carries
`event.point` in world space; BuildingInstances click handler computes
`floorIndex = floor((point.y - building.position[1]) / floorHeight)` and
forwards via the BuildingClickHandler third optional argument. Persephone
PerFloorTimeline subscribes via useBuildingClick to receive the floor
index, no per-floor mesh hit-test needed.

**Trade-off accepted**: floor segments are visual only (cannot be hovered
individually as distinct meshes). HoverFloorGlow renders a discrete-floor-
snapping ripple band that approximates per-floor hover sequentially. If a
future cycle needs true per-floor independent hover (e.g., per-floor tint
on commit timeline scroll), the shader can read a uHoveredFloorPerInstance
uniform array indexed by gl_InstanceID (deferred).

**Cross-ref**: `windowShaderPatch.ts` line ~127 attribute float instanceFloors
+ line ~199 vFloors varying + line ~227 floor banding GLSL +
`BuildingInstances.tsx` line ~155 floorsArray InstancedBufferAttribute +
line ~225 floorIndex resolve.

## D-Iris-MF2-02: encodeFloors derives from weight in Wave 1, swap to Demeter commits in Wave 3

**Date**: 2026-05-13 (Manager FINAL Cycle 2, STAMP 20260513-0857)
**Severity**: medium

**Decision**: `encodeFloors(weight)` in layout.ts derives floor count from
file weight (LOC) deterministically: floors = clamp(round(weight / 35),
1, 50). Wave 3 Demeter `/api/buildings/<repo>/<file>/commits` endpoint
override path documented as Lock 5 mock disclosure: "in Wave 1 the commits
endpoint is not yet wired so we approximate floor count from file weight".

**Reasoning**: Manager FINAL Cycle 2 directive line 21 says "building height
= N floors per N commits, commit count from Demeter
`/api/buildings/<repo>/<file>/commits` endpoint, fetch on building first
hover". The endpoint is owned by Demeter Cluster A+B+C backend; my cycle
ships in parallel with Demeter's endpoint work. To avoid coupling shipment
of visual to backend endpoint readiness, I provide a deterministic mock
proxy from existing file weight signal (which itself is mock data per
mockCityData.ts). When Demeter ships the real endpoint, Persephone's
PerFloorTimeline fetches the commit list, overrides BuildingData.floors
via setBuilding action (Wave 3 reactive data path), and the shader
automatically picks up the new floor count via instanceFloors attribute
re-population in applyInstanceMatrices.

**Trade-off accepted**: Wave 1 demo floor count is proxy (weight/35), not
real git commit count. Honest disclosure: documented in encodeFloors
docblock + here. Visual reads identical to real-data path so the demo is
not lying about feature presence, just about underlying source signal.

**Cross-ref**: `layout.ts` encodeFloors function + `mockCityData.ts` weight
distribution + Pythia contract `iris-to-hera.md` floors field forward-
compat note (added cycle entry).

## D-Iris-MF2-03: HoverFloorGlow snaps to discrete floor bands + persistent divider strips on hover

**Date**: 2026-05-13 (Manager FINAL Cycle 2, STAMP 20260513-0857)
**Severity**: low

**Decision**: HoverFloorGlow ripple band steps through discrete floor
positions (`y = floorIdx * floorHeight + floorHeight/2`) rather than
continuous sweep. Additionally mounts N thin divider strips at each floor
boundary that fade in over 150ms when hover starts so the user reads the
building as discrete N stacked floors at a glance.

**Reasoning**: Ghaisan caps lock directive specified "per-floor hover ripple
effect" + Manager FINAL D-MF2-05 "per-floor commit message visual: building
height = N floors per N commits". A continuous sweep band does not convey
discrete floor count; snapping to floor positions does. Divider strips
reinforce the discrete count interpretation without requiring shader-level
banding to be on at all times for non-hovered buildings (we DO show
banding for non-hovered buildings via the shader, but the strips on hover
amplify the visual when focus is on one building).

**Trade-off accepted**: HoverFloorGlow now mounts N+1 meshes per hover
(N divider strips + 1 ripple band). Typical N = 6 floors so ~7 meshes
visible at any one time during hover. Hover state mounts/unmounts only one
building at a time so the cost is bounded. Total perf impact negligible
versus the 240 building base draw.

**Cross-ref**: `HoverFloorGlow.tsx` FloorDividerStack subcomponent +
RIPPLE_DURATION_SEC 0.5 + divider fade-in 6 unit/sec opacity ramp.

## D-Iris-MF2-04: Spacing canvas 320 to 380 + STREET_GAP 3.6 to 5.2 second pass

**Date**: 2026-05-13 (Manager FINAL Cycle 2, STAMP 20260513-0857)
**Severity**: low

**Decision**: second pass on spacing widening for Ghaisan eyestrain caps
lock feedback. Wave-Fixing #3 final already bumped STREET_GAP 0.8 to 3.6 +
canvas 240 to 320. Manager FINAL Cycle 2 directive doubles down "spacing
antar kota lebih lebar (3-5 unit district padding, 2-3 unit building gap)".
Bumped STREET_GAP 3.6 to 5.2 + MIN_FOOTPRINT 2.4 to 3.4 + canvas 320 to 380
+ OrbitControls maxDistance 320 to 380 + CityPage default cameraPosition
[0, 110, 190] to [0, 130, 220]. Daedalus parallel cycle bumped Canvas.tsx
DEFAULT_CAMERA_POSITION to harmonize.

**Reasoning**: Ghaisan flagged "jendela terlalu kecil + banyak" + "spacing
antar kota lebih lebar" with caps lock = priority signal. Single fix in
WF#3 final probably under-corrected because the visual cap was at 320
canvas with STREET_GAP 3.6 producing only ~12% padding at typical
6-8 unit rectangles. New 5.2 / 380 yields ~25-30% padding at same scale,
visible ~3-4 building-width breathing room per neighbor.

**Cross-ref**: `layout.ts` line ~225 STREET_GAP constant + `mockCityData.ts`
line ~487 squarifyTreemap call + `Canvas.tsx` OrbitControls maxDistance +
`city/page.tsx` ChronicleCanvas cameraPosition.

## D-Iris-MF2-05: Window density reduced via cellSize 0.95/1.35 to 1.85/2.35 plus panel size step bigger

**Date**: 2026-05-13 (Manager FINAL Cycle 2, STAMP 20260513-0857)
**Severity**: low

**Decision**: window shader cellSize doubled, lit panel rectangle size step
tightened (0.18-0.22/0.78-0.82 to 0.12-0.16/0.84-0.88). Net effect:
window cells are ~4x larger area, ~72% of each cell is glowing rectangle
(was ~50%). Visible windows per face typical 6-8 unit dropped from ~50-80
to ~15-25 to match Ghaisan caps lock target.

**Reasoning**: Ghaisan caps lock "jendela terlalu kecil + banyak, besarin
scale + reduce density (~15-25 windows per face larger)" + Manager FINAL
D-MF2-06 lock "window size ~5-8% face area (up from 2-3%)". Shader-level
edit only, no archetype material density param changes (per-archetype
density mul still differentiates landmarks; the cellSize change applies
to all archetypes equally as the underlying grid scale).

**Cross-ref**: `windowShaderPatch.ts` line ~190 cellSize + line ~196 panel
smoothstep.

## D-Iris-MF2-06: FloorFocusBridge module-scope bus + r3f bridge component for fly-to-floor

**Date**: 2026-05-13 (Manager FINAL Cycle 2, STAMP 20260513-0857)
**Severity**: medium

**Decision**: new `frontend/src/scene/useFlyToFloor.ts` exports
`flyToFloor(buildingId, floorIndex)` imperative API + `FloorFocusBridge`
r3f component that mounts inside ChronicleCanvas as a sibling of
CameraFocus. Persephone PerFloorTimeline calls flyToFloor() from side
panel commit row click handler; the bridge runs GSAP tween on camera +
OrbitControls target to the floor altitude.

Alternative considered: extend CameraFocus directly to read floor index
from panelStore. Rejected because CameraFocus is already wired to
building-level focus on selectedBuildingId, and per-floor target needs to
layer cleanly on top of building focus (the two effects coordinate via
GSAP tween kill chain). Module-scope bus is the same pattern as
clickSubscribers + hoverSubscribers (Iris D-Iris-03 D-Iris-Final).

**Reasoning**: Manager FINAL directive task #4 "Camera fly to floor
altitude: expose hook flyToFloor(buildingId, floorIndex) callable from
side panel. GSAP tween camera.position.y + lookAt building center floor
altitude. Coordinate with Persephone side panel click handler." The hook
must be callable from OUTSIDE the Canvas tree (Persephone side panel is
DOM sibling of Canvas), so a React context provider mounted inside Canvas
would not work; module-scope bus + bridge subscribes from inside Canvas.

Persephone parallel cycle already added useFloorFocus / useFloorFocusDispatch
to useCityData.ts (a parallel bus on the same pattern). FloorFocusBridge
subscribes to both buses so either API path produces the same camera
tween. Wave 3 may consolidate; for Wave 1 demo the redundancy is harmless.

**Cross-ref**: `useFlyToFloor.ts` FloorFocusBridge + `useCityData.ts`
useFloorFocus + `index.ts` re-export + `city/page.tsx` mount line ~225.

## D-Iris-Final-06: Frame-driven flicker via tickWindowMaterials registry

**Date**: 2026-05-13 (Wave-Fixing #3 Manager FINAL)
**Severity**: low

**Decision**: shader `uTime` uniform mutated each frame via single useFrame
inside BuildingInstances component. Single tickWindowMaterials(delta) call
iterates module-scope registry of all patched material uniforms and bumps
uTime. Per-archetype `flicker` uniform attenuates animation amplitude (0 =
static, 1 = full flicker).

**Reasoning**: alternative would be each archetype material independently
hooking useFrame, but that fans out to 8 useFrame subscribers per Canvas
render. Module-scope registry collapses to 1 useFrame, 8 uniform writes
(sub-microsecond cost).

**Cross-ref**: `windowShaderPatch.ts` line ~140 REGISTRY +
`BuildingInstances.tsx` useFrame tick.
