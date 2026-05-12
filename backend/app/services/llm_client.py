"""High-level LLM gateway (Triton Wave 3 defensive layer).

Owner: Triton (Wave 3).

``LLMGateway.call_with_fallback`` orchestrates the 5 defensive layers per
PRD Section 18.4:
1. Canned response (top-10 demo questions, sub-100ms target).
2. Circuit breaker short-circuit (5 consecutive failures, 60s cooldown).
3. Semantic cache (cosine 0.85 threshold).
4. Primary DeepSeek call (Flash or Pro per ``prefer_pro``).
5. Retry simplified prompt on first failure.
6. Fallback to the other model on second failure.
7. Final canned fallback or generic apology.

The gateway exposes the same ``LLMClientProtocol`` Pandora consumes from its
local stub (``app/services/refactor/llm_stub.py``) so the Cycle 2 swap is a
one-line import change for downstream call sites.

Anti-pattern Lock 4 (Phase B Topic E LOCKED):
``reasoning_content`` stripping is enforced by ``DeepSeekClient._scrub_messages``
on every outbound request. The gateway never reconstructs ``LLMMessage`` with a
``reasoning_content`` field.

Anti-pattern Lock 4 (PRD 18.3 LOCKED routing):
Per-resident model + thinking_mode passed verbatim by callers who consult
``resident_routing.get_resident_routing``. The gateway itself does not pick
the model; it honors the caller's ``prefer_pro`` and ``thinking_mode``.

Anti-pattern Lock 5 honest claim:
Retry simplified prompt is a heuristic truncation (system + last user only).
Documented as ``[HEURISTIC: simplify-retry]`` in observability log.

Compliance:
- Lock 1 (no em dash): clean.
- Lock 2 (no emoji): clean.
- Lock 4 (reasoning_content + routing): enforced via underlying client + caller
  contract.
- Lock 5: heuristic clearly labelled.
- Lock 8: cost tracking via log buffer.
"""

from __future__ import annotations

import logging
from typing import Any, Literal, Optional, Protocol

