'use client';

/**
 * useDashboardData. Client hook that returns dashboard payload + loading + error.
 *
 * Wave 1 implementation: returns the bundled mock JSON after a single render to
 * exercise the loading transition; no network roundtrip. Mock is labeled
 * `[MOCK Wave 1, real Wave 3 Demeter]` per Lock 5 honest claim discipline.
 *
 * [STUB: Wave 3 Demeter integration]
 * Wave 3 swap: replace the `setData(mockDashboardData)` branch with a fetch to
 * `/api/dashboard${buildDashboardQueryString(query)}` per Pythia contract
 * `_meta/contracts/selene-to-demeter.md`. The Pydantic alias generator emits
 * camelCase JSON so the response shape matches `DashboardData` verbatim.
 */

import * as React from 'react';
import { mockDashboardData } from './mockDashboardData';
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
 * Wave 1 mock-backed dashboard data hook.
 *
 * Behavior:
 * - Initial render: loading=true, data=null, error=null
 * - After microtask flush: loading=false, data=mockDashboardData, error=null
 * - Query change (range / repo / sprint) re-triggers the loading transition
 *
 * Wave 3 Demeter swap replaces the microtask with a real fetch call against the
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
    Promise.resolve().then(() => {
      if (cancelled) return;
      setData(mockDashboardData);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [queryKey]);

  return { data, loading, error };
}
