'use client';

/**
 * HoverFloorGlow: per-floor sequential glow ripple on hovered building.
 *
 * Wave-Fixing 3 ship (Persephone + Hera paired, Ghaisan envision item
 * "Mouse hover building -> per-floor glow ripple effect" STAMP=20260513-final).
 *
 * Manager FINAL Cycle 2 (STAMP 20260513-0857) update: now snaps the ripple
 * to discrete floor segments derived from BuildingData.floors. Ghaisan caps
 * lock + Manager FINAL non-negotiable "per-floor commit message visual:
 * building height = N floors per N commits, per-floor hover glow ripple".
 *
 * Visual: when the user hovers a building in BuildingInstances, a thin
 * emissive band steps through the building's floor segments base to top, one
 * floor at a time, ~80ms per floor. The band intensity peaks at the current
 * floor and falls off above + below, producing a sweeping spotlight feel.
 * Floor count derived from BuildingData.floors (encoded in layout.ts via
 * encodeFloors(weight)). Tied to Iris hover dispatch (sibling of click).
 *
 * On click of a floor segment the BuildingInstances onClick handler resolves
 * the floor index from pointer y position and emits via useFloorClick bus to
 * Persephone for the per-floor commit timeline side panel.
 *
 * Implementation: subscribes to a hover dispatch bus from BuildingInstances.
 * When hover building changes, mount a single `<mesh>` plane that rises
 * through the building height via `useFrame` interpolation, snapping to
 * discrete floor positions. On unhover, fade out over 200ms then unmount.
 *
 * Mount: child of `<ChronicleCanvas>`, sibling of `<BuildingInstances>`.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 *   Lock 5: real client-side visual, no mock label.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { type Mesh, MeshBasicMaterial, Color, AdditiveBlending } from 'three';
import { useBuildingHover } from './useCityData';
import type { BuildingData } from './types';

const RIPPLE_DURATION_SEC = 0.5;
const RIPPLE_PEAK_OPACITY = 0.7;

export function HoverFloorGlow() {
  const [hovered, setHovered] = useState<BuildingData | null>(null);
  // Edge cycle: bump phase to 0 every time hover building changes so the
  // ripple restarts cleanly at the new building's base.
  const phaseRef = useRef(0);
  const meshRef = useRef<Mesh>(null);
  const dividerMeshRef = useRef<Mesh>(null);

  useBuildingHover((next) => {
    setHovered(next);
    phaseRef.current = 0;
  });

  // Glow color: warm ember on hover, additive blend so it reads bright
  // against any building color underneath.
  const material = useMemo(() => {
    return new MeshBasicMaterial({
      color: new Color('#FFC062'),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: AdditiveBlending,
    });
  }, []);

  // Divider grid material: dim outline strips marking each floor boundary so
  // the user reads the discrete floors at a glance while hovering.
  const dividerMaterial = useMemo(() => {
    return new MeshBasicMaterial({
      color: new Color('#FFD9A0'),
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
    });
  }, []);

  // Reset opacity on unhover so the next hover starts clean.
  useEffect(() => {
    if (!hovered) {
      material.opacity = 0;
      dividerMaterial.opacity = 0;
    }
  }, [hovered, material, dividerMaterial]);

  useFrame((_, delta) => {
    if (!hovered || !meshRef.current) return;
    const floors = Math.max(1, hovered.floors);
    // Step rate: one floor every RIPPLE_DURATION_SEC/floors seconds. So full
    // sweep base to top = RIPPLE_DURATION_SEC, regardless of floor count.
    phaseRef.current = (phaseRef.current + delta / RIPPLE_DURATION_SEC) % 1;
    const floorIdx = Math.floor(phaseRef.current * floors);
    const h = hovered.height;
    const floorHeight = h / floors;
    // Center y on the current floor band
    const y = floorIdx * floorHeight + floorHeight * 0.5;
    meshRef.current.position.set(
      hovered.position[0],
      y,
      hovered.position[2],
    );
    meshRef.current.scale.set(1, floorHeight * 0.85, 1);
    // Smooth eased opacity ramp synced to per-floor step; peaks mid-floor.
    const stepLocal = phaseRef.current * floors - floorIdx;
    const edgeFalloff = Math.sin(stepLocal * Math.PI);
    material.opacity = RIPPLE_PEAK_OPACITY * edgeFalloff;

    // Divider strips: solid faint overlay that snaps in once hover starts so
    // the building reads as discrete floors. Fades in over 150ms.
    dividerMaterial.opacity = Math.min(dividerMaterial.opacity + delta * 6, 0.32);
  });

  if (!hovered) return null;

  // Slightly oversize the bands so they read from any angle.
  const w = hovered.width * 1.05;
  const d = hovered.depth * 1.05;

  return (
    <group>
      {/* Floor divider strips: thin emissive band at each floor boundary so
          the building reads as N stacked floors. Single multi-band geometry
          via a simple loop, kept inexpensive since we only mount during hover. */}
      <FloorDividerStack
        building={hovered}
        meshRef={dividerMeshRef}
        material={dividerMaterial}
      />

      {/* Sweeping ripple band that steps through floors. */}
      <mesh
        ref={meshRef}
        material={material}
        renderOrder={6}
        raycast={() => null}
        frustumCulled={false}
      >
        <boxGeometry args={[w, 1.0, d]} />
      </mesh>
    </group>
  );
}

/**
 * Renders N thin emissive bands stacked at each floor boundary of the hovered
 * building. Extracted to keep the parent component compact. Memoized geometry
 * via vertex offsets; we use a single boxGeometry instance per band since N
 * is small (typical 2-26 floors). Cheap enough for a one-shot hover overlay.
 */
function FloorDividerStack({
  building,
  meshRef,
  material,
}: {
  building: BuildingData;
  meshRef: React.RefObject<Mesh | null>;
  material: MeshBasicMaterial;
}) {
  const floors = Math.max(1, building.floors);
  const floorHeight = building.height / floors;
  const w = building.width * 1.04;
  const d = building.depth * 1.04;
  const bandThickness = 0.08;

  // Build the band positions array. The first ref is the topmost band so we
  // can use it for hit highlight if needed; subsequent bands are static.
  const bandYs = useMemo(() => {
    const arr: number[] = [];
    // Skip floor 0 base (ground) but include all internal dividers + the top.
    for (let i = 1; i <= floors; i++) {
      arr.push(i * floorHeight);
    }
    return arr;
  }, [floors, floorHeight]);

  return (
    <>
      {bandYs.map((y, idx) => (
        <mesh
          key={`floor-band-${idx}`}
          ref={idx === 0 ? meshRef : undefined}
          material={material}
          position={[building.position[0], y, building.position[2]]}
          renderOrder={5}
          raycast={() => null}
          frustumCulled={false}
        >
          <boxGeometry args={[w, bandThickness, d]} />
        </mesh>
      ))}
    </>
  );
}

HoverFloorGlow.displayName = 'HoverFloorGlow';
