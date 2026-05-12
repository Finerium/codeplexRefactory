/**
 * Dashboard query interface (Wave 1 frontend producer; Wave 3 Demeter consumer).
 *
 * Authored by Selene (Wave 1) per Pythia contract `_meta/contracts/selene-to-demeter.md`.
 * Demeter Wave 3 implements the consumer endpoint at `GET /api/dashboard` returning
 * `DashboardData` JSON with the matching query parameter signature.
 */

import type { DashboardData, TimeRangeId } from './types';

/** Filter parameters accepted by the dashboard endpoint. */
export interface DashboardQuery {
  /** Time range filter. */
  range: TimeRangeId;
  /** Repo filter; "all" aggregates cross-repo, full name (owner/repo) for single repo. */
  repo: string | 'all';
  /** Sprint identifier override; default current sprint if omitted. */
  sprint?: string;
}

/**
 * Frontend-facing fetch API. Wave 1 implementation in `useDashboardData` returns
 * the in-bundle mock JSON; Wave 3 swap calls the Demeter endpoint transparently.
 */
export interface DashboardQueryAPI {
  /** Fetch dashboard payload for the given query. */
  fetchDashboard(query: DashboardQuery): Promise<DashboardData>;
}

/**
 * Serializes a `DashboardQuery` into the URL search-string consumed by the
 * Demeter endpoint. Omits `sprint` when undefined, omits `repo` when `"all"` so
 * the backend default applies.
 */
export function buildDashboardQueryString(query: DashboardQuery): string {
  const params = new URLSearchParams();
  params.set('range', query.range);
  if (query.repo && query.repo !== 'all') {
    params.set('repo', query.repo);
  }
  if (query.sprint) {
    params.set('sprint', query.sprint);
  }
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}
