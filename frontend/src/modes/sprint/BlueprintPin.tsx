'use client';

/**
 * BlueprintPin overlay (PRD Section 9.2 concept 3: Planned next sprint / backlog).
 *
 * Rolled blueprint paper pin floating above the building. Small dashed lot
 * outline projects on the ground. Reads as "this story is planned but not
 * yet active".
 *
 * Anti-AI-slop choices per `_meta/decision_log/hera.md` D-Hera-04:
 *   - Rolled paper geometry (cylinder + ribbon), NOT a generic flag pin
 *   - Lot outline dashed on the ground via Drei `<Line>` segments
 *   - Subtle bob + spin so the blueprint reads as suspended cinematic prop
 *
 * Compliance:
 *   - Lock 1 (no em dash): clean
 *   - Lock 2 (no emoji): clean
 *   - Lock 5 (honest claim): no mock label
 */

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import type { Group } from 'three';
import type { BuildingData } from '@/scene/buildings/types';
import { SPRINT_PALETTE, seededRandom } from './visualUtils';

interface BlueprintPinProps {
  building: BuildingData;
  active: boolean;
}

/**
 * Build dashed lot outline points around the building footprint.
 */
function buildLotOutline(building: BuildingData): [number, number, number][] {
  const halfW = building.width / 2 + 0.8;
  const halfD = building.depth / 2 + 0.8;
  const y = 0.08;
  return [
    [-halfW, y, -halfD],
    [halfW, y, -halfD],
    [halfW, y, halfD],
    [-halfW, y, halfD],
    [-halfW, y, -halfD],
  ];
}

export function BlueprintPin({ building, active }: BlueprintPinProps) {
  const groupRef = useRef<Group>(null);
  const phase = useMemo(() => seededRandom(building.id, 13) * Math.PI * 2, [building.id]);
  const outline = useMemo(() => buildLotOutline(building), [building]);

  useFrame((state) => {
    if (!groupRef.current || !active) return;
    const t = state.clock.elapsedTime * 0.7 + phase;
    // Suspended bob 0.25 units, slow Y spin 0.4 rad/s
    groupRef.current.position.y = building.position[1] + building.height + 5 + Math.sin(t) * 0.25;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.4 + phase;
  });

  if (!active) return null;

  return (
    <>
      {/* Floating rolled blueprint */}
      <group
        ref={groupRef}
        position={[building.position[0], building.position[1] + building.height + 5, building.position[2]]}
      >
        {/* Rolled paper cylinder */}
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.32, 0.32, 1.5, 12]} />
          <meshStandardMaterial
            color={SPRINT_PALETTE.blueprintCanvas}
            roughness={0.85}
            metalness={0.02}
          />
        </mesh>

        {/* Blueprint blue ribbon wrap */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.335, 0.335, 0.4, 12]} />
          <meshStandardMaterial
            color={SPRINT_PALETTE.blueprintBlue}
            roughness={0.5}
            metalness={0.1}
          />
        </mesh>

        {/* Tied string (small ring on top) */}
        <mesh position={[0, 0.5, 0]}>
          <torusGeometry args={[0.18, 0.04, 6, 12]} />
          <meshStandardMaterial
            color={SPRINT_PALETTE.craneCable}
            roughness={0.7}
            metalness={0.15}
          />
        </mesh>
      </group>

      {/* Dashed lot outline on the ground */}
      <Line
        points={outline}
        position={[building.position[0], building.position[1], building.position[2]]}
        color={SPRINT_PALETTE.blueprintBlue}
        lineWidth={2.2}
        dashed
        dashSize={0.6}
        gapSize={0.35}
        transparent
        opacity={0.85}
      />
    </>
  );
}
