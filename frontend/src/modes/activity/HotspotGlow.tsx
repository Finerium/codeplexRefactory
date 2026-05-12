'use client';

/**
 * HotspotGlow: per-building emissive glow halo encoding hotspot intensity.
 *
 * Owner: Boreas (Wave 2).
 * Decision: `_meta/decision_log/boreas.md` D7.
 *
 * Mount: CHILD of `<ChronicleCanvas>`. Reads ActivityData via useActivityData
 * hook + Iris mockCityData for building position resolution.
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
import {
  useActivityStore,
  selectOwnershipHeatmapActive,
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
  buildingMap: Map<string, BuildingData>;
}

function HotspotGlowSprite({
  buildingId,
  intensity,
  color,
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
  // Halo size grows with intensity (4 to 14 world units diameter).
  const haloSize = 4 + intensity * 10;

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

export function HotspotGlow() {
  const data = useActivityData();
  const ownershipHeatmapActive = useActivityStore(selectOwnershipHeatmapActive);

  const buildingMap = useMemo(buildingsById, []);
  const ownershipById = useMemo(() => {
    const m = new Map<string, string>();
    for (const o of data.ownership) m.set(o.buildingId, o.primaryOwnerLogin);
    return m;
  }, [data.ownership]);

  // Filter to threshold + take top 80 hotspots so worst-case is bounded.
  const visibleHotspots = useMemo(() => {
    return data.hotspots
      .filter((h) => h.intensity > 0.05)
      .slice(0, 80);
  }, [data.hotspots]);

  return (
    <group name="boreas-hotspot-glow">
      {visibleHotspots.map((h) => {
        // Color: ownership color when heatmap active, else default ember.
        let color = DEFAULT_HALO_COLOR;
        if (ownershipHeatmapActive) {
          const ownerLogin = ownershipById.get(h.buildingId);
          if (ownerLogin) {
            // Reuse Iris djb2 + palette via building.ownershipColor lookup.
            const b = buildingMap.get(h.buildingId);
            if (b) color = b.ownershipColor;
          }
        }
        return (
          <HotspotGlowSprite
            key={h.buildingId}
            buildingId={h.buildingId}
            intensity={h.intensity}
            color={color}
            buildingMap={buildingMap}
          />
        );
      })}
    </group>
  );
}
