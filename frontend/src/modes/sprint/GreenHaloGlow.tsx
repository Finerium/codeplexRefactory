'use client';

/**
 * GreenHaloGlow overlay (PRD Section 9.2 concept 5: PR approved transient).
 *
 * Pulsing emissive green halo wrapping the building. Decays over 30 minutes
 * (easeOutCubic) from full opacity at approval to 0 at expire. Side-effect
 * overlay, NOT a state value: appears on `prApprovedAt` timestamp set,
 * persists through pr.merged transition, fades to invisible after 30 minutes.
 *
 * Anti-AI-slop choices per `_meta/decision_log/hera.md` D-Hera-04:
 *   - Pulse modulation on top of decay curve (slow breathing at 0.4 Hz)
 *   - Two-layer halo (inner thin emissive ring + outer wider soft glow)
 *   - Emissive intensity scales with opacity, NOT opacity alone (additive
 *     blending so building underneath stays visible)
 *
 * Compliance:
 *   - Lock 1 (no em dash): clean
 *   - Lock 2 (no emoji): clean
 *   - Lock 5 (honest claim): no mock label
 *
 * Performance:
 *   - 2 ring meshes per active halo. Decay logic via useFrame, no React
 *     state updates. Halo culls when opacity < 0.02 (visualFlags.hasGreenHalo).
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh, MeshStandardMaterial } from 'three';
import { AdditiveBlending } from 'three';
import type { BuildingData } from '@/scene/buildings/types';
import { SPRINT_PALETTE } from './visualUtils';

interface GreenHaloGlowProps {
  building: BuildingData;
  active: boolean;
  /** Opacity at this moment, 0..1, computed in stateMachine.computeVisualFlags. */
  opacity: number;
}

export function GreenHaloGlow({ building, active, opacity }: GreenHaloGlowProps) {
  const innerRef = useRef<Mesh>(null);
  const outerRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (!active || opacity <= 0.02) return;
    // Breathing pulse 0.4 Hz, amplitude 0.15 around base opacity.
    const t = state.clock.elapsedTime;
    const pulse = 1 + Math.sin(t * Math.PI * 0.8) * 0.15;
    if (innerRef.current) {
      const mat = innerRef.current.material as MeshStandardMaterial;
      mat.opacity = opacity * pulse;
      mat.emissiveIntensity = 1.2 * opacity * pulse;
    }
    if (outerRef.current) {
      const mat = outerRef.current.material as MeshStandardMaterial;
      mat.opacity = opacity * pulse * 0.5;
      mat.emissiveIntensity = 0.8 * opacity * pulse;
    }
  });

  if (!active || opacity <= 0.02) return null;

  // Position at building center mid-height.
  const cx = building.position[0];
  const cy = building.position[1] + building.height / 2;
  const cz = building.position[2];

  // Halo radius slightly larger than the building diagonal.
  const baseRadius = Math.max(building.width, building.depth) * 0.65;

  return (
    <group position={[cx, cy, cz]}>
      {/* Inner halo: thin emissive ring */}
      <mesh ref={innerRef} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[baseRadius, 0.35, 12, 48]} />
        <meshStandardMaterial
          color={SPRINT_PALETTE.greenHaloEmissive}
          emissive={SPRINT_PALETTE.greenHaloEmissive}
          emissiveIntensity={1.2 * opacity}
          transparent
          opacity={opacity}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Outer halo: wider softer glow */}
      <mesh ref={outerRef} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[baseRadius * 1.5, 1.0, 10, 40]} />
        <meshStandardMaterial
          color={SPRINT_PALETTE.greenHaloFill}
          emissive={SPRINT_PALETTE.greenHaloFill}
          emissiveIntensity={0.8 * opacity}
          transparent
          opacity={opacity * 0.5}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
