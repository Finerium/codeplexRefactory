/**
 * [MOCK Wave 2, real Wave 3 Demeter materialized view] Mock ActivityData.
 *
 * Owner: Boreas (Wave 2).
 * Contract: `_meta/contracts/boreas-to-demeter.md`.
 *
 * Deterministic mock derived from `mockCityData` (Iris Wave 1). Same import
 * = same activity data across reload. Wave 3 Demeter swap replaces with
 * real query from `commit_frequency_per_building` + `ownership_distribution`
 * materialized views.
 *
 * Activity translation: each Iris `BuildingData.activity` (0..1) maps to a
 * mock commit count via `Math.round(activity * 30)` per 30-day window. The
 * 60/90 day windows scale linearly (2x / 3x).
 *
 * Hotspot intensity: per Pythia `boreas-to-demeter.md` `HotspotIntensity.intensity`
 * is normalized within the query window (max commit count = 1.0).
 *
 * Compliance:
 *   Lock 1: clean. Lock 2: clean. Lock 5: [MOCK Wave 2 ...] label at top.
 */

import { mockCityData } from '@/scene/buildings';
import type {
  ActivityData,
  ActivitySummary,
  CommitActivity,
  HotspotIntensity,
  OwnershipDistribution,
  TimelineMarker,
} from './types';

/**
 * Convert Iris activity (0..1) to mock commit count for a `days` window.
 * Stable per (buildingId, days) input.
 */
function mockCommitCount(activity: number, days: number): number {
  return Math.round(activity * days);
}

/**
 * Generate per-day commit series. Distributes the building's `days`-window
 * commit count across the days range pseudo-randomly via a deterministic
 * hash of (buildingId, dayIndex). The resulting daily distribution is bursty
 * (some days have multiple commits, others none) so the scrubber sees a
 * realistic non-uniform timeline.
 */
function buildTimeline(days: number, nowMs: number): CommitActivity[] {
  const dayMs = 24 * 60 * 60 * 1000;
  const timeline: CommitActivity[] = [];

  for (let d = 0; d < days; d++) {
    const dayStartMs = nowMs - (days - 1 - d) * dayMs;
    const date = new Date(dayStartMs).toISOString().slice(0, 10);
    const buildingCommits: Record<string, number> = {};

    for (const building of mockCityData.buildings) {
      const totalCommits = mockCommitCount(building.activity, days);
      if (totalCommits === 0) continue;

      // Pseudo-random per (id, day) deterministic hash.
      let hash = 5381;
      const seedStr = `${building.id}:${d}`;
      for (let i = 0; i < seedStr.length; i++) {
        hash = ((hash << 5) + hash + seedStr.charCodeAt(i)) >>> 0;
      }
      // Probability that this building commits this day depends on its
      // overall activity; mean expected commits per day = totalCommits / days.
      const meanPerDay = totalCommits / days;
      // Bursty distribution: 1 commit with probability proportional to mean.
      // For mean > 1 (high activity), 1-3 commits some days.
      const rand = (hash % 1000) / 1000;
      const burst = Math.floor(meanPerDay * 2 + 1);
      const expected = meanPerDay > rand ? Math.min(burst, totalCommits) : 0;
      if (expected > 0) {
        buildingCommits[building.id] = expected;
      }
    }

    timeline.push({ date, buildingCommits });
  }

  return timeline;
}

/**
 * Compute hotspot intensities within window. Max commit count = 1.0 intensity.
 */
