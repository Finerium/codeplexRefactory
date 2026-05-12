# Contract: Nemesis to Asclepius (Feedback)

**Edge type**: feedback (Wave 3 to Wave 2)
**Wave**: Wave 3 producer to Wave 2 consumer
**Status**: locked
**Authored**: 2026-05-12 16:14 WIB

## Producer

**Worker**: Nemesis (Wave 3)
**Domain**: 5 Apollo detector + Argus CVSS scoring + 5 spec-drift A-E patterns. After scan persists findings to Demeter (`nemesis-to-demeter.md`), Nemesis (via event bus) publishes WebSocket events that drive Asclepius Wave 2 glow rendering. This is a feedback edge: Wave 3 backend output drives Wave 2 visual response.

## Consumer

**Worker**: Asclepius (Wave 2)
**Domain**: Health Mode glow window per severity (red critical, orange high, yellow medium), Apollo findings panel UI. Asclepius defined the consumer schema in `asclepius-to-triton.md` (ApolloFinding type, glow state). This feedback contract documents Nemesis's publish responsibility to populate that state.

## Output schema (producer to consumer)

Nemesis publishes findings to event bus; Asclepius subscribes via WebSocket channel `/api/ws/finding-events`.

```typescript
// frontend/src/modes/health/findingEvents.ts (Asclepius authors types, Nemesis publishes)

export type FindingEventType =
  | 'finding.detected'      // New finding from scan
  | 'finding.resolved'      // Finding resolved (status change)
  | 'finding.ticketed'      // Finding converted to GitHub issue
  | 'finding.snoozed'       // User snoozed finding
  | 'scan.started'          // Scan run beginning
  | 'scan.completed';       // Scan run finished

export interface FindingEvent {
  type: FindingEventType;
  /** Repo full name. */
  repoFullName: string;
  /** Scan run id (groups events from same scan). */
  scanRunId: string;
  /** Finding-specific data when type starts with 'finding.'. */
  finding?: {
    id: string;
    buildingId: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    category: 'hardcoded-secret' | 'outdated-dependency' | 'missing-auth' | 'unsafe-sql' | 'complex-untested';
    title: string;
    filePath: string;
    lineStart: number;
    lineEnd: number;
  };
  /** Scan summary when type = 'scan.completed'. */
  scanSummary?: {
    totalFindings: number;
    bySeverity: Record<'critical' | 'high' | 'medium' | 'low' | 'info', number>;
    byCategory: Record<string, number>;
    durationMs: number;
  };
  /** Timestamp ISO 8601. */
  timestamp: string;
}
```

Nemesis publish pattern:

```python
# backend/app/services/detectors/__init__.py (Nemesis extends)
from app.services.event_bus import publish_event


async def scan_repo_and_publish_events(repo_root: Path, repo_full_name: str) -> str:
    """Wraps scan_repo_and_persist (nemesis-to-demeter.md) + publishes events to event bus."""
    scan_run_id = generate_scan_run_id(repo_full_name)

    await publish_event({
        "type": "scan.started",
        "repo_full_name": repo_full_name,
        "scan_run_id": scan_run_id,
        "timestamp": datetime.utcnow().isoformat(),
    })

    findings = await scan_repo_and_persist(repo_root, repo_full_name)

    for finding in findings:
        await publish_event({
            "type": "finding.detected",
            "repo_full_name": repo_full_name,
            "scan_run_id": scan_run_id,
            "finding": finding.dict(),
            "timestamp": datetime.utcnow().isoformat(),
        })

    await publish_event({
        "type": "scan.completed",
        "repo_full_name": repo_full_name,
        "scan_run_id": scan_run_id,
        "scan_summary": aggregate_scan_summary(findings),
        "timestamp": datetime.utcnow().isoformat(),
    })
    return scan_run_id
```

Asclepius subscribe pattern:

