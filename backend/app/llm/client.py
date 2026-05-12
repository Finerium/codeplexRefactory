"""DeepSeek V4 async client wrapper.

Owner: Triton (Wave 3).

OpenAI Python SDK >= 1.x with ``base_url=https://api.deepseek.com`` per PRD
Section 18.2. The wrapper hides the SDK detail behind a thin signature that
returns the Pydantic ``LLMResponse`` matching Pandora's stub shape.

CRITICAL anti-pattern Lock 4 (Phase B Topic E LOCKED):
The outbound messages array contains ONLY ``role`` and ``content`` fields.
Even if a caller bypasses the Pydantic ``LLMMessage`` constructor by passing
a dict with ``reasoning_content``, ``_scrub_messages`` rebuilds the message
dict from scratch (defense in depth).

Compliance:
- Lock 1 (no em dash): clean.
- Lock 2 (no emoji): clean.
- Lock 4 (reasoning_content scrub): tested in
  ``tests/test_reasoning_content_strip.py`` cycle 4.
- Lock 5 (honest claim): cost estimate documented as conservative.
- Lock 8 (paid services): real API calls billed to Hafiz $5 budget.
"""

from __future__ import annotations

import logging
import time
import uuid
from typing import Any

from openai import AsyncOpenAI

from app.config import get_settings
from app.llm.cost_estimator import estimate_cost_usd
from app.llm.types import LLMMessage, LLMResponse, ModelType, ThinkingMode

logger = logging.getLogger(__name__)


class DeepSeekClient:
    """Async wrapper around the OpenAI SDK aimed at DeepSeek base_url.

    Surface:
    - ``call``: single-shot non-streaming chat completion returning ``LLMResponse``.
    - ``call_streaming``: async generator yielding partial chunks for SSE.

    Defensive behavior:
    - Strip ``reasoning_content`` from outbound messages (Phase B Lock 4).
    - Translate ``thinking_mode`` to ``extra_body={"thinking":{"type":"enabled"}}``
      plus ``reasoning_effort``.
    - Capture ``reasoning_content`` from response into ``LLMResponse.reasoning_content``
      for telemetry only (never replayed on next turn).
    - Bill cost via ``estimate_cost_usd``.
    """

    def __init__(self) -> None:
        settings = get_settings()
        self._client = AsyncOpenAI(
            api_key=settings.DEEPSEEK_API_KEY,
            base_url=settings.DEEPSEEK_BASE_URL,
        )
        self._model_flash = settings.DEEPSEEK_MODEL_FLASH
        self._model_pro = settings.DEEPSEEK_MODEL_PRO

    # ------------------------------------------------------------------
    # Public model name properties (LLMGateway uses to switch primary <-> fallback)
    # ------------------------------------------------------------------

    @property
    def model_flash(self) -> str:
        return self._model_flash

    @property
    def model_pro(self) -> str:
        return self._model_pro

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _resolve_model_type(model: str) -> ModelType:
        return "V4-Pro" if "pro" in model.lower() else "V4-Flash"

    @staticmethod
    def _scrub_messages(messages: list[LLMMessage]) -> list[dict[str, str]]:
        """Rebuild messages list with ONLY ``role`` and ``content`` fields.

        Defense in depth against Lock 4: even if a caller injects a dict-shaped
        ``LLMMessage`` carrying ``reasoning_content`` via Pydantic bypass, this
        rebuild discards everything except the two contract fields.
        """
        scrubbed: list[dict[str, str]] = []
        for m in messages:
            scrubbed.append({"role": m.role, "content": m.content})
        return scrubbed

    @staticmethod
    def _build_thinking_kwargs(thinking_mode: ThinkingMode) -> dict[str, Any]:
        """Translate ``ThinkingMode`` to DeepSeek SDK kwargs."""
        if thinking_mode == "disabled":
            return {"extra_body": {}}
        # DeepSeek API accepts ``reasoning_effort`` as a top-level field plus
        # ``thinking.type=enabled`` in ``extra_body`` per Phase B docs.
        return {
            "reasoning_effort": thinking_mode,
            "extra_body": {"thinking": {"type": "enabled"}},
        }

    @staticmethod
    def _extract_reasoning(msg: Any) -> str | None:
        """Pull ``reasoning_content`` from response message if present."""
        return getattr(msg, "reasoning_content", None)

    # ------------------------------------------------------------------
    # Single-shot call
    # ------------------------------------------------------------------

    async def call(
        self,
        *,
        messages: list[LLMMessage],
        model: str | None = None,
        prefer_pro: bool = False,
        thinking_mode: ThinkingMode = "disabled",
        max_tokens: int = 2048,
        temperature: float = 0.7,
        timeout: float = 30.0,
        worker: str = "triton",
        simulation_id: str | None = None,
        resident_id: str | None = None,
    ) -> LLMResponse:
        """Single-shot LLM call.

        Accepts both an explicit ``model`` string and a ``prefer_pro`` shortcut
        (which resolves to ``model_pro`` or ``model_flash``). This dual
        interface mirrors Pandora's ``LLMClientProtocol.call`` signature so the
        Cycle 2 swap is transparent for Pandora's call sites.
        """
        start = time.perf_counter()
        resolved_model = model or (self._model_pro if prefer_pro else self._model_flash)
        scrubbed = self._scrub_messages(messages)

        kwargs: dict[str, Any] = {
            "model": resolved_model,
            "messages": scrubbed,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "stream": False,
            "timeout": timeout,
        }
        kwargs.update(self._build_thinking_kwargs(thinking_mode))

        response = await self._client.chat.completions.create(**kwargs)

        choice = response.choices[0]
        msg = choice.message
        reasoning = self._extract_reasoning(msg)

        usage = getattr(response, "usage", None)
        prompt_tokens = int(getattr(usage, "prompt_tokens", 0) or 0)
        completion_tokens = int(getattr(usage, "completion_tokens", 0) or 0)

        model_used = self._resolve_model_type(resolved_model)
        cost = estimate_cost_usd(prompt_tokens, completion_tokens, model_used)
        latency_ms = int((time.perf_counter() - start) * 1000)
        call_id = getattr(response, "id", None) or f"triton-{uuid.uuid4().hex[:12]}"

        # Log resident_id + simulation_id for downstream cost aggregation when
        # the buffer + Demeter persist consume. We do not include them in the
        # response payload to keep the Pandora protocol shape stable.
        if simulation_id or resident_id:
            logger.debug(
                "DeepSeek call worker=%s resident=%s simulation=%s model=%s "
                "tokens_in=%d tokens_out=%d cost_usd=%.6f latency_ms=%d",
                worker, resident_id, simulation_id, resolved_model,
                prompt_tokens, completion_tokens, cost, latency_ms,
            )

        return LLMResponse(
            content=msg.content or "",
            reasoning_content=reasoning,
            model_used=model_used,
            thinking_mode=thinking_mode,
            cache_hit=False,
            canned_hit=False,
            input_tokens=prompt_tokens,
            output_tokens=completion_tokens,
            cost_estimate_usd=cost,
            latency_ms=latency_ms,
            call_id=call_id,
            fallback_chain=["primary"],
        )


_singleton: DeepSeekClient | None = None


def get_deepseek_client() -> DeepSeekClient:
    """Singleton accessor used by service layer + endpoints."""
    global _singleton
    if _singleton is None:
        _singleton = DeepSeekClient()
    return _singleton


def reset_deepseek_client() -> None:
    """Reset singleton (test helper)."""
    global _singleton
    _singleton = None


__all__ = [
    "DeepSeekClient",
    "get_deepseek_client",
    "reset_deepseek_client",
]
