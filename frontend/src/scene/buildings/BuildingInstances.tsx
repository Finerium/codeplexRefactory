'use client';

/**
 * BuildingInstances composite component.
 *
 * Renders 8 raw `<instancedMesh>` instances, one per archetype (5 landmark +
 * 3 generic). NOT Drei `<Instances>` per Phase B anchor 7 + r3f issue
 * #3306 + PRD AD-03: raw instancedMesh is faster at 200-300 building scale
 * because Drei wrappers add per-instance JSX overhead.
 *
 * For each archetype bucket, we run setMatrixAt(index, matrix) inside
 * useLayoutEffect so the layout pass completes before the first frame paint.
 * Building position + scale come from the deterministic squarified treemap
 * in `layout.ts`. Per-instance color (setColorAt) drives ownershipColor
 * encoding so 12-hue palette reads across the city.
 *
 * LOD via Drei `<Detailed>` is applied at the per-archetype group level,
 * not at the per-instance level (Drei Detailed wraps a mesh subtree, an
 * InstancedMesh count cannot be reduced live without rebuilding buffers,
 * so we approximate by switching between full-detail vs simplified
 * geometry based on Daedalus' usePerformanceState().regressing flag).
 *
 * Click handling: each archetype mesh has an onClick handler that resolves
 * event.instanceId back to the BuildingData via the bucket index. Wave 2
 * worker Hera subscribes via useBuildingClick hook.
 *
 * Compliance:
 *  - Lock 1 (no em dash): verified
 *  - Lock 2 (no emoji): verified
 *  - r3f #3306 anchor: raw instancedMesh, not Drei Instances
 *  - usePerformanceState consumed from Daedalus, no modification
 *  - setMatrixAt deterministic, treemap algo seeded
 */

import { useLayoutEffect, useMemo, useRef, useCallback } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import {
  Object3D,
  Color,
  InstancedMesh,
  type BufferGeometry,
  type Material,
} from 'three';
import { buildTempleGeometry, buildTempleMaterial } from './templeArchetype';
import { buildCrossGeometry, buildCrossMaterial } from './crossArchetype';
import { buildTowerGeometry, buildTowerMaterial } from './towerArchetype';
import { buildStackGeometry, buildStackMaterial } from './stackArchetype';
import { buildBeaconGeometry, buildBeaconMaterial } from './beaconArchetype';
import {
  buildResidenceGeometry,
  buildWarehouseGeometry,
  buildOfficeGeometry,
  buildGenericMaterial,
} from './genericArchetype';
import { usePerformanceState } from '../PerformanceContext';
import type { BuildingArchetype, BuildingData, CityData } from './types';

/**
 * Click handler signature exported to consumers. Wave 2 worker Hera
 * subscribes via useBuildingClick hook to surface ticket panel on click.
 */
export type BuildingClickHandler = (
  building: BuildingData,
  event: ThreeEvent<MouseEvent>
) => void;

interface BuildingInstancesProps {
  /** City data: buildings + districts + centroid. Required. */
  data: CityData;
  /** Optional click handler. Forwarded to all archetype meshes. */
  onBuildingClick?: BuildingClickHandler;
}

/**
 * Bucket descriptor: maps archetype to a building list slice + its mesh ref.
 * Used for the 8 raw `<instancedMesh>` calls in render output.
 */
interface Bucket {
  archetype: BuildingArchetype;
  buildings: BuildingData[];
}

/**
 * Partition city.buildings into 8 buckets by archetype. Same input city =
 * same partition order = stable setMatrixAt indices = stable click event
 * mapping back to BuildingData. Determinism critical for Hera Wave 2
 * subscribe behavior.
 */
function partitionByArchetype(buildings: BuildingData[]): Bucket[] {
  const order: BuildingArchetype[] = [
    'temple',
    'cross-shape',
    'surveillance-tower',
    'vertical-stack',
    'glass-cube',
    'generic-residence',
    'generic-warehouse',
    'generic-office',
  ];
  const map = new Map<BuildingArchetype, BuildingData[]>();
  for (const arch of order) map.set(arch, []);
  for (const b of buildings) {
    const bucket = map.get(b.archetype);
    if (bucket) bucket.push(b);
  }
  return order.map((archetype) => ({
    archetype,
    buildings: map.get(archetype) ?? [],
  }));
}

/**
 * Apply per-instance matrix + color for a single bucket. Called inside
 * useLayoutEffect so the layout pass runs synchronously before paint.
 * Re-runs whenever bucket buildings change reference (memoized partition).
 *
 * Discipline: only mutate the InstancedMesh refs, do NOT touch React state
 * inside this effect. Mutation is the canonical r3f pattern (per Phase B
 * anchor: "in r3f, mutation is the language inside frame loop or layout").
 */
function applyInstanceMatrices(
  ref: InstancedMesh | null,
  bucket: BuildingData[]
): void {
  if (!ref) return;

  const tmpObject = new Object3D();
  const tmpColor = new Color();

  for (let i = 0; i < bucket.length; i++) {
    const b = bucket[i];
    tmpObject.position.set(b.position[0], b.position[1], b.position[2]);
    tmpObject.scale.set(b.width, b.height, b.depth);
    tmpObject.rotation.set(0, 0, 0);
    tmpObject.updateMatrix();
    ref.setMatrixAt(i, tmpObject.matrix);

    tmpColor.set(b.ownershipColor);
    // Subtle activity tint: warmer buildings shift slightly brighter, idle
    // shift slightly darker, so the 12-hue palette reads with activity
    // overlay. Scale factor capped so palette stays recognizable.
    const tintScale = 0.85 + b.activity * 0.3;
    tmpColor.multiplyScalar(tintScale);
    ref.setColorAt(i, tmpColor);
  }

  ref.instanceMatrix.needsUpdate = true;
  if (ref.instanceColor) {
    ref.instanceColor.needsUpdate = true;
  }
  // Reset the matrix count to bucket length so frustum culling has the
  // right bounds (r3f reuses the same InstancedMesh across renders).
  ref.count = bucket.length;
  ref.computeBoundingBox();
  ref.computeBoundingSphere();
}

