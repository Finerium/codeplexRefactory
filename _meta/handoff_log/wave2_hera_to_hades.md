# Handoff Log: Wave 2 Hera to Wave 3 Hades (cross-wave)

**Edge**: cross-wave (Wave 2 Hera Sprint Mode HERO to Wave 3 Hades FastAPI backend)
**Contract**: `_meta/contracts/hera-to-hades.md` (locked Wave 0 Pythia)
**Date**: 2026-05-12 ~23:55 WIB
**Producer**: Hera (Wave 2, Sprint Mode HERO PR-to-Building state machine)
**Consumer**: Hades (Wave 3, FastAPI backend + GitHub webhook receiver + WebSocket publisher)
**Status**: Hera SHIP CLEAN, contract surface stable for Wave 3 Hades consume. Wave 2 mock tape isolated + labeled.

## What Hera delivers for Hades Wave 3 wiring

### BuildingEvent + payload type union (canonical schema)

Hera authors the canonical schema at `frontend/src/modes/sprint/types.ts` lines 110-194. Hades MUST emit events matching this union verbatim; Hera's reducer is exhaustive-switched and any unknown type lands in the warn branch:

```typescript
export type BuildingEvent =
  | { type: 'pr.opened'; buildingId: string; timestamp: string; resourceNumber: number; payload: PROpenedPayload }
  | { type: 'pr.review_requested'; buildingId: string; timestamp: string; resourceNumber: number; payload: PRReviewRequestedPayload }
  | { type: 'pr.approved'; buildingId: string; timestamp: string; resourceNumber: number; payload: PRApprovedPayload }
  | { type: 'pr.merged'; buildingId: string; timestamp: string; resourceNumber: number; payload: PRMergedPayload }
  | { type: 'pr.closed'; buildingId: string; timestamp: string; resourceNumber: number; payload: PRClosedPayload }
  | { type: 'issue.opened'; buildingId: string; timestamp: string; resourceNumber: number; payload: IssueOpenedPayload }
  | { type: 'issue.closed'; buildingId: string; timestamp: string; resourceNumber: number; payload: IssueClosedPayload }
  | { type: 'comment.created'; buildingId: string; timestamp: string; resourceNumber: number; payload: CommentCreatedPayload }
  | { type: 'comment.resolved'; buildingId: string; timestamp: string; resourceNumber: number; payload: CommentResolvedPayload }
  | { type: 'ci.fail'; buildingId: string; timestamp: string; resourceNumber: number; payload: CIStatusPayload }
  | { type: 'ci.pass'; buildingId: string; timestamp: string; resourceNumber: number; payload: CIStatusPayload }
  | { type: 'dependency.added'; buildingId: string; timestamp: string; resourceNumber: number; payload: DependencyChangedPayload }
  | { type: 'dependency.removed'; buildingId: string; timestamp: string; resourceNumber: number; payload: DependencyChangedPayload }
  | { type: 'sprint.transition'; buildingId: string; timestamp: string; resourceNumber: number; payload: { fromStatus: SprintStatus; toStatus: SprintStatus } };
```

### Schema extensions beyond Pythia contract baseline

The Pythia contract `hera-to-hades.md` lines 27-49 lists 9 event types (`pr.opened`, `pr.review_requested`, `pr.approved`, `pr.merged`, `pr.closed`, `issue.opened`, `issue.closed`, `comment.created`, `sprint.transition`). Hera extends with 5 additional types for Wave 2 demo richness + Wave 3 forward compatibility:

| Added event | Wave 2 demo use | Wave 3 Hades implementation |
|---|---|---|
| `comment.resolved` | sticky-note unread count decrements on resolve | webhook `pull_request_review_comment` event with `state: resolved`, OR custom internal event when user clicks "Mark resolved" in TicketPanel |
| `ci.fail` | SmokeRetakOverlay smoke billow + crack decals | webhook `check_run` event with `conclusion: failure` (or `workflow_run` with `conclusion: failure`); fire one event per affected file building (fanout per files_changed) |
| `ci.pass` | smoke clears, DoD "CI green" item checks | webhook `check_run` with `conclusion: success`; reset ciStatus + ciFailCount on heraStore |
| `dependency.added` | RedBridge appears between source + target buildings | parse Issue body markdown (e.g., `Depends on #415`) or PR body (e.g., `Blocked by #100`); fire event on issue/PR create/update |
| `dependency.removed` | RedBridge disappears | parse same body sections on update; diff old vs new dependency set |

Hera Wave 2 reducer handles all 14 event types in `frontend/src/modes/sprint/stateMachine.ts` exhaustive switch. Hades Wave 3 SHOULD support all 14 to maintain feature parity; if scope cut, document at Aletheia Wave 3 audit which event types are dropped.

### State machine canonical mapping (Hades MUST honor)

