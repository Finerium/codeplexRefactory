/**
 * Barrel re-export of the public dashboard library surface.
 *
 * Wave 2 Persephone imports types from `@/lib/dashboard` (canonical) for side
 * panel mode variants per Pythia contract `selene-to-persephone.md`. Wave 3
 * Demeter mirrors the Pydantic schema from the same canonical shape.
 */

export type {
  DashboardData,
  KPIMetric,
  KPIMetricId,
  KPITrend,
  BurndownPoint,
  BurndownMeta,
  VelocityPoint,
  MilestoneProgress,
  ContributorStats,
  DriftPattern,
  DriftSeverity,
  DriftSummary,
  RefactorAuthor,
  RefactorProposal,
  RefactorStage,
  RepoStatus,
  RepoStatusDot,
  CityPreviewMeta,
  TimeRangeId,
  TimeRangeOption,
} from './types';

export type {
  DashboardQuery,
  DashboardQueryAPI,
} from './queries';

export { buildDashboardQueryString } from './queries';

export { mockDashboardData } from './mockDashboardData';

export {
  useDashboardData,
  type UseDashboardDataOptions,
  type UseDashboardDataResult,
} from './useDashboardData';
