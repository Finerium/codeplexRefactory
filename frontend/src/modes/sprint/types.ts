/**
 * Sprint Mode HERO type definitions.
 *
 * Authored by Hera (Wave 2). Canonical source: this file. Pythia contracts
 * `hera-to-persephone.md` + `hera-to-hades.md` ratify these names; downstream
 * consumers (Persephone TicketPanel, Hades webhook receiver, Asclepius Refactor
 * Mode overlap) import from this module via the barrel `frontend/src/modes/sprint`.
 *
 * Compliance:
 *   - Lock 1 (no em dash): clean
 *   - Lock 2 (no emoji): clean
 *   - Lock 5 (honest claim): no mock labeling needed at types level; type is
 *     pure schema. Mock data files carry [MOCK Wave 2, real Wave 3] labels.
 *
 * Contract anchors:
 *   - `_meta/contracts/hera-to-persephone.md` lines 27-69 (SprintStatus + PRComment + BuildingSprintContext)
 *   - `_meta/contracts/hera-to-hades.md` lines 22-104 (BuildingEvent + payload types)
 *   - PRD Section 9.2 (14 PM concept canonical mapping, lifecycle foundation -> frame -> painting -> finished)
 */

import type { BuildingData } from '@/scene/buildings/types';

/**
 * Sprint lifecycle states per PRD Section 9.2 line 506 + Pythia contract
 * `hera-to-persephone.md` lines 27-32. These 5 stages model the file-as-building
 * lifecycle from issue creation to PR merge.
 *
 * Discipline: state machine in `stateMachine.ts` ONLY moves between these
 * named states. Orthogonal visual overlays (yellow tape, smoke+retak, green
 * halo glow, sticky note) attach as boolean flags or timestamp fields on
 * BuildingSprintContext, NOT as additional state values.
 *
 * Transition table (full detail in `_meta/decision_log/hera.md` D-Hera-03):
 *   foundation -> frame on pr.opened
 *   frame -> painting on pr.review_requested
 *   painting -> finished on pr.merged
 *   painting / frame -> unfinished on pr.closed (without merge)
 */
export type SprintStatus = 'foundation' | 'frame' | 'painting' | 'finished' | 'unfinished';

/**
 * A single PR review comment surfaced visually on the building face via
 * sticky-note 3D variant (OQ-05 decided per `_meta/decisions/oq05_pr_comment_surfacing.md`).
 *
 * `resolved` flag drives visual differentiation: unresolved comments contribute
 * to the sticky-note unread badge count + paper-yellow tint; resolved comments
 * show with a small check overlay + faded tint, still visible but de-emphasized.
 */
export interface PRComment {
  id: string;
  githubLogin: string;
  avatarUrl: string;
  body: string;
  createdAt: string;
  resolved: boolean;
}

/**
 * Story size badge value. Letters map to standard agile T-shirt sizes; numeric
 * point value rendered separately when present.
 */
export type StorySize = 'XS' | 'S' | 'M' | 'L' | 'XL';

/**
 * Refactor stage flag for Asclepius Wave 2 ghost-building handoff. Hera does
 * NOT render ghost geometry or retak crack overlay (Asclepius scope per
 * Pythia `hera-to-persephone.md` line 154). Hera publishes the stage so
 * Asclepius overlays read shared state via `useHeraStore`.
 */
export type RefactorStage = 'proposed' | 'simulating' | 'drafted' | 'accepted';

/**
 * BuildingSprintContext: full sprint-mode payload per building. Persephone
 * TicketPanel consumes this verbatim per Pythia contract `hera-to-persephone.md`
 * lines 44-69. The shape is the SINGLE source-of-truth across:
 *
 *   - Sprint Mode HERO visual overlays (this module renders 13 concepts driven
 *     by these fields)
 *   - Persephone TicketPanel (reads same fields for tile UI)
 *   - Hades Wave 3 webhook event reducer (writes these fields from
 *     translated GitHub webhook payloads per `hera-to-hades.md`)
 *   - Asclepius Wave 2 Refactor Mode overlay (reads `refactorStage` field)
 *
 * Discipline: append-only schema evolution. Existing fields never delete or
 * rename mid-wave; new fields land as optional (`field?: T`).
 */
