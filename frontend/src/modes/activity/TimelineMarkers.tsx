'use client';

/**
 * TimelineMarkers: 3D anchored markers per commit/PR/release event.
 *
 * Owner: Boreas (Wave 2).
 *
 * Mount: CHILD of `<ChronicleCanvas>`. Reads ActivityData.timelineMarkers
 * + filters by scrubberPosition cursor (markers within +/- 1 day of cursor
 * highlight stronger).
 *
 * Encoding: small floating dot above building, color-coded by event type:
 *   - commit:    soft white #e7eaf3
 *   - pr_merged: green #6ba897 (Hermes palette, sea foam)
 *   - release:   ember orange #ff9966 (warm key)
 *
 * Marker visibility within scrubber window: all markers visible at all times
 * (mock Wave 2 has ~30 markers); markers WITHIN +/- 1 day of cursor are
 * highlighted (bigger + opaque), other markers dim (smaller + low opacity).
 *
 * Click marker = (Wave 3 Persephone wires expand panel). Wave 2 emits to
 * console as demo aid.
 *
 * Compliance:
 *   Lock 1: clean. Lock 2: clean.
 */

import { useMemo, useCallback } from 'react';
import { mockCityData } from '@/scene/buildings';
import { useActivityData } from './useActivityData';
import { ACTIVITY_ANCHORED_NOW_MS } from './mockActivityData';
import {
  useActivityStore,
  selectScrubberPosition,
  selectRangeDays,
} from './store';
import type { BuildingData } from '@/scene/buildings';
import type { TimelineMarker } from './types';

const MARKER_COLORS = {
  commit: '#e7eaf3',
  pr_merged: '#6ba897',
  release: '#ff9966',
} as const;

interface MarkerSpriteProps {
  marker: TimelineMarker;
  building: BuildingData;
  highlight: boolean;
  onClick: (marker: TimelineMarker) => void;
}

function MarkerSprite({ marker, building, highlight, onClick }: MarkerSpriteProps) {
  const y = building.position[1] + building.height + 7;
  const size = highlight ? 1.6 : 0.9;
  const opacity = highlight ? 0.95 : 0.4;
  const color = MARKER_COLORS[marker.eventType];

  return (
    <mesh
      position={[building.position[0], y, building.position[2]]}
      onClick={(e) => {
        e.stopPropagation();
        onClick(marker);
      }}
      name={`marker-${marker.id}`}
    >
      <sphereGeometry args={[size, 12, 12]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
}

export function TimelineMarkers() {
  const data = useActivityData();
  const scrubberPosition = useActivityStore(selectScrubberPosition);
  const rangeDays = useActivityStore(selectRangeDays);

  const buildingMap = useMemo(() => {
    const m = new Map<string, BuildingData>();
    for (const b of mockCityData.buildings) m.set(b.id, b);
    return m;
  }, []);

  // Cursor timestamp in ms within current range.
  // Scrubber 0 = oldest in range, 1 = newest (now).
  // Use ACTIVITY_ANCHORED_NOW_MS to align with mock data nowMs.
  const cursorTimestampMs = useMemo(() => {
    const nowMs = ACTIVITY_ANCHORED_NOW_MS;
    const rangeMs = rangeDays * 24 * 60 * 60 * 1000;
    const startMs = nowMs - rangeMs;
    return startMs + scrubberPosition * rangeMs;
  }, [scrubberPosition, rangeDays]);

  // Highlight threshold: +/- 1 day from cursor.
  const dayMs = 24 * 60 * 60 * 1000;

  const handleClick = useCallback((marker: TimelineMarker) => {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log(`[boreas activity] marker click`, marker);
    }
  }, []);

  return (
    <group name="boreas-timeline-markers">
      {data.timelineMarkers.map((marker) => {
        const building = buildingMap.get(marker.buildingId);
        if (!building) return null;
        const highlight = Math.abs(marker.timestamp - cursorTimestampMs) < dayMs;
        return (
          <MarkerSprite
            key={marker.id}
            marker={marker}
            building={building}
            highlight={highlight}
            onClick={handleClick}
          />
        );
      })}
    </group>
  );
}
