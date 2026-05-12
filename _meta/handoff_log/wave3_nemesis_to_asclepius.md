# Handoff: Nemesis to Asclepius (Wave 3 to Wave 2 feedback edge)

**Authored**: 2026-05-12 21:54 WIB Day 1 evening
**Producer**: Nemesis (Wave 3, 11 detector suite, WebSocket publisher)
**Consumer**: Asclepius (Wave 2, Health Mode glow + Apollo findings panel)
**Cycle status**: Nemesis cycle 1 stub SHIP-CLEAN, Asclepius already SHIP-CLEAN Wave 2

## Cycle 1 stub ship details

Nemesis cycle 1 ships the feedback edge `nemesis-to-asclepius.md`:
- `FindingEvent` Pydantic model at `backend/app/services/detectors/types.py` with camelCase aliases via `Field(alias="repoFullName")` etc.
- `WSPublisherAdapter` at `backend/app/services/detectors/adapters/ws_publisher_adapter.py` publishes to EventBus topic `finding_events` consumed by the WebSocket route at `backend/app/api/websocket/finding_events.py` (Hades-owned, already shipped).
- Dispatcher emits 7 events per scan: 1 `scan.started` + 5 `finding.detected` + 1 `scan.completed`.
- 14/14 smoke test PASS verifying lifecycle + camelCase wire format + 5-enum severity + 5-enum category compliance.

## Schema reaffirmation per nemesis-to-asclepius.md

### FindingEvent (line 33 verbatim match, camelCase wire format)

```python
class FindingEvent(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)
    type: Literal[
        "finding.detected",
        "finding.resolved",
        "finding.ticketed",
        "finding.snoozed",
        "scan.started",
        "scan.completed",
    ]
    repo_full_name: str = Field(alias="repoFullName")
    scan_run_id: str = Field(alias="scanRunId")
    finding: dict[str, Any] | None = None  # populated on finding.* events
    scan_summary: dict[str, Any] | None = Field(default=None, alias="scanSummary")
    timestamp: str  # ISO 8601 UTC with trailing 'Z'
```

### Finding payload sub-object (camelCase per TypeScript consumer)

```python
{
    "id": str,
    "buildingId": str,
    "severity": "critical" | "high" | "medium" | "low" | "info",
    "category": "hardcoded-secret" | "outdated-dependency" | "missing-auth" | "unsafe-sql" | "complex-untested",
    "title": str,
    "filePath": str,
    "lineStart": int,
    "lineEnd": int,
}
```

### Scan summary sub-object (on scan.completed only)

```python
{
    "totalFindings": int,
    "bySeverity": {"critical": int, "high": int, "medium": int, "low": int, "info": int},
    "byCategory": {<category>: int, ...},
    "driftCount": int,  # Nemesis adds this beyond Pythia contract for dashboard convenience
    "durationMs": int,
}
```

## What Asclepius Wave 2 consumes (already shipped)

Per Asclepius Wave 2 ship-clean checkpoint at `_meta/checkpoints/asclepius-cycle4.md`:
- `frontend/src/modes/health/findingEvents.ts` TypeScript types (Asclepius authored).
- `frontend/src/modes/health/useFindingEvents.ts` hook (Asclepius authored, subscribes to `/api/ws/finding-events`).
- `asclepiusStore.setFinding` + `setGlow` actions called per `finding.detected` event.

## WebSocket route already wired by Hades

`backend/app/api/websocket/finding_events.py` (Hades cycle 1) subscribes to EventBus topic `finding_events` via `bus.subscribe('finding_events')` async iterator pattern. The route serializes the dict payload and pushes to the WS client. Verified via 176/176 backend test suite PASS (includes `test_websocket_smoke.py`).

## Publish flow chain

```
Nemesis dispatcher.run_full_scan
    ↓
WSPublisherAdapter.publish(FindingEvent)
    ↓ model_dump(by_alias=True, exclude_none=True)
EventBus.publish('finding_events', dict)
    ↓
WS route subscribed queue
    ↓
client websocket.send_json(dict)
    ↓
Asclepius frontend useFindingEvents.onmessage
    ↓
asclepiusStore.setFinding + setGlow
```

## Severity color encoding (Asclepius store LOCKED)

Per `nemesis-to-asclepius.md` line 174: red critical, orange high, yellow medium, plus Asclepius extends with low + info (gray / muted). Nemesis severity bucketing produces exactly 5 enum values verified by `test_severity_enum_lock_compliance`. JANGAN bikin 6th severity.

## Category icon encoding (Asclepius store)

Asclepius UI maps each of 5 kebab-case category to icon + Apollo finding panel label. Nemesis emits exactly the 5 category strings per `test_category_enum_kebab_lock_compliance`. JANGAN bikin 6th category.

## Edge cases handled per nemesis-to-asclepius.md line 192-194

1. **WebSocket disconnect** (frontend): Asclepius reconnect with exponential backoff + backfill via `GET /api/findings?repo=X&since=<timestamp>` (Demeter-owned). Nemesis publishes are advisory; Demeter persist is authoritative source.

2. **Out-of-order events**: Asclepius handles gracefully; final state per finding event is authoritative (later event overwrites earlier in store).

3. **Finding for unknown building id**: Asclepius logs warning + ignores glow. Nemesis emits `buildingId == file_path` consistently so as long as Iris squarified treemap covers the file, glow renders. Files filtered out by Iris LOD will show warning in Asclepius console (non-blocker).

4. **Severity unknown**: Pydantic schema rejects via Literal enum. Cycle 1 14/14 smoke verifies.

## Cycle 2+ delta to Asclepius

No schema changes. Nemesis cycle 2-5 swaps stub detector output for real detector output. Same FindingEvent + Finding sub-object schema. Asclepius store + glow rendering does not need modification.

## Cross-checks for Asclepius to verify (smoke against running backend)

1. Open WS `/api/ws/finding-events?repo=duopoly/codeplex-demo-nodegoat`, observe 7 messages per scan (1 scan.started + 5 finding.detected + 1 scan.completed).
2. Each finding.detected `buildingId` matches a known building id from Iris treemap.
3. `setGlow(buildingId, severity)` called with valid severity strings (5-enum lock).
4. `scan.completed.scanSummary.totalFindings` = number of finding.detected events received in window.

## Ferry condition check

No ferry needed. Per `nemesis-to-asclepius.md` Pythia contract verbatim. Asclepius Wave 2 already ship-clean.

## Aletheia audit cross-reference

Per `aletheia-wave3-audit.md` line 33:
- "Health Mode consumes real Nemesis detector findings + Asclepius glow trigger feedback": cycle 5 end-to-end verifies with real NodeGoat fork + real WS Asclepius mock consume.
