/**
 * Sprint Mode HERO barrel.
 *
 * Authored by Hera (Wave 2). Public surface for downstream consumers:
 *   - `frontend/app/city/page.tsx` mounts `<SprintMode />` (inside Canvas) +
 *     `<SprintModeControls />` (DOM overlay)
 *   - `frontend/app/city/@ticket/default.tsx` (Persephone Wave 2) consumes
 *     `useHeraStore`, `useSelectedBuildingContext`, plus the type exports
 *   - Asclepius Wave 2 RefactorMode + HealthMode subscribe to `useHeraStore`
 *     for `refactorStage` field reading
 *   - Hades Wave 3 webhook receiver translates webhook payload via the
 *     `BuildingEvent` type and dispatches `useHeraStore.applyEvent`
 *
 * Discipline: only stable surfaces re-exported. Internal helpers (visualUtils,
 * mock tape, individual concept components) NOT re-exported to discourage
 * direct mount bypass of the SprintMode composite.
 */

// Composite root
export { SprintMode } from './SprintMode';
// DOM-level toggle UI
export { SprintModeControls } from './SprintModeControls';

// Backlog Office virtual building (Wave-Fixing #2 cycle 1; PRD Section 9.2 line 520).
// Asclepius IssueFlyingPacket consumes BACKLOG_OFFICE_BUILDING_ID + useBacklogOfficePosition
// to target the office for flying-issue animation arrivals.
export {
  BacklogOffice,
  BACKLOG_OFFICE_BUILDING_ID,
  BACKLOG_OFFICE_POSITION,
  useBacklogOfficePosition,
} from './BacklogOffice';
export {
  useBacklogOfficeEvents,
  dispatchBacklogOfficeEvent,
} from './useBacklogOfficeEvents';
export type { BacklogOfficeEvent } from './useBacklogOfficeEvents';

// State store surfaces (consumed by Persephone TicketPanel, Asclepius RefactorMode, Hades dispatcher)
export {
  useHeraStore,
  useSelectedBuildingContext,
  useBuildingContext,
  useConceptVisibility,
  useConceptVisible,
} from './heraStore';

// Click-to-ticket bridge (optional independent mount path; SprintMode auto-wires)
export { useSprintClickToTicket } from './clickHandlers';

// Event stream hook (Wave 2 mock stub, Wave 3 Hades swap)
export { useBuildingEvents } from './useBuildingEvents';
export type { UseBuildingEventsResult } from './useBuildingEvents';

// Pure reducer + visual-flag computation
export { reduceSprintEvent, computeVisualFlags, createInitialContext, HALO_DURATION_MS } from './stateMachine';
export type { SprintVisualFlags } from './stateMachine';

// Types (canonical schema)
export type {
  SprintStatus,
  PRComment,
  StorySize,
  RefactorStage,
  BuildingSprintContext,
  ConceptKey,
  ConceptVisibility,
  BuildingEventType,
  BuildingEvent,
  BuildingEventsStatus,
  BuildingPosition,
  PROpenedPayload,
  PRReviewRequestedPayload,
  PRApprovedPayload,
  PRMergedPayload,
  PRClosedPayload,
  IssueOpenedPayload,
  IssueClosedPayload,
  CommentCreatedPayload,
  CommentResolvedPayload,
  CIStatusPayload,
  DependencyChangedPayload,
} from './types';
export { DEFAULT_CONCEPT_VISIBILITY } from './types';
