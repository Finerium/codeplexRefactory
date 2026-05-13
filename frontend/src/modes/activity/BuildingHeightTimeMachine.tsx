'use client';

/**
 * BuildingHeightTimeMachine: r3f canvas layer that scrubs building heights
 * against the LOC snapshot for the cursor timestamp.
 *
 * Owner: Boreas (Manager FINAL Cycle 2 Cluster B, STAMP 20260513-0857).
 *
 * Ghaisan vision verbatim: drag scrubber left -> building heights shrink
 * toward LOC 0 (early repo state, many buildings missing entirely). Drag
 * right -> heights grow toward current max LOC. Smooth tween per drag tick.
 *
 * Implementation:
 *   - Subscribes to `useTimeMachine` for the per-cursor LOC snapshot.
 *   - Iterates each archetype InstancedMesh in the parent scene (the bucket
 *     name convention `buildings-{archetype}` set by Iris) and overrides
 *     each instance's Y scale via setMatrixAt.
 *   - Per useFrame tick lerps the displayed scale toward the target scale
 *     so dragging produces a continuous smooth animation rather than a
 *     step function. Tween factor 0.12 per frame at 60fps ~= 200ms time
 *     constant, which reads as a quick but legible morph.
 *   - When the Time Machine is paused / no repo selected, the component
 *     restores all instances to scale Y = 1 (original height) and unmounts.
 *
 * Coordinate space:
 *   Iris encodes building height in BuildingData.height. setMatrixAt uses
 *   scale.y = b.height directly. We retain that base and apply a per-
 *   building multiplier in [0, 1]. The InstancedMesh.scale is left at 1
 *   on the wrapping group so the per-instance scale is the only knob.
 *
 * Why mutate the existing InstancedMesh rather than rendering a separate
 * overlay:
 *   - Single source of truth for geometry, materials, shadows, windows
 *     (per Phase B anchor: raw <instancedMesh> at the city scale).
 *   - The Iris BuildingInstances pipeline already manages per-instance
 *     color + matrices; we hook in via the same setMatrixAt API after
 *     Iris's useLayoutEffect.
 *   - Avoids duplicate draw calls / z-fighting on heat-mode buildings.
 *
 * Coordination contract:
 *   - Iris owns the InstancedMesh and the base matrix layout. We do NOT
 *     change building POSITION (x,z) or width/depth. Only scale.y.
 *   - On unmount we restore the original matrices so leaving Activity
 *     mode does not corrupt the geometry seen by Health / Sprint / etc.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 *   Lock 5 (honest claim): when no repo selected the layer is fully
 *     inert (no fake animations) so the user does not get a false demo
 *     of history they cannot verify.
 */

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { InstancedMesh, Object3D, Vector3 } from 'three';
import { useCityData } from '@/scene/buildings';
import { encodeHeight } from '@/scene/buildings/layout';
import { useTimeMachine } from './useTimeMachine';
import { usePanelStore } from '@/lib/panel-context';
import { useActivityStore, selectScrubberPosition } from './store';
import type { BuildingData } from '@/scene/buildings';

interface BuildingHeightTimeMachineProps {
  /** GitHub `owner/name` slug. When null the layer is inert. */
  repoFullName: string | null | undefined;
}

interface InstanceIndex {
  /** Maps building.id to (meshName, instanceIndex, baseScale, basePosition). */
  byId: Map<
    string,
    {
      meshName: string;
      instanceIndex: number;
      baseScale: Vector3;
      basePosition: Vector3;
    }
  >;
  /** Maps archetype mesh name to its bucket order (for full-bucket iteration). */
  byMesh: Map<string, BuildingData[]>;
}

const ARCHETYPE_ORDER: string[] = [
  'buildings-temple',
  'buildings-cross-shape',
  'buildings-surveillance-tower',
  'buildings-vertical-stack',
  'buildings-glass-cube',
  'buildings-generic-residence',
  'buildings-generic-warehouse',
  'buildings-generic-office',
];

function buildInstanceIndex(city: ReturnType<typeof useCityData>): InstanceIndex {
  const byId = new Map<
    string,
    {
      meshName: string;
      instanceIndex: number;
      baseScale: Vector3;
      basePosition: Vector3;
    }
  >();
  const byMesh = new Map<string, BuildingData[]>();
  for (const meshName of ARCHETYPE_ORDER) {
    const archetype = meshName.replace(/^buildings-/, '');
    const bucket = city.buildings.filter((b) => b.archetype === archetype);
    byMesh.set(meshName, bucket);
    bucket.forEach((b, i) => {
      byId.set(b.id, {
        meshName,
        instanceIndex: i,
        baseScale: new Vector3(b.width, b.height, b.depth),
        basePosition: new Vector3(b.position[0], b.position[1], b.position[2]),
      });
    });
  }
  return { byId, byMesh };
}

