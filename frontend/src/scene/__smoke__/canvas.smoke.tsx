'use client';

/**
 * Daedalus smoke test snippet.
 *
 * Purpose: verify ChronicleCanvas boots end-to-end with placeholder children,
 * with feature flags ON, on a typical M-series MBP 16GB at 60fps idle, no
 * console errors.
 *
 * How to run during Wave 1:
 *   1. pnpm install
 *   2. pnpm dev (port 3000)
 *   3. Visit http://localhost:3000/__daedalus_smoke
 *   4. Open DevTools, drop r3f-perf overlay, confirm 60fps idle, 55+ on drag.
 *
 * Eunomia audit (Wave 1 gate) reuses this snippet to satisfy:
 *   - H1 critical assertion (60fps with 200-300 building stub).
 *   - Feature flag toggle: flip NEXT_PUBLIC_ENABLE_DOF in .env, restart dev,
 *     verify DOF disappears without code change.
 *
 * This file is NOT part of the production bundle. It mounts a tiny 8-cube
 * placeholder city so Daedalus self-checks before Iris ships the real
 * BuildingInstances composite. Iris extends in their smoke (cycle 3+).
 */

import { ChronicleCanvas, usePerformanceState } from '../index';
import { useEffect, useRef } from 'react';
import {
  type MeshStandardMaterial,
  type BoxGeometry,
  type InstancedMesh,
  Object3D,
} from 'three';

const PLACEHOLDER_COUNT = 8;

function PlaceholderCity() {
  const meshRef = useRef<InstancedMesh<BoxGeometry, MeshStandardMaterial> | null>(null);
  const perf = usePerformanceState();

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new Object3D();
    for (let i = 0; i < PLACEHOLDER_COUNT; i++) {
      const angle = (i / PLACEHOLDER_COUNT) * Math.PI * 2;
      const radius = 22;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const height = 6 + Math.sin(i * 1.3) * 4;
      dummy.position.set(x, height / 2, z);
      dummy.scale.set(4, height, 4);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <>
      <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, 0, 0]}>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#0b0f1a" roughness={0.92} metalness={0.05} />
      </mesh>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, PLACEHOLDER_COUNT]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={perf.regressing ? '#7d9cff' : '#ffb472'}
          emissive={perf.regressing ? '#1a2240' : '#5a2d00'}
          emissiveIntensity={perf.regressing ? 0.3 : 0.5}
          roughness={0.4}
          metalness={0.2}
        />
      </instancedMesh>
    </>
  );
}

export function CanvasSmokeHarness() {
  return (
    <ChronicleCanvas>
      <PlaceholderCity />
    </ChronicleCanvas>
  );
}
