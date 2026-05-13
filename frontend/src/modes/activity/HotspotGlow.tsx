'use client';

/**
 * HotspotGlow: per-building emissive glow halo encoding hotspot intensity.
 *
 * Owner: Boreas (Wave 2 + Wave-Fixing #3 Manager FINAL).
 * Decision: `_meta/decision_log/boreas.md` D7 + D16.
 *
 * Mount: CHILD of `<ChronicleCanvas>`. Reads ActivityData via useActivityData
 * hook + Iris mockCityData for building position resolution.
 *
 * Wave-Fixing #3 Manager FINAL re-architecture:
 *
 *   The HotspotGlow now drives the "city visual scrub commit-by-commit"
 *   effect that Ghaisan QA 05:51 WIB envisioned. Previously the halo
 *   intensity was a static aggregate over the entire window (all
 *   buildings glow at fixed intensity regardless of cursor position).
 *
 *   Now the cumulative-up-to-cursor commit count drives per-building halo
 *   intensity, so dragging the scrubber sweeps the city through history:
 *     - Cursor at Now (left, position=0): full window aggregate (all
 *       commits visible) -> brightest state.
 *     - Cursor at Nd ago (right, position=1): zero commits accumulated
 *       -> cold state, halos fade.
 *     - In between: each building's halo scales with commits that
 *       happened BETWEEN cursor and Now (we replay forward from cursor).
 *
 *   ADDITIONAL "burst" pulse for the building tied to the nearest marker
 *   at cursor: that building's halo size scales ~1.5x with ember tint
 *   regardless of ownership heatmap toggle. Reads as "this building
 *   committed at this timestamp".
 *
 * Encoding:
 *   - Continuous intensity scale 0..1 maps to halo size + opacity.
 *   - Threshold 0.05: below this, building considered cold, no halo rendered.
 *   - Halo color: when ownershipHeatmapActive=true, uses building owner color;
 *     otherwise uses ember orange `#ff9966` matching warm key light.
 *   - Halo position: building.position[x], building.position[y] + height + 2,
 *     building.position[z] (above the building roof for clear silhouette).
 *
 * Implementation: native Three.js `<sprite>` primitive with additive blending
 * (cheap, no shadow pass). Per Phase B Topic D anchor: raw primitive over
 * Drei wrapper at building scale.
 *
 * Compliance:
 *   Lock 1: clean. Lock 2: clean. Lock 5: data labeled MOCK in mockActivityData.ts.
 */

import { useMemo, useRef, useEffect } from 'react';
import {
  AdditiveBlending,
  CanvasTexture,
  Sprite,
  SpriteMaterial,
  Color,
} from 'three';
import { mockCityData } from '@/scene/buildings';
import { useActivityData } from './useActivityData';
import { ACTIVITY_ANCHORED_NOW_MS } from './mockActivityData';
import {
  useActivityStore,
  selectOwnershipHeatmapActive,
  selectScrubberPosition,
  selectRangeDays,
} from './store';
import type { BuildingData } from '@/scene/buildings';

/**
 * Generate a radial gradient circular texture for the halo sprite.
 * Cached per module so we build once per session.
 */
function buildHaloTexture(): CanvasTexture | null {
  const size = 128;
  // SSR-safe: only construct canvas on client. Hook lives inside a client
  // component (HotspotGlow is `use client`), but document may be undefined
  // during SSR-static analysis. Return null in that case + skip the sprite
  // at render time.
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2
    );
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.45, 'rgba(255,255,255,0.4)');
    gradient.addColorStop(0.8, 'rgba(255,255,255,0.08)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  return new CanvasTexture(canvas);
}

let cachedHaloTexture: CanvasTexture | null = null;
function getHaloTexture(): CanvasTexture | null {
  if (!cachedHaloTexture) {
    cachedHaloTexture = buildHaloTexture();
  }
  return cachedHaloTexture;
}

/** Color used when ownership heatmap is OFF (matches Daedalus warm key). */
const DEFAULT_HALO_COLOR = '#ff9966';
const BURST_HALO_COLOR = '#ffd28a';

/**
 * Lookup building by id in mockCityData. Wave 3 swap: useCityData hook
 * surface (Iris) consumed instead for live data.
 */
