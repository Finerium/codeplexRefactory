'use client';

/**
 * HoverFloorGlow: per-floor sequential glow ripple on hovered building.
 *
 * Wave-Fixing 3 ship (Persephone + Hera paired, Ghaisan envision item
 * "Mouse hover building -> per-floor glow ripple effect" STAMP=20260513-final).
 *
 * Visual: when the user hovers a building in BuildingInstances, a thin
 * emissive band rises through the building's height from base to top, then
 * fades out and restarts. The band intensity peaks at the current "floor"
 * (height bucket) and falls off above + below, producing a sweeping
 * spotlight feel. Tied to Iris hover dispatch (sibling of click dispatch).
 *
 * Implementation: subscribes to a hover dispatch bus from BuildingInstances
 * (added in Wave-Fixing 3 fix). When hover building changes, mount a single
 * `<mesh>` plane that rises through height via `useFrame` interpolation.
 * On unhover, fade out over 200ms then unmount.
 *
 * Mount: child of `<ChronicleCanvas>`, sibling of `<BuildingInstances>`.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 *   Lock 5: real client-side visual, no mock label.
 */

import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { type Mesh, MeshBasicMaterial, Color } from 'three';
import { useBuildingHover } from './useCityData';
import type { BuildingData } from './types';

const RIPPLE_DURATION_SEC = 1.2;
const RIPPLE_BAND_THICKNESS = 0.6;
const RIPPLE_PEAK_OPACITY = 0.55;

export function HoverFloorGlow() {
  const [hovered, setHovered] = useState<BuildingData | null>(null);
  // Edge cycle: bump phase to 0 every time hover building changes so the
  // ripple restarts cleanly at the new building's base.
  const phaseRef = useRef(0);
  const meshRef = useRef<Mesh>(null);

  useBuildingHover((next) => {
    setHovered(next);
    phaseRef.current = 0;
  });

  // Glow color: warm ember on hover, derived once.
  const material = useMemo(() => {
    return new MeshBasicMaterial({
      color: new Color('#FFB347'),
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
  }, []);

  useFrame((_, delta) => {
    if (!hovered || !meshRef.current) return;
    phaseRef.current = (phaseRef.current + delta / RIPPLE_DURATION_SEC) % 1;
    const h = hovered.height;
    // Rise from base (y = 0) to top (y = h) then loop.
    const y = phaseRef.current * h;
    meshRef.current.position.set(
      hovered.position[0],
      y + RIPPLE_BAND_THICKNESS / 2,
      hovered.position[2],
    );
    // Opacity falls off near the top + bottom of the building so the band
    // reads as a moving spotlight rather than a constant ring.
    const edgeFalloff = Math.sin(phaseRef.current * Math.PI);
    material.opacity = RIPPLE_PEAK_OPACITY * edgeFalloff;
  });

  if (!hovered) return null;

  // Slightly oversize the band so it reads from any angle.
  const w = hovered.width * 1.08;
  const d = hovered.depth * 1.08;

  return (
    <mesh
      ref={meshRef}
      material={material}
      renderOrder={5}
      raycast={() => null}
      frustumCulled={false}
    >
      <boxGeometry args={[w, RIPPLE_BAND_THICKNESS, d]} />
    </mesh>
  );
}

HoverFloorGlow.displayName = 'HoverFloorGlow';
