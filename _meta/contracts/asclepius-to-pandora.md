# Contract: Asclepius to Pandora

**Edge type**: cross-wave (Wave 2 to Wave 3)
**Wave**: Wave 2 producer to Wave 3 consumer
**Status**: locked
**Authored**: 2026-05-12 15:34 WIB

## Producer

**Worker**: Asclepius (Wave 2)
**Domain**: Refactor Mode ghost building visual + ghost-to-solid animation real-time, drafts/ simulation visual, dual review gate buttons UI (Run Simulation + Accept changes + Discard). Asclepius defines the ghost-to-solid animation hook (subscription point for simulation event stream) that Pandora's simulation engine emits via WebSocket. Asclepius does not own simulation logic; it owns the visual response.

## Consumer

**Worker**: Pandora (Wave 3)
**Domain**: Athena proposal author (V4-Pro thinking high) + OpenSpec change folder generator (Folder A) + Refactor Mode simulation engine multi-turn + drafts/ isolation + dual review gate backend wiring. Pandora is producer of simulation events; Asclepius is consumer. But this contract documents Asclepius's visual hook expectations that Pandora must honor when publishing events.

**Note**: The DAG arrow direction Metis Section 2 reads "Asclepius to Pandora" indicating Asclepius defines the schema; Pandora implements as producer. Reverse-edge direction: Asclepius consumes events, Pandora produces. Schema authored from consumer's expectation perspective per common pattern.

## Output schema (Asclepius defines, Pandora implements as producer)

```typescript
// frontend/src/modes/refactor/simulationEvents.ts (Asclepius authors types; Pandora produces)

export type SimulationStage =
  | 'proposed'          // Athena published proposal, ghost buildings appear
  | 'tests_generating'  // Turn 1 of simulation engine
  | 'tests_written'     // Turn 1 complete, failing tests in drafts/
  | 'impl_generating'   // Turn 2 of simulation engine
  | 'impl_written'      // Turn 2 complete, implementation in drafts/
  | 'diff_serializing'  // Turn 3 of simulation engine
  | 'completed'         // Drafts ready for review
  | 'accepted'          // User clicked Accept; ghost-to-solid transition
  | 'discarded';        // User clicked Discard; ghost fades

export interface GhostBuildingHint {
  /** Synthetic id for ghost building, prefixed "ghost-". */
  ghostId: string;
  /** Suggested position in city. */
  position: [number, number, number];
  /** Suggested archetype based on file type. */
  archetype: 'generic-residence' | 'generic-warehouse' | 'generic-office';
  /** Building dimensions. */
  width: number;
  height: number;
  depth: number;
  /** Connection lines to existing buildings (file references). */
  connections: { targetBuildingId: string; relationship: 'import' | 'reference' | 'callsite' }[];
  /** Tooltip label for ghost. */
  label: string;
  /** Suggested file path (where Pandora simulation would write). */
  suggestedFilePath: string;
}

export interface SimulationEvent {
  type: 'simulation.stage';
  /** Simulation id linking events; matches OpenSpec change folder name. */
  simulationId: string;
  stage: SimulationStage;
  /** Timestamp ISO 8601. */
  timestamp: string;
  /** Stage-specific payload. */
  payload: {
    /** When stage = 'proposed': ghost building hints. */
    ghostBuildings?: GhostBuildingHint[];
    /** When stage = 'tests_written' or 'impl_written': file paths affected. */
    filesAffected?: string[];
    /** When stage = 'completed': drafts directory path. */
    draftsPath?: string;
    /** When stage = 'accepted': downloaded diff file path. */
    diffFilePath?: string;
    /** Progress percentage 0..100 for in-progress stages. */
    progressPercent?: number;
    /** Error message if simulation failed at this stage. */
    error?: string;
  };
}

export interface RefactorProposalEvent {
  type: 'simulation.proposal';
  simulationId: string;
  /** OpenSpec change folder relative path. */
  openspecChangePath: string;
  /** Athena-authored proposal title. */
  title: string;
  /** Athena-authored proposal summary. */
  summary: string;
  /** User intent that triggered proposal. */
  userIntent: string;
  /** Ghost buildings to render. */
  ghostBuildings: GhostBuildingHint[];
  /** Timestamp ISO 8601. */
  timestamp: string;
}

export type RefactorEvent = SimulationEvent | RefactorProposalEvent;

/** Asclepius subscribes via this hook. */
export const useRefactorEvents: (simulationId: string | null) => RefactorEvent[];
```

Asclepius hook implementation Wave 2 mock + Wave 3 WebSocket subscription:

```typescript
// frontend/src/modes/refactor/useRefactorEvents.ts (Asclepius authors)
import { useEffect, useState } from 'react';

export function useRefactorEvents(simulationId: string | null): RefactorEvent[] {
  const [events, setEvents] = useState<RefactorEvent[]>([]);
  useEffect(() => {
    if (!simulationId) return;

    // Wave 2 mock: simulate stage progression via setTimeout
    // Wave 3 swap: subscribe to WebSocket channel /api/ws/refactor-events
    const ws = new WebSocket(`/api/ws/refactor-events?simulationId=${simulationId}`);
    ws.onmessage = (e) => {
      const event = JSON.parse(e.data) as RefactorEvent;
      setEvents((prev) => [...prev, event]);
    };
    return () => ws.close();
  }, [simulationId]);
  return events;
}
```

Pandora Wave 3 backend implementation:

