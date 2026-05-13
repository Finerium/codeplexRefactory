'use client';

/**
 * RoadGrid: ground plane plus emissive yellow connector lines between buildings.
 *
 * Owner: Daedalus (Manager FINAL Cycle 2 STAMP 20260513-0857 visibility bump).
 *
 * Two layers stacked:
 *   1. Dark ground plane (900x900 unit, widened from 800 to envelope the new
 *      380 unit city canvas plus a generous skirt) catches shadow from the
 *      warm key directional light. Roughness high, low metalness for matte
 *      asphalt.
 *   2. Visible emissive road segments between deterministic pairs of
 *      building centroids. The edges come from `roadEdges.ts` so the same
 *      list also drives `FlyingCars.tsx` (single source of truth).
 *
 * Manager FINAL Cycle 2 visibility bump:
 *   - ROAD_THICKNESS 0.6 to 1.2 unit. The minimum spec demanded 0.2 unit so
 *     the road would resolve from the default camera distance, but 0.6 was
 *     still hard to spot beside the widened districts (5.2 unit gap). At
 *     1.2 thickness the road reads as a clear corridor without occluding
 *     adjacent buildings.
 *   - emissiveIntensity 1.4 to 2.8 so Bloom picks the segment edges into a
 *     halo even when the camera sits at the [0, 130, 220] city overview.
 *   - ROAD_HEIGHT 0.08 to 0.18 to give the geometry physical thickness; the
 *     Bloom pass treats the lit top face as the light source.
 *   - ROAD_Y_OFFSET 0.02 to 0.05 to prevent z-fighting with the ground plane
 *     at the increased emissive intensity.
 *
 * Visual reference: `_meta/qa_screenshots/ReferensiWindows.png` shows yellow
 * glowing streets snaking between building clusters. The bumped params now
 * mirror that look at the default city camera framing.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 *   Lock 5 ([MOCK Wave 1, real Wave 3 Hades parser]): labeled in roadEdges.ts.
 */

import { useMemo, useRef, useEffect } from 'react';
import {
  Object3D,
  InstancedMesh as ThreeInstancedMesh,
  BoxGeometry,
  MeshStandardMaterial,
} from 'three';
import { useCityData } from './buildings';
import { deriveRoadEdges } from './roadEdges';

const ROAD_THICKNESS = 1.2;
const ROAD_HEIGHT = 0.18;
const ROAD_Y_OFFSET = 0.05;

export function RoadGrid() {
  const cityData = useCityData();
  const edges = useMemo(
    () => deriveRoadEdges(cityData.buildings),
    [cityData.buildings],
  );

  const geometry = useMemo(
    () => new BoxGeometry(1, ROAD_HEIGHT, ROAD_THICKNESS),
    [],
  );
  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color: '#f5c84b',
        emissive: '#ffd860',
        emissiveIntensity: 2.8,
        roughness: 0.32,
        metalness: 0.22,
        toneMapped: true,
      }),
    [],
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  const meshRef = useRef<ThreeInstancedMesh | null>(null);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new Object3D();
    edges.forEach((edge, i) => {
      const cx = (edge.fromX + edge.toX) / 2;
      const cz = (edge.fromZ + edge.toZ) / 2;
      dummy.position.set(cx, ROAD_Y_OFFSET, cz);
      dummy.scale.set(edge.length, 1, 1);
      dummy.rotation.set(0, edge.yaw, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.count = edges.length;
  }, [edges]);

  return (
    <>
      {/* Dark base plane, widened envelope for the 380x380 city canvas. */}
      <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, -0.02, 0]}>
        <planeGeometry args={[900, 900]} />
        <meshStandardMaterial
          color="#0a0d14"
          roughness={0.85}
          metalness={0.15}
        />
      </mesh>

      {/* Deterministic glowing yellow connectors keyed on building id. */}
      {edges.length > 0 ? (
        <instancedMesh
          ref={meshRef}
          args={[geometry, material, Math.max(edges.length, 1)]}
          castShadow={false}
          receiveShadow={false}
        />
      ) : null}
    </>
  );
}
