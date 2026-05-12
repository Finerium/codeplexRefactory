# Handoff Log: Wave 2 Hera to Wave 2 Persephone (intra-wave)

**Edge**: intra-wave Wave 2 (Hera Sprint Mode HERO -> Persephone Panel UI)
**Contract**: `_meta/contracts/hera-to-persephone.md` (locked Wave 0 Pythia)
**Date**: 2026-05-12 ~23:55 WIB
**Producer**: Hera (Wave 2, Sprint Mode HERO 14 PM concept overlay)
**Consumer**: Persephone (Wave 2, panel UI architect)
**Status**: Hera SHIP CLEAN, contract surface stable for Persephone consume.

## What Hera delivers

### Public surface (consume via `@/modes/sprint` barrel)

```typescript
import {
  // Composite mount target
  SprintMode,
  SprintModeControls,

  // State hooks (Persephone TicketPanel consumes)
  useHeraStore,
  useSelectedBuildingContext,
  useBuildingContext,
  useConceptVisibility,
  useConceptVisible,

  // Click bridge (independent mount path; SprintMode auto-wires)
  useSprintClickToTicket,

  // Event hook (Wave 2 mock, Wave 3 Hades real WebSocket)
  useBuildingEvents,
} from '@/modes/sprint';

import type {
  // Canonical schema
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
  // 11 payload types for Hades Wave 3 publisher conformance
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
} from '@/modes/sprint';
```

### TicketPanel consume pattern (verbatim per Pythia contract Section "Output schema")

```tsx
// frontend/components/panels/ticket/TicketPanel.tsx (Persephone authors)
'use client';

import { useSelectedBuildingContext, useHeraStore } from '@/modes/sprint';

export function TicketPanel() {
  const context = useSelectedBuildingContext();
  const clearSelection = useHeraStore((s) => s.clearSelection);

  if (!context) {
    // Empty state: render a small placeholder; the slot region keeps its shape.
    return <div className="ticket-empty">Click a building to inspect ticket</div>;
  }

  return (
    <aside className="ticket-panel-content">
      <header>
        <h3>{context.issueTitle ?? context.prTitle ?? 'Unlinked ticket'}</h3>
        <button onClick={clearSelection}>Close</button>
      </header>
      {/* Assignee avatar + GitHub username (context.assignee) */}
      {/* Story points badge (context.storyPoints, "XS"|"S"|"M"|"L"|"XL") */}
      {/* Status (context.sprintStatus, 5-state machine) */}
      {/* Linked PR (context.prNumber + context.prTitle + context.prUrl) */}
      {/* DoD checklist (context.dodChecklist, [{label, checked}]) */}
      {/* PR comments timeline (context.prComments, threaded list) */}
      {/* Milestone (context.milestone, e.g. "Sprint 14: Security hardening") */}
      {/* Reviewers requested/approved (context.reviewersRequested + reviewersApproved) */}
      {/* Dependencies (context.dependencies, building ids) */}
      {/* CI status (context.ciStatus, "pass"|"fail"|"pending") + ciFailCount */}
    </aside>
  );
}
```

### Behavioral guarantees from Hera

1. **Stable hook surface across Wave 2 -> Wave 3**: when Hades wires real WebSocket Wave 3, `useBuildingEvents` swap source 'mock-tape' -> 'live-websocket', return shape unchanged. `useSelectedBuildingContext` schema unchanged.
2. **Click event multi-subscriber-safe**: Iris's `useBuildingClick` is fanout-safe (Asumption 4 in `iris-to-hera.md`). Hera and Persephone subscribe independently. Hera's handler dispatches `selectBuilding(id)`; Persephone's handler dispatches `panelStore.setSelectedBuildingId(id)`. Both fire on the same click; no conflict.
3. **Handler stability discipline**: Hera's `useSprintClickToTicket` uses `useCallback` to stabilize the handler identity. Persephone's `useBuildingTicket` MUST do the same (currently inline closure in `frontend/components/panels/ticket/useBuildingTicket.ts:48`; Persephone fix opportunity to avoid React 19 strict mode + zustand v5 max-update-depth loop; Hera caught this in own code Cycle 5).
4. **heraStore actions stable identity**: `selectBuilding`, `clearSelection`, `applyEvent`, etc. are stable across renders (zustand canonical). Persephone selectors using these as useEffect deps are safe.
5. **Mock tape isolation**: Wave 2 mock events run via `useBuildingEvents` setTimeout chain. Each tape event logs `[hera/mock] dispatched <type> on building <id> at t=<ms>ms` so Persephone debugging can distinguish tape-driven state from user-action-driven state. Wave 3 Hades wired real WebSocket has no such label.

