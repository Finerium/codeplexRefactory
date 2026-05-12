# Handoff: Triton Wave 3 to Runtime Residents (5 endpoint chat panel)

**Date**: 2026-05-12 21:57 WIB Day 1 evening
**Producer**: Triton (Wave 3, DeepSeek V4 client + defensive layer + per-resident routing)
**Consumer**: Runtime residents (Athena, Apollo, Argus, Clio, Hermes) via Persephone chat panel SSE
**Contract**: `_meta/contracts/triton-to-residents.md` (locked Pythia Wave 0)

## What Triton ships

### 5 resident chat endpoint (Persephone consume)

```http
POST /api/chat
Content-Type: application/json

{
  "thread_id": "thread-001",
  "target": "Apollo",
  "message": "What does this finding mean?",
  "context": {
    "current_mode": "health",
    "selected_building_id": "src/auth/oauth.ts",
    "mode_context": {
      "selectedFinding": { ... ApolloFinding shape ... },
      "glowingBuildingsCount": 6,
      "criticalCount": 2
    }
  }
}
```

Response: SSE stream `text/event-stream`.

```
event: chunk
data: {"residentId":"Apollo","text":"Selamat, finding ini bertanda critical..."}

event: chunk
data: {"residentId":"Apollo","text":" karena hardcoded secret ada di line 14..."}

event: done
data: {"residentId":"Apollo","modelUsed":"V4-Flash-non-think","inputTokens":124,"outputTokens":38,"latencyMs":820,"cacheHit":false,"fallbackChain":["primary"]}
```

Persephone's `frontend/src/lib/chat/mockResidentResponses.ts` Cycle 2 swap is a
single function body replacement (the mock `streamChat` swaps to real fetch SSE
parse). UI consumer code at `frontend/components/panels/chat/ChatPanel.tsx`
unchanged.

### Target values + routing matrix (LOCKED PRD Section 18.3)

| target value | Model     | Thinking | Max tokens | UI modelUsed label    |
|--------------|-----------|----------|------------|-----------------------|
| Athena       | V4-Pro    | high     | 4000       | V4-Pro-think-high     |
| Apollo       | V4-Flash  | disabled | 600        | V4-Flash-non-think    |
| Argus        | V4-Flash  | low      | 400        | V4-Flash-think-low    |
| Clio         | V4-Flash  | disabled | 600        | V4-Flash-non-think    |
| Hermes       | V4-Flash  | disabled | 300        | V4-Flash-non-think    |
| broadcast    | sequential call to all 5; SSE emits chunks per resident per arrival |

Lock 4 critical: routing locked. Pinned in test
`tests/test_triton_resident_routing.py` + `test_triton_chat_endpoint.py`
parametrized over all 5 residents.

### Persona content

Loaded from `app/llm/system_header.py::CHAT_PERSONA_PROMPTS` map. 5 expanded
voice blocks per resident sourced from PRD Section 10 + contract
`triton-to-residents.md` lines 137-162.

Hephaestus PromptOpening file Section 4 provides voice summaries; Triton
inlines the full persona blocks at `[INLINE: hephaestus-persona-summary-expansion]`
per Lock 5 honest claim discipline. Pan post-Wave 3 may re-issue PromptOpening
with explicit blocks; the loader would then read from file.

### Mode context handling

The `context.mode_context` JSON blob is opaque to Triton. Triton serializes
it verbatim into the user message body:

```
Context (JSON):
{"current_mode":"health","selected_building_id":"src/auth/oauth.ts","mode_context":{...}}

User message:
What does this finding mean?

Respond in your persona voice. Indonesian primary plus English technical code-switch when natural.
```

This lets per-mode consumers (Asclepius Apollo context, Hera Sprint context,
Pandora Refactor context, Boreas Onboarding context) embed their domain-specific
fields without schema churn at the Triton layer.

### Apollo cross-reference (Asclepius cross-wave consume)

