'use client';

/**
 * Scaffolding overlay (PRD Section 9.2 concept 1: Story in progress).
 *
 * Wraps an active building in a wood-and-metal scaffolding rig: 4 vertical
 * pipes at the corners, 3 horizontal bands of joists, and a few diagonal
 * cross-braces. Each segment cylinder; joints visible as small dark spheres.
 *
 * Anti-AI-slop choices per `_meta/decision_log/hera.md` D-Hera-04:
 *   - Wood + metal mix (warm + cool), NOT all gray pipe grid
 *   - Per-instance phase offset seeded by building id so identical archetypes
 *     do not read as a copy-paste line
 *   - Subtle vertical bob via useFrame, simulating worker movement in dev
 *
 * Compliance:
 *   - Lock 1 (no em dash): clean
 *   - Lock 2 (no emoji): clean
 *   - Lock 5 (honest claim): no mock label; pure geometry
 *
 * Performance:
 *   - 4 vertical pipes + 12 horizontal joists + 4 cross-braces + 8 joint
 *     spheres per building. ~28 meshes per scaffolding. Mounted only when
 *     `active` true. SprintMode mounts at most ~10 active simultaneously
 *     so total draw call contribution caps at ~280 across overlays. Within
 *     budget per D-Hera-04 estimate.
 */

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import type { BuildingData } from '@/scene/buildings/types';
import { SPRINT_PALETTE, seededRandom } from './visualUtils';

interface ScaffoldingProps {
  building: BuildingData;
  active: boolean;
}

export function Scaffolding({ building, active }: ScaffoldingProps) {
  const groupRef = useRef<Group>(null);
  const phase = useMemo(() => seededRandom(building.id, 7) * Math.PI * 2, [building.id]);

  useFrame((state) => {
    if (!groupRef.current || !active) return;
    // Subtle bob: pipes shimmy 0.08 units on a slow cycle so the scaffolding
    // reads as freshly erected (workers moving), not static deco.
    const t = state.clock.elapsedTime * 0.6 + phase;
    groupRef.current.position.y = building.position[1] + Math.sin(t) * 0.08;
  });

  if (!active) return null;

  const halfW = building.width / 2;
  const halfD = building.depth / 2;
  const h = building.height;
  const pipeRadius = 0.18;
  const pipePad = 0.6;
  const corners: [number, number][] = [
    [halfW + pipePad, halfD + pipePad],
    [-halfW - pipePad, halfD + pipePad],
    [halfW + pipePad, -halfD - pipePad],
    [-halfW - pipePad, -halfD - pipePad],
  ];
  // 3 joist bands at 25%, 55%, 85% of building height.
  const joistHeights = [h * 0.25, h * 0.55, h * 0.85];

  return (
    <group
      ref={groupRef}
      position={[building.position[0], building.position[1], building.position[2]]}
    >
      {/* 4 vertical wood pipes at the corners */}
      {corners.map(([x, z], i) => (
        <mesh key={`pipe-${i}`} position={[x, h / 2, z]} castShadow>
          <cylinderGeometry args={[pipeRadius, pipeRadius, h, 8]} />
          <meshStandardMaterial
            color={SPRINT_PALETTE.scaffoldingWood}
            roughness={0.85}
            metalness={0.05}
          />
        </mesh>
      ))}

      {/* Horizontal metal joists at each band level */}
      {joistHeights.map((y, bandIdx) =>
        // 4 sides per band; each is a single rectangle spanning corner-to-corner
        [
          { from: corners[0], to: corners[1] }, // back
          { from: corners[2], to: corners[3] }, // front
          { from: corners[0], to: corners[2] }, // right
          { from: corners[1], to: corners[3] }, // left
        ].map((seg, segIdx) => {
          const [x1, z1] = seg.from;
          const [x2, z2] = seg.to;
          const midX = (x1 + x2) / 2;
          const midZ = (z1 + z2) / 2;
          const dx = x2 - x1;
          const dz = z2 - z1;
          const len = Math.hypot(dx, dz);
          const rotY = Math.atan2(dz, dx);
          return (
            <mesh
              key={`joist-${bandIdx}-${segIdx}`}
              position={[midX, y, midZ]}
              rotation={[0, rotY, 0]}
            >
              <boxGeometry args={[len, 0.16, 0.16]} />
              <meshStandardMaterial
                color={SPRINT_PALETTE.scaffoldingMetal}
                roughness={0.5}
                metalness={0.75}
              />
            </mesh>
          );
        })
      )}

      {/* Cross-braces on 2 faces (subtle X pattern) */}
      {[corners[0], corners[1]].map((pair, idx) => {
        const [x, z] = pair;
        const otherZ = idx === 0 ? corners[2][1] : corners[3][1];
        const midY = h * 0.55;
        const midZ = (z + otherZ) / 2;
        const dz = otherZ - z;
        const len = Math.hypot(h * 0.6, dz);
        const rotX = Math.atan2(dz, h * 0.6);
        return (
          <mesh
            key={`brace-${idx}`}
            position={[x, midY, midZ]}
            rotation={[rotX, 0, 0]}
          >
            <boxGeometry args={[0.1, 0.1, len]} />
            <meshStandardMaterial
              color={SPRINT_PALETTE.scaffoldingMetal}
              roughness={0.55}
              metalness={0.65}
            />
          </mesh>
        );
      })}

      {/* 8 visible joint spheres (4 base, 4 top) for the weathered detail */}
      {corners.map(([x, z], i) => (
        <group key={`joint-${i}`}>
          <mesh position={[x, 0.25, z]}>
            <sphereGeometry args={[pipeRadius * 1.4, 8, 6]} />
            <meshStandardMaterial
              color={SPRINT_PALETTE.scaffoldingJoint}
              roughness={0.4}
              metalness={0.85}
            />
          </mesh>
          <mesh position={[x, h - 0.2, z]}>
            <sphereGeometry args={[pipeRadius * 1.3, 8, 6]} />
            <meshStandardMaterial
              color={SPRINT_PALETTE.scaffoldingJoint}
              roughness={0.45}
              metalness={0.8}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
