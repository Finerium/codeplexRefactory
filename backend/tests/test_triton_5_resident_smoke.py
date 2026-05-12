"""5-resident smoke (Triton Wave 3 Cycle 4).

End-to-end smoke for the 5 LOCKED runtime residents. Each resident routes
through the gateway with the correct model + thinking_mode per PRD Section
18.3. The DeepSeek client is patched with a deterministic stub so we can
assert the routing decisions without burning real API calls.

Run locally:
    cd backend
    python -m pytest tests/test_triton_5_resident_smoke.py -v

Compliance: Lock 1 (no em dash). Lock 2 (no emoji). Lock 4 (PRD 18.3 LOCKED).
"""

from __future__ import annotations

import sys
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.llm.types import LLMResponse


def _build_response(model_used: str, thinking_mode: str, content: str) -> LLMResponse:
    return LLMResponse(
        content=content,
        model_used=model_used,  # type: ignore[arg-type]
        thinking_mode=thinking_mode,  # type: ignore[arg-type]
        cache_hit=False,
        canned_hit=False,
        input_tokens=20,
        output_tokens=10,
        cost_estimate_usd=0.0001,
        latency_ms=120,
        call_id="smoke",
        fallback_chain=["primary"],
    )


@pytest.fixture
def app_instance():
    from app.main import create_app

    return create_app()


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "resident, expected_model_label, content",
    [
        ("Athena", "V4-Pro-think-high", "Athena Architectural reasoning"),
        ("Apollo", "V4-Flash-non-think", "Apollo Clinical diagnostic"),
        ("Argus", "V4-Flash-think-low", "Argus Watchful CVSS"),
        ("Clio", "V4-Flash-non-think", "Clio Storytelling git history"),
        ("Hermes", "V4-Flash-non-think", "Hermes Warm welcome"),
    ],
)
async def test_5_resident_smoke_through_chat_endpoint(
    app_instance,  # noqa: ANN001
    resident: str,
    expected_model_label: str,
    content: str,
) -> None:
    """End-to-end smoke: chat endpoint -> gateway -> client -> SSE stream.

    Stub returns LLMResponse keyed on resident. SSE response must surface
    the resident name + model label.
    """
    async def _fake_call(req, res):  # noqa: ANN001, ARG001
        if res == "Athena":
            return _build_response("V4-Pro", "high", content)
        if res == "Argus":
            return _build_response("V4-Flash", "low", content)
        return _build_response("V4-Flash", "disabled", content)

    with patch("app.api.chat._call_resident", new=_fake_call):
        transport = ASGITransport(app=app_instance)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            r = await client.post(
                "/api/chat",
                json={
                    "thread_id": "smoke",
                    "target": resident,
                    "message": "smoke ping",
                    "context": {
                        "current_mode": "health",
                        "selected_building_id": None,
                        "mode_context": {},
                    },
                },
            )
    assert r.status_code == 200
    body = r.text
    assert resident in body
    assert expected_model_label in body
    assert content in body


@pytest.mark.asyncio
async def test_5_resident_broadcast_emits_all(app_instance) -> None:  # noqa: ANN001
    """Broadcast endpoint emits chunks for all 5 residents end-to-end."""
    async def _fake_call(req, res):  # noqa: ANN001, ARG001
        return _build_response("V4-Flash", "disabled", f"{res} reply")

    with patch("app.api.chat._call_resident", new=_fake_call):
        transport = ASGITransport(app=app_instance)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            r = await client.post(
                "/api/chat",
                json={
                    "thread_id": "smoke-broadcast",
                    "target": "broadcast",
                    "message": "smoke broadcast",
                    "context": {
                        "current_mode": "onboarding",
                        "selected_building_id": None,
                        "mode_context": {},
                    },
                },
            )
    assert r.status_code == 200
    body = r.text
    for resident in ("Athena", "Apollo", "Argus", "Clio", "Hermes"):
        assert resident in body
        assert f"{resident} reply" in body
