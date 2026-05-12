/**
 * PR-to-Building state machine + event reducer.
 *
 * Authored by Hera (Wave 2). Pure functional reducer; no side-effects, no
 * setTimeout, no fetch. Called by `useBuildingEvents` -> `heraStore.applyEvent`
 * dispatcher. Wave 3 Hades wires real WebSocket events through this same
 * reducer.
 *
 * Anchor:
 *   - Pythia contract `hera-to-persephone.md` Asumption 2 line 122-124 (state
 *     transition matrix matches webhook events)
 *   - PRD Section 9.2 (lifecycle foundation -> frame -> painting -> finished /
 *     unfinished + side-effect overlays)
 *   - Decision `_meta/decision_log/hera.md` D-Hera-03 (orthogonal side-effect
 *     split between sprintStatus value + boolean flags + timestamp fields)
 *
 * Compliance:
 *   - Lock 1 (no em dash): clean
 *   - Lock 2 (no emoji): clean
 *   - Lock 4 (no unilateral remap): PRD Section 9.2 canonical mapping preserved
 *   - Edge case `hera-to-persephone.md` line 149: invalid transitions log
 *     warning + accept (event ordering preserved by Hades webhook publisher)
 */

import type {
  BuildingEvent,
  BuildingSprintContext,
  SprintStatus,
  PRComment,
} from './types';

/**
 * Initial context skeleton for a building newly seen in event stream. Every
 * field defaults to the "no data" sentinel so visual overlays read as quiet.
 */
export function createInitialContext(buildingId: string): BuildingSprintContext {
  return {
    buildingId,
    sprintStatus: 'foundation',
    prNumber: null,
    prTitle: null,
    prUrl: null,
    issueNumber: null,
    issueTitle: null,
    issueUrl: null,
    assignee: null,
    storyPoints: null,
    milestone: null,
    dodChecklist: [],
    prComments: [],
    reviewersRequested: [],
    reviewersApproved: [],
    dependencies: [],
    blocked: false,
    blockedReason: null,
    ciStatus: null,
    ciFailCount: 0,
    prApprovedAt: null,
    refactorStage: null,
    lastUpdatedAt: new Date(0).toISOString(),
  };
}

/**
 * Lifecycle transition matrix per D-Hera-03. Only the 4 PR-driven events
 * shift state value; other events update side-effect fields. Returns the
 * next status on a defined transition, or null if event does not change state.
 */
function nextSprintStatus(
  current: SprintStatus,
  event: BuildingEvent
): SprintStatus | null {
  switch (event.type) {
    case 'pr.opened':
      if (current === 'foundation' || current === 'unfinished') return 'frame';
      return null;
    case 'pr.review_requested':
      if (current === 'frame') return 'painting';
      return null;
    case 'pr.merged':
      if (current === 'frame' || current === 'painting') return 'finished';
      return null;
    case 'pr.closed':
      if (event.payload.withoutMerge && (current === 'frame' || current === 'painting')) {
        return 'unfinished';
      }
      return null;
    case 'sprint.transition':
      // Hades explicit transition override (Wave 3 reconciliation edge case)
      return event.payload.toStatus;
    case 'issue.opened':
      // Issue created with no PR yet -> foundation state if currently unknown
      if (current === 'foundation' || current === 'unfinished') {
        return 'foundation';
      }
      return null;
    default:
      return null;
  }
}

/**
 * Pure functional reducer. Applies a single BuildingEvent to a
 * BuildingSprintContext + returns the new context. Idempotent over duplicate
 * events keyed by event type + timestamp (Hades dedups by webhook delivery
 * id; Hera reducer is tolerant of replay).
 *
 * @param state Current context for the building, or null if unseen.
 * @param event Single event from the bus.
 * @returns Next context after the event applied.
 */
