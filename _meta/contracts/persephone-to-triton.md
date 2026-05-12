# Contract: Persephone to Triton

**Edge type**: cross-wave (Wave 2 to Wave 3)
**Wave**: Wave 2 producer to Wave 3 consumer
**Status**: locked
**Authored**: 2026-05-12 15:43 WIB

## Producer

**Worker**: Persephone (Wave 2)
**Domain**: AI residents chat panel UI (5-resident routing: Athena/Apollo/Argus/Clio/Hermes), response display, slide-in/out panel motion, broadcast vs single resident toggle. Persephone defines the chat panel slot interface (message schema, streaming protocol expectation) that Triton's LLM client fills with resident responses.

## Consumer

**Worker**: Triton (Wave 3)
**Domain**: DeepSeek V4 client + defensive layer (semantic cache + canned response + retry + fallback + circuit breaker) + thinking-mode toggle + per-resident routing. Triton receives chat queries via HTTP endpoint, routes to correct DeepSeek model/mode per resident, streams response via Server-Sent Events (SSE) or WebSocket back to Persephone's panel.

## Output schema (producer to consumer)

Persephone defines chat message schema + streaming protocol; Triton implements as producer.

```typescript
// frontend/src/lib/chat/types.ts (Persephone authors)

export type ResidentId = 'Athena' | 'Apollo' | 'Argus' | 'Clio' | 'Hermes';

export interface ChatMessage {
  id: string;
  /** Author identity. */
  author: { type: 'user'; userId: string } | { type: 'resident'; residentId: ResidentId };
  /** Message body, can include markdown for resident responses. */
  body: string;
  /** Timestamp ISO 8601. */
  createdAt: string;
  /** Whether streaming complete or still streaming chunks. */
  streamComplete: boolean;
  /** Optional context attached when sent. */
  context?: ChatContext;
  /** Optional metadata: token usage, latency, model used. */
  metadata?: {
    modelUsed: 'V4-Flash-non-think' | 'V4-Flash-think-low' | 'V4-Pro-think-high';
    inputTokens: number;
    outputTokens: number;
    latencyMs: number;
    cacheHit: boolean;
  };
}

export interface ChatContext {
  /** What user is currently looking at; Triton uses to inform response. */
  currentMode: 'onboarding' | 'sprint' | 'refactor' | 'activity' | 'health' | 'dashboard';
  /** Selected building if any. */
  selectedBuildingId: string | null;
  /** Resident-specific context (e.g., Apollo finding context, Hera ticket context). */
  modeContext: Record<string, unknown>;
}

export interface ChatThread {
  /** Stable thread identifier. */
  threadId: string;
  /** Resident this thread targets, or 'broadcast' for all 5. */
  target: ResidentId | 'broadcast';
  messages: ChatMessage[];
}

/** Request: POST /api/chat
 * Body: { threadId, target, message, context }
 * Response: SSE stream with events `chunk` (partial body) + `done` (final metadata).
 * Errors: 401 unauthenticated, 429 rate-limited, 503 DeepSeek API unavailable + no fallback.
 */
```

Persephone streaming consumer:

```typescript
// frontend/src/lib/chat/streamChat.ts (Persephone authors)
import { ResidentId, ChatContext, ChatMessage } from './types';

interface SendChatRequest {
  threadId: string;
  target: ResidentId | 'broadcast';
  message: string;
  context: ChatContext;
}

export async function* streamChat(
  req: SendChatRequest
): AsyncGenerator<{ chunk?: string; done?: ChatMessage['metadata'] }> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify(req),
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.body) throw new Error('No response stream');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) return;
    const text = decoder.decode(value);
    // Parse SSE format: "event: chunk\ndata: <text>\n\n" or "event: done\ndata: <json>\n\n"
    yield parseSSEEvent(text);
  }
}
```

Triton backend endpoint:

```python
# backend/app/api/chat.py (Triton Wave 3, extends from asclepius-to-triton.md)
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Literal
from app.services.deepseek_client import call_with_fallback_streaming
from app.services.resident_router import route_to_resident

router = APIRouter(prefix="/api")


class ChatContext(BaseModel):
    current_mode: Literal["onboarding", "sprint", "refactor", "activity", "health", "dashboard"]
    selected_building_id: str | None = None
    mode_context: dict


class ChatRequest(BaseModel):
    thread_id: str
    target: Literal["Athena", "Apollo", "Argus", "Clio", "Hermes", "broadcast"]
    message: str
    context: ChatContext


@router.post("/chat")
async def chat_endpoint(req: ChatRequest, session: dict = Depends(require_session)):
    """Streams chat response from selected resident via SSE.

    Routing per PRD Section 18.3:
      Athena = V4-Pro thinking high (heavy reasoning for refactor proposals)
      Apollo = V4-Flash non-think (health findings narration)
      Argus = V4-Flash thinking low (security CVSS scoring)
      Clio = V4-Flash non-think (git/spec-drift narration)
      Hermes = V4-Flash non-think (tour narration)
      broadcast = parallel call to all 5, merge responses (rare for demo)
    """
    async def event_stream():
        async for chunk in stream_resident_response(req, session):
            if chunk["type"] == "chunk":
                yield f"event: chunk\ndata: {chunk['text']}\n\n"
            elif chunk["type"] == "done":
                yield f"event: done\ndata: {json.dumps(chunk['metadata'])}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


async def stream_resident_response(req: ChatRequest, session: dict):
    config = route_to_resident(req.target)
    messages = build_messages(req, config.system_prompt)
    async for chunk in call_with_fallback_streaming(
        messages=messages,
        prefer_pro=config.prefer_pro,
        thinking_mode=config.thinking_mode,
        max_retries=2,
    ):
        yield chunk
```

