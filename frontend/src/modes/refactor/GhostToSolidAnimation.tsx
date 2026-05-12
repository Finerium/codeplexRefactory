'use client';

/**
 * GhostToSolidAnimation: bridges the simulation stage state to the
 * per-ghost `solidProgress` value used by `GhostBuilding`.
 *
 * Owner: Asclepius (Wave 2).
 *
 * Behavior:
 *   - When stage = 'accepted', solidProgress animates 0 -> 1 over 1.5 sec
 *     with easeOutCubic curve. Ghost reveals as solid.
 *   - When stage = 'discarded', fadeOut animates 0 -> 1 over 0.7 sec. Ghost
 *     dissolves.
 *   - Otherwise, solidProgress = 0 (ghost stays "proposed").
 *
 * The animation values are exposed via the children render prop so the
 * caller (RefactorGhostLayer) can pass them down to each <GhostBuilding>.
 *
 * Compliance: Lock 1 (no em dash). Lock 2 (no emoji).
 */

import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import type { SimulationStage } from './simulationEvents';

interface GhostToSolidAnimationProps {
  /** Current simulation stage. */
  stage: SimulationStage | 'idle';
  children: (state: { solidProgress: number; fadeOut: number }) => React.ReactNode;
}

const SOLIDIFY_DURATION_SEC = 1.5;
const FADEOUT_DURATION_SEC = 0.7;

function easeOutCubic(t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - clamped, 3);
}

/**
 * Drive animation using `useFrame`. We sample elapsed time from r3f clock
 * via the per-frame callback and update local state via a ref + setState
 * pattern that batches at the React 19 scheduler boundary.
 */
export function GhostToSolidAnimation({
  stage,
  children,
}: GhostToSolidAnimationProps) {
  const [solidProgress, setSolidProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(0);
  const accStart = useRef<number | null>(null);
  const discStart = useRef<number | null>(null);

  // Track stage entry to capture animation start time. Reset on transitions
  // out of accept/discard.
  useEffect(() => {
    if (stage === 'accepted') {
      accStart.current = null; // captured at first frame
      discStart.current = null;
      setFadeOut(0);
    } else if (stage === 'discarded') {
      discStart.current = null;
      accStart.current = null;
      setSolidProgress(0);
    } else if (stage === 'idle' || stage === 'proposed') {
      accStart.current = null;
      discStart.current = null;
      setSolidProgress(0);
      setFadeOut(0);
    }
  }, [stage]);

  useFrame((state) => {
    const now = state.clock.getElapsedTime();
    if (stage === 'accepted') {
      if (accStart.current === null) {
        accStart.current = now;
      }
      const dt = now - accStart.current;
      const next = easeOutCubic(dt / SOLIDIFY_DURATION_SEC);
      if (Math.abs(next - solidProgress) > 0.005) {
        setSolidProgress(next);
      }
    }
    if (stage === 'discarded') {
      if (discStart.current === null) {
        discStart.current = now;
      }
      const dt = now - discStart.current;
      const next = easeOutCubic(dt / FADEOUT_DURATION_SEC);
      if (Math.abs(next - fadeOut) > 0.005) {
        setFadeOut(next);
      }
    }
  });

  return <>{children({ solidProgress, fadeOut })}</>;
}

GhostToSolidAnimation.displayName = 'GhostToSolidAnimation';
