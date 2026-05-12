'use client';

/**
 * InspectorNPC overlay (PRD Section 9.2 concept 4: PR review state).
 *
 * Small humanoid figure orbits the building slowly while review is in
 * progress. Briefcase + hard hat distinguish the silhouette from generic
 * passerby (so the demo reads "code reviewer", not "ambient pedestrian").
 *
 * Anti-AI-slop choices per `_meta/decision_log/hera.md` D-Hera-04:
 *   - Distinct briefcase + hard hat (silhouette identifier)
 *   - Orbit on a circle around the building at mid-height
 *   - Subtle walk-bob (vertical 0.15 unit sine, frequency 1.6Hz simulating step)
 *   - Faces direction of motion automatically
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

interface InspectorNPCProps {
  building: BuildingData;
  active: boolean;
}

export function InspectorNPC({ building, active }: InspectorNPCProps) {
  const groupRef = useRef<Group>(null);
  const phase = useMemo(() => seededRandom(building.id, 17) * Math.PI * 2, [building.id]);

  // Orbit radius = max(width, depth)/2 + 2 units pad
  const orbitRadius = Math.max(building.width, building.depth) / 2 + 2;
  const orbitY = building.height * 0.5;

  useFrame((state) => {
    if (!groupRef.current || !active) return;
    const t = state.clock.elapsedTime * 0.35 + phase; // slow orbit period ~18s
    const x = Math.cos(t) * orbitRadius;
    const z = Math.sin(t) * orbitRadius;
    // Walk bob 1.6Hz, 0.15 amplitude
    const bob = Math.sin(state.clock.elapsedTime * 5.0 + phase) * 0.15;
    groupRef.current.position.set(
      building.position[0] + x,
      building.position[1] + orbitY + bob,
      building.position[2] + z
    );
    // Face direction of motion (tangent to orbit). dx/dt of (cos(t)*r, sin(t)*r)
    // is (-sin(t)*r, cos(t)*r), so heading angle = atan2(cos(t), -sin(t))
    groupRef.current.rotation.y = Math.atan2(Math.cos(t), -Math.sin(t));
  });

  if (!active) return null;

  return (
    <group
      ref={groupRef}
      position={[
        building.position[0] + orbitRadius,
        building.position[1] + orbitY,
        building.position[2],
      ]}
    >
      {/* Body: trapezoidal navy torso */}
      <mesh position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.35, 0.45, 1.2, 8]} />
        <meshStandardMaterial
          color={SPRINT_PALETTE.inspectorBody}
          roughness={0.7}
          metalness={0.05}
        />
      </mesh>

      {/* Head: sphere */}
      <mesh position={[0, 1.85, 0]}>
        <sphereGeometry args={[0.28, 12, 10]} />
        <meshStandardMaterial color="#e3c5a5" roughness={0.85} metalness={0.02} />
      </mesh>

      {/* Hard hat: dome cylinder + brim */}
      <mesh position={[0, 2.1, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.16, 12]} />
        <meshStandardMaterial
          color={SPRINT_PALETTE.inspectorHardHat}
          roughness={0.4}
          metalness={0.25}
        />
      </mesh>
      <mesh position={[0, 2.02, 0]}>
        <cylinderGeometry args={[0.42, 0.42, 0.05, 12]} />
        <meshStandardMaterial
          color={SPRINT_PALETTE.inspectorHardHat}
          roughness={0.45}
          metalness={0.2}
        />
      </mesh>

      {/* Briefcase: small box in left hand */}
      <mesh position={[0.45, 0.7, 0]}>
        <boxGeometry args={[0.32, 0.22, 0.45]} />
        <meshStandardMaterial
          color={SPRINT_PALETTE.inspectorBriefcase}
          roughness={0.5}
          metalness={0.18}
        />
      </mesh>
      {/* Briefcase handle */}
      <mesh position={[0.45, 0.85, 0]}>
        <torusGeometry args={[0.07, 0.02, 6, 10]} />
        <meshStandardMaterial color={SPRINT_PALETTE.craneCable} roughness={0.6} metalness={0.4} />
      </mesh>

      {/* Legs: two small cylinders */}
      <mesh position={[-0.13, 0.2, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.5, 6]} />
        <meshStandardMaterial color={SPRINT_PALETTE.inspectorBody} roughness={0.7} metalness={0.05} />
      </mesh>
      <mesh position={[0.13, 0.2, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.5, 6]} />
        <meshStandardMaterial color={SPRINT_PALETTE.inspectorBody} roughness={0.7} metalness={0.05} />
      </mesh>
    </group>
  );
}
