# Contract: Iris to Hera

**Edge type**: cross-wave (Wave 1 to Wave 2)
**Wave**: Wave 1 producer to Wave 2 consumer
**Status**: locked
**Authored**: 2026-05-12 15:05 WIB

## Producer

**Worker**: Iris (Wave 1)
**Domain**: Building geometry (5 archetype + generic) via raw `<instancedMesh>` per archetype, squarified treemap deterministic layout for x/z positioning, ownership color encoding via CODEOWNERS regex + git blame mock data Wave 1, LOD + frustum culling, window pattern (dense+warm tint active, sparse+cold tint idle, mock Wave 1).

## Consumer

**Worker**: Hera (Wave 2)
**Domain**: Sprint Mode HERO 14 PM concept visual mapping overlay (scaffolding, crane, blueprint pin, transient green glow, yellow tape, smoke/retak, size badge, City Hall banner, district border, DoD checklist, inspector NPC, red bridge, ghost building handoff, retak pattern handoff). PR comment surfacing visual (OQ-05 decided hari-H). Click building to ticket panel hookup. PR-to-Building auto-sync webhook visual state machine.

## Output schema (producer to consumer)

Iris exports a building data shape plus a render component. Hera consumes the shape to overlay PM concepts on each building.

```typescript
// frontend/src/scene/buildings/types.ts

export type BuildingArchetype =
  | 'temple'             // Athena City Hall landmark
  | 'cross-shape'        // Apollo Hospital landmark
  | 'surveillance-tower' // Argus Police Station landmark
  | 'vertical-stack'     // Clio Library landmark
  | 'glass-cube'         // Hermes Tourist Info landmark
  | 'generic-residence'  // Files outside landmarks
  | 'generic-warehouse'  // Large generated files (e.g., bundles, datasets)
  | 'generic-office';    // Source code files with multi-author ownership

export interface BuildingData {
  /** Stable identifier; for code files, the relative path from repo root. */
  id: string;
  /** Display label, short form. For files, basename. */
  label: string;
  /** Archetype determines geometry + base color. */
  archetype: BuildingArchetype;
  /** District identifier; treemap layout groups by district. */
  district: string;
  /** World position [x, y, z]; y is height-on-ground (always 0 for base). */
  position: [number, number, number];
  /** Building height in world units; encodes file size or LOC. */
  height: number;
  /** Building footprint width in world units. */
  width: number;
  /** Building footprint depth in world units. */
  depth: number;
  /** Ownership color hex (#RRGGBB) sourced from CODEOWNERS + git blame top contributor. */
  ownershipColor: string;
  /** Activity intensity 0..1; encodes commit frequency in mock data Wave 1. */
  activity: number;
  /** Window pattern tint 'warm' (active file) or 'cold' (idle file). */
  windowTint: 'warm' | 'cold';
  /** Optional metadata for Wave 2 worker overlays; opaque to Iris. */
  metadata?: Record<string, unknown>;
}

export interface DistrictData {
  /** Stable district identifier; for folders, relative path from repo root. */
  id: string;
  /** Display label. */
  label: string;
  /** Bounding rectangle in world space [minX, minZ, maxX, maxZ]. */
  bounds: [number, number, number, number];
  /** Owner team string from CODEOWNERS file (e.g., "@backend-team"). */
  owner: string;
}

export interface CityData {
  buildings: BuildingData[];
  districts: DistrictData[];
  /** Centroid of city extent, useful for camera target initial position. */
  centroid: [number, number, number];
}
```

Iris exposes a hook for Wave 2 workers to subscribe:

```typescript
// frontend/src/scene/buildings/useCityData.ts
import { CityData, BuildingData } from './types';

/** Returns full city data (deterministic per repo, Wave 1 mock data). */
export const useCityData: () => CityData;

/** Returns building by id, undefined if not found. */
export const useBuildingById: (id: string) => BuildingData | undefined;

/** Subscribe to building click events; returns unsubscribe function. */
export const useBuildingClick: (
  handler: (building: BuildingData, event: ThreeEvent<MouseEvent>) => void
) => void;
```

Hera consumes the data + click subscription:

