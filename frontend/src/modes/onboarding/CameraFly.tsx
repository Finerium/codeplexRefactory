'use client';

/**
 * CameraFly: deterministic camera waypoint traversal with cinematic easing.
 *
 * Owner: Boreas (Wave 2).
 * Decision: `_meta/decision_log/boreas.md` D2.
 *
 * Mount: must be a CHILD of `<ChronicleCanvas>` (uses r3f `useThree` + camera).
 * Consumes: `useHermesTour` return object (script + setPhase + setWaypointIndex).
 *
 * Animation pipeline:
 *   - GSAP 3.13 timeline (`gsap` already in package.json) sequences per-waypoint
 *     transit (position tween) + dwell (timeline pause) phases.
 *   - Sibling proxy Vector3 `lookAtTarget` is tweened alongside camera.position.
 *   - `useFrame` calls `camera.lookAt(lookAtTarget.current)` every frame so the
 *     tween smoothly orients the camera.
 *   - OrbitControls suppression: while CameraFly is active we set
 *     `controls.enabled = false` so user drag does not fight the tween. On
 *     unmount/interrupt we restore.
 *
 * Cinematic easing: `power2.inOut` for the position tween (cubic-bezier
 * approximation), dwell uses GSAP `set` callback to fire phase = 'dwell'
 * + waypointIndex updates. Final waypoint pause flips phase = 'outro' so
 * EndingSummaryPanel can fade in over the camera's last dwell position.
 *
 * Wave 3 cascade: this component does NOT need changes for Wave 3 swap.
 * Triton wires narration text via `useHermesTour.narrationByIndex` which
 * Wave 3 swap fills from real fetch; CameraFly only consumes phase signals.
 *
 * Compliance:
 *   Lock 1: clean. Lock 2: clean. r3f anchor: camera/controls mutation per
 *   r3f docs canonical pattern. No EffectComposer touch (Daedalus locked).
 */

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import gsap from 'gsap';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { mockCityData } from '@/scene/buildings';
import type { TourScript, TourWaypoint } from './types';
import type { TourPhase } from './useHermesTour';

interface CameraFlyProps {
  /** Resolved tour script to play. */
  script: TourScript;
  /** Phase emitter (from useHermesTour). */
  setPhase: (phase: TourPhase) => void;
  /** Waypoint index emitter (from useHermesTour). */
  setWaypointIndex: (index: number | undefined) => void;
  /** Called once timeline completes (after final dwell). */
  onComplete?: () => void;
  /** Called when user clicks canvas to interrupt the tour. */
  onInterrupt?: () => void;
}

/**
 * Resolve world-space camera position + lookAt target for a waypoint.
 * Cameraoffset measured from building centroid `[x, y=height/2, z]` per
 * uncertainty journal U4 convention.
 */
function resolveWaypointTransform(waypoint: TourWaypoint): {
  cameraPosition: [number, number, number];
  lookAtTarget: [number, number, number];
} {
  const building = mockCityData.buildings.find(
    (b) => b.id === waypoint.targetBuildingId
  );
  if (!building) {
    // Fallback to city centroid if building missing (defensive Wave 2).
    return {
      cameraPosition: [
        mockCityData.centroid[0] + 30,
        mockCityData.centroid[1] + 30,
        mockCityData.centroid[2] + 30,
      ],
      lookAtTarget: [...mockCityData.centroid],
    };
  }
  const centroidX = building.position[0];
  const centroidY = building.position[1] + building.height / 2;
  const centroidZ = building.position[2];
  return {
    cameraPosition: [
      centroidX + waypoint.cameraOffset[0],
      centroidY + waypoint.cameraOffset[1],
      centroidZ + waypoint.cameraOffset[2],
    ],
    lookAtTarget: [
      centroidX + waypoint.lookAtOffset[0],
      centroidY + waypoint.lookAtOffset[1],
      centroidZ + waypoint.lookAtOffset[2],
    ],
  };
}

