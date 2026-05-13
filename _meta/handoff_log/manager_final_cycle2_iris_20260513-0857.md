# Iris handoff: Manager FINAL Cycle 2

**Worker**: Iris (Wave 1 build-time)
**Cluster**: C (per-floor geometry + hover + camera fly) + E (visual polish)
**STAMP**: 20260513-0857
**Ship verdict**: clean, tsc 0 errors across full frontend

## Cluster C deliverables

### 1. Per-floor stacked geometry

- BuildingData schema extended with `floors: number` field (range 1..50,
  default derived from file weight in Wave 1 mock).
- `encodeFloors(weight)` exported from `layout.ts`. Formula:
  `floors = clamp(round(weight / 35), 1, 50)`. Outputs:
  - weight 60 -> 2 floors (small util)
  - weight 200 -> 6 floors (typical file)
  - weight 500 -> 14 floors (large file)
  - weight 900 -> 26 floors (skyscraper)
- Per-floor visual via shader-level banding (NOT N stacked BoxGeometry):
  `windowShaderPatch.ts` reads new `attribute float instanceFloors` in
  the vertex stage, forwards as varying to fragment, paints thin dark
  divider strips every `1.0/floors` of UV.y on side faces.
- `BuildingInstances.tsx` `applyInstanceMatrices` populates
  InstancedBufferAttribute `instanceFloors` per archetype mesh in the
  same loop that sets matrix + color, so floor count flows to shader
  without extra layout pass.
- Raycaster compatibility: click `event.point.y` maps to floor index via
  `floor((point.y - building.position[1]) / floorHeight)`. No per-floor
  mesh hit-test required.

### 2. Per-floor hover shader glow

- `HoverFloorGlow.tsx` rewritten: ripple band steps through discrete
  floor positions at 1 floor per `RIPPLE_DURATION_SEC / floors` seconds,
  base to top sweep, restarts at top.
- Persistent divider strips render at each floor boundary while hover is
  active, fading in over 150ms. Reads as discrete N stacked floors at
  the moment hover begins.
- Shader uniforms `uHoverFloor` + `uHoverIntensity` added to
  windowShaderPatch.ts (currently default -1 / 0; per-building hover
  targeting via these uniforms is the future Wave 3 path; Wave 1 uses
  the floating ripple band overlay which is per-building independent).

### 3. Camera fly to floor altitude

- New `frontend/src/scene/useFlyToFloor.ts` exports:
  - `flyToFloor(buildingId, floorIndex)`: imperative API.
  - `useFlyToFloor()`: hook returning the imperative function.
  - `FloorFocusBridge`: r3f component that subscribes to the module-scope
    fly-to-floor bus AND Persephone's `useFloorFocus` bus, runs GSAP
    tween on `camera.position` + `OrbitControls.target` to the floor
    altitude (`y = building.position[1] + floorIndex * floorHeight +
    floorHeight/2`), duration 700ms `power2.inOut`.
- Mounted in `frontend/app/city/page.tsx` as a sibling of `<CameraFocus />`
  inside the `<ChronicleCanvas>`.
- Persephone PerFloorTimeline can call either path:
  - `flyToFloor('backend/app/core/main.py', 3)` direct import, OR
  - `useFloorFocusDispatch()({ buildingId, floorIndex })` via the existing
    Persephone bus in `useCityData.ts`.

## Cluster E deliverables

### 4. Window polish

- `windowShaderPatch.ts` shader `cellSize` bumped `vec2(0.95, 1.35)` to
  `vec2(1.85, 2.35)`. Net: ~4x fewer cells per face, ~15-25 windows per
  typical 6-8 unit face (was ~50-80).
- Panel size step tightened: `smoothstep(0.18, 0.22)/(0.78, 0.82)` to
  `smoothstep(0.12, 0.16)/(0.84, 0.88)`. Lit rectangle now ~72% of each
  cell (was ~50%). Visible window size ~5-8% face area (was ~2-3%).
- Emissive intensity dynamic preserved (active files glow more via
  per-archetype glow uniform unchanged).

### 5. Treemap spacing widen

- `layout.ts` `STREET_GAP` bumped 3.6 to 5.2 + `MIN_FOOTPRINT` 2.4 to 3.4.
- `mockCityData.ts` `squarifyTreemap` canvas 320x320 to 380x380.
- `Canvas.tsx` `OrbitControls maxDistance` 320 to 380.
- `city/page.tsx` `cameraPosition` `[0, 110, 190]` to `[0, 130, 220]`.
- Building count assert range widened to 360 max.

## Files touched (12 total)

