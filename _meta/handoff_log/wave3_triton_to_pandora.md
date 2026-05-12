# Handoff: Triton Wave 3 to Pandora Wave 3

**Date**: 2026-05-12 21:57 WIB Day 1 evening
**Producer**: Triton (Wave 3, DeepSeek V4 client + defensive layer)
**Consumer**: Pandora (Wave 3, Athena proposal author + Refactor Mode simulation engine + drafts/ isolation + dual review gate)
**Contract**: `_meta/contracts/triton-to-pandora.md` (locked Pythia Wave 0)

## What Triton ships (Cycle 2 swap target for Pandora)

### Drop-in replacement for Pandora's local LLMClient stub

Pandora Wave 3 Cycle 1 stub lives at `backend/app/services/refactor/llm_stub.py`
with `LLMClientProtocol` + `StubLLMClient` + `get_llm_client()`. The Cycle 2
swap target is a single-line import change:

```python
# BEFORE (Cycle 1 stub):
from app.services.refactor.llm_stub import get_llm_client, LLMMessage, LLMResponse

# AFTER (Cycle 2 real Triton):
from app.services.llm_client import get_llm_client
from app.llm.types import LLMMessage, LLMResponse
```

Triton's `get_llm_client()` returns an `LLMGateway` instance that satisfies
Pandora's `LLMClientProtocol`:

```python
async def call(
    self,
    *,
    messages: list[LLMMessage],
    prefer_pro: bool = False,
    thinking_mode: Literal["disabled", "low", "medium", "high"] = "disabled",
    max_tokens: int = 4000,
    worker: str = "pandora",
    simulation_id: Optional[str] = None,
    resident_id: Optional[str] = None,
) -> LLMResponse: ...
```

The `LLMResponse` field shape matches Pandora's local dataclass verbatim
(`content`, `model_used`, `thinking_mode`, `cache_hit`, `canned_hit`,
`input_tokens`, `output_tokens`, `cost_estimate_usd`, `latency_ms`,
`reasoning_content`, `error`, `call_id`). The Pydantic version adds a
`fallback_chain` field for telemetry.

Pandora call sites for proposal author + simulation engine require NO code
changes beyond the import flip.

### Simulation routing per PRD Section 18.6 LOCKED

| Turn            | Model    | Thinking | Max tokens | Persona key       |
|-----------------|----------|----------|------------|-------------------|
| test_gen        | V4-Pro   | high     | 4000       | athena_test_gen   |
| impl_gen        | V4-Pro   | high     | 6000       | athena_impl_gen   |
| diff_serialize  | V4-Flash | disabled | 8000       | diff_serialize    |

Lookup via `app.llm.resident_routing.get_simulation_routing("test_gen")` etc.

### Simulation system prompts sourced from Pandora's own prompts module

Triton's `app/llm/system_header.build_simulation_system_prompt(turn)` calls
into Pandora's existing `app/services/refactor/prompts.py` for the canonical
Athena turn 1 + turn 2 + turn 3 system text. Single source of truth: Pandora
owns the prompt content; Triton owns the runtime wiring.

```python
from app.llm.system_header import build_simulation_system_prompt

# Returns: <PromptOpening header>\n\n## Simulation turn persona\n\n<Pandora prompts.ATHENA_TEST_GEN_SYSTEM>
prompt = build_simulation_system_prompt("test_gen")
```

### Multi-turn coordination pattern

Pandora's existing `SimulationEngine.run` already builds 3 sequential calls
without replaying `reasoning_content` (Pandora Cycle 1 stub matches this
contract). After Cycle 2 swap, the same code path stays correct because:

1. Pandora constructs each turn's `messages` list using only the prior turn's
   `content` field (not `reasoning_content`).
2. Triton's `DeepSeekClient._scrub_messages` rebuilds the wire payload with
   only `role` + `content` fields (defense in depth).
3. `LLMMessage` Pydantic config (`extra=forbid`) rejects any caller that
   bypasses the contract and tries to inject `reasoning_content`.

Phase B Lock 4 critical anti-pattern is enforced at 3 layers: type system,
client scrubber, regression test.

### Cost budgeting + telemetry

Pandora is the heaviest LLM consumer in Wave 3 (V4-Pro think high for 2 of 3
simulation turns). The gateway records each call into the in-memory
`llm_call_log_buffer` with cost estimate per PRD Section 18.1 pricing:

- V4-Flash: $0.14 input / $0.28 output per 1M tokens.
- V4-Pro:   $1.74 input / $3.48 output per 1M tokens (75 percent off until
  2026-05-31 15:59 UTC).

Per-simulation cost estimate: about $0.05 to $0.20 per run (Phase B research).
$5 Hafiz budget supports 25 to 100 simulations across the hackathon.

Read cumulative cost via `GET /api/llm/health`:

```json
{
  "circuit_state": "closed",
  "consecutive_failures": 0,
  "canned_entries": 10,
  "calls_recorded": 12,
  "total_cost_usd": 0.0234
}
```

### HTTP endpoint alternative for cross-process simulation dispatch