```tsx
// frontend/src/modes/sprint/SprintOverlay.tsx (Hera)
import { useCityData, useBuildingClick } from '@/scene/buildings';

export const SprintOverlay: React.FC = () => {
  const city = useCityData();
  useBuildingClick((building, event) => {
    // Open ticket panel via Persephone slot
  });
  return (
    <>
      {city.buildings.map((b) => (
        <BuildingPMOverlay key={b.id} building={b} />
      ))}
    </>
  );
};
```

## Storage location

- Types: `frontend/src/scene/buildings/types.ts` (Iris authors)
- Hooks: `frontend/src/scene/buildings/useCityData.ts` (Iris authors)
- Wave 1 mock data: hardcoded JSON loaded once at scene mount, stored at `frontend/src/scene/buildings/mockCityData.ts`
- Wave 3 real data: replaced via `demeter-to-selene.md` related contract; Iris hook implementation updated to subscribe to WebSocket event stream from Demeter

## Asumption baked

1. CityData is computed once per repo + cached deterministically. Squarified treemap layout is stable: same input produces same x/z positioning (Iris guarantees determinism).
2. BuildingData.metadata is opaque to Iris but reserved for Wave 2 worker writes. Hera uses metadata to attach PM concept state (e.g., `metadata.sprintStatus`, `metadata.crane`, `metadata.scaffolding`).
3. Iris does NOT mutate BuildingData post-render; updates flow via React state + re-render. Wave 2 workers MUST NOT mutate; create derived state if needed.
4. Building click events bubble through r3f event system; Iris intercepts via parent `<group onClick>` wrapper. Wave 2 worker subscription is fanout-safe (multiple subscribers, no conflict).
5. Ownership color is mock Wave 1 (hardcoded palette mapping); real CODEOWNERS regex Wave 3 via Demeter event-store query.

## Validation steps

**Producer responsibility (Iris)**:
- `mockCityData.ts` contains 100-300 buildings per H1 hypothesis benchmark.
- Each building has valid archetype + non-overlapping position via deterministic treemap.
- Click event dispatched within 16ms of mouse-down on building face.
- `useCityData()` returns stable reference across renders (memoization).
- LOD active beyond camera distance threshold (Drei `<Detailed>` wraps generic archetypes; landmarks always full-detail).

**Consumer responsibility (Hera)**:
- Subscribe to `useBuildingClick` exactly once per component mount (avoid double-fire).
- Read BuildingData.metadata writes via Iris-provided update mechanism, NOT direct mutation.
- PM overlay components mount AS CHILDREN of the building group, NOT siblings (transform inheritance).
- 14 PM concept visuals overlay-respect Drop-first feature flag order; visual flags drop before functional flags.

## Edge case handling

- Building click on overlapping geometry: r3f raycaster returns closest; Iris exposes `event.distance` to consumer for tiebreaker.
- Empty city (0 buildings): Iris returns CityData with `buildings: []`; Hera renders nothing, no error.
- Building ID collision (rare for code files but possible for path normalization edge cases): Iris suffixes with `#N` counter; documented in mockCityData.
- District bounds overlap (treemap edge case): squarified algorithm guarantees no overlap; if detected, log + skip the conflicting district.

## Open questions

- OQ-05 (PR comment surfacing visual): Hera decides hari-H from 3 candidates (sticky note 3D, floating speech bubble, marker pin + badge). Non-overlap constraint with scaffolding+crane+banner is mandatory (Dike audit gate verifies). Document Hera decision at `_meta/decisions/oq05_pr_comment_visual.md`.
- BuildingData.metadata schema for Wave 2 PM concepts: deferred to Hera authoring; Pythia leaves metadata as opaque Record. Hera publishes concrete schema in `hera-to-persephone.md` for ticket panel consumption.

## Reference

- Metis Agentic Structure md Section 2 DAG: Iris to Hera edge (building data shape consumed by Hera Sprint overlay Wave 2)
- Metis Section 5.2 Iris ship criteria + Section 5.4 Hera ship criteria
- PRD Section 9.2 (Sprint Mode HERO 14 PM concept visual mapping table)
- PRD Section 7.2 (3D City View architecture)
- Phase B Deep Research compass_artifact Topic D (r3f #3306 raw instancedMesh anchor)
- OQ-05 reference: PRD Section 25 + Hera Wave 2 ship criteria
