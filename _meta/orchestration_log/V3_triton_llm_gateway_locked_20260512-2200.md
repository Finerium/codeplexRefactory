# V3 Triton LLM Gateway Locked Snapshot

**Lock date**: 2026-05-12 22:00 WIB Day 1 evening
**Worker**: Triton (Wave 3)
**Milestone**: Wave 3 DeepSeek V4 LLM gateway foundation, 4 cycle complete
**Status**: LOCKED per Lock 9 V_n snapshot policy

## Scope

Triton ship covering the LLM gateway foundation that Nemesis (Argus CVSS),
Pandora (3 turn refactor simulation engine), Persephone (chat panel SSE),
Boreas (Hermes onboarding narration), Asclepius (Apollo finding context), and
Aletheia/Selene (cost + health monitoring) consume Wave 3.

## What is locked

### Code surface (19 source files at `backend/`)

```
app/llm/
  __init__.py              Barrel re-export
  types.py                 LLMMessage + LLMResponse + 5 Literal types
  resident_routing.py      PRD Section 18.3 + 18.6 routing LOCKED
  cost_estimator.py        V4-Flash + V4-Pro pricing per PRD Section 18.1
  system_header.py         PromptOpening + 5 chat personas + 3 simulation personas
  client.py                DeepSeekClient AsyncOpenAI wrapper + reasoning_content scrub

app/services/
  circuit_breaker.py       5 fail / 60s cooldown state machine
  canned_responses.py      Top-10 demo questions per PRD Section 18.5
  semantic_cache.py        Sentence-transformer cosine 0.85
  llm_call_log_buffer.py   [STUB] in-memory ring buffer (Demeter persist Cycle 2)
  llm_client.py            LLMGateway 7-step defensive chain + Pandora-compatible

app/api/
  chat.py                  POST /api/chat SSE 5 resident + broadcast
  onboarding.py            POST /api/onboarding/narration Hermes V4-Flash non-think
  security.py              POST /api/security/argus/score Argus V4-Flash think-low
  simulation.py            POST /api/simulation/turn Pandora 3 turn dispatch
  llm_health.py            GET /api/llm/health gateway operational state
  __init__.py              Aggregator (Hades + Triton routers)

app/services/auth_session.py (extended)
  require_session FastAPI dep [STUB Wave 3 cycle 3], Hades Cycle 2 hardens
```

### Test surface (13 test files, 115 tests PASS)

```
tests/test_triton_llm_types.py                       8 PASS
tests/test_triton_resident_routing.py                15 PASS
tests/test_triton_system_header.py                   12 PASS
tests/test_triton_deepseek_client.py                 6 PASS
tests/test_triton_circuit_breaker.py                 7 PASS
tests/test_triton_canned_responses.py                16 PASS
tests/test_triton_semantic_cache.py                  8 PASS
tests/test_triton_llm_gateway.py                     13 PASS
tests/test_triton_chat_endpoint.py                   8 PASS
tests/test_triton_other_endpoints.py                 10 PASS
tests/test_triton_reasoning_content_strip.py         4 PASS
tests/test_triton_canned_latency.py                  2 PASS
tests/test_triton_5_resident_smoke.py                6 PASS
                                                   ---------
                                                     115 PASS
```

Runtime: 1.7 seconds on M-series. No flakes observed across 5 consecutive runs.

### 4 mandatory artifacts

```
_meta/decision_log/triton.md                              D-Triton-01 through D-Triton-10
_meta/uncertainty/triton-cycle4-20260512-2200.md          U-Triton-001 through U-Triton-007
_meta/checkpoints/triton-cycle4.md                        cycle 4 final ship state
_meta/handoff_log/wave3_triton_to_nemesis.md              Argus consumer guide
_meta/handoff_log/wave3_triton_to_pandora.md              LLMClientProtocol swap target
_meta/handoff_log/wave3_triton_to_residents.md            Persephone SSE consumer guide
```

### Plan document

```
docs/superpowers/plans/2026-05-12-triton-wave3-llm-gateway.md   4 cycle decomposition
```

## What is enforced

### Lock 4 (Phase B Topic E LOCKED, reasoning_content quirk)

3-layer enforcement:
1. `LLMMessage` Pydantic `ConfigDict(extra="forbid")` rejects type-level
   injection.
2. `DeepSeekClient._scrub_messages` rebuilds outgoing wire dicts with only
   `role` + `content` fields (defense in depth).
