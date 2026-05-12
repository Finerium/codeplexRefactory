/**
 * [MOCK Wave 2, real Wave 3 Hades webhook]
 *
 * Deterministic 15-event mock tape for Sprint Mode HERO demo flow. Drives the
 * `useBuildingEvents` Wave 2 stub hook. Wave 3 Hades wires the real WebSocket
 * to `/api/ws/building-events` per Pythia contract `hera-to-hades.md` lines
 * 22-180; same event shapes, real-time delivery from GitHub webhook receiver.
 *
 * Tape composition per `_meta/decision_log/hera.md` D-Hera-05:
 * - 4 buildings (A, B, C, D) pinned to first 4 buildings of mockCityData
 * - 90-second loop drives the full state machine + 14 concept overlays
 * - Demo script PRD line 1004 mirrors this sequence: judge sees the city
 *   come alive without manual click sequence
 *
 * Compliance:
 *   - Lock 1 (no em dash): clean
 *   - Lock 2 (no emoji): clean
 *   - Lock 5 (honest claim): file labeled [MOCK Wave 2] at top + each event
 *     carries a delayMs offset for tape-driven scheduler
 */

import type { BuildingEvent } from '../types';

/**
 * Event entry on the tape: a single BuildingEvent + delayMs offset from
 * tape start. The Wave 2 stub hook schedules each entry via setTimeout.
 */
export interface MockTapeEntry {
  /** Milliseconds from tape start to fire this event. */
  delayMs: number;
  /** Building event payload, fully typed. */
  event: BuildingEvent;
}

/**
 * Helper to construct an ISO timestamp offset from a base timestamp.
 */
function isoOffset(baseMs: number, offsetMs: number): string {
  return new Date(baseMs + offsetMs).toISOString();
}

/**
 * Builds the 15-event tape, anchored to `buildingIds` array (4 ids pinned
 * to first 4 mockCityData buildings; see `useBuildingEvents.ts` resolution
 * logic). Tape starts at `tapeStartMs` so timestamps are deterministic
 * across reload.
 *
 * Tape behavior on loop: stub hook calls this function fresh on each loop
 * iteration with a new tapeStartMs, so timestamps shift forward (no replay
 * confusion in the reducer).
 */
