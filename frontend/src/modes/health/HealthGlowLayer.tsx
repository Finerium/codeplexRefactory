'use client';

/**
 * HealthGlowLayer: in-scene r3f component that renders GlowWindow per
 * affected building. Mounted as a child of `<ChronicleCanvas>` alongside
 * `<BuildingInstances>`.
 *
 * Owner: Asclepius (Wave 2).
 *
 * Subscribe pattern: reads `selectGlowWindows` from the Asclepius store +
 * `useCityData` from Iris to resolve each glow target's building position +
 * height. Iris exposes `useBuildingById(id)` per `iris-to-hera.md` handoff
 * line 36 + 88; we use that lookup so a glow on a building lands at the
 * canonical world position computed by Iris squarified treemap.
 *
 * Edge case (per `nemesis-to-asclepius.md` Edge case bullet 3): a finding
 * referencing a building id that does not exist in the current city (e.g.,
 * the building was filtered out by Iris LOD or the path was renamed) is
 * silently skipped + logged via console.warn so Asclepius does not crash
 * the scene tree.
 *
 * Compliance: Lock 1 (no em dash). Lock 2 (no emoji). Lock 5 (mock data
 * upstream, labeled where it originates).
 */

import { useMemo } from 'react';
import { useAsclepiusStore, selectGlowWindows } from './asclepiusStore';
import { useCityData } from '@/scene/buildings';
import { GlowWindow } from './GlowWindow';

export function HealthGlowLayer() {
  const city = useCityData();
  const glowWindows = useAsclepiusStore(selectGlowWindows);

  // Resolve each glow target to its real-position+height once per render.
  const resolved = useMemo(() => {
    const byId = new Map(city.buildings.map((b) => [b.id, b]));
    const items: {
      buildingId: string;
      position: [number, number, number];
      buildingHeight: number;
      footprint: number;
      severity: typeof glowWindows[number]['severity'];
    }[] = [];
    for (const glow of glowWindows) {
      const building = byId.get(glow.buildingId);
      if (!building) {
        // Per nemesis-to-asclepius.md edge case: log + skip unknown id.
        // eslint-disable-next-line no-console
        console.warn(
          `[asclepius] glow target ${glow.buildingId} not present in current city; skipping`,
        );
        continue;
      }
      // footprint chosen as the smaller of width/depth to keep the halo
      // proportional to the building base shape.
      const footprint = Math.max(2, Math.min(building.width, building.depth) * 0.65);
      items.push({
        buildingId: glow.buildingId,
        position: building.position,
        buildingHeight: building.height,
        footprint,
        severity: glow.severity,
      });
    }
    return items;
  }, [city.buildings, glowWindows]);

  return (
    <group name="health-glow-layer">
      {resolved.map((item) => (
        <GlowWindow
          key={item.buildingId}
          position={item.position}
          buildingHeight={item.buildingHeight}
          severity={item.severity}
          footprint={item.footprint}
        />
      ))}
    </group>
  );
}

HealthGlowLayer.displayName = 'HealthGlowLayer';
