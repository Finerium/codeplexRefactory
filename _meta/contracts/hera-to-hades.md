# Contract: Hera to Hades

**Edge type**: cross-wave (Wave 2 to Wave 3)
**Wave**: Wave 2 producer to Wave 3 consumer
**Status**: locked
**Authored**: 2026-05-12 15:28 WIB

## Producer

**Worker**: Hera (Wave 2)
**Domain**: Sprint Mode HERO PR-to-Building auto-sync visual state machine. Hera maintains the visual hooks (building sprint status transitions: foundation -> frame -> painting -> finished) that Wave 3 Hades webhook receiver triggers via GitHub event ingestion. Hera also defines what events Hades must publish via WebSocket so building visual stays in sync with PR lifecycle.

## Consumer

**Worker**: Hades (Wave 3)
**Domain**: FastAPI scaffold + GitHub webhook receiver (HMAC verified per PRD Section 19) + WebSocket setup. Hades subscribes to GitHub webhook events (PR opened/review_requested/approved/merged/closed + issue opened/closed) and pushes corresponding building state updates via WebSocket to frontend, which Hera consumes to drive 14 PM concept visual transitions.

## Output schema (producer to consumer)

Hera defines the WebSocket message protocol for building state updates. Hades implements as event publisher.

```typescript
// frontend/src/modes/sprint/websocketEvents.ts (Hera defines)

/** WebSocket channel: ws://APP_DOMAIN/api/ws/building-events */

export type BuildingEventType =
  | 'pr.opened'
  | 'pr.review_requested'
  | 'pr.approved'
  | 'pr.merged'
  | 'pr.closed'
  | 'issue.opened'
  | 'issue.closed'
  | 'comment.created'
  | 'sprint.transition';  // Composite event with new SprintStatus

export interface BuildingEvent {
  type: BuildingEventType;
  /** Building id affected. */
  buildingId: string;
  /** GitHub PR or issue number. */
  resourceNumber: number;
  /** Timestamp ISO 8601. */
  timestamp: string;
  /** Event-specific payload. */
  payload: PROpenedPayload | PRReviewRequestedPayload | PRApprovedPayload
         | PRMergedPayload | PRClosedPayload | IssueOpenedPayload
         | IssueClosedPayload | CommentCreatedPayload | SprintTransitionPayload;
}

export interface PROpenedPayload {
  prTitle: string;
  prUrl: string;
  authorLogin: string;
  filesChanged: string[];  // Paths affecting building mapping
}

export interface PRReviewRequestedPayload {
  reviewerLogins: string[];
}

export interface PRApprovedPayload {
  approverLogin: string;
  /** True if all required reviewers approved. */
  allRequiredApproved: boolean;
}

export interface PRMergedPayload {
  mergerLogin: string;
  mergeSha: string;
}

export interface PRClosedPayload {
  /** True if closed without merge (drift Pattern B candidate). */
  withoutMerge: boolean;
}

export interface IssueOpenedPayload {
  issueTitle: string;
  issueUrl: string;
  authorLogin: string;
  storyPoints: number | null;
  assignee: string | null;
}

export interface IssueClosedPayload {
  closerLogin: string;
  /** True if closed with related PR merged. */
  withRelatedPRMerged: boolean;
}

export interface CommentCreatedPayload {
  commentId: string;
  commentBody: string;
  authorLogin: string;
  resolved: boolean;
}

export interface SprintTransitionPayload {
  fromStatus: 'foundation' | 'frame' | 'painting' | 'finished' | 'unfinished';
  toStatus: 'foundation' | 'frame' | 'painting' | 'finished' | 'unfinished';
}
```

Hades implements the publisher side:

```python
# backend/app/api/websocket.py (Hades Wave 3)
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Literal
from pydantic import BaseModel

router = APIRouter()

class BuildingEvent(BaseModel):
    type: Literal[
        "pr.opened", "pr.review_requested", "pr.approved",
        "pr.merged", "pr.closed", "issue.opened",
        "issue.closed", "comment.created", "sprint.transition",
    ]
    building_id: str
    resource_number: int
    timestamp: str
    payload: dict


@router.websocket("/api/ws/building-events")
async def building_events_ws(websocket: WebSocket):
    """Streams BuildingEvent messages to connected clients.

    Auth: WebSocket connection requires valid session JWT in query param `token`.
    Subscription: client receives all events for repos user has access to.
    """
    await websocket.accept()
    try:
        # Subscribe to internal pubsub bus, forward events
        while True:
            event = await event_bus.get_next_for(user=websocket.scope["session"]["user_id"])
            await websocket.send_json(event.model_dump(by_alias=True))
    except WebSocketDisconnect:
        pass
```

GitHub webhook receiver translates webhook event to BuildingEvent:

