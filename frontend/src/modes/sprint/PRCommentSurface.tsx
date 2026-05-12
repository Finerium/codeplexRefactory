'use client';

/**
 * PRCommentSurface (PRD Section 9.2 concept 14a: PR comment surfacing).
 *
 * OQ-05 decided variant: Sticky Note 3D. Documented in
 * `_meta/decisions/oq05_pr_comment_surfacing.md`. Paper-yellow note plane
 * attached to the building face with a red badge displaying unread comment
 * count. Click dispatches `heraStore.selectBuilding` which Persephone
 * TicketPanel reads to surface the full thread.
 *
 * Non-overlap check per OQ-05 decision doc:
 *   - Sticky note Y band: [height+0.4, height+1.6] (thin)
 *   - Scaffolding band: [0, height] (below)
 *   - Crane: [height+1, height+15] (above-and-side)
 *   - Banner (Athena only): note moves to back face to avoid front-face collision
 *   - DoD checklist: y >= height+2 (above)
 *   - Size badge: y >= height+5 (well above)
 *
 * Anti-AI-slop choices per `_meta/decision_log/hera.md` D-Hera-04:
 *   - Paper-yellow plane + drop shadow (small dark plane offset behind)
 *   - Red badge corner with white numeric text
 *   - Camera-billboard so the note always reads
 *   - Hover scale 1.05x (subtle affordance signal)
 *
 * Compliance:
 *   - Lock 1 (no em dash): clean
 *   - Lock 2 (no emoji): clean
 *   - Lock 5 (honest claim): no mock label; OQ-05 decision lives in
 *     `_meta/decisions/oq05_pr_comment_surfacing.md`
 */

import { useRef, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import type { Group, Mesh } from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import type { BuildingData } from '@/scene/buildings/types';
import { SPRINT_PALETTE } from './visualUtils';
import { useHeraStore } from './heraStore';

interface PRCommentSurfaceProps {
  building: BuildingData;
  active: boolean;
  unreadCount: number;
  isAthenaLandmark: boolean;
}

export function PRCommentSurface({
  building,
  active,
  unreadCount,
  isAthenaLandmark,
}: PRCommentSurfaceProps) {
  const groupRef = useRef<Group>(null);
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const selectBuilding = useHeraStore((s) => s.selectBuilding);

  // Athena landmark special case: position on back face to avoid banner collision.
  const yAnchor = building.position[1] + building.height + 0.8;
  const zSign = isAthenaLandmark ? -1 : 1;
  const zAnchor = building.position[2] + zSign * (building.depth / 2 + 0.6);

  useFrame((state) => {
    if (!groupRef.current || !active) return;
    // Tiny float + scale-on-hover affordance
    const t = state.clock.elapsedTime * 1.3;
    groupRef.current.position.y = yAnchor + Math.sin(t) * 0.06;
    const targetScale = hovered ? 1.06 : 1.0;
    const current = groupRef.current.scale.x;
    const next = current + (targetScale - current) * 0.18;
    groupRef.current.scale.set(next, next, next);
  });

  const handleClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();
      selectBuilding(building.id);
    },
    [building.id, selectBuilding]
  );

  if (!active) return null;

  return (
    <Billboard
      follow
      lockY={false}
      position={[building.position[0], yAnchor, zAnchor]}
    >
      <group ref={groupRef}>
        {/* Drop shadow plane behind the note */}
        <mesh position={[0.06, -0.06, -0.04]}>
          <planeGeometry args={[1.4, 1.4]} />
          <meshStandardMaterial
            color={SPRINT_PALETTE.stickyNoteShadow}
            transparent
            opacity={0.55}
            roughness={0.95}
            depthWrite={false}
          />
        </mesh>

        {/* Main paper-yellow note */}
        <mesh
          ref={meshRef}
          onClick={handleClick}
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
        >
          <planeGeometry args={[1.35, 1.35]} />
          <meshStandardMaterial
            color={SPRINT_PALETTE.stickyNotePaper}
            roughness={0.92}
            metalness={0.02}
            emissive={SPRINT_PALETTE.stickyNotePaper}
            emissiveIntensity={hovered ? 0.18 : 0.08}
          />
        </mesh>

        {/* Comment indicator lines (3 dark horizontal hints) */}
        {[0.18, 0.0, -0.18].map((y, i) => (
          <mesh key={`line-${i}`} position={[0, y, 0.01]}>
            <planeGeometry args={[1.0, 0.04]} />
            <meshStandardMaterial
              color={SPRINT_PALETTE.scaffoldingJoint}
              roughness={0.7}
              transparent
              opacity={0.65}
            />
          </mesh>
        ))}

        {/* Red badge with unread count (top-right corner) */}
        {unreadCount > 0 ? (
          <group position={[0.52, 0.5, 0.02]}>
            {/* Badge circle */}
            <mesh>
              <circleGeometry args={[0.28, 16]} />
              <meshStandardMaterial
                color={SPRINT_PALETTE.stickyNoteBadge}
                emissive={SPRINT_PALETTE.stickyNoteBadge}
                emissiveIntensity={0.65}
                roughness={0.4}
                toneMapped={false}
              />
            </mesh>
            {/* Count text */}
            <Text
              position={[0, 0, 0.01]}
              fontSize={0.32}
              color={SPRINT_PALETTE.stickyNoteBadgeText}
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.012}
              outlineColor={SPRINT_PALETTE.redBridgeTrim}
            >
              {unreadCount > 9 ? '9+' : `${unreadCount}`}
            </Text>
          </group>
        ) : null}

        {/* "PR" header text bottom-left */}
        <Text
          position={[-0.45, -0.5, 0.02]}
          fontSize={0.17}
          color={SPRINT_PALETTE.scaffoldingJoint}
          anchorX="left"
          anchorY="middle"
        >
          PR comments
        </Text>
      </group>
    </Billboard>
  );
}
