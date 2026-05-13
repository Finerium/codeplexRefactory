'use client';

/**
 * TreeScatter: instanced pine conifers scattered around city.
 *
 * Owner: Daedalus (Wave-Fixing #2 cycle 1, extracted from Canvas.tsx).
 *
 * Per PRD Section 13.1 mapping: "Pohon antar district | Density map ke test
 * coverage (district well-tested rimbun, tanpa test botak)". Trees encode the
 * test coverage signal visually. Districts with strong test coverage get a
 * dense conifer cluster; districts with low coverage get sparse or no trees.
 *
 * Layered logic:
 *   - Ring outside the Iris treemap envelope (~140 to ~260 unit radius) gives
 *     the city a green border belt that frames the camera shot.
 *   - Per-district clusters: each district gets a tree density proportional
 *     to a stable mock test coverage value derived from district id. Wave 3
 *     real coverage replaces the mock via Demeter event store.
 *   - Inner plaza filler scattered around origin (small gap inside Iris
 *     central layout) gives the central area a park feel.
 *
 * Anti-AI-slop: the pine cone geometry uses 6 radial segments (low poly, fast)
 * with a dark green base color and a faint emissive bump so the trees catch
 * Bloom slightly without dominating the night HDRI mood. Mulberry32 seed
 * locked to the Wave-Fixing date so trees do not flicker across reloads.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 *   Lock 5 ([MOCK Wave 1 district coverage, real Wave 3 Demeter]): labeled.
 *
 * [MOCK Wave 1 district test-coverage density, real Wave 3 Demeter event
 *  store replaces stub coverage with measured per-district coverage].
 */

import { useMemo, useRef, useEffect } from 'react';
import {
  Object3D,
  InstancedMesh as ThreeInstancedMesh,
  ConeGeometry,
  MeshStandardMaterial,
} from 'three';
import { useCityData } from './buildings';
import type { DistrictData, BuildingData } from './buildings';

const RING_TREE_COUNT = 140;
const PLAZA_TREE_COUNT = 30;
/**
 * Wave-Fixing #3 final (Manager FINAL tree placement fix STAMP 20260513-0551):
 * trees now cluster along the import-dependency road edges per idea-draft H.1
 * line 398 "Pohon antar district mengindikasikan test coverage density". Each
 * active road segment gets ~3-5 trees scattered along its midpoint with
 * coverage-driven density multiplier. Roads with low district coverage stay
 * relatively bare; high-coverage roads grow dense conifer flanks.
 */
const ROAD_TREES_PER_EDGE_BASE = 4;

/**
 * Mulberry32 deterministic RNG seeded on a stable string. Returns 0..1.
 */
function seededRng(seed: number): () => number {
  let state = seed;
  return () => {
    let t = (state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * djb2 hash on a string, used to derive a stable per-district seed and a
 * stable mock test-coverage value. Mirrors the ownership.ts strategy.
 */
function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i);
  }
  return h >>> 0;
}

/**
 * Mock test coverage per district 0..1. Stable across reloads. Real Wave 3
 * replaces by reading the actual coverage report uploaded via Atlas CI.
 */
function mockCoverage(districtId: string): number {
  const h = djb2(districtId);
  return (h % 100) / 100;
}

/**
 * Density of trees to scatter inside a district. Coverage 0.0 yields zero,
 * coverage 1.0 yields up to 18 trees. Mid coverage yields scaled count.
 */
function densityFromCoverage(coverage: number): number {
  return Math.round(coverage * 18);
}

interface TreePosition {
  x: number;
  z: number;
  scale: number;
  rotation: number;
}

/**
 * Compute the full tree position list deterministically:
 *   1. Road-edge clusters (NEW Wave-Fixing #3: scatter along import-dep lines)
 *   2. Per-district clusters (count by coverage)
 *   3. Inner plaza filler (PLAZA_TREE_COUNT)
 *   4. Outer ring belt (RING_TREE_COUNT)
 *
 * Per idea-draft H.1 line 398 "Pohon antar district mengindikasikan test
 * coverage density". The road-edge clustering ensures trees visually flank
 * the glowing yellow roads (matching ReferensiWindows.png reference frame
 * where trees grow along streets, not scattered randomly).
 */
