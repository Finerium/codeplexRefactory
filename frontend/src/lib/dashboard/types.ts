/**
 * Dashboard data shapes (canonical TypeScript types).
 *
 * Authored by Selene (Wave 1) per Pythia contracts:
 * - `_meta/contracts/selene-to-persephone.md` (Wave 2 Persephone consume for side panel mode variants)
 * - `_meta/contracts/selene-to-demeter.md` (Wave 3 Demeter implement as FastAPI endpoint)
 *
 * Field naming is the single source of truth. Persephone Wave 2 imports from
 * `@/lib/dashboard/types`. Demeter Wave 3 mirrors via Pydantic models with
 * camelCase JSON alias generator (see selene-to-demeter contract).
 *
 * Shape augmentations beyond the raw contract (Selene Wave 1 additions):
 * - `KPIMetric.trend` + `KPIMetric.unitShort` + `KPIMetric.deltaUnit` + `KPIMetric.note`
 *   are presentational fields the Designer bundle prescribed (see KpiGlance component).
 * - `BurndownMeta` carries dashboard chart context (sprintLabel, todayIndex,
 *   daysToShip, pointsRemaining, pointsTotal) outside the BurndownPoint series.
 * - `VelocityPoint.isCurrent` flags the current sprint bar for accent fill.
 * - `ContributorStats.displayName` + `ContributorStats.reviewsSubmitted` mirror
 *   the Designer Contributors list (name + handle + PR bar + review count).
 * - `DriftSummary.severityLevel` (1..5) + `DriftSummary.patternDescription` +
 *   `DriftSummary.district` + `DriftSummary.trend` (signed delta string) drive
 *   the 5-bar severity meter, trend column, and tinted Pattern E row.
 * - `RefactorProposal.authorLogin` + `RefactorProposal.ageLabel` drive the
 *   kanban card meta line (`@handle` + age).
 * - `RepoStatus.branch` + `RepoStatus.driftCount` populate the dropdown + rail
 *   sub-rows; `openIssues` retained per contract.
 * - `CityPreviewMeta` carries the inset state (districtCount, flaggedDistrict,
 *   lastBuildAt, citizenCount) consumed by CityPreviewCorner.
 * - `TimeRangeOption` is the segmented control row (id + label).
 *
 * All additions remain pure presentation layer; the Demeter Wave 3 backend will
 * derive them from materialized views (Demeter authors field derivation logic).
 */

/** Spec-drift pattern identifier per PRD Section 11. */
export type DriftPattern = 'A' | 'B' | 'C' | 'D' | 'E';

/** Refactor proposal workflow stage (matches OpenSpec workflow). */
export type RefactorStage =
  | 'proposed'
  | 'simulating'
  | 'drafted'
  | 'accepted'
  | 'archived';

/** KPI trend direction; drives arrow icon + tone class. */
export type KPITrend = 'up' | 'down' | 'flat';

/** Repository status dot encoding. */
export type RepoStatusDot = 'green' | 'yellow' | 'red' | 'gray';

/** Drift severity bucket (Designer instrument-panel taxonomy). */
export type DriftSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

/** Time range identifier for the segmented selector. */
export type TimeRangeId = 'today' | 'sprint' | 'quarter';

/** KPI identifier union (Designer chose 4 tiles for the strip). */
export type KPIMetricId =
  | 'velocity'
  | 'cycle-time'
  | 'change-failure-rate'
  | 'deploys-this-week';

/** Author resident attribution; "user" covers human-authored proposals. */
export type RefactorAuthor = 'Athena' | 'user';

/** One KPI tile in the top-of-dashboard strip. */
export interface KPIMetric {
  /** Stable id. */
  id: KPIMetricId;
  /** Visible label (e.g., "Velocity"). */
  label: string;
  /** Numeric value rendered in Bricolage 36px. */
  value: number;
  /** Long-form unit per contract (e.g., "points"). */
  unit: 'points' | 'days' | 'percent' | 'count';
  /** Short suffix rendered next to the value (e.g., "pts"). */
  unitShort?: string;
  /** Trend direction maps to up/down/flat arrow icon. */
  trend: KPITrend;
  /** Signed delta percent vs previous period (contract field). */
  deltaPercent: number;
  /** Unit string for the delta value (e.g., "%" or "pts"). */
  deltaUnit: string;
  /** Designer-prescribed monospace note (e.g., "vs last sprint"). */
  note: string;
}

