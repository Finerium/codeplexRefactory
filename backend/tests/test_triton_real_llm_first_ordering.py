"""Real-LLM-first ordering smoke (Wave-Fixing #2 cycle 1).

Owner: Triton (Wave-Fixing #2 cycle 1, STAMP 20260513-0312).

Manager rescue spec explicit: "canned fallback HANYA aktif kalau real LLM
fail (circuit break OR error), BUKAN default path." Prior Wave 3 gateway
ordering used canned as Layer 1, which silently intercepted every demo
keyword query (``give me a 30-second tour``, ``add 2fa``, etc.) and starved
the real DeepSeek dispatch. Production verdict from Manager curl:
``/api/llm/health calls_recorded:0`` for both initial deploy and redeploy.

This test asserts the new ordering DOES NOT short-circuit demo-keyword
queries at the canned layer. The 10 canned keyword phrases must each route
through the primary client when the breaker is closed + the cache is cold.

Compliance:
- Lock 1 (no em dash): clean.
- Lock 2 (no emoji): clean.
- Lock 4 (PRD Section 18.3 routing): unchanged.
- Lock 5 (honest claim): real-LLM-first ordering documented in module
  docstring + decision log entry.
"""

from __future__ import annotations

import sys
from dataclasses import dataclass, field
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.llm.types import LLMMessage, LLMResponse  # noqa: E402
from app.services.canned_responses import CANNED_ENTRIES, CannedResponseStore  # noqa: E402
from app.services.llm_client import LLMGateway  # noqa: E402


@dataclass
class _SpyClient:
    """Test double that records every call without making a network request."""

    model_flash: str = "deepseek-v4-flash"
    model_pro: str = "deepseek-v4-pro"
    calls: list[dict] = field(default_factory=list)

    async def call(self, **kwargs) -> LLMResponse:
        self.calls.append(kwargs)
        return LLMResponse(
            content=f"primary success for model={kwargs.get('model')}",
            model_used="V4-Pro" if "pro" in (kwargs.get("model") or "").lower()
            else "V4-Flash",
            thinking_mode=kwargs.get("thinking_mode", "disabled"),
            cache_hit=False,
            canned_hit=False,
            input_tokens=30,
            output_tokens=20,
            cost_estimate_usd=0.0001,
            latency_ms=120,
            call_id="spy-call",
            fallback_chain=["primary"],
        )


class _NopCache:
    def __init__(self) -> None:
        self.stored: list[tuple[list[LLMMessage], str]] = []

    def lookup(self, messages: list[LLMMessage]) -> str | None:
        return None

    def store(self, messages: list[LLMMessage], content: str) -> None:
        self.stored.append((messages, content))


class _ClosedBreaker:
    def is_open(self) -> bool:
        return False

    def record_failure(self) -> None:
        return None

    def record_success(self) -> None:
        return None


class _NopBuffer:
    def __init__(self) -> None:
        self.records: list[dict] = []

    def record(self, **kwargs) -> None:
        self.records.append(kwargs)


def _build_gateway() -> tuple[LLMGateway, _SpyClient]:
    client = _SpyClient()
    gateway = LLMGateway(
        client=client,
        canned_store=CannedResponseStore(),  # all 10 canned entries loaded
        semantic_cache=_NopCache(),
        circuit_breaker=_ClosedBreaker(),
        log_buffer=_NopBuffer(),
    )
    return gateway, client


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "canned_keyword",
    [
        "Give me a 30-second tour please",
        "Show me last 24h activity",
        "What is wrong with this codebase?",
        "Please add 2FA to login flow",
        "I want a tour for sprint goal",
        "Convert this finding to backlog ticket",
        "Why is auth/oauth.ts cracked?",
        "Run simulation for 2FA proposal",
        "Show me velocity for sprint 14",
        "What is the contributor heatmap for payment district?",
    ],
)
async def test_demo_keyword_query_reaches_primary_not_canned(
    canned_keyword: str,
) -> None:
    """A query matching a top-10 canned keyword must reach the primary LLM
    client when the breaker is closed + cache is cold. The canned layer is
    now the FINAL fallback, not the first intercept.

    Pre-Wave-Fixing #2 ordering would short-circuit at Layer 1 (canned) and
    return canned content with `fallback_chain == ["canned_hit"]`. New
    ordering should always reach the primary client.
    """
    gateway, client = _build_gateway()
    resp = await gateway.call_with_fallback(
        messages=[LLMMessage(role="user", content=canned_keyword)],
        prefer_pro=False,
        thinking_mode="disabled",
        worker="real-llm-first-test",
        resident_id="Hermes",
    )
    # Critical: primary was actually invoked.
    assert len(client.calls) == 1, (
        f"Expected primary client invoked, instead canned intercepted query "
        f"{canned_keyword!r} fallback_chain={resp.fallback_chain}"
    )
    # Critical: response is the primary's content, not the canned content.
    assert resp.canned_hit is False
    assert resp.fallback_chain == ["primary"]
    assert "primary success" in resp.content


@pytest.mark.asyncio
async def test_canned_still_serves_when_all_layers_fail() -> None:
    """Final-fallback path: canned content surfaces when primary + retry +
    fallback model all fail.

    This preserves the defensive-layer safety net while keeping canned out of
    the happy path. Use a client that always raises so the chain falls
    through to canned_final.
    """

    @dataclass
    class _FailClient:
        model_flash: str = "deepseek-v4-flash"
        model_pro: str = "deepseek-v4-pro"
        calls: list[dict] = field(default_factory=list)

        async def call(self, **kwargs):  # type: ignore[no-untyped-def]
            self.calls.append(kwargs)
            raise RuntimeError("simulated dispatch failure")

    client = _FailClient()
    gateway = LLMGateway(
        client=client,
        canned_store=CannedResponseStore(),
        semantic_cache=_NopCache(),
        circuit_breaker=_ClosedBreaker(),
        log_buffer=_NopBuffer(),
    )
    resp = await gateway.call_with_fallback(
        messages=[LLMMessage(role="user", content="Give me a 30-second tour")],
        prefer_pro=False,
        thinking_mode="disabled",
        worker="final-fallback-test",
        resident_id="Hermes",
    )
    # 3 client failures attempted (primary + retry + fallback_model).
    assert len(client.calls) == 3
    # Canned final caught the failure and served Hermes generic tour content.
    assert resp.canned_hit is True
    assert "canned_final" in resp.fallback_chain
    assert resp.error == "all_layers_failed"
    # The canned content body for the 30-second tour keyword.
    expected = next(
        e.content for e in CANNED_ENTRIES if e.key == "hermes-tour-generic"
    )
    assert resp.content == expected
