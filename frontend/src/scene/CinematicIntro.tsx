'use client';

/**
 * CinematicIntro: 5-second GSAP camera glide on first /city load.
 *
 * Owner: Daedalus (Wave-Fixing #2 cycle 1, Feature #20).
 *
 * Per PRD Section 7.3 Stretch Tier 1 + Section 13.3: cinematic intro 5 detik
 * first load, camera glide low altitude dari laut/jauh masuk city center.
 * Plus residents wake-up sequence (lights turn on di landmark buildings).
 * Wave 1 ships the camera glide; the wake-up sequence is wired through the
 * Iris BuildingInstances emissive ramp that consumes a global window glow
 * scalar (Iris reads context).
 *
 * Choreography:
 *   t=0.0s  camera position [180, 12, 220] (far sea-level), looking [0,18,0]
 *   t=0.5s  ease begins, slight up-shift on Y
 *   t=2.5s  midpoint approach [80, 45, 110]
 *   t=4.5s  near final destination, easing out
 *   t=5.0s  rest at parent-controlled position, OrbitControls re-enabled,
 *           emit `onComplete` so caller can drop the intro overlay if it
 *           painted any.
 *
 * The intro disables OrbitControls during play to prevent user input from
 * fighting the timeline. We re-enable on complete. We DO NOT swallow the
 * RegressBridge wiring: that bridge listens to `change` events from the
 * controls object, which does not fire while controls are disabled, so the
 * perf monitor stays calm during the cinematic.
 *
 * Skip behavior: clicking anywhere or pressing any key inside the first 5s
 * snaps the camera to its final pose and fires onComplete. This avoids the
 * "judge wants to interact mid-intro" deadlock common in cinematic intros.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 */

import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { gsap } from 'gsap';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

interface CinematicIntroProps {
  /** Final camera position the intro lands on. Default matches /city. */
  finalPosition?: [number, number, number];
  /** Final OrbitControls target. */
  finalTarget?: [number, number, number];
  /** Duration in seconds. Default 5. */
  duration?: number;
  /** OrbitControls ref so we can disable + restore during play. */
  controlsRef?: React.RefObject<OrbitControlsImpl | null>;
  /** Called once when the timeline completes (or user skips). */
  onComplete?: () => void;
}

export function CinematicIntro({
  finalPosition = [0, 90, 140],
  finalTarget = [0, 0, 0],
  duration = 5,
  controlsRef,
  onComplete,
}: CinematicIntroProps) {
  const { camera, gl } = useThree();
  const completedRef = useRef(false);

  useEffect(() => {
    if (completedRef.current) return;

    const controls = controlsRef?.current;
    const previousEnabled = controls?.enabled ?? true;
    const previousAutoRotate = controls?.autoRotate ?? false;
    if (controls) {
      controls.enabled = false;
      // Pause auto-rotate while intro plays so the GSAP camera owns motion.
      controls.autoRotate = false;
    }

    // Starting pose: far, low, looking up at the skyline.
    const start = { x: 180, y: 12, z: 220 };
    const startTarget = { tx: 0, ty: 22, tz: 0 };

    camera.position.set(start.x, start.y, start.z);
    camera.lookAt(startTarget.tx, startTarget.ty, startTarget.tz);
    if (controls) {
      controls.target.set(startTarget.tx, startTarget.ty, startTarget.tz);
      controls.update();
    }

    const state = {
      x: start.x,
      y: start.y,
      z: start.z,
      tx: startTarget.tx,
      ty: startTarget.ty,
      tz: startTarget.tz,
    };

    const complete = () => {
      if (completedRef.current) return;
      completedRef.current = true;
      // Snap to final pose.
      camera.position.set(...finalPosition);
      if (controls) {
        controls.target.set(...finalTarget);
        controls.enabled = previousEnabled;
        controls.autoRotate = previousAutoRotate;
        controls.update();
      }
      onComplete?.();
    };

    const tl = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      onUpdate: () => {
        camera.position.set(state.x, state.y, state.z);
        if (controls) {
          controls.target.set(state.tx, state.ty, state.tz);
          controls.update();
        } else {
          camera.lookAt(state.tx, state.ty, state.tz);
        }
      },
      onComplete: complete,
    });

    // Glide segment 1: far approach.
    tl.to(state, {
      x: 130,
      y: 28,
      z: 180,
      tx: 0,
      ty: 18,
      tz: 0,
      duration: duration * 0.45,
      ease: 'power3.out',
    });

    // Glide segment 2: rise plus arc into final.
    tl.to(state, {
      x: finalPosition[0],
      y: finalPosition[1],
      z: finalPosition[2],
      tx: finalTarget[0],
      ty: finalTarget[1],
      tz: finalTarget[2],
      duration: duration * 0.55,
      ease: 'power2.inOut',
    });

    // Skip-to-end handler: any keydown or pointerdown fires complete.
    const dom = gl.domElement;
    const skipHandler = () => {
      tl.kill();
      complete();
    };
    dom.addEventListener('pointerdown', skipHandler, { once: true });
    window.addEventListener('keydown', skipHandler, { once: true });

    return () => {
      tl.kill();
      dom.removeEventListener('pointerdown', skipHandler);
      window.removeEventListener('keydown', skipHandler);
      if (controls && !completedRef.current) {
        // Component unmounting mid-play, restore controls.
        controls.enabled = previousEnabled;
        controls.autoRotate = previousAutoRotate;
      }
    };
    // We intentionally depend on `duration` only; camera + controls are
    // stable refs across renders so adding them to deps would cause a
    // re-run loop. Run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  return null;
}