/** Single point on the sprint burndown series. */
export interface BurndownPoint {
  /** Day index within sprint, 0-based. */
  day: number;
  /** Ideal points remaining per linear burndown. */
  idealRemaining: number;
  /** Actual points remaining at end of this day. */
  actualRemaining: number;
}

/** Sprint meta state surrounding the burndown chart. */
export interface BurndownMeta {
  /** Sprint label (e.g., "Sprint 14"). */
  sprintLabel: string;
  /** Day index treated as "today" for the projection split + reference line. */
  todayIndex: number;
  /** Days remaining until sprint ship. */
  daysToShip: number;
  /** Points remaining at today's snapshot. */
  pointsRemaining: number;
  /** Total points committed at sprint start. */
  pointsTotal: number;
}

/** Single bar on the last-8-sprints velocity chart. */
export interface VelocityPoint {
  /** Sprint label rendered on the X axis (e.g., "S14"). */
  sprintLabel: string;
  /** Story points completed in this sprint. */
  pointsCompleted: number;
  /** Sprint end date (ISO 8601). */
  endDate: string;
  /** True for the current sprint (accent fill, bold top label). */
  isCurrent?: boolean;
}

/** Milestone progress card (contract; optional in Wave 1 mock). */
export interface MilestoneProgress {
  /** Milestone ID. */
  id: string;
  /** Display label. */
  label: string;
  /** Percent complete 0..100. */
  percentComplete: number;
  /** Days remaining until target; negative if overdue. */
  daysRemaining: number;
  /** Open issue count blocking milestone. */
  blockersCount: number;
}

/** Contributor entry in the Top contributors panel. */
export interface ContributorStats {
  /** GitHub login (handle). */
  githubLogin: string;
  /** Display name (rendered above the handle). */
  displayName: string;
  /** Avatar URL (kept for Wave 3 swap; Wave 1 renders initials fallback). */
  avatarUrl: string;
  /** Pull requests opened this sprint. */
  prsOpened: number;
  /** Pull requests merged this sprint. */
  prsMerged: number;
  /** Reviews submitted this sprint (drives the "rv" column). */
  reviewsSubmitted: number;
  /** Lines added in merged PRs this sprint. */
  linesAdded: number;
  /** Lines deleted in merged PRs this sprint. */
  linesDeleted: number;
  /** Issues created this sprint. */
  issuesOpened: number;
  /** Issues closed this sprint. */
  issuesClosed: number;
}

/** Spec drift pattern row in the 5-pattern severity table. */
export interface DriftSummary {
  /** Pattern identifier A..E (matches PRD Section 11). */
  pattern: DriftPattern;
  /** Pattern label (e.g., "Stale closed issue"). */
  patternLabel: string;
  /** One-line description rendered below the label. */
  patternDescription: string;
  /** Optional district name surfaced inline (e.g., "auth"). */
  district?: string;
  /** Severity bucket (contract field). */
  severity: DriftSeverity;
  /** Severity meter level 1..5 (drives bar fill count). */
  severityLevel: 1 | 2 | 3 | 4 | 5;
  /** Trend column copy (e.g., "+2" or "-1" or "flat"). */
  trend: string;
  /** Count of detected occurrences in current scan window. */
  count: number;
  /** Resolution rate 0..1 (contract field, surfaced in Wave 2+ side panel). */
  resolutionRate: number;
}

/** Refactor proposal card in the 5-stage kanban. */
export interface RefactorProposal {
  /** Stable id; matches OpenSpec change folder name. */
  id: string;
  /** Short title from proposal.md. */
  title: string;
  /** Workflow stage. */
  stage: RefactorStage;
  /** Author resident attribution. */
  authorResident: RefactorAuthor;
  /** GitHub handle for human-authored proposals (empty for Athena). */
  authorLogin: string;
  /** Pre-formatted age label (e.g., "2d ago"). */
  ageLabel: string;
  /** Created at (ISO 8601, retained for Wave 2 side panel detail). */
  createdAt: string;
  /** Linked OpenSpec change folder relative path (Folder A). */
  openspecChangePath: string;
}

