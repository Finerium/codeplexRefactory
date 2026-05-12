# Handoff: Hera Wave-Fixing #2 cycle 1 -> Asclepius

**From**: Hera (Wave-Fixing #2 cycle 1, STAMP=20260513-0336)
**To**: Asclepius (next cycle or future Wave-Fixing iteration)
**Subject**: Swap IssueFlyingPacket target from Athena City Hall fallback to BacklogOffice

## Context

Hera shipped `BacklogOffice.tsx` as a virtual building per PRD Section 9.2 lines 520-525. The Backlog Office is the canonical destination for the Hybrid Write Layer 1 flow (Apollo finding -> 1-click GitHub issue -> flying packet animation -> arrival on Backlog Office).

Currently, `frontend/src/modes/health/IssueFlyingPacket.tsx` line 217-218 falls back to the Athena landmark when no `targetBuildingId` is set, with a TODO comment lines 18-23:

> "Issue baru muncul di Backlog Office dengan flying animation... Falls back to Athena City Hall (the architect resident). Once Hera ships an explicit Backlog Office landmark, swap default to that."

Hera has now shipped the Backlog Office. This handoff requests Asclepius perform the swap.

## What to change

In `frontend/src/modes/health/IssueFlyingPacket.tsx`:

```typescript
// Existing import block
import { useCityData } from '@/scene/buildings';
// New import (add)
import { BACKLOG_OFFICE_POSITION, BACKLOG_OFFICE_BUILDING_ID } from '@/modes/sprint';

// Inside IssueFlyingPacketLayer.resolve:
const resolve = useMemo(() => {
  const map = new Map(city.buildings.map((b) => [b.id, b]));
  // OLD (remove):
  // const athenaBuilding = city.buildings.find((b) => b.landmark === 'athena');
  // const defaultTarget: [number, number, number] = athenaBuilding
  //   ? [
  //       athenaBuilding.position[0],
  //       athenaBuilding.position[1] + athenaBuilding.height + 2,
  //       athenaBuilding.position[2],
  //     ]
  //   : [0, 30, 0];

  // NEW: Hera Backlog Office is the canonical destination per PRD Section 9.2.
  // BACKLOG_OFFICE_POSITION is the base position; we offset Y for rooftop landing.
  const defaultTarget: [number, number, number] = [
    BACKLOG_OFFICE_POSITION[0],
    BACKLOG_OFFICE_POSITION[1] + 18, // base height (14) + roof (2.4) + 1.6 pad
    BACKLOG_OFFICE_POSITION[2],
  ];

  return (spec: FlyingPacketSpec) => {
    const source = map.get(spec.sourceBuildingId);
    // Resolve target: prefer explicit id (e.g., a Backlog Office id), else fall through to defaultTarget.
    const targetExplicit =
      spec.targetBuildingId === BACKLOG_OFFICE_BUILDING_ID
        ? null // sentinel for "use defaultTarget (Backlog Office)"
        : spec.targetBuildingId
          ? map.get(spec.targetBuildingId)
          : null;
    const sourcePos: [number, number, number] = source
      ? [
          source.position[0],
          source.position[1] + source.height + 1.5,
          source.position[2],
        ]
      : [0, 5, 0];
    const targetPos: [number, number, number] = targetExplicit
      ? [
          targetExplicit.position[0],
          targetExplicit.position[1] + targetExplicit.height + 2,
          targetExplicit.position[2],
        ]
      : defaultTarget; // Backlog Office or explicit non-file id
    return { sourcePos, targetPos };
  };
}, [city.buildings]);
```

Additionally, fire `dispatchBacklogOfficeEvent` after arrival so the BacklogOffice plays its golden arrival pulse:

```typescript
// SinglePacket onExpired callback or inside the arrival pulse window:
import { dispatchBacklogOfficeEvent } from '@/modes/sprint';

// When packet finishes arrival pulse:
dispatchBacklogOfficeEvent({
  type: 'issue.arrived',
  sourceBuildingId: spec.sourceBuildingId,
  issueNumber: spec.issueNumber,
  timestamp: performance.now(),
});
```

## What this gets you

1. Flying packets now land on the Backlog Office building (visible at +90, -60 in the city), matching PRD Section 9.2 line 524 "Issue terbang dari building yang ada finding ke Backlog Office sebagai visual confirmation create success".
2. The Backlog Office plays its arrival glow pulse (golden expanding sphere on the rooftop, 1.2s with opacity fade) per Hera D-Hera-06.
3. The Athena City Hall fallback is removed because the Hera Backlog Office is now the canonical destination. (Athena's landmark stays in place for the City Hall Banner + sprint goal milestone display, which are separate.)

## Anti-collision

Asclepius owns `frontend/src/modes/health/IssueFlyingPacket.tsx`. Hera does NOT modify this file. Asclepius performs the swap at their discretion / next cycle.

## Verdict

Hera Wave-Fixing #2 cycle 1 ship status: PASS-with-deferred for the IssueFlyingPacket target. The visible BacklogOffice building + clickability + arrival pulse channel + position constants are LIVE + exported via `@/modes/sprint` barrel. Asclepius can pick up the swap in their next cycle without coordination overhead.

If swapped before Day 2 submission window (jam 13:00), demo flow: judge clicks Apollo finding -> Convert to Backlog Ticket button -> packet flies from finding origin to Backlog Office rooftop -> golden glow pulse -> backlog count increments (visible in BacklogPanel if Persephone has shipped that variant).

If deferred past submission, the visible BacklogOffice + flying packet still demonstrates the flow visually; the packet lands on Athena City Hall (current fallback). Graceful degradation, not a regression.
