# Handoff: Persephone (Wave 2) to Triton (Wave 3)

**Date**: 2026-05-13 00:25 WIB
**Producer**: Persephone (Wave 2, UI panels architect)
**Consumer**: Triton (Wave 3, DeepSeek V4 client + defensive layer + per-resident routing)
**Contract**: `_meta/contracts/persephone-to-triton.md`

## Output produced by Persephone (Wave 2)

### Canonical type surface

**Path**: `frontend/src/lib/chat/types.ts` + barrel `frontend/src/lib/chat/index.ts`

```typescript
// 8 type exports per Pythia contract verbatim:
ResidentId    // 'Athena' | 'Apollo' | 'Argus' | 'Clio' | 'Hermes'
ChatTarget    // ResidentId | 'broadcast'
CurrentMode   // 'onboarding' | 'sprint' | 'refactor' | 'activity' | 'health' | 'dashboard'
ChatContext   // { currentMode, selectedBuildingId, modeContext }
ChatMessage   // { id, author, body, createdAt, streamComplete, context?, metadata? }
ChatMessageAuthor  // { type: 'user'; userId } | { type: 'resident'; residentId }
ChatMessageMetadata // { modelUsed, inputTokens, outputTokens, latencyMs, cacheHit }
ChatThread    // { threadId, target, messages }
SendChatRequest // POST /api/chat body shape
StreamChatEvent // { chunk: string } | { done: ChatMessageMetadata }
```

Triton Wave 3 imports via `import { type ChatMessage, type SendChatRequest, type ResidentId } from '@/lib/chat';` and mirrors Pydantic via FastAPI alias generator for SSE response envelope.

### Resident metadata table

**Path**: `frontend/src/lib/chat/residentMeta.ts`

`RESIDENT_META` table for each of 5 residents:
- `id` + `displayName`
- `landmark` (City Hall / Hospital / Police Station / Library / Tourist Info)
- `role` (The Architect / Doctor / Watcher / Historian / Guide)
- `voiceTagline` (1-line voice anchor)
- `textClass` + `bgClass` + `borderClass` (Daedalus Tailwind palette)
- `accentKey` (glassmorphism accent identifier)
- `modelMode` ('V4-Pro-think-high' / 'V4-Flash-non-think' / 'V4-Flash-think-low')
- `avatarShape` (temple / cross / tower / stack / beacon)
- `glyph` (A / P / G / C / H)

Triton Wave 3 reads `modelMode` per resident routing decision. PRD Section 18.3 LOCKED routing table mirrored in `RESIDENT_META` for canonical reference.

### Wave 2 mock streaming client

**Path**: `frontend/src/lib/chat/mockResidentResponses.ts`

`async function* streamChat(req: SendChatRequest): AsyncGenerator<StreamChatEvent>` yields canned per-resident response chunks (~20-35ms inter-chunk delay) followed by a final `{ done: metadata }` event. Wave 2 demo shows 5 distinct resident voices end-to-end.

Wave 3 swap: replace `streamChat()` body with real fetch-to-SSE:

```typescript
export async function* streamChat(req: SendChatRequest): AsyncGenerator<StreamChatEvent> {
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
    // Parse SSE format: "event: chunk\ndata: <text>\n\n" or "event: done\ndata: <json>\n\n"
    const text = decoder.decode(value);
    for (const ev of parseSSEEvents(text)) yield ev;
  }
}
```

ChatPanel UI consumer code unchanged; pure body swap.

### Chat panel UI

**Paths**:
- `frontend/components/panels/chat/ChatPanel.tsx` (composite root)
- `frontend/components/panels/chat/ResidentAvatar.tsx` (5 distinct geometric SVG portraits)
- `frontend/components/panels/chat/BroadcastToggle.tsx`
- `frontend/components/panels/chat/MessageList.tsx`
- `frontend/components/panels/chat/MessageInput.tsx`
- `frontend/components/panels/chat/useChatRouting.ts` (thread state machine)
- `frontend/components/panels/chat/types.ts` (re-exports `@/lib/chat`)
- `frontend/components/panels/chat/index.ts` (barrel)
- `frontend/app/city/@chat/page.tsx` (mount point)

Triton Wave 3 swap surface = `frontend/src/lib/chat/mockResidentResponses.ts` only. Chat panel UI untouched.

## Wave 3 endpoint expected (Triton implements)

```python
# backend/app/api/chat.py
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Literal


class ChatContext(BaseModel):
    current_mode: Literal["onboarding", "sprint", "refactor", "activity", "health", "dashboard"]
    selected_building_id: str | None = None
    mode_context: dict


class ChatRequest(BaseModel):
    thread_id: str
    target: Literal["Athena", "Apollo", "Argus", "Clio", "Hermes", "broadcast"]
    message: str
    context: ChatContext


router = APIRouter(prefix="/api")


@router.post("/chat")
async def chat_endpoint(req: ChatRequest, session: dict = Depends(require_session)):
    async def event_stream():
        async for chunk in stream_resident_response(req, session):
            if chunk["type"] == "chunk":
                yield f"event: chunk\ndata: {chunk['text']}\n\n"
            elif chunk["type"] == "done":
                yield f"event: done\ndata: {json.dumps(chunk['metadata'])}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
```