function buildHotspots(timeline: CommitActivity[]): HotspotIntensity[] {
  const totals = new Map<string, number>();
  const lastCommits = new Map<string, string>();

  for (const day of timeline) {
    for (const [id, count] of Object.entries(day.buildingCommits)) {
      totals.set(id, (totals.get(id) ?? 0) + count);
      lastCommits.set(id, day.date);
    }
  }

  if (totals.size === 0) return [];

  let maxCommitCount = 0;
  for (const c of totals.values()) {
    if (c > maxCommitCount) maxCommitCount = c;
  }
  if (maxCommitCount === 0) return [];

  const hotspots: HotspotIntensity[] = [];
  for (const [buildingId, commitCount] of totals.entries()) {
    hotspots.push({
      buildingId,
      intensity: commitCount / maxCommitCount,
      commitCount,
      // Convert "YYYY-MM-DD" to ISO 8601 timestamp at end of day UTC.
      lastCommitAt: `${lastCommits.get(buildingId) ?? ''}T23:59:59Z`,
    });
  }
  return hotspots;
}

/**
 * Build ownership distribution from Iris building.ownershipColor + a small
 * mock contributor pool. Wave 3 Demeter sources real top contributor per
 * `ownership_distribution` materialized view (6-month blame proxy).
 */
function buildOwnership(): OwnershipDistribution[] {
  const distributions: OwnershipDistribution[] = [];
  const mockOwners = [
    '@backend-team',
    '@frontend-team',
    '@platform',
    '@security',
    '@data',
    '@hafiz',
  ];

  for (const building of mockCityData.buildings) {
    // Derive primary owner from building id hash (matches mockCityData
    // ownership logic deterministically).
    let hash = 0;
    for (let i = 0; i < building.id.length; i++) {
      hash = (hash * 41 + building.id.charCodeAt(i)) | 0;
    }
    const primaryIdx = Math.abs(hash) % mockOwners.length;
    const primaryOwner = mockOwners[primaryIdx];

    // 70-90% share to primary, distribute remainder to 1-2 secondary.
    const primaryShare = 70 + (Math.abs(hash >> 8) % 20);
    const remaining = 100 - primaryShare;
    const secondaryCount = 1 + (Math.abs(hash >> 16) % 2);

    const contributors = [
      {
        githubLogin: primaryOwner,
        avatarUrl: '',
        sharePercent: primaryShare,
      },
    ];
    for (let i = 0; i < secondaryCount; i++) {
      const secondaryIdx = (primaryIdx + i + 1) % mockOwners.length;
      contributors.push({
        githubLogin: mockOwners[secondaryIdx],
        avatarUrl: '',
        sharePercent: remaining / secondaryCount,
      });
    }

    distributions.push({
      buildingId: building.id,
      primaryOwnerLogin: primaryOwner,
      primaryOwnerAvatar: '',
      primaryOwnerSharePercent: primaryShare,
      contributors,
    });
  }

  return distributions;
}

/**
 * Wave-Fixing #3 Manager FINAL: mock commit author pool, message templates,
 * and file path prefixes so per-cursor commit popup cards have realistic
 * deterministic content. Wave 3 Demeter swap replaces with real pr_events.
 */
const MOCK_AUTHORS = [
  '@hafiz',
  '@ghaisan',
  '@hera',
  '@boreas',
  '@athena',
  '@apollo',
  '@argus',
  '@clio',
];

const COMMIT_MSG_TEMPLATES = [
  'fix: handle null payload from {label} edge case',
  'refactor: extract {label} provider into hook',
  'feat: add {label} retry with exponential backoff',
  'chore: bump {label} test fixtures for 90d window',
  'fix: race condition in {label} subscribe pipeline',
  'perf: memoize {label} selector to drop re-render storm',
  'docs: clarify {label} contract for downstream worker',
  'test: cover {label} edge when scrubber at 0d boundary',
];

const PR_MSG_TEMPLATES = [
  'PR #{n} merged: rework {label} interface to support multi-tenant',
  'PR #{n} merged: extract {label} into standalone module',
  'PR #{n} merged: add {label} compatibility layer for legacy clients',
];

const RELEASE_TEMPLATES = [
  'release v0.{n}.0 tagged via {label}',
  'release v1.{n}.2 patch through {label}',
];