5-state SprintStatus enum:
- `'foundation'`: issue opened, no PR yet
- `'frame'`: PR opened (transition: foundation to frame, or unfinished to frame on retry)
- `'painting'`: PR review requested (transition: frame to painting)
- `'finished'`: PR merged (transition: frame to finished or painting to finished)
- `'unfinished'`: PR closed without merge (transition: frame or painting to unfinished, drift Pattern B sink state)

State transitions are determined by event TYPE, not payload contents. Hades does NOT need to compute next state itself; the reducer in `stateMachine.ts` derives `nextSprintStatus(current, event)` from the event type. Hades only needs to emit the event with correct `buildingId`, `resourceNumber`, `timestamp`, `payload`.

### Orthogonal side-effect overlays (NOT state transitions)

Per Hera D-Hera-03, the following are side-effect fields, NOT state values. Hades emits these via OTHER events, NOT via `sprint.transition`:

- `prApprovedAt` (timestamp): drives 30-min GreenHaloGlow decay. Set by `pr.approved` event with `allRequiredApproved: true`. Building stays in `painting` state (NO transition to a non-existent 'approved' state).
- `ciStatus` + `ciFailCount`: drive SmokeRetakOverlay. Set by `ci.fail` / `ci.pass` events orthogonal to PR lifecycle. Building can be in ANY state and still show smoke.
- `blocked` + `blockedReason`: drive YellowTape. Set by `issue.opened` payload's `blocked` field. Building can be `foundation` (no PR) AND blocked simultaneously.
- `prComments[]`: drive PRCommentSurface sticky-note badge. Set by `comment.created` / `comment.resolved` events.
- `dependencies[]`: drive RedBridge. Set by `dependency.added` / `dependency.removed` events.

Hades MUST NOT attempt to translate `pull_request_review.submitted (state=approved)` GitHub webhook into a `sprint.transition` event with `toStatus: 'approved'`. The Pythia 5-state enum has no 'approved' state. Approval is a transient side-effect (30-min halo timer); state stays in 'painting' until merge.

### WebSocket endpoint contract

Hades implements `/api/ws/building-events` per Pythia contract `hera-to-hades.md` lines 109-143:

- Auth: WebSocket connection requires valid session JWT in query param `?token=<jwt>` (cookies not transmitted reliably on WebSocket upgrade per Asumption 2)
- Message frame: JSON serialized BuildingEvent object, one event per `send_json()` call
- Subscription: each connected client receives all events for repos user has access to
- Reconnect: client uses exponential backoff (1s, 2s, 4s, 8s cap) on disconnect per Edge case line 215; Hera Wave 2 stub does NOT implement reconnect because the mock tape has no transport layer

Wave 2 stub: `useBuildingEvents` returns `status: 'connected'` immediately once mock tape boots. Wave 3 Hades surface: same hook signature, real WebSocket subscription, status reflects connection state (`'connecting' | 'connected' | 'error' | 'offline'`).

### Webhook receiver contract (Hades Wave 3 implements)

Per Pythia contract `hera-to-hades.md` lines 148-179 + PRD Section 19.9:

1. HMAC SHA-256 verification on `X-Hub-Signature-256` header using `GITHUB_WEBHOOK_SECRET` env. Reject 401 on mismatch (security floor, Aletheia Wave 3 audit gate).
2. Dedup by `X-GitHub-Delivery` header to prevent webhook retry double-publish.
3. Translate webhook event payload to one or more BuildingEvent via `translate_webhook_to_building_events` function. Mapping examples:
   - `pull_request opened` triggers one `pr.opened` event per file path in `pull_request.changed_files` that maps to a building (multi-fanout per `files_changed`)
   - `pull_request_review submitted state=approved` triggers one `pr.approved` event per affected building
   - `pull_request closed merged=true` triggers one `pr.merged` event per affected building
   - `pull_request closed merged=false` triggers one `pr.closed` event with `payload.withoutMerge: true` per affected building
   - `issues opened` triggers one `issue.opened` event with parsed `storyPoints` (label convention `size:S,M,L,XL`) + `milestone` + `assignee` + parsed `blocked` (label `blocked`)
   - `issues closed` triggers one `issue.closed` event with `withRelatedPRMerged: <bool>` flag from linked PR state
   - `issue_comment created` or `pull_request_review_comment created` triggers one `comment.created` event per affected building
   - `check_run completed conclusion=failure` triggers one `ci.fail` event per file path the workflow targets
   - `check_run completed conclusion=success` triggers one `ci.pass` event per file path
4. File path to building id mapping: Hades calls Pandora parser API (`hades-to-pandora.md` contract) to resolve `files_changed[]` to building IDs. Cache the mapping in Demeter `pr_events` table to avoid repeated parser hits.
5. Publish events to in-memory pubsub bus; WebSocket subscribers fanout per user-repo ACL.

### Forward-compatibility: Wave 3 Hera swap surface

Hera Wave 2 mock stub `useBuildingEvents.ts` lines 85-130 schedules `applyEvent(entry.event)` via setTimeout chain. Wave 3 swap pattern:

```typescript
// frontend/src/modes/sprint/useBuildingEvents.ts (Wave 3 Hades wires)
export function useBuildingEvents(): UseBuildingEventsResult {
  const applyEvent = useHeraStore((s) => s.applyEvent);
  const [status, setStatus] = useState<BuildingEventsStatus>('connecting');
  const [eventCount, setEventCount] = useState(0);

  useEffect(() => {
    const wsUrl = `${WS_BASE}/api/ws/building-events?token=${sessionToken}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => setStatus('connected');
    ws.onmessage = (evt) => {
      const parsed = JSON.parse(evt.data) as BuildingEvent;
      applyEvent(parsed);
      setEventCount((prev) => prev + 1);
    };
    ws.onerror = () => setStatus('error');
    ws.onclose = () => setStatus('offline');

    return () => ws.close();
  }, [applyEvent, sessionToken]);

  return { status, eventCount, source: 'live-websocket' };
}
```

Surface (return type) IDENTICAL between Wave 2 mock + Wave 3 real. Component consumers (SprintMode.tsx etc.) need NO change.

## What Hades Wave 3 needs to know

### Database persistence (`hades-to-demeter.md` cross-edge)

Each BuildingEvent SHOULD persist to Demeter `pr_events` table per PRD Section 18.3 demo defensibility (60-second flythrough sprint retro requires historical event log). Schema:

```sql
CREATE TABLE pr_events (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  repo_id TEXT NOT NULL,
  building_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  resource_number INT NOT NULL,
  payload JSONB NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pr_events_building ON pr_events (building_id, timestamp DESC);
CREATE INDEX idx_pr_events_repo_user ON pr_events (repo_id, user_id, timestamp DESC);
```

This persistence supports:
- `GET /api/events?since=<timestamp>` backfill endpoint for WebSocket reconnect (Pythia contract `hera-to-hades.md` Edge case line 218)
- Cycle time / lead time derivation per PRD Section 9.2 (issue.opened to pr.merged elapsed) for Sprint Mode Dashboard View

### Wave 2 demo tape vs Wave 3 real events

Hera Wave 2 mock tape (`frontend/src/modes/sprint/__mock__/sprint_mock_events.ts`) ships 15 events across 90 seconds. Wave 3 Hades replaces this with real webhook + WebSocket pipeline; the mock file should be RETIRED post-Aletheia Wave 3 audit clean. Until then, Hera's mock tape coexists as the fallback (e.g., `process.env.NEXT_PUBLIC_USE_MOCK_TAPE === 'true'` could be wired in `useBuildingEvents` to route between mock + real).

### Test webhook for Wave 3 smoke

Demo repo `Finerium/codeplexRefactory` (Tim Duopoly project itself, eat-our-own-dogfood demo) should be wired to `https://duopoly.hackathon.sev-2.com/api/webhook/github` with `GITHUB_WEBHOOK_SECRET` configured. PR #47 + #48 already referenced in Hera mock tape; Wave 3 fires REAL webhooks when these PRs land + the building state updates in real time at the demo `/city` view.

### Open todo for Wave 3

- [ ] Implement `/api/webhook/github` with HMAC verification + delivery id dedup
- [ ] Implement `/api/ws/building-events` WebSocket endpoint with JWT auth
- [ ] Implement `translate_webhook_to_building_events()` translator covering all 14 Hera event types
- [ ] Wire in-memory pubsub bus (Wave 3 MVP) for cross-connection event fanout
- [ ] Persist BuildingEvent to Demeter `pr_events` table per `hades-to-demeter.md`
- [ ] Implement `GET /api/events?since=<timestamp>` backfill endpoint
- [ ] Aletheia Wave 3 audit verify: HMAC mandatory + 0 unauthenticated webhook accepted (security floor)
- [ ] Pan post-Wave 3: load test webhook fanout to all connected clients with 5 concurrent connections

## Hades acceptance criteria (per PRD Section 9.2 + Pythia contract)

- [ ] Webhook event arrives within seconds of GitHub action, WebSocket delivers to frontend within 100ms (cumulative < 5s acceptance)
- [ ] HMAC SHA-256 verification mandatory; 0 unauthenticated webhook accepted (Aletheia critical gate)
- [ ] Building state updates in real-time visible at `/city` view: scaffolding wraps on `pr.opened`, crane appears, inspector NPC orbits on `pr.review_requested`, green halo on `pr.approved`, crane removes + scaffolding cleared on `pr.merged`
- [ ] Cycle time / lead time derivable from event timestamps in Demeter pr_events table

## Ferry to V1 Orch

NOT triggered. Hera Wave 2 ships the canonical schema + Wave 3 Hades surface stable. If Wave 3 Hades surfaces:
- Event schema type mismatch: ferry to V1 Orch with reference to Pythia contract line + canonical schema in `frontend/src/modes/sprint/types.ts`
- WebSocket auth flow conflict with session JWT: ferry to V1 Orch + Hephaestus (auth flow OQ deferred per `hestia-to-hades.md`)
- Dedup id strategy incompatible: ferry to V1 Orch + Pandora parser cache invalidation
