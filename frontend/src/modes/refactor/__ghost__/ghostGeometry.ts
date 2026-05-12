/**
 * Ghost geometry builders for Refactor Mode ghost buildings.
 *
 * Owner: Asclepius (Wave 2).
 *
 * Design note (D3 in `_meta/decision_log/asclepius.md`): Iris exposes
 * archetype geometry builders inside `frontend/src/scene/buildings/`, but
 * does NOT re-export the builders via the barrel (see
 * `frontend/src/scene/buildings/index.ts` line 20-26: "Archetype geometry
 * builders are intentionally NOT re-exported"). The recommended path is
 * direct import with full path. We follow that: this module imports the 3
 * generic archetype builders directly + provides a thin facade indexed by
 * `GhostArchetype` enum so `GhostBuilding.tsx` does not need to know about
 * Iris internals.
 *
 * Geometries are computed once at module load and reused across all
 * ghost instances (matches the Iris BuildingInstances memo pattern; one
 * BufferGeometry per archetype shared across instances).
 *
 * Compliance: Lock 1 (no em dash). Lock 2 (no emoji).
 */

import type { BufferGeometry } from 'three';
import {
  buildResidenceGeometry,
  buildWarehouseGeometry,
  buildOfficeGeometry,
} from '@/scene/buildings/genericArchetype';
import type { GhostArchetype } from '../simulationEvents';

/**
 * Singleton geometry index. Each ghost archetype maps to the matching Iris
 * generic geometry; Wave 3 may extend with landmark archetypes if Athena
 * proposals start suggesting landmark-tier files (rare, but possible).
 */
const GEOMETRY_CACHE: Record<GhostArchetype, BufferGeometry> = {
  'generic-residence': buildResidenceGeometry(),
  'generic-warehouse': buildWarehouseGeometry(),
  'generic-office': buildOfficeGeometry(),
};

/**
 * Public accessor. Returns the cached geometry for the requested archetype.
 * The returned BufferGeometry is safe to share across multiple <mesh>
 * components (Three.js geometry is reference-counted at the GPU level via
 * the renderer's internal cache).
 */
export function getGhostGeometry(archetype: GhostArchetype): BufferGeometry {
  return GEOMETRY_CACHE[archetype];
}
