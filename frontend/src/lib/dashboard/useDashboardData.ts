'use client';

/**
 * useDashboardData. Client hook that returns dashboard payload + loading + error.
 *
 * Wave 1 implementation: returns the bundled mock JSON after a single render to
 * exercise the loading transition; no network roundtrip. Mock is labeled
 * `[MOCK Wave 1, real Wave 3 Demeter]` per Lock 5 honest claim discipline.
 *
 * Wave-Fixing cycle 1 (Selene rescue identity, 2026-05-13 01:47 WIB): bug D-1
 * fix - mock data is now derived per (repo, range) tuple via
 * `deriveMockForQuery` so swapping repo OR time window in DashboardClient
 * produces visibly different KPI / velocity / burndown numbers and city
 * preview corner. Without this derivation the dropdown + segmented control
 * change labels only and panitia perceive no-op (D-1 reproduction screenshot
 * `_meta/qa_screenshots/DashboardConnect.png`).
 *
 * [STUB: Wave 3 Demeter integration]
 * Wave 3 swap: replace the `setData(deriveMockForQuery(query))` branch with a
 * fetch to `/api/dashboard${buildDashboardQueryString(query)}` per Pythia
 * contract `_meta/contracts/selene-to-demeter.md`. The Pydantic alias generator
 * emits camelCase JSON so the response shape matches `DashboardData` verbatim.
 */

import * as React from 'react';
import { deriveMockForQuery, mockDashboardData } from './mockDashboardData';
import { buildDashboardQueryString, type DashboardQuery } from './queries';
import type { DashboardData, TimeRangeId } from './types';

export interface UseDashboardDataOptions {
  /** Time range filter; default "sprint". */
  range?: TimeRangeId;
  /** Repo filter; "all" aggregates cross-repo. Default "all". */
  repo?: string | 'all';
  /** Sprint identifier override. */
  sprint?: string;
}

export interface UseDashboardDataResult {
  data: DashboardData | null;
  loading: boolean;
  error: Error | null;
}

/** Default query used when caller omits an option. */
function resolveQuery(options: UseDashboardDataOptions | undefined): DashboardQuery {
  return {
    range: options?.range ?? 'sprint',
    repo: options?.repo ?? 'all',
    ...(options?.sprint ? { sprint: options.sprint } : {}),
  };
}

/**
 * Wave 1 mock-backed dashboard data hook (Wave-Fixing cycle 1 patched).
 *
 * Behavior:
 * - Initial render: loading=true, data=null, error=null
 * - After 120ms timer: loading=false, data=deriveMockForQuery(query), error=null
 * - Query change (range / repo / sprint) re-triggers the loading transition
 *   AND yields different numbers per (repo, range) tuple (bug D-1 fix).
 *
 * Wave 3 Demeter swap replaces the timer with a real fetch call against the
 * `/api/dashboard` endpoint (see [STUB: Wave 3 Demeter integration] above).
 */
export function useDashboardData(
  options?: UseDashboardDataOptions,
): UseDashboardDataResult {
  const query = resolveQuery(options);
  const queryKey = React.useMemo(
    () => buildDashboardQueryString(query),
    // Stable string key so React only re-runs when serialized query changes.
    [query.range, query.repo, query.sprint], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const [data, setData] = React.useState<DashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    // [STUB: Wave 3 Demeter integration]
    // Replace this block with:
    //   fetch(`/api/dashboard${queryKey}`, { credentials: 'include' })
    //     .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    //     .then((json: DashboardData) => { if (!cancelled) { setData(json); setLoading(false); } })
    //     .catch((e: Error) => { if (!cancelled) { setError(e); setLoading(false); } });
    //
    // Wave-Fixing cycle 1: derive deterministic variants per (repo, range)
    // tuple so D-1 (no-op switching) is fixed on mock path. 120ms delay gives
    // visible loading state cue so the panitia perceive a real refetch.
    const timer = setTimeout(() => {
      if (cancelled) return;
      setData(deriveMockForQuery(query));
      setLoading(false);
    }, 120);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [queryKey]);

  return { data, loading, error };
}

// Backwards-compat re-export. mockDashboardData stays the "all + sprint" base
// for consumers that import it directly (Persephone Wave 2 side panel tests).
export { mockDashboardData };
