/**
 * Shared road edge derivation.
 *
 * Owner: Daedalus (Manager FINAL Cycle 2 STAMP 20260513-0857).
 *
 * Single source of truth for the deterministic mock road network. Both
 * `RoadGrid` (visible emissive line strips) and `FlyingCars` (cars looping
 * along the road segments) consume the same edge list so the cars visibly
 * track the lit corridors rather than orbiting through empty air.
 *
 * Extraction rationale: Wave-Fixing 3 placed `deriveDependencyEdges` inline
 * inside `RoadGrid.tsx` which made `FlyingCars` rely on independent orbital
 * loops. Ghaisan caps-lock Manager FINAL Cycle 2 directive demands "JALANNYA
 * HARUS KELIATAN DAN MOBILNYA" with cars riding the road, not orbiting at
 * altitude. This module unifies the math.
 *
 * Determinism: edges are derived by a Mulberry32 seeded RNG keyed on a
 * stamped date constant so every reload yields identical roads. Cars
 * positioned via parametric `t in [0, 1]` along each edge maintain stable
 * coverage independent of wall-clock.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 *   Lock 4 ([INFERRED] mock heuristic): documented per-function.
 *   Lock 5 ([MOCK Wave 1, real Wave 3 Hades parser]): labeled below.
 *
 * [MOCK Wave 1 import-dependency edges, real Wave 3 Hades parser emits the
 *  actual import graph via Demeter event store. Same return shape.]
 */

import type { BuildingData } from './buildings';

/**
 * One road segment between two building centroids on the ground plane.
 */
export interface RoadEdge {
  fromX: number;
  fromZ: number;
  toX: number;
  toZ: number;
  /** Pre-computed segment length (sqrt(dx^2 + dz^2)). Cars use for speed. */
  length: number;
  /** Pre-computed yaw angle so cars heading along it face the right way. */
  yaw: number;
}

/**
 * Mulberry32 seeded RNG. Stable across reloads when seeded with the same
 * integer. Same algorithm as the previous in-line implementation, lifted to
 * shared scope.
 */
function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    let t = (state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Lock the seed to a stamped date constant so the road network never
 * flickers between rehearsal and live pitch. Manager FINAL Cycle 2 STAMP.
 */
const ROAD_RNG_SEED = 20260513_0857;

/**
 * Derive the deterministic mock road network from the city building list.
 *
 * Strategy (kept stable with Wave-Fixing 3 behavior plus length+yaw cache):
 *   - Group buildings by district.
 *   - For each active building (activity >= 0.4) emit 1 to 2 short edges to
 *     the spatially closest same-district peers.
 *   - For each landmark building emit one long cross-district hop to a
 *     random active building elsewhere.
 *
 * Edge count target: ~80 to 150 segments across a 240 building city, dense
 * enough to read as a road network without overwhelming the Bloom pass.
 */
export function deriveRoadEdges(buildings: BuildingData[]): RoadEdge[] {
  if (buildings.length < 2) return [];
  const rng = mulberry32(ROAD_RNG_SEED);
  const edges: RoadEdge[] = [];

  // Group buildings by district for efficient neighbor lookup.
  const byDistrict = new Map<string, BuildingData[]>();
  for (const b of buildings) {
    const list = byDistrict.get(b.district) ?? [];
    list.push(b);
    byDistrict.set(b.district, list);
  }
  // Sort each district list deterministically so the rng output is stable.
  for (const list of byDistrict.values()) {
    list.sort((a, b) => a.id.localeCompare(b.id));
  }

  // Short edges: most active third of buildings to 1-2 closest same-district
  // peers.
  const active = buildings
    .filter((b) => b.activity >= 0.4)
    .sort((a, b) => a.id.localeCompare(b.id));
  for (const src of active) {
    const peers = byDistrict.get(src.district);
    if (!peers || peers.length < 2) continue;
    const sorted = peers
      .filter((p) => p.id !== src.id)
      .map((p) => {
        const dx = p.position[0] - src.position[0];
        const dz = p.position[2] - src.position[2];
        return { peer: p, d2: dx * dx + dz * dz };
      })
      .sort((a, b) => a.d2 - b.d2);
    const pickCount = 1 + Math.floor(rng() * 2);
    for (let i = 0; i < pickCount && i < sorted.length; i++) {
      const dst = sorted[i].peer;
      edges.push(makeEdge(src.position[0], src.position[2], dst.position[0], dst.position[2]));
    }
  }

  // Long edges: each landmark to a random active building elsewhere.
  const landmarks = buildings
    .filter((b) => Boolean(b.landmark))
    .sort((a, b) => a.id.localeCompare(b.id));
  for (const src of landmarks) {
    const dstIdx = Math.floor(rng() * active.length);
    const dst = active[dstIdx];
    if (!dst || dst.id === src.id) continue;
    edges.push(makeEdge(src.position[0], src.position[2], dst.position[0], dst.position[2]));
  }

  return edges;
}

function makeEdge(fromX: number, fromZ: number, toX: number, toZ: number): RoadEdge {
  const dx = toX - fromX;
  const dz = toZ - fromZ;
  const length = Math.sqrt(dx * dx + dz * dz);
  // The road box is laid along its local +x then yawed; cars share the
  // same yaw so they face along the segment. Negate to match RoadGrid math.
  const yaw = -Math.atan2(dz, dx);
  return { fromX, fromZ, toX, toZ, length, yaw };
}