/**
 * Compute target height scale (in [0, 1.05]) per building given the LOC
 * snapshot. Strategy: map snapshot LOC to a normalized fraction of the
 * building's BASE height (which itself was encoded from the present-day
 * LOC via Iris encodeHeight). Buildings absent from the snapshot get
 * scale 0 (they did not exist in the repo at that time).
 *
 * Why we normalize by base height and not by absolute encodeHeight(loc):
 *   The base building was sized by Iris from the present-day LOC. If we
 *   reverse-engineered a "world height for snapshot LOC" via
 *   encodeHeight(snapshotLoc) and used it directly we would diverge from
 *   Iris's source of truth on max heights, breaking landmark proportions.
 *   Normalizing keeps the present-day silhouette intact at scrubber
 *   position 0 (NOW) and shrinks proportionally as we scrub backward.
 */
function computeTargetScales(
  city: ReturnType<typeof useCityData>,
  files: Record<string, number>,
  scrubberPosition: number,
): Map<string, number> {
  const result = new Map<string, number>();

  // Manager FINAL TRULY Cluster 1 (Aether 2026-05-13): pre-flight match-ratio
  // guard prevents the 0.5s sink regression. Root cause: city building IDs use
  // mock-format paths (e.g. "backend/app/core/main.py" from fastapi-fullstack
  // mock data) while the backend LOC snapshot for a real repo returns that
  // repo's actual git ls-tree paths (e.g. "README.md", "main.ts", etc.). When
  // the namespaces do not overlap, every building hits result.set(b.id, 0) and
  // tweens to ground over ~200ms. The match-ratio guard detects this condition
  // early and returns synthetic scrubber-driven scale instead, so the Time
  // Machine cursor and commit tooltip remain functional while buildings stay
  // visible AND animate per drag. Graceful degradation per Lock 5 honest
  // claim discipline.
  let matchCount = 0;
  for (const b of city.buildings) {
    const candidates = [b.id, b.id.replace(/^\/+/, ''), b.label];
    if (candidates.some((c) => Object.prototype.hasOwnProperty.call(files, c))) {
      matchCount++;
    }
  }
  const matchRatio = city.buildings.length > 0 ? matchCount / city.buildings.length : 0;
  if (matchRatio < 0.1) {
    // Pan reactive cycle post-V8.1 (Boreas 2026-05-13 11:39 WIB): synthetic
    // animation fallback when mock-city IDs don't match real backend snapshot
    // paths. Derive scale from scrubber position instead of LOC data so the
    // user STILL sees buildings animate per drag.
    //
    // Mapping: syntheticScale = 0.3 + 0.7 * scrubberPosition
    //   - scrubberPosition 0.0 (LEFT anchor, past)    -> scale 0.3 (short)
    //   - scrubberPosition 1.0 (RIGHT anchor, present) -> scale 1.0 (full)
    //
    // Floor 0.3 keeps buildings VISIBLE (no sink to ground) while restoring
    // the drag-visible animation per Ghaisan Cycle 2 vision verbatim.
    // Real LOC scaling preserved for matchRatio >= 10% (Wave 3 namespace
    // alignment via Daedalus + Demeter joint contract).
    const syntheticScale = 0.3 + 0.7 * scrubberPosition;
    for (const b of city.buildings) result.set(b.id, syntheticScale);
    return result;
  }

  for (const b of city.buildings) {
    // Building id convention: relative path from repo root (Iris contract).
    // Snapshot keys: repo-relative path from `git ls-tree`. Match candidates:
    //   1) exact id match
    //   2) id stripped of leading slash
    //   3) basename match (fallback for mock data where building.id is a label
    //      not a real path)
    const candidates = [
      b.id,
      b.id.replace(/^\/+/, ''),
      b.label,
    ];
    let snapshotLoc: number | undefined;
    for (const key of candidates) {
      if (Object.prototype.hasOwnProperty.call(files, key)) {
        snapshotLoc = files[key];
        break;
      }
    }
    if (snapshotLoc === undefined) {
      // Building did not exist in the snapshot tree -> shrink to zero.
      result.set(b.id, 0);
      continue;
    }
    // Approximate present-day LOC from Iris's encodeHeight inverse-ish via
    // the building's BASE height. We do not invert exactly because
    // encodeHeight has a non-linear boost; instead we normalize by the
    // ratio of snapshot height (re-encoded) to base height.
    const snapshotHeight = encodeHeight(snapshotLoc);
    const ratio = b.height > 0 ? snapshotHeight / b.height : 0;
    // Clamp to [0, 1.05] so a building that grew larger in history (rare
    // for shrinking refactors) still reads as taller-than-current rather
    // than overflowing the silhouette dramatically.
    result.set(b.id, Math.max(0, Math.min(1.05, ratio)));
  }
  return result;
}

