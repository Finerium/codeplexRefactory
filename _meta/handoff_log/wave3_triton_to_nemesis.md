# Handoff: Triton Wave 3 to Nemesis Wave 3

**Date**: 2026-05-12 21:57 WIB Day 1 evening
**Producer**: Triton (Wave 3, DeepSeek V4 client + defensive layer + per-resident routing)
**Consumer**: Nemesis (Wave 3, 5 Apollo detectors + 5 spec-drift patterns + Argus security)
**Contract**: `_meta/contracts/triton-to-nemesis.md` (locked Pythia Wave 0)

## What Triton ships

### Public API surface Nemesis consumes

```python
# Direct import path (Cycle 2 swap for Pandora-style consumers).
from app.services.llm_client import get_llm_gateway, get_llm_client
from app.llm.types import LLMMessage, LLMResponse, ResidentId, ThinkingMode
from app.llm.resident_routing import get_resident_routing
from app.llm.system_header import build_resident_system_prompt
```

### Argus CVSS scoring endpoint (the only Nemesis touchpoint)

Apollo detectors are pure deterministic AST-diff (no LLM); spec-drift A through E
are deterministic too. Only the Argus security scoring channel goes through
Triton. Two access patterns supported:

**Option A: HTTP endpoint (recommended for cross-process Nemesis)**

```http
POST /api/security/argus/score
Content-Type: application/json

{
  "finding_id": "f-001",
  "file_path": "src/auth/oauth.ts",
  "line_start": 12,
  "line_end": 14,
  "category": "hardcoded-secret",
  "severity": "critical",
  "title": "Hardcoded secret detected",
  "description": "Token committed in source",
  "code_excerpt": "const token = 'sk-abc...';"
}
```

Response:

```json
{
  "finding_id": "f-001",
  "cvss_vector": "AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
  "cvss_base_score": 9.8,
  "exploit_pattern": "CWE-798 Hardcoded credentials",
  "mitigation": "Rotate the secret. Move to environment variable. Audit git history for prior exposure.",
  "references": ["CVE-2024-1234", "https://nvd.nist.gov/..."],
  "raw_content": "<original LLM body for re-parse fallback>",
  "cache_hit": false,
  "canned_hit": false,
  "latency_ms": 1200,
  "model_used": "V4-Flash",
  "fallback_chain": ["primary"],
  "parse_error": null
}
```

**Option B: In-process gateway call (recommended for Wave 3 single-pod backend)**

```python
from app.llm.resident_routing import get_resident_routing
from app.llm.system_header import build_resident_system_prompt
from app.llm.types import LLMMessage
from app.services.llm_client import get_llm_gateway


async def argus_cvss_score(finding: Finding) -> CVSSScore:
    config = get_resident_routing("Argus")
    system = build_resident_system_prompt("Argus")
    user = build_argus_prompt(finding)  # Nemesis-owned prompt template
    messages = [
        LLMMessage(role="system", content=system),
        LLMMessage(role="user", content=user),
    ]
    gateway = get_llm_gateway()
    resp = await gateway.call_with_fallback(
        messages=messages,
        prefer_pro=config["prefer_pro"],          # False (V4-Flash)
        thinking_mode=config["thinking_mode"],    # "low"
        max_tokens=config["max_tokens"],          # 400
        worker="nemesis_argus",
        resident_id="Argus",
    )
    return parse_cvss_response(resp.content)
```

### Routing config

- **Argus**: V4-Flash thinking-low, max_tokens 400 (locked PRD Section 18.3).
- System prompt: shared PromptOpening header + Argus persona block (warm-cached via H6).

### Defensive layer applied automatically

Per call, the gateway runs:
1. Canned response top-10 (sub-100ms hit when matched, otherwise miss).
2. Circuit breaker (5 consecutive failures, 60s cooldown).
3. Semantic cache (cosine 0.85 threshold via sentence-transformer all-MiniLM-L6-v2).
4. Primary DeepSeek call.
5. Retry simplified prompt on first failure.
6. Fallback model on second failure.
7. Final canned or apology.

Nemesis does not need to handle the defensive chain; the response object's
`fallback_chain` field tells Nemesis which layer produced the answer.

### LLMResponse shape (matches Pandora local stub for swap parity)

```python
class LLMResponse(BaseModel):
    content: str
    model_used: Literal["V4-Flash", "V4-Pro"]
    thinking_mode: Literal["disabled", "low", "medium", "high"]
    cache_hit: bool
    canned_hit: bool
    input_tokens: int
    output_tokens: int
    cost_estimate_usd: float
    latency_ms: int
    reasoning_content: str | None  # captured for log only, NEVER replayed
    error: str | None
    call_id: str
    fallback_chain: list[str]
```