export function CameraFly({
  script,
  setPhase,
  setWaypointIndex,
  onComplete,
  onInterrupt,
}: CameraFlyProps) {
  const { camera, controls, gl } = useThree();

  // Proxy Vector3 that GSAP tweens; useFrame drives camera.lookAt(this) each
  // frame so the orientation tween reads continuous.
  const lookAtTargetRef = useRef(new Vector3());
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  // Snapshot original camera state to restore on cleanup / interrupt.
  const originalRef = useRef<{
    position: [number, number, number];
    target: [number, number, number] | null;
  } | null>(null);

  useEffect(() => {
    // Snapshot original camera + controls target on first mount of this
    // tour script. Reused on cleanup to restore the view smoothly.
    originalRef.current = {
      position: [camera.position.x, camera.position.y, camera.position.z],
      target:
        controls && 'target' in controls
          ? [
              (controls as OrbitControlsImpl).target.x,
              (controls as OrbitControlsImpl).target.y,
              (controls as OrbitControlsImpl).target.z,
            ]
          : null,
    };

    // Disable OrbitControls during tour to prevent input fighting tween.
    const orbitControls = (controls as OrbitControlsImpl) ?? null;
    if (orbitControls) {
      orbitControls.enabled = false;
      orbitControls.autoRotate = false;
    }

    // Initialize lookAtTarget at the first waypoint's lookAt so the very
    // first frame does not jump.
    const first = script.waypoints[0];
    if (first) {
      const { lookAtTarget } = resolveWaypointTransform(first);
      lookAtTargetRef.current.set(lookAtTarget[0], lookAtTarget[1], lookAtTarget[2]);
    }

    // Build GSAP timeline.
    const tl = gsap.timeline({
      paused: false,
      onComplete: () => {
        setPhase('complete');
        setWaypointIndex(undefined);
        onComplete?.();
      },
    });

    // Preroll: 400ms hold + announce phase before first transit.
    tl.call(() => {
      setPhase('preroll');
      setWaypointIndex(undefined);
    }, undefined, 0);
    tl.to({}, { duration: 0.4 });

    // Sequence per waypoint: transit -> dwell.
    script.waypoints.forEach((waypoint, i) => {
      const { cameraPosition, lookAtTarget } = resolveWaypointTransform(waypoint);
      const transitDuration = waypoint.transitionDurationMs / 1000;
      const dwellDuration = waypoint.pauseDurationMs / 1000;
      const isLast = i === script.waypoints.length - 1;

      // Transit phase begin label.
      tl.call(() => {
        setPhase('transit');
        setWaypointIndex(i);
      });

      // Animate camera.position to cameraPosition.
      tl.to(
        camera.position,
        {
          x: cameraPosition[0],
          y: cameraPosition[1],
          z: cameraPosition[2],
          duration: transitDuration,
          ease: 'power2.inOut',
        },
        '>' // start at end of previous segment (the call() above)
      );
      // Animate lookAtTarget alongside position.
      tl.to(
        lookAtTargetRef.current,
        {
          x: lookAtTarget[0],
          y: lookAtTarget[1],
          z: lookAtTarget[2],
          duration: transitDuration,
          ease: 'power2.inOut',
        },
        '<'
      );

      // Dwell phase begin label.
      tl.call(() => {
        setPhase(isLast ? 'outro' : 'dwell');
      });

      // Hold for dwell duration; narration overlay reads during this window.
      tl.to({}, { duration: dwellDuration });
    });

    timelineRef.current = tl;

    // Defensive: pointer down on the canvas interrupts the tour.
    const canvas = gl.domElement;
    const handleInterrupt = () => {
      onInterrupt?.();
    };
    canvas.addEventListener('pointerdown', handleInterrupt);

    return () => {
      canvas.removeEventListener('pointerdown', handleInterrupt);

      // Kill timeline if still running.
      tl.kill();

      // Restore OrbitControls + camera to original state.
      if (originalRef.current) {
        camera.position.set(...originalRef.current.position);
        if (orbitControls && originalRef.current.target) {
          orbitControls.target.set(...originalRef.current.target);
          orbitControls.update();
        }
      }
      if (orbitControls) {
        orbitControls.enabled = true;
      }
    };
  }, [script, camera, controls, gl, setPhase, setWaypointIndex, onComplete, onInterrupt]);

  // Every frame: re-orient camera to current lookAtTarget. GSAP tweens
  // lookAtTargetRef.current in lockstep with camera.position, so the
  // result is smooth orientation.
  useFrame(() => {
    camera.lookAt(lookAtTargetRef.current);
  });

  return null;
}
