'use client';

/**
 * FlyingCars: ~30 small emissive boxes orbiting along stable curved paths.
 *
 * Owner: Daedalus (Wave-Fixing #2 cycle 1).
 *
 * Per PRD Section 7.3 Stretch Tier 2 + Section 13.3: flying cars represent
 * inter-district API calls. ~30 cars looping along glowing yellow paths,
 * color per microservice (mock: each car gets one of 5 colors mapping to
 * landmark resident district).
 *
 * The cars are NOT bound to building positions, they fly above the rooftop
 * envelope (y = 50 to 90) on independent Bezier-ish loops so the camera
 * shot reads as a living cyberpunk skyline. Single InstancedMesh shared
 * geometry plus per-instance color encodes the microservice palette.
 *
 * Loop math: each car follows a parametric circle (xc, zc) of radius r with
 * vertical sin-wave y bob. Phase offset per car keeps the stream evenly
 * distributed. Frame loop runs at clock.elapsedTime, so paused tab does
 * not break (r3f frameloop default keeps rendering for HDRI fidelity).
 *
 * Cost: one draw call. Cheap enough that drop-first ladder never targets
 * it. The Manager Wave-Fixing prompt explicitly flags this as "defer-able
 * if capacity"; we ship it anyway because the path math is tiny and the
 * visual punch sells the demo.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 *   Lock 5 ([MOCK Wave 1 microservice palette]): labeled below.
 *
 * [MOCK Wave 1 microservice color palette, real Wave 3 Demeter event store
 *  emits actual API call source/destination so cars flow along real edges].
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
import { usePerformanceState } from './PerformanceContext';

const CAR_COUNT = 30;

interface CarConfig {
  /** Loop center x. */
  cx: number;
  /** Loop center z. */
  cz: number;
  /** Loop radius. */
  radius: number;
  /** Baseline altitude. */
  baseY: number;
  /** Y bob amplitude. */
  bobAmp: number;
  /** Angular velocity (rad/sec). */
  omega: number;
  /** Phase offset. */
  phase: number;
  /** Per-car color hex. */
  color: string;
}

/**
 * Mock microservice palette. 5 colors mapping to landmark district domains.
 * Reads as red/blue/green/yellow/purple, distinct enough to track each car.
 */
const MICROSERVICE_PALETTE = [
  '#ffd166', // amber, Athena City Hall API
  '#06d6a0', // mint, Apollo Hospital API
  '#ef476f', // rose, Argus Security API
  '#118ab2', // teal, Clio History API
  '#a78bfa', // violet, Hermes Tourist API
];

function deriveCarConfigs(): CarConfig[] {
  const configs: CarConfig[] = [];
  // 4 loops, 4 lanes per loop, 4 different radii at increasing altitude.
  for (let i = 0; i < CAR_COUNT; i++) {
    const ring = i % 4; // 0..3
    const lane = Math.floor(i / 4); // 0..7
    const radius = 60 + ring * 35; // 60, 95, 130, 165
    const baseY = 50 + ring * 10; // 50, 60, 70, 80
    const bobAmp = 4 + ring * 1.5;
    // Direction alternates so adjacent rings rotate opposite ways.
    const dir = ring % 2 === 0 ? 1 : -1;
    const omega = dir * (0.18 - ring * 0.025);
    const phase = (lane / 8) * Math.PI * 2 + ring * 0.4;
    const color = MICROSERVICE_PALETTE[i % MICROSERVICE_PALETTE.length];
    configs.push({
      cx: 0,
      cz: 0,
      radius,
      baseY,
      bobAmp,
      omega,
      phase,
      color,
    });
  }
  return configs;
}

export function FlyingCars() {
  const perf = usePerformanceState();
  const meshRef = useRef<ThreeInstancedMesh | null>(null);
  const configs = useMemo(() => deriveCarConfigs(), []);

  // Shared geometry plus material, disposed on unmount.
  const geometry = useMemo(() => new BoxGeometry(2.2, 0.6, 1.1), []);
  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color: '#ffffff',
        emissive: '#ffffff',
        emissiveIntensity: 1.6,
        roughness: 0.3,
        metalness: 0.6,
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

  // Set per-instance color once on mount. Color encoding is stable since
  // mock palette never changes; Wave 3 Demeter will update via setColorAt.
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const tmpColor = new Color();
    configs.forEach((cfg, i) => {
      tmpColor.set(cfg.color);
      mesh.setColorAt(i, tmpColor);
    });
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [configs]);

  // Per-frame matrix update. We use Object3D dummy to compose translate plus
  // yaw so the car heads along its tangent direction.
  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    // Gate to half-rate during a regress window to save GPU. r3f budget gain
    // is small but it keeps the perf ladder consistent.
    if (perf.regressing && state.clock.elapsedTime % 0.066 > 0.033) {
      return;
    }
    const t = state.clock.elapsedTime;
    const dummy = new Object3D();
    configs.forEach((cfg, i) => {
      const theta = cfg.phase + cfg.omega * t;
      const x = cfg.cx + cfg.radius * Math.cos(theta);
      const z = cfg.cz + cfg.radius * Math.sin(theta);
      const y = cfg.baseY + cfg.bobAmp * Math.sin(t * 0.8 + cfg.phase);
      dummy.position.set(x, y, z);
      // Yaw so the car heads tangent to its loop direction.
      const yaw = theta + (cfg.omega > 0 ? Math.PI / 2 : -Math.PI / 2);
      dummy.rotation.set(0, yaw, 0);
      // Slight banking inward.
      const bank = cfg.omega > 0 ? -0.15 : 0.15;
      dummy.rotation.z = bank;
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, CAR_COUNT]}
      castShadow={false}
      receiveShadow={false}
    />
  );
}
