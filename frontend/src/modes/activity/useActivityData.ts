/**
 * useActivityData hook: consume ActivityData per current timeline range.
 *
 * Owner: Boreas (Wave 2).
 * Contract: `_meta/contracts/boreas-to-demeter.md`.
 *
 * Wave 2 returns deterministic mock ActivityData from `./mockActivityData.ts`
 * keyed by `rangeDays` (read from `useActivityStore`). Wave 3 Demeter swap
 * replaces the lookup with a real `fetch('/api/activity?days=X')` call +
 * 30s TTL cache + debounced scrub UI per Pythia contract validation steps.
 *
 * Compliance:
 *   Lock 1: clean. Lock 2: clean. Lock 5: mock boundary clearly delimited;
 *   Wave 3 swap surface (fetchActivityData) is a pure function ready to wire
 *   real endpoint.
 */

import { useMemo } from 'react';
import { useActivityStore, selectRangeDays } from './store';
import { MOCK_ACTIVITY_DATA } from './mockActivityData';
import type { ActivityData, ActivityQuery } from './types';

/**
 * Wave 3 fetch swap. Wave 2 stub returns mock data ignoring `repo` +
 * `district` params. Wave 3 Demeter swap implements real fetch.
 *
 * Signature deliberately matches Pythia contract shape so the Wave 3 swap is
 * a pure body-replacement (consumers unchanged).
 */
export async function fetchActivityData(
  query: ActivityQuery
): Promise<ActivityData> {
  // Wave 2 stub: lookup mock by rangeDays only.
  const data = MOCK_ACTIVITY_DATA[query.days];
  if (!data) {
    throw new Error(`No mock activity data for days=${query.days}`);
  }
  // Simulate Wave 3 async fetch (small delay for realism).
  await new Promise((resolve) => setTimeout(resolve, 80));
  return data;
}

/**
 * React hook: returns the current ActivityData synced with the Zustand store
 * `rangeDays` selector. Wave 2: synchronous lookup of pre-computed mock.
 *
 * Wave 3 swap pattern (do NOT change the consumer call sites):
 *   - Add a `useState<ActivityData|null>` + `useEffect(() => fetchActivityData)`
 *   - Add a loading state surfacing via the return tuple.
 *   - Add 30s TTL cache + abort signal for rapid range toggle.
 *
 * For Wave 2 simplicity + deterministic visual demo, we return the synchronous
 * mock data directly. The hook is called from inside Canvas children (HotspotGlow,
 * OwnershipHeatmap, TimelineMarkers) so the surface must be a plain getter.
 */
export function useActivityData(): ActivityData {
  const rangeDays = useActivityStore(selectRangeDays);
  return useMemo(() => MOCK_ACTIVITY_DATA[rangeDays], [rangeDays]);
}