CRITICAL Phase B anti-pattern Lock 4: `reasoning_content` from prior turns is
NEVER carried back to the next request. The DeepSeek client wrapper rebuilds
the outgoing messages list with only `role` + `content` fields. Nemesis must
not construct `LLMMessage(role="assistant", content=..., reasoning_content=...)`
for replay; the Pydantic config rejects this at construction time.

## What Nemesis Wave 3 needs to know

### Per-resident routing locked PRD Section 18.3

| Resident | Model    | Thinking | Max tokens | Persona key      |
|----------|----------|----------|------------|------------------|
| Athena   | V4-Pro   | high     | 4000       | athena_persona   |
| Apollo   | V4-Flash | disabled | 600        | apollo_persona   |
| Argus    | V4-Flash | low      | 400        | argus_persona    |
| Clio     | V4-Flash | disabled | 600        | clio_persona     |
| Hermes   | V4-Flash | disabled | 300        | hermes_persona   |

Lock 4 critical: this table is LOCKED. Do not remap silently. If Argus routing
needs to change (e.g., latency unacceptable), ferry V1 Orch with the
benchmark data; the test `tests/test_triton_resident_routing.py` pins this
table verbatim and CI fails on edit.

### Argus persona prompt content

Loaded from Triton `app/llm/system_header.py::ARGUS_CHAT_PERSONA`. Voice:
clinical, decisive, factual. Output format STRICT JSON with keys
`cvss_vector`, `cvss_base_score`, `exploit_pattern`, `mitigation`,
`references`. Nemesis re-parse path (already wired in the HTTP endpoint)
clamps `cvss_base_score` to [0, 10] and falls back to `raw_content` when JSON
malformed.

### Cost tracking

Every LLM call recorded to `app/services/llm_call_log_buffer.py` in-memory
buffer with fields matching Demeter `llm_call_log` table schema. Demeter
Wave 3 cycle 2 wires the Postgres persist hook. Nemesis itself does not need
to wire cost tracking; surfaces through `/api/llm/health` for ops.

## Validation steps for Nemesis before consume

1. Run `cd backend && .venv/bin/python -m pytest tests/test_triton_*.py -v` and
   verify 115 PASS. Confirms routing + defensive layer + endpoints clean.
2. Author Nemesis Argus consumer at `backend/app/services/detectors/argus_security.py`
   using the in-process pattern (Option B above) or HTTP pattern (Option A) per
   Nemesis architecture decision.
3. Smoke test 5 mock NodeGoat findings each get CVSS scored.

## Edge case handling

- DeepSeek API outage: gateway defensive chain returns canned or apology.
  Nemesis flags the finding for manual review when `fallback_chain` ends with
  `canned_final` or `circuit_open_canned`.
- Argus returns malformed JSON: HTTP endpoint sets `parse_error="json_decode_failed"`
  and preserves `raw_content`. In-process consumer can re-parse via own logic.
- CVSS score out of range: HTTP endpoint clamps to [0, 10]; in-process consumer
  must clamp itself.
- Rate limit: circuit breaker trips after 5 consecutive failures, 60s cooldown.

## Open questions Nemesis decides

- Apollo persona for finding narration: Triton ships `apollo_persona` block in
  `system_header.py`. Apollo detector outputs are deterministic; if Nemesis
  wants warm prose wrapper, route through `/api/chat` with target=Apollo.
- 1-click ticket creation flow: Demeter `POST /api/findings/{id}/to-issue`
  handles GitHub issue create. Triton has no role in that path.

## Reference

- Pythia contract `_meta/contracts/triton-to-nemesis.md` (canonical schema)
- Triton agent prompt `.claude/agents/triton.md` Section 4 (ownership table)
- PRD Section 18.1 through 18.7 (DeepSeek client + routing + defensive +
  cost tracking)
- Phase B Topic E (reasoning_content quirk LOCKED anti-pattern)
- Hephaestus PromptOpening Section 4 (persona voice summary)

## Triton ship status

- 19 source files at `backend/app/llm/*` + `backend/app/services/*` +
  `backend/app/api/*` (LLM types, routing, system header, cost estimator,
  DeepSeek client, circuit breaker, canned, semantic cache, LLMGateway, chat,
  onboarding, security, simulation, llm_health, llm_call_log_buffer)
- 115 Triton-owned tests pass (`tests/test_triton_*.py`)
- 5 router endpoints mounted under `/api/{chat,onboarding,security,simulation,llm}`
- 5 mandatory artifacts authored (this handoff + Pandora handoff + Residents
  handoff + decision log + uncertainty journal + checkpoint)
- TSC equivalent: `python -m pytest` exit 0 on Triton scope
- No ferry triggered
- Aletheia final audit unblocked
