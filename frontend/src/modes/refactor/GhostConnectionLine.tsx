'use client';

/**
 * GhostConnectionLine: 3D dashed line from a ghost building to the existing
 * affected building. Visualizes file-dependency relationships listed in the
 * `GhostBuildingHint.connections` array.
 *
 * Owner: Asclepius (Wave-Fixing #3, ghost-building connection visual).
 *
 * Wave-Fixing #3 context (Manager directive 2026-05-13):
 *   The original Wave 2 GhostBuilding visual rendered transparent ghost
 *   geometry + dashed outline + base ring, but the `connections` array on
 *   the GhostBuildingHint type was only surfaced as text in the side panel.
 *   For pitch, panitia want to see a literal 3D line drawn from the ghost
 *   over to the existing affected building so the dependency story reads
 *   spatially.
 *
 * Visual:
 *   - LineDashedMaterial with relationship-tinted color:
 *       import     -> codeplex-clio (cool blue, file imports the new module)
 *       reference  -> codeplex-ember (warm orange, file references symbol)
 *       callsite   -> codeplex-aether (violet, file calls the new function)
 *   - Animated dash offset (1 cycle/sec) so the line reads "in flight".
 *   - Fades out as `solidProgress` rises to 1 (transition to solid means
 *     dependency is materialised in source code, line no longer needed).
 *   - Fades out fully when `fadeOut` rises to 1 (Discard).
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 *   Lock 3 (SAFETY-FIRST): visual only; no production code paths touched.
 */

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  type LineSegments,
  type Vector3Tuple,
} from 'three';
import { useBuildingById } from '@/scene/buildings/useCityData';
import type { GhostBuildingHint } from './simulationEvents';

const RELATIONSHIP_COLOR: Record<
  GhostBuildingHint['connections'][number]['relationship'],
  string
> = {
  import: '#74b3d3', // codeplex-clio, cool blue
  reference: '#f5a45c', // codeplex-ember-soft, warm orange
  callsite: '#a78bfa', // codeplex-aether, violet
};

interface GhostConnectionLineProps {
  /** Ghost building source position (anchor point near rooftop). */
  ghostPosition: Vector3Tuple;
  /** Existing target building id; looked up via Iris useBuildingById. */
  targetBuildingId: string;
  relationship: GhostBuildingHint['connections'][number]['relationship'];
  /** Approximate ghost building height (used to anchor line at rooftop). */
  ghostHeight: number;
  /** 0..1: 0 fully ghost connection, 1 fully solid (line fades to invisible). */
  solidProgress: number;
  /** 0..1: discard fade. */
  fadeOut?: number;
}

const DASH_CYCLE_SEC = 1.0;

export function GhostConnectionLine({
  ghostPosition,
  targetBuildingId,
  relationship,
  ghostHeight,
  solidProgress,
  fadeOut = 0,
}: GhostConnectionLineProps) {
  const target = useBuildingById(targetBuildingId);
  const lineRef = useRef<LineSegments>(null);

  // Compute the line geometry: two points (ghost rooftop -> target rooftop)
  // bridged by an arc apex. We use LineSegments with a single segment; an
  // arc apex midpoint gives the line a graceful curve instead of a flat
  // straight beam, reading more like a data conduit.
  const geometry = useMemo(() => {
    if (!target) return null;
    const start: Vector3Tuple = [
      ghostPosition[0],
      ghostPosition[1] + ghostHeight + 1.5,
      ghostPosition[2],
    ];
    const end: Vector3Tuple = [
      target.position[0],
      target.position[1] + target.height + 1.5,
      target.position[2],
    ];
    // Build a quadratic-ish polyline by interpolating between start + end via
    // 32 sub-segments + lifting the midpoint to form an apex.
    const SEG = 32;
    const positions = new Float32Array(SEG * 2 * 3);
    const apexLift = 6;
    for (let i = 0; i < SEG; i++) {
      const t0 = i / SEG;
      const t1 = (i + 1) / SEG;
      const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
      const arc = (t: number) => Math.sin(t * Math.PI) * apexLift;
      const p0: Vector3Tuple = [
        lerp(start[0], end[0], t0),
        lerp(start[1], end[1], t0) + arc(t0),
        lerp(start[2], end[2], t0),
      ];
      const p1: Vector3Tuple = [
        lerp(start[0], end[0], t1),
        lerp(start[1], end[1], t1) + arc(t1),
        lerp(start[2], end[2], t1),
      ];
      positions[i * 6 + 0] = p0[0];
      positions[i * 6 + 1] = p0[1];
      positions[i * 6 + 2] = p0[2];
      positions[i * 6 + 3] = p1[0];
      positions[i * 6 + 4] = p1[1];
      positions[i * 6 + 5] = p1[2];
    }
    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(positions, 3));
    return geo;
  }, [target, ghostPosition, ghostHeight]);

  // Compute line distances for dashed material once geometry is mounted.
  useEffect(() => {
    if (lineRef.current && geometry) {
      lineRef.current.computeLineDistances();
    }
  }, [geometry]);

  // Animate dashed offset + fade opacity as the connection materialises.
  useFrame((state) => {
    if (!lineRef.current) return;
    const t = state.clock.getElapsedTime();
    const ghostRatio = 1 - solidProgress;
    const visibility = 1 - fadeOut;
    const raw = lineRef.current.material;
    const mat = (Array.isArray(raw) ? raw[0] : raw) as unknown as {
      opacity: number;
      dashSize: number;
    } | undefined;
    if (mat) {
      const dashShift = (t % DASH_CYCLE_SEC) / DASH_CYCLE_SEC;
      mat.dashSize = 0.3 + dashShift * 0.2;
      mat.opacity = ghostRatio * visibility * 0.75;
    }
  });

  const color = useMemo(
    () => new Color(RELATIONSHIP_COLOR[relationship]),
    [relationship],
  );

  if (!target || !geometry) return null;

  return (
    <lineSegments ref={lineRef} geometry={geometry}>
      <lineDashedMaterial
        color={color}
        dashSize={0.4}
        gapSize={0.25}
        transparent
        opacity={0.75}
        depthWrite={false}
        linewidth={1}
      />
    </lineSegments>
  );
}

GhostConnectionLine.displayName = 'GhostConnectionLine';
