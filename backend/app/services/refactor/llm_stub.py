"""Triton LLMClient stub (Pandora Wave 3 Cycle 1 stub-and-sync).

Owner: Pandora (Wave 3).

[STUB Cycle 1, real Triton Cycle 2 full impl]

This module declares the minimum LLMClient surface area Pandora's
proposal author + simulation engine consume. Once Triton ships Cycle 1
stub at ``backend/app/services/llm_client.py`` per contract
``triton-to-pandora.md``, Pandora swaps the import path.

Reason for stub: Wave 3 spawns 6 workers in parallel; Pandora cannot
block on Triton's full DeepSeek client (LLMClient + 5 defensive layer
+ resident routing + reasoning_content strip + cost tracker). Pandora
ships its own internal stub so the simulation engine + tests work
end-to-end with a deterministic fake LLM response. Cycle 2 swap is a
1-line import edit.

Contract reference: ``_meta/contracts/triton-to-pandora.md`` lines
24-130 (LLMClient.call signature + LLMResponse fields).

Compliance: Lock 1 (no em dash). Lock 2 (no emoji). Lock 5 stub
labelled ``[STUB]`` at module + class + method docstring level.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Iterable, Literal, Optional, Protocol

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Data classes mirroring Triton LLMMessage + LLMResponse surface
# ---------------------------------------------------------------------------


LLMRole = Literal["system", "user", "assistant"]


@dataclass(slots=True)
class LLMMessage:
    """Chat message envelope per Triton contract.

    [STUB] Wave 3 Cycle 1: Pandora declares this locally so the
    simulation engine can compile and unit-test before Triton ships.
    """

    role: LLMRole
    content: str


@dataclass(slots=True)
class LLMResponse:
    """LLM response envelope per Triton contract.

    [STUB] Field names mirror the Triton ship target so the import
    swap in Cycle 2 is a no-op for call sites. Pandora ONLY reads
    ``content`` + cost metadata; ``reasoning_content`` is intentionally
    NOT surfaced to multi-turn prompt builders (Phase B Topic E
    quirk).
    """

    content: str
    model_used: Literal["V4-Flash", "V4-Pro"] = "V4-Flash"
    thinking_mode: Literal["disabled", "low", "medium", "high"] = "disabled"
    cache_hit: bool = False
    canned_hit: bool = False
    input_tokens: int = 0
    output_tokens: int = 0
    cost_estimate_usd: float = 0.0
    latency_ms: int = 0
    reasoning_content: Optional[str] = None
    error: Optional[str] = None
    call_id: str = field(default_factory=lambda: "stub-call-id")


# ---------------------------------------------------------------------------
# Protocol for the consumer (proposal_author + simulation_engine)
# ---------------------------------------------------------------------------


class LLMClientProtocol(Protocol):
    """LLMClient surface Pandora consumes.

    Triton's real ``DeepSeekClient`` (Cycle 2 ship target) implements
    this protocol. Pandora's ``StubLLMClient`` below implements it
    deterministically for offline tests.
    """

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
    ) -> LLMResponse: ...


# ---------------------------------------------------------------------------
# Stub deterministic implementation (Cycle 1 ship)
# ---------------------------------------------------------------------------


class StubLLMClient:
    """Deterministic offline LLMClient stub.

    [STUB Cycle 1, real Triton Cycle 2 full impl]

    Behaviour: returns canned content based on the last system prompt
    type so simulation_engine tests run without network. The canned
    response is intentionally minimal but valid JSON / valid Python /
    valid diff so downstream parsers do not fail.

    Cycle 2 swap: replace ``get_llm_client()`` returning this stub
    with the real Triton ``DeepSeekClient`` import. No call sites
    change because they consume the ``LLMClientProtocol``.
    """

    def __init__(self) -> None:
        self._call_count = 0

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
        self._call_count += 1
        system_content = _first_system(messages) or ""
        canned = _canned_response(system_content)
        return LLMResponse(
            content=canned,
            model_used="V4-Pro" if prefer_pro else "V4-Flash",
            thinking_mode=thinking_mode,
            cache_hit=False,
            canned_hit=True,
            input_tokens=sum(len(m.content) for m in messages) // 4,
            output_tokens=len(canned) // 4,
            cost_estimate_usd=0.0,
            latency_ms=12,
            reasoning_content=None,
            error=None,
            call_id=f"stub-{self._call_count}",
        )


def _first_system(messages: Iterable[LLMMessage]) -> Optional[str]:
    for m in messages:
        if m.role == "system":
            return m.content
    return None


def _canned_response(system_prompt: str) -> str:
    """Pick a canned valid response based on system prompt content."""
    # Athena proposal JSON output.
    if "STRICT JSON" in system_prompt or "ghost_hints" in system_prompt:
        return (
            "{\n"
            '  "title": "Add 2FA to login",\n'
            '  "summary": "Introduce TOTP-based second factor on the login endpoint.",\n'
            '  "affected_files": ["backend/app/security/auth.py"],\n'
            '  "ghost_hints": [\n'
            "    {\n"
            '      "ghostId": "ghost-2fa-verifier",\n'
            '      "archetype": "generic-office",\n'
            '      "label": "2FA verifier module",\n'
            '      "suggestedFilePath": "backend/app/security/two_factor.py",\n'
            '      "connections": [\n'
            '        { "targetBuildingId": "backend/app/security/auth.py", "relationship": "import" }\n'
            "      ]\n"
            "    }\n"
            "  ],\n"
            '  "complexity": "moderate",\n'
            '  "rationale": "TOTP is a self-contained module; the existing auth path imports it."\n'
            "}\n"
        )
    # Athena test gen Turn 1.
    if "Turn 1 of 3" in system_prompt:
        return (
            "```\n"
            "# FILE: tests/test_two_factor.py\n"
            "import pytest\n"
            "from backend.app.security.two_factor import verify_totp\n"
            "\n"
            "def test_verify_totp_rejects_invalid_code():\n"
            "    assert verify_totp(secret='ABC', code='000000') is False\n"
            "```\n"
        )
    # Athena impl gen Turn 2.
    if "Turn 2 of 3" in system_prompt:
        return (
            "```\n"
            "# FILE: backend/app/security/two_factor.py\n"
            "import hmac, hashlib, struct, time\n"
            "\n"
            "def verify_totp(secret: str, code: str, period: int = 30) -> bool:\n"
            "    if not code.isdigit() or len(code) != 6:\n"
            "        return False\n"
            "    counter = int(time.time()) // period\n"
            "    msg = struct.pack('>Q', counter)\n"
            "    digest = hmac.new(secret.encode(), msg, hashlib.sha1).digest()\n"
            "    offset = digest[-1] & 0xF\n"
            "    bin_code = (\n"
            "        ((digest[offset] & 0x7F) << 24)\n"
            "        | ((digest[offset + 1] & 0xFF) << 16)\n"
            "        | ((digest[offset + 2] & 0xFF) << 8)\n"
            "        | (digest[offset + 3] & 0xFF)\n"
            "    )\n"
            "    return f'{bin_code % 10**6:06d}' == code\n"
            "```\n"
        )
    # Diff serialize Turn 3.
    if "Turn 3 of 3" in system_prompt:
        return (
            "```diff\n"
            "diff --git a/backend/app/security/two_factor.py b/backend/app/security/two_factor.py\n"
            "new file mode 100644\n"
            "--- /dev/null\n"
            "+++ b/backend/app/security/two_factor.py\n"
            "@@ -0,0 +1,18 @@\n"
            "+import hmac, hashlib, struct, time\n"
            "+\n"
            "+def verify_totp(secret: str, code: str, period: int = 30) -> bool:\n"
            "+    if not code.isdigit() or len(code) != 6:\n"
            "+        return False\n"
            "+    counter = int(time.time()) // period\n"
            "+    msg = struct.pack('>Q', counter)\n"
            "+    digest = hmac.new(secret.encode(), msg, hashlib.sha1).digest()\n"
            "+    offset = digest[-1] & 0xF\n"
            "+    bin_code = (\n"
            "+        ((digest[offset] & 0x7F) << 24)\n"
            "+        | ((digest[offset + 1] & 0xFF) << 16)\n"
            "+        | ((digest[offset + 2] & 0xFF) << 8)\n"
            "+        | (digest[offset + 3] & 0xFF)\n"
            "+    )\n"
            "+    return f'{bin_code % 10**6:06d}' == code\n"
            "```\n"
        )
    # Fallback canned response.
    return "[STUB canned response: system prompt did not match any known turn]\n"


# ---------------------------------------------------------------------------
# Factory (Cycle 2 swap site)
# ---------------------------------------------------------------------------


_singleton: Optional[LLMClientProtocol] = None


def get_llm_client() -> LLMClientProtocol:
    """Return the LLMClient singleton.

    Wave-Fixing #2 Cycle 1 (Pandora rescue R-1, STAMP=20260513-0313):
    flip-of-the-switch to real Triton ``LLMGateway`` when the project
    has a DeepSeek API key configured. The previous Cycle 1 stub
    behaviour (always StubLLMClient) silently bypassed real V4-Pro
    thinking=high dispatch, which was the root cause of R-1 verdict
    FAIL ("no real DeepSeek dispatch").

    Resolution order:
    1. ``set_llm_client`` override (used by tests).
    2. ``DEEPSEEK_API_KEY`` env var present and non-empty: return the
       real ``LLMGateway`` (5-layer defensive fallback + Phase B Topic
       E reasoning_content scrub via ``DeepSeekClient._scrub_messages``).
       Adapter wraps the response so Pandora's local ``LLMResponse``
       shape is preserved (Pandora reads ``content`` plus telemetry
       fields; LLMGateway returns the Triton Pydantic ``LLMResponse``
       which carries the same fields).
    3. Otherwise (no API key, tests, offline dev): fall back to
       ``StubLLMClient`` with canned deterministic responses. The
       canned responses still exercise the 3-turn parse + write path
       so the smoke tests continue to pass without a real API call.

    Returns:
        An object conforming to ``LLMClientProtocol.call(...)``.
    """
    global _singleton
    if _singleton is not None:
        return _singleton

    # Inline import keeps the module loadable in environments without
    # the openai package (test isolation; CI containers without API).
    try:
        from app.config import get_settings as _get_settings

        settings = _get_settings()
        api_key = getattr(settings, "DEEPSEEK_API_KEY", None)
    except Exception:  # pragma: no cover - defensive (no settings)
        api_key = None

    if api_key:
        try:
            from app.services.llm_client import get_llm_gateway

            gateway = get_llm_gateway()
            # The gateway already implements LLMClientProtocol.call via
            # its compatibility shim (see app/services/llm_client.py
            # lines 276-301). We wrap it once via _GatewayAdapter so
            # the response type (Pydantic ``LLMResponse``) is converted
            # to the Pandora dataclass shape for downstream code that
            # accesses fields with ``getattr(response, ..., default)``.
            _singleton = _GatewayAdapter(gateway)
            logger.info(
                "pandora.llm_stub: real DeepSeek dispatch via LLMGateway active"
            )
            return _singleton
        except Exception as err:  # pragma: no cover - defensive
            logger.warning(
                "pandora.llm_stub: LLMGateway init failed (%s); falling back to StubLLMClient",
                err,
            )

    _singleton = StubLLMClient()
    logger.info("pandora.llm_stub: StubLLMClient active (no DEEPSEEK_API_KEY or import fail)")
    return _singleton


def set_llm_client(client: LLMClientProtocol) -> None:
    """Override the singleton (used by tests + Cycle 2 swap)."""
    global _singleton
    _singleton = client


def reset_llm_client() -> None:
    """Clear the singleton (test helper used by Cycle 2 wiring smoke)."""
    global _singleton
    _singleton = None


class _GatewayAdapter:
    """Adapter that converts ``LLMGateway`` Pydantic ``LLMResponse``
    into the Pandora dataclass ``LLMResponse``.

    The Triton gateway returns ``app.llm.types.LLMResponse`` (Pydantic
    v2 BaseModel). Pandora's call sites read fields via attribute
    access ``response.content`` etc., which works on both shapes.
    We keep the adapter as a thin pass-through so future divergence
    can be hard-stopped here.

    Wave-Fixing #2 Cycle 1 wiring (STAMP=20260513-0313).
    """

    def __init__(self, gateway: object) -> None:
        self._gateway = gateway

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
        # Triton ``LLMMessage`` is a Pydantic BaseModel; Pandora's local
        # dataclass has ``role`` + ``content`` only (Phase B Topic E
        # reasoning_content lock). We convert by constructing a fresh
        # list of Pydantic LLMMessage with only the role + content
        # fields the protocol exposes.
        from app.llm.types import LLMMessage as TritonLLMMessage

        scrubbed = [
            TritonLLMMessage(role=m.role, content=m.content) for m in messages
        ]
        gw_response = await self._gateway.call(
            messages=scrubbed,
            prefer_pro=prefer_pro,
            thinking_mode=thinking_mode,
            max_tokens=max_tokens,
            worker=worker,
            simulation_id=simulation_id,
            resident_id=resident_id,
        )
        # gw_response is app.llm.types.LLMResponse (Pydantic). We mirror
        # its fields into Pandora's local dataclass LLMResponse so
        # downstream getattr stays compatible. Use defensive getattr in
        # case Triton ships fields the dataclass lacks.
        return LLMResponse(
            content=getattr(gw_response, "content", ""),
            model_used=getattr(gw_response, "model_used", "V4-Flash"),
            thinking_mode=getattr(gw_response, "thinking_mode", thinking_mode),
            cache_hit=bool(getattr(gw_response, "cache_hit", False)),
            canned_hit=bool(getattr(gw_response, "canned_hit", False)),
            input_tokens=int(getattr(gw_response, "input_tokens", 0) or 0),
            output_tokens=int(getattr(gw_response, "output_tokens", 0) or 0),
            cost_estimate_usd=float(getattr(gw_response, "cost_estimate_usd", 0.0) or 0.0),
            latency_ms=int(getattr(gw_response, "latency_ms", 0) or 0),
            reasoning_content=getattr(gw_response, "reasoning_content", None),
            error=getattr(gw_response, "error", None),
            call_id=getattr(gw_response, "call_id", "triton-call"),
        )


__all__ = [
    "LLMClientProtocol",
    "LLMMessage",
    "LLMResponse",
    "StubLLMClient",
    "get_llm_client",
    "reset_llm_client",
    "set_llm_client",
]