/** Repository row in the cross-repo rail + repo dropdown. */
export interface RepoStatus {
  /** Repository full name (owner/repo). */
  fullName: string;
  /** Short display label (e.g., "fastapi-fullstack"). */
  label: string;
  /** Default branch name rendered in dropdown sub-line. */
  branch: string;
  /** Open PRs count. */
  openPRs: number;
  /** Open issues count (contract field, surfaced in Wave 2 detail). */
  openIssues: number;
  /** Drift events for this repo in current window. */
  driftCount: number;
  /** Status dot encoding (drives the dot class). */
  statusDot: RepoStatusDot;
  /** Last 14 days commit count series (drives sparkline). */
  sparkline: number[];
}

/** City preview corner state. */
export interface CityPreviewMeta {
  /** Repo slug, used to build the "Open city view" link. */
  repoSlug: string;
  /** District count surfaced in the card sub line. */
  districtCount: number;
  /** Flagged district name (e.g., "auth"); null when no district flagged. */
  flaggedDistrict: string | null;
  /** Last build timestamp ISO 8601 (drives relative time copy). */
  lastBuildAt: string;
  /** Citizen count surfaced in the meta row. */
  citizenCount: number;
}

/** Segmented control option for the time-range selector. */
export interface TimeRangeOption {
  /** Stable id mapped to the query parameter. */
  id: TimeRangeId;
  /** Visible label (e.g., "This sprint"). */
  label: string;
}

/**
 * Engineering Insights diagram artifact (Manager FINAL Cycle 2 Cluster H).
 *
 * Mirrors the Phanes backend `DiagramArtifact` Pydantic model shape (see
 * `backend/app/services/diagram/types.py`). Backend returns snake_case JSON;
 * the field names used here align with the actual on-wire keys so that no
 * normalization step is required. The three base64-encoded SVG blobs
 * (`architecture`, `dependency`, `erd`) are surfaced as data URIs by the
 * DiagramCard component for direct `<img>` rendering, zero client-side
 * rendering library dependency.
 *
 * Selene Cluster H coordinated with Phanes (backend Cluster H) per Manager
 * directive `manager_final_cycle2_directive_20260513-0857.md`.
 */
export interface DiagramArtifact {
  /** Schema version literal (frontend gates on `v1.` prefix). */
  schema_version: string;
  /** Repo id (matches DiagramService registry key, e.g. "demo"). */
  repo_id: string;
  /** Generation timestamp ISO 8601 (UTC). */
  generated_at_iso: string;
  /** Diagram nodes (city-renderer source; surface in Wave 2 side panel). */
  nodes: Array<{
    id: string;
    label: string;
    type: string;
    metadata: Record<string, string | number | boolean>;
  }>;
  /** Diagram edges (city-renderer source). */
  edges: Array<{
    src: string;
    dst: string;
    kind: string;
    weight: number;
  }>;
  /**
   * Three base64-encoded SVG bytes, keyed by renderer name. Surface in
   * DiagramCard via `data:image/svg+xml;base64,<value>`. Missing key implies
   * renderer error; `render_errors` carries the detail.
   */
  svg_blobs: {
    architecture?: string;
    dependency?: string;
    erd?: string;
  };
  /** Aggregate stats surfaced in the card sub-line. */
  stats: Record<string, number>;
  /** Renderer-level error strings (e.g. "architecture: mermaid timeout"). */
  render_errors: string[];
}

/**
 * Root dashboard payload. Selene mock returns this shape; Demeter Wave 3 returns
 * the same shape from `/api/dashboard` (snake_case Python -> camelCase JSON via
 * Pydantic alias generator).
 */
export interface DashboardData {
  /** One-sentence templated briefing rendered top of page. */
  briefing: string;
  /** 4 KPI tile strip. */
  kpis: KPIMetric[];
  /** Current sprint burndown points. */
  burndown: BurndownPoint[];
  /** Sprint meta around the burndown chart. */
  burndownMeta: BurndownMeta;
  /** Last 8 sprints velocity. */
  velocity: VelocityPoint[];
  /** Milestones (contract field, optional consumer in Wave 1 dashboard). */
  milestones: MilestoneProgress[];
  /** Top contributors list. */
  contributors: ContributorStats[];
  /** 5-pattern A..E drift summary. */
  drifts: DriftSummary[];
  /** Refactor proposals across 5 stages. */
  refactorProposals: RefactorProposal[];
  /** Cross-repo rail entries. */
  repos: RepoStatus[];
  /** City preview corner state. */
  cityPreviewMeta: CityPreviewMeta;
  /** Current sprint label. */
  currentSprint: string;
  /** Last data refresh ISO 8601. */
  lastRefresh: string;
}
