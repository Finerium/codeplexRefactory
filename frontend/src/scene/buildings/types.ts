/**
 * Building geometry + treemap layout type definitions.
 *
 * Authored by Iris (Wave 1) per Pythia contract `iris-to-hera.md`. The schema
 * here is the canonical contract; Wave 2 worker Hera consumes BuildingData +
 * DistrictData + CityData to overlay 14 PM concept visuals on each building
 * (scaffolding, crane, blueprint pin, transient glow, retak crack, etc).
 *
 * Schema discipline: BuildingData.metadata is intentionally opaque to Iris.
 * Wave 2 worker writes metadata via Iris-provided update mechanism, no direct
 * mutation. See `useCityData.ts` for update semantics.
 */

/**
 * Building archetype determines geometry + base color tone. 5 landmark
 * archetypes map to 5 AI residents (Athena/Apollo/Argus/Clio/Hermes per PRD
 * Section 10) plus 3 generic archetypes that distinguish file role (regular
 * source code, large generated bundles, multi-author core modules).
 */
export type BuildingArchetype =
  | 'temple'
  | 'cross-shape'
  | 'surveillance-tower'
  | 'vertical-stack'
  | 'glass-cube'
  | 'generic-residence'
  | 'generic-warehouse'
  | 'generic-office';

/**
 * Window tint encodes activity heuristic: warm tint signals an active file
 * (recent commit + open ticket in mock Wave 1), cold tint signals an idle
 * file (no recent commit + no open ticket). Window density also scales with
 * BuildingData.activity, so the visual reads as "dense warm = busy" or
 * "sparse cold = quiet".
 */
export type WindowTint = 'warm' | 'cold';

/**
 * Optional landmark slot. When set, the building hosts a runtime AI resident
 * persona (Athena = City Hall temple, Apollo = Hospital cross, Argus = Police
 * Station tower, Clio = Library stack, Hermes = Tourist Info beacon).
 * Wave 1 mock data places exactly one of each per city; real mode Wave 3
 * derives landmark assignment from district ownership concentration.
 */
export type LandmarkSlot = 'athena' | 'apollo' | 'argus' | 'clio' | 'hermes';

/**
 * One building in the 3D city. Each maps to a code file in real mode (Wave 3
 * via Demeter event store) or a synthetic stub in Wave 1 mock data. Position
 * is computed by the squarified treemap algorithm in `layout.ts`, so changing
 * inputs yields stable output (deterministic).
 */
export interface BuildingData {
  /** Stable identifier. In real mode, the relative path from repo root. */
  id: string;
  /** Display label, basename for file buildings. */
  label: string;
  /** Archetype determines geometry + base palette. */
  archetype: BuildingArchetype;
  /** Optional landmark slot for the 5 AI residents. */
  landmark?: LandmarkSlot;
  /** District identifier; treemap layout groups buildings by district. */
  district: string;
  /** World position [x, y, z]; y is height-on-ground (always 0 for base). */
  position: [number, number, number];
  /** Building height in world units; encodes file size or LOC. */
  height: number;
  /** Building footprint width in world units. */
  width: number;
  /** Building footprint depth in world units. */
  depth: number;
  /** Ownership hex color (#RRGGBB) from CODEOWNERS + git blame top contributor. */
  ownershipColor: string;
  /** Activity intensity 0..1; encodes commit frequency in mock Wave 1. */
  activity: number;
  /** Window pattern tint, 'warm' (active file) or 'cold' (idle file). */
  windowTint: WindowTint;
  /** Optional metadata reserved for Wave 2 worker overlays; opaque to Iris. */
  metadata?: Record<string, unknown>;
}

/**
 * One district (folder/module) in the 3D city. District bounds are the
 * rectangle that contains all child buildings, computed by the treemap algo.
 * Wave 2 worker Hera draws district borders + epic flags on top of these
 * bounds.
 */
export interface DistrictData {
  /** Stable district identifier; for folders, the relative path from repo root. */
  id: string;
  /** Display label. */
  label: string;
  /** Bounding rectangle in world space [minX, minZ, maxX, maxZ]. */
  bounds: [number, number, number, number];
  /** Owner team from CODEOWNERS (e.g., "@backend-team" or "@hafiz"). */
  owner: string;
  /** Ownership color derived from owner string via djb2 hash; matches CSS hex. */
  ownerColor: string;
  /** Treemap recursion depth; 0 = top-level folder, 1 = subfolder, etc. */
  treemapDepth: number;
}

/**
 * Aggregate city data. Centroid is the (x, z) center of all building bounds,
 * useful for OrbitControls initial target position so the camera frames the
 * city. Wave 1 returns a single deterministic CityData computed from mock
 * inputs; Wave 3 streams via Demeter WebSocket.
 */
export interface CityData {
  buildings: BuildingData[];
  districts: DistrictData[];
  /** Centroid of city extent, the OrbitControls target seed. */
  centroid: [number, number, number];
}

/**
 * Input shape for the treemap layout algorithm. Each node is a folder (with
 * children) or a leaf (a file with weight). Folders inherit weight from
 * children. Used by `layout.ts` squarified treemap to compute deterministic
 * x/z positioning + width/depth for each building.
 */
export interface TreemapNode {
  /** Stable node id (folder path or file path). */
  id: string;
  /** Display label. */
  label: string;
  /** Owner team string (CODEOWNERS source). */
  owner: string;
  /** Optional weight for leaf (file LOC). Folders aggregate children weight. */
  weight?: number;
  /** Optional children for folder nodes. */
  children?: TreemapNode[];
  /** Optional archetype hint for leaf nodes; default 'generic-residence'. */
  archetype?: BuildingArchetype;
  /** Optional landmark slot for special placement. */
  landmark?: LandmarkSlot;
  /** Optional activity hint 0..1; default 0.3. */
  activity?: number;
}

/**
 * Result of the treemap layout pass. Buildings + districts derived from a
 * TreemapNode root. Centroid computed as the midpoint of root bounds.
 */
export interface TreemapResult {
  buildings: BuildingData[];
  districts: DistrictData[];
  centroid: [number, number, number];
}
