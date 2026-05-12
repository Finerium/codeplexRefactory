'use client';

/**
 * SpecDriftCrackPattern: 5 visually DISTINCT crack overlays for the 5
 * deterministic spec-drift retak patterns A through E per PRD Section 11.3.
 *
 * Owner: Asclepius (Wave-Fixing #2 cycle 1, STAMP=20260513-0313).
 *
 * Manager directive Feature #29 anchor:
 *   "Feature #29 Spec-drift Pattern A-E crack pattern visual DISTINCT (5
 *    custom shader pattern, A different from B, etc)"
 *
 * Distinct geometry per pattern (each pattern targets a different visual
 * metaphor matching its semantic):
 *   A. Stale closed issue   -> single long horizontal crack near the top
 *      (suggests "ceiling stale, work continued under closed roof")
 *   B. Closed without merge -> dotted X scar (two diagonal crack lines
 *      crossing, with intermittent gaps; suggests "intent crossed out")
 *   C. Spec-implementation lag -> wide horizontal gap mid-building with
 *      glowing seam (suggests "drift gap between spec + impl")
 *   D. Reopened cycle       -> zigzag vertical crack (suggests cycle of
 *      reopen + reclose, jagged like a stress fracture)
 *   E. OpenSpec drift       -> broken-loop circular crack (suggests the
 *      OpenSpec workflow loop was bypassed)
 *
 * Color: all patterns use the codeplex-clio crack-orange + a clio
 * emissive tint so spec-drift visually reads as "Clio's domain"
 * (narrator of history + drift, PRD Section 10.4).
 *
 * Mount target: each <SpecDriftCrackPattern> sits as a sibling overlay
 * on a building. Wave-Fixing #2 mounts the layer via SpecDriftLayer that
 * reads a list of drift-flagged buildings + which pattern applies.
 *
 * Compliance: Lock 1 (no em dash). Lock 2 (no emoji). Lock 5 (Wave 2 +
 * Wave-Fixing #2 mock pattern; Wave 3 Demeter spec-drift detector + Boreas
 * narration wire the real flagged building list).
 */

import { useMemo } from 'react';
import { Color } from 'three';
import type { BuildingData } from '@/scene/buildings/types';

export type SpecDriftPattern = 'A' | 'B' | 'C' | 'D' | 'E';

export interface SpecDriftFlag {
  buildingId: string;
  pattern: SpecDriftPattern;
}

const PATTERN_COLOR: Record<SpecDriftPattern, string> = {
  A: '#d97e3e', // stale-orange
  B: '#c45050', // closed-without-merge crimson
  C: '#e8b14e', // lag-amber
  D: '#b96fa6', // reopened-magenta
  E: '#7b9ed1', // openspec-blue
};

const PATTERN_LABEL: Record<SpecDriftPattern, string> = {
  A: 'Stale closed issue',
  B: 'Closed without merge',
  C: 'Spec-implementation lag',
  D: 'Reopened cycle',
  E: 'OpenSpec drift',
};

interface CrackPrimitiveProps {
  building: BuildingData;
  pattern: SpecDriftPattern;
}

/**
 * Pattern A: single long horizontal crack near the top of the building.
 * Width = 80% of building width, height = 0.08 unit thin line, position
 * at 80% of building height. Faint emissive seam.
 */
function PatternA({ building, color }: { building: BuildingData; color: Color }) {
  const w = building.width * 0.8;
  const y = building.height * 0.82;
  return (
    <mesh
      position={[
        building.position[0],
        building.position[1] + y,
        building.position[2] + building.depth / 2 + 0.02,
      ]}
    >
      <planeGeometry args={[w, 0.08]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.55}
        transparent
        opacity={0.85}
        depthWrite={false}
      />
    </mesh>
  );
}

/**
 * Pattern B: dotted X (two crossing diagonals with dashed gaps).
 * Two thin planes rotated +45 and -45 degrees; each composed of 6 short
 * segments to create the dashed look.
 */