Asclepius Wave 2 ships `useApolloQueryContext()` selector. Persephone Wave 2
wires the chat panel to attach Apollo context per
`frontend/src/lib/chat/sendApolloQuery.ts`. Triton consumes the resulting
payload via `/api/chat` with `target=Apollo`. No additional code on Triton
side beyond the context-embedding logic.

### Hermes cross-reference (Boreas cross-wave consume)

Boreas Wave 2 ships `fetchWaypointNarration(tourId, waypoint)` at
`frontend/src/modes/onboarding/tourDSL.ts`. The Cycle 2 frontend swap routes
that fetch to `POST /api/onboarding/narration` (dedicated Hermes narration
endpoint, NOT the generic chat endpoint, so the wire shape stays compact and
the response is a single `NarrationResponse` rather than SSE).

```http
POST /api/onboarding/narration
{
  "tour_id": "generic-30sec-v1",
  "waypoint_index": 0,
  "tour_variant": "generic-30sec",
  "narration_prompt_context": { ... per Boreas DSL ... }
}
```

Response:

```json
{
  "narration_text": "Selamat datang di main.py...",
  "cache_hit": false,
  "canned_hit": false,
  "latency_ms": 480,
  "model_used": "V4-Flash",
  "fallback_chain": ["primary"]
}
```

### Defensive layer + telemetry

Same 5-layer fallback chain (canned, circuit breaker, semantic cache, primary,
retry, fallback model, final canned). Persephone surfaces fallback chain in
chat message metadata so the UI can mark a response "from canned" or
"degraded" when the chain ends `canned_final` or `circuit_open_canned`.

## Validation steps before swap

1. Run `cd backend && .venv/bin/python -m pytest tests/test_triton_chat_endpoint.py tests/test_triton_5_resident_smoke.py -v`
   and confirm 13+ PASS.
2. Smoke test each resident manually with `curl`:
   ```bash
   curl -N -X POST http://localhost:8000/api/chat \
     -H "Content-Type: application/json" \
     -d '{"thread_id":"smoke","target":"Apollo","message":"hi","context":{"current_mode":"health","selected_building_id":null,"mode_context":{}}}'
   ```
3. Persephone swap `mockResidentResponses.ts streamChat` body to fetch SSE +
   parse. UI consumer code unchanged.

## Edge case handling

- Unknown resident id: 422 with valid list in detail.
- Persona load fail: shared header loader returns inline fallback summary
  with `[INLINE: prompt-opening-fallback]` label.
- DeepSeek API outage: defensive chain returns canned or generic apology.
  Persephone marks message `streamComplete: true` with `cacheHit=true` in
  metadata so the UI shows the canned-tag styling.
- Streaming connection drop: client retries; Persephone marks
  `streamComplete: false` and preserves partial body.
- Broadcast resident fails: SSE emits an error chunk for that resident and
  continues with the remaining four.

## Open questions

- Top-10 canned responses per resident: current top-10 spans the demo
  scenario set (PRD Section 18.5). Pan Day 2 may add 1 to 2 based on rehearsal
  feedback. Each canned entry is keyed by question pattern, not by resident.
- Indonesian vs English voice: persona prompts instruct bilingual code-switch;
  DeepSeek follows user input language. No locale parameter Wave 3.

## Reference

- Pythia contract `_meta/contracts/triton-to-residents.md`
- Asclepius cross-wave handoff `wave2_asclepius_to_triton.md`
- Boreas cross-wave handoff `wave2_boreas_to_triton.md`
- Persephone cross-wave handoff `wave2_persephone_to_triton.md`
- PRD Section 10 (5 resident personas) + Section 18.3 (routing LOCKED)
- Hephaestus PromptOpening Section 4 (voice summaries)

## Triton ship status

Same as sibling handoffs. 115 Triton-owned tests pass. Aletheia final audit
unblocked.
