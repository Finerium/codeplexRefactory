'use client';

/**
 * FlyingCars: ~30 small emissive boxes hovering along the visible road network.
 *
 * Owner: Daedalus (Manager FINAL Cycle 2 STAMP 20260513-0857 road-bound rewrite).
 *
 * Previous orbital implementation (Wave-Fixing 3) had each car following a
 * circle at altitude 50-80, disconnected from the lit road corridors. Ghaisan
 * caps-lock Manager FINAL Cycle 2 directive: "JALANNYA HARUS KELIATAN DAN
 * MOBILNYA" demands the cars visibly ride the same edges that `RoadGrid.tsx`
 * lights up. This rewrite reads the shared `deriveRoadEdges` output, assigns
 * each car to an edge, interpolates parametric `t in [0, 1]` along it, and
 * hops to a fresh edge on completion. The result reads as inter-district
 * traffic flowing along the glowing roads.
 *
 * Per PRD Section 7.3 Stretch Tier 2 + Section 13.3: flying cars represent
 * inter-district API calls. Color per microservice (mock 5-color palette
 * mapping to landmark resident districts).
 *
 * Geometry: small BoxGeometry 1.2 wide x 0.4 tall x 0.55 deep at hover
 * altitude 0.85 unit above the road centerline so the cars float clearly
 * above the lit road strip without occluding it. The Manager FINAL Cycle 2
 * directive specified 0.3 x 0.2 x 0.5 default but the body sits 0.5 unit
 * above the road in a 1.2 unit thick corridor so 1.2 x 0.4 x 0.55 reads at
 * the [0, 130, 220] camera better while still feeling like a vehicle, not a
 * cube.
 *
 * Cost: one draw call. Cheap enough that drop-first ladder never targets
 * it. The Manager Wave-Fixing prompt explicitly flags this as "defer-able
 * if capacity"; we ship it because the path math is tiny and the visual
 * punch sells the demo.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 *   Lock 5 ([MOCK Wave 1 microservice palette]): labeled below.
 *
 * [MOCK Wave 1 microservice color palette, real Wave 3 Demeter event store
 *  emits actual API call source/destination so cars flow along real edges.
 *  Edge selection becomes call-frequency-weighted in Wave 3.]
 */

import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Object3D,
  Color,
  InstancedMesh as ThreeInstancedMesh,
  BoxGeometry,
  MeshStandardMaterial,
} from 'three';
import { useCityData } from './buildings';
import { deriveRoadEdges, type RoadEdge } from './roadEdges';
import { usePerformanceState } from './PerformanceContext';

const CAR_COUNT = 30;
const HOVER_ALTITUDE = 0.85;
const BASE_SPEED = 8.5; // world units per second
const SPEED_JITTER = 3.0; // per-car random delta

interface CarAssignment {
  /** Index into the road edges array. */
  edgeIndex: number;
  /** Current `t in [0, 1]` along the assigned edge. */
  t: number;
  /** Per-car speed in world units per second. */
  speed: number;
  /** Phase offset for hover bob. */
  bobPhase: number;
  /** Color (mock microservice palette). */
  color: string;
}

/**
 * Mock microservice palette. 5 colors map to landmark district domains.
 * Distinct enough to track each car against the warm yellow road glow.
 */
const MICROSERVICE_PALETTE = [
  '#ffd166', // amber, Athena City Hall API
  '#06d6a0', // mint, Apollo Hospital API
  '#ef476f', // rose, Argus Security API
  '#5cd6ff', // teal, Clio History API
  '#c5a8ff', // violet, Hermes Tourist API
];

/**
 * Deterministic per-car seed. The same car always starts on the same edge
 * with the same speed so rehearsal and live pitch look identical.
 */
function seededInit(carIndex: number, edgeCount: number): CarAssignment {
  if (edgeCount === 0) {
    return {
      edgeIndex: 0,
      t: 0,
      speed: BASE_SPEED,
      bobPhase: 0,
      color: MICROSERVICE_PALETTE[carIndex % MICROSERVICE_PALETTE.length],
    };
  }
  // Simple integer hash so values feel uncorrelated without an RNG instance.
  const hash = (carIndex * 2654435761) >>> 0;
  const edgeIndex = hash % edgeCount;
  const t = ((hash >>> 8) % 1000) / 1000;
  const speedRoll = ((hash >>> 16) % 1000) / 1000;
  const speed = BASE_SPEED + (speedRoll - 0.5) * 2 * SPEED_JITTER;
  const bobPhase = (((hash >>> 24) % 1000) / 1000) * Math.PI * 2;
  const color = MICROSERVICE_PALETTE[carIndex % MICROSERVICE_PALETTE.length];
  return { edgeIndex, t, speed, bobPhase, color };
}

