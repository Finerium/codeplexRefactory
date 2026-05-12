'use client';

/**
 * GlowWindow: per-building health glow effect.
 *
 * Owner: Asclepius (Wave 2). Renders a severity-tinted emissive halo above a
 * given building position. Critical severity pulses; high + medium + low +
 * info stay steady.
 *
 * Anti-AI-slop discipline (per Asclepius prompt Section 4 + PRD Section 13.2
 * non-negotiable Living City baseline):
 *   - This is NOT a flat CSS drop shadow on a HUD plane. It is a Three.js
 *     emissive plane positioned at building rooftop height, layered with a
 *     ring halo + a vertical light cone. Bloom (Daedalus global post pass)
 *     amplifies the emissive into a glow without per-instance bloom layer
 *     coordination, so we cooperate with the existing pipeline (Lock 3:
 *     SAFETY-FIRST against modifying Daedalus' Canvas post pass).
 *   - Severity color comes from `SEVERITY_PALETTE`, locked at PRD Section
 *     11; not remapped here.
 *   - Critical severity pulses sine-wave at 3 rad/s, modulating
 *     `emissiveIntensity` between 0.55 + 0.45 = 1.0 peak and 0.55 - 0.45 =
 *     0.10 trough. High + medium + low + info stay at a steady value chosen
 *     per severity rank so the visual hierarchy reads.
 *
 * Mount pattern: this component lives in the r3f scene tree, mounted by
 * <HealthGlowLayer /> which iterates the GlowWindowState list from the
 * Asclepius store. Each glowing building gets one <GlowWindow /> instance.
 *
 * Compliance: Lock 1 (no em dash). Lock 2 (no emoji). Lock 4 (severity
 * color palette locked, imported from types).
 */

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, type Mesh } from 'three';
import type { Severity } from './types';
import { SEVERITY_PALETTE } from './types';

interface GlowWindowProps {
  /** Building x/y/z position in world space. */
  position: [number, number, number];
  /** Building height; the glow sits slightly above the rooftop. */
  buildingHeight: number;
  /** Severity drives color + pulse vs steady mode. */
  severity: Severity;
  /** Optional scale multiplier for the halo footprint. Defaults to building width hint. */
  footprint?: number;
}

/**
 * Steady emissive intensity by severity. Critical overridden by pulse loop.
 */
const STEADY_INTENSITY: Record<Severity, number> = {
  critical: 0.85, // base, pulse modulates around this
  high: 0.7,
  medium: 0.55,
  low: 0.35,
  info: 0.3,
};

const HALO_OPACITY: Record<Severity, number> = {
  critical: 0.55,
  high: 0.5,
  medium: 0.45,
  low: 0.35,
  info: 0.3,
};

/**
 * Glow elements (3 layered):
 *   1. Top-mounted emissive plane (flat halo above rooftop).
 *   2. Ring halo encircling the building footprint at ground.
 *   3. Slim vertical light shaft from rooftop, suggesting "diagnostic beam".
 */
export function GlowWindow({
  position,
  buildingHeight,
  severity,
  footprint = 4,
}: GlowWindowProps) {
  const topPlaneRef = useRef<Mesh>(null);
  const ringRef = useRef<Mesh>(null);
  const shaftRef = useRef<Mesh>(null);

  const color = useMemo(() => new Color(SEVERITY_PALETTE[severity]), [severity]);
  const isPulsing = severity === 'critical';

  useFrame((state) => {
    if (!isPulsing) return;
    const t = state.clock.getElapsedTime();
    // 3 rad/s pulse, range 0.4..1.3 around 0.85 base.
    const pulse = 0.85 + 0.45 * Math.sin(t * 3);

    const writeEmissive = (
      mesh: Mesh | null,
      intensity: number,
    ): void => {
      if (!mesh) return;
      const raw = mesh.material;
      const mat = (Array.isArray(raw) ? raw[0] : raw) as unknown as {
        emissiveIntensity?: number;
      } | undefined;
      if (mat && typeof mat.emissiveIntensity === 'number') {
        mat.emissiveIntensity = intensity;
      }
    };
    const writeOpacity = (mesh: Mesh | null, opacity: number): void => {
      if (!mesh) return;
      const raw = mesh.material;
      const mat = (Array.isArray(raw) ? raw[0] : raw) as unknown as {
        opacity?: number;
      } | undefined;
      if (mat && typeof mat.opacity === 'number') {
        mat.opacity = opacity;
      }
    };

    writeEmissive(topPlaneRef.current, pulse);
    writeEmissive(ringRef.current, pulse * 0.8);
    writeOpacity(shaftRef.current, 0.18 + 0.12 * Math.sin(t * 3));
  });

  const steadyIntensity = STEADY_INTENSITY[severity];
  const haloOpacity = HALO_OPACITY[severity];

  // Position above rooftop. buildingHeight is in world units; +1 unit clearance.
  const rooftopY = position[1] + buildingHeight + 1.2;
  const groundY = position[1] + 0.05;
  const shaftMidY = position[1] + buildingHeight / 2 + 1.2;

  return (
    <group name={`glow-window-${severity}`}>
      {/* 1. Top-mounted emissive plane: halo over the rooftop. */}
      <mesh
        ref={topPlaneRef}
        position={[position[0], rooftopY, position[2]]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[footprint * 0.9, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={steadyIntensity}
          transparent
          opacity={haloOpacity}
          depthWrite={false}
        />
      </mesh>

      {/* 2. Ring halo at ground level encircling the footprint. */}
      <mesh
        ref={ringRef}
        position={[position[0], groundY, position[2]]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry
          args={[footprint * 0.95, footprint * 1.25, 48]}
        />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={steadyIntensity * 0.9}
          transparent
          opacity={haloOpacity * 0.85}
          depthWrite={false}
        />
      </mesh>

      {/* 3. Slim vertical shaft: diagnostic beam. */}
      <mesh
        ref={shaftRef}
        position={[position[0], shaftMidY, position[2]]}
      >
        <cylinderGeometry
          args={[footprint * 0.18, footprint * 0.32, buildingHeight + 2.4, 16, 1, true]}
        />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.18}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

GlowWindow.displayName = 'GlowWindow';
