'use client';

/**
 * GhostBuilding: in-scene 3D component rendering a single proposed ghost
 * building. Combines a transparent main mesh (using the Iris generic
 * archetype geometry) with an animated dashed edge overlay so it reads as
 * "proposed, not yet built" per PRD Section 9.3 + Section 13.2 visual
 * baseline.
 *
 * Owner: Asclepius (Wave 2).
 *
 * Visual layers:
 *   1. Main mesh: same archetype geometry as a real building, scaled by
 *      hint.width/depth/height. Material is MeshStandardMaterial with
 *      emissive tint + transparent opacity. The opacity + emissive intensity
 *      morph from "ghost" (50% opacity, glow emissive) toward "solid"
 *      (100% opacity, low emissive) as `solidProgress` rises 0..1.
 *   2. Edge overlay: a LineSegments using EdgesGeometry on the same
 *      geometry, rendered with LineDashedMaterial. The dashed pattern
 *      animates by shifting `dashSize` over time. As solidProgress rises,
 *      the dash material gradually fades to transparent.
 *   3. Base ring: a thin emissive ring at the foundation, suggesting a
 *      "suggested location" marker.
 *
 * Tunable: `pulseSpeed` controls the animated-dash rate; default 1 rad/s.
 *
 * Compliance: Lock 1 (no em dash). Lock 2 (no emoji). Lock 3 (SAFETY-FIRST
 * Refactor Mode: visual only; no production code paths from this file).
 */

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Color,
  EdgesGeometry,
  type Group,
  type LineSegments,
  type Mesh,
} from 'three';
import type { GhostBuildingHint } from './simulationEvents';
import { getGhostGeometry } from './__ghost__/ghostGeometry';

interface GhostBuildingProps {
  hint: GhostBuildingHint;
  /** 0..1: 0 fully ghost, 1 fully solid. GhostToSolidAnimation drives this. */
  solidProgress: number;
  /** Whether to fade the entire ghost out (Discard action). 0..1. */
  fadeOut?: number;
  /** Visual base color for the ghost. Defaults to a cool blue-violet. */
  baseColor?: string;
}

const DEFAULT_GHOST_COLOR = '#7c8aff';
const DASH_CYCLE_SEC = 1.0;

/**
 * Lookup the base 1.0-unit geometry for the archetype.
 */
function useGhostGeometry(hint: GhostBuildingHint) {
  return useMemo(() => getGhostGeometry(hint.archetype), [hint.archetype]);
}

export function GhostBuilding({
  hint,
  solidProgress,
  fadeOut = 0,
  baseColor = DEFAULT_GHOST_COLOR,
}: GhostBuildingProps) {
  const groupRef = useRef<Group>(null);
  const meshRef = useRef<Mesh>(null);
  const edgesRef = useRef<LineSegments>(null);

  const geometry = useGhostGeometry(hint);
  const edgesGeometry = useMemo(() => new EdgesGeometry(geometry), [geometry]);

  // Compute dashed material line distances once geometry is ready.
  useEffect(() => {
    if (edgesRef.current) {
      edgesRef.current.computeLineDistances();
    }
  }, [edgesGeometry]);

  // Animate the dashed offset for the "proposed" feel + pulse the emissive
  // intensity slightly to suggest unsettled state. As `solidProgress` rises,
  // the emissive fades + the opacity climbs toward 1.
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const ghostRatio = 1 - solidProgress;
    const visibility = 1 - fadeOut;

    // Main mesh: opacity + emissive intensity morph.
    if (meshRef.current) {
      const raw = meshRef.current.material;
      const mat = (Array.isArray(raw) ? raw[0] : raw) as unknown as {
        opacity: number;
        emissiveIntensity: number;
        color: Color;
      } | undefined;
      if (mat) {
        mat.opacity = (0.45 + 0.55 * solidProgress) * visibility;
        mat.emissiveIntensity = 0.55 * ghostRatio * visibility;
      }
    }

    // Edges: animate dashSize + fade opacity as solidifies + fadeOut.
    if (edgesRef.current) {
      const raw = edgesRef.current.material;
      const mat = (Array.isArray(raw) ? raw[0] : raw) as unknown as {
        opacity: number;
        dashSize: number;
      } | undefined;
      if (mat) {
        const dashShift = (t % DASH_CYCLE_SEC) / DASH_CYCLE_SEC;
        mat.dashSize = 0.25 + dashShift * 0.15;
        mat.opacity = ghostRatio * visibility * 0.85;
      }
    }
  });

  const colorObj = useMemo(() => new Color(baseColor), [baseColor]);

  // The Iris generic archetypes are normalized to footprint 1.0 x 1.0 and
  // height 1.0 at unit scale; scale to the hint's width/depth/height to
  // reach the suggested ghost dimensions.
  const scale: [number, number, number] = [hint.width, hint.height, hint.depth];

  return (
    <group ref={groupRef} position={hint.position} name={`ghost-${hint.ghostId}`}>
      {/* 1. Main mesh transparent + emissive */}
      <mesh ref={meshRef} geometry={geometry} scale={scale}>
        <meshStandardMaterial
          color={colorObj}
          emissive={colorObj}
          emissiveIntensity={0.55}
          transparent
          opacity={0.45}
          depthWrite={false}
        />
      </mesh>

      {/* 2. Animated dashed edge overlay */}
      <lineSegments ref={edgesRef} geometry={edgesGeometry} scale={scale}>
        <lineDashedMaterial
          color={colorObj}
          dashSize={0.3}
          gapSize={0.18}
          transparent
          opacity={0.85}
          depthWrite={false}
          linewidth={1}
        />
      </lineSegments>

      {/* 3. Base ring marker: suggested location indicator */}
      <mesh
        position={[0, 0.05, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry
          args={[Math.max(hint.width, hint.depth) * 0.55, Math.max(hint.width, hint.depth) * 0.72, 36]}
        />
        <meshStandardMaterial
          color={colorObj}
          emissive={colorObj}
          emissiveIntensity={0.4 * (1 - fadeOut)}
          transparent
          opacity={0.45 * (1 - solidProgress) * (1 - fadeOut)}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

GhostBuilding.displayName = 'GhostBuilding';