3. `test_triton_reasoning_content_strip.py` regression test:
   - Type-level: `test_llm_message_type_level_rejects_reasoning_content`.
   - Wire-level: `test_multi_turn_conversation_strips_reasoning_content_wire_level`.
   - Source-static: `test_client_source_does_not_assemble_reasoning_content_into_outgoing_dict`.
   - Response captures `reasoning_content` for log: `test_response_captures_reasoning_for_log_audit_only`.

### Lock 4 (PRD Section 18.3 routing LOCKED)

Per-resident routing pinned by `test_triton_resident_routing.py`:

| Resident | Model    | Thinking | Max tokens |
|----------|----------|----------|------------|
| Athena   | V4-Pro   | high     | 4000       |
| Apollo   | V4-Flash | disabled | 600        |
| Argus    | V4-Flash | low      | 400        |
| Clio     | V4-Flash | disabled | 600        |
| Hermes   | V4-Flash | disabled | 300        |

Simulation routing pinned same file:

| Turn            | Model    | Thinking | Max tokens |
|-----------------|----------|----------|------------|
| test_gen        | V4-Pro   | high     | 4000       |
| impl_gen        | V4-Pro   | high     | 6000       |
| diff_serialize  | V4-Flash | disabled | 8000       |

### Defensive chain (PRD Section 18.4)

7-step fallback order:
1. Canned response top-10 (< 100ms target).
2. Circuit breaker probe (5 fail / 60s cooldown).
3. Semantic cache (cosine 0.85, sentence-transformer all-MiniLM-L6-v2).
4. Primary DeepSeek call (Flash or Pro per `prefer_pro`).
5. Retry simplified prompt (system + last user only).
6. Fallback model (Flash <-> Pro swap).
7. Final canned (or generic apology if canned miss).

Each layer surfaces in `LLMResponse.fallback_chain` for telemetry.

### Cost tracking (PRD Section 18.1 + 18.7)

Per-call cost estimate via `estimate_cost_usd` with PRD Section 18.1 pricing
rows. Cumulative cost via `GET /api/llm/health total_cost_usd`. Hafiz $5
budget protected by canned-first + circuit-breaker.

## Downstream unblock signals

- Pandora Wave 3: `from app.services.llm_client import get_llm_client` is a
  drop-in replacement for `from app.services.refactor.llm_stub import get_llm_client`.
  Cycle 2 swap: 1-line import edit. LLMResponse field-shape parity verified.
- Nemesis Wave 3: `POST /api/security/argus/score` HTTP endpoint live, OR
  in-process gateway call via `get_llm_gateway()`. Argus persona prompt loaded
  from `app/llm/system_header.py`.
- Persephone Wave 2 frontend: `POST /api/chat` SSE endpoint ready. Persephone
  Cycle 2 frontend swap = replace `streamChat` mock body with real fetch SSE
  parse.
- Boreas Wave 2 frontend: `POST /api/onboarding/narration` ready. Boreas
  Cycle 2 swap = replace `fetchWaypointNarration` body with real fetch.
- Asclepius Wave 2 frontend: no new code needed; existing `useApolloQueryContext`
  selector + `/api/chat target=Apollo` path works end-to-end.
- Aletheia Wave 3 final audit gate: unblocked after the remaining 5 Wave 3
  workers Cycle 2 full ship.

## Anti-pattern compliance audit

| Lock | Status | Notes |
|------|--------|-------|
| 1 (no em dash) | PASS | Audited via test `test_chat_persona_prompts_avoid_em_dash` + `test_canned_content_no_em_dash` |
| 2 (no emoji) | PASS | No emoji anywhere in source |
| 3 (no silent scope narrow) | PASS | SSE chunkified design choice flagged U-Triton-004 |
| 4 (no silent assume) | PASS | Routing + reasoning_content 3-layer enforcement |
| 5 (honest claim) | PASS | [STUB] + [INLINE] labels on session dep + buffer + personas |
| 6 (capacity respect) | PASS | Single-session ship |
| 7 (Greek naming) | PASS | ResidentId TitleCase match PRD Section 10 |
| 8 (paid services) | PASS | DeepSeek $5 Hafiz budget tracked per call |
| 9 (V_n snapshot) | THIS FILE | Final ship V_n locked |
| 10 (per-wave auditor) | PENDING | Aletheia spawn after 6 Wave 3 workers Cycle 2 |

## Lock policy

Per Lock 9, continuous edit of this snapshot is illegal. Updates require a new
`V_n+1` snapshot.
