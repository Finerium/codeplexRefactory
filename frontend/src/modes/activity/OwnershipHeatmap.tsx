'use client';

/**
 * OwnershipHeatmap: per-district floor decal recolor encoding CODEOWNERS.
 *
 * Owner: Boreas (Wave 2).
 * Decision: `_meta/decision_log/boreas.md` D8.
 * Uncertainty: `_meta/uncertainty/boreas-cycle1-20260512-2350.md` U3.
 *
 * Mount: CHILD of `<ChronicleCanvas>`. Reads ActivityData ownership +
 * mockCityData.districts for bounds.
 *
 * Encoding: when active, render a translucent floor plane per district with
 * color = dominant district owner color (from Iris `deriveOwnerColor`).
 * Decal sits at y = -0.05 just below the ground plane so it does not z-fight
 * with buildings.
 *
 * Toggle: store.ownershipHeatmapActive. When false, this component renders
 * null (no decals).
 *
 * Compliance:
 *   Lock 1: clean. Lock 2: clean. Lock 5: data labeled MOCK in mockActivityData.ts.
 */

import { useMemo } from 'react';
import { DoubleSide } from 'three';
import { mockCityData, deriveOwnerColor } from '@/scene/buildings';
import {
  useActivityStore,
  selectOwnershipHeatmapActive,
} from './store';

export function OwnershipHeatmap() {
  const active = useActivityStore(selectOwnershipHeatmapActive);

  // Compute district floor decals.
  const decals = useMemo(() => {
    return mockCityData.districts.map((district) => {
      const [minX, minZ, maxX, maxZ] = district.bounds;
      const width = Math.max(0.1, maxX - minX);
      const depth = Math.max(0.1, maxZ - minZ);
      const centerX = (minX + maxX) / 2;
      const centerZ = (minZ + maxZ) / 2;
      const color = deriveOwnerColor(district.owner);
      return {
        id: district.id,
        center: [centerX, -0.05, centerZ] as [number, number, number],
        size: [width, depth] as [number, number],
        color,
      };
    });
  }, []);

  if (!active) return null;

  return (
    <group name="boreas-ownership-heatmap">
      {decals.map((decal) => (
        <mesh
          key={decal.id}
          position={decal.center}
          rotation={[-Math.PI / 2, 0, 0]}
          name={`heatmap-${decal.id}`}
          // Render before opaque buildings so it sits underneath.
          renderOrder={-1}
        >
          <planeGeometry args={[decal.size[0], decal.size[1]]} />
          <meshBasicMaterial
            color={decal.color}
            transparent
            opacity={0.32}
            side={DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
