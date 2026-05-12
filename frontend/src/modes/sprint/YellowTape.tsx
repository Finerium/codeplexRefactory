'use client';

/**
 * YellowTape overlay (PRD Section 9.2 concept 6: Blocked / help wanted).
 *
 * Police-style hazard tape wraps the base of the building. Diagonal black
 * stripes on yellow body. Subtle flutter via vertex displacement (texture-free
 * GLSL is overkill; we use a simple group-level rotation wobble instead).
 *
 * Anti-AI-slop choices per `_meta/decision_log/hera.md` D-Hera-04:
 *   - Diagonal stripe pattern via alternating thin yellow + dark boxes
 *   - Two horizontal bands at slightly different heights so the tape reads
 *     as "wrapped multiple times" not "single ribbon"
 *   - Subtle flutter rotation
 *
 * Compliance:
 *   - Lock 1 (no em dash): clean
 *   - Lock 2 (no emoji): clean
 *   - Lock 5 (honest claim): no mock label
 */

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import type { BuildingData } from '@/scene/buildings/types';
import { SPRINT_PALETTE, seededRandom } from './visualUtils';

interface YellowTapeProps {
  building: BuildingData;
  active: boolean;
}

interface SegmentPlacement {
  position: [number, number, number];
  rotationY: number;
  length: number;
  yLevel: number;
}

function buildBandSegments(building: BuildingData, yLevel: number): SegmentPlacement[] {
  const halfW = building.width / 2 + 0.45;
  const halfD = building.depth / 2 + 0.45;
  // 4 segments wrapping the rectangle.
  return [
    {
      position: [0, yLevel, halfD],
      rotationY: 0,
      length: building.width + 0.9,
      yLevel,
    },
    {
      position: [0, yLevel, -halfD],
      rotationY: 0,
      length: building.width + 0.9,
      yLevel,
    },
    {
      position: [halfW, yLevel, 0],
      rotationY: Math.PI / 2,
      length: building.depth + 0.9,
      yLevel,
    },
    {
      position: [-halfW, yLevel, 0],
      rotationY: Math.PI / 2,
      length: building.depth + 0.9,
      yLevel,
    },
  ];
}

export function YellowTape({ building, active }: YellowTapeProps) {
  const groupRef = useRef<Group>(null);
  const phase = useMemo(() => seededRandom(building.id, 19) * Math.PI * 2, [building.id]);
  const segments = useMemo(() => {
    const lower = buildBandSegments(building, 0.6);
    const upper = buildBandSegments(building, 1.1);
    return [...lower, ...upper];
  }, [building]);

  useFrame((state) => {
    if (!groupRef.current || !active) return;
    const t = state.clock.elapsedTime * 1.4 + phase;
    // Subtle flutter, rotation z 0.03 rad
    groupRef.current.rotation.z = Math.sin(t) * 0.025;
  });

  if (!active) return null;

  return (
    <group
      ref={groupRef}
      position={[building.position[0], building.position[1], building.position[2]]}
    >
      {segments.map((seg, idx) => {
        // Diagonal stripe pattern: 5 alternating yellow + dark sub-segments
        // along the length. Each sub-segment is a small box, rotated locally
        // so the diagonal angle reads.
        const stripeCount = Math.max(5, Math.floor(seg.length / 1.0));
        const stripeWidth = seg.length / stripeCount;
        const stripes = [];
        for (let i = 0; i < stripeCount; i++) {
          const x = -seg.length / 2 + stripeWidth / 2 + i * stripeWidth;
          const isYellow = i % 2 === 0;
          stripes.push(
            <mesh
              key={`stripe-${i}`}
              position={[x, 0, 0]}
              rotation={[0, 0, Math.PI / 6]} // diagonal angle
            >
              <boxGeometry args={[stripeWidth * 0.9, 0.42, 0.09]} />
              <meshStandardMaterial
                color={isYellow ? SPRINT_PALETTE.yellowTapeYellow : SPRINT_PALETTE.yellowTapeBlack}
                roughness={0.55}
                metalness={0.05}
                emissive={isYellow ? SPRINT_PALETTE.yellowTapeYellow : '#000000'}
                emissiveIntensity={isYellow ? 0.3 : 0}
              />
            </mesh>
          );
        }
        return (
          <group
            key={`band-${idx}`}
            position={seg.position}
            rotation={[0, seg.rotationY, 0]}
          >
            {stripes}
          </group>
        );
      })}
    </group>
  );
}
