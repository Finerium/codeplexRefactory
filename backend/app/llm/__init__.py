"""LLM gateway package (Triton Wave 3).

Owner: Triton (Wave 3).

Exposes:
- Types: ``LLMMessage`` + ``LLMResponse`` + ``ResidentId`` + ``ThinkingMode``
  + ``ModelType`` + ``SimulationTurn`` + ``FallbackStage``.
- Routing config: ``RESIDENT_ROUTING`` + ``SIMULATION_ROUTING`` LOCKED per
  PRD Section 18.3.
- Persona prompts: ``PERSONA_PROMPTS`` + ``build_resident_system_prompt`` +
  ``build_simulation_system_prompt``.
- Cost estimator: ``estimate_cost_usd``.
- Low-level client: ``DeepSeekClient`` + ``get_deepseek_client``.

High-level gateway (defensive layer + canned + cache + circuit breaker +
fallback chain) lives in ``app.services.llm_client``.

References:
- ``.claude/agents/triton.md`` Section 4 ownership table.
- ``_meta/contracts/triton-to-{nemesis,pandora,residents}.md``.
"""

from app.llm.types import (
    FallbackStage,
    LLMMessage,
    LLMResponse,
    ModelType,
    ResidentId,
    SimulationTurn,
    ThinkingMode,
    UiModelLabel,
)

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