from app.llm.client import DeepSeekClient
from app.llm.types import (
    FallbackStage,
    LLMMessage,
    LLMResponse,
    ResidentId,
    SimulationTurn,
    ThinkingMode,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helper: simplified prompt (Lock 5 honest heuristic)
# ---------------------------------------------------------------------------


def simplify_messages(messages: list[LLMMessage]) -> list[LLMMessage]:
    """Truncate context: keep first system + last user message only.

    [HEURISTIC: simplify-retry] Used on retry to lower input token cost and
    reduce surface area for any DeepSeek API parser quirks.
    """
    if not messages:
        return messages
    system_msgs = [m for m in messages if m.role == "system"]
    user_msgs = [m for m in messages if m.role == "user"]
    if not user_msgs:
        return messages
    return system_msgs[:1] + user_msgs[-1:]


# ---------------------------------------------------------------------------
# Protocol definitions for injectable dependencies
# ---------------------------------------------------------------------------


class _CannedStoreProto(Protocol):
    def lookup_by_messages(self, messages: list[LLMMessage]) -> Any | None: ...


class _CacheProto(Protocol):
    def lookup(self, messages: list[LLMMessage]) -> str | None: ...
    def store(self, messages: list[LLMMessage], content: str) -> None: ...


class _BreakerProto(Protocol):
    def is_open(self) -> bool: ...
    def record_failure(self) -> None: ...
    def record_success(self) -> None: ...


class _BufferProto(Protocol):
    def record(self, **kwargs: Any) -> Any: ...


class _ClientProto(Protocol):
    model_flash: str
    model_pro: str

    async def call(self, **kwargs: Any) -> LLMResponse: ...


# ---------------------------------------------------------------------------
# Gateway
# ---------------------------------------------------------------------------


class LLMGateway:
    """High-level LLM gateway with the 5-layer defensive fallback chain."""

    def __init__(
        self,
        client: _ClientProto,
        canned_store: _CannedStoreProto,
        semantic_cache: _CacheProto,
        circuit_breaker: _BreakerProto,
        log_buffer: _BufferProto,
    ) -> None:
        self._client = client
        self._canned = canned_store
        self._cache = semantic_cache
        self._breaker = circuit_breaker
        self._log = log_buffer

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def call_with_fallback(
        self,
        *,
        messages: list[LLMMessage],
        prefer_pro: bool = False,
        thinking_mode: ThinkingMode = "disabled",
        max_tokens: int = 2048,
        worker: str = "triton",
        simulation_id: Optional[str] = None,
        resident_id: Optional[str] = None,
    ) -> LLMResponse:
        """Execute the 5-layer defensive fallback chain."""
        chain: list[FallbackStage] = []

        # Layer 1: canned response (sub-100ms target).
        canned_entry = self._canned.lookup_by_messages(messages)
        if canned_entry is not None:
            chain.append("canned_hit")
            resp = self._canned_to_response(canned_entry, chain)
            self._record(resp, worker, resident_id, simulation_id)
            return resp

        # Layer 2: circuit breaker short-circuit.
        if self._breaker.is_open():
            chain.append("circuit_open_canned")
            resp = self._fallback_canned(messages, chain, error="circuit_open")
            self._record(resp, worker, resident_id, simulation_id, error="circuit_open")
            return resp

        # Layer 3: semantic cache.
        cached = self._cache.lookup(messages)
        if cached is not None:
            chain.append("cache_hit")
            resp = LLMResponse(
                content=cached,
                model_used="V4-Pro" if prefer_pro else "V4-Flash",
                thinking_mode=thinking_mode,
                cache_hit=True,
                canned_hit=False,
                input_tokens=0,
                output_tokens=0,
                cost_estimate_usd=0.0,
                latency_ms=0,
                call_id="cache-hit",
                fallback_chain=list(chain),
            )
            self._record(resp, worker, resident_id, simulation_id)
            return resp

        # Layer 4: primary call.
        primary_model = self._client.model_pro if prefer_pro else self._client.model_flash
        fallback_model = self._client.model_flash if prefer_pro else self._client.model_pro

        # Attempt primary.
        try:
            resp = await self._client.call(
                messages=messages,
                model=primary_model,
                thinking_mode=thinking_mode,
                max_tokens=max_tokens,
                worker=worker,
                simulation_id=simulation_id,
                resident_id=resident_id,
            )
            chain.append("primary")
            resp = self._with_chain(resp, chain)
            self._breaker.record_success()
            self._cache.store(messages, resp.content)
            self._record(resp, worker, resident_id, simulation_id)
            return resp
        except Exception as exc:  # noqa: BLE001
            logger.warning(
                "LLM primary failed worker=%s resident=%s err=%s",
                worker, resident_id, exc,
            )
            self._breaker.record_failure()
            chain.append("primary")

        # Layer 5: retry simplified prompt.
        try:
            simplified = simplify_messages(messages)
            resp = await self._client.call(
                messages=simplified,
                model=primary_model,
                thinking_mode="disabled",  # cheaper retry, no thinking budget
                max_tokens=max_tokens // 2 if max_tokens > 1 else max_tokens,
                worker=worker,
                simulation_id=simulation_id,
                resident_id=resident_id,
            )
            chain.append("retry_simplified")
            resp = self._with_chain(resp, chain)
            self._breaker.record_success()
            self._cache.store(messages, resp.content)
            self._record(resp, worker, resident_id, simulation_id)
            return resp
        except Exception as exc:  # noqa: BLE001
            logger.warning(
                "LLM retry simplified failed worker=%s err=%s", worker, exc
            )
            self._breaker.record_failure()
            chain.append("retry_simplified")

        # Layer 6: fallback model.
        try:
            resp = await self._client.call(
                messages=messages,
                model=fallback_model,
                thinking_mode="low" if prefer_pro else "disabled",
                max_tokens=max_tokens,
                worker=worker,
                simulation_id=simulation_id,
                resident_id=resident_id,
            )
            chain.append("fallback_model")
            resp = self._with_chain(resp, chain)
            self._breaker.record_success()
            self._cache.store(messages, resp.content)
            self._record(resp, worker, resident_id, simulation_id)
            return resp
        except Exception as exc:  # noqa: BLE001
            logger.warning(
                "LLM fallback model failed worker=%s err=%s", worker, exc
            )
            self._breaker.record_failure()
            chain.append("fallback_model")

        # Layer 7: final canned (or apology if no canned match).
        chain.append("canned_final")
        resp = self._fallback_canned(messages, chain, error="all_layers_failed")
        self._record(
            resp, worker, resident_id, simulation_id, error="all_layers_failed"
        )
        return resp

    # ------------------------------------------------------------------
    # Pandora LLMClientProtocol compatibility
    # ------------------------------------------------------------------

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
    ) -> LLMResponse:
        """Compatibility shim: matches Pandora ``LLMClientProtocol.call``.

        Delegates to ``call_with_fallback`` so downstream call sites that hold
        a reference to the Pandora stub interface keep working after the Cycle
        2 import swap.
        """
        return await self.call_with_fallback(
            messages=messages,
            prefer_pro=prefer_pro,
            thinking_mode=thinking_mode,
            max_tokens=max_tokens,
            worker=worker,
            simulation_id=simulation_id,
            resident_id=resident_id,
        )

    # ------------------------------------------------------------------
    # Internals
    # ------------------------------------------------------------------

    def _fallback_canned(
        self,
        messages: list[LLMMessage],
        chain: list[FallbackStage],
        *,
        error: str | None = None,
    ) -> LLMResponse:
        canned = self._canned.lookup_by_messages(messages)
        if canned is not None:
            base = self._canned_to_response(canned, chain)
            return base.model_copy(update={"error": error})
        # Apology when canned also misses.
        return LLMResponse(
            content=(
                "Apologies, our residents are momentarily unavailable. "
                "Please try again in a moment, or rephrase your request."
            ),
            model_used="V4-Flash",
            thinking_mode="disabled",
            cache_hit=False,
            canned_hit=True,
            input_tokens=0,
            output_tokens=0,
            cost_estimate_usd=0.0,
            latency_ms=0,
            call_id="canned-apology",
            fallback_chain=list(chain),
            error=error or "no_canned_match",
        )

    @staticmethod
    def _canned_to_response(
        canned_entry: Any, chain: list[FallbackStage]
    ) -> LLMResponse:
        """Convert a canned entry (CannedEntry, or object with to_llm_response,
        or anything carrying ``content`` plus ``key``) into an LLMResponse.

        Supports two shapes for forward-compat with future canned providers.
        """
        # Preferred: dedicated method.
        if hasattr(canned_entry, "to_llm_response") and callable(
            canned_entry.to_llm_response
        ):
            base = canned_entry.to_llm_response()
            return base.model_copy(update={"fallback_chain": list(chain)})
        # Legacy CannedEntry: content + key fields.
        content = getattr(canned_entry, "content", "")
        key = getattr(canned_entry, "key", "canned")
        return LLMResponse(
            content=content,
            model_used="V4-Flash",
            thinking_mode="disabled",
            cache_hit=False,
            canned_hit=True,
            input_tokens=0,
            output_tokens=0,
            cost_estimate_usd=0.0,
            latency_ms=0,
            call_id=f"canned-{key}",
            fallback_chain=list(chain),
        )

    @staticmethod
    def _with_chain(resp: LLMResponse, chain: list[FallbackStage]) -> LLMResponse:
        return resp.model_copy(update={"fallback_chain": list(chain)})

    def _record(
        self,
        resp: LLMResponse,
        worker: str,
        resident_id: Optional[str],
        simulation_id: Optional[str],
        error: str | None = None,
    ) -> None:
        try:
            self._log.record(
                worker=worker,
                resident_or_turn=resident_id,
                response=resp,
                simulation_id=simulation_id,
                error=error or resp.error,
            )
        except Exception as exc:  # noqa: BLE001
            logger.warning("log buffer record failed err=%s", exc)


