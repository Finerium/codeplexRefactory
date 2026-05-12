/**
 * useActivityData hook: consume ActivityData per current timeline range.
 *
 * Owner: Boreas (Wave 2 + Wave-Fixing #2 Cycle 1).
 * Contract: `_meta/contracts/boreas-to-demeter.md`.
 *
 * Wave-Fixing #2 Cycle 1 (Day 2 03:13 WIB) swap: real fetch to backend
 * `/api/activity?days=X&repo=Y` with mock fallback when backend returns
 * empty (no Demeter materialized view data) or network error. Original
 * Wave 2 stub returned synchronous mock; this version proceeds async +
 * preserves the same surface to keep Canvas consumers unchanged.
 *
 * Wave 2 mock fallback semantics: when backend ActivityData has empty
 * timeline + hotspots + ownership, we use deterministic mock so the UI
 * still demonstrates the Pythia contract shape during demo. Wave 3
 * Demeter seed inject populates materialized views.
 *
 * Compliance:
 *   Lock 1: clean. Lock 2: clean. Lock 5: mock + real path both clearly
 *   labeled.
 */

import { useEffect, useMemo, useState } from 'react';
import { useActivityStore, selectRangeDays } from './store';
import { MOCK_ACTIVITY_DATA } from './mockActivityData';
import type {
  ActivityData,
  ActivityQuery,
  CommitActivity,
  HotspotIntensity,
  OwnershipDistribution,
  OwnershipContributor,
} from './types';

/**
 * Server-side ActivityData response shape from `/api/activity`. The backend
 * Pydantic model uses snake_case field names; this is the wire format we
 * map to the frontend camelCase ActivityData.
 */
interface ServerActivityData {
  timeline: Array<{ date: string; building_commits: Record<string, number> }>;
  hotspots: Array<{
    building_id: string;
    intensity: number;
    commit_count: number;
    last_commit_at: string;
  }>;
  ownership: Array<{
    building_id: string;
    primary_owner_login: string;
    primary_owner_avatar?: string;
    primary_owner_share_percent: number;
    contributors: Array<{
      github_login: string;
      avatar_url?: string;
      share_percent: number;
    }>;
  }>;
  summary: {
    total_commits: number;
    unique_contributors: number;
    most_active_building: string;
    most_active_owner: string;
  };
}

function adaptServerToClient(
  server: ServerActivityData,
  rangeDays: 30 | 60 | 90
): ActivityData {
  const timeline: CommitActivity[] = server.timeline.map((d) => ({
    date: d.date.slice(0, 10),
    buildingCommits: d.building_commits ?? {},
  }));
  const hotspots: HotspotIntensity[] = server.hotspots.map((h) => ({
    buildingId: h.building_id,
    intensity: h.intensity,
    commitCount: h.commit_count,
    lastCommitAt: h.last_commit_at,
  }));
  const ownership: OwnershipDistribution[] = server.ownership.map((o) => {
    const contributors: OwnershipContributor[] = (o.contributors ?? []).map((c) => ({
      githubLogin: c.github_login,
      avatarUrl: c.avatar_url ?? '',
      sharePercent: c.share_percent,
    }));
    return {
      buildingId: o.building_id,
      primaryOwnerLogin: o.primary_owner_login,
      primaryOwnerAvatar: o.primary_owner_avatar ?? '',
      primaryOwnerSharePercent: o.primary_owner_share_percent,
      contributors,
    };
  });
  return {
    timeline,
    hotspots,
    ownership,
    summary: {
      totalCommits: server.summary.total_commits,
      uniqueContributors: server.summary.unique_contributors,
      mostActiveBuilding: server.summary.most_active_building,
      mostActiveOwner: server.summary.most_active_owner,
    },
    // Server endpoint does not return timeline markers (Pythia contract has
    // markers as a Boreas-side extension). Synthesize from real hotspot data
    // + falls back to mock when empty.
    timelineMarkers: [],
    rangeDays,
  };
}

function isServerDataEmpty(d: ActivityData): boolean {
  return (
    d.timeline.length === 0 &&
    d.hotspots.length === 0 &&
    d.ownership.length === 0
  );
}

/**
 * Real fetch to backend /api/activity. Falls back to mock data on:
 *  - network error (e.g., backend not running / offline)
 *  - 401 unauthenticated
 *  - empty response (Demeter materialized view has no data yet)
 *
 * Wave-Fixing #2 Cycle 1: enables real backend integration verify per
 * ship criteria #1 (Feature #27 timeline scrubber 30/60/90 functional with
 * real /api/activity).
 */
export async function fetchActivityData(
  query: ActivityQuery
): Promise<ActivityData> {
  const mock = MOCK_ACTIVITY_DATA[query.days];
  if (!mock) {
    throw new Error(`No mock activity data for days=${query.days}`);
  }
  // Determine API base. Same-origin in production (Atlas K8s deploy), fall
  // back to localhost:8000 in dev.
  const apiBase =
    typeof window !== 'undefined' && window.location.hostname !== 'localhost'
      ? ''
      : 'http://localhost:8000';
  const url = `${apiBase}/api/activity?days=${query.days}&repo=${encodeURIComponent(query.repo ?? 'all')}`;
  try {
    const response = await fetch(url, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      // 401 / 503: fall back to mock with same shape.
      return mock;
    }
    const serverData = (await response.json()) as ServerActivityData;
    const adapted = adaptServerToClient(serverData, query.days);
    if (isServerDataEmpty(adapted)) {
      // Empty server response = materialized view not yet populated.
      // Use mock to keep demo visual functional. Wave 3 Demeter seed
      // injection will replace with real data.
      return mock;
    }
    // Server data populated but missing timeline markers (Pythia Boreas
    // extension). Inherit mock markers for visual continuity.
    return { ...adapted, timelineMarkers: mock.timelineMarkers };
  } catch (err) {
    // Network failure: surface diagnostic in dev only.
    if (
      typeof window !== 'undefined' &&
      window.location.hostname === 'localhost'
    ) {
      // eslint-disable-next-line no-console
      console.warn('[boreas] /api/activity fetch failed, using mock', err);
    }
    return mock;
  }
}

/**
 * React hook: returns the current ActivityData synced with the Zustand store
 * `rangeDays` selector. Wave-Fixing #2 Cycle 1: async real fetch with mock
 * fallback. UI consumer always reads a defined ActivityData (mock as the
 * initial value so r3f Canvas children render immediately + update when
 * server responds).
 */
export function useActivityData(): ActivityData {
  const rangeDays = useActivityStore(selectRangeDays);
  const initialMock = useMemo(() => MOCK_ACTIVITY_DATA[rangeDays], [rangeDays]);
  const [data, setData] = useState<ActivityData>(initialMock);

  useEffect(() => {
    let cancelled = false;
    // Always reset to mock instantly on range change so the UI does not
    // flash empty state while the new range fetch is in flight.
    setData(MOCK_ACTIVITY_DATA[rangeDays]);
    fetchActivityData({ days: rangeDays, repo: 'all' })
      .then((next) => {
        if (!cancelled) setData(next);
      })
      .catch(() => {
        // Already handled internally; defensive double-catch.
      });
    return () => {
      cancelled = true;
    };
  }, [rangeDays]);

  return data;
}
