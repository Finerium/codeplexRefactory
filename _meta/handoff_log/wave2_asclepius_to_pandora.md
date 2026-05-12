# Handoff Log: Wave 2 Asclepius to Wave 3 Pandora

**Edge**: Wave 2 Asclepius (Refactor Mode visual + simulation event
consumer + dual review gate UI) to Wave 3 Pandora (simulation engine
multi-turn + drafts/ isolation + dual review gate backend wiring).
**Contracts**:
  - `_meta/contracts/asclepius-to-pandora.md` (Asclepius defines,
    Pandora implements as producer; canonical schema).
  - `_meta/contracts/pandora-to-asclepius.md` (Pandora publishes,
    Asclepius consumes; feedback edge).
**Date**: 2026-05-12 23:55 WIB
**Status**: Asclepius ship clean; awaiting Dike Wave 2 audit gate PASS
  to unlock Wave 3 Pandora spawn.

## What Asclepius delivers

### Public API surface (consume via `@/modes/refactor` barrel)

```typescript
import {
  // Composite root for Persephone side panel mode='refactor'
  RefactorMode,
  // Scene layer for Hera /city Canvas composition
  RefactorGhostLayer,
  // Granular components
  GhostBuilding,
  GhostToSolidAnimation,
  DualReviewGate,
  SimulationProgressIndicator,
  // Event hook
  useSimulationEvents,
  // Schema types (Wave 3 Pandora Pydantic mirror)
  type SimulationStage,
  type GhostArchetype,
  type GhostBuildingHint,
  type SimulationEventPayload,
  type SimulationEvent,
  type RefactorProposalEvent,
  type RefactorEvent,
  STAGE_LABEL,
  STAGE_TURN,
} from '@/modes/refactor';
```

### Mount pattern for Persephone Wave 2 + Hera Wave 2

Persephone `@side/refactor/page.tsx`:

```tsx
'use client';
import { RefactorMode } from '@/modes/refactor';
export default function RefactorModeSlot() {
  return <RefactorMode source="mock" />;
}
```

Hera `/city/page.tsx` scene composition (Hera Wave 2 owns):

```tsx
import { HealthGlowLayer } from '@/modes/health';
import { RefactorGhostLayer } from '@/modes/refactor';

// inside CityScene under ChronicleCanvas:
<>
  <BuildingInstances data={city} onBuildingClick={dispatchClick} />
  <HealthGlowLayer />
  <RefactorGhostLayer />
  <SprintOverlay />  {/* Hera owns */}
</>
```

### Behavioral guarantees

1. **9-stage SimulationStage enum locked**: per
   `asclepius-to-pandora.md` lines 25-35. Pandora publishes in strict
   stage order with `simulation.stage` event type.
2. **RefactorProposalEvent published once at Turn 0** (per
   `pandora-to-asclepius.md` Asumption 3): Asclepius caches the ghost
   building hints from this event; subsequent stage events do not
   repeat hints.
3. **Ghost building visual transitions**:
   - `stage = 'proposed'`: ghosts appear transparent + dashed edges
     animated (dashSize cycles every 1s).
   - `stage in 'tests_generating' | 'impl_generating' | 'diff_serializing'`:
     ghosts stay transparent; SimulationProgressIndicator shows
     turn-by-turn progress.
   - `stage = 'completed'`: dual review gate Accept + Discard buttons
     enabled. Ghosts still transparent.
   - `stage = 'accepted'`: GhostToSolidAnimation runs 1.5s easeOutCubic
     `solidProgress 0 -> 1`; opacity + emissive morph to solid.
   - `stage = 'discarded'`: GhostToSolidAnimation runs 0.7s easeOutCubic
     `fadeOut 0 -> 1`; ghosts dissolve.
4. **Dual review gate state lifecycle**:
   - `proposed`: only Run Simulation enabled.
   - In-flight stages: Run Simulation disabled; Discard enabled
     (abort-aware).
   - `completed`: Accept changes + Discard both enabled.
   - `accepted` / `discarded`: terminal; all 3 buttons display
     terminal text.
5. **Mock pump default**: `useSimulationEvents({ mode: 'mock' })`
   exposes `runSimulation()` that walks
   `buildMockEventSequence()` over ~14s wall-clock (Wave 2 demo
   timing approximates V4-Pro thinking high turns). Wave 3 swap =
   `mode: 'websocket'` + `simulationId`.
6. **Drafts isolation SAFETY-FIRST**: per PRD AD-19 + Asclepius
   prompt Lock 3, Asclepius **NEVER** writes to production code.
   All Wave 2 mock actions stop at store mutations + visual response.
   Pandora Wave 3 owns drafts/ filesystem writes (`drafts/<simulation-id>/`
   only) per contract Asumption 3.

## What Pandora Wave 3 needs to know

### Backend endpoints to implement

Per `asclepius-to-pandora.md` lines 128-155:

```python
# backend/app/api/refactor.py (Pandora Wave 3 authors)
@router.post("/simulate")
async def simulate_refactor(req: SimulateRequest, ...):
    simulation_id = generate_simulation_id(req.user_intent)
    background.add_task(run_simulation, simulation_id, ...)
    return {"simulation_id": simulation_id}

@router.post("/{simulation_id}/accept")
async def accept_refactor(simulation_id: str, ...):
    # Apply diff from drafts/<simulation_id>/diff.patch to production
    # Archive OpenSpec change folder via openspec archive
    # Publish stage='accepted' event
    ...

@router.post("/{simulation_id}/discard")
async def discard_refactor(simulation_id: str, ...):
    # Publish stage='discarded' event
    # Cleanup drafts/<simulation_id>/ on best-effort
    ...
```