## What Persephone needs to know

### OQ-05 PR comment surfacing visual locked

Per `_meta/decisions/oq05_pr_comment_surfacing.md`, Hera ships the **sticky-note 3D variant** for PR comment visual on the building face. Persephone's TicketPanel comment timeline section MUST visually align with the sticky-note 3D theme:

- Use paper-yellow background tint for comment cards (matches sticky note paper SPRINT_PALETTE.stickyNotePaper `#f7e07a`)
- Unread comments use red badge for unread count (matches sticky note badge `#e22128`)
- Resolved comments use a green check + faded paper tint (matches green halo emissive `#5dffaa`)

### State machine schema

5-state SprintStatus enum per Pythia canonical (see `frontend/src/modes/sprint/types.ts`):
- `'foundation'` (issue opened, no PR)
- `'frame'` (PR opened, scaffolding visual)
- `'painting'` (PR review requested, crane + inspector)
- `'finished'` (PR merged, scaffolding cleared)
- `'unfinished'` (PR closed without merge, drift Pattern B sink state)

Persephone's TicketPanel `<StatusMapping>` component (per `frontend/components/panels/ticket/StatusMapping.tsx`) MUST translate these 5 enum values into the GitHub Issue/PR status terms users expect (e.g., `foundation` -> "To Do", `frame` -> "In Progress", `painting` -> "In Review", `finished` -> "Done", `unfinished` -> "Dropped").

### DoD checklist seeding

Hera's reducer seeds a default 5-item DoD checklist when `pr.opened` event fires for a building without prior dodChecklist. Items:
1. Tests added or updated
2. Code review approved
3. CI pipeline green
4. Documentation updated
5. No regression in linked features

Persephone's TicketPanel renders these checkboxes; user click toggles via `useHeraStore.updateContext(buildingId, { dodChecklist: <new array> })`. Hera reducer auto-checks "Code review approved" when `pr.approved` fires + "CI pipeline green" when `ci.pass` fires + all items when `pr.merged` fires.

PRD AD-10 future: parse from issue body markdown `- [ ]` syntax. Wave 2 stub default OK.

### Concept 14 (Refactor stage) handoff to Asclepius

Hera publishes `refactorStage` field in BuildingSprintContext per Pythia contract, but does NOT render ghost geometry or retak crack overlay (Asclepius Wave 2 RefactorMode + HealthMode scope). Persephone's TicketPanel renders the refactorStage value (e.g., as a labeled badge "Refactor: simulating" if `context.refactorStage === 'simulating'`); the visual ghost geometry comes from Asclepius's parallel overlay.

Asclepius reads `useHeraStore.contexts[id].refactorStage` to drive ghost geometry visibility. Cross-worker integration verified via shared store reference.

### Cross-store coordination with Persephone's panelStore

Persephone's `usePanelStore` (`frontend/src/lib/panel-context/panelStore.ts`) maintains:
- `currentMode` (refactor / health / activity / onboarding / sprint)
- `selectedBuildingId` (cross-panel; mirror of `useHeraStore.selectedBuildingId`)
- `chatTarget` (resident routing)
- `ticketDismissed` (user-dismissed flag)