```python
# backend/app/api/webhook.py (Hades Wave 3)
from fastapi import APIRouter, Request, Header, HTTPException
import hmac
import hashlib

router = APIRouter()


@router.post("/api/webhook/github")
async def github_webhook(
    request: Request,
    x_hub_signature_256: str = Header(...),
    x_github_event: str = Header(...),
):
    """Receives GitHub webhook, verifies HMAC, fans out BuildingEvent to pubsub."""
    body = await request.body()
    expected = "sha256=" + hmac.new(
        os.environ["GITHUB_WEBHOOK_SECRET"].encode(),
        body,
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(expected, x_hub_signature_256):
        raise HTTPException(401, "Invalid HMAC signature")

    payload = await request.json()
    # Translate webhook event to BuildingEvent + publish to event_bus
    events = translate_webhook_to_building_events(x_github_event, payload)
    for event in events:
        await event_bus.publish(event)
        # Also persist to pr_events table via Demeter (see hades-to-demeter.md)
    return {"received": True}
```

## Storage location

- Frontend WebSocket client + types: `frontend/src/modes/sprint/websocketEvents.ts` (Hera)
- Subscriber hook: `frontend/src/modes/sprint/useBuildingEvents.ts` (Hera authors hook consuming events into heraStore)
- Backend WebSocket endpoint: `backend/app/api/websocket.py` (Hades Wave 3)
- Backend webhook receiver: `backend/app/api/webhook.py` (Hades Wave 3)
- Event bus: `backend/app/services/event_bus.py` (Hades Wave 3) — in-memory pub-sub Wave 3 MVP; could swap to Redis later (not Wave 3 scope)
- Mock Wave 2: Hera uses local timer + simulated events for demo; Wave 3 swaps with real WebSocket subscription

## Asumption baked

1. JSON serialization snake_case to camelCase via Pydantic alias generator (consistent with `selene-to-demeter.md`).
2. WebSocket auth via query param `?token=<session-jwt>` (HTTP-only cookies not transmitted on WebSocket upgrade reliably; query param trade-off accepted for hackathon scope).
3. Event bus is in-memory Wave 3; cross-instance pub-sub not needed (single K8s pod replica per PRD Section 17).
4. Building mapping (filesChanged list to building id) computed by Hades via parser API (Hades to Pandora parser contract `hades-to-pandora.md`); webhook handler queries parser to find affected buildings.
5. Webhook events arrive within seconds of GitHub action; WebSocket delivers to frontend within 100ms of webhook receipt.
6. HMAC verification mandatory per PRD Section 19; Hades rejects unauthenticated webhook with 401.

## Validation steps

**Producer responsibility (Hera)**:
- Define BuildingEvent + payload types canonically; do NOT duplicate in Hades.
- Implement `useBuildingEvents` hook that subscribes to WebSocket + dispatches into heraStore (via `updateContext` action).
- Wave 2 mock: simulate events via setTimeout to demonstrate state transitions without Wave 3 dependency.
- Smoke test: simulated events drive building visual transitions (foundation -> frame on pr.opened, etc.).

**Consumer responsibility (Hades)**:
- Implement `/api/webhook/github` endpoint with HMAC verification + event translation.
- Implement `/api/ws/building-events` WebSocket endpoint authenticated by session JWT.
- `translate_webhook_to_building_events` function maps GitHub webhook event types to BuildingEvent types (1-to-1 or 1-to-N).
- Persist BuildingEvent to `pr_events` table via Demeter (foreign-key to user + repo).
- Smoke test: GitHub test webhook fires on demo repo, building visual updates in real time within 1 second.
- 0 unauthenticated webhook accepted (security floor).

## Edge case handling

- Webhook HMAC mismatch: Hades returns 401 + logs (potential probing); does NOT publish event.
- WebSocket disconnect: client reconnects with exponential backoff (1s, 2s, 4s, 8s cap); missed events backfilled via `GET /api/events?since=<timestamp>` (Demeter authors backfill endpoint).
- GitHub rate limit hit on parser query (Hades to Pandora): Hades falls back to last-known building mapping cached in Demeter; webhook event still recorded.
- Duplicate webhook events (GitHub retry): Hades deduplicates by webhook delivery id (header `X-GitHub-Delivery`); only first publish to event bus.
- Unmapped file path (file not in any building): Hades records event with `building_id: ""` placeholder; Hera ignores empty building id.

## Open questions

- Cross-repo event scope: Hera Wave 2 demo focuses on single repo; multi-repo aggregation is Wave 3 + Pan polish if time allows.
- Event replay on app start: should Hera replay last 24 hours of events? Wave 3 decision: NO replay (real-time only, dashboard shows historical via Demeter queries).
- Webhook events not yet supported (e.g., review comment thread vs PR comment): scope-cut Wave 3 to PR + issue + comment + review only.

## Reference

- Metis Agentic Structure md Section 2 DAG: Hera building visual hooks consumed by Wave 3 Hades webhook receiver PR-to-Building sync
- Metis Section 5.4 Hera + Section 5.6 Hades ship criteria
- PRD Section 9.2 (Sprint Mode HERO PR-to-Building auto-sync visual state machine)
- PRD Section 17.3 (FastAPI + WebSocket setup)
- PRD Section 19 (Security, GitHub webhook HMAC mandatory)
- Contract `hera-to-persephone.md` (heraStore state machine consumer)
- Contract `hades-to-demeter.md` (event persistence)