### Event publishing matrix

Pandora publishes the following events to the WebSocket channel
`/api/ws/refactor-events?simulationId=<id>` in order:

| Sequence | Event type | Stage / payload |
|---|---|---|
| 1 (Turn 0) | `simulation.proposal` | RefactorProposalEvent with title + summary + userIntent + ghostBuildings + openspecChangePath |
| 2 (Turn 1 start) | `simulation.stage` | stage='tests_generating', progressPercent ~10 |
| 3 (Turn 1 complete) | `simulation.stage` | stage='tests_written', progressPercent ~35, filesAffected |
| 4 (Turn 2 start) | `simulation.stage` | stage='impl_generating', progressPercent ~45 |
| 5 (Turn 2 complete) | `simulation.stage` | stage='impl_written', progressPercent ~78, filesAffected |
| 6 (Turn 3 start) | `simulation.stage` | stage='diff_serializing', progressPercent ~88 |
| 7 (Turn 3 complete) | `simulation.stage` | stage='completed', progressPercent 100, draftsPath |
| 8 (user clicks Accept) | `simulation.stage` | stage='accepted', diffFilePath |
| 8' (user clicks Discard) | `simulation.stage` | stage='discarded' |
| Failure path | `simulation.stage` | error field set; client renders red banner |

### Ghost building position computation

Pandora computes `GhostBuildingHint.position` per ghost. Constraint:
position MUST NOT collide with existing Iris building positions
(z-fight risk). Wave 2 mock uses positions outside the treemap
envelope (x = 68+, well past the [-60, +60] city extent). Wave 3
Pandora can adopt the same strategy or compute "adjacent district"
positions deterministically.

See `_meta/uncertainty/asclepius-cycle4-20260512-2350.md` U-Ascl-002
for the rationale + reservation.

### drafts/ isolation safety property

Per PRD AD-19 + Section 12.4 + `asclepius-to-pandora.md` Asumption 3,
Pandora MUST honor the strict rule:

- ALL simulation engine writes go to `drafts/<simulation_id>/` only.
- Production code (`backend/app/...`, `frontend/...`, etc.) NEVER
  changes during simulation.
- Only the user-explicit `POST /api/refactor/{simulation_id}/accept`
  endpoint applies the drafts diff to production. No silent apply.
- Failure of this safety property = pitch defensibility loss
  (judges Q&A: "AI yang ngarang itu mahal. Refactor yang salah bisa
  break production." per PRD line 97).

### DeepSeek V4 reasoning_content quirk

Per Phase B Topic E + `asclepius-to-pandora.md` Asumption 2, Pandora
multi-turn coordination MUST NOT replay `reasoning_content` from
prior turns. This is a CRITICAL anti-pattern from the DeepSeek API
quirk. Triton client provides the helper to strip
`reasoning_content` before next-turn submission.

## Validation steps for Pandora before consume

1. Visit `/asclepius-smoke` and verify the mock simulation runs:
   - Click "Run Simulation" -> Turn 1 pill activates within ~1 sec.
   - Watch Turn 1/2/3 pills progress through pending -> active -> complete.
   - "Accept changes" + "Discard" buttons enable when stage reaches
     'completed' (~14s after Run Simulation click).
   - Click "Accept changes" -> ghost buildings transition transparent
     to solid over 1.5s.
   - Click "Discard" -> ghost buildings fade out over 0.7s.
2. Implement `/api/ws/refactor-events` WebSocket endpoint per
   `pandora-to-asclepius.md` lines 69-79.
3. Test event publishing order matches the matrix above by sending
   mock events through a unit test against the actual Asclepius
   `useSimulationEvents({ mode: 'websocket' })` consumer.
4. Test the dual review gate accept/discard endpoint integration:
   POST to the simulate -> WebSocket events flow -> POST accept
   triggers ghost-to-solid animation -> POST discard triggers
   ghost-fade-out.

## Open questions

- **OQ-09 Accept implementation per Metis recommendation**: download
  diff (no `repo` write scope). Pandora returns diff URL on accept;
  Asclepius frontend triggers browser download. Updated UX hint can
  land in DualReviewGate accept toast.
- **Real-time per-stage progress percentage**: PRD Section 9.3
  mentions progress per stage. Wave 3 default per
  `pandora-to-asclepius.md` Open question = stage-level granularity
  only. Asclepius UI handles smooth percent transitions if Pandora
  streams them; default 0/35/78/100 also acceptable.
- **Simulation cancel mid-turn**: see U-Ascl-003. Pandora chooses
  best-effort cancel + cleanup-on-next-poll strategy if DeepSeek API
  does not support mid-turn abort.

## Asclepius ship status

- Ship clean per `.claude/agents/asclepius.md` Section 10 ship
  criteria items 4-6 + 7-9 + 13-15.
- 4 mandatory artifact authored (this handoff + Triton handoff +
  decision log + uncertainty journal + checkpoint).
- 20-item self-check PASS (see `_meta/checkpoints/asclepius-cycle4.md`).
- Smoke route `/asclepius-smoke` ready for Dike audit benchmark
  with mock simulation + dual review gate functional.
- TypeScript clean on Asclepius-owned files.
- Ferry to V1 Orch: NOT triggered.

Dike Wave 2 audit will verify the Refactor Mode visual operational
item + dual review gate explicit 3-button surface + ghost-to-solid
animation + simulation progress turn-by-turn + contract conformance.