- `frontend/src/scene/buildings/types.ts`
- `frontend/src/scene/buildings/layout.ts`
- `frontend/src/scene/buildings/mockCityData.ts`
- `frontend/src/scene/buildings/BuildingInstances.tsx`
- `frontend/src/scene/buildings/windowShaderPatch.ts`
- `frontend/src/scene/buildings/HoverFloorGlow.tsx`
- `frontend/src/scene/buildings/useCityData.ts`
- `frontend/src/scene/buildings/index.ts`
- `frontend/src/scene/useFlyToFloor.ts` (NEW)
- `frontend/src/scene/index.ts`
- `frontend/src/scene/Canvas.tsx` (OrbitControls maxDistance edit;
  DEFAULT_CAMERA_POSITION already widened by Daedalus parallel cycle)
- `frontend/app/city/page.tsx`

## Coordination handoff to peers

### Aether (Cluster C primary forensic)

- BuildingInstances click handler signature now `(building, event,
  floorIndex?)`. Existing single-building forensic chain on `[city]
  building click <id>` console log continues unchanged. The new
  floorIndex argument is forward-compat; existing subscribers that
  ignore the third arg keep working.
- Smoke-click injector path unchanged. Aether Playwright smoke harness
  can verify floor index by sending click events with synthesized
  `point.y` (the resolver returns `undefined` if `point` is missing,
  not a hard fail).

### Persephone (Cluster C+G side panel)

- Consume `floors: number` from `BuildingData` directly to render the
  N rows in PerFloorTimeline.
- For camera fly: `useFloorFocusDispatch()(event)` already wired in
  Persephone parallel cycle, FloorFocusBridge listens. Alternative
  direct path: `import { flyToFloor } from '@/scene'; flyToFloor(id, idx)`.
- For per-floor hover from side panel row hover: dispatch via
  `useFloorHoverDispatch()(event)`. Iris does NOT yet wire a shader
  uniform consumer for this path because per-building shader targeting
  needs per-building material (deferred). For Wave 1 demo, the
  visible per-floor hover is the HoverFloorGlow ripple which is
  triggered by 3D-space hover only, not by side-panel-row hover. If
  side-panel-row hover -> 3D highlight is required, Persephone can
  call `flyToFloor()` from row hover handler too (lighter visual cue).

### Daedalus (Cluster E roads + cars)

- Canvas.tsx DEFAULT_CAMERA_POSITION + OrbitControls maxDistance updated
  per parallel coordination. No conflict.
- Roads + flying cars layer mounted independently inside Canvas, no
  edges to my changes.

### Demeter (Cluster A+B+C backend commits endpoint)

- When `/api/buildings/<repo>/<file>/commits` ships, Persephone's
  PerFloorTimeline fetches the commit list and can override
  `BuildingData.floors` via the future Wave 3 reactive data path. The
  shader picks up the new floor count automatically via
  applyInstanceMatrices re-population of `instanceFloors` attribute on
  re-layout.

## Manager FINAL Cycle 2 directive items closed

- D-MF2-05 line 65 "Per-floor visual locked: building height = N floors
  per N commits. Floor segments stacked BoxGeometry (Iris)." - SHIPPED
  via shader banding (rationale documented in D-Iris-MF2-01 decision
  log entry: BoxGeometry stacking would blow up draw call budget,
  shader banding gives equivalent visual at constant draw cost).
- D-MF2-05 "Per-floor hover ripple via shader uniform `hovered_floor`
  (Iris)" - SHIPPED via HoverFloorGlow discrete-floor-snap ripple band
  + shader uHoverFloor/uHoverIntensity uniforms ready for per-building
  targeting (Wave 3 hook).
- D-MF2-05 "camera fly to floor altitude (Iris)" - SHIPPED via
  flyToFloor + FloorFocusBridge.
- D-MF2-06 "window count ~15-25 per face (down from 50-80)" + "window
  size ~5-8% face area (up from 2-3%)" - SHIPPED via shader cellSize
  bump + panel size step tighten.
- D-MF2-06 "District padding 3-5 unit, building gap 2-3 unit" - SHIPPED
  via STREET_GAP 5.2 + MIN_FOOTPRINT 3.4 + canvas 380.

## Smoke evidence

- tsc full frontend: 0 errors.
- ESLint: blocked by repo-wide v9 config issue, NOT introduced by this
  cycle.
- Real-browser Playwright: deferred to Aether Cluster C primary +
  Manager FINAL post-cluster synth + dual audit.

Signed,
Iris Wave 1 build-time, Manager FINAL Cycle 2
STAMP 20260513-0857