export function buildMockTape(
  buildingIds: [string, string, string, string],
  tapeStartMs: number
): MockTapeEntry[] {
  const [a, b, c, d] = buildingIds;

  const tape: MockTapeEntry[] = [];

  // t=0s: issue opened on A -> foundation. Hera renders blueprint pin until
  // PR opens.
  tape.push({
    delayMs: 0,
    event: {
      type: 'issue.opened',
      buildingId: a,
      timestamp: isoOffset(tapeStartMs, 0),
      resourceNumber: 412,
      payload: {
        issueTitle: 'Implement GitHub OAuth scope minimization',
        issueUrl: 'https://github.com/Finerium/codeplexRefactory/issues/412',
        authorLogin: 'ghaisan',
        storyPoints: 'M',
        assignee: 'ghaisan',
        milestone: 'Sprint 14: Security hardening + auth',
        blocked: false,
        blockedReason: null,
      },
    },
  });

  // t=2s: City Hall banner kicks in via milestone field set above. Wave 2
  // stub adds an explicit issue.opened on the Athena landmark so the banner
  // overlay reads the milestone. Building A may or may not BE Athena; we
  // emit an extra issue.opened on the landmark slot via sprint.transition
  // proxy here is overkill; the milestone propagation happens via the SprintMode
  // composite that scans all contexts for the most recent milestone (see
  // SprintMode.tsx CityHallBanner anchor).

  // t=4s: PR opened on A -> foundation -> frame. Scaffolding wraps, crane
  // appears, blueprint pin clears.
  tape.push({
    delayMs: 4000,
    event: {
      type: 'pr.opened',
      buildingId: a,
      timestamp: isoOffset(tapeStartMs, 4000),
      resourceNumber: 47,
      payload: {
        prTitle: 'feat(auth): minimize OAuth scopes to read-only + write-issues',
        prUrl: 'https://github.com/Finerium/codeplexRefactory/pull/47',
        authorLogin: 'ghaisan',
        filesChanged: ['backend/app/api/auth.py', 'docs/auth-scopes.md'],
        storyPoints: 'M',
        milestone: 'Sprint 14: Security hardening + auth',
        issueNumber: 412,
        issueTitle: 'Implement GitHub OAuth scope minimization',
        issueUrl: 'https://github.com/Finerium/codeplexRefactory/issues/412',
      },
    },
  });

  // t=10s: review requested -> frame -> painting. Inspector NPC orbits.
  tape.push({
    delayMs: 10000,
    event: {
      type: 'pr.review_requested',
      buildingId: a,
      timestamp: isoOffset(tapeStartMs, 10000),
      resourceNumber: 47,
      payload: {
        reviewerLogins: ['hafiz', 'athena-bot'],
      },
    },
  });

  // t=14s: comment 1 unresolved. Sticky note appears with badge count=1.
  tape.push({
    delayMs: 14000,
    event: {
      type: 'comment.created',
      buildingId: a,
      timestamp: isoOffset(tapeStartMs, 14000),
      resourceNumber: 47,
      payload: {
        commentId: 'c-201',
        commentBody: 'Consider hoisting the scope set into a constant + add unit test for the deny-by-default path.',
        authorLogin: 'hafiz',
        avatarUrl: 'https://github.com/hafiz.png',
        resolved: false,
        prNumber: 47,
      },
    },
  });

  // t=18s: comment 2 unresolved. Badge count=2.
  tape.push({
    delayMs: 18000,
    event: {
      type: 'comment.created',
      buildingId: a,
      timestamp: isoOffset(tapeStartMs, 18000),
      resourceNumber: 47,
      payload: {
        commentId: 'c-202',
        commentBody: 'Docs mention read:org but the constant only has read:user. Sync these.',
        authorLogin: 'athena-bot',
        avatarUrl: 'https://github.com/athena-bot.png',
        resolved: false,
        prNumber: 47,
      },
    },
  });

  // t=22s: comment 3 unresolved. Badge count=3 (matches PRD line 1004 "3 unread").
  tape.push({
    delayMs: 22000,
    event: {
      type: 'comment.created',
      buildingId: a,
      timestamp: isoOffset(tapeStartMs, 22000),
      resourceNumber: 47,
      payload: {
        commentId: 'c-203',
        commentBody: 'Run + paste output of the auth integration test before merge please.',
        authorLogin: 'hafiz',
        avatarUrl: 'https://github.com/hafiz.png',
        resolved: false,
        prNumber: 47,
      },
    },
  });

  // t=28s: issue opened on B with blocked=true. Yellow tape on B.
  tape.push({
    delayMs: 28000,
    event: {
      type: 'issue.opened',
      buildingId: b,
      timestamp: isoOffset(tapeStartMs, 28000),
      resourceNumber: 415,
      payload: {
        issueTitle: 'Refactor auth middleware for FastAPI 0.110 breaking change',
        issueUrl: 'https://github.com/Finerium/codeplexRefactory/issues/415',
        authorLogin: 'hafiz',
        storyPoints: 'L',
        assignee: 'hafiz',
        milestone: 'Sprint 14: Security hardening + auth',
        blocked: true,
        blockedReason: 'Waiting on upstream FastAPI 0.110 patch release',
      },
    },
  });

  // t=32s: dependency added A -> B. Red bridge appears.
  tape.push({
    delayMs: 32000,
    event: {
      type: 'dependency.added',
      buildingId: a,
      timestamp: isoOffset(tapeStartMs, 32000),
      resourceNumber: 47,
      payload: {
        dependsOnBuildingId: b,
      },
    },
  });

  // t=38s: PR approved on A. Green halo glow 30-min transient starts.
  // Inspector NPC fades out (prApprovedAt set).
  tape.push({
    delayMs: 38000,
    event: {
      type: 'pr.approved',
      buildingId: a,
      timestamp: isoOffset(tapeStartMs, 38000),
      resourceNumber: 47,
      payload: {
        approverLogin: 'hafiz',
        allRequiredApproved: true,
        approvedAt: isoOffset(tapeStartMs, 38000),
      },
    },
  });

  // t=44s: PR merged on A -> painting -> finished. Crane removes, scaffolding
  // clears. Green halo continues.
  tape.push({
    delayMs: 44000,
    event: {
      type: 'pr.merged',
      buildingId: a,
      timestamp: isoOffset(tapeStartMs, 44000),
      resourceNumber: 47,
      payload: {
        mergerLogin: 'ghaisan',
        mergeSha: 'a47bc9e2d8f',
        mergedAt: isoOffset(tapeStartMs, 44000),
      },
    },
  });

  // t=52s: CI fail on C. Smoke billows + crack appears.
  tape.push({
    delayMs: 52000,
    event: {
      type: 'ci.fail',
      buildingId: c,
      timestamp: isoOffset(tapeStartMs, 52000),
      resourceNumber: 51,
      payload: {
        status: 'fail',
        failureMessage: 'pytest tests/test_health.py::test_apollo_critical_detector failed',
      },
    },
  });

  // t=58s: issue closed on A confirms done.
  tape.push({
    delayMs: 58000,
    event: {
      type: 'issue.closed',
      buildingId: a,
      timestamp: isoOffset(tapeStartMs, 58000),
      resourceNumber: 412,
      payload: {
        closerLogin: 'ghaisan',
        withRelatedPRMerged: true,
      },
    },
  });

  // t=66s: comment.resolved on c-201 (A retroactive demo polish; tape
  // exercise the resolved code path).
  tape.push({
    delayMs: 66000,
    event: {
      type: 'comment.resolved',
      buildingId: a,
      timestamp: isoOffset(tapeStartMs, 66000),
      resourceNumber: 47,
      payload: {
        commentId: 'c-201',
      },
    },
  });

  // t=74s: PR opened on D parallel. Scaffolding + crane on D demo
  // multi-building active sprint state.
  tape.push({
    delayMs: 74000,
    event: {
      type: 'pr.opened',
      buildingId: d,
      timestamp: isoOffset(tapeStartMs, 74000),
      resourceNumber: 48,
      payload: {
        prTitle: 'chore(deps): bump three.js to 0.184, lock version',
        prUrl: 'https://github.com/Finerium/codeplexRefactory/pull/48',
        authorLogin: 'hafiz',
        filesChanged: ['frontend/package.json', 'frontend/package-lock.json'],
        storyPoints: 'S',
        milestone: 'Sprint 14: Security hardening + auth',
        issueNumber: null,
        issueTitle: null,
        issueUrl: null,
      },
    },
  });

  // t=82s: CI pass on C (recover). Smoke clears.
  tape.push({
    delayMs: 82000,
    event: {
      type: 'ci.pass',
      buildingId: c,
      timestamp: isoOffset(tapeStartMs, 82000),
      resourceNumber: 51,
      payload: {
        status: 'pass',
        failureMessage: null,
      },
    },
  });

  return tape;
}

/**
 * Length of the tape loop in milliseconds. Stub hook reschedules at this
 * interval so demo rehearsals can loop the full sequence cleanly.
 */
export const MOCK_TAPE_DURATION_MS = 90_000;