# ---------------------------------------------------------------------------
# Singleton wiring
# ---------------------------------------------------------------------------


_singleton: LLMGateway | None = None


def get_llm_gateway() -> LLMGateway:
    """Production singleton wired with real dependencies."""
    global _singleton
    if _singleton is None:
        from app.services.canned_responses import get_canned_response_store
        from app.services.circuit_breaker import get_circuit_breaker
        from app.services.llm_call_log_buffer import get_llm_call_log_buffer
        from app.services.semantic_cache import get_semantic_cache

        _singleton = LLMGateway(
            client=DeepSeekClient(),
            canned_store=get_canned_response_store(),
            semantic_cache=get_semantic_cache(),
            circuit_breaker=get_circuit_breaker(),
            log_buffer=get_llm_call_log_buffer(),
        )
    return _singleton


def reset_llm_gateway() -> None:
    """Test helper to drop the singleton."""
    global _singleton
    _singleton = None


# Pandora LLMClientProtocol compatibility alias.
def get_llm_client() -> LLMGateway:
    """Alias matching Pandora ``app/services/refactor/llm_stub.get_llm_client``.

    Cycle 2 swap: Pandora updates its import to
    ``from app.services.llm_client import get_llm_client``.
    """
    return get_llm_gateway()


__all__ = [
    "LLMGateway",
    "get_llm_client",
    "get_llm_gateway",
    "reset_llm_gateway",
    "simplify_messages",
]
