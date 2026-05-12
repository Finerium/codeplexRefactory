"""DeepSeek client unit tests (Triton Wave 3 Cycle 1).

AsyncOpenAI mocked so tests do not hit the live API. The 4 critical guards:
1. ``call`` returns ``LLMResponse`` with the Pandora-compatible shape.
2. Outbound messages array is scrubbed of ``reasoning_content`` (Phase B Lock 4).
3. ``thinking_mode != disabled`` passes ``reasoning_effort`` + ``extra_body``.
4. ``thinking_mode == disabled`` omits ``reasoning_effort``.

Run locally:
    cd backend
    python -m pytest tests/test_triton_deepseek_client.py -v

Compliance: Lock 1 (no em dash). Lock 2 (no emoji). Lock 4 (Phase B critical).
"""

from __future__ import annotations

import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.llm.client import DeepSeekClient, reset_deepseek_client
from app.llm.types import LLMMessage


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _build_fake_response(content: str = "stub content") -> MagicMock:
    """Build a fake ChatCompletion-shaped response."""
    choice = MagicMock()
    choice.message.content = content
    choice.message.reasoning_content = "internal thought"
    choice.finish_reason = "stop"

    usage = MagicMock()
    usage.prompt_tokens = 120
    usage.completion_tokens = 64

    response = MagicMock()
    response.choices = [choice]
    response.usage = usage
    response.id = "chatcmpl-stub-123"
    return response


@pytest.fixture(autouse=True)
def _reset_singleton() -> None:
    """Reset DeepSeekClient singleton between tests."""
    reset_deepseek_client()


@pytest.fixture
def mock_async_openai() -> MagicMock:
    """Patch AsyncOpenAI so DeepSeekClient.__init__ uses the mock."""
    client = MagicMock()
    client.chat.completions.create = AsyncMock(return_value=_build_fake_response())
    return client


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_call_returns_llm_response_with_cost(mock_async_openai: MagicMock) -> None:
    """Basic call returns LLMResponse with cost + tokens populated."""
    with patch("app.llm.client.AsyncOpenAI", return_value=mock_async_openai):
        client = DeepSeekClient()
        resp = await client.call(
            messages=[LLMMessage(role="user", content="hi")],
            prefer_pro=False,
            thinking_mode="disabled",
        )
    assert resp.content == "stub content"
    assert resp.reasoning_content == "internal thought"
    assert resp.model_used == "V4-Flash"
    assert resp.input_tokens == 120
    assert resp.output_tokens == 64
    assert resp.cost_estimate_usd > 0
    assert resp.fallback_chain == ["primary"]
    assert resp.call_id == "chatcmpl-stub-123"


@pytest.mark.asyncio
async def test_call_strips_reasoning_content_from_outgoing_messages(
    mock_async_openai: MagicMock,
) -> None:
    """CRITICAL Phase B Lock 4: outbound messages must NEVER contain reasoning_content.

    Even if Pydantic ``extra=forbid`` is bypassed somehow (for example via dict
    construction), the client wrapper rebuilds dicts from scratch using only
    ``role`` and ``content``.
    """
    with patch("app.llm.client.AsyncOpenAI", return_value=mock_async_openai):
        client = DeepSeekClient()
        await client.call(
            messages=[
                LLMMessage(role="user", content="turn 1"),
                LLMMessage(role="assistant", content="answer 1"),
                LLMMessage(role="user", content="turn 2"),
            ],
            prefer_pro=False,
            thinking_mode="disabled",
        )
    call_kwargs = mock_async_openai.chat.completions.create.call_args.kwargs
    sent_messages = call_kwargs["messages"]
    for msg in sent_messages:
        assert "reasoning_content" not in msg, (
            "Lock 4 violation: reasoning_content leaked into outgoing messages array"
        )
        # Only role + content fields permitted on the wire.
        assert set(msg.keys()) == {"role", "content"}


@pytest.mark.asyncio
async def test_call_passes_thinking_extra_body_when_enabled(
    mock_async_openai: MagicMock,
) -> None:
    """thinking_mode != disabled passes extra_body thinking + reasoning_effort."""
    with patch("app.llm.client.AsyncOpenAI", return_value=mock_async_openai):
        client = DeepSeekClient()
        await client.call(
            messages=[LLMMessage(role="user", content="hi")],
            prefer_pro=True,
            thinking_mode="high",
        )
    call_kwargs = mock_async_openai.chat.completions.create.call_args.kwargs
    assert call_kwargs.get("reasoning_effort") == "high"
    extra = call_kwargs.get("extra_body", {})
    assert extra.get("thinking", {}).get("type") == "enabled"


@pytest.mark.asyncio
async def test_call_omits_reasoning_effort_when_disabled(
    mock_async_openai: MagicMock,
) -> None:
    """thinking_mode == disabled MUST NOT pass reasoning_effort."""
    with patch("app.llm.client.AsyncOpenAI", return_value=mock_async_openai):
        client = DeepSeekClient()
        await client.call(
            messages=[LLMMessage(role="user", content="hi")],
            prefer_pro=False,
            thinking_mode="disabled",
        )
    call_kwargs = mock_async_openai.chat.completions.create.call_args.kwargs
    assert "reasoning_effort" not in call_kwargs


@pytest.mark.asyncio
async def test_call_prefer_pro_routes_to_pro_model(
    mock_async_openai: MagicMock,
) -> None:
    """prefer_pro=True picks model_pro; resp.model_used reflects V4-Pro."""
    with patch("app.llm.client.AsyncOpenAI", return_value=mock_async_openai):
        client = DeepSeekClient()
        resp = await client.call(
            messages=[LLMMessage(role="user", content="hi")],
            prefer_pro=True,
            thinking_mode="high",
        )
    call_kwargs = mock_async_openai.chat.completions.create.call_args.kwargs
    assert "pro" in call_kwargs["model"].lower()
    assert resp.model_used == "V4-Pro"


@pytest.mark.asyncio
async def test_call_explicit_model_override(
    mock_async_openai: MagicMock,
) -> None:
    """When ``model`` kwarg supplied, it overrides prefer_pro shortcut."""
    with patch("app.llm.client.AsyncOpenAI", return_value=mock_async_openai):
        client = DeepSeekClient()
        await client.call(
            messages=[LLMMessage(role="user", content="hi")],
            model="deepseek-v4-flash",
            prefer_pro=True,
            thinking_mode="disabled",
        )
    call_kwargs = mock_async_openai.chat.completions.create.call_args.kwargs
    assert call_kwargs["model"] == "deepseek-v4-flash"
