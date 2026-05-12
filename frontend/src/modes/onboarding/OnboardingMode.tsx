'use client';

/**
 * OnboardingMode: composite root that exposes Canvas + HUD layers.
 *
 * Owner: Boreas (Wave 2).
 * Decision: `_meta/decision_log/boreas.md` D3.
 *
 * Two-layer composition:
 *   - `<OnboardingCanvasLayer />`: mounts INSIDE `<ChronicleCanvas>`, hosts
 *     CameraFly (which suppresses OrbitControls + drives camera tween).
 *   - `<OnboardingHud />`: mounts OUTSIDE the Canvas (sibling DOM), hosts
 *     TourVariantRouter + HermesNarrationOverlay + EndingSummaryPanel.
 *
 * Persephone Wave 2 integration: imports both layers + mounts each from the
 * correct tree position. The convenience composite `<OnboardingMode />`
 * mounts neither directly (no nested Canvas); instead it returns a Fragment
 * with both layer children, leaving placement to the parent.
 *
 * For the Boreas smoke route `/boreas-smoke`, the smoke page itself owns
 * ChronicleCanvas + Iris BuildingInstances and mounts the Boreas layers in
 * the right places (verified in `app/boreas-smoke/page.tsx`).
 *
 * Compliance:
 *   Lock 1: clean. Lock 2: clean. Lock 3: scope respected (no city/page.tsx
 *   modification). Lock 5: mock boundaries honored downstream.
 */

import { useCallback, useEffect } from 'react';
import { useHermesTour } from './useHermesTour';
import type { TourVariant } from './types';
import { CameraFly } from './CameraFly';
import { HermesNarrationOverlay } from './HermesNarrationOverlay';
import { EndingSummaryPanel } from './EndingSummaryPanel';
import { TourVariantRouter } from './TourVariantRouter';

/**
 * Hook returning the shared tour controller. Smoke + Persephone both wire
 * this hook so the two layers stay in sync (single source of truth).
 */
export function useOnboardingController() {
  const tour = useHermesTour();

  const handleStart = useCallback(
    (variant: TourVariant) => {
      void tour.startTour(variant);
    },
    [tour]
  );

  const handleDismiss = useCallback(() => {
    tour.reset();
  }, [tour]);

  const handleInterrupt = useCallback(() => {
    tour.reset();
  }, [tour]);

  const handleComplete = useCallback(() => {
    // Phase 'complete' fired by CameraFly onComplete; tour state already in
    // place. The EndingSummaryPanel surfaces via the phase === 'complete'
    // visible flag.
  }, []);

  return {
    tour,
    handleStart,
    handleDismiss,
    handleInterrupt,
    handleComplete,
  };
}

/**
 * Canvas-tree layer. Mount as child of `<ChronicleCanvas>`. Renders the
 * CameraFly r3f tween component when tour is active.
 */
interface OnboardingCanvasLayerProps {
  controller: ReturnType<typeof useOnboardingController>;
}

export function OnboardingCanvasLayer({ controller }: OnboardingCanvasLayerProps) {
  const { tour, handleInterrupt, handleComplete } = controller;
  if (!tour.script || tour.phase === 'idle' || tour.phase === 'complete') {
    return null;
  }
  return (
    <CameraFly
      script={tour.script}
      setPhase={tour.setPhase}
      setWaypointIndex={tour.setWaypointIndex}
      onComplete={handleComplete}
      onInterrupt={handleInterrupt}
    />
  );
}

/**
 * DOM HUD layer. Mount as sibling of `<ChronicleCanvas>`. Renders the
 * variant router (idle), narration overlay (transit/dwell), ending summary
 * (complete).
 */
interface OnboardingHudProps {
  controller: ReturnType<typeof useOnboardingController>;
}

export function OnboardingHud({ controller }: OnboardingHudProps) {
  const { tour, handleStart, handleDismiss } = controller;
  // Variant router visible only when tour is idle (not started yet).
  const showRouter = tour.phase === 'idle';
  // Narration overlay handles its own phase-based visibility.
  // Ending summary visible only when tour is complete.
  const showEnding = tour.phase === 'complete' && tour.script !== null;

  // Defensive: log to console once when tour state transitions (dev aid).
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log(
        `[boreas onboarding] phase=${tour.phase} variant=${tour.variant ?? 'none'} waypoint=${tour.waypointIndex ?? '-'}`
      );
    }
  }, [tour.phase, tour.variant, tour.waypointIndex]);

  return (
    <>
      <TourVariantRouter visible={showRouter} onStart={handleStart} />
      <HermesNarrationOverlay
        phase={tour.phase}
        waypointIndex={tour.waypointIndex}
        narrationByIndex={tour.narrationByIndex}
      />
      {tour.script ? (
        <EndingSummaryPanel
          visible={showEnding}
          summary={tour.script.endingSummary}
          onDismiss={handleDismiss}
        />
      ) : null}
    </>
  );
}

/**
 * Convenience composite. Returns a Fragment with both layers as children;
 * the parent decides where each lives in the tree.
 *
 * NOTE: this convenience component is NOT for general use because the Canvas
 * layer must be inside `<ChronicleCanvas>` while the HUD layer must be
 * outside. Use `OnboardingCanvasLayer` + `OnboardingHud` directly with a
 * shared controller from `useOnboardingController()`.
 */
export function OnboardingMode({ controller }: { controller: ReturnType<typeof useOnboardingController> }) {
  return (
    <>
      <OnboardingCanvasLayer controller={controller} />
      <OnboardingHud controller={controller} />
    </>
  );
}
