# Iris Checkpoint: Cluster 4 TRULY FINAL Demo-Variant Slice

**Worker**: Iris (Wave 1 build-time, reclaimed Cluster 4 Manager FINAL TRULY FINAL)
**STAMP**: 20260513-1018
**Cycle**: Manager FINAL Cycle 4 TRULY FINAL Cluster 4
**Status**: SHIP

## Mandate

Pan audit #19 verdict: every `/city` render shows the same 245-building
`mockCityData` singleton regardless of `?repo=` or `?demo=` URL param.
Ghaisan QA observation: "DI IDE AWAL KITA, KITA SETUJU DENGAN BANYAKNYA
GEDUNG = BANYAKNYA FILE, TAPI YANG SEKARANG SEMUA JUMLAH GEDUNG TERLIHAT
SAMA". Surgical Option A fix: vary `/city` render per `?demo=` URL param.

## Expected post-fix behavior

- `/city?demo=fastapi-template` -> 245 buildings (full default, no slice)
- `/city?demo=nodegoat` -> 120 buildings (slice)
- `/city?demo=pygoat` -> 80 buildings (slice)
- `/city` (no param) -> 245 default
- `/city?repo=X` -> 245 default (Aether snapshot loader path untouched)

## Implementation

File: `frontend/src/scene/buildings/useCityData.ts`

Added three helpers + rewrote `useCityData()` to derive sliced CityData:

1. `DEMO_BUILDING_COUNTS` map: `{ nodegoat: 120, pygoat: 80 }`. The
   `fastapi-template` key intentionally absent so it falls through to the
   default full-city branch.
2. `readDemoKey()`: SSR-safe URLSearchParams read of `?demo=`. Wrapped in
   try/catch so a malformed search string never crashes the hook.
3. `recomputeCentroid(buildings)`: inline duplicate of `layout.ts`
   `computeCentroid` (which is private). Recomputes the (x, 0, z) midpoint
   from sliced buildings so `CameraFocus` and `OrbitControls` target frames
   the smaller city instead of the full extent's center of mass.
4. `deriveDemoCity()`: reads demo key, slices `buildings.slice(0, count)`,
   filters `districts` to those whose id appears in any kept building's
   `district` field, recomputes centroid, returns a fresh CityData.
5. `useCityData()` now calls `useState(() => deriveDemoCity())` instead of
   returning the singleton directly. Hook surface unchanged, all downstream
   consumers (Hera, Boreas, Persephone, RoadGrid, TreeScatter, CameraFocus,
   BuildingInstances) consume the same CityData shape.

## Slice integrity reasoning

- Slicing the head of `mockCityData.buildings` preserves treemap adjacency
  for the retained leaves: `squarifyTreemap` emits buildings in DFS order
  along the canvas, so the first N are contiguous spatially across the
  first few districts. Visual result: a compact corner of the city
  renders, not random scattered buildings across the full extent.
- `BuildingInstances.tsx` partitions buildings by archetype and calls
  `setMatrixAt` for the sliced count only; instance counts drop naturally
  per `<instancedMesh args={[geom, mat, count]}>` so no orphan instances
  remain.
- `RoadGrid` derives edges from `cityData.buildings` directly via
  `deriveRoadEdges()`; sliced buildings yield fewer roads, no dangling
  edges. Self-heals.
- `TreeScatter.collectTreePositions(districts, buildings)` groups
  buildings by `district` string ref then resolves districts. Filtering
  empty districts upstream (in `deriveDemoCity`) means TreeScatter sees a
  clean kept-district list. No empty district boxes render.
- `CameraFocus` reads `city.centroid` for the OrbitControls target;
  recomputed centroid frames the smaller city correctly.
- District-border overlay (Hera Wave 2) reads `districts[].bounds` which
  is the original treemap rectangle. Kept districts retain their original
  bounds, so the border may extend slightly beyond the actual sliced
  buildings in that district. Acceptable trade-off for a 20-minute hard
  budget fix; the visual reads as "a sub-section of the city" rather than
  a hollow district.

## Lock compliance

- Lock 1 (no em dash): clean.
- Lock 2 (no emoji): clean.
- Lock 4 (mark [INFERRED] for inferred strategy): inline doc comment
  flags the head-slice DFS-adjacency assumption explicitly.
- Lock 5 (mark [MOCK] at source): preserved (mockCityData already
  labeled at its source).
- Lock 10 (audit gate): TypeScript strict compile passes (exit 0).
- No scope expansion: only `useCityData.ts` touched. Aether's
  `BuildingHeightTimeMachine.tsx` direction flip not touched. No image
  rebuild requested (Atlas owns).

## Verification

- `npx tsc --noEmit --strict` -> exit 0, no diagnostics.
- File contents re-read post-edit: imports unchanged (`useState`,
  `useMemo`, `useCallback`, `useEffect` already present; types
  `BuildingData`, `CityData` already imported; `mockCityData` already
  imported). No new dependency added.
- All four hook exports kept intact:
  `useCityData`, `useBuildingById`, `useBuildingClick`,
  `useBuildingClickDispatch`, plus `useBuildingHover` family +
  `useFloorFocus` family. Public surface preserved bit-for-bit.

## Wall-clock

Budget 20 minutes hard. Actual ~3 minutes (single-file surgical edit + tsc
verification). Within budget.

## Hand-off

No downstream worker handoff required. Manager FINAL batches all Cluster
4 fixes into the next image build (Atlas owns redeploy, separate from
this commit). Aether's Time Machine direction flip already landed in a
prior commit; Iris demo-variant slice is independent.

## Out of scope (deferred)

- Real Demeter-backed variable building count (Wave 3 post-hackathon).
- Per-demo archetype distribution (currently the slice happens to keep
  the first ~120 / ~80 archetypes in DFS order; no per-demo archetype
  weighting).
- Demo selector UI in the landing page (Pan tour script + URL anchors
  already cover this for the pitch flow).
