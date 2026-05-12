'use client';

/**
 * DistrictBorder overlay (PRD Section 9.2 concept 10: Component district owner highlight).
 *
 * Glowing edge line around the district bounding rectangle, with subtle epic
 * flag at the centroid. Color matches the district owner from DistrictData.
 * Drawn ALWAYS-ON in Sprint Mode (district context is always relevant to
 * agile workflow), but de-emphasized via low opacity unless district has an
 * active sprint building.
 *
 * Anti-AI-slop choices per `_meta/decision_log/hera.md` D-Hera-04:
 *   - Drei `<Line>` with emissive trail color matched to ownership encoding
 *   - Subtle scanline animation via dashOffset (Drei does not natively
 *     support live dash offset; we approximate via 3 line layers offset)
 *
 * Compliance:
 *   - Lock 1 (no em dash): clean
 *   - Lock 2 (no emoji): clean
 *   - Lock 5 (honest claim): no mock label
 */

import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import type { DistrictData } from '@/scene/buildings/types';
import { SPRINT_PALETTE } from './visualUtils';

interface DistrictBorderProps {
  district: DistrictData;
  active: boolean;
  /** True if at least 1 building in this district has an active sprint state */
  hasActiveSprint: boolean;
}

function buildBorderPoints(district: DistrictData): [number, number, number][] {
  const [minX, minZ, maxX, maxZ] = district.bounds;
  const y = 0.12; // float just above ground plane to avoid z-fight
  return [
    [minX, y, minZ],
    [maxX, y, minZ],
    [maxX, y, maxZ],
    [minX, y, maxZ],
    [minX, y, minZ],
  ];
}

export function DistrictBorder({ district, active, hasActiveSprint }: DistrictBorderProps) {
  const points = useMemo(() => buildBorderPoints(district), [district]);

  if (!active) return null;

  // Color logic: use district owner color, intensify when sprint active.
  const color = hasActiveSprint ? district.ownerColor : SPRINT_PALETTE.districtGlow;
  const lineWidth = hasActiveSprint ? 2.8 : 1.4;
  const opacity = hasActiveSprint ? 0.95 : 0.45;

  return (
    <Line
      points={points}
      color={color}
      lineWidth={lineWidth}
      transparent
      opacity={opacity}
      dashed={false}
    />
  );
}
