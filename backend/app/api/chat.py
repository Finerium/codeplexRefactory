"""Chat endpoint SSE streaming for Persephone consume (Triton Wave 3).

Owner: Triton (Wave 3).

Per contract ``_meta/contracts/persephone-to-triton.md`` lines 95-166.
TitleCase resident names (Athena, Apollo, Argus, Clio, Hermes) match
Persephone ``frontend/src/lib/chat/types.ts``.

SSE wire format consumed by Persephone:
- ``event: chunk\ndata: <json>\n\n`` per partial body chunk.
- ``event: done\ndata: <json metadata>\n\n`` per completion.

Cycle 3 streaming strategy: run a single non-streaming LLM call via the
gateway, then chunk the response text into 80-character SSE windows. This
keeps the wire protocol faithful to Persephone's consumer without coupling
to OpenAI SDK streaming context for cycle 3. Cycle 4 may upgrade to native
``client.chat.completions.stream`` once the gateway's defensive chain is
proven stable.

Compliance:
- Lock 1 (no em dash): clean.
- Lock 2 (no emoji): clean.
- Lock 4 (PRD 18.3 LOCKED): per-resident routing via ``RESIDENT_ROUTING``.
- Lock 4 (Phase B reasoning_content): enforced by underlying gateway client.
"""

from __future__ import annotations

import asyncio
import json
import logging
import re
from typing import AsyncGenerator, Literal

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.config import get_settings
from app.llm.resident_routing import RESIDENT_ROUTING, get_resident_routing
from app.llm.system_header import build_resident_system_prompt
from app.llm.types import LLMMessage, LLMResponse, ResidentId, UiModelLabel
from app.services.auth_session import require_session
from app.services.llm_client import get_llm_gateway

router = APIRouter(prefix="/chat", tags=["chat"])
logger = logging.getLogger(__name__)


# ----------------------------------------------------------------------------
# Internal debug-leak hygiene (Wave-Fixing cycle 1, C-9 HIGH)
# ----------------------------------------------------------------------------
#
# Two internal-state strings have shown up in production chat bubbles during
# QA round day 2 (`_meta/qa_screenshots/Screenshot3Hafiz.jpg`):
#
#   1. ``_Pesan asli: "<user message echo>"_`` italic line appended to the
#      resident body. Source: Wave 2 mock generator
#      ``frontend/src/lib/chat/mockResidentResponses.ts``.
#   2. ``cache hit`` pill badge in the message metadata footer. Source:
#      ``ChatMessageMetadata.cacheHit`` boolean toggled by both the Wave 2 mock
#      (``req.message.length < 40`` heuristic) and the real Triton gateway
#      (``resp.cache_hit or resp.canned_hit``).
#
# Backend hardening (this file):
#   * ``_PESAN_ASLI_PATTERN`` regex strips the leaked italic line from any LLM
#     content path defense-in-depth (canned + cache + primary) so even if a
#     future template or system prompt leak surfaces it, production stays
#     clean.
#   * ``_should_expose_cache_hit`` gates the metadata ``cacheHit`` field by
#     ``settings.is_production``. Development + staging still see the signal
#     for QA introspection; production wire-strips the field entirely so the
#     frontend has nothing to badge.
#
# Frontend mock leak (out-of-scope strict, Persephone owns ``mockResidentResponses.ts``
# + ``MessageList.tsx``) is addressed in this cycle as well; see
# ``_meta/handoff_log/triton_wave_fixing_cycle1_<STAMP>.md`` for the
# cross-scope rationale + ferry note.
_PESAN_ASLI_PATTERN = re.compile(
    r"\n*_Pesan asli:\s*\"[^\"]*\"_\s*$",
    re.IGNORECASE | re.MULTILINE,
)


