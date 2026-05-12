'use client';

/**
 * RoadGrid: ground plane plus emissive yellow connector lines between buildings.
 *
 * Owner: Daedalus (Wave-Fixing #2 cycle 1, extracted from Canvas.tsx).
 *
 * Two layers stacked:
 *   1. Dark ground plane (800x800 unit) catches shadow from the warm key
 *      directional light. Roughness high, low metalness for matte asphalt.
 *   2. Deterministic import-dependency lines drawn between deterministic
 *      pairs of building centroids. The line set is a stable mock derived
 *      from a Mulberry32 seeded RNG keyed on building id so the same city
 *      always yields the same dependency graph (Lock 5 honesty: this is the
 *      Wave 1 mock, real Wave 3 Hades parser emits actual import edges).
 *
 * Visual reference: `_meta/qa_screenshots/ReferensiWindows.png` shows yellow
 * glowing streets snaking between building clusters. We approximate that
 * with thin emissive yellow boxes positioned at building centroid pairs,
 * blooming via the EffectComposer pass that Canvas owns. Total draw cost is
 * one ground plane plus one instanced mesh holding ~120 line segments which
 * Phase B Topic D budget treats as cheap.
 *
 * The component reads its building list from the Iris `useCityData()` hook
 * so it is automatically in sync with the squarified treemap and the
 * landmark pinning that Iris owns. No prop-drilling, no second source of
 * truth. The Iris hook returns the singleton mockCityData at Wave 1, then
 * Demeter WebSocket data at Wave 3 without API change.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 *   Lock 5 ([MOCK Wave 1, real Wave 3 Hades parser]): labeled below.
 *
 * [MOCK Wave 1 import dependency edges, real Wave 3 Hades parser emits
 *  actual import graph via Demeter event store].
 */

import { useMemo, useRef, useEffect } from 'react';
import {
  Object3D,
  InstancedMesh as ThreeInstancedMesh,
  BoxGeometry,
  MeshStandardMaterial,
} from 'three';
import { useCityData } from './buildings';
import type { BuildingData } from './buildings';

/**
 * Mulberry32 seeded RNG. Stable across reloads when seeded with the same
 * integer. Lock seed to the Wave-Fixing date so the dependency edges are
 * identical every demo run (no flicker between rehearsal and live pitch).
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
 * Emit a stable list of (sourceId, targetId) pairs simulating import
 * dependencies. Strategy: pick a portion of buildings, link each to its
 * nearest 2 to 3 same-district neighbors plus a cross-district hop. The
 * resulting graph reads visually as a road network with branching paths.
 *
 * Edge count target: ~120 segments across a 240-building city is dense
 * enough to read as streets without saturating the bloom pass.
 */
interface EdgePair {
  fromX: number;
  fromZ: number;
  toX: number;
  toZ: number;
}

function deriveDependencyEdges(buildings: BuildingData[]): EdgePair[] {
  if (buildings.length < 2) return [];
  const rng = mulberry32(20260513);
  const edges: EdgePair[] = [];
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

  // For roughly the most-active third of buildings, emit short edges to the
  // 1 to 2 nearest same-district neighbors.
  const active = buildings
    .filter((b) => b.activity >= 0.4)
    .sort((a, b) => a.id.localeCompare(b.id));
  for (const src of active) {
    const peers = byDistrict.get(src.district);
    if (!peers || peers.length < 2) continue;
    // Pick the 2 spatially closest peers from same district.
    const sorted = peers
      .filter((p) => p.id !== src.id)
      .map((p) => {
        const dx = p.position[0] - src.position[0];
        const dz = p.position[2] - src.position[2];
        return { peer: p, d2: dx * dx + dz * dz };
      })
      .sort((a, b) => a.d2 - b.d2);
    const pickCount = 1 + Math.floor(rng() * 2); // 1 or 2
    for (let i = 0; i < pickCount && i < sorted.length; i++) {
      const dst = sorted[i].peer;
      edges.push({
        fromX: src.position[0],
        fromZ: src.position[2],
        toX: dst.position[0],
        toZ: dst.position[2],
      });
    }
  }

  // Add ~20 long cross-district hops connecting random landmark buildings to
  // a random active building elsewhere. These read as highways between major
  // districts in the city.
  const landmarks = buildings
    .filter((b) => Boolean(b.landmark))
    .sort((a, b) => a.id.localeCompare(b.id));
  for (let i = 0; i < landmarks.length; i++) {
    const src = landmarks[i];
    const dstIdx = Math.floor(rng() * active.length);
    const dst = active[dstIdx];
    if (!dst || dst.id === src.id) continue;
    edges.push({
      fromX: src.position[0],
      fromZ: src.position[2],
      toX: dst.position[0],
      toZ: dst.position[2],
    });
  }

  return edges;
}

const ROAD_THICKNESS = 0.6;
const ROAD_HEIGHT = 0.08;
const ROAD_Y_OFFSET = 0.02; // Above ground plane to avoid z-fighting.

export function RoadGrid() {
  const cityData = useCityData();
  const edges = useMemo(
    () => deriveDependencyEdges(cityData.buildings),
    [cityData.buildings],
  );

  // Shared geometry plus material, disposed on unmount.
  const geometry = useMemo(
    () => new BoxGeometry(1, ROAD_HEIGHT, ROAD_THICKNESS),
    [],
  );
  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color: '#f5c84b',
        emissive: '#f5c84b',
        emissiveIntensity: 1.4,
        roughness: 0.4,
        metalness: 0.2,
        toneMapped: true,
      }),
    [],
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  const meshRef = useRef<ThreeInstancedMesh | null>(null);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new Object3D();
    edges.forEach((edge, i) => {
      const dx = edge.toX - edge.fromX;
      const dz = edge.toZ - edge.fromZ;
      const len = Math.sqrt(dx * dx + dz * dz);
      const cx = (edge.fromX + edge.toX) / 2;
      const cz = (edge.fromZ + edge.toZ) / 2;
      const angle = Math.atan2(dz, dx);
      dummy.position.set(cx, ROAD_Y_OFFSET, cz);
      dummy.scale.set(len, 1, 1);
      dummy.rotation.set(0, -angle, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.count = edges.length;
  }, [edges]);

  return (
    <>
      {/* Dark base plane catches shadow from the warm key directional. */}
      <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, -0.02, 0]}>
        <planeGeometry args={[800, 800]} />
        <meshStandardMaterial
          color="#0a0d14"
          roughness={0.85}
          metalness={0.15}
        />
      </mesh>

      {/* Deterministic glowing yellow connectors keyed on building id. */}
      {edges.length > 0 ? (
        <instancedMesh
          ref={meshRef}
          args={[geometry, material, Math.max(edges.length, 1)]}
          castShadow={false}
          receiveShadow={false}
        />
      ) : null}
    </>
  );
}