function collectTreePositions(
  districts: DistrictData[],
  buildings: BuildingData[],
): TreePosition[] {
  const positions: TreePosition[] = [];

  // Road-edge clusters: derive same dependency graph as RoadGrid (same RNG
  // seed) so trees flank exactly the same roads. Per edge, scatter
  // ROAD_TREES_PER_EDGE_BASE * coverage trees along the midpoint band.
  const roadRng = seededRng(20260513);
  if (buildings.length >= 2) {
    const byDistrict = new Map<string, BuildingData[]>();
    for (const b of buildings) {
      const list = byDistrict.get(b.district) ?? [];
      list.push(b);
      byDistrict.set(b.district, list);
    }
    for (const list of byDistrict.values()) {
      list.sort((a, b) => a.id.localeCompare(b.id));
    }
    const active = buildings
      .filter((b) => b.activity >= 0.4)
      .sort((a, b) => a.id.localeCompare(b.id));
    // For each active building, drop tree clusters along the path to its 1-2
    // nearest peers (same edge logic as RoadGrid for visual coherence).
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
      const pickCount = 1 + Math.floor(roadRng() * 2);
      for (let i = 0; i < pickCount && i < sorted.length; i++) {
        const dst = sorted[i].peer;
        // Coverage drives density: roads in high-coverage districts get more
        // trees alongside (idea-draft H.1 "district well-tested rimbun").
        const coverage = mockCoverage(src.district);
        const treeCount = Math.round(
          ROAD_TREES_PER_EDGE_BASE * Math.max(0.3, coverage),
        );
        for (let t = 0; t < treeCount; t++) {
          // Parametric t along edge midline, jittered perpendicular so trees
          // form a flanking strip rather than a thin line.
          const lerp = 0.15 + (t / Math.max(1, treeCount - 1)) * 0.7;
          const midX = src.position[0] + (dst.position[0] - src.position[0]) * lerp;
          const midZ = src.position[2] + (dst.position[2] - src.position[2]) * lerp;
          // Perpendicular offset 1.4-2.2 units off road centerline so trees do
          // not overlap the glowing yellow road geometry.
          const dx = dst.position[0] - src.position[0];
          const dz = dst.position[2] - src.position[2];
          const len = Math.sqrt(dx * dx + dz * dz) || 1;
          const perpX = -dz / len;
          const perpZ = dx / len;
          const side = roadRng() < 0.5 ? -1 : 1;
          const off = 1.4 + roadRng() * 0.8;
          positions.push({
            x: midX + perpX * off * side,
            z: midZ + perpZ * off * side,
            scale: 0.55 + roadRng() * 0.45,
            rotation: roadRng() * Math.PI * 2,
          });
        }
      }
    }
  }

  // Per-district clusters (kept from WF#2 for districts with no active roads).
  for (const d of districts) {
    const coverage = mockCoverage(d.id);
    // Reduced count since road-edge layer now carries the main tree density;
    // district scatter remains as background fill.
    const count = Math.round(densityFromCoverage(coverage) * 0.4);
    if (count === 0) continue;
    const rng = seededRng(djb2(d.id));
    const [minX, minZ, maxX, maxZ] = d.bounds;
    for (let i = 0; i < count; i++) {
      const x = minX + rng() * (maxX - minX);
      const z = minZ + rng() * (maxZ - minZ);
      const scale = 0.6 + rng() * 0.8;
      const rotation = rng() * Math.PI * 2;
      positions.push({ x, z, scale, rotation });
    }
  }

  // Plaza filler around origin.
  const plazaRng = seededRng(20260513);
  for (let i = 0; i < PLAZA_TREE_COUNT; i++) {
    const r = 8 + plazaRng() * 22;
    const a = plazaRng() * Math.PI * 2;
    const scale = 0.7 + plazaRng() * 0.6;
    const rotation = plazaRng() * Math.PI * 2;
    positions.push({
      x: Math.cos(a) * r,
      z: Math.sin(a) * r,
      scale,
      rotation,
    });
  }

  // Outer ring belt.
  const ringRng = seededRng(20260514);
  for (let i = 0; i < RING_TREE_COUNT; i++) {
    const r = 150 + ringRng() * 110;
    const a = ringRng() * Math.PI * 2;
    const scale = 0.75 + ringRng() * 0.85;
    const rotation = ringRng() * Math.PI * 2;
    positions.push({
      x: Math.cos(a) * r,
      z: Math.sin(a) * r,
      scale,
      rotation,
    });
  }

  return positions;
}

export function TreeScatter() {
  const cityData = useCityData();
  const positions = useMemo(
    () => collectTreePositions(cityData.districts, cityData.buildings),
    [cityData.districts, cityData.buildings],
  );

  const meshRef = useRef<ThreeInstancedMesh | null>(null);

  const geometry = useMemo(() => new ConeGeometry(1.2, 3.6, 6), []);
  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color: '#2a5a36',
        emissive: '#0d2515',
        emissiveIntensity: 0.5,
        roughness: 0.92,
        metalness: 0.05,
      }),
    [],
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new Object3D();
    positions.forEach((p, i) => {
      dummy.position.set(p.x, 1.8 * p.scale, p.z);
      dummy.scale.set(p.scale, p.scale, p.scale);
      dummy.rotation.set(0, p.rotation, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.count = positions.length;
  }, [positions]);

  if (positions.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, Math.max(positions.length, 1)]}
      castShadow
      receiveShadow
    />
  );
}