Wave 3 typical path is in-process Pandora -> gateway. For ops debug + audit
replay, `POST /api/simulation/turn` is also exposed:

```http
POST /api/simulation/turn
{
  "turn": "test_gen",
  "simulation_id": "sim-2fa-001",
  "user_messages": ["Add 2FA to login flow"]
}
```

Response includes content + cost + cache state + fallback chain.

## What Pandora Wave 3 needs to know

### drafts/ isolation safety property (AD-19 LOCKED)

Triton has zero filesystem ownership in the simulation path. Pandora writes
turn 1 tests + turn 2 impl + turn 3 diff to `drafts/<simulation_id>/`. The
gateway returns the raw LLM content; Pandora's `drafts_isolation` guard (per
`tests/test_drafts_isolation_smoke.py`) MUST be invoked before any write.

### reasoning_content NEVER in next turn messages

```python
# WRONG (Phase B anti-pattern, blocked by Pydantic + scrubber):
messages = [
    LLMMessage(role="system", content=sys),
    LLMMessage(role="assistant", content=prev.content, reasoning_content=prev.reasoning_content),  # rejected
    LLMMessage(role="user", content=next_turn),
]

# RIGHT (Triton + Pandora contract):
messages = [
    LLMMessage(role="system", content=sys),
    LLMMessage(role="assistant", content=prev.content),  # ONLY content
    LLMMessage(role="user", content=next_turn),
]
```

If Pandora needs `reasoning_content` for audit/log (e.g., to surface to Selene
dashboard), read `resp.reasoning_content` and persist via Demeter
`llm_call_log` table. Never replay into next-turn messages.

### Failure modes + defensive chain telemetry

`resp.fallback_chain` is a list tracking which layer produced the result:

| Chain value           | Meaning                                                 |
|-----------------------|---------------------------------------------------------|
| `canned_hit`          | Top-10 canned response hit, no LLM call.                |
| `circuit_open_canned` | Circuit breaker open, returned canned/apology.          |
| `cache_hit`           | Semantic cache hit (cosine 0.85).                       |
| `primary`             | Primary call succeeded.                                 |
| `retry_simplified`    | Primary failed once, retry with simplified prompt worked.|
| `fallback_model`      | Primary and retry failed, fallback model succeeded.     |
| `canned_final`        | All upstream failed, final canned (or apology if miss). |

Pandora can branch on chain values to flag a simulation as "degraded" when
chain ends `canned_final` or `circuit_open_canned`.

### Simulation timeout suggestion

V4-Pro think high turns can take 5 to 15 seconds. Triton's underlying client
timeout is 30 seconds. Pandora `SimulationEngine.run` should set a per-turn
soft deadline (e.g., 30s) and retry once on timeout per the contract.

## Validation steps for Pandora before swap

1. Run `cd backend && .venv/bin/python -m pytest tests/test_triton_llm_gateway.py tests/test_triton_5_resident_smoke.py -v`
   and confirm 23+ PASS. Defensive chain + per-resident routing verified.
2. Author a smoke test in `backend/tests/` that imports `get_llm_client` from
   `app.services.llm_client` and runs a 3 turn simulation against a mocked
   client. Confirm `reasoning_content` does not appear in any outgoing
   messages payload.
3. Update Pandora's `proposal_author.py` + `simulation_engine.py` import lines
   to point at `app.services.llm_client`. No call site changes.

## Edge case handling

- LLM call timeout (V4-Pro thinking high): client timeout 30 seconds. Pandora
  should retry once on timeout per simulation contract.
- Generated code malformed (parse error): per `hades-to-pandora.md`, Pandora
  re-runs turn 2 with stricter prompt + parse error context; max 2 retries
  before marking simulation 'failed'. Triton has no role here.
- Diff serialization produces empty diff: Pandora marks simulation 'failed';
  Triton has no role.
- Cost budget approaching limit: query `/api/llm/health total_cost_usd` and
  halt new simulations if budget < $0.50 remaining.

## Open questions Pandora decides

- Concurrent simulations: Triton gateway supports concurrent calls (async
  client). Pandora architecture decision whether to run 3 simulations in
  parallel or serial for demo.
- Athena proposal author multi-language: Triton has no language preference;
  the simulation system prompts (sourced from Pandora) ask the LLM to detect
  the test framework from repo context.

## Reference

- Pythia contract `_meta/contracts/triton-to-pandora.md` (canonical schema)
- Triton agent prompt `.claude/agents/triton.md` Section 4
- Pandora local stub at `backend/app/services/refactor/llm_stub.py` (Cycle 1)
- Pandora prompts module at `backend/app/services/refactor/prompts.py`
  (canonical Athena turn 1/2/3 system text)
- PRD Section 18.6 (simulation engine multi-turn coordination)
- PRD AD-19 (drafts/ isolation safety property LOCKED)
- Phase B Topic E (reasoning_content quirk LOCKED)

## Triton ship status

Same as `wave3_triton_to_nemesis.md` ship status. 115 Triton-owned tests pass.
Aletheia final audit unblocked.
