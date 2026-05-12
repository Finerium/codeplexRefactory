# Handoff: Hera Wave-Fixing #2 cycle 1 -> Persephone

**From**: Hera (Wave-Fixing #2 cycle 1, STAMP=20260513-0336)
**To**: Persephone (next cycle or future Wave-Fixing iteration)
**Subject**: Backlog Office TicketPanel variant (PRD Section 9.2 lines 520-525)

## Context

Hera shipped `BacklogOffice.tsx` as a scene-level virtual building rendered as child of `<SprintMode />`. The building is visible in the 3D city at world position `[90, 0, -60]` (north-east corner, outside the treemap), distinct visual recipe (sandstone base + red mailbox + flag + plaque), clickable.

Click handler dispatches `selectBuilding('__backlog_office__')` on `useHeraStore` so the existing `useSelectedBuildingContext` selector returns the context for that id (which will be `null` since no event ever populates it via mockCityData treemap path).

## What Persephone should add

A `BacklogPanel` variant of TicketPanel (or a new top-level component swapped into the @ticket slot) that triggers when `selectedBuildingId === BACKLOG_OFFICE_BUILDING_ID`. The panel should surface, per PRD Section 9.2 line 525:

> Click Backlog Office -> backlog panel: list semua open issue tanpa milestone, sorted by priority (label-based), filter by label/assignee/age, story points roll-up

### Suggested implementation sketch

```typescript
// frontend/components/panels/ticket/TicketPanel.tsx (extend)
import { BACKLOG_OFFICE_BUILDING_ID } from '@/modes/sprint';
import { BacklogPanel } from './BacklogPanel'; // new

export function TicketPanel({ className }: TicketPanelProps) {
  const { context, dismissed, close } = useBuildingTicket();
  const selectedId = useHeraStore((s) => s.selectedBuildingId);

  if (selectedId === BACKLOG_OFFICE_BUILDING_ID) {
    return <BacklogPanel onClose={close} className={className} />;
  }
  // ... existing rendering for file-based building tickets
}
```

`BacklogPanel` schema:
- Header: "Backlog" + open issue count
- Body: list of issues sorted by priority label (P0, P1, P2, P3)
  - Each item: title + assignee avatar + size badge + age (days since opened) + labels
- Filters: by label, by assignee, by age range
- Footer: story points roll-up (sum of size points across visible filtered issues)
- Close button -> `heraStore.clearSelection()`

### Data source

Wave 2 stub: synthetic mock list of ~10 backlog issues (no milestone). Author at `frontend/components/panels/ticket/__mock__/backlog_issues.ts` with the same label pattern as the Sprint mock tape.

Wave 3 swap: Demeter service `/api/backlog/issues` returns real GitHub issues without milestone.

## Imports available from Hera barrel

```typescript
import {
  BACKLOG_OFFICE_BUILDING_ID,    // '__backlog_office__'
  BACKLOG_OFFICE_POSITION,        // readonly [number, number, number]
  useBacklogOfficePosition,       // returns rooftop position [x, y, z]
  useBacklogOfficeEvents,         // subscribe to issue.arrived events
  dispatchBacklogOfficeEvent,     // fire issue.arrived (e.g., after PRD Section 12.1 Layer 1 Convert-to-Backlog-Ticket flow)
} from '@/modes/sprint';
```

## Anti-collision

Persephone owns:
- `frontend/components/panels/ticket/*` (TicketPanel + new BacklogPanel)
- `frontend/components/panels/side/*`
- `frontend/lib/panel-context/*`

Hera does NOT modify these files in this handoff. The BacklogPanel implementation is fully at Persephone discretion.

## Verdict

Hera Wave-Fixing #2 cycle 1 ship status: PASS-with-deferred for Backlog Office. The visible 3D building + clickability + arrival pulse channel are LIVE. The backlog panel variant is deferred to a future cycle.

If Persephone picks this up before Day 2 submission window (jam 13:00), demo can showcase the full flow: judge clicks Backlog Office building -> backlog panel slides in -> shows real (or mock) open issues without milestone.

If deferred past submission, the Backlog Office is still visible + clickable; the @ticket slot falls through to the existing "Click a building to inspect its ticket." placeholder (graceful degradation, not a regression).