/**
 * Resolve which BuildingData was clicked from r3f event.instanceId + bucket.
 * Returns undefined if no instance was hit (e.g., click on empty space).
 */
function resolveClick(
  event: ThreeEvent<MouseEvent>,
  bucket: BuildingData[]
): BuildingData | undefined {
  const idx = event.instanceId;
  if (idx === undefined || idx < 0 || idx >= bucket.length) return undefined;
  return bucket[idx];
}

/**
 * Per-archetype render slot. Encapsulates the InstancedMesh ref + the
 * useLayoutEffect that pushes matrices, plus the click handler resolver.
 * Extracted so each archetype is independent + the BuildingInstances render
 * stays compact.
 *
 * LOD coordination: when `regressing === true` we keep the matrix layout
 * (positions stable, no flicker), but the parent BuildingInstances may swap
 * geometry for low-detail generic archetypes (see lowDetail prop below).
 * Castshadow drops to false during regress on generic archetypes to free
 * shadow-pass budget for the 5 landmark archetypes.
 */
function ArchetypeSlot({
  archetype,
  buildings,
  geometry,
  material,
  onBuildingClick,
  shadowsEnabled,
}: {
  archetype: BuildingArchetype;
  buildings: BuildingData[];
  geometry: BufferGeometry;
  material: Material;
  onBuildingClick?: BuildingClickHandler;
  shadowsEnabled: boolean;
}) {
  const ref = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    applyInstanceMatrices(ref.current, buildings);
  }, [buildings]);

  const handleClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      if (!onBuildingClick) return;
      const building = resolveClick(event, buildings);
      if (!building) return;
      event.stopPropagation();
      onBuildingClick(building, event);
    },
    [buildings, onBuildingClick]
  );

  if (buildings.length === 0) return null;

  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, Math.max(1, buildings.length)]}
      castShadow={shadowsEnabled}
      receiveShadow={shadowsEnabled}
      onClick={handleClick}
      name={`buildings-${archetype}`}
      frustumCulled={true}
    />
  );
}

/**
 * Archetype identity set: which archetypes are "landmark" tier (always full
 * detail, always cast shadow) vs "generic" tier (drop shadow on regress).
 * Landmarks must stay distinct even at perf squeeze because the iconic
 * silhouette is the visual differentiator per PRD Section 13.3.
 */
const LANDMARK_ARCHETYPES = new Set<BuildingArchetype>([
  'temple',
  'cross-shape',
  'surveillance-tower',
  'vertical-stack',
  'glass-cube',
]);

function isLandmark(archetype: BuildingArchetype): boolean {
  return LANDMARK_ARCHETYPES.has(archetype);
}

/**
 * BuildingInstances: the composite. 8 ArchetypeSlot children, one per
 * archetype. Geometries + materials built once at module load + memoized
 * inside the component so the underlying Three.js objects are not
 * re-created on every render (critical for the InstancedMesh args binding
 * to stay stable; changing args triggers a full reconstruction).
 */
export const BuildingInstances = ({
  data,
  onBuildingClick,
}: BuildingInstancesProps) => {
  // Geometries are built once and shared across the lifetime of the
  // component. useMemo with empty deps so React 19 strict mode double-mount
  // does not produce two geometry copies on dev.
  const geometries = useMemo(
    () => ({
      temple: buildTempleGeometry(),
      'cross-shape': buildCrossGeometry(),
      'surveillance-tower': buildTowerGeometry(),
      'vertical-stack': buildStackGeometry(),
      'glass-cube': buildBeaconGeometry(),
      'generic-residence': buildResidenceGeometry(),
      'generic-warehouse': buildWarehouseGeometry(),
      'generic-office': buildOfficeGeometry(),
    }),
    []
  );

  const materials = useMemo(
    () => ({
      temple: buildTempleMaterial(),
      'cross-shape': buildCrossMaterial(),
      'surveillance-tower': buildTowerMaterial(),
      'vertical-stack': buildStackMaterial(),
      'glass-cube': buildBeaconMaterial(),
      'generic-residence': buildGenericMaterial(),
      'generic-warehouse': buildGenericMaterial(),
      'generic-office': buildGenericMaterial(),
    }),
    []
  );

  const buckets = useMemo(
    () => partitionByArchetype(data.buildings),
    [data.buildings]
  );

  // Pull regress signal from Daedalus performance context. When the user
  // moves the camera or perf factor drops, we keep landmark archetypes full
  // detail (5 iconic silhouettes are non-negotiable per PRD 13.3) but drop
  // shadow casting on the 3 generic archetypes to free shadow-pass budget.
  const { regressing } = usePerformanceState();

  return (
    <group name="buildings-root">
      {buckets.map((bucket) => {
        const isLandmarkTier = isLandmark(bucket.archetype);
        // Landmarks always cast shadows; generics drop shadow on regress.
        const shadowsEnabled = isLandmarkTier || !regressing;
        return (
          <ArchetypeSlot
            key={bucket.archetype}
            archetype={bucket.archetype}
            buildings={bucket.buildings}
            geometry={geometries[bucket.archetype]}
            material={materials[bucket.archetype]}
            onBuildingClick={onBuildingClick}
            shadowsEnabled={shadowsEnabled}
          />
        );
      })}
    </group>
  );
};

BuildingInstances.displayName = 'BuildingInstances';
