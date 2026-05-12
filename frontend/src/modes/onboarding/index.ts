/**
 * Onboarding Mode public barrel.
 *
 * Owner: Boreas (Wave 2).
 *
 * Public consumer pattern (Persephone Wave 2 + smoke route):
 *   import {
 *     useOnboardingController,
 *     OnboardingCanvasLayer,
 *     OnboardingHud,
 *     // Or convenience composite (Fragment of both layers):
 *     OnboardingMode,
 *   } from '@/modes/onboarding';
 *
 * Schema imports (Triton Wave 3 + tests):
 *   import type {
 *     TourScript,
 *     TourWaypoint,
 *     TourVariant,
 *     EndingSummary,
 *     NarrationRequest,
 *     NarrationResponse,
 *   } from '@/modes/onboarding';
 *
 * Compliance: Lock 1 clean, Lock 2 clean.
 */

export {
  OnboardingMode,
  OnboardingCanvasLayer,
  OnboardingHud,
  useOnboardingController,
} from './OnboardingMode';
export { CameraFly } from './CameraFly';
export { HermesNarrationOverlay } from './HermesNarrationOverlay';
export { EndingSummaryPanel } from './EndingSummaryPanel';
export { TourVariantRouter } from './TourVariantRouter';
export { useHermesTour } from './useHermesTour';
export type { TourPhase, HermesTourState, HermesTourActions, HermesTourReturn } from './useHermesTour';
export {
  resolveTour,
  fetchWaypointNarration,
  TOUR_VARIANTS,
  TOUR_VARIANT_LABELS,
  TOUR_VARIANT_DESCRIPTIONS,
  tourTotalDurationSeconds,
} from './tourDSL';
export type { ResolveTourOptions } from './tourDSL';
export { MOCK_TOURS, MOCK_GENERIC_30SEC, MOCK_SPRINT_GOAL, MOCK_FEATURE_SCOPED, MOCK_CROSS_ONBOARDING } from './mockTours';
export { HERMES_LINES, HERMES_FALLBACK_LINE, getHermesLine } from './hermesLines';
export type {
  TourScript,
  TourWaypoint,
  TourVariant,
  EndingSummary,
  NarrationPromptContext,
  NarrationBuildingContext,
  NarrationVariantContext,
  NarrationRequest,
  NarrationResponse,
} from './types';
