'use client';

/**
 * Crane overlay (PRD Section 9.2 concept 2: Active development PR open).
 *
 * Articulated yellow tower crane atop the building. Mast vertical, jib
 * cantilevers out, counterweight rests on the opposite arm, a hook + cable
 * hangs from the jib. Slowly rotates around the mast (10s cycle) while the
 * PR is open.
 *
 * Anti-AI-slop choices per `_meta/decision_log/hera.md` D-Hera-04:
 *   - Articulated (not single mesh): mast, jib, counterweight, cable, hook
 *   - Smooth slow rotation (NOT abrupt or static) so the crane reads alive
 *   - Subtle bob on the hook simulating settle motion
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

interface CraneProps {
  building: BuildingData;
  active: boolean;
}

export function Crane({ building, active }: CraneProps) {
  const rotateRef = useRef<Group>(null);
  const hookRef = useRef<Group>(null);
  const phase = useMemo(() => seededRandom(building.id, 11) * Math.PI * 2, [building.id]);

  useFrame((state) => {
    if (!active) return;
    if (rotateRef.current) {
      // 10s full rotation per Hera prompt Section 9 example.
      const t = state.clock.elapsedTime + phase;
      rotateRef.current.rotation.y = (t * (Math.PI * 2)) / 10;
    }
    if (hookRef.current) {
      // Subtle hook bob simulating cable sway.
      const t = state.clock.elapsedTime * 1.4 + phase;
      hookRef.current.position.y = -8 + Math.sin(t) * 0.3;
    }
  });

  if (!active) return null;

  const baseX = building.position[0];
  const baseY = building.position[1] + building.height + 0.8;
  const baseZ = building.position[2];

  const mastHeight = 12;
  const jibLength = 14;

  return (
    <group position={[baseX, baseY, baseZ]}>
      {/* Tiny pedestal anchoring the mast to the roof */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.6, 0.7, 0.4, 12]} />
        <meshStandardMaterial
          color={SPRINT_PALETTE.scaffoldingJoint}
          roughness={0.35}
          metalness={0.85}
        />
      </mesh>

      {/* Rotating crane assembly anchored on the pedestal */}
      <group ref={rotateRef} position={[0, 0.5, 0]}>
        {/* Mast (vertical yellow tower) */}
        <mesh position={[0, mastHeight / 2, 0]} castShadow>
          <boxGeometry args={[0.7, mastHeight, 0.7]} />
          <meshStandardMaterial
            color={SPRINT_PALETTE.craneYellow}
            roughness={0.45}
            metalness={0.35}
          />
        </mesh>

        {/* Mast lattice cross supports */}
        {[0.3, 0.55, 0.8].map((frac, i) => (
          <mesh key={`lattice-${i}`} position={[0, mastHeight * frac, 0]}>
            <boxGeometry args={[1.0, 0.12, 0.12]} />
            <meshStandardMaterial
              color={SPRINT_PALETTE.craneYellow}
              roughness={0.5}
              metalness={0.3}
            />
          </mesh>
        ))}

        {/* Operator cabin at the top */}
        <mesh position={[0, mastHeight + 0.6, 0]}>
          <boxGeometry args={[1.4, 1.2, 1.4]} />
          <meshStandardMaterial
            color={SPRINT_PALETTE.craneYellow}
            roughness={0.4}
            metalness={0.35}
          />
        </mesh>

        {/* Jib (horizontal arm) cantilevering forward */}
        <mesh position={[jibLength / 2, mastHeight + 1.2, 0]} castShadow>
          <boxGeometry args={[jibLength, 0.45, 0.45]} />
          <meshStandardMaterial
            color={SPRINT_PALETTE.craneYellow}
            roughness={0.4}
            metalness={0.4}
          />
        </mesh>

        {/* Counterweight arm (smaller, behind) */}
        <mesh position={[-3.5, mastHeight + 1.2, 0]} castShadow>
          <boxGeometry args={[6, 0.4, 0.4]} />
          <meshStandardMaterial
            color={SPRINT_PALETTE.craneYellow}
            roughness={0.5}
            metalness={0.3}
          />
        </mesh>

        {/* Counterweight block at the back */}
        <mesh position={[-6.2, mastHeight + 1.0, 0]} castShadow>
          <boxGeometry args={[1.2, 1.4, 1.2]} />
          <meshStandardMaterial
            color={SPRINT_PALETTE.craneCounterweight}
            roughness={0.3}
            metalness={0.9}
          />
        </mesh>

        {/* Cable + hook hanging from the jib tip */}
        <group position={[jibLength - 0.5, mastHeight + 1.0, 0]}>
          {/* Cable */}
          <mesh position={[0, -4, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 8, 6]} />
            <meshStandardMaterial
              color={SPRINT_PALETTE.craneCable}
              roughness={0.7}
              metalness={0.2}
            />
          </mesh>
          {/* Hook */}
          <group ref={hookRef}>
            <mesh>
              <coneGeometry args={[0.35, 0.7, 6]} />
              <meshStandardMaterial
                color={SPRINT_PALETTE.craneCounterweight}
                roughness={0.3}
                metalness={0.9}
              />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}