function pickFromHash<T>(arr: T[], hash: number): T {
  return arr[Math.abs(hash) % arr.length];
}

/**
 * Generate timeline markers (commit/pr_merged/release events). Wave 2 mock
 * generates one marker per high-activity building per ~5 day cluster. Wave
 * 3 Demeter sources from `pr_events` table directly.
 *
 * Wave-Fixing #3 Manager FINAL: extended with commit hash + message +
 * file path so the per-cursor popup card surfaces real-feeling content.
 * Density bumped from 2-4 markers per top-10 buildings to 4-7 markers per
 * top-20 buildings so scrubber drag yields a marker hit per ~1.5 day
 * interval (mock Wave 2 envelope).
 */
function buildTimelineMarkers(days: number, nowMs: number): TimelineMarker[] {
  const dayMs = 24 * 60 * 60 * 1000;
  const markers: TimelineMarker[] = [];

  // Take top 20 most active buildings (was 10) for denser scrubber timeline.
  const topActive = [...mockCityData.buildings]
    .sort((a, b) => b.activity - a.activity)
    .slice(0, 20);

  for (const building of topActive) {
    // 4-7 markers per top building across the window (was 2-4).
    let hash = 0;
    for (let i = 0; i < building.id.length; i++) {
      hash = (hash * 41 + building.id.charCodeAt(i)) | 0;
    }
    const markerCount = 4 + (Math.abs(hash) % 4);
    for (let m = 0; m < markerCount; m++) {
      const dayOffset = Math.abs(hash >> (m * 4)) % days;
      const hourJitter = Math.abs(hash >> (m * 3 + 1)) % 24;
      const timestamp =
        nowMs - dayOffset * dayMs - hourJitter * 60 * 60 * 1000;
      const typeRoll = Math.abs(hash >> (m * 2 + 1)) % 10;
      const eventType: TimelineMarker['eventType'] =
        typeRoll < 6 ? 'commit' : typeRoll < 9 ? 'pr_merged' : 'release';
      const authorHash = (hash + m * 17) >>> 0;
      const author = pickFromHash(MOCK_AUTHORS, authorHash);

      // Synthesize a 7-char short hash from (building, m, type) deterministic.
      const hashSource = `${building.id}${m}${eventType}`;
      let h = 5381;
      for (let i = 0; i < hashSource.length; i++) {
        h = ((h << 5) + h + hashSource.charCodeAt(i)) >>> 0;
      }
      const commitHash = h.toString(16).slice(0, 7).padEnd(7, '0');

      // File path: building.id is the relative path in the real data
      // surface (Iris contract); strip leading slash for display.
      const filePath = building.id.replace(/^\/+/, '');

      // Compose message from template family.
      let title: string;
      let commitMessage: string;
      const prNumber = (Math.abs(hash >> (m * 5 + 2)) % 480) + 20;
      if (eventType === 'commit') {
        const tpl = pickFromHash(COMMIT_MSG_TEMPLATES, authorHash);
        commitMessage = tpl.replaceAll('{label}', building.label);
        title = `commit ${building.label}`;
      } else if (eventType === 'pr_merged') {
        const tpl = pickFromHash(PR_MSG_TEMPLATES, authorHash);
        commitMessage = tpl
          .replaceAll('{label}', building.label)
          .replace('{n}', String(prNumber));
        title = `PR #${prNumber} merged ${building.label}`;
      } else {
        const tpl = pickFromHash(RELEASE_TEMPLATES, authorHash);
        const minor = (Math.abs(hash >> (m * 5 + 3)) % 12) + 1;
        commitMessage = tpl
          .replaceAll('{label}', building.label)
          .replace('{n}', String(minor));
        title = `release v0.${minor}.0 ${building.label}`;
      }

      markers.push({
        id: `${building.id}-marker-${m}`,
        timestamp,
        eventType,
        buildingId: building.id,
        title,
        authorLogin: author,
        commitHash,
        commitMessage,
        filePath,
      });
    }
  }

  // Sort ascending by timestamp for predictable rail rendering.
  markers.sort((a, b) => a.timestamp - b.timestamp);
  return markers;
}