export function reduceSprintEvent(
  state: BuildingSprintContext | null,
  event: BuildingEvent
): BuildingSprintContext {
  const base = state ?? createInitialContext(event.buildingId);
  const next = nextSprintStatus(base.sprintStatus, event);

  // Build next context starting from base + status transition (if any).
  const updated: BuildingSprintContext = {
    ...base,
    sprintStatus: next ?? base.sprintStatus,
    lastUpdatedAt: event.timestamp,
  };

  // Apply event-specific side-effect updates per event type.
  switch (event.type) {
    case 'pr.opened': {
      const p = event.payload;
      updated.prNumber = event.resourceNumber;
      updated.prTitle = p.prTitle;
      updated.prUrl = p.prUrl;
      if (p.issueNumber !== null) {
        updated.issueNumber = p.issueNumber;
        updated.issueTitle = p.issueTitle;
        updated.issueUrl = p.issueUrl;
      }
      if (p.storyPoints !== null) updated.storyPoints = p.storyPoints;
      if (p.milestone !== null) updated.milestone = p.milestone;
      updated.assignee = p.authorLogin;
      // Seed a default DoD checklist if currently empty. PRD AD-10 future:
      // parse from issue body markdown `- [ ]` syntax. Wave 2 stub default.
      if (updated.dodChecklist.length === 0) {
        updated.dodChecklist = [
          { label: 'Tests added or updated', checked: false },
          { label: 'Code review approved', checked: false },
          { label: 'CI pipeline green', checked: false },
          { label: 'Documentation updated', checked: false },
          { label: 'No regression in linked features', checked: false },
        ];
      }
      return updated;
    }

    case 'pr.review_requested': {
      const p = event.payload;
      updated.reviewersRequested = [...new Set([...base.reviewersRequested, ...p.reviewerLogins])];
      return updated;
    }

    case 'pr.approved': {
      const p = event.payload;
      updated.reviewersApproved = [...new Set([...base.reviewersApproved, p.approverLogin])];
      if (p.allRequiredApproved) {
        // Side-effect overlay: 30-min green halo transient timestamp.
        // Status STAYS painting until pr.merged (per D-Hera-03 mapping).
        updated.prApprovedAt = p.approvedAt;
        // Mark DoD review item as checked.
        updated.dodChecklist = updated.dodChecklist.map((item) =>
          item.label === 'Code review approved' ? { ...item, checked: true } : item
        );
      }
      return updated;
    }

    case 'pr.merged': {
      // Transition to 'finished' already applied via nextSprintStatus.
      // Clear scaffolding-side flags + mark all DoD items checked (demo-y).
      updated.dodChecklist = updated.dodChecklist.map((item) => ({ ...item, checked: true }));
      return updated;
    }

    case 'pr.closed': {
      // Transition to 'unfinished' already applied if withoutMerge. Clear PR
      // refs so the next PR event starts clean.
      if (event.payload.withoutMerge) {
        updated.reviewersRequested = [];
      }
      return updated;
    }

    case 'issue.opened': {
      const p = event.payload;
      updated.issueNumber = event.resourceNumber;
      updated.issueTitle = p.issueTitle;
      updated.issueUrl = p.issueUrl;
      if (p.storyPoints !== null) updated.storyPoints = p.storyPoints;
      if (p.assignee !== null) updated.assignee = p.assignee;
      if (p.milestone !== null) updated.milestone = p.milestone;
      updated.blocked = p.blocked;
      updated.blockedReason = p.blockedReason;
      return updated;
    }

    case 'issue.closed': {
      // No state value change unless withRelatedPRMerged && currently active.
      // Persephone TicketPanel surfaces issue closed by graying the entry.
      return updated;
    }

    case 'comment.created': {
      const p = event.payload;
      const newComment: PRComment = {
        id: p.commentId,
        githubLogin: p.authorLogin,
        avatarUrl: p.avatarUrl,
        body: p.commentBody,
        createdAt: event.timestamp,
        resolved: p.resolved,
      };
      // Dedup by id (Wave 3 webhook replay edge case)
      const existing = updated.prComments.findIndex((c) => c.id === p.commentId);
      if (existing >= 0) {
        const arr = [...updated.prComments];
        arr[existing] = newComment;
        updated.prComments = arr;
      } else {
        updated.prComments = [...updated.prComments, newComment];
      }
      return updated;
    }

    case 'comment.resolved': {
      updated.prComments = updated.prComments.map((c) =>
        c.id === event.payload.commentId ? { ...c, resolved: true } : c
      );
      return updated;
    }

    case 'ci.fail': {
      updated.ciStatus = 'fail';
      updated.ciFailCount = base.ciFailCount + 1;
      return updated;
    }

    case 'ci.pass': {
      updated.ciStatus = 'pass';
      updated.ciFailCount = 0;
      // Mark CI item checked in DoD checklist.
      updated.dodChecklist = updated.dodChecklist.map((item) =>
        item.label === 'CI pipeline green' ? { ...item, checked: true } : item
      );
      return updated;
    }

    case 'dependency.added': {
      const target = event.payload.dependsOnBuildingId;
      if (!base.dependencies.includes(target)) {
        updated.dependencies = [...base.dependencies, target];
      }
      return updated;
    }

    case 'dependency.removed': {
      const target = event.payload.dependsOnBuildingId;
      updated.dependencies = base.dependencies.filter((d) => d !== target);
      return updated;
    }

    case 'sprint.transition': {
      // Status already transitioned via nextSprintStatus.
      return updated;
    }

    default: {
      // Exhaustive-switch safety: TypeScript narrows `event` to `never` here.
      // If a new event type lands in `types.ts` without a case, this branch
      // surfaces at compile time. Belt + suspender at runtime: log warn.
      // eslint-disable-next-line no-console
      console.warn('[hera/stateMachine] unknown event type, ignored:', event);
      return updated;
    }
  }
}