# Lock 2 (no emoji) belt-and-suspenders strip applied to every LLM body before
# SSE chunking. The 5 resident persona prompts already include an explicit
# OUTPUT CONTRACT instructing the model to avoid emoji (see
# ``app/llm/system_header.py::_OUTPUT_CONTRACT``). This regex is the defense-
# in-depth net for cases where the model ignores the instruction (observed in
# round 2 QA: Hermes greeting occasionally included a wave hand emoji).
#
# Wave-Fixing 3 Manager FINAL (Triton, STAMP 20260513-0626).
#
# Range coverage: emoticons, pictographs, transport, symbols, dingbats,
# enclosed alphanumerics, regional indicators, plus zero-width joiner used
# in compound emoji + variation selectors that retain the emoji-style
# rendering. The strip runs AFTER ``_PESAN_ASLI_PATTERN`` so any trailing
# whitespace from removed leaks does not leave a dangling space.
_EMOJI_PATTERN = re.compile(
    "["
    "\U0001F300-\U0001F9FF"  # symbols, pictographs, supplemental
    "\U0001F600-\U0001F64F"  # emoticons
    "\U0001F680-\U0001F6FF"  # transport + map
    "\U0001F700-\U0001F77F"  # alchemical
    "\U0001F780-\U0001F7FF"  # geometric extended
    "\U0001F800-\U0001F8FF"  # supplemental arrows
    "\U0001F900-\U0001F9FF"  # supplemental symbols + pictographs
    "\U0001FA00-\U0001FAFF"  # extended-A pictographs
    "⌀-⏿"          # miscellaneous technical (watch, clock)
    "①-⓿"          # enclosed alphanumerics
    "■-◿"          # geometric shapes
    "☀-⛿"          # miscellaneous symbols (sun, sparkle, etc.)
    "✀-➿"          # dingbats (sparkle, star, etc.)
    "⬀-⯿"          # miscellaneous symbols + arrows (star U+2B50)
    "〰"                 # wavy dash
    "〽"                 # part alternation mark
    "㊗"                 # circled ideograph congratulation
    "㊙"                 # circled ideograph secret
    "‍"                 # zero-width joiner used in compound emoji
    "️"                 # variation selector 16 (emoji-style)
    "]+",
    flags=re.UNICODE,
)


def _sanitize_content(content: str) -> str:
    """Strip internal debug leaks plus emoji from LLM response body.

    Defense-in-depth layering:
        1. Remove the ``_Pesan asli: "..."_`` trailing italic mock leak
           (Wave 2 Persephone heuristic).
        2. Remove any emoji pictograph (Lock 2 enforcement against model
           defying the OUTPUT CONTRACT in the resident persona prompt).

    Idempotent + safe on already-clean strings. Whitespace from removed
    emoji is collapsed so a "Halo, [emoji] selamat datang" output becomes
    "Halo, selamat datang" without double spaces.
    """
    if not content:
        return content
    out = _PESAN_ASLI_PATTERN.sub("", content)
    out = _EMOJI_PATTERN.sub("", out)
    # Collapse double spaces that the emoji strip can introduce.
    out = re.sub(r"  +", " ", out)
    # Strip leading whitespace on each line so "  Halo" -> "Halo" after the
    # emoji on the same line is removed.
    return out.rstrip()


def _should_expose_cache_hit() -> bool:
    """Production strips the internal cache-hit telemetry flag from the SSE
    metadata envelope so the frontend has no signal to render a badge.

    Development + staging retain the flag for QA introspection.
    """
    return not get_settings().is_production


# ----------------------------------------------------------------------------
# Request / response schemas matching Persephone contract
# ----------------------------------------------------------------------------


CurrentMode = Literal[
    "onboarding", "sprint", "refactor", "activity", "health", "dashboard"
]


class ChatContextModel(BaseModel):
    """Mode context attached to a chat request.

    ``mode_context`` is an opaque dict whose schema is the per-mode consumer's
    responsibility. Triton serializes it verbatim into the user message.
    """

    current_mode: CurrentMode
    selected_building_id: str | None = None
    mode_context: dict = Field(default_factory=dict)


class ChatRequestModel(BaseModel):
    """POST /api/chat request body per Persephone contract."""

    thread_id: str
    target: Literal["Athena", "Apollo", "Argus", "Clio", "Hermes", "broadcast"]
    message: str
    context: ChatContextModel


# ----------------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------------


def _build_messages(req: ChatRequestModel, resident: ResidentId) -> list[LLMMessage]:
    """Compose system + user message list for a resident chat call."""
    system = build_resident_system_prompt(resident)
    context_blob = json.dumps(
        {
            "current_mode": req.context.current_mode,
            "selected_building_id": req.context.selected_building_id,
            "mode_context": req.context.mode_context,
        },
        ensure_ascii=False,
    )
    user_body = (
        f"Context (JSON):\n{context_blob}\n\n"
        f"User message:\n{req.message}\n\n"
        "Respond in your persona voice. Indonesian primary plus English "
        "technical code-switch when natural."
    )
    return [
        LLMMessage(role="system", content=system),
        LLMMessage(role="user", content=user_body),
    ]


async def _call_resident(req: ChatRequestModel, resident: ResidentId) -> LLMResponse:
    """Single resident call routed through the LLM gateway."""
    config = get_resident_routing(resident)
    messages = _build_messages(req, resident)
    gateway = get_llm_gateway()
    return await gateway.call_with_fallback(
        messages=messages,
        prefer_pro=config["prefer_pro"],
        thinking_mode=config["thinking_mode"],
        max_tokens=config["max_tokens"],
        worker="chat_endpoint",
        resident_id=resident,
    )


def _ui_model_label(resp: LLMResponse) -> UiModelLabel:
    """Map server-side LLMResponse to Persephone ChatMessageMetadata.modelUsed."""
    if resp.model_used == "V4-Pro":
        return "V4-Pro-think-high"
    if resp.thinking_mode == "low":
        return "V4-Flash-think-low"
    return "V4-Flash-non-think"