function buildingsById(): Map<string, BuildingData> {
  const map = new Map<string, BuildingData>();
  for (const b of mockCityData.buildings) {
    map.set(b.id, b);
  }
  return map;
}

interface HotspotGlowSpriteProps {
  buildingId: string;
  intensity: number;
  color: string;
  sizeBoost: number;
  buildingMap: Map<string, BuildingData>;
}

function HotspotGlowSprite({
  buildingId,
  intensity,
  color,
  sizeBoost,
  buildingMap,
}: HotspotGlowSpriteProps) {
  const spriteRef = useRef<Sprite>(null);

  // Build material once. Color + opacity update via useEffect when intensity
  // or color changes (avoid creating new SpriteMaterial per render).
  const material = useMemo(() => {
    const haloTexture = getHaloTexture();
    if (!haloTexture) return null;
    const mat = new SpriteMaterial({
      map: haloTexture,
      color: new Color(color),
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      opacity: Math.min(1, intensity),
    });
    return mat;
  }, [color, intensity]);

  // Cleanup material on unmount.
  useEffect(() => {
    return () => {
      material?.dispose();
    };
  }, [material]);

  const building = buildingMap.get(buildingId);
  if (!building || !material) return null;

  // Halo above roof.
  const haloY = building.position[1] + building.height + 2;
  // Halo size grows with intensity (4 to 14 world units diameter) plus
  // optional burst boost (1.0 = no boost, 1.5 = burst).
  const haloSize = (4 + intensity * 10) * sizeBoost;

  return (
    <sprite
      ref={spriteRef}
      position={[building.position[0], haloY, building.position[2]]}
      scale={[haloSize, haloSize, 1]}
      material={material}
      renderOrder={1}
    />
  );
}

/**
 * Aggregate commit counts per building over a time slice from the cursor
 * timestamp forward up to "now" (endMs).
 *
 * Wave-Fixing #3 envelope: this is what drives the visible city scrub.
 * As cursor approaches Now, the slice shrinks -> fewer commits ->
 * dimmer halos. As cursor moves to Nd ago, slice = entire window ->
 * brightest aggregate state.
 *
 * Returns a Map<buildingId, {commitCount, intensity 0..1}> where
 * intensity is normalized against max in slice.
 */
function computeSliceIntensities(
  timeline: Array<{ date: string; buildingCommits: Record<string, number> }>,
  cursorMs: number,
  endMs: number
): Map<string, { commitCount: number; intensity: number }> {
  const totals = new Map<string, number>();
  const dayMs = 24 * 60 * 60 * 1000;

  for (const day of timeline) {
    // Parse day.date "YYYY-MM-DD" to Unix ms at midnight UTC.
    const parts = day.date.split('-').map((p) => parseInt(p, 10));
    if (parts.length !== 3 || parts.some(isNaN)) continue;
    const dayMidnightMs = Date.UTC(parts[0], parts[1] - 1, parts[2]);
    const dayEndMs = dayMidnightMs + dayMs;
    // Slice predicate: day fully or partially within [cursorMs, endMs].
    // We require dayEndMs > cursorMs AND dayMidnightMs <= endMs.
    if (dayEndMs <= cursorMs) continue;
    if (dayMidnightMs > endMs) continue;
    for (const [id, count] of Object.entries(day.buildingCommits)) {
      totals.set(id, (totals.get(id) ?? 0) + count);
    }
  }

  let max = 0;
  for (const c of totals.values()) {
    if (c > max) max = c;
  }
  if (max === 0) {
    return new Map();
  }
  const result = new Map<string, { commitCount: number; intensity: number }>();
  for (const [id, c] of totals.entries()) {
    result.set(id, { commitCount: c, intensity: c / max });
  }
  return result;
}