export interface BuildingSprintContext {
  /** Building this context applies to, matches BuildingData.id. */
  buildingId: string;
  /** Sprint lifecycle state machine current value. */
  sprintStatus: SprintStatus;
  /** Linked GitHub PR if any. */
  prNumber: number | null;
  prTitle: string | null;
  prUrl: string | null;
  /** Linked GitHub issue if any. */
  issueNumber: number | null;
  issueTitle: string | null;
  issueUrl: string | null;
  /** Assignee GitHub login (for ticket panel avatar + ownership cross-check). */
  assignee: string | null;
  /** Story points T-shirt size. */
  storyPoints: StorySize | null;
  /** Milestone identifier (sprint name, e.g., "Sprint 14: Security hardening"). */
  milestone: string | null;
  /** Definition of Done checklist items, surface in DoDChecklist overlay. */
  dodChecklist: { label: string; checked: boolean }[];
  /** PR review comments, drive PRCommentSurface sticky-note + badge count. */
  prComments: PRComment[];
  /** Reviewers requested but not yet approved. */
  reviewersRequested: string[];
  /** Reviewers who have approved this PR. */
  reviewersApproved: string[];
  /** Building IDs that this building depends on (RedBridge target). */
  dependencies: string[];
  /** Blocked / help-wanted flag, drives YellowTape overlay. */
  blocked: boolean;
  /** Free-text label for the blocked state (e.g., "waiting on backend API"). */
  blockedReason: string | null;
  /**
   * CI pipeline state. 'fail' drives SmokeRetakOverlay; 'pass' clears it.
   * 'pending' = no overlay, neutral. null = no CI configured.
   */
  ciStatus: 'pass' | 'fail' | 'pending' | null;
  /** Number of consecutive CI failures, drives retak crack count. */
  ciFailCount: number;
  /**
   * ISO timestamp when PR was approved by all required reviewers. Drives the
   * 30-min transient GreenHaloGlow decay overlay. null = no approval yet.
   */
  prApprovedAt: string | null;
  /**
   * Refactor mode handoff field. Asclepius Wave 2 consumes; Hera does NOT
   * render ghost geometry or retak crack overlay (Asclepius scope).
   */
  refactorStage: RefactorStage | null;
  /** Last activity timestamp for sorting / decay calculations. */
  lastUpdatedAt: string;
}

/**
 * Concept toggle keys, drive the SprintMode UI filter chip set. Each maps to
 * one PM concept overlay component. The 14th (refactor stage) is the Asclepius
 * handoff and renders only the toggle UI (Hera does NOT mount its geometry).
 *
 * PRD Section 9.2 canonical mapping; numbering matches the 14-row table.
 */
export type ConceptKey =
  | 'scaffolding'        // 1. Story in progress
  | 'crane'              // 2. Active development PR open
  | 'blueprint-pin'      // 3. Planned next sprint / backlog
  | 'inspector-npc'      // 4. PR review state
  | 'green-halo'         // 5. PR approved transient 30-min
  | 'yellow-tape'        // 6. Blocked / help-wanted
  | 'smoke-retak'        // 7. CI / test failure
  | 'size-badge'         // 8. Story size
  | 'city-hall-banner'   // 9. Milestone / sprint goal on Athena landmark
  | 'district-border'    // 10. Component district owner highlight
  | 'dod-checklist'      // 11. Definition of Done checklist hovering
  // 12. PR merge transition is implicit in state machine (not a toggleable concept)
  | 'red-bridge'         // 13. Issue dependency between buildings
  | 'pr-comment'         // 14a. PR comment surfacing (OQ-05 sticky note 3D variant)
  | 'refactor-stage';    // 14b. Refactor handoff (Asclepius renders, Hera publishes toggle)

/**
 * Visual filter state for the SprintMode toggle UI. Default = all on except
 * `refactor-stage` (off by default; user opt-in because Asclepius render is
 * heavier).
 */
export type ConceptVisibility = Record<ConceptKey, boolean>;

/**
 * Default visibility: all Hera-owned concepts ON, Asclepius handoff OFF.
 */
export const DEFAULT_CONCEPT_VISIBILITY: ConceptVisibility = {
  'scaffolding': true,
  'crane': true,
  'blueprint-pin': true,
  'inspector-npc': true,
  'green-halo': true,
  'yellow-tape': true,
  'smoke-retak': true,
  'size-badge': true,
  'city-hall-banner': true,
  'district-border': true,
  'dod-checklist': true,
  'red-bridge': true,
  'pr-comment': true,
  'refactor-stage': false,
};

/**
 * Building event types fired from Hades Wave 3 GitHub webhook receiver per
 * Pythia contract `hera-to-hades.md` lines 27-49. Wave 2 mock event tape
 * fires these synthetically through `useBuildingEvents` hook.
 */
export type BuildingEventType =
  | 'pr.opened'
  | 'pr.review_requested'
  | 'pr.approved'
  | 'pr.merged'
  | 'pr.closed'
  | 'issue.opened'
  | 'issue.closed'
  | 'comment.created'
  | 'comment.resolved'
  | 'ci.fail'
  | 'ci.pass'
  | 'dependency.added'
  | 'dependency.removed'
  | 'sprint.transition';