When user clicks building, BOTH stores update:
- Hera: `selectBuilding(id)` (drives 3D overlay highlight + TicketPanel useSelectedBuildingContext)
- Panel: `setSelectedBuildingId(id) + setTicketDismissed(false)` (drives panel slide-in animation + cross-panel state)

When user dismisses ticket panel:
- Panel: `setTicketDismissed(true)` (panel slides out)
- Hera: NO action; selection persists (other modes may still want it; only Esc key clears Hera selection)

When user presses Escape:
- Panel: `clearAllSelections()`
- Hera: `clearSelection()` (Persephone's useBuildingTicket binds this via useEffect)

This 2-store coordination is intentional per D-Hera-01 + Persephone D6 + Pythia contract Asumption 1. Single store would collapse the 3D visual selection vs panel dismissal concerns.

## Validation Persephone should perform

1. Click any building in `/city` 3D scene. Verify:
   - `useHeraStore.selectedBuildingId` becomes the building id (DevTools Inspector or `useHeraStore.getState().selectedBuildingId`)
   - `usePanelStore.selectedBuildingId` mirrors it
   - TicketPanel slides in via Persephone's animation
   - TicketPanel reads `useSelectedBuildingContext()` non-null
   - Sprint context fields populate (if mock tape has fired events for that building)
2. Toggle 14 PM concept chips in SprintModeControls. Verify:
   - Each chip toggle hides/shows the corresponding 3D overlay
   - Reset button restores DEFAULT_CONCEPT_VISIBILITY (13 ON, refactor-stage OFF)
3. Wait for the 90-second mock tape loop. Verify:
   - DoD checklist auto-populates as PR events progress on the demo building
   - PR comment sticky note appears with badge count when `comment.created` fires
   - Green halo glow appears 30s after `pr.approved` and decays over 30 minutes
   - Yellow tape appears on the blocked building B
   - Red bridge connects A -> B after `dependency.added` event

## Open question deferred to Wave 3

- **OQ-06 Earthquake error visual**: Daedalus Canvas.tsx line 454-460 reserves `<CameraShake>` slot for Wave 3 Nemesis wiring. Hera's CI-fail `<SmokeRetakOverlay>` is the BUILDING-LOCAL visual; the CITY-WIDE earthquake (camera shake) is a separate Daedalus + Nemesis cascade. Persephone may surface a global toast banner ("Apollo detected critical finding cluster") when Wave 3 wires the trigger, but Wave 2 stub: no banner.

## Ferry to Persephone

NOT triggered. Surface is contract-compliant, Persephone consumes via stable `@/modes/sprint` barrel imports. If Persephone surfaces:
- Type mismatch on heraStore field: ferry to V1 Orch with reference to canonical Pythia contract line
- Click event not firing TicketPanel: check `useCallback` handler stability in Persephone's `useBuildingTicket.ts` (see Behavioral guarantee 3 above)
- Concept toggle UI conflict with chat/side panels: Hera's `.hera-sprint-controls` is positioned `top: 1.25rem; left: 1.25rem; z-index: 30`. Persephone's side panel anchored left dock 18rem (`.city-side-slot`); the chip pill sits above-left of the side panel. Visually verified in Playwright snapshot Cycle 5 (no DOM collision).

## Hera contract integrity self-check

- [x] heraStore.applyEvent reducer is pure functional (no fetch, no setTimeout, no side-effects)
- [x] State transitions documented in `_meta/decision_log/hera.md` D-Hera-03
- [x] Idempotent over duplicate events (PRComment dedup by id, BuildingEvent dedup by `(buildingId, type, timestamp)` left to caller, Hades Wave 3 dedups by webhook delivery id per `hera-to-hades.md` Edge case line 226)
- [x] Wave 2 mock isolation labeled at file head + console log + DOM tag visible to user
- [x] No mutation of Iris BuildingData (Hera reads only; mutations would violate `iris-to-hera.md` Asumption 3)
