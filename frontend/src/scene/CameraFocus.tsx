'use client';

/**
 * CameraFocus: smooth camera + OrbitControls target tween toward a selected
 * building, then back to the overview when selection clears.
 *
 * Wave-Fixing 3 ship (Persephone + Hera paired, B-1 recurring root cause fix
 * STAMP=20260513-final). Implements PRD Section 13.1 line 878 "Klik
 * building zoom + side panel terbuka" and Ghaisan envision item "ESC kembali
 * overview camera".
 *
 * Behavior:
 *   - When `panelStore.selectedBuildingId` becomes non-null, look up the
 *     BuildingData via Iris `useBuildingById` and tween the camera and
 *     OrbitControls target toward a 3/4-front offset of the building
 *     centroid. Tween via GSAP timeline `power2.inOut` over 600 ms.
 *   - When selection clears (Esc, or explicit close), tween back to the
 *     original camera position and city centroid target captured at first
 *     mount. Same 600 ms ease.
 *   - The component does NOT disable OrbitControls because the user may
 *     still want to orbit around the focused building. The tween only sets
 *     the new target / position once, then OrbitControls takes over.
 *   - DirectorMode and CinematicIntro both predate this component and use
 *     `controls.enabled = false` during their own tweens, so we defer to
 *     them by skipping our tween while controls are disabled.
 *
 * Mount: child of `<ChronicleCanvas>`, sibling of `<BuildingInstances>`.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 *   Lock 5 (honest claim): real client-side focus tween, no mock label.
 */

import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import gsap from 'gsap';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useBuildingById, useCityData } from './buildings';
import { usePanelStore } from '@/lib/panel-context';

const FOCUS_TWEEN_DURATION = 0.6;
const FOCUS_DISTANCE = 28;
const FOCUS_ELEVATION = 18;

export function CameraFocus() {
  const { camera, controls } = useThree();
  const selectedBuildingId = usePanelStore((s) => s.selectedBuildingId);
  const building = useBuildingById(selectedBuildingId ?? '');
  const city = useCityData();

  // Snapshot the initial overview camera + target the first time we mount so
  // we can restore on selection clear.
  const overviewRef = useRef<{
    position: [number, number, number];
    target: [number, number, number];
  } | null>(null);

  useEffect(() => {
    if (overviewRef.current) return;
    overviewRef.current = {
      position: [camera.position.x, camera.position.y, camera.position.z],
      target:
        controls && 'target' in controls
          ? [
              (controls as OrbitControlsImpl).target.x,
              (controls as OrbitControlsImpl).target.y,
              (controls as OrbitControlsImpl).target.z,
            ]
          : [city.centroid[0], city.centroid[1], city.centroid[2]],
    };
  }, [camera, controls, city]);

  useEffect(() => {
    const orbit = (controls as OrbitControlsImpl) ?? null;
    if (!orbit) return;
    // Defer if OrbitControls is currently disabled (CinematicIntro or
    // DirectorMode in progress). We will pick up on next selection change.
    if (orbit.enabled === false) return;

    let toPos: [number, number, number];
    let toTarget: [number, number, number];

    if (building) {
      const cx = building.position[0];
      const cy = building.position[1] + building.height / 2;
      const cz = building.position[2];
      toTarget = [cx, cy, cz];
      toPos = [cx + FOCUS_DISTANCE, cy + FOCUS_ELEVATION, cz + FOCUS_DISTANCE];
    } else if (overviewRef.current) {
      toPos = overviewRef.current.position;
      toTarget = overviewRef.current.target;
    } else {
      return;
    }

    const posTween = gsap.to(camera.position, {
      x: toPos[0],
      y: toPos[1],
      z: toPos[2],
      duration: FOCUS_TWEEN_DURATION,
      ease: 'power2.inOut',
      onUpdate: () => {
        // OrbitControls reads camera.position on its own update; we update
        // target in parallel below.
      },
    });

    const targetTween = gsap.to(orbit.target, {
      x: toTarget[0],
      y: toTarget[1],
      z: toTarget[2],
      duration: FOCUS_TWEEN_DURATION,
      ease: 'power2.inOut',
      onUpdate: () => {
        orbit.update();
      },
    });

    return () => {
      posTween.kill();
      targetTween.kill();
    };
  }, [building, camera, controls]);

  return null;
}

CameraFocus.displayName = 'CameraFocus';