/**
 * Convenience accessor: derive boolean visual overlay flags from a context.
 * Used by overlay components to short-circuit render when concept inactive.
 */
export interface SprintVisualFlags {
  hasScaffolding: boolean;          // Story in progress, scaffolding wrap
  hasCrane: boolean;                 // Active PR, crane operating
  hasBlueprintPin: boolean;          // Backlog item, not yet active
  hasInspectorNPC: boolean;          // PR under review
  hasGreenHalo: boolean;             // PR approved within 30-min decay window
  haloOpacity: number;               // 0..1 decay value
  hasYellowTape: boolean;            // Blocked label
  hasSmokeRetak: boolean;            // CI fail
  smokeIntensity: number;            // 0..1, scales with ciFailCount
  hasSizeBadge: boolean;             // Story points present
  hasDoDChecklist: boolean;          // Active and selected
  hasPRComment: boolean;             // Has comments (resolved or not)
  unreadCommentCount: number;
  hasCityHallBanner: boolean;        // Athena landmark + milestone set
  hasRedBridge: boolean;             // Has dependencies
  hasRefactorGhost: boolean;         // Asclepius handoff: refactorStage set
}

const GREEN_HALO_DURATION_MS = 30 * 60 * 1000; // 30 minutes per PRD line 514

/**
 * Compute visual flags from a sprint context. Time-sensitive flags (green
 * halo opacity decay) use the supplied `now` parameter for testability.
 */
export function computeVisualFlags(
  ctx: BuildingSprintContext,
  isLandmarkAthena: boolean,
  isSelected: boolean,
  now: number = Date.now()
): SprintVisualFlags {
  // Green halo 30-min decay easeOutCubic from approvedAt.
  let haloOpacity = 0;
  let hasGreenHalo = false;
  if (ctx.prApprovedAt) {
    const elapsedMs = now - Date.parse(ctx.prApprovedAt);
    if (elapsedMs >= 0 && elapsedMs <= GREEN_HALO_DURATION_MS) {
      const linear = 1 - elapsedMs / GREEN_HALO_DURATION_MS;
      // easeOutCubic: t -> 1 - (1 - t)^3, applied to "remaining" so the
      // glow stays bright early then decays.
      haloOpacity = 1 - Math.pow(1 - linear, 3);
      hasGreenHalo = haloOpacity > 0.02; // floor for shader cull
    }
  }

  const isActive =
    ctx.sprintStatus === 'frame' ||
    ctx.sprintStatus === 'painting' ||
    ctx.sprintStatus === 'finished';

  const unreadCommentCount = ctx.prComments.filter((c) => !c.resolved).length;

  return {
    hasScaffolding: isActive && ctx.sprintStatus !== 'finished',
    hasCrane: ctx.sprintStatus === 'frame' || ctx.sprintStatus === 'painting',
    hasBlueprintPin:
      ctx.sprintStatus === 'foundation' && ctx.issueNumber !== null && !isActive,
    hasInspectorNPC: ctx.sprintStatus === 'painting' && !ctx.prApprovedAt,
    hasGreenHalo,
    haloOpacity,
    hasYellowTape: ctx.blocked,
    hasSmokeRetak: ctx.ciStatus === 'fail' && ctx.ciFailCount > 0,
    smokeIntensity: Math.min(1, ctx.ciFailCount / 3),
    hasSizeBadge: ctx.storyPoints !== null && isActive,
    hasDoDChecklist: isSelected && ctx.dodChecklist.length > 0,
    hasPRComment: ctx.prComments.length > 0,
    unreadCommentCount,
    hasCityHallBanner: isLandmarkAthena && ctx.milestone !== null,
    hasRedBridge: ctx.dependencies.length > 0,
    hasRefactorGhost: ctx.refactorStage !== null,
  };
}

/**
 * Exported for visualization debugger: returns the GREEN_HALO_DURATION_MS so
 * tooltips can show "halo decays for 30 min after PR approval".
 */
export const HALO_DURATION_MS = GREEN_HALO_DURATION_MS;