## Storage location

- Frontend chat types: `frontend/src/lib/chat/types.ts` (Persephone)
- Streaming client: `frontend/src/lib/chat/streamChat.ts` (Persephone)
- Chat panel UI: `frontend/components/panels/ChatPanel.tsx` (Persephone, mounted at `frontend/app/city/@chat/default.tsx`)
- Backend endpoint: `backend/app/api/chat.py` (Triton Wave 3)
- Resident routing config: `backend/app/services/resident_router.py` (Triton Wave 3)
- DeepSeek client streaming: `backend/app/services/deepseek_client.py` (Triton Wave 3)
- Wave 2 mock: Persephone uses hardcoded mock responses with simulated streaming delay; Wave 3 swap real

## Asumption baked

1. SSE streaming chosen over WebSocket for chat: simpler HTTP/2 semantics, browser EventSource API mature, fits chat completion streaming pattern.
2. Per-resident routing per PRD Section 18.3 LOCKED:
   - Athena = V4-Pro thinking high
   - Apollo = V4-Flash non-think
   - Argus = V4-Flash thinking low
   - Clio = V4-Flash non-think
   - Hermes = V4-Flash non-think
3. Broadcast target Wave 3 stretch (low priority demo); Wave 2 Persephone exposes UI toggle but Wave 3 may implement as serial-not-parallel for simplicity.
4. Shared PromptOpening header ~3000 tokens prepended per request for cache-hit (H6); Hephaestus Wave 0 authors.
5. NEVER replay `reasoning_content` from prior turns (Phase B critical quirk); Triton's message builder strips reasoning_content from prior assistant messages.
6. Defensive layer: semantic cache cosine 0.85 threshold, canned response for top-10 pre-cached demo questions, retry simplified prompt, fallback V4-Flash to V4-Pro, circuit breaker 5 failures -> 60s cooldown.

## Validation steps

**Producer responsibility (Persephone)**:
- Chat panel UI renders 5-resident slot picker + message thread display + input + send button.
- Streaming response renders chunk-by-chunk as text arrives; cursor blinks during stream.
- Broadcast toggle present (Wave 2 UI; Wave 3 may stub).
- Context attached automatically: currentMode + selectedBuildingId + modeContext (from Asclepius/Hera/etc stores).
- Glassmorphism panel styling per Designer cross-page anchor.
- Smoke test Wave 2: send mock message to each of 5 residents, see mock streamed response.

**Consumer responsibility (Triton)**:
- Implement `/api/chat` endpoint with SSE streaming.
- Resident routing config in `resident_router.py` matches PRD Section 18.3 exactly.
- System prompt builder prepends PromptOpening + resident persona + provided context.
- Defensive layer applies: cache check first, canned check second, then DeepSeek call.
- NEVER include reasoning_content from prior assistant messages.
- Smoke test: send query to each resident, response routes to correct model + streaming completes within reasonable latency (V4-Flash < 2s, V4-Pro < 10s typically per Phase B).

## Edge case handling

- DeepSeek API outage: defensive layer falls back to canned response if available, else returns "Apologies, residents are momentarily unavailable" with HTTP 503.
- Rate limit hit: HTTP 429 with retry-after; Persephone displays "Resident is thinking..." prolonged state, retries automatically.
- Streaming connection drop mid-message: Persephone marks message `streamComplete: false`, allows user to retry; partial response preserved.
- Broadcast to all 5 residents: Triton runs 5 parallel calls; Persephone displays 5 separate response cards in panel (responsive grid).
- Context too large (modeContext > 1KB): Triton truncates or summarizes context preserving most-recent info; logs warning.

## Open questions

- Thread persistence Wave 2-3: Wave 2 in-memory only (resets on page reload). Wave 3 Demeter may persist threads in `chat_threads` table for cross-session continuity; deferred decision Wave 3 if time allows.
- Mention-resident syntax (e.g., `@Athena`) within message body: Wave 3 stretch, Persephone Wave 2 implements via target picker UI only.

## Reference

- Metis Agentic Structure md Section 2 DAG: Persephone chat panel slots consumed by Wave 3 Triton resident response stream
- Metis Section 5.4 Persephone + Section 5.6 Triton ship criteria
- PRD Section 10 (AI residents)
- PRD Section 18.3 (per-resident model routing locked table)
- PRD Section 18.4 (defensive layer fallback chain)
- PRD Section 18.5 (canned response top-10 pre-cache)
- PRD Section 18.6 (multi-turn coordination Refactor Mode)
- Phase B Topic E (DeepSeek V4 reliability + reasoning_content quirk)
- Hephaestus Wave 0 PromptOpening (shared header + per-resident persona prompts)
- Contract `asclepius-to-triton.md` (Apollo query context sibling)
- Contract `boreas-to-triton.md` (Hermes tour narration sibling)
