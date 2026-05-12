'use client';

/**
 * SizeBadge overlay (PRD Section 9.2 concept 8: Story size).
 *
 * Small floating chip above the building roof showing the story-size letter
 * (XS/S/M/L/XL). Uses Drei `<Billboard>` + `<Text>` for SDF crisp text +
 * camera-facing without DOM cost.
 *
 * Anti-AI-slop choices per `_meta/decision_log/hera.md` D-Hera-04:
 *   - Color spectrum maps size: XS green -> XL warm orange (warm-to-cool axis)
 *   - Slight float bob + camera-facing billboard
 *   - Chip background pill shape (rounded box) so the badge reads label-y
 *
 * Compliance:
 *   - Lock 1 (no em dash): clean
 *   - Lock 2 (no emoji): clean
 *   - Lock 5 (honest claim): no mock label
 */

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import type { Group } from 'three';
import type { BuildingData } from '@/scene/buildings/types';
import type { StorySize } from './types';
import { SPRINT_PALETTE, SIZE_BADGE_COLORS, seededRandom } from './visualUtils';

interface SizeBadgeProps {
  building: BuildingData;
  active: boolean;
  size: StorySize | null;
}

export function SizeBadge({ building, active, size }: SizeBadgeProps) {
  const groupRef = useRef<Group>(null);
  const phase = useMemo(() => seededRandom(building.id, 23) * Math.PI * 2, [building.id]);

  useFrame((state) => {
    if (!groupRef.current || !active || !size) return;
    const t = state.clock.elapsedTime * 1.0 + phase;
    groupRef.current.position.y = building.position[1] + building.height + 5.6 + Math.sin(t) * 0.18;
  });

  if (!active || !size) return null;

  return (
    <Billboard
      follow
      lockX={false}
      lockY={false}
      lockZ={false}
      position={[building.position[0], building.position[1] + building.height + 5.6, building.position[2]]}
    >
      <group ref={groupRef}>
        {/* Pill background (rounded approximation via boxGeometry + scale) */}
        <mesh>
          <boxGeometry args={[1.6, 0.9, 0.18]} />
          <meshStandardMaterial
            color={SPRINT_PALETTE.sizeBadgeBg}
            roughness={0.55}
            metalness={0.15}
            emissive={SIZE_BADGE_COLORS[size]}
            emissiveIntensity={0.4}
          />
        </mesh>

        {/* Border ring outline (slightly larger plane behind) */}
        <mesh position={[0, 0, -0.05]}>
          <boxGeometry args={[1.8, 1.1, 0.04]} />
          <meshStandardMaterial
            color={SIZE_BADGE_COLORS[size]}
            roughness={0.4}
            emissive={SIZE_BADGE_COLORS[size]}
            emissiveIntensity={0.6}
          />
        </mesh>

        {/* Size letter text via Drei SDF Text */}
        <Text
          position={[0, 0, 0.11]}
          fontSize={0.62}
          color={SPRINT_PALETTE.sizeBadgeText}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor={SPRINT_PALETTE.sizeBadgeBg}
        >
          {size}
        </Text>
      </group>
    </Billboard>
  );
}
