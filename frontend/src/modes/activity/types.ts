/**
 * Activity Mode public types.
 *
 * Owner: Boreas (Wave 2).
 * Contracts:
 *   - `_meta/contracts/boreas-to-demeter.md` (locked Wave 0 Pythia, request
 *     schema + ActivityData response shape).
 *   - `_meta/contracts/demeter-to-boreas.md` (Wave 3 Demeter implementation
 *     perspective + materialized view refresh semantics).
 *
 * Wave 2 Boreas authors mock ActivityData at `./mockActivityData.ts`
 * (deterministic, derived from `mockCityData` building activity hash).
 * Wave 3 Demeter swaps mock with real materialized view query.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 *   Lock 5 (honest claim): MOCK boundary lives in `./mockActivityData.ts`
 *     only; this types file is canonical for Wave 2 + Wave 3.
 */

/**
 * Activity query request shape. Matches Pythia contract
 * `boreas-to-demeter.md` `ActivityQuery` Section "Output schema" line 26-32.
 *
 * Boreas Wave 2 hook stub returns mock data ignoring `repo` + `district`.
 * Wave 3 Demeter implements full query.
 */
export interface ActivityQuery {
  /** Time range in days from now. */
  days: 30 | 60 | 90;
  /** Optional repo filter; "all" aggregates across user-accessible repos. */
  repo: string | 'all';
  /** Optional district filter. */
  district?: string;
}

/**
 * Per-day commit activity series. One entry per ISO 8601 day in the
 * `days` window. `buildingCommits` maps Iris BuildingData.id to per-building
 * commit count that day.
 */
export interface CommitActivity {
  /** ISO 8601 date (day granularity, e.g., "2026-05-12"). */
  date: string;
  /** Per-building commit count this day. Buildings absent = 0 commits. */
  buildingCommits: Record<string, number>;
}

/**
 * One contributor within an ownership distribution. Share percent sums to
 * ~100 across all contributors per building.
 */
export interface OwnershipContributor {
  /** GitHub login including @ prefix. */
  githubLogin: string;
  /** Avatar URL or empty Wave 2 placeholder. */
  avatarUrl: string;
  /** Share percent 0..100. */
  sharePercent: number;
}

/**
 * Ownership distribution per building. Top contributor by lines changed in
 * last 6 months (mock Wave 2 + materialized view nightly Wave 3).
 */
export interface OwnershipDistribution {
  /** Building id. */
  buildingId: string;
  /** Top owner login (with @ prefix). */
  primaryOwnerLogin: string;
  /** Top owner avatar URL or empty Wave 2 placeholder. */
  primaryOwnerAvatar: string;
  /** Top owner share percent 0..100. */
  primaryOwnerSharePercent: number;
  /** All contributors with share, ordered descending by share. */
  contributors: OwnershipContributor[];
}

/**
 * Hotspot intensity per building. Normalized to [0..1] within the query
 * window: max intensity = 1.0 = building with most commits in window.
 */
export interface HotspotIntensity {
  /** Building id. */
  buildingId: string;
  /** Intensity 0..1 normalized within window. Drives glow size + tint. */
  intensity: number;
  /** Raw commit count in window. */
  commitCount: number;
  /** Last commit timestamp ISO 8601. */
  lastCommitAt: string;
}

/**
 * Aggregate summary metrics for the query window. Shown above scrubber in
 * Activity HUD.
 */
export interface ActivitySummary {
  /** Total commits in window across all buildings. */
  totalCommits: number;
  /** Unique contributor count. */
  uniqueContributors: number;
  /** Building id with most commits. */
  mostActiveBuilding: string;
  /** Owner login with most commits. */
  mostActiveOwner: string;
}

/**
 * One timeline marker visible on the scrubber rail. Mock Wave 2 generates
 * markers from mock commit events. Wave 3 Demeter sources from pr_events
 * table joined with materialized view.
 *
 * Wave-Fixing #3 Manager FINAL: extended with commit detail fields so the
 * scrubber per-cursor popup card surfaces hash + message + file affected.
 * Demeter Wave 3 swap populates these from pr_events real data; mock Wave
 * 2 generates deterministic placeholders labeled MOCK.
 */
export interface TimelineMarker {
  /** Unique marker id. */
  id: string;
  /** Unix timestamp ms. */
  timestamp: number;
  /** Event type drives marker color. */
  eventType: 'commit' | 'pr_merged' | 'release';
  /** Building id associated with the event. */
  buildingId: string;
  /** Display title (e.g., "PR #234 merged: extract auth service"). */
  title: string;
  /** Optional GitHub author login. */
  authorLogin?: string;
  /** Short commit hash (7 char). Wave-Fixing #3 extension. */
  commitHash?: string;
  /** Commit message body or PR summary. Wave-Fixing #3 extension. */
  commitMessage?: string;
  /** Primary file path affected by the commit. Wave-Fixing #3 extension. */
  filePath?: string;
}

/**
 * Full ActivityData response shape. Wave 2 Boreas mock derives from
 * mockCityData hashes; Wave 3 Demeter materializes from pr_events.
 */
export interface ActivityData {
  /** Per-day commit series. */
  timeline: CommitActivity[];
  /** Per-building hotspot intensities. */
  hotspots: HotspotIntensity[];
  /** Per-building ownership distribution. */
  ownership: OwnershipDistribution[];
  /** Aggregate summary metrics. */
  summary: ActivitySummary;
  /**
   * Wave 2 + Wave 3 extension over Pythia contract: explicit timeline
   * markers for the scrubber rail. Pythia contract's `CommitActivity`
   * carries daily counts; Boreas adds discrete event markers for visual
   * landmarks on the rail. Wave 3 Demeter populates from `pr_events`
   * directly (no separate query, single endpoint adds this array).
   */
  timelineMarkers: TimelineMarker[];
  /**
   * Wave 2 + Wave 3 echo of the query for state coherence. Useful so the
   * UI can validate fetched data matches the current `rangeDays` toggle.
   */
  rangeDays: 30 | 60 | 90;
}

/**
 * Local UI state for Activity Mode. Lives in Zustand store
 * `./store.ts`. Persisted in memory only (Wave 2 + Wave 3 demo posture).
 */
export interface TimelineState {
  /** Time range toggle. */
  rangeDays: 30 | 60 | 90;
  /** Scrubber cursor 0..1 within range. */
  scrubberPosition: number;
  /** Toggle ownership heatmap recolor. */
  ownershipHeatmapActive: boolean;
}
