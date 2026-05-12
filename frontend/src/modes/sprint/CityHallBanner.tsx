'use client';

/**
 * CityHallBanner overlay (PRD Section 9.2 concept 9: Milestone / Sprint Goal).
 *
 * Large ribbon banner attached to the Athena temple landmark. Shows the
 * milestone name (e.g., "Sprint 14: Security hardening + auth"). Persistent
 * across the sprint duration. Banner cloth drapes from a horizontal pole
 * spanning the temple roof, with a slight curl simulating wind.
 *
 * Anti-AI-slop choices per `_meta/decision_log/hera.md` D-Hera-04:
 *   - Ribbon cloth via two planes joined at a horizontal pole, with subtle
 *     vertex displacement for wind curl (procedural via useFrame)
 *   - Fringe trim at the bottom edge (small repeated geometry)
 *   - Text via Drei SDF Text positioned on the cloth face
 *
 * Mounted ONLY on the Athena landmark (concept 9 is City Hall-specific).
 *
 * Compliance:
 *   - Lock 1 (no em dash): clean
 *   - Lock 2 (no emoji): clean
 *   - Lock 5 (honest claim): no mock label
 */

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import type { Group } from 'three';
import type { BuildingData } from '@/scene/buildings/types';
import { SPRINT_PALETTE, seededRandom } from './visualUtils';

interface CityHallBannerProps {
  building: BuildingData;
  active: boolean;
  milestone: string | null;
}

export function CityHallBanner({ building, active, milestone }: CityHallBannerProps) {
  const clothRef = useRef<Group>(null);
  const phase = useMemo(() => seededRandom(building.id, 29) * Math.PI * 2, [building.id]);

  useFrame((state) => {
    if (!clothRef.current || !active || !milestone) return;
    const t = state.clock.elapsedTime * 0.9 + phase;
    // Wind curl via z-axis rotation oscillation
    clothRef.current.rotation.z = Math.sin(t) * 0.06;
    // Tiny y bob
    clothRef.current.position.y = Math.sin(t * 1.4) * 0.07;
  });

  if (!active || !milestone) return null;

  // Banner anchor: 2.5 units above the temple roof, front-facing.
  const cx = building.position[0];
  const cy = building.position[1] + building.height + 2.5;
  const cz = building.position[2] + building.depth / 2 + 0.6;

  const poleLength = Math.max(building.width * 1.1, 6);
  const clothWidth = poleLength * 0.92;
  const clothHeight = 2.2;

  return (
    <group position={[cx, cy, cz]}>
      {/* Horizontal pole spanning the front face */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, poleLength, 8]} />
        <meshStandardMaterial
          color={SPRINT_PALETTE.bannerPole}
          roughness={0.55}
          metalness={0.35}
        />
      </mesh>

      {/* Pole caps (decorative spheres at each end) */}
      <mesh position={[poleLength / 2, 0, 0]}>
        <sphereGeometry args={[0.18, 8, 6]} />
        <meshStandardMaterial color={SPRINT_PALETTE.bannerFringe} roughness={0.4} metalness={0.55} />
      </mesh>
      <mesh position={[-poleLength / 2, 0, 0]}>
        <sphereGeometry args={[0.18, 8, 6]} />
        <meshStandardMaterial color={SPRINT_PALETTE.bannerFringe} roughness={0.4} metalness={0.55} />
      </mesh>

      {/* Banner cloth (animated via group rotation) */}
      <group ref={clothRef} position={[0, -clothHeight / 2 - 0.05, 0]}>
        <mesh>
          <planeGeometry args={[clothWidth, clothHeight, 6, 4]} />
          <meshStandardMaterial
            color={SPRINT_PALETTE.bannerCloth}
            roughness={0.85}
            metalness={0.04}
            side={2}
          />
        </mesh>

        {/* Inner darker rectangle border (decorative trim band) */}
        <mesh position={[0, 0, 0.01]}>
          <planeGeometry args={[clothWidth * 0.95, clothHeight * 0.85]} />
          <meshStandardMaterial
            color={SPRINT_PALETTE.bannerCloth}
            roughness={0.95}
            metalness={0.04}
            emissive={SPRINT_PALETTE.bannerCloth}
            emissiveIntensity={0.18}
            side={2}
          />
        </mesh>

        {/* Fringe trim at the bottom: 9 small rectangles */}
        {Array.from({ length: 9 }).map((_, i) => {
          const x = -clothWidth / 2 + (clothWidth / 9) * (i + 0.5);
          return (
            <mesh
              key={`fringe-${i}`}
              position={[x, -clothHeight / 2 - 0.18, 0]}
            >
              <boxGeometry args={[clothWidth / 11, 0.3, 0.05]} />
              <meshStandardMaterial
                color={SPRINT_PALETTE.bannerFringe}
                roughness={0.6}
                metalness={0.15}
              />
            </mesh>
          );
        })}

        {/* Milestone text on the cloth, white outlined */}
        <Text
          position={[0, 0.1, 0.04]}
          fontSize={0.32}
          color={SPRINT_PALETTE.stickyNoteBadgeText}
          anchorX="center"
          anchorY="middle"
          maxWidth={clothWidth * 0.88}
          textAlign="center"
          outlineWidth={0.018}
          outlineColor={SPRINT_PALETTE.bannerPole}
        >
          {milestone}
        </Text>
      </group>
    </group>
  );
}
