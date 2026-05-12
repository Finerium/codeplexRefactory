/**
 * Tour script DSL: lookup + variant resolution.
 *
 * Owner: Boreas (Wave 2).
 * Contract: `_meta/contracts/boreas-to-triton.md`.
 *
 * Public surface for consumers (smoke route + Persephone Wave 2 + Triton Wave
 * 3 fetch adapter):
 *  - `resolveTour(variant, options?)` -> TourScript: Wave 2 returns mock
 *    pinned tour; Wave 3 Demeter ranked query swap.
 *  - `fetchWaypointNarration(tourId, waypoint)` -> Promise<{narrationText}>:
 *    Wave 2 returns static line bank; Wave 3 Triton fetch swap.
 *
 * Compliance:
 *   Lock 1: clean. Lock 2: clean. Lock 5: mock boundaries clearly labeled.
 */

import type {
  NarrationResponse,
  TourScript,
  TourVariant,
  TourWaypoint,
} from './types';
import { MOCK_TOURS } from './mockTours';
import { getHermesLine } from './hermesLines';

/**
 * Optional context for tour resolution. Wave 2 stub ignores most fields; Wave
 * 3 Demeter ranked query uses these for variant-specific filtering.
 */
export interface ResolveTourOptions {
  /** For sprint-goal variant: active sprint goal text. */
  sprintGoal?: string;
  /** For feature-scoped variant: feature identifier (e.g., "onboarding"). */
  feature?: string;
  /** For cross-onboarding variant: target user login (no @ prefix). */
  targetUsername?: string;
}

/**
 * Resolve a tour for a given variant. Wave 2 returns a static mock pinned
 * to known mock building ids. Wave 3 backend computes ranked top-3 district
 * pick from real materialized view query per Pythia Asumption 4.
 */
export function resolveTour(
  variant: TourVariant,
  _options: ResolveTourOptions = {}
): TourScript {
  const tour = MOCK_TOURS[variant];
  if (!tour) {
    throw new Error(`Unknown tour variant: ${variant}`);
  }
  return tour;
}

/**
 * Fetch narration text for a waypoint. Wave 2 returns static bank line via
 * `getHermesLine`. Wave 3 fetches from Triton `/api/onboarding/narration`.
 *
 * The function signature matches Pythia contract `boreas-to-triton.md`
 * Section "Output schema" line 79-82 verbatim so the Wave 3 swap is a pure
 * implementation replacement (consumers unchanged).
 */
export async function fetchWaypointNarration(
  tourId: string,
  waypoint: TourWaypoint
): Promise<NarrationResponse> {
  // Wave 2 stub: lookup static line bank.
  // tourId encodes variant + version per `MOCK_TOURS` keys (e.g.,
  // "generic-30sec-v1"); extract variant token.
  const variant = (tourId.split('-v')[0] as TourVariant) ?? 'generic-30sec';
  const narrationText = getHermesLine(variant, waypoint.index);
  // Simulate Wave 3 async fetch (small delay for realism).
  await new Promise((resolve) => setTimeout(resolve, 50));
  return { narrationText };
}

/**
 * List of all available variants for the variant router UI. Order matters:
 * generic-30sec first (most common new-hire path).
 */
export const TOUR_VARIANTS: readonly TourVariant[] = [
  'generic-30sec',
  'sprint-goal',
  'feature-scoped',
  'cross-onboarding',
] as const;

/**
 * Human-readable label for variant router buttons.
 */
export const TOUR_VARIANT_LABELS: Record<TourVariant, string> = {
  'generic-30sec': '30-second tour',
  'sprint-goal': 'Sprint goal tour',
  'feature-scoped': 'Feature tour',
  'cross-onboarding': 'Cross-onboarding',
};

/**
 * Short description shown under each variant button in the router UI.
 */
export const TOUR_VARIANT_DESCRIPTIONS: Record<TourVariant, string> = {
  'generic-30sec':
    'Top-3 landmarks: City Hall + Hospital + Tourist Info. Best first-touch.',
  'sprint-goal':
    'Scoped to active sprint goal buildings + scaffolding. ~40 second runtime.',
  'feature-scoped':
    'Drill into a specific feature district (Wave 2 mock: onboarding).',
  'cross-onboarding':
    'Tour buildings owned by a target user (Wave 2 mock: @hafiz).',
};

/**
 * Compute total tour runtime in seconds. Useful for the variant router UI
 * + ending summary fade-in scheduling.
 */
export function tourTotalDurationSeconds(script: TourScript): number {
  const total = script.waypoints.reduce(
    (acc, wp) => acc + wp.pauseDurationMs + wp.transitionDurationMs,
    0
  );
  return Math.round(total / 100) / 10; // round to 1 decimal
}