```typescript
// frontend/src/modes/health/useFindingEvents.ts (Asclepius)
import { useEffect } from 'react';
import { useAsclepiusStore } from './asclepiusStore';
import type { FindingEvent } from './findingEvents';

export function useFindingEvents(repoFullName: string | null) {
  const setFinding = useAsclepiusStore((s) => s.setFinding);
  const setGlow = useAsclepiusStore((s) => s.setGlow);

  useEffect(() => {
    if (!repoFullName) return;
    const ws = new WebSocket(`/api/ws/finding-events?repo=${encodeURIComponent(repoFullName)}`);
    ws.onmessage = (e) => {
      const event = JSON.parse(e.data) as FindingEvent;
      if (event.type === 'finding.detected' && event.finding) {
        setFinding({
          id: event.finding.id,
          buildingId: event.finding.buildingId,
          severity: event.finding.severity,
          category: event.finding.category,
          title: event.finding.title,
          filePath: event.finding.filePath,
          lineStart: event.finding.lineStart,
          lineEnd: event.finding.lineEnd,
          description: '',  // Lazy-loaded on click
          suggestedFix: '', // Lazy-loaded on click
          detectedAt: event.timestamp,
          status: 'open',
          linkedIssueNumber: null,
        });
        setGlow(event.finding.buildingId, event.finding.severity);
      }
      if (event.type === 'finding.resolved' && event.finding) {
        setGlow(event.finding.buildingId, null);  // Remove glow
      }
    };
    return () => ws.close();
  }, [repoFullName, setFinding, setGlow]);
}
```

Hades backend WebSocket endpoint extends from `hera-to-hades.md` setup:

```python
# backend/app/api/websocket.py (Hades adds finding events route)

@router.websocket("/api/ws/finding-events")
async def finding_events_ws(websocket: WebSocket, repo: str):
    """Streams FindingEvent messages for specified repo."""
    await websocket.accept()
    try:
        async for event in event_bus.subscribe_finding_events(repo=repo, user=websocket.scope["session"]["user_id"]):
            await websocket.send_json(event)
    except WebSocketDisconnect:
        pass
```

## Storage location

- Frontend types + hook: `frontend/src/modes/health/findingEvents.ts` + `frontend/src/modes/health/useFindingEvents.ts` (Asclepius)
- Backend publisher: `backend/app/services/detectors/__init__.py` (Nemesis extends scan_repo_and_persist)
- Backend WebSocket route: `backend/app/api/websocket.py` (Hades adds endpoint)
- Event bus: `backend/app/services/event_bus.py` (Hades; in-memory pub-sub)

## Asumption baked

1. WebSocket channel `/api/ws/finding-events` separate from `/api/ws/building-events` to allow Asclepius to subscribe only to findings without building event noise.
2. Event publish + persist both happen; persist authoritative (Demeter), event bus advisory (real-time UI).
3. Scan run typically triggered by webhook event (Hades receives PR merged event, fires scan) or manual user action ("Scan repo" button).
4. severity color encoding LOCKED Asclepius store: red critical, orange high, yellow medium. Nemesis severity bucketing must produce one of 5 enum values.
5. Asclepius store does NOT deduplicate finding ids; if same finding from multiple scan runs, latest event overwrites store entry.

## Validation steps

**Producer responsibility (Nemesis)**:
- Every finding persisted to Demeter also publishes `finding.detected` event.
- Scan.started + scan.completed events bookend each scan run.
- Severity buckets match enum exactly; no custom values.

**Consumer responsibility (Asclepius)**:
- Subscribe to WebSocket on repo selection; unsubscribe on repo change.
- Set glow + finding store atomically per event.
- Resolved findings remove glow correctly.
- Smoke test: trigger mock scan, observe 5 buildings glow with correct severity colors as events arrive.

## Edge case handling

- WebSocket disconnect: Asclepius reconnects with exponential backoff; backfills via `GET /api/findings?repo=X&since=<timestamp>` (Demeter authors).
- Out-of-order events (scan.completed before all finding.detected): Asclepius handles gracefully; final state per finding event is authoritative.
- Finding for unknown building id: Asclepius logs warning + ignores glow (building may be filtered out by Iris LOD).
- Severity unknown: Asclepius defaults to 'medium' glow + logs warning.

## Open questions

- Periodic scan trigger: Wave 3 default = manual user "Scan repo" button + webhook PR merged event. Periodic scan (e.g., nightly) deferred Pan Day 2.
- Finding resolution detection: Wave 3 simple = user marks resolved via UI button. Automatic resolution (e.g., file deleted) deferred.

## Reference

- Metis Agentic Structure md Section 2 DAG: Nemesis detection findings consumed by Wave 2 Asclepius glow trigger, feedback edge
- Metis Section 5.4 Asclepius + Section 5.6 Nemesis ship criteria
- PRD Section 9.5 (Health Mode 5 Apollo detector)
- PRD Section 17.3 (WebSocket setup)
- Contract `asclepius-to-triton.md` (asclepiusStore + ApolloFinding schema definition)
- Contract `nemesis-to-demeter.md` (Finding persist; this contract is the feedback parallel)
- Contract `hera-to-hades.md` (WebSocket setup pattern reference)
