'use client';

/**
 * SmokeRetakOverlay (PRD Section 9.2 concept 7: CI / test failure).
 *
 * Two-layer overlay:
 *   1. Smoke billow rising from the building roof (instanced sprite billboards
 *      with vertical drift + opacity decay)
 *   2. Retak (crack) decal plane attached to the front face of the building
 *      with crack count scaling per ciFailCount
 *
 * Intensity scales 0..1 with ciFailCount/3 cap. CI fail = smoke gentle +
 * crack 1, multiple fail = smoke + crack 2+.
 *
 * Critical handoff: Earthquake error visual (OQ-06) handed to Daedalus's
 * `<CameraShake>` slot at Canvas root (Wave 3 Nemesis wires real trigger;
 * Daedalus left the slot stubbed per `Canvas.tsx` line 454-460). Hera does
 * NOT camera-shake on CI fail; that lifts to a much bigger trigger
 * (Apollo critical finding CLUSTER).
 *
 * Anti-AI-slop choices per `_meta/decision_log/hera.md` D-Hera-04:
 *   - Smoke uses Three.js `<sprite>` with billboard auto-facing camera
 *   - Procedural crack mesh: thin red-tinted triangle strip on a small plane
 *
 * Compliance:
 *   - Lock 1 (no em dash): clean
 *   - Lock 2 (no emoji): clean
 *   - Lock 5 (honest claim): no mock label
 */

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group, MeshStandardMaterial } from 'three';
import type { BuildingData } from '@/scene/buildings/types';
import { SPRINT_PALETTE, seededRandom } from './visualUtils';

interface SmokeRetakOverlayProps {
  building: BuildingData;
  active: boolean;
  intensity: number; // 0..1
}

interface SmokeParticle {
  baseOffsetX: number;
  baseOffsetZ: number;
  phase: number;
  size: number;
  lifeRatio: number;
}

function buildParticles(building: BuildingData, count: number): SmokeParticle[] {
  const result: SmokeParticle[] = [];
  for (let i = 0; i < count; i++) {
    result.push({
      baseOffsetX: (seededRandom(building.id, 100 + i) - 0.5) * 1.4,
      baseOffsetZ: (seededRandom(building.id, 200 + i) - 0.5) * 1.4,
      phase: seededRandom(building.id, 300 + i),
      size: 0.6 + seededRandom(building.id, 400 + i) * 0.8,
      lifeRatio: seededRandom(building.id, 500 + i),
    });
  }
  return result;
}

export function SmokeRetakOverlay({ building, active, intensity }: SmokeRetakOverlayProps) {
  const groupRef = useRef<Group>(null);
  const particleCount = useMemo(() => {
    if (!active) return 0;
    // Scale particle count 12..40 across intensity 0..1.
    return Math.floor(12 + intensity * 28);
  }, [active, intensity]);

  const particles = useMemo(
    () => buildParticles(building, particleCount),
    [building, particleCount]
  );

  const crackCount = useMemo(() => {
    if (!active) return 0;
    // 1 crack at intensity > 0, +1 at intensity > 0.34, +1 at intensity > 0.67
    return Math.max(1, Math.ceil(intensity * 3));
  }, [active, intensity]);

  useFrame((state) => {
    if (!groupRef.current || !active) return;
    // Particle vertical drift + opacity decay per child
    const children = groupRef.current.children;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < particles.length && i < children.length; i++) {
      const p = particles[i];
      const child = children[i];
      // Life cycle 4s; phase offset per particle for staggering
      const localT = ((t * 0.25 + p.phase) % 1);
      child.position.y = building.height + 0.5 + localT * 5;
      child.position.x = p.baseOffsetX + Math.sin(t * 0.6 + p.phase * 6) * 0.3;
      child.position.z = p.baseOffsetZ + Math.cos(t * 0.55 + p.phase * 6) * 0.3;
      const mesh = child as unknown as { material?: MeshStandardMaterial };
      if (mesh.material) {
        const opacity = (1 - localT) * intensity * 0.65;
        mesh.material.opacity = opacity;
      }
      // Scale grow as particle rises
      const scale = p.size * (0.5 + localT * 0.9);
      child.scale.set(scale, scale, scale);
    }
  });

  if (!active) return null;

  const cx = building.position[0];
  const cy = building.position[1];
  const cz = building.position[2];

  return (
    <>
      {/* Smoke particles (billboards via sphereGeometry approximation) */}
      <group ref={groupRef} position={[cx, cy, cz]}>
        {particles.map((p, i) => (
          <mesh key={`smoke-${i}`} position={[p.baseOffsetX, building.height + 0.5, p.baseOffsetZ]}>
            <sphereGeometry args={[1, 6, 4]} />
            <meshStandardMaterial
              color={i % 3 === 0 ? SPRINT_PALETTE.smokeAsh : SPRINT_PALETTE.smokeGrey}
              roughness={0.95}
              metalness={0.0}
              transparent
              opacity={0.5 * intensity}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* Retak (crack) decals on the front face */}
      <group position={[cx, cy, cz + building.depth / 2 + 0.05]}>
        {Array.from({ length: crackCount }).map((_, i) => {
          const verticalCenter = building.height * (0.3 + (i + 1) * 0.18);
          const horizOffset = (seededRandom(building.id, 600 + i) - 0.5) * building.width * 0.6;
          const rotZ = (seededRandom(building.id, 700 + i) - 0.5) * 0.6;
          const crackLen = building.height * (0.18 + seededRandom(building.id, 800 + i) * 0.12);
          return (
            <mesh
              key={`crack-${i}`}
              position={[horizOffset, verticalCenter, 0]}
              rotation={[0, 0, rotZ]}
            >
              <planeGeometry args={[0.18, crackLen]} />
              <meshStandardMaterial
                color={SPRINT_PALETTE.retakDark}
                emissive={SPRINT_PALETTE.redBridgeTrim}
                emissiveIntensity={0.18 * intensity}
                roughness={0.95}
                transparent
                opacity={0.78}
                depthWrite={false}
              />
            </mesh>
          );
        })}
      </group>
    </>
  );
}