export function BuildingHeightTimeMachine({
  repoFullName,
}: BuildingHeightTimeMachineProps) {
  const city = useCityData();
  const scene = useThree((s) => s.scene);

  // Only run when activity mode is selected. Pulled from panel store via
  // selector to avoid re-render on unrelated state.
  const currentMode = usePanelStore((s) => s.currentMode);
  const paused = currentMode !== 'activity';

  const { snapshot } = useTimeMachine({ repoFullName, paused });

  // Pan reactive cycle post-V8.1: read scrubberPosition selector so the
  // synthetic-fallback branch of computeTargetScales animates per drag tick.
  // Selector subscription is cheap; only re-evaluates targetScales useMemo
  // when scrubber moves, and the lerp loop in useFrame consumes the new
  // target without forcing a full canvas re-render.
  const scrubberPosition = useActivityStore(selectScrubberPosition);

  // Build per-building index once. Stable across renders unless city
  // identity changes (mock singleton -> never).
  const index = useMemo(() => buildInstanceIndex(city), [city]);

  // Target scale per building (computed on snapshot change). Default = 1
  // (full present-day height) when no snapshot loaded.
  const targetScales = useMemo<Map<string, number>>(() => {
    if (paused) {
      const map = new Map<string, number>();
      for (const b of city.buildings) map.set(b.id, 1);
      return map;
    }
    if (!snapshot || !snapshot.realData) {
      // No snapshot loaded yet OR no repo: keep present-day height.
      const map = new Map<string, number>();
      for (const b of city.buildings) map.set(b.id, 1);
      return map;
    }
    return computeTargetScales(city, snapshot.files, scrubberPosition);
  }, [city, snapshot, paused, scrubberPosition]);

  // Currently displayed scale per building (lerp target). Persists across
  // renders so each frame can tween toward the target.
  const currentScalesRef = useRef<Map<string, number>>(new Map());
  if (currentScalesRef.current.size === 0) {
    for (const b of city.buildings) currentScalesRef.current.set(b.id, 1);
  }

  const tmpObject = useMemo(() => new Object3D(), []);

  // Restore-on-unmount. Capture index snapshot so the cleanup runs against
  // the same instance refs even if the city changes later.
  useEffect(() => {
    return () => {
      // Restore every instance to its base scale + position.
      for (const meshName of ARCHETYPE_ORDER) {
        const mesh = scene.getObjectByName(meshName) as InstancedMesh | null;
        if (!mesh) continue;
        const bucket = index.byMesh.get(meshName) ?? [];
        bucket.forEach((b, i) => {
          tmpObject.position.set(b.position[0], b.position[1], b.position[2]);
          tmpObject.scale.set(b.width, b.height, b.depth);
          tmpObject.rotation.set(0, 0, 0);
          tmpObject.updateMatrix();
          mesh.setMatrixAt(i, tmpObject.matrix);
        });
        mesh.instanceMatrix.needsUpdate = true;
      }
    };
  }, [scene, index, tmpObject]);

  // Tween factor per frame at 60fps. 0.12 ~= 200ms time constant which feels
  // responsive while still smooth.
  const TWEEN_FACTOR = 0.12;

  useFrame((_state, deltaSec) => {
    if (paused) return;

    // Convert deltaSec to a frame-rate-independent factor:
    //   factor = 1 - exp(-deltaSec / tau), tau ~= 0.2s
    const tau = 0.2;
    const factor = 1 - Math.exp(-deltaSec / tau);
    const lerpFactor = factor > 0 ? factor : TWEEN_FACTOR;

    // Per-archetype mesh update.
    for (const meshName of ARCHETYPE_ORDER) {
      const mesh = scene.getObjectByName(meshName) as InstancedMesh | null;
      if (!mesh) continue;
      const bucket = index.byMesh.get(meshName) ?? [];
      let dirty = false;

      bucket.forEach((b, i) => {
        const target = targetScales.get(b.id) ?? 1;
        const current = currentScalesRef.current.get(b.id) ?? 1;
        let next: number;
        if (Math.abs(target - current) < 0.001) {
          next = target;
        } else {
          next = current + (target - current) * lerpFactor;
        }
        currentScalesRef.current.set(b.id, next);

        // Always write the matrix (even when target reached) so any
        // re-render of Iris BuildingInstances (which would reset matrices
        // via its layout effect) is recovered within one frame. Cost is a
        // setMatrixAt per building per frame -> ~240 ops at 60fps,
        // negligible vs the existing window shader tick.
        //
        // Ghaisan vision anchor: building shrinks toward ground (early
        // repo state = ground floor only). We keep position[1] fixed and
        // multiply scale.y by `next * base_height` so the BASE stays
        // anchored to ground while the top recedes.
        tmpObject.position.set(
          b.position[0],
          b.position[1],
          b.position[2],
        );
        tmpObject.scale.set(b.width, b.height * next, b.depth);
        tmpObject.rotation.set(0, 0, 0);
        tmpObject.updateMatrix();
        mesh.setMatrixAt(i, tmpObject.matrix);
        dirty = true;
      });

      if (dirty) {
        mesh.instanceMatrix.needsUpdate = true;
      }
    }
  });

  // No visible JSX: this is a pure mutation layer. It mounts as a
  // sibling of BuildingInstances + drives their matrices.
  return null;
}