## Asumption baked

1. Per-resident routing per PRD Section 18.3 LOCKED:
   - Athena = V4-Pro thinking high
   - Apollo = V4-Flash non-think
   - Argus  = V4-Flash thinking low
   - Clio   = V4-Flash non-think
   - Hermes = V4-Flash non-think
2. Shared PromptOpening header ~3000 tokens prepended per Hephaestus Wave 0 PromptOpening file.
3. NEVER replay `reasoning_content` from prior turns (Phase B CRITICAL DeepSeek V4 quirk). Triton message builder strips `reasoning_content` from prior assistant messages.
4. Defensive layer (cache + canned + retry + fallback + circuit breaker) per Triton agent prompt Section 3.
5. Broadcast target Wave 3 stretch; Wave 2 mock falls back to single resident (Hermes) for stub coverage. Wave 3 may run 5 parallel + merge or serial-not-parallel for simplicity.
6. SSE chosen over WebSocket for chat (browser EventSource mature + fits completion streaming pattern).

## Validation steps

**Producer responsibility (Persephone Wave 2)**:
- [x] Chat panel UI renders 5-resident slot picker
- [x] Streaming response renders chunk-by-chunk Wave 2 (mock stream chunks at 18-35ms cadence)
- [x] Broadcast toggle present
- [x] Context attached automatically via `useCurrentChatContext()` selector
- [x] Glassmorphism panel styling per Designer cross-page anchor
- [x] 5 resident voice differentiation distinct in canned mock (Athena Indonesian + English technical, Apollo clinical, Argus CVSS-framed concise, Clio elegant narrative, Hermes bilingual welcome)
- [x] Smoke test: Playwright `/city` renders 5 distinct resident avatars + composer + side panel + ticket panel slot. 0 console errors. Side panel mode tabs switch correctly.

**Consumer responsibility (Triton Wave 3)**:
- [ ] Implement `/api/chat` endpoint with SSE streaming
- [ ] Resident routing config in `resident_router.py` matches PRD Section 18.3 exactly
- [ ] System prompt builder prepends PromptOpening + resident persona + provided context
- [ ] Defensive layer applies: cache first, canned second, then DeepSeek call
- [ ] NEVER include `reasoning_content` from prior assistant messages
- [ ] Smoke test: send query to each resident, response routes to correct model + streaming completes (V4-Flash < 2s typical, V4-Pro < 10s per Phase B)

## Edge case handling

- **DeepSeek API outage**: defensive layer canned fallback or HTTP 503 + Persephone UI "Apologies, residents are momentarily unavailable" (Persephone Wave 2 swallows error in useChatRouting and logs)
- **Rate limit (HTTP 429)**: Persephone displays "Resident is thinking..." prolonged state via existing `streaming` flag
- **Streaming drop mid-message**: Persephone marks message `streamComplete: false`, partial body preserved; user can resend
- **Broadcast Wave 3**: Triton runs 5 parallel calls or single (Hermes default); Persephone UI displays 5 separate response cards if Triton returns 5 streams (current Wave 2 stub falls back to Hermes)

## Open questions (Wave 3 decide)

1. **Thread persistence**: Wave 2 in-memory only (resets on reload). Wave 3 Demeter may persist threads in `chat_threads` table for cross-session continuity.
2. **Mention syntax (`@Athena`)**: Wave 3 stretch. Wave 2 surfaces via target picker UI only.

## OQ-03 implementation extension (Persephone Wave 2 consume)

Selene D2 OQ-03 lockdown intact. Persephone Wave 2 hand-authored shadcn-compatible primitives at `frontend/components/ui/*` (button + card + badge + avatar + scroll-area + input + separator + tabs) + `cn` helper at `frontend/src/lib/utils.ts`. Decision documented at `_meta/decisions/oq03_ui_library.md` Persephone Wave 2 implementation extension section.

## Reference

- Pythia contract `_meta/contracts/persephone-to-triton.md` (canonical schema)
- Decision log `_meta/decision_log/persephone.md` (D1-D8 + Wave 2 paralel coordination notes)
- OQ-03 decision doc `_meta/decisions/oq03_ui_library.md` (Selene baseline + Persephone Wave 2 extension)
- Checkpoint `_meta/checkpoints/persephone-cycle1.md` (+ cycles 2-4)
- Uncertainty journal `_meta/uncertainty/persephone-cycle1-20260512-2330.md` (3 medium concerns)
- PRD Section 10 (AI residents) + Section 18.3 (per-resident model routing locked table) + Section 18.4 (defensive layer) + Section 18.5 (canned response top-10) + Section 18.6 (multi-turn coordination)
- Phase B Topic E (DeepSeek V4 reliability + reasoning_content quirk)
- Hephaestus PromptOpening (shared header + per-resident persona prompts)
- Sibling Wave 2 contracts:
  - `_meta/contracts/asclepius-to-triton.md` (Apollo context for chat routing)
  - `_meta/contracts/boreas-to-triton.md` (Hermes tour narration context)

## Wave 3 unlock signal

Triton spawn unblocked once Dike Wave 2 audit gate clears.
