# Handoff Log: Wave 1 Iris to Wave 2 Hera

**Edge**: Wave 1 Iris (build-time, scene/buildings) -> Wave 2 Hera (Sprint
Mode HERO 14 PM concept overlay).
**Contract**: `_meta/contracts/iris-to-hera.md` (locked Wave 0 Pythia).
**Date**: 2026-05-12 ~20:40 WIB
**Status**: Iris ship clean, awaiting Eunomia Wave 1 audit gate PASS to
unlock Wave 2 Hera spawn.

## What Iris delivers

### Public API surface (consume via `@/scene` barrel)

```typescript
import {
  // Components
  BuildingInstances,

  // Data hooks
  useCityData,
  useBuildingById,

  // Click event subscription
  useBuildingClick,
  useBuildingClickDispatch,

  // Mock data (Wave 1 only, Wave 3 replaces with WebSocket stream)
  mockCityData,

  // Helpers
  squarifyTreemap,
  encodeHeight,
  deriveWindowTint,
  deriveOwnerColor,
  djb2,
  parseCodeowners,
  resolveOwner,
  OWNERSHIP_PALETTE,
} from '@/scene';

import type {
  BuildingArchetype,
  BuildingData,
  DistrictData,
  CityData,
  LandmarkSlot,
  WindowTint,
  TreemapNode,
  TreemapResult,
  CodeownersRule,
  BuildingClickHandler,
} from '@/scene';
```

### Mount pattern (verified working in Iris smoke page)

```tsx
'use client';
import { ChronicleCanvas } from '@/scene';
import {
  BuildingInstances,
  useCityData,
  useBuildingClick,
  useBuildingClickDispatch,
} from '@/scene/buildings';

function CityScene() {
  const city = useCityData();
  const dispatchClick = useBuildingClickDispatch();
  // Hera subscribes; multiple subscribers (Persephone, Boreas) safe
  useBuildingClick((building, event) => {
    // Open ticket panel via Persephone slot
  });
  return <BuildingInstances data={city} onBuildingClick={dispatchClick} />;
}

export default function CityPage() {
  return (
    <ChronicleCanvas>
      <CityScene />
    </ChronicleCanvas>
  );
}
```

### Behavioral guarantees

1. **Determinism**: same `mockCityData` import = same building x/z positions
   across reload + across renders. Hera PR-to-Building overlay positions
   stable.
2. **Click event**: Hera subscribes via `useBuildingClick(handler)`, handler
   receives `(building: BuildingData, event: ThreeEvent<MouseEvent>)`. Click
   on overlap geometry: r3f raycaster picks closest, Iris exposes
   `event.distance` for tiebreaker.
3. **Color encoding**: per-instance `setColorAt` applied; activity 0..1
   scales brightness 0.85 to 1.15 of base ownershipColor. The 12-hue palette
   reads across the city.
4. **LOD coordination**: when `usePerformanceState().regressing === true`,
   the 3 generic archetypes drop shadow casting (cast + receive false). The
   5 landmark archetypes always cast shadows (iconic silhouettes
   non-negotiable per PRD 13.3).
5. **Frustum culling**: each `<instancedMesh>` has `frustumCulled={true}`.
   r3f r3f-perf overlay (Daedalus may mount in dev) shows draw count drops
   as camera moves so off-screen archetypes culled automatically.

## What Hera Wave 2 needs to know

### 14 PM concept visual mapping (per PRD Section 9.2)

Each PM concept attaches to BuildingData via metadata field. Iris reserves
`BuildingData.metadata` opaque for Wave 2 worker writes. Suggested keys
(Hera publishes concrete schema in `hera-to-persephone.md` for ticket panel
consumption):

| PM Concept | Suggested metadata key | Geometry slot |
|---|---|---|
| Scaffolding (active ticket) | `metadata.scaffolding: boolean` | Wrap building group with `<Scaffolding>` Hera component |
| Crane (open PR) | `metadata.craneState: 'idle' \| 'reviewing' \| 'merging'` | Mount `<Crane>` as child of building group, anchor on building.position |
| Blueprint pin | `metadata.blueprint: { milestone: string }` | Floating `<BlueprintPin>` mounted at `[position.x, position.y + height, position.z]` |
| Done green glow (24h) | `metadata.doneAt: ISO timestamp` | Hera mounts emissive halo light, animated decay |
| Yellow tape blocked | `metadata.blocked: boolean` | Hera mounts `<YellowTape>` band wrap |
| Smoke/retak (bug) | `metadata.bug: { severity }` | Hera mounts smoke particle, or activates retak crack pattern texture |
| Story size badge | `metadata.size: 'S' \| 'M' \| 'L' \| 'XL'` | Hera mounts `<SizeBadge>` HUD |
| Banner sprint goal (City Hall only) | `metadata.banner: string` (Athena building only) | Hera reads `building.landmark === 'athena'` + mounts banner |
| District border epic | district-level via `DistrictData.bounds` | Hera reads city.districts, draws border line + epic flag |
| Definition of Done checklist | `metadata.dod: string[]` | Hera mounts floating checklist HUD over building |
| Inspector NPC orbit | `metadata.reviewState: 'pending'` | Hera mounts orbiting NPC sprite |
| Red bridge dependency | edge-level, Hera maintains separately | Hera draws line between 2 building.position points |
| Refactor ghost building | full BuildingData with metadata flag | Iris does NOT generate ghost in Wave 1; Wave 3 Pandora populates new BuildingData with metadata.ghost=true; Hera renders ghost overlay (Iris geometry rendered transparent + dashed outline via Hera shader override) |
| Spec drift retak crack | `metadata.crackPattern: 'A' \| 'B' \| 'C' \| 'D' \| 'E'` | Hera mounts crack texture overlay on building face |