/**
 * Compute summary metrics from timeline + hotspots.
 */
function buildSummary(
  hotspots: HotspotIntensity[],
  ownership: OwnershipDistribution[]
): ActivitySummary {
  let totalCommits = 0;
  let mostActiveBuilding = '';
  let mostActiveCount = 0;
  for (const h of hotspots) {
    totalCommits += h.commitCount;
    if (h.commitCount > mostActiveCount) {
      mostActiveCount = h.commitCount;
      mostActiveBuilding = h.buildingId;
    }
  }

  // Most active owner: count primaryOwnerLogin frequency among hotspot ids.
  const ownerCount = new Map<string, number>();
  const ownershipById = new Map(ownership.map((o) => [o.buildingId, o]));
  for (const h of hotspots) {
    const dist = ownershipById.get(h.buildingId);
    if (!dist) continue;
    ownerCount.set(
      dist.primaryOwnerLogin,
      (ownerCount.get(dist.primaryOwnerLogin) ?? 0) + h.commitCount
    );
  }
  let mostActiveOwner = '';
  let mostActiveOwnerCount = 0;
  for (const [owner, count] of ownerCount.entries()) {
    if (count > mostActiveOwnerCount) {
      mostActiveOwnerCount = count;
      mostActiveOwner = owner;
    }
  }

  const uniqueContributors = new Set<string>();
  for (const dist of ownership) {
    for (const c of dist.contributors) {
      uniqueContributors.add(c.githubLogin);
    }
  }

  return {
    totalCommits,
    uniqueContributors: uniqueContributors.size,
    mostActiveBuilding,
    mostActiveOwner,
  };
}

/**
 * Build full ActivityData for a given `days` window. Memoization handled
 * outside this function (`./useActivityData.ts`).
 *
 * `nowMs` parameter is the "current time" anchor; defaults to Date.now() but
 * tests may inject a fixed timestamp for determinism. The mock building
 * activity hash is independent of nowMs so swapping nowMs only shifts the
 * marker / timeline date labels.
 */
export function buildMockActivityData(
  days: 30 | 60 | 90,
  nowMs: number = Date.now()
): ActivityData {
  const timeline = buildTimeline(days, nowMs);
  const hotspots = buildHotspots(timeline);
  const ownership = buildOwnership();
  const timelineMarkers = buildTimelineMarkers(days, nowMs);
  const summary = buildSummary(hotspots, ownership);

  return {
    timeline,
    hotspots,
    ownership,
    summary,
    timelineMarkers,
    rangeDays: days,
  };
}

/**
 * Pre-computed activity datasets for the 3 default windows.
 *
 * NowMs anchored to a stable build-time constant so server + client SSR
 * agree on timestamps (avoid Date.now() hydration mismatch). The constant
 * is set to 2026-05-12T12:00:00Z = hackathon day 1 noon UTC. Wave 3 swap
 * with real Demeter fetch sources timestamps from the materialized view
 * (no hydration mismatch because data flows through React state, not
 * module load).
 */
const ANCHORED_NOW_MS = Date.UTC(2026, 4, 12, 12, 0, 0); // 2026-05-12T12:00:00Z

export const MOCK_ACTIVITY_DATA: Record<30 | 60 | 90, ActivityData> = {
  30: buildMockActivityData(30, ANCHORED_NOW_MS),
  60: buildMockActivityData(60, ANCHORED_NOW_MS),
  90: buildMockActivityData(90, ANCHORED_NOW_MS),
};

/**
 * Public anchored "now" constant. Components compute cursor + range bounds
 * against this to stay deterministic (same SSR + client tree).
 */
export const ACTIVITY_ANCHORED_NOW_MS = ANCHORED_NOW_MS;
