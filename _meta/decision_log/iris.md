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
