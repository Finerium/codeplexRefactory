/**
 * Side panel barrel.
 *
 * Authored by Persephone (Wave 2).
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 */

export { SidePanel, type SidePanelProps } from './SidePanel';
export {
  RefactorReviewVariant,
  type RefactorReviewVariantProps,
} from './RefactorReviewVariant';
export {
  HealthFindingsVariant,
  type HealthFindingsVariantProps,
} from './HealthFindingsVariant';
export {
  ActivityDrilldownVariant,
  type ActivityDrilldownVariantProps,
} from './ActivityDrilldownVariant';
export {
  SelectedBuildingDetail,
  type SelectedBuildingDetailProps,
} from './SelectedBuildingDetail';
// Manager FINAL Cycle 2 (Persephone Cluster C, STAMP 20260513-0857):
export { PerFloorTimeline, type PerFloorTimelineProps } from './PerFloorTimeline';
export { CommitEntry, type CommitEntryProps } from './CommitEntry';
export {
  usePerFloorCommits,
  type CommitEntry as PerFloorCommit,
  type PerFloorCommitsState,
} from './usePerFloorCommits';
