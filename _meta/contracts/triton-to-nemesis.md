# Contract: Triton to Nemesis

**Edge type**: intra-wave (Wave 3 internal)
**Wave**: Wave 3 producer to Wave 3 consumer
**Status**: locked
**Authored**: 2026-05-12 15:59 WIB

## Producer

**Worker**: Triton (Wave 3)
**Domain**: DeepSeek V4 client (OpenAI Python SDK with base_url=https://api.deepseek.com) + defensive layer (semantic cache + canned response + retry + fallback + circuit breaker) + thinking-mode toggle + per-resident routing. Triton exposes the LLM client as a Python module Nemesis consumes for Argus CVSS scoring + exploit pattern lookup (V4-Flash thinking low per PRD Section 18.3).

## Consumer

**Worker**: Nemesis (Wave 3)
**Domain**: 5 Apollo detector + Argus CVSS scoring + 5 spec-drift pattern A-E. Argus security routing requires LLM judgment for CVSS vector + exploit pattern lookup + suggested mitigation with public CVE reference. Apollo detectors are pure deterministic AST-diff (no LLM); Argus uses Triton client. Spec-drift patterns A-E are deterministic too. So only the Argus security scoring channel uses Triton.

## Output schema (producer to consumer)

Triton exposes a shared `LLMClient` module Nemesis imports:

```python
# backend/app/services/llm_client.py (Triton authors)
from openai import AsyncOpenAI
from pydantic import BaseModel
from typing import Literal, AsyncIterator
import asyncio

ModelType = Literal["V4-Flash", "V4-Pro"]
ThinkingMode = Literal["disabled", "low", "medium", "high"]


class LLMMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str


class LLMResponse(BaseModel):
    """Non-streaming response."""
    content: str
    model_used: ModelType
    thinking_mode: ThinkingMode
    input_tokens: int
    output_tokens: int
    /** Cache layer hit flag (semantic cache or canned response). */
    cache_hit: bool
    /** Cost estimate in USD (input + output token cost). */
    cost_estimate_usd: float
    /** Latency in ms (excluding cache hit). */
    latency_ms: int
    /** Reasoning content captured but NEVER replayed (Phase B critical quirk). */
    reasoning_content: str | None = None


class LLMClient:
    """DeepSeek V4 client with defensive layer."""

    def __init__(self):
        self._openai = AsyncOpenAI(
            api_key=os.environ["DEEPSEEK_API_KEY"],
            base_url=os.environ["DEEPSEEK_BASE_URL"],
        )
        self._flash_model = os.environ["DEEPSEEK_MODEL_FLASH"]
        self._pro_model = os.environ["DEEPSEEK_MODEL_PRO"]
        self._semantic_cache = SemanticCache()
        self._canned = CannedResponseStore()
        self._circuit_breaker = CircuitBreaker()

    async def call(
        self,
        messages: list[LLMMessage],
        prefer_pro: bool = False,
        thinking_mode: ThinkingMode = "disabled",
        max_retries: int = 2,
        max_tokens: int | None = None,
        temperature: float = 0.7,
    ) -> LLMResponse:
        """Defensive call chain:

        1. Canned response check (top-10 pre-cached demo questions).
        2. Semantic cache check (cosine 0.85 threshold via sentence-transformer embeddings).
        3. DeepSeek V4 API call with thinking_mode + model selection.
        4. Retry simplified prompt on first failure.
        5. Fallback to other model (Flash <-> Pro) on second failure.
        6. Final fallback canned/error response.
        7. Circuit breaker: 5 consecutive failures -> 60s cooldown, canned only.
        """
        ...

    async def call_streaming(
        self,
        messages: list[LLMMessage],
        prefer_pro: bool = False,
        thinking_mode: ThinkingMode = "disabled",
        max_retries: int = 2,
    ) -> AsyncIterator[dict]:
        """Streaming variant; yields {type: 'chunk', text: str} for partial chunks
        and {type: 'done', metadata: ...} for completion."""
        ...

    def estimate_cost(
        self,
        input_tokens: int,
        output_tokens: int,
        model: ModelType,
    ) -> float:
        """Returns USD cost estimate per PRD Section 18.1 pricing."""
        ...


def get_llm_client() -> LLMClient:
    """Singleton accessor."""
    ...
```

Nemesis (Argus) consumer pattern:

```python
# backend/app/services/detectors/argus_security.py (Nemesis authors)
from app.services.llm_client import get_llm_client, LLMMessage
from app.models.findings import Finding, CVSSScore


async def argus_cvss_score(finding: Finding) -> CVSSScore:
    """Argus assigns CVSS vector + exploit pattern + suggested mitigation.

    Routes Triton client V4-Flash thinking low per PRD Section 18.3.
    """
    llm = get_llm_client()
    response = await llm.call(
        messages=[
            LLMMessage(role="system", content=ARGUS_PERSONA_PROMPT),  # From Hephaestus PromptOpening
            LLMMessage(role="user", content=build_argus_prompt(finding)),
        ],
        prefer_pro=False,
        thinking_mode="low",
        max_tokens=400,
    )
    return parse_cvss_response(response.content)
```

Argus persona prompt schema (Triton seeds via Hephaestus PromptOpening, Nemesis assembles):

```text
You are Argus, the watchful guardian resident of Codeplex Chronicle.
Your role: assess security findings, assign CVSS 3.1 base score vectors, identify exploit patterns from public CVE databases, recommend mitigation steps with citation references.

Output format: JSON with keys:
  cvss_vector (CVSS 3.1 vector string),
  cvss_base_score (float 0..10),
  exploit_pattern (CWE id + description),
  mitigation (1-3 sentence remediation steps),
  references (list of CVE ids or vendor advisory URLs).

Tone: clinical, brief, decisive. Cite sources. Never speculate beyond public records.
```

## Storage location

- LLM client: `backend/app/services/llm_client.py` (Triton)
- Semantic cache implementation: `backend/app/services/semantic_cache.py` (Triton; sentence-transformer embeddings)
- Canned response store: `backend/app/services/canned_responses.py` (Triton; top-10 demo question pre-cache)
- Circuit breaker: `backend/app/services/circuit_breaker.py` (Triton)
- Cost estimation: per PRD Section 18.1 pricing table
- Argus consumer: `backend/app/services/detectors/argus_security.py` (Nemesis)
- Argus persona prompt: `PromptOpening-codeplex-chronicle.md` (Hephaestus Wave 0 authors)

## Asumption baked

1. Argus routes to V4-Flash thinking low per PRD Section 18.3 (locked). Not V4-Pro because CVSS scoring is structured + bounded reasoning.
2. Shared 3000-token PromptOpening header prepended to every system prompt for cache-hit (H6 hypothesis target >70%).
3. NEVER replay `reasoning_content` from prior turns (Phase B critical quirk); LLMClient strips on multi-turn.
4. Semantic cache cosine 0.85 threshold via sentence-transformer embeddings (pre-warm cache via no-op call at session start per H6 mitigation).
5. Canned response check FIRST in defensive chain (avoid LLM call entirely for top-10 demo questions, latency < 100ms).
6. Cost tracking: every LLM call logged to `llm_call_log` table via Demeter (`triton-to-nemesis.md` does not detail; cross-reference `pandora-to-demeter.md` for log persist contract).
7. Circuit breaker state per-process; not distributed (single K8s pod replica per PRD Section 17).

## Validation steps

**Producer responsibility (Triton)**:
- `LLMClient.call` returns LLMResponse with all metadata fields populated (latency, cost, cache_hit).
- Defensive chain executes in correct order: canned -> semantic cache -> DeepSeek API -> retry -> fallback model -> canned/error.
- Thinking-mode parameter passed correctly via `extra_body={"thinking":{"type":"enabled"}}` + `reasoning_effort`.
- Smoke test: 10 Argus calls with mock findings, verify cache hit rate > 70% after second pass (H6 validation).

**Consumer responsibility (Nemesis)**:
- Argus persona prompt sourced from PromptOpening (Hephaestus authors).
- `argus_cvss_score` returns CVSSScore object with valid CVSS 3.1 vector + score + exploit pattern + mitigation.
- Failure handling: if LLMClient circuit-broken, returns degraded finding with generic mitigation + flag for manual review.
- Smoke test: 5 NodeGoat fork findings each get CVSS score from Argus; output parseable JSON.

## Edge case handling

- DeepSeek API outage: defensive layer falls back to canned generic response for Argus; Nemesis flags finding for manual review.
- Argus returns malformed JSON: Nemesis parses, falls back to regex extraction for CVSS vector; logs malformed response for prompt tuning.
- CVSS score out of range: Nemesis clamps to [0, 10] with warning log.
- Reasoning content leak in response: Triton's `LLMResponse.reasoning_content` is captured but NEVER replayed in multi-turn (Phase B quirk lock).
- Rate limit: DeepSeek 60 RPM default; Triton circuit breaker activates if 5 consecutive 429s.

## Open questions

- OQ-07 (DeepSeek V4-Pro vs V4-Flash optimal split): Argus locked to V4-Flash thinking low per PRD Section 18.3. Smoke test Wave 3 reveals if latency unacceptable for demo, fallback adjust per Metis recommendation.

## Reference

- Metis Agentic Structure md Section 2 DAG: Triton LLM client module consumed by Nemesis for Argus CVSS scoring
- Metis Section 5.6 Triton + Nemesis ship criteria
- PRD Section 18.1 (DeepSeek V4 pricing + context window)
- PRD Section 18.3 (per-resident model routing locked; Argus V4-Flash think low)
- PRD Section 18.4 (defensive layer fallback chain detail)
- PRD Section 18.5 (canned response top-10 pre-cache)
- Phase B Topic E (DeepSeek V4 reliability + reasoning_content quirk)
- Phase B H6 hypothesis (cache-hit ratio >70% target)
- Hephaestus Wave 0 PromptOpening (Argus persona prompt)
