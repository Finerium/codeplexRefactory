'use client';

/**
 * RedBridge overlay (PRD Section 9.2 concept 13: Issue dependency).
 *
 * Single bridge geometry connecting source building to target dependency
 * building. Tube geometry along a quadratic curve, red emissive material,
 * subtle scanline pulse simulating dependency information flow.
 *
 * Anti-AI-slop choices per `_meta/decision_log/hera.md` D-Hera-04:
 *   - Tube geometry along a Bezier curve (NOT a straight line), so the
 *     bridge arcs gracefully over potentially obstructing buildings
 *   - Emissive red + dark trim, NOT a flat unlit color
 *   - Subtle pulse animation along the tube (via dashOffset alternative:
 *     scale wave instead, more compatible with Drei Line semantics)
 *
 * Compliance:
 *   - Lock 1 (no em dash): clean
 *   - Lock 2 (no emoji): clean
 *   - Lock 5 (honest claim): no mock label
 */

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CatmullRomCurve3, Vector3 } from 'three';
import type { Mesh, MeshStandardMaterial } from 'three';
import type { BuildingData } from '@/scene/buildings/types';
import { SPRINT_PALETTE } from './visualUtils';

interface RedBridgeProps {
  sourceBuilding: BuildingData;
  targetBuilding: BuildingData;
  active: boolean;
}

export function RedBridge({ sourceBuilding, targetBuilding, active }: RedBridgeProps) {
  const meshRef = useRef<Mesh>(null);

  const tubeData = useMemo(() => {
    if (!active) return null;
    const start = new Vector3(
      sourceBuilding.position[0],
      sourceBuilding.position[1] + sourceBuilding.height + 0.4,
      sourceBuilding.position[2]
    );
    const end = new Vector3(
      targetBuilding.position[0],
      targetBuilding.position[1] + targetBuilding.height + 0.4,
      targetBuilding.position[2]
    );
    // Arc midpoint above both roofs: max height + 4 units lift
    const midY = Math.max(start.y, end.y) + 4 + start.distanceTo(end) * 0.1;
    const mid = new Vector3((start.x + end.x) / 2, midY, (start.z + end.z) / 2);

    const curve = new CatmullRomCurve3([start, mid, end], false, 'catmullrom', 0.2);
    return { curve };
  }, [sourceBuilding, targetBuilding, active]);

  useFrame((state) => {
    if (!meshRef.current || !active) return;
    const mat = meshRef.current.material as MeshStandardMaterial;
    // Pulse emissive intensity 0.55 +- 0.25 at 1.2 Hz
    mat.emissiveIntensity = 0.55 + Math.sin(state.clock.elapsedTime * Math.PI * 1.2) * 0.25;
  });

  if (!active || !tubeData) return null;

  return (
    <mesh ref={meshRef} castShadow>
      <tubeGeometry args={[tubeData.curve, 32, 0.18, 8, false]} />
      <meshStandardMaterial
        color={SPRINT_PALETTE.redBridgeTrim}
        emissive={SPRINT_PALETTE.redBridgeEmissive}
        emissiveIntensity={0.55}
        roughness={0.5}
        metalness={0.45}
        toneMapped={false}
      />
    </mesh>
  );
}
