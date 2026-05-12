# Contract: Hera to Persephone

**Edge type**: intra-wave (Wave 2 internal)
**Wave**: Wave 2 producer to Wave 2 consumer
**Status**: locked
**Authored**: 2026-05-12 15:25 WIB

## Producer

**Worker**: Hera (Wave 2)
**Domain**: Sprint Mode HERO 14 PM concept visual mapping overlay. Hera authors building-overlay state machine (scaffolding, crane, blueprint pin, transient green glow, yellow tape, smoke/retak, size badge, City Hall banner, district border, DoD checklist, inspector NPC, red bridge, ghost building handoff to Asclepius, retak pattern handoff to Asclepius). Click-building interaction reveals ticket context. PR-to-Building auto-sync state.

## Consumer

**Worker**: Persephone (Wave 2)
**Domain**: AI residents chat panel + ticket panel + side panel UI. Persephone mounts ticket panel populated with the building context that Hera publishes when user clicks a building. Hera and Persephone share Wave 2 capacity but Persephone's panel architecture consumes Hera's selected-building state.

## Output schema (producer to consumer)

Hera exposes a Zustand store + click event publisher. Persephone subscribes for ticket panel content.

```typescript
// frontend/src/modes/sprint/heraStore.ts (Hera authors)
import { create } from 'zustand';
import type { BuildingData } from '@/scene/buildings/types';

export type SprintStatus =
  | 'foundation'   // Issue opened, no PR
  | 'frame'        // PR opened, scaffolding visual
  | 'painting'     // PR review requested, crane + inspector
  | 'finished'     // PR merged, scaffolding removed
  | 'unfinished';  // Issue closed without PR merged (drift Pattern B)

export interface PRComment {
  id: string;
  githubLogin: string;
  avatarUrl: string;
  body: string;
  createdAt: string;
  /** Resolved state; surfaces as visual differentiation per OQ-05 decided. */
  resolved: boolean;
}

export interface BuildingSprintContext {
  /** Building this context applies to. */
  buildingId: string;
  /** Sprint status state machine. */
  sprintStatus: SprintStatus;
  /** Linked GitHub PR if any. */
  prNumber: number | null;
  prTitle: string | null;
  prUrl: string | null;
  /** Linked GitHub issue. */
  issueNumber: number | null;
  issueTitle: string | null;
  issueUrl: string | null;
  /** Assignee GitHub login. */
  assignee: string | null;
  /** Story points (size badge). */
  storyPoints: number | null;
  /** DoD checklist items. */
  dodChecklist: { label: string; checked: boolean }[];
  /** PR comments surfaced visually on the building. */
  prComments: PRComment[];
  /** Reviewer-requested list. */
  reviewersRequested: string[];
  /** Approved reviewers. */
  reviewersApproved: string[];
}

interface HeraStoreState {
  /** Map of building id to sprint context. */
  contexts: Record<string, BuildingSprintContext>;
  /** Currently selected building id (null = none). */
  selectedBuildingId: string | null;

  // Actions
  setContext: (buildingId: string, context: BuildingSprintContext) => void;
  updateContext: (buildingId: string, patch: Partial<BuildingSprintContext>) => void;
  selectBuilding: (buildingId: string | null) => void;
  clearSelection: () => void;
}

export const useHeraStore: () => HeraStoreState;

/** Subscribe-only hook returning the currently selected building context. */
export const useSelectedBuildingContext: () => BuildingSprintContext | null;
```

Persephone consumes for ticket panel content:

```tsx
// frontend/components/panels/TicketPanel.tsx (Persephone)
import { useSelectedBuildingContext, useHeraStore } from '@/modes/sprint/heraStore';

export const TicketPanel: React.FC = () => {
  const context = useSelectedBuildingContext();
  const clearSelection = useHeraStore((s) => s.clearSelection);

  if (!context) return null;

  return (
    <aside className="ticket-panel-content">
      <header>
        <h3>{context.issueTitle || context.prTitle || 'No linked ticket'}</h3>
        <button onClick={clearSelection}>Close</button>
      </header>
      {/* Assignee avatar + GitHub username, story points badge, status mapping, linked PR list, DoD checklist, comments timeline */}
    </aside>
  );
};
```

## Storage location

- Store: `frontend/src/modes/sprint/heraStore.ts` (Hera)
- Ticket panel component: `frontend/components/panels/TicketPanel.tsx` (Persephone)
- Mounted at parallel route slot: `frontend/app/city/@ticket/default.tsx` (Persephone wires TicketPanel render conditional on `context !== null`)

## Asumption baked

1. Zustand chosen over React Context for cross-tree state sharing (sprint overlay visual lives in Canvas tree, ticket panel lives in aside slot; Zustand cuts through tree boundaries).
2. SprintStatus enum is canonical state machine: foundation -> frame -> painting -> finished, with `unfinished` as drift Pattern B sink state. PR-to-Building auto-sync transitions match webhook events from Hades.
3. PRComment.resolved Wave 2 mock data; Wave 3 wired to GitHub PR review comment state via webhook.
4. dodChecklist Wave 2 mock data; PRD AD-10 future enhancement: parse from issue body markdown `- [ ]` syntax.
5. Click-building dispatches `selectBuilding(buildingId)`. Multiple click receivers safe (Zustand action is idempotent).
6. Hera does NOT mutate Iris's BuildingData; Hera state lives in separate store.

## Validation steps

**Producer responsibility (Hera)**:
- Zustand store initialized once at scene mount; SprintContext populated from mock data Wave 2.
- 14 PM concept visuals overlay correctly per building sprint status.
- Click-building event dispatches `selectBuilding` exactly once per click (no debounce needed at click level; r3f raycaster handles single dispatch).
- State machine transitions validated: foundation -> frame requires PR opened event; frame -> painting requires review requested; etc.
- Smoke test: click each archetype building, observe state context in dev tools.

**Consumer responsibility (Persephone)**:
- Ticket panel slot renders `TicketPanel` component reading from `useSelectedBuildingContext`.
- Conditional render: if context null, slot returns null (no empty panel UI).
- Glassmorphism accent on resident vignette cards if context.assignee matches a resident username (Athena/Apollo/Argus/Clio/Hermes).
- Smoke test: click building, ticket panel slides in with sprint context; click close, panel slides out.

## Edge case handling

- Building has no linked PR or issue: ticket panel shows minimal context (just building id + label).
- Multiple PRs touching same building: latest PR wins for sprintStatus; full PR list displayed in panel.
- Click rapid succession: latest click wins for `selectedBuildingId`; Persephone reactively updates content.
- State machine invalid transition (e.g., webhook fires merge before review requested): Hera logs warning + accepts transition (event ordering already preserved by Hades webhook handler).

## Open questions

- OQ-05 (PR comment surfacing visual): Hera decides hari-H; Persephone's ticket panel comment timeline follows Hera's visual decision. Cross-reference `iris-to-hera.md` for OQ-05 reference.
- PRD Section 9.2 14 PM concept mapping table: some concepts (ghost building, retak pattern) handoff to Asclepius Wave 2 Refactor + Health Modes; Hera retains scaffolding/crane/banner.

## Reference

- Metis Agentic Structure md Section 2 DAG: Hera sprint overlay state consumed by Persephone ticket-panel
- Metis Section 5.4 Hera + Persephone ship criteria
- PRD Section 9.2 (Sprint Mode HERO 14 PM concept visual mapping table)
- PRD Section 25 OQ-05 (PR comment surfacing visual)
- Contract `iris-to-hera.md` (BuildingData consumed by Hera for overlay)
