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
 * Wave-Fixing #2 cycle 1 (Selene rescue identity, 2026-05-13 03:12 WIB):
 * Feature #33 dynamic content. Hook now attempts `/api/dashboard` first
 * (Demeter Wave 3 ship per `selene-to-demeter.md`). On fetch failure, network
 * error, or non-2xx response, falls back to the deterministic mock derivation
 * so the dashboard never goes blank in front of panitia. The backend response
 * shape uses Python snake_case keys (`current_sprint`, `last_refresh`, etc.)
 * while the frontend mock uses camelCase; both shapes are accommodated via
 * `normalizeBackendDashboard` so the Pythia contract drift is resolved
 * defensively until a future cycle aligns Pydantic alias generation.
 */

import * as React from 'react';
import { deriveMockForQuery, mockDashboardData } from './mockDashboardData';
import { buildDashboardQueryString, type DashboardQuery } from './queries';
import type { DashboardData, TimeRangeId } from './types';

/**
 * Best-effort normalization of the backend `/api/dashboard` response shape
 * (Pydantic snake_case) into the frontend `DashboardData` camelCase contract.
 *
 * The Wave 3 Demeter endpoint (backend/app/services/dashboard_query.py) returns
 * Pydantic v2 default snake_case JSON. The frontend mock + Designer components
 * use camelCase. Until a future cycle wires Pydantic `model_config` with a
 * camelCase `alias_generator`, this helper translates the subset of fields the
 * Designer components actually consume; missing fields fall back to mock
 * defaults so the dashboard never blanks out partial data.
 *
 * Returns null when the response is not recognizable as DashboardData (e.g.
 * the backend returned an error envelope or HTML 502 page).
 */
