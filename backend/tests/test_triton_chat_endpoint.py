"""Chat SSE endpoint integration test (Triton Wave 3 Cycle 3).

Patches the LLM gateway with a deterministic stub so we can verify:
- SSE wire format (event: chunk + event: done).
- TitleCase resident routing.
- Unknown resident returns 422.
- Broadcast emits chunks for all 5 residents.

Run locally:
    cd backend
    python -m pytest tests/test_triton_chat_endpoint.py -v

Compliance: Lock 1 (no em dash). Lock 2 (no emoji).
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


def _build_stub_response(content: str = "stub resident reply") -> LLMResponse:
    return LLMResponse(
        content=content,
        model_used="V4-Flash",
        thinking_mode="disabled",
        cache_hit=False,
        canned_hit=False,
        input_tokens=20,
        output_tokens=10,
        cost_estimate_usd=0.0001,
        latency_ms=120,
        call_id="stub-call",
        fallback_chain=["primary"],
    )


@pytest.fixture
def app_instance():
    """Create a fresh FastAPI app per test."""
    from app.main import create_app

    return create_app()


@pytest.mark.asyncio
async def test_chat_apollo_returns_sse_stream(app_instance) -> None:  # noqa: ANN001
    """Single resident chat returns SSE chunk + done events."""
    with patch(
        "app.api.chat._call_resident",
        new=AsyncMock(return_value=_build_stub_response("Apollo says hi from stub")),
    ):
        transport = ASGITransport(app=app_instance)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            r = await client.post(
                "/api/chat",
                json={
                    "thread_id": "t1",
                    "target": "Apollo",
                    "message": "what's wrong",
                    "context": {
                        "current_mode": "health",
                        "selected_building_id": "b1",
                        "mode_context": {},
                    },
                },
            )
    assert r.status_code == 200
    assert "text/event-stream" in r.headers.get("content-type", "")
    body = r.text
    assert "event: chunk" in body
    assert "Apollo says hi" in body
    assert "event: done" in body


@pytest.mark.asyncio
async def test_chat_unknown_resident_returns_422(app_instance) -> None:  # noqa: ANN001
    """Pydantic literal Union rejects unknown resident with 422."""
    transport = ASGITransport(app=app_instance)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.post(
            "/api/chat",
            json={
                "thread_id": "t1",
                "target": "UnknownResident",
                "message": "hi",
                "context": {
                    "current_mode": "health",
                    "selected_building_id": None,
                    "mode_context": {},
                },
            },
        )
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_chat_broadcast_streams_5_residents(app_instance) -> None:  # noqa: ANN001
    """Broadcast emits chunks + done events for all 5 residents sequentially."""
    with patch(
        "app.api.chat._call_resident",
        new=AsyncMock(return_value=_build_stub_response("broadcast stub reply")),
    ):
        transport = ASGITransport(app=app_instance)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            r = await client.post(
                "/api/chat",
                json={
                    "thread_id": "t1",
                    "target": "broadcast",
                    "message": "tour",
                    "context": {
                        "current_mode": "onboarding",
                        "selected_building_id": None,
                        "mode_context": {},
                    },
                },
            )
    assert r.status_code == 200
    body = r.text
    # 5 chunks + 5 done events (one per resident).
    assert body.count("event: chunk") >= 5
    assert body.count("event: done") >= 5
    # Each of the 5 resident ids appears in the payload.
    for resident in ("Athena", "Apollo", "Argus", "Clio", "Hermes"):
        assert resident in body


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "resident, expected_model_label",
    [
        ("Athena", "V4-Pro-think-high"),
        ("Apollo", "V4-Flash-non-think"),
        ("Argus", "V4-Flash-think-low"),
        ("Clio", "V4-Flash-non-think"),
        ("Hermes", "V4-Flash-non-think"),
    ],
)
async def test_chat_each_resident_routes_correct_model(
    app_instance, resident: str, expected_model_label: str  # noqa: ANN001
) -> None:
    """Per-resident routing maps to the expected modelUsed metadata label.

    We patch the gateway and observe the response metadata sent over SSE.
    """
    def _build_response(reskey: str) -> LLMResponse:
        if reskey == "Athena":
            return LLMResponse(
                content="athena reply", model_used="V4-Pro", thinking_mode="high",
                cache_hit=False, canned_hit=False, input_tokens=10, output_tokens=5,
                cost_estimate_usd=0.0001, latency_ms=200, call_id="stub",
                fallback_chain=["primary"],
            )
        if reskey == "Argus":
            return LLMResponse(
                content="argus reply", model_used="V4-Flash", thinking_mode="low",
                cache_hit=False, canned_hit=False, input_tokens=10, output_tokens=5,
                cost_estimate_usd=0.0001, latency_ms=120, call_id="stub",
                fallback_chain=["primary"],
            )
        return LLMResponse(
            content=f"{reskey} reply", model_used="V4-Flash", thinking_mode="disabled",
            cache_hit=False, canned_hit=False, input_tokens=10, output_tokens=5,
            cost_estimate_usd=0.0001, latency_ms=120, call_id="stub",
            fallback_chain=["primary"],
        )

    async def _fake_call(req, res):  # noqa: ANN001, ARG001
        return _build_response(res)

    with patch("app.api.chat._call_resident", new=_fake_call):
        transport = ASGITransport(app=app_instance)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            r = await client.post(
                "/api/chat",
                json={
                    "thread_id": "t1",
                    "target": resident,
                    "message": "test",
                    "context": {
                        "current_mode": "health",
                        "selected_building_id": None,
                        "mode_context": {},
                    },
                },
            )
    assert r.status_code == 200
    assert expected_model_label in r.text


# ----------------------------------------------------------------------------
# Wave-Fixing cycle 1 (C-9 HIGH): debug-label leak hygiene
# ----------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_chat_strips_pesan_asli_leak_from_content(app_instance) -> None:  # noqa: ANN001
    """``_Pesan asli: "..."_`` italic trailer is stripped from streamed content.

    Defense-in-depth: if a canned entry or LLM completion ever re-introduces the
    Wave 2 mock debug echo, the SSE chunks must not propagate it to the UI.
    """
    leaked_content = (
        "Hermes welcomes you. Selamat datang di kota lo.\n\n"
        "Tour ready when you are.\n\n"
        '_Pesan asli: "Halo, apa yang bisa kamu lakukan"_'
    )
    with patch(
        "app.api.chat._call_resident",
        new=AsyncMock(return_value=_build_stub_response(leaked_content)),
    ):
        transport = ASGITransport(app=app_instance)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            r = await client.post(
                "/api/chat",
                json={
                    "thread_id": "t1",
                    "target": "Hermes",
                    "message": "Halo, apa yang bisa kamu lakukan",
                    "context": {
                        "current_mode": "onboarding",
                        "selected_building_id": None,
                        "mode_context": {},
                    },
                },
            )
    assert r.status_code == 200
    body = r.text
    assert "Hermes welcomes you" in body
    assert "Tour ready when you are" in body
    # Critical: the leaked debug trailer must not appear in any SSE chunk.
    assert "Pesan asli" not in body


@pytest.mark.asyncio
async def test_chat_metadata_omits_cache_hit_in_production(  # noqa: ANN001
    app_instance, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Production strips the ``cacheHit`` field from the SSE ``done`` envelope.

    Development still emits the field so QA can introspect cache layer behavior.
    """
    from app.config import get_settings

    get_settings.cache_clear()  # type: ignore[attr-defined]
    monkeypatch.setenv("APP_ENV", "production")

    with patch(
        "app.api.chat._call_resident",
        new=AsyncMock(return_value=_build_stub_response("apollo reply")),
    ):
        transport = ASGITransport(app=app_instance)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            r = await client.post(
                "/api/chat",
                json={
                    "thread_id": "t1",
                    "target": "Apollo",
                    "message": "what is wrong",
                    "context": {
                        "current_mode": "health",
                        "selected_building_id": None,
                        "mode_context": {},
                    },
                },
            )

    get_settings.cache_clear()  # type: ignore[attr-defined]
    assert r.status_code == 200
    body = r.text
    # Apollo reply still streams, but the metadata payload must not carry the
    # internal cache-hit telemetry in production.
    assert "apollo reply" in body
    assert "cacheHit" not in body
