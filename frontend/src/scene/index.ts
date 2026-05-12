/**
 * Scene barrel.
 *
 * Daedalus owns the root scene + Canvas + PerformanceContext + feature
 * flags. Iris owns the building geometry subtree under `./buildings/*` and
 * re-exports BuildingData + DistrictData + 5 archetype types from
 * `./buildings/types.ts`.
 *
 * To avoid collisions when both workers Edit this file in parallel during
 * Wave 1, each side namespaces its re-exports clearly. Iris should ADD a
 * single line at the END of this file:
 *
 *   export * from './buildings';
 *
 * Daedalus authors only the lines below.
 */

// Public Daedalus surface area (Pythia contract daedalus-to-iris.md).
export { ChronicleCanvas } from './Canvas';
export { usePerformanceState } from './PerformanceContext';
export { FEATURE_FLAGS } from './feature-flags';

// Wave-Fixing #2 cycle 1 additions per PRD Section 7.3 Stretch Tier 1.
// CinematicIntro mounts internally via ChronicleCanvas enableIntro prop, no
// re-export needed. DirectorModeButton mounts OUTSIDE the Canvas as a DOM
// overlay (sibling of ChronicleCanvas) so it ships in the public surface.
export { DirectorModeButton, useDirectorStore } from './DirectorMode';

// Public types.
export type {
  ChronicleCanvasProps,
  PerformanceState,
  FeatureFlags,
} from './types';

// Iris building surface area. Re-exports from `./buildings/index.ts` which
// owns the 5 archetype + generic geometry + treemap layout + ownership +
// mock data + useCityData/useBuildingClick/useBuildingById hooks. Wave 2
// worker Hera consumes via `@/scene` barrel as documented in Pythia
// contract `iris-to-hera.md`.
export * from './buildings';
