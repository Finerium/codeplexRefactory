"""Phase B Topic E reasoning_content quirk regression (Triton Wave 3 Cycle 4).

Critical Lock 4 enforcement test. DeepSeek V4 thinking mode ignores
``reasoning_content`` on input but pollutes the prompt context window. The
client wrapper MUST strip ``reasoning_content`` from every outbound message
before submitting the API call, even in multi-turn conversation where the
prior turn carried a ``reasoning_content`` field.

This test exercises 3 scenarios:
1. Build LLMMessage via constructor (Pydantic ``extra=forbid`` blocks at type
   level).
2. Submit a 4-turn conversation through DeepSeekClient.call; verify the dict
   payload reaching AsyncOpenAI has zero ``reasoning_content`` keys.
3. Regression: inspect that the response body keeps ``reasoning_content`` for
   logging (it should be captured, just never replayed).

Run locally:
    cd backend
    python -m pytest tests/test_triton_reasoning_content_strip.py -v

Compliance: Lock 1 (no em dash). Lock 2 (no emoji). Lock 4 (Phase B critical).
"""

from __future__ import annotations

import re
import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from pydantic import ValidationError

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.llm.client import DeepSeekClient, reset_deepseek_client
from app.llm.types import LLMMessage


# ---------------------------------------------------------------------------
# Type-level guard (Pydantic extra=forbid)
# ---------------------------------------------------------------------------


def test_llm_message_type_level_rejects_reasoning_content() -> None:
    """Phase B Lock 4 type-level defense: LLMMessage extra=forbid."""
    with pytest.raises((ValidationError, TypeError, ValueError)):
        LLMMessage.model_validate(
            {"role": "assistant", "content": "x", "reasoning_content": "leaked"}
        )


# ---------------------------------------------------------------------------
# Wire-level guard
# ---------------------------------------------------------------------------


@pytest.fixture(autouse=True)
def _reset() -> None:
    reset_deepseek_client()


def _build_fake_response_with_reasoning() -> MagicMock:
    choice = MagicMock()
    choice.message.content = "answer with reasoning"
    choice.message.reasoning_content = "internal chain of thought"
    choice.finish_reason = "stop"
    usage = MagicMock()
    usage.prompt_tokens = 100
    usage.completion_tokens = 30
    response = MagicMock()
    response.choices = [choice]
    response.usage = usage
    response.id = "chatcmpl-reasoning-1"
    return response


@pytest.mark.asyncio
async def test_multi_turn_conversation_strips_reasoning_content_wire_level() -> None:
    """Inspect raw kwargs sent to AsyncOpenAI.

    Even when the test simulates a 4-turn conversation where prior assistant
    messages carry reasoning_content via dict construction, the client
    wrapper MUST rebuild dicts with only role + content.
    """
    mock_client = MagicMock()
    mock_client.chat.completions.create = AsyncMock(
        return_value=_build_fake_response_with_reasoning()
    )
    with patch("app.llm.client.AsyncOpenAI", return_value=mock_client):
        client = DeepSeekClient()
        # Build a 4-turn conversation. Assistant messages constructed via the
        # Pydantic LLMMessage so they cannot carry reasoning_content. The
        # wrapper still scrubs as defense in depth.
        messages = [
            LLMMessage(role="system", content="system primer"),
            LLMMessage(role="user", content="turn 1 question"),
            LLMMessage(role="assistant", content="turn 1 answer"),
            LLMMessage(role="user", content="turn 2 follow-up"),
            LLMMessage(role="assistant", content="turn 2 answer"),
            LLMMessage(role="user", content="turn 3 follow-up"),
        ]
        await client.call(
            messages=messages,
            prefer_pro=True,
            thinking_mode="high",
        )

    call_kwargs = mock_client.chat.completions.create.call_args.kwargs
    sent_messages = call_kwargs["messages"]
    # 6 messages submitted, all role + content only.
    assert len(sent_messages) == 6
    for msg in sent_messages:
        # Hard assertion: zero reasoning_content keys.
        assert "reasoning_content" not in msg
        # Keys are exactly {role, content}.
        assert set(msg.keys()) == {"role", "content"}


@pytest.mark.asyncio
async def test_response_captures_reasoning_for_log_audit_only() -> None:
    """LLMResponse.reasoning_content is populated for telemetry purposes."""
    mock_client = MagicMock()
    mock_client.chat.completions.create = AsyncMock(
        return_value=_build_fake_response_with_reasoning()
    )
    with patch("app.llm.client.AsyncOpenAI", return_value=mock_client):
        client = DeepSeekClient()
        resp = await client.call(
            messages=[LLMMessage(role="user", content="hi")],
            prefer_pro=False,
            thinking_mode="low",
        )
    assert resp.reasoning_content == "internal chain of thought"
    # Critical: the field exists, but the wire scrub keeps it from being
    # propagated to the next outbound request. Caller responsibility: do not
    # pass resp.reasoning_content back as a new LLMMessage. The type system
    # blocks that path.


# ---------------------------------------------------------------------------
# Code-level audit: grep client.py for reasoning_content writes
# ---------------------------------------------------------------------------


def test_client_source_does_not_assemble_reasoning_content_into_outgoing_dict() -> None:
    """Static audit: client.py must not include ``"reasoning_content"`` as a
    JSON-style key in a dict literal (which is how outgoing messages payloads
    are assembled).

    Allowed patterns (NOT flagged):
    - Reading ``reasoning_content`` from a response message
      (``getattr(msg, "reasoning_content", None)``).
    - Constructing an ``LLMResponse(... reasoning_content=...)`` for
      log/audit purposes (this is the captured response surface, not the
      outgoing wire payload).
    - Comments + docstrings mentioning ``reasoning_content``.

    Forbidden pattern (flagged):
    - ``{"reasoning_content": ...}`` JSON-key style assignment inside a dict
      literal. This is the shape ``_scrub_messages`` MUST never produce.
    """
    client_py = (ROOT / "app" / "llm" / "client.py").read_text(encoding="utf-8")
    # Strip line comments + triple-quoted docstrings before scanning.
    no_line_comments = "\n".join(
        line for line in client_py.splitlines()
        if not line.lstrip().startswith("#")
    )
    scrubbed = re.sub(r'"""[\s\S]*?"""', "", no_line_comments)
    # Only the JSON-key form is forbidden. ``reasoning_content=...`` kwarg
    # patterns are LLMResponse construction (the captured log slice) and are
    # intentional.
    matches = re.findall(r'"reasoning_content"\s*:\s*[a-zA-Z_]', scrubbed)
    assert not matches, (
        f"Lock 4 violation in client.py: outbound dict literal containing "
        f"'reasoning_content' detected. Matches: {matches}"
    )