### Click event flow

```
User clicks building face
  -> r3f raycaster fires onClick on archetype InstancedMesh
  -> ArchetypeSlot.handleClick resolves event.instanceId -> BuildingData
  -> Iris dispatches via useBuildingClickDispatch
  -> useBuildingClick subscribers fan-out (Hera + Persephone + Boreas)
  -> Hera opens ticket panel (uses BuildingData.id to fetch ticket data
     from Demeter Wave 3)
  -> Persephone opens side panel (BuildingData.metadata for context)
```

Multiple subscribers safe per Pythia contract Asumption 4. Subscriber error
isolated by try/catch in useCityData dispatch.

### Stable references

`useCityData()` returns same reference until underlying data changes
(memoized). `useBuildingClickDispatch()` returns stable callback identity.
Hera dependencies array safe.

## Validation steps for Hera before consume

1. Run `pnpm dev` + visit `/__iris_smoke` to verify Iris smoke renders 240
   buildings with 8 distinct archetype silhouettes at default camera.
2. Click a building in smoke page, verify console logs the BuildingData id
   + archetype + ownership + landmark + activity.
3. Import `BuildingInstances` + `useCityData` in Hera's SprintOverlay
   component, mount inside the same `<ChronicleCanvas>` as smoke page (do
   not nest a second Canvas).
4. Subscribe via `useBuildingClick(handler)` in Hera component, handler
   receives BuildingData on click.
5. Write to `BuildingData.metadata` via Hera-controlled state update flow
   (NOT direct mutation, per Pythia contract Asumption 3). If Hera needs to
   propagate metadata changes back to all visible overlays, create a Wave 2
   internal `useBuildingMetadata(id)` hook.

## Open questions / handoff caveats

### OQ-Iris-A: Drei <Detailed> LOD deviation

Iris ships LOD via shadow-drop on regress on the 3 generic archetypes, NOT
via Drei `<Detailed>` geometry swap as `.claude/agents/iris.md` Section 9
suggests. Rationale documented in `_meta/decision_log/iris.md` D-Iris-06 +
`_meta/uncertainty/iris-cycle4-20260512-2030.md` U-Iris-03.

If Eunomia audit gate decides this is a critical deviation, re-spawn Iris
to wrap 5 landmark archetypes (not the 200+ generic instances) with Drei
`<Detailed>` swap between full-detail + simplified geometry. Estimated
30-45 min add-on. Generic InstancedMesh remains untouched.

### OQ-Iris-B: Landmark slot assignment algorithm Wave 3

mockCityData pins 5 landmark slots to specific file paths. Wave 3 Demeter
needs a deterministic algorithm to choose landmark slots from real
codebase data. PRD does not specify the assignment algo. Iris is the
geometry owner, not slot assignment owner. Suggested algorithm:

- Athena (temple) -> file with highest LOC in `core/` or root-level entry
- Apollo (cross-shape) -> file in `health/` or `monitoring/` district
- Argus (surveillance-tower) -> file in `security/` or `auth/` district
- Clio (vertical-stack) -> file in `history/` or `archive/` or longest-edited
- Hermes (glass-cube) -> file in `onboarding/` or `docs/` district

Wave 3 Pythia may need to amend `iris-to-hera.md` or author new
`demeter-to-iris.md` contract for this.

### OQ-Iris-C: Window pattern visual encoding deferred

BuildingData carries `windowTint: 'warm' | 'cold'` per Pythia contract.
Iris ships the flag on every BuildingData (derived from activity threshold
in `layout.ts deriveWindowTint`). The VISUAL encoding (texture vs emissive
vs shader uniform) is deferred:

- Wave 2 Hera or Wave 3 Asclepius adds glowing window texture to landmark
  meshes (selective, not on generic InstancedMesh due to per-instance
  texture cost).
- Generic archetypes can read the windowTint flag and tint the building
  color slightly cooler or warmer via vertex color modulation (already in
  applyInstanceMatrices, the `tintScale = 0.85 + activity * 0.3`
  approximation).

## Iris ship status

- Ship clean per `.claude/agents/iris.md` Section 10 ship criteria items.
- 4 mandatory artifact authored.
- 20-item self-check PASS.
- Smoke page `/__iris_smoke` ready for Eunomia audit benchmark.
- TypeScript clean on Iris-owned files (`scene/buildings/*` + smoke page).
- Ferry to V1 Orch: NOT triggered.

Eunomia Wave 1 audit will benchmark H1 60fps assertion + contract
conformance + Lighthouse + page mount. Iris responds to audit findings if
critical-flag fires.
