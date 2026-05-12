/**
 * useHermesTour hook: tour lifecycle state machine.
 *
 * Owner: Boreas (Wave 2).
 * Contract: `_meta/contracts/boreas-to-triton.md`.
 *
 * Wave 2 consumes static `mockTours` + static `hermesLines`. Wave 3 swap
 * replaces narration fetch with real Triton `/api/onboarding/narration` POST.
 *
 * Phase state machine:
 *   idle -> transit_to_0 -> dwell_0 -> transit_to_1 -> dwell_1 -> ... -> outro
 *
 * GSAP timeline (CameraFly.tsx) drives the transit + dwell timing; this hook
 * surfaces the current phase + waypoint index + active narration line for
 * the HermesNarrationOverlay HUD + the EndingSummaryPanel trigger.
 *
 * Compliance:
 *   Lock 1: clean. Lock 2: clean. Lock 5: stub fetch labeled.
 */

import { useCallback, useEffect, useState } from 'react';
import type { TourScript, TourVariant } from './types';
import { resolveTour, fetchWaypointNarration } from './tourDSL';

/**
 * Tour lifecycle phase. Visible to UI for overlay sequencing.
 */
export type TourPhase =
  | 'idle'
  | 'preroll'
  | 'transit'
  | 'dwell'
  | 'outro'
  | 'complete';

export interface HermesTourState {
  /** Currently selected variant. null = not picked yet. */
  variant: TourVariant | null;
  /** Resolved tour script for variant. null = not loaded. */
  script: TourScript | null;
  /** Active phase. */
  phase: TourPhase;
  /** Current waypoint index 0-based; undefined when in preroll/outro/complete. */
  waypointIndex: number | undefined;
  /** Pre-fetched narration text per waypoint index. Keys = waypoint.index. */
  narrationByIndex: Record<number, string>;
}

export interface HermesTourActions {
  /** Pick variant + load tour script + pre-fetch narration text. */
  startTour: (variant: TourVariant) => Promise<void>;
  /** GSAP timeline calls these as it progresses. */
  setPhase: (phase: TourPhase) => void;
  setWaypointIndex: (index: number | undefined) => void;
  /** Reset to idle (called on tour cleanup or user interrupt). */
  reset: () => void;
}

export type HermesTourReturn = HermesTourState & HermesTourActions;

const INITIAL_STATE: HermesTourState = {
  variant: null,
  script: null,
  phase: 'idle',
  waypointIndex: undefined,
  narrationByIndex: {},
};

/**
 * Hook returning the tour state + action callbacks. Single source of truth
 * for the onboarding mode lifecycle.
 */
export function useHermesTour(): HermesTourReturn {
  const [state, setState] = useState<HermesTourState>(INITIAL_STATE);

  const startTour = useCallback(async (variant: TourVariant) => {
    const script = resolveTour(variant);
    // Pre-fetch all narration up front so the overlay shows instantly on
    // each dwell. Wave 3 Triton can swap this to lazy fetch with cache.
    const narrationByIndex: Record<number, string> = {};
    await Promise.all(
      script.waypoints.map(async (wp) => {
        try {
          const res = await fetchWaypointNarration(script.id, wp);
          narrationByIndex[wp.index] = res.narrationText;
        } catch {
          narrationByIndex[wp.index] = '';
        }
      })
    );
    setState({
      variant,
      script,
      phase: 'preroll',
      waypointIndex: undefined,
      narrationByIndex,
    });
  }, []);

  const setPhase = useCallback((phase: TourPhase) => {
    setState((prev) => (prev.phase === phase ? prev : { ...prev, phase }));
  }, []);

  const setWaypointIndex = useCallback((index: number | undefined) => {
    setState((prev) =>
      prev.waypointIndex === index ? prev : { ...prev, waypointIndex: index }
    );
  }, []);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  // Defensive: ensure phase + waypointIndex are reset if variant cleared.
  useEffect(() => {
    if (!state.variant && state.phase !== 'idle') {
      setState((prev) => ({ ...prev, phase: 'idle', waypointIndex: undefined }));
    }
  }, [state.variant, state.phase]);

  return {
    ...state,
    startTour,
    setPhase,
    setWaypointIndex,
    reset,
  };
}