export function HotspotGlow() {
  const data = useActivityData();
  const ownershipHeatmapActive = useActivityStore(selectOwnershipHeatmapActive);
  const scrubberPosition = useActivityStore(selectScrubberPosition);
  const rangeDays = useActivityStore(selectRangeDays);

  const buildingMap = useMemo(buildingsById, []);
  const ownershipById = useMemo(() => {
    const m = new Map<string, string>();
    for (const o of data.ownership) m.set(o.buildingId, o.primaryOwnerLogin);
    return m;
  }, [data.ownership]);

  // Wave-Fixing #3 + Cycle 3 hotfix 2026-05-13 10:09 WIB Manager FINAL:
  // compute per-building intensity over the slice from cursor forward to
  // Now. As cursor sweeps, the slice changes -> halos scrub commit-by-commit.
  // Cycle 3 hotfix flipped convention: scrubberPosition 0 = startMs (past),
  // scrubberPosition 1 = endMs (Now). cursorMs = startMs + position * range.
  const sliceIntensities = useMemo(() => {
    const nowMs = ACTIVITY_ANCHORED_NOW_MS;
    const rangeMs = rangeDays * 24 * 60 * 60 * 1000;
    const startMs = nowMs - rangeMs;
    const cursorMs = startMs + scrubberPosition * rangeMs;
    return computeSliceIntensities(data.timeline, cursorMs, nowMs);
  }, [data.timeline, scrubberPosition, rangeDays]);

  // Identify the building tied to the nearest marker at cursor for the
  // burst pulse. We use the marker timestamp +/- 1 day tolerance.
  // Cycle 3 hotfix: same convention flip as sliceIntensities above.
  const burstBuildingId = useMemo<string | null>(() => {
    if (data.timelineMarkers.length === 0) return null;
    const nowMs = ACTIVITY_ANCHORED_NOW_MS;
    const rangeMs = rangeDays * 24 * 60 * 60 * 1000;
    const startMs = nowMs - rangeMs;
    const cursorMs = startMs + scrubberPosition * rangeMs;
    const dayMs = 24 * 60 * 60 * 1000;
    let best: { buildingId: string; delta: number } | null = null;
    for (const m of data.timelineMarkers) {
      const delta = Math.abs(m.timestamp - cursorMs);
      if (delta > dayMs) continue;
      if (best === null || delta < best.delta) {
        best = { buildingId: m.buildingId, delta };
      }
    }
    return best?.buildingId ?? null;
  }, [data.timelineMarkers, scrubberPosition, rangeDays]);

  // Compose the visible hotspot list. Two strategies merged:
  //   1. SLICE buildings: every building in sliceIntensities renders with
  //      the slice intensity (drives the scrub effect).
  //   2. BURST building: the burst building gets a 1.5x size boost +
  //      ember tint regardless of heatmap toggle.
  // Top-bound 80 to keep frame budget healthy.
  const visibleHotspots = useMemo(() => {
    const arr: Array<{
      buildingId: string;
      intensity: number;
      burst: boolean;
    }> = [];
    for (const [buildingId, { intensity }] of sliceIntensities.entries()) {
      if (intensity <= 0.05) continue;
      arr.push({
        buildingId,
        intensity,
        burst: buildingId === burstBuildingId,
      });
    }
    // Ensure burst building is included even if its slice intensity is 0
    // (e.g., cursor near a marker but the slice excluded the day).
    if (burstBuildingId && !arr.some((a) => a.buildingId === burstBuildingId)) {
      arr.push({ buildingId: burstBuildingId, intensity: 0.5, burst: true });
    }
    // Sort descending by intensity, take top 80.
    arr.sort((a, b) => b.intensity - a.intensity);
    return arr.slice(0, 80);
  }, [sliceIntensities, burstBuildingId]);

  return (
    <group name="boreas-hotspot-glow">
      {visibleHotspots.map((h) => {
        // Color: ember burst > ownership > default ember.
        let color = DEFAULT_HALO_COLOR;
        if (h.burst) {
          color = BURST_HALO_COLOR;
        } else if (ownershipHeatmapActive) {
          const ownerLogin = ownershipById.get(h.buildingId);
          if (ownerLogin) {
            const b = buildingMap.get(h.buildingId);
            if (b) color = b.ownershipColor;
          }
        }
        const sizeBoost = h.burst ? 1.6 : 1.0;
        // Burst building gets boosted intensity so the halo stays bright
        // even if slice intensity is low.
        const intensity = h.burst ? Math.max(h.intensity, 0.85) : h.intensity;
        return (
          <HotspotGlowSprite
            key={h.buildingId}
            buildingId={h.buildingId}
            intensity={intensity}
            color={color}
            sizeBoost={sizeBoost}
            buildingMap={buildingMap}
          />
        );
      })}
    </group>
  );
}