/**
 * Pick a fresh edge for a car when it reaches t = 1. Pseudo-random walk
 * keyed off car index plus a hop counter so successive picks differ. Always
 * lands on a new edge index when edges.length > 1.
 */
function pickNextEdge(carIndex: number, hop: number, edgeCount: number, current: number): number {
  if (edgeCount <= 1) return 0;
  const hash = ((carIndex + 1) * (hop + 1) * 2654435761) >>> 0;
  let next = hash % edgeCount;
  if (next === current) {
    next = (next + 1) % edgeCount;
  }
  return next;
}

export function FlyingCars() {
  const perf = usePerformanceState();
  const cityData = useCityData();
  const edges = useMemo(
    () => deriveRoadEdges(cityData.buildings),
    [cityData.buildings],
  );

  const meshRef = useRef<ThreeInstancedMesh | null>(null);
  const carsRef = useRef<CarAssignment[]>([]);
  const hopCountRef = useRef<number[]>([]);
  const lastTimeRef = useRef<number>(0);

  // Initialize per-car assignment once when the edge list materializes.
  useEffect(() => {
    carsRef.current = Array.from({ length: CAR_COUNT }, (_, i) =>
      seededInit(i, edges.length),
    );
    hopCountRef.current = new Array(CAR_COUNT).fill(0);
    lastTimeRef.current = 0;
  }, [edges]);

  // Shared geometry plus material, disposed on unmount.
  const geometry = useMemo(() => new BoxGeometry(1.2, 0.4, 0.55), []);
  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color: '#ffffff',
        emissive: '#ffffff',
        emissiveIntensity: 1.8,
        roughness: 0.28,
        metalness: 0.55,
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

  // Per-instance color once. Wave 3 Demeter will update via setColorAt to
  // encode actual API source resident routing.
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const tmpColor = new Color();
    carsRef.current.forEach((cfg, i) => {
      tmpColor.set(cfg.color);
      mesh.setColorAt(i, tmpColor);
    });
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [edges]);

  // Per-frame matrix update. Advance each car along its assigned edge by
  // `speed * deltaSeconds / length`. On overshoot, hop to a fresh edge.
  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh || edges.length === 0) return;

    // Compute delta from last frame so the motion is frame-rate independent.
    const now = state.clock.elapsedTime;
    let delta = now - lastTimeRef.current;
    if (lastTimeRef.current === 0 || delta < 0 || delta > 0.25) {
      // First frame or tab-resumed: cap delta so the cars do not jump.
      delta = 1 / 60;
    }
    lastTimeRef.current = now;

    // Half-rate during regress window to save GPU. r3f budget gain is small
    // but keeps the perf ladder consistent.
    if (perf.regressing) {
      const tick = Math.floor(now * 30);
      if (tick % 2 === 0) {
        return;
      }
    }

    const cars = carsRef.current;
    const hops = hopCountRef.current;
    const dummy = new Object3D();

    for (let i = 0; i < cars.length; i++) {
      const car = cars[i];
      const edge: RoadEdge | undefined = edges[car.edgeIndex];
      if (!edge) continue;

      // Advance t along the segment.
      const lengthSafe = Math.max(edge.length, 0.001);
      car.t += (car.speed * delta) / lengthSafe;
      if (car.t >= 1) {
        const carryover = car.t - 1;
        hops[i] += 1;
        car.edgeIndex = pickNextEdge(i, hops[i], edges.length, car.edgeIndex);
        // Seed the new segment with the carryover fraction so motion is
        // continuous (no perceptible pause at the building handover).
        const newEdge = edges[car.edgeIndex];
        const newLength = Math.max(newEdge.length, 0.001);
        car.t = Math.min(0.95, (carryover * lengthSafe) / newLength);
      }

      const activeEdge = edges[car.edgeIndex];
      const px = activeEdge.fromX + (activeEdge.toX - activeEdge.fromX) * car.t;
      const pz = activeEdge.fromZ + (activeEdge.toZ - activeEdge.fromZ) * car.t;
      // Hover altitude plus a gentle bob keyed on car phase so the column of
      // cars does not look mechanically synced.
      const bob = Math.sin(now * 1.5 + car.bobPhase) * 0.18;
      const py = HOVER_ALTITUDE + bob;

      dummy.position.set(px, py, pz);
      // Heading along the edge tangent. The RoadGrid lays the box along +x
      // then yaws by `edge.yaw`; cars share the same convention so they face
      // the direction of travel.
      dummy.rotation.set(0, activeEdge.yaw, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  if (edges.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, CAR_COUNT]}
      castShadow={false}
      receiveShadow={false}
    />
  );
}