def _chunkify(content: str, window: int = 80) -> list[str]:
    """Split content into SSE-friendly chunks."""
    if not content:
        return [""]
    return [content[i : i + window] for i in range(0, len(content), window)]


def _metadata_json(resp: LLMResponse, resident: str) -> str:
    payload: dict = {
        "residentId": resident,
        "modelUsed": _ui_model_label(resp),
        "inputTokens": resp.input_tokens,
        "outputTokens": resp.output_tokens,
        "latencyMs": resp.latency_ms,
        "fallbackChain": resp.fallback_chain,
    }
    # Only expose the cache-hit internal telemetry outside production so the
    # frontend has no signal to render a "cache hit" badge in the live demo.
    if _should_expose_cache_hit():
        payload["cacheHit"] = resp.cache_hit or resp.canned_hit
    return json.dumps(payload, ensure_ascii=False)


def _sse(event: str, data: str) -> bytes:
    return f"event: {event}\ndata: {data}\n\n".encode("utf-8")


# ----------------------------------------------------------------------------
# Stream generators
# ----------------------------------------------------------------------------


async def _stream_single(
    req: ChatRequestModel, resident: ResidentId
) -> AsyncGenerator[bytes, None]:
    """Stream a single resident response."""
    try:
        resp = await _call_resident(req, resident)
    except Exception as exc:  # noqa: BLE001
        logger.exception("Single resident call failed resident=%s err=%s", resident, exc)
        yield _sse(
            "chunk",
            json.dumps(
                {"residentId": resident, "text": "Apologies, resident temporarily unavailable."},
                ensure_ascii=False,
            ),
        )
        yield _sse(
            "done",
            json.dumps({"residentId": resident, "error": "single_call_failed"}),
        )
        return

    safe_content = _sanitize_content(resp.content)
    for chunk in _chunkify(safe_content):
        payload = json.dumps(
            {"residentId": resident, "text": chunk}, ensure_ascii=False
        )
        yield _sse("chunk", payload)
        # Cooperative yield so the FastAPI event loop can flush each chunk.
        await asyncio.sleep(0)
    yield _sse("done", _metadata_json(resp, resident))


async def _stream_broadcast(
    req: ChatRequestModel,
) -> AsyncGenerator[bytes, None]:
    """Stream all 5 resident responses sequentially.

    Wave 3 cycle 3 sequential approach: run residents one at a time, yield
    chunks per resident in arrival order. Cycle 4 may upgrade to parallel
    ``asyncio.gather`` + as_completed merge if latency budget requires.
    """
    residents: list[ResidentId] = list(RESIDENT_ROUTING.keys())  # type: ignore[arg-type]
    for resident in residents:
        try:
            resp = await _call_resident(req, resident)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Broadcast resident=%s failed err=%s", resident, exc)
            err_text = json.dumps(
                {
                    "residentId": resident,
                    "text": "Apologies, resident temporarily unavailable.",
                },
                ensure_ascii=False,
            )
            yield _sse("chunk", err_text)
            yield _sse(
                "done",
                json.dumps({"residentId": resident, "error": "broadcast_failure"}),
            )
            continue
        safe_content = _sanitize_content(resp.content)
        for chunk in _chunkify(safe_content):
            payload = json.dumps(
                {"residentId": resident, "text": chunk}, ensure_ascii=False
            )
            yield _sse("chunk", payload)
            await asyncio.sleep(0)
        yield _sse("done", _metadata_json(resp, resident))


# ----------------------------------------------------------------------------
# Route
# ----------------------------------------------------------------------------


@router.post("")
@router.post("/")
async def chat_endpoint(
    req: ChatRequestModel,
    session: dict = Depends(require_session),  # noqa: B008
) -> StreamingResponse:
    """Stream chat response via Server-Sent Events.

    Routing:
        * ``Athena``: V4-Pro think high.
        * ``Apollo``: V4-Flash non-think.
        * ``Argus``: V4-Flash think low.
        * ``Clio``: V4-Flash non-think.
        * ``Hermes``: V4-Flash non-think.
        * ``broadcast``: sequential call to all 5 residents (Wave 3 cycle 3).
    """
    _ = session  # session validated by dependency; payload not yet used
    if req.target == "broadcast":
        return StreamingResponse(
            _stream_broadcast(req), media_type="text/event-stream"
        )
    resident: ResidentId = req.target  # type: ignore[assignment]
    if resident not in RESIDENT_ROUTING:
        raise HTTPException(
            status_code=422,
            detail=f"Unknown resident '{resident}'. Valid: {list(RESIDENT_ROUTING.keys())}",
        )
    return StreamingResponse(
        _stream_single(req, resident), media_type="text/event-stream"
    )
