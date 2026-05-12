"""LLM types for Triton Wave 3 (DeepSeek V4 client + defensive layer).

Owner: Triton (Wave 3).

Pydantic v2 + dataclass parity with Pandora ``app/services/refactor/llm_stub.py``
``LLMMessage`` and ``LLMResponse`` so the Cycle 2 swap from Pandora's local
stub to the real Triton client is a single-line import edit. We re-export the
same field names + types to honor the ``LLMClientProtocol`` shape.

Source contracts:
- ``_meta/contracts/triton-to-nemesis.md`` lines 18-89
- ``_meta/contracts/triton-to-pandora.md`` lines 20-104
- ``_meta/contracts/triton-to-residents.md`` lines 28-88
- ``_meta/contracts/persephone-to-triton.md`` lines 22-71 (TitleCase
  ``ResidentId``).

CRITICAL anti-pattern Lock 4 (Phase B Topic E LOCKED):
``LLMMessage`` has ONLY ``role`` and ``content`` fields. ``reasoning_content``
is NEVER carried back in next-turn messages. DeepSeek V4 thinking mode ignores
``reasoning_content`` on input but pollutes the prompt context window. Defense
in depth: Pydantic ``ConfigDict(extra="forbid")`` raises ValidationError if a
caller bypasses the dataclass constructor and tries to inject the field.

Compliance:
- Lock 1 (no em dash): clean.
- Lock 2 (no emoji): clean.
- Lock 4: Pydantic ``extra=forbid`` on ``LLMMessage`` enforces no
  ``reasoning_content`` leak.
- Lock 5 (honest claim): ``LLMResponse.reasoning_content`` field is captured
  for logging only; documented in field docstring.
"""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


# ----------------------------------------------------------------------------
# Public discriminator types
# ----------------------------------------------------------------------------


# Match Persephone ``frontend/src/lib/chat/types.ts`` TitleCase.
ResidentId = Literal["Athena", "Apollo", "Argus", "Clio", "Hermes"]

# 4 thinking levels: ``disabled`` skips thinking entirely; ``low`` / ``medium`` /
# ``high`` map to ``reasoning_effort`` plus ``extra_body={"thinking":{"type":"enabled"}}``.
ThinkingMode = Literal["disabled", "low", "medium", "high"]

# Model surface used by callers; the underlying string id is resolved via
# ``DEEPSEEK_MODEL_FLASH`` / ``DEEPSEEK_MODEL_PRO`` env vars per PRD Section 18.2.
ModelType = Literal["V4-Flash", "V4-Pro"]

# Pandora 3 turn refactor simulation per PRD Section 18.6.
SimulationTurn = Literal["test_gen", "impl_gen", "diff_serialize"]

# Tracks which layer of the defensive chain produced a response. Useful for
# Aletheia audit + cost analysis.
FallbackStage = Literal[
    "cache_hit",
    "canned_hit",
    "primary",
    "retry_simplified",
    "fallback_model",
    "canned_final",
    "circuit_open_canned",
]

# Pydantic alias for the ``modelUsed`` field in Persephone ChatMessageMetadata.
UiModelLabel = Literal[
    "V4-Flash-non-think",
    "V4-Flash-think-low",
    "V4-Pro-think-high",
]


# ----------------------------------------------------------------------------
# Pydantic models
# ----------------------------------------------------------------------------


class LLMMessage(BaseModel):
    """Single chat message envelope.

    ``role`` + ``content`` only. ``reasoning_content`` NEVER permitted on this
    model; the Pydantic config rejects unknown fields so a caller passing
    ``LLMMessage(role=..., content=..., reasoning_content=...)`` surfaces the
    Phase B Lock 4 violation immediately.
    """

    model_config = ConfigDict(extra="forbid")

    role: Literal["system", "user", "assistant"]
    content: str


class LLMResponse(BaseModel):
    """LLM call response surface.

    Field names mirror Pandora ``StubLLMClient`` LLMResponse dataclass so the
    Cycle 2 swap is a transparent import flip from
    ``app.services.refactor.llm_stub`` to ``app.services.llm_client``.

    Anti-pattern note: ``reasoning_content`` here is captured for telemetry /
    audit log only. The next-turn message builder MUST NOT pull this back into
    an LLMMessage; ``DeepSeekClient._scrub_messages`` enforces this on the
    outbound side.
    """

    model_config = ConfigDict(extra="forbid")

    content: str
    model_used: ModelType = "V4-Flash"
    thinking_mode: ThinkingMode = "disabled"
    cache_hit: bool = False
    canned_hit: bool = False
    input_tokens: int = 0
    output_tokens: int = 0
    cost_estimate_usd: float = 0.0
    latency_ms: int = 0
    reasoning_content: Optional[str] = None
    error: Optional[str] = None
    call_id: str = "triton-call"
    fallback_chain: list[FallbackStage] = Field(default_factory=list)


__all__ = [
    "FallbackStage",
    "LLMMessage",
    "LLMResponse",
    "ModelType",
    "ResidentId",
    "SimulationTurn",
    "ThinkingMode",
    "UiModelLabel",
]