/**
 * Building event payload shapes per event type. The Wave 3 Hades publisher
 * MUST emit these shapes verbatim; Hera's stateMachine reducer reads them
 * to derive BuildingSprintContext updates.
 */
export interface PROpenedPayload {
  prTitle: string;
  prUrl: string;
  authorLogin: string;
  filesChanged: string[];
  storyPoints: StorySize | null;
  milestone: string | null;
  issueNumber: number | null;
  issueTitle: string | null;
  issueUrl: string | null;
}

export interface PRReviewRequestedPayload {
  reviewerLogins: string[];
}

export interface PRApprovedPayload {
  approverLogin: string;
  allRequiredApproved: boolean;
  approvedAt: string;
}

export interface PRMergedPayload {
  mergerLogin: string;
  mergeSha: string;
  mergedAt: string;
}

export interface PRClosedPayload {
  closerLogin: string;
  withoutMerge: boolean;
  closedAt: string;
}

export interface IssueOpenedPayload {
  issueTitle: string;
  issueUrl: string;
  authorLogin: string;
  storyPoints: StorySize | null;
  assignee: string | null;
  milestone: string | null;
  blocked: boolean;
  blockedReason: string | null;
}

export interface IssueClosedPayload {
  closerLogin: string;
  withRelatedPRMerged: boolean;
}

export interface CommentCreatedPayload {
  commentId: string;
  commentBody: string;
  authorLogin: string;
  avatarUrl: string;
  resolved: boolean;
  prNumber: number | null;
}

export interface CommentResolvedPayload {
  commentId: string;
}

export interface CIStatusPayload {
  status: 'pass' | 'fail';
  failureMessage: string | null;
}

export interface DependencyChangedPayload {
  dependsOnBuildingId: string;
}

/**
 * Composite event union. Each event tag matches a payload shape; reducer
 * exhaustive-switch in `stateMachine.ts`.
 */
export type BuildingEvent =
  | { type: 'pr.opened'; buildingId: string; timestamp: string; resourceNumber: number; payload: PROpenedPayload }
  | { type: 'pr.review_requested'; buildingId: string; timestamp: string; resourceNumber: number; payload: PRReviewRequestedPayload }
  | { type: 'pr.approved'; buildingId: string; timestamp: string; resourceNumber: number; payload: PRApprovedPayload }
  | { type: 'pr.merged'; buildingId: string; timestamp: string; resourceNumber: number; payload: PRMergedPayload }
  | { type: 'pr.closed'; buildingId: string; timestamp: string; resourceNumber: number; payload: PRClosedPayload }
  | { type: 'issue.opened'; buildingId: string; timestamp: string; resourceNumber: number; payload: IssueOpenedPayload }
  | { type: 'issue.closed'; buildingId: string; timestamp: string; resourceNumber: number; payload: IssueClosedPayload }
  | { type: 'comment.created'; buildingId: string; timestamp: string; resourceNumber: number; payload: CommentCreatedPayload }
  | { type: 'comment.resolved'; buildingId: string; timestamp: string; resourceNumber: number; payload: CommentResolvedPayload }
  | { type: 'ci.fail'; buildingId: string; timestamp: string; resourceNumber: number; payload: CIStatusPayload }
  | { type: 'ci.pass'; buildingId: string; timestamp: string; resourceNumber: number; payload: CIStatusPayload }
  | { type: 'dependency.added'; buildingId: string; timestamp: string; resourceNumber: number; payload: DependencyChangedPayload }
  | { type: 'dependency.removed'; buildingId: string; timestamp: string; resourceNumber: number; payload: DependencyChangedPayload }
  | {
      type: 'sprint.transition';
      buildingId: string;
      timestamp: string;
      resourceNumber: number;
      payload: { fromStatus: SprintStatus; toStatus: SprintStatus };
    };

/**
 * WebSocket connection status surfaced from `useBuildingEvents`. UI shows a
 * dev-mode banner when 'error' or 'offline'. Wave 2 mock hook always returns
 * 'connected'. Wave 3 Hades wires real reconnect logic.
 */
export type BuildingEventsStatus = 'connecting' | 'connected' | 'error' | 'offline';

/**
 * Lightweight projection re-exported to the Persephone TicketPanel + 14
 * concept components. Avoids deep-coupling consumers to BuildingData fields
 * they do not need.
 */
export interface BuildingPosition {
  id: string;
  position: [number, number, number];
  height: number;
  width: number;
  depth: number;
  archetype: BuildingData['archetype'];
  landmark: BuildingData['landmark'];
  ownershipColor: string;
}
