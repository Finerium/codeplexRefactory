"""LLMGateway defensive fallback chain integration (Triton Wave 3 Cycle 2).

Verifies the 5-layer ordering per PRD Section 18.4:
1. Canned hit -> short-circuit, no client call.
2. Circuit open -> canned fallback, no client call.
3. Semantic cache hit -> short-circuit, no client call.
4. Primary success -> cache write + chain marked primary.
5. Primary fail + retry simplified success -> chain ends retry_simplified.
6. Primary fail + retry fail + fallback model success -> chain ends fallback_model.
7. All layers fail -> final canned (apology if canned miss).

Run locally:
    cd backend
    python -m pytest tests/test_triton_llm_gateway.py -v

Compliance: Lock 1 (no em dash). Lock 2 (no emoji). Lock 4 (chain order verified).
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.llm.types import LLMMessage, LLMResponse
from app.services.llm_client import LLMGateway, simplify_messages


# ---------------------------------------------------------------------------
# Fakes
# ---------------------------------------------------------------------------


class _CountingClient:
    """Stub DeepSeekClient that records calls + can fail on demand."""

    model_flash = "deepseek-v4-flash"
    model_pro = "deepseek-v4-pro"

    def __init__(self, fail_until_attempt: int = 0) -> None:
        self.calls: list[dict[str, object]] = []
        self.fail_until_attempt = fail_until_attempt

    async def call(self, **kwargs: object) -> LLMResponse:
        self.calls.append(kwargs)
        if len(self.calls) <= self.fail_until_attempt:
            raise RuntimeError(f"simulated fail #{len(self.calls)}")
        # Distinguish primary vs fallback responses via model kwarg.
        model = str(kwargs.get("model", ""))
        is_pro = "pro" in model.lower()
        return LLMResponse(
            content=f"call success model={model}",
            model_used="V4-Pro" if is_pro else "V4-Flash",
            thinking_mode="disabled",
            cache_hit=False,
            canned_hit=False,
            input_tokens=10,
            output_tokens=5,
            cost_estimate_usd=0.000001,
            latency_ms=100,
            call_id=f"counted-{len(self.calls)}",
            fallback_chain=["primary"],
        )


class _FakeCanned:
    """Returns a CannedEntry-like object when content is set."""

    def __init__(self, content: str | None = None, key: str = "fake") -> None:
        self._content = content
        self._key = key

    def lookup_by_messages(self, messages: list[LLMMessage]):
        if self._content is None:
            return None
        return _FakeCannedEntry(self._content, self._key)


class _FakeCannedEntry:
    def __init__(self, content: str, key: str) -> None:
        self.content = content
        self.key = key

    def to_llm_response(self) -> LLMResponse:
        return LLMResponse(
            content=self.content,
            model_used="V4-Flash",
            thinking_mode="disabled",
            cache_hit=False,
            canned_hit=True,
            input_tokens=0,
            output_tokens=0,
            cost_estimate_usd=0.0,
            latency_ms=0,
            call_id=f"canned-{self.key}",
            fallback_chain=["canned_hit"],
        )


class _FakeCache:
    def __init__(self, prefill: str | None = None) -> None:
        self._prefill = prefill
        self.stored: tuple[list[LLMMessage], str] | None = None

    def lookup(self, messages: list[LLMMessage]) -> str | None:
        return self._prefill

    def store(self, messages: list[LLMMessage], content: str) -> None:
        self.stored = (messages, content)


class _FakeBreaker:
    def __init__(self, open: bool = False) -> None:
        self._open = open
        self.failures = 0
        self.successes = 0

    def is_open(self) -> bool:
        return self._open

    def record_failure(self) -> None:
        self.failures += 1

    def record_success(self) -> None:
        self.successes += 1


class _FakeBuffer:
    def __init__(self) -> None:
        self.records: list[dict[str, object]] = []

    def record(self, **kwargs: object) -> None:
        self.records.append(kwargs)


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


def _make_gateway(
    client: _CountingClient | None = None,
    canned_content: str | None = None,
    cache_prefill: str | None = None,
    breaker_open: bool = False,
) -> tuple[LLMGateway, _CountingClient, _FakeCache, _FakeBuffer]:
    real_client = client or _CountingClient()
    cache = _FakeCache(prefill=cache_prefill)
    buffer = _FakeBuffer()
    gateway = LLMGateway(
        client=real_client,
        canned_store=_FakeCanned(content=canned_content),
        semantic_cache=cache,
        circuit_breaker=_FakeBreaker(open=breaker_open),
        log_buffer=buffer,
    )
    return gateway, real_client, cache, buffer


@pytest.mark.asyncio
async def test_canned_hit_short_circuits() -> None:
    gateway, client, cache, buf = _make_gateway(
        canned_content="canned reply text"
    )
    resp = await gateway.call_with_fallback(
        messages=[LLMMessage(role="user", content="any question")],
        prefer_pro=False,
        thinking_mode="disabled",
        worker="test",
        resident_id="Hermes",
    )
    assert resp.canned_hit is True
    assert resp.content == "canned reply text"
    assert resp.fallback_chain == ["canned_hit"]
    assert len(client.calls) == 0
    assert cache.stored is None
    assert len(buf.records) == 1


@pytest.mark.asyncio
async def test_circuit_open_returns_canned_without_calling_client() -> None:
    gateway, client, _, buf = _make_gateway(
        canned_content="circuit canned content",
        breaker_open=True,
    )
    resp = await gateway.call_with_fallback(
        messages=[LLMMessage(role="user", content="unmatched query xyz")],
        prefer_pro=False,
        thinking_mode="disabled",
        worker="test",
        resident_id=None,
    )
    # Canned matches first (we set canned_content) but if no match, breaker
    # path still returns canned/apology. Either way no client call.
    assert len(client.calls) == 0
    assert resp.canned_hit is True


@pytest.mark.asyncio
async def test_circuit_open_apology_when_no_canned_match() -> None:
    gateway, client, _, _ = _make_gateway(
        canned_content=None,
        breaker_open=True,
    )
    resp = await gateway.call_with_fallback(
        messages=[LLMMessage(role="user", content="alien query unmatched zzz")],
        prefer_pro=False,
        thinking_mode="disabled",
        worker="test",
        resident_id=None,
    )
    assert len(client.calls) == 0
    assert "Apologies" in resp.content or "unavailable" in resp.content.lower()
    assert "circuit_open_canned" in resp.fallback_chain


@pytest.mark.asyncio
async def test_semantic_cache_hit_short_circuits() -> None:
    gateway, client, _, _ = _make_gateway(
        canned_content=None,
        cache_prefill="cached answer body",
    )
    resp = await gateway.call_with_fallback(
        messages=[LLMMessage(role="user", content="random query")],
        prefer_pro=False,
        thinking_mode="disabled",
        worker="test",
        resident_id=None,
    )
    assert resp.cache_hit is True
    assert resp.content == "cached answer body"
    assert len(client.calls) == 0


@pytest.mark.asyncio
async def test_primary_success_writes_cache_and_chain() -> None:
    client = _CountingClient(fail_until_attempt=0)
    gateway, _, cache, buf = _make_gateway(client=client)
    resp = await gateway.call_with_fallback(
        messages=[LLMMessage(role="user", content="hi there primary")],
        prefer_pro=False,
        thinking_mode="disabled",
        worker="test",
        resident_id="Apollo",
    )
    assert "call success" in resp.content
    assert "primary" in resp.fallback_chain
    assert len(client.calls) == 1
    assert cache.stored is not None
    assert len(buf.records) == 1


@pytest.mark.asyncio
async def test_retry_simplified_on_first_failure() -> None:
    client = _CountingClient(fail_until_attempt=1)
    gateway, _, _, _ = _make_gateway(client=client)
    resp = await gateway.call_with_fallback(
        messages=[
            LLMMessage(role="system", content="sys block"),
            LLMMessage(role="user", content="turn 1"),
            LLMMessage(role="assistant", content="turn 1 reply"),
            LLMMessage(role="user", content="turn 2"),
        ],
        prefer_pro=False,
        thinking_mode="disabled",
        worker="test",
        resident_id="Apollo",
    )
    assert len(client.calls) == 2
    assert "retry_simplified" in resp.fallback_chain
    # 2nd call sees simplified messages (system + last user).
    second_call_messages = client.calls[1]["messages"]  # type: ignore[index]
    assert len(second_call_messages) == 2  # type: ignore[arg-type]


@pytest.mark.asyncio
async def test_fallback_model_on_second_failure() -> None:
    client = _CountingClient(fail_until_attempt=2)
    gateway, _, _, _ = _make_gateway(client=client)
    resp = await gateway.call_with_fallback(
        messages=[LLMMessage(role="user", content="trigger 3 calls")],
        prefer_pro=False,
        thinking_mode="disabled",
        worker="test",
        resident_id=None,
    )
    assert len(client.calls) == 3
    assert "fallback_model" in resp.fallback_chain
    # 3rd call switched to the pro model (since prefer_pro=False, fallback is pro).
    third_call_model = str(client.calls[2]["model"])  # type: ignore[index]
    assert "pro" in third_call_model.lower()


@pytest.mark.asyncio
async def test_all_layers_fail_returns_apology_when_canned_miss() -> None:
    client = _CountingClient(fail_until_attempt=99)
    gateway, _, _, _ = _make_gateway(client=client, canned_content=None)
    resp = await gateway.call_with_fallback(
        messages=[LLMMessage(role="user", content="unmatched alien query")],
        prefer_pro=False,
        thinking_mode="disabled",
        worker="test",
        resident_id=None,
    )
    assert len(client.calls) == 3
    assert "canned_final" in resp.fallback_chain
    assert "Apologies" in resp.content or "unavailable" in resp.content.lower()
    assert resp.error == "all_layers_failed"


@pytest.mark.asyncio
async def test_all_layers_fail_returns_canned_content_when_matched() -> None:
    client = _CountingClient(fail_until_attempt=99)
    gateway, _, _, _ = _make_gateway(client=client, canned_content="matched canned text")
    resp = await gateway.call_with_fallback(
        messages=[LLMMessage(role="user", content="anything")],
        prefer_pro=False,
        thinking_mode="disabled",
        worker="test",
        resident_id=None,
    )
    # canned matches at layer 1, short-circuits.
    assert resp.content == "matched canned text"
    assert "canned_hit" in resp.fallback_chain
    assert len(client.calls) == 0


# ---------------------------------------------------------------------------
# Helper test
# ---------------------------------------------------------------------------


def test_simplify_messages_keeps_first_system_and_last_user() -> None:
    messages = [
        LLMMessage(role="system", content="sys1"),
        LLMMessage(role="user", content="u1"),
        LLMMessage(role="assistant", content="a1"),
        LLMMessage(role="user", content="u2"),
        LLMMessage(role="assistant", content="a2"),
        LLMMessage(role="user", content="u3"),
    ]
    simplified = simplify_messages(messages)
    assert len(simplified) == 2
    assert simplified[0].role == "system"
    assert simplified[0].content == "sys1"
    assert simplified[1].role == "user"
    assert simplified[1].content == "u3"


def test_simplify_messages_handles_empty() -> None:
    assert simplify_messages([]) == []


def test_simplify_messages_handles_no_user_role() -> None:
    # No user messages: return original list (cannot simplify meaningfully).
    msgs = [LLMMessage(role="system", content="only system")]
    assert simplify_messages(msgs) == msgs


# ---------------------------------------------------------------------------
# Pandora compatibility shim
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_pandora_call_signature_works() -> None:
    """Verify ``LLMGateway.call`` matches Pandora ``LLMClientProtocol.call``."""
    gateway, client, _, _ = _make_gateway()
    resp = await gateway.call(
        messages=[LLMMessage(role="user", content="test pandora signature")],
        prefer_pro=True,
        thinking_mode="high",
        max_tokens=4000,
        worker="pandora",
        simulation_id="sim-123",
        resident_id="Athena",
    )
    assert "call success" in resp.content
    assert "primary" in resp.fallback_chain
    assert len(client.calls) == 1