function PatternB({ building, color }: { building: BuildingData; color: Color }) {
  const length = Math.min(building.width, building.height) * 0.7;
  const segmentLen = length / 6;
  const segments = [0, 1, 2, 3, 4, 5];
  const baseY = building.height * 0.5;
  return (
    <group
      position={[
        building.position[0],
        building.position[1] + baseY,
        building.position[2] + building.depth / 2 + 0.02,
      ]}
    >
      {/* Diagonal 1: +45 deg */}
      <group rotation={[0, 0, Math.PI / 4]}>
        {segments.map((i) => {
          if (i % 2 !== 0) return null; // gap segments
          const offset = (i - 2.5) * segmentLen;
          return (
            <mesh key={`b1-${i}`} position={[offset, 0, 0]}>
              <planeGeometry args={[segmentLen * 0.8, 0.08]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={0.55}
                transparent
                opacity={0.9}
                depthWrite={false}
              />
            </mesh>
          );
        })}
      </group>
      {/* Diagonal 2: -45 deg */}
      <group rotation={[0, 0, -Math.PI / 4]}>
        {segments.map((i) => {
          if (i % 2 !== 0) return null;
          const offset = (i - 2.5) * segmentLen;
          return (
            <mesh key={`b2-${i}`} position={[offset, 0, 0]}>
              <planeGeometry args={[segmentLen * 0.8, 0.08]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={0.55}
                transparent
                opacity={0.9}
                depthWrite={false}
              />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

/**
 * Pattern C: wide horizontal gap with glowing seam (two parallel cracks).
 * Two horizontal lines at 45% and 50% of building height creating a
 * visible "gap" between them, with a brighter glow.
 */
function PatternC({ building, color }: { building: BuildingData; color: Color }) {
  const w = building.width * 0.9;
  return (
    <group
      position={[
        building.position[0],
        building.position[1],
        building.position[2] + building.depth / 2 + 0.02,
      ]}
    >
      <mesh position={[0, building.height * 0.45, 0]}>
        <planeGeometry args={[w, 0.1]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.75}
          transparent
          opacity={0.9}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, building.height * 0.5, 0]}>
        <planeGeometry args={[w, 0.1]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.75}
          transparent
          opacity={0.9}
          depthWrite={false}
        />
      </mesh>
      {/* The "gap" glow in between */}
      <mesh position={[0, building.height * 0.475, -0.01]}>
        <planeGeometry args={[w * 0.95, building.height * 0.06]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.25}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/**
 * Pattern D: vertical zigzag crack from rooftop down to ~70% of height.
 * Built as a series of short angled segments alternating direction.
 */
function PatternD({ building, color }: { building: BuildingData; color: Color }) {
  const zigSegments = 6;
  const segLen = (building.height * 0.5) / zigSegments;
  const xOffset = building.width * 0.08;
  return (
    <group
      position={[
        building.position[0],
        building.position[1] + building.height * 0.95,
        building.position[2] + building.depth / 2 + 0.02,
      ]}
    >
      {Array.from({ length: zigSegments }).map((_, i) => {
        const dir = i % 2 === 0 ? 1 : -1;
        const yMid = -(i + 0.5) * segLen;
        const angle = Math.atan2(segLen, xOffset * 2 * dir) - Math.PI / 2;
        return (
          <mesh
            key={`d-${i}`}
            position={[dir * xOffset * 0.4, yMid, 0]}
            rotation={[0, 0, angle]}
          >
            <planeGeometry args={[segLen * 1.05, 0.08]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.6}
              transparent
              opacity={0.9}
              depthWrite={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/**
 * Pattern E: broken-loop circular crack (90% of a ring, with a gap),
 * positioned mid-building. Suggests workflow loop was bypassed.
 */
function PatternE({ building, color }: { building: BuildingData; color: Color }) {
  const radius = Math.min(building.width, building.height) * 0.3;
  return (
    <mesh
      position={[
        building.position[0],
        building.position[1] + building.height * 0.5,
        building.position[2] + building.depth / 2 + 0.02,
      ]}
    >
      {/* thetaStart + thetaLength create the "broken" gap. */}
      <ringGeometry
        args={[radius - 0.06, radius + 0.06, 48, 1, 0, Math.PI * 1.7]}
      />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.6}
        transparent
        opacity={0.9}
        depthWrite={false}
      />
    </mesh>
  );
}

function CrackPrimitive({ building, pattern }: CrackPrimitiveProps) {
  const color = useMemo(() => new Color(PATTERN_COLOR[pattern]), [pattern]);
  switch (pattern) {
    case 'A':
      return <PatternA building={building} color={color} />;
    case 'B':
      return <PatternB building={building} color={color} />;
    case 'C':
      return <PatternC building={building} color={color} />;
    case 'D':
      return <PatternD building={building} color={color} />;
    case 'E':
      return <PatternE building={building} color={color} />;
  }
}

interface SpecDriftCrackPatternProps {
  /** Building to attach the crack overlay onto. */
  building: BuildingData;
  /** Which of A/B/C/D/E patterns. */
  pattern: SpecDriftPattern;
}

export function SpecDriftCrackPattern({
  building,
  pattern,
}: SpecDriftCrackPatternProps) {
  return (
    <group name={`spec-drift-crack-${pattern}-${building.id}`}>
      <CrackPrimitive building={building} pattern={pattern} />
    </group>
  );
}

SpecDriftCrackPattern.displayName = 'SpecDriftCrackPattern';

export { PATTERN_LABEL };
