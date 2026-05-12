/**
 * Activity Mode public barrel.
 *
 * Owner: Boreas (Wave 2).
 *
 * Public consumer pattern (Persephone Wave 2 + smoke route):
 *   import {
 *     ActivityCanvasLayer,
 *     ActivityHud,
 *     useActivityStore,
 *     useActivityData,
 *     // Or convenience composite (Fragment of both):
 *     ActivityMode,
 *   } from '@/modes/activity';
 *
 * Schema imports (Demeter Wave 3 + tests):
 *   import type {
 *     ActivityData,
 *     ActivityQuery,
 *     CommitActivity,
 *     HotspotIntensity,
 *     OwnershipDistribution,
 *     ActivitySummary,
 *     TimelineMarker,
 *     TimelineState,
 *   } from '@/modes/activity';
 *
 * Compliance: Lock 1 clean, Lock 2 clean.
 */

export {
  ActivityMode,
  ActivityCanvasLayer,
  ActivityHud,
} from './ActivityMode';
export { HotspotGlow } from './HotspotGlow';
export { OwnershipHeatmap } from './OwnershipHeatmap';
export { TimelineMarkers } from './TimelineMarkers';
export { TimelineScrubber } from './TimelineScrubber';
export {
  useActivityStore,
  selectRangeDays,
  selectScrubberPosition,
  selectOwnershipHeatmapActive,
} from './store';
export { useActivityData, fetchActivityData } from './useActivityData';
export { MOCK_ACTIVITY_DATA, buildMockActivityData } from './mockActivityData';
export type {
  ActivityData,
  ActivityQuery,
  CommitActivity,
  HotspotIntensity,
  OwnershipDistribution,
  OwnershipContributor,
  ActivitySummary,
  TimelineMarker,
  TimelineState,
} from './types';
