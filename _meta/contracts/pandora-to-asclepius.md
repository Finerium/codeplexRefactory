# Contract: Pandora to Asclepius (Feedback)

**Edge type**: feedback (Wave 3 to Wave 2)
**Wave**: Wave 3 producer to Wave 2 consumer
**Status**: locked
**Authored**: 2026-05-12 16:20 WIB

## Producer

**Worker**: Pandora (Wave 3)
**Domain**: Refactor Mode simulation engine multi-turn + Athena proposal author + drafts/ isolation + dual review gate backend. Pandora publishes simulation stage events via WebSocket; Asclepius consumes for ghost-to-solid animation visual feedback.

## Consumer

**Worker**: Asclepius (Wave 2)
**Domain**: Refactor Mode ghost building visual + ghost-to-solid animation real-time, dual review gate buttons UI. Asclepius defined the consumer schema in `asclepius-to-pandora.md` (SimulationEvent + RefactorProposalEvent + GhostBuildingHint types). This contract documents Pandora's publish responsibility (reverse direction of `asclepius-to-pandora.md`).

## Output schema (producer to consumer)

Pandora publishes events matching the schema defined in `asclepius-to-pandora.md`. The WebSocket channel is `/api/ws/refactor-events?simulationId=<id>`.

```python
# backend/app/services/simulation_engine.py (Pandora extends, publishes events)
from app.services.event_bus import publish_refactor_event
from datetime import datetime


class SimulationEngine:
    async def _publish_stage(
        self,
        simulation_id: str,
        stage: str,
        payload: dict,
    ) -> None:
        """Publishes SimulationEvent to refactor event bus channel."""
        await publish_refactor_event({
            "type": "simulation.stage",
            "simulation_id": simulation_id,
            "stage": stage,
            "timestamp": datetime.utcnow().isoformat(),
            "payload": payload,
        })

    async def _publish_proposal(
        self,
        simulation_id: str,
        openspec_change_path: str,
        title: str,
        summary: str,
        user_intent: str,
        ghost_buildings: list[dict],
    ) -> None:
        """Publishes RefactorProposalEvent at Turn 0 (proposal authored)."""
        await publish_refactor_event({
            "type": "simulation.proposal",
            "simulation_id": simulation_id,
            "openspec_change_path": openspec_change_path,
            "title": title,
            "summary": summary,
            "user_intent": user_intent,
            "ghost_buildings": ghost_buildings,
            "timestamp": datetime.utcnow().isoformat(),
        })
```

Backend WebSocket route (Hades adds; Pandora orchestrates publish):

```python
# backend/app/api/websocket.py (Hades adds refactor events route)

@router.websocket("/api/ws/refactor-events")
async def refactor_events_ws(websocket: WebSocket, simulationId: str):
    """Streams RefactorEvent messages for specified simulation_id."""
    await websocket.accept()
    try:
        async for event in event_bus.subscribe_refactor_events(simulation_id=simulationId):
            await websocket.send_json(event)
    except WebSocketDisconnect:
        pass
```

Asclepius subscribe pattern (from `asclepius-to-pandora.md`):

```typescript
// frontend/src/modes/refactor/useRefactorEvents.ts (Asclepius)
import { useEffect, useState } from 'react';
import type { RefactorEvent } from './simulationEvents';

export function useRefactorEvents(simulationId: string | null): RefactorEvent[] {
  const [events, setEvents] = useState<RefactorEvent[]>([]);
  useEffect(() => {
    if (!simulationId) return;
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

## Storage location

- Backend simulation engine: `backend/app/services/simulation_engine.py` (Pandora publishes)
- Backend event bus: `backend/app/services/event_bus.py` (Hades, with `publish_refactor_event` + `subscribe_refactor_events` helpers)
- Backend WebSocket route: `backend/app/api/websocket.py` (Hades adds endpoint)
- Frontend hook + types: `frontend/src/modes/refactor/useRefactorEvents.ts` + `simulationEvents.ts` (Asclepius authors per `asclepius-to-pandora.md`)
- Drafts directory: `drafts/<simulation_id>/` (Pandora writes; Asclepius does NOT read directly, only consumes events)

## Asumption baked

1. Event ordering: Pandora publishes events in strict stage order (proposed -> tests_generating -> tests_written -> impl_generating -> impl_written -> diff_serializing -> completed -> accepted/discarded).
2. WebSocket delivery best-effort; Asclepius gracefully handles out-of-order delivery (latest stage wins).
3. ghost_buildings hints published once at Turn 0 (RefactorProposalEvent); subsequent stage events don't repeat. Asclepius caches.
4. Accept/Discard events published when user clicks button (frontend POST /api/refactor/accept|discard -> Pandora publishes event).
5. Drafts directory cleanup: Pandora deletes drafts on Accept (after diff downloaded) or Discard immediately. Asclepius does NOT cleanup.

## Validation steps

**Producer responsibility (Pandora)**:
- Publish RefactorProposalEvent at Turn 0 before any SimulationEvent.
- Publish SimulationEvent at each stage start + complete (typical 7+ events per simulation).
- Publish accept/discard event on user action.
- Smoke test: simulate 2FA proposal on NodeGoat, observe 8+ events arrive in correct order at WebSocket subscriber.

**Consumer responsibility (Asclepius)**:
- Subscribe to WebSocket on `simulationId` set (when user clicks "Run Simulation").
- Render ghost buildings on RefactorProposalEvent.
- Animate ghost-to-solid on stage 'accepted'.
- Fade ghost on stage 'discarded'.
- Display progress UI per stage (text labels per stage).

## Edge case handling

- WebSocket disconnect: Asclepius reconnects; backfills via `GET /api/refactor/{simulation_id}/events?since=<timestamp>` (Demeter authors backfill query).
- Simulation aborted mid-run (server crash): Asclepius detects no events for 30s + queries backend; if status returns 'aborted', renders error state.
- Multiple concurrent simulations: each has its own WebSocket connection per simulationId; Asclepius renders multiple ghost building sets if visible.
- Stage event with stale timestamp (e.g., out-of-order delivery): Asclepius ignores if stage already advanced past.

## Open questions

- Real-time progress percentage: PRD Section 9.3 mentions per-stage progress; Pandora can include progress_percent in payload (e.g., test gen progress as LLM streams response). Wave 3 default = stage-level granularity only; per-stage progress percentage if rehearsal feedback warrants.
- Accept button -> diff download: per OQ-09 Metis recommendation = download diff (no PR create). Pandora's `POST /api/refactor/accept` returns diff URL; frontend triggers download.

## Reference

- Metis Agentic Structure md Section 2 DAG: Pandora simulation events consumed by Wave 2 Asclepius ghost-to-solid trigger, feedback edge
- Metis Section 5.4 Asclepius + Section 5.6 Pandora ship criteria
- PRD Section 9.3 (Refactor Mode SAFETY-FIRST + drafts/ sandbox + dual review gate)
- PRD AD-19 (drafts/ isolation safety property)
- PRD Section 25 OQ-09 (Accept changes implementation)
- Contract `asclepius-to-pandora.md` (consumer schema definition; reverse direction)
- Contract `pandora-to-demeter.md` (simulation events persist; this contract is the visual feedback parallel)