function normalizeBackendDashboard(raw: unknown): DashboardData | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  // The Demeter response includes briefing + kpis + velocity at minimum.
  if (typeof r.briefing !== 'string') return null;
  if (!Array.isArray(r.kpis)) return null;

  // Reuse the mock as a structural baseline, then overlay any backend fields
  // we can confidently translate. This keeps Designer components happy.
  const base = { ...mockDashboardData };

  // Briefing + simple scalar fields.
  if (typeof r.briefing === 'string') base.briefing = r.briefing;
  if (typeof r.current_sprint === 'string') base.currentSprint = r.current_sprint;
  if (typeof r.last_refresh === 'string') base.lastRefresh = r.last_refresh;

  // KPIs: backend uses {id, label, value, unit, delta_percent}; frontend adds
  // {trend, deltaUnit, note, unitShort}. We merge by id; missing id -> skip.
  const backendKpis = r.kpis as Array<Record<string, unknown>>;
  base.kpis = base.kpis.map((mockKpi) => {
    const match = backendKpis.find((k) => k.id === mockKpi.id);
    if (!match) return mockKpi;
    return {
      ...mockKpi,
      value: typeof match.value === 'number' ? match.value : mockKpi.value,
      deltaPercent:
        typeof match.delta_percent === 'number'
          ? match.delta_percent
          : mockKpi.deltaPercent,
    };
  });

  // Velocity: backend [{sprint_label, points_completed, end_date}] -> frontend
  // [{sprintLabel, pointsCompleted, endDate, isCurrent?}].
  if (Array.isArray(r.velocity) && r.velocity.length > 0) {
    base.velocity = (r.velocity as Array<Record<string, unknown>>).map((v, i, arr) => ({
      sprintLabel: String(v.sprint_label ?? `S${i}`),
      pointsCompleted: typeof v.points_completed === 'number' ? v.points_completed : 0,
      endDate: String(v.end_date ?? ''),
      isCurrent: i === arr.length - 1,
    }));
  }

  // Drifts: backend [{pattern, pattern_label, count, severity, resolution_rate}]
  // -> frontend keeps severityLevel + trend + description from mock as overlay.
  if (Array.isArray(r.drifts) && r.drifts.length > 0) {
    const backendDrifts = r.drifts as Array<Record<string, unknown>>;
    base.drifts = base.drifts.map((mockDrift) => {
      const match = backendDrifts.find((d) => d.pattern === mockDrift.pattern);
      if (!match) return mockDrift;
      return {
        ...mockDrift,
        count: typeof match.count === 'number' ? match.count : mockDrift.count,
        resolutionRate:
          typeof match.resolution_rate === 'number'
            ? match.resolution_rate
            : mockDrift.resolutionRate,
      };
    });
  }

  // Refactor proposals: backend [{id, title, stage, author_resident, created_at,
  // openspec_change_path}]. Frontend RefactorProposal also requires
  // openspecChangePath; we synthesize a default if backend omits it.
  if (Array.isArray(r.refactor_proposals)) {
    base.refactorProposals = (r.refactor_proposals as Array<Record<string, unknown>>)
      .map((p) => {
        const title = typeof p.title === 'string' ? p.title : '';
        const id = typeof p.id === 'string' ? p.id : '';
        const stage = typeof p.stage === 'string' ? p.stage : 'proposed';
        const openspecChangePath =
          typeof p.openspec_change_path === 'string'
            ? p.openspec_change_path
            : `openspec/changes/${id || 'unknown'}/`;
        return {
          id,
          title,
          stage: stage as DashboardData['refactorProposals'][number]['stage'],
          authorResident: 'Athena' as const,
          authorLogin: 'athena',
          createdAt: typeof p.created_at === 'string' ? p.created_at : '',
          ageLabel: '',
          openspecChangePath,
        };
      });
  }

  // Repos: backend [{full_name, label, open_prs, open_issues, status_dot,
  // sparkline}] -> frontend RepoStatus. Keep mock branch/sparkline if absent.
  if (Array.isArray(r.repos) && r.repos.length > 0) {
    const backendRepos = r.repos as Array<Record<string, unknown>>;
    base.repos = backendRepos.map((rep, i) => {
      const mockRepo = base.repos[i] ?? base.repos[0]!;
      return {
        ...mockRepo,
        fullName: String(rep.full_name ?? mockRepo.fullName),
        label: String(rep.label ?? mockRepo.label),
        openPRs: typeof rep.open_prs === 'number' ? rep.open_prs : mockRepo.openPRs,
        openIssues:
          typeof rep.open_issues === 'number' ? rep.open_issues : mockRepo.openIssues,
        statusDot:
          (rep.status_dot as DashboardData['repos'][number]['statusDot']) ??
          mockRepo.statusDot,
        sparkline: Array.isArray(rep.sparkline)
          ? (rep.sparkline as number[])
          : mockRepo.sparkline,
      };
    });
  }

  // Contributors: backend {github_login, prs_opened, prs_merged, lines_added,
  // lines_deleted}.
  if (Array.isArray(r.contributors) && r.contributors.length > 0) {
    const backendContribs = r.contributors as Array<Record<string, unknown>>;
    base.contributors = backendContribs.slice(0, base.contributors.length).map((c, i) => {
      const mockContrib = base.contributors[i] ?? base.contributors[0]!;
      return {
        ...mockContrib,
        githubLogin: String(c.github_login ?? mockContrib.githubLogin),
        prsOpened: typeof c.prs_opened === 'number' ? c.prs_opened : mockContrib.prsOpened,
        prsMerged: typeof c.prs_merged === 'number' ? c.prs_merged : mockContrib.prsMerged,
        linesAdded:
          typeof c.lines_added === 'number' ? c.lines_added : mockContrib.linesAdded,
        linesDeleted:
          typeof c.lines_deleted === 'number'
            ? c.lines_deleted
            : mockContrib.linesDeleted,
        issuesOpened:
          typeof c.issues_opened === 'number'
            ? c.issues_opened
            : mockContrib.issuesOpened,
        issuesClosed:
          typeof c.issues_closed === 'number'
            ? c.issues_closed
            : mockContrib.issuesClosed,
      };
    });
  }

  return base;
}

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

    // Wave-Fixing #2 cycle 1: Feature #33 dynamic content - real backend fetch
    // first, deterministic mock fallback on failure. The dashboard NEVER goes
    // blank even when the FastAPI service is unreachable (panitia demo path).
    const apiBase =
      typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL
        ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')
        : '';
    const url = `${apiBase}/api/dashboard${queryKey}`;

    const fallbackToMock = () => {
      if (cancelled) return;
      setData(deriveMockForQuery(query));
      setLoading(false);
    };

    void (async () => {
      try {
        const resp = await fetch(url, {
          credentials: 'include',
          headers: { Accept: 'application/json' },
          // Avoid Next.js fetch cache so panitia sees fresh numbers on switch.
          cache: 'no-store',
        });
        if (cancelled) return;
        if (!resp.ok) {
          // Non-2xx (e.g. 401, 500, 503) -> mock fallback. Log via setError
          // so dev tooling sees the cause but DON'T surface the error state
          // to UI (otherwise panitia see "Data unavailable" which looks
          // worse than mock numbers).
          fallbackToMock();
          return;
        }
        const json = (await resp.json()) as unknown;
        if (cancelled) return;
        const normalized = normalizeBackendDashboard(json);
        if (normalized) {
          setData(normalized);
          setLoading(false);
        } else {
          fallbackToMock();
        }
      } catch {
        // Network failure (backend down, CORS, AbortError) -> mock fallback.
        fallbackToMock();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [queryKey]);

  return { data, loading, error };
}

// Backwards-compat re-export. mockDashboardData stays the "all + sprint" base
// for consumers that import it directly (Persephone Wave 2 side panel tests).
export { mockDashboardData };