```python
# backend/app/api/refactor.py (Pandora Wave 3)
from fastapi import APIRouter, BackgroundTasks, Depends
from pydantic import BaseModel
from app.services.simulation_engine import run_simulation

router = APIRouter(prefix="/api/refactor")


class SimulateRequest(BaseModel):
    user_intent: str
    target_repo: str


@router.post("/simulate")
async def simulate_refactor(
    req: SimulateRequest,
    background: BackgroundTasks,
    session: dict = Depends(require_session),
):
    """Triggers simulation engine multi-turn.

    Returns simulation_id immediately. Subscribe to /api/ws/refactor-events for stage updates.
    """
    simulation_id = generate_simulation_id(req.user_intent)
    background.add_task(run_simulation, simulation_id, req.user_intent, req.target_repo)
    return {"simulation_id": simulation_id}
```

`run_simulation` publishes events to event_bus matching SimulationEvent + RefactorProposalEvent schema. Pandora WebSocket endpoint streams to subscribed clients.

## Storage location

- Frontend types + hook: `frontend/src/modes/refactor/simulationEvents.ts` + `frontend/src/modes/refactor/useRefactorEvents.ts` (Asclepius)
- Backend simulation engine: `backend/app/services/simulation_engine.py` (Pandora Wave 3)
- Backend API endpoint: `backend/app/api/refactor.py` (Pandora Wave 3)
- Backend WebSocket endpoint: `backend/app/api/websocket.py` adds `/api/ws/refactor-events` (Pandora extends Hades' WebSocket setup from `hera-to-hades.md`)
- Drafts directory: `drafts/<simulation_id>/` (Pandora writes only; production code NEVER modified here)
- OpenSpec change folder: `openspec/changes/<simulation_id>/` (Pandora authors proposal.md + design.md + tasks.md)

## Asumption baked

1. Simulation engine 3-turn workflow per Phase B inferred algorithm: tests gen (V4-Pro think high), impl gen (V4-Pro think high), diff serial (V4-Flash non-think).
2. NEVER replay `reasoning_content` from prior turns (Phase B Topic E critical quirk).
3. drafts/ isolation safety property: production code NEVER changes here (PRD Section 12 safety lock + Pandora ship criteria). Only via explicit user Accept (PRD AD-19).
4. OpenSpec Folder A is panitia-facing; Pandora writes to Folder A (`openspec/changes/<id>/`). Folder B (`.agent-openspec/`) untouched by Pandora.
5. Ghost building hints include suggested position computed by Pandora; Iris does NOT recompute; Asclepius renders directly.
6. WebSocket channel `/api/ws/refactor-events` separate from `/api/ws/building-events` to keep per-simulation scoping clear.

## Validation steps

**Producer responsibility (Pandora)**:
- Implement `/api/refactor/simulate` endpoint with FastAPI BackgroundTasks (per OQ-01 Metis recommendation).
- Simulation engine publishes events to event_bus in order: proposed -> tests_generating -> tests_written -> impl_generating -> impl_written -> diff_serializing -> completed.
- Drafts isolation enforced: write only inside `drafts/<simulation_id>/`, no path traversal.
- Pandora unit test: simulate 2FA proposal on NodeGoat fork produces ghost buildings + valid OpenSpec change folder + drafts/ output with diff serialized.
- WebSocket endpoint streams events to subscribed clients matching SimulationEvent schema.

**Consumer responsibility (Asclepius)**:
- Subscribe to `/api/ws/refactor-events?simulationId=X` when user clicks "Run Simulation" button.
- Render ghost buildings per `RefactorProposalEvent.ghostBuildings` (mounted as r3f instancedMesh children in scene tree).
- Animate ghost-to-solid on stage 'accepted'; ghost fades on 'discarded'.
- Display stage progress UI per `SimulationEvent.payload.progressPercent`.
- Wave 2 mock: simulate stage progression via setTimeout for demo without Wave 3 backend.

## Edge case handling

- Simulation engine fails mid-run (DeepSeek API outage, drafts permission denied): Pandora publishes SimulationEvent with `error` field; Asclepius renders error state in dual review gate panel.
- User clicks Accept without simulation completed: dual review gate button disabled until stage 'completed'.
- Multiple concurrent simulations: each has unique simulation_id; WebSocket channels independent; Asclepius can render multiple ghost building sets if user fires multiple proposals (rare for demo).
- Drafts directory cleanup: Pandora deletes drafts on Accept (after diff serialized) or Discard; max 7 day retention as defensive cleanup.

## Open questions

- OQ-09 (Refactor "Accept changes" implementation): download diff (no upgraded OAuth scope) per Metis recommendation. Pandora's accept endpoint returns diff file URL; user downloads + applies manually. PR-create option deferred (requires `repo` scope NOT in PRD Section 19.3 minimal scope).
- Athena proposal author multi-turn coordination with Triton client: see `triton-to-pandora.md` contract.

## Reference

- Metis Agentic Structure md Section 2 DAG: Asclepius ghost-to-solid animation consumed by Wave 3 Pandora simulation engine
- Metis Section 5.4 Asclepius + Section 5.6 Pandora ship criteria
- PRD Section 9.3 (Refactor Mode SAFETY-FIRST: drafts/ sandbox + dual review gate)
- PRD Section 12 (drop protocol Refactor Mode safety property)
- PRD AD-19 (Refactor Mode drafts/ isolation + explicit Accept gate)
- PRD Section 18.6 (DeepSeek multi-turn coordination Refactor Mode)
- Phase B Topic E (DeepSeek V4 reasoning_content quirk)
- Contract `triton-to-pandora.md` (LLM client for Athena proposal author)
- Contract `pandora-to-asclepius.md` (feedback edge, ghost-to-solid simulation events)
