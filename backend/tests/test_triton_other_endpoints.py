"""Triton Wave 3 Cycle 3 endpoints (onboarding, security, simulation, health).

Patches ``LLMGateway.call_with_fallback`` so tests do not hit the live DeepSeek
API. Verifies request validation + response shapes + downstream consumer
contract conformance.

Run locally:
    cd backend
    python -m pytest tests/test_triton_other_endpoints.py -v

Compliance: Lock 1 (no em dash). Lock 2 (no emoji).
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.llm.types import LLMResponse


def _build_stub_response(content: str) -> LLMResponse:
    return LLMResponse(
        content=content,
        model_used="V4-Flash",
        thinking_mode="disabled",
        cache_hit=False,
        canned_hit=False,
        input_tokens=30,
        output_tokens=15,
        cost_estimate_usd=0.0001,
        latency_ms=150,
        call_id="stub-call",
        fallback_chain=["primary"],
    )


@pytest.fixture
def app_instance():
    from app.main import create_app

    return create_app()


# ---------------------------------------------------------------------------
# Onboarding narration (Boreas consumer)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_onboarding_narration_returns_text(app_instance) -> None:  # noqa: ANN001
    stub = _build_stub_response("Selamat datang di main.py")
    with patch(
        "app.api.onboarding.get_llm_gateway"
    ) as mock_gateway_getter:
        gateway = mock_gateway_getter.return_value
        gateway.call_with_fallback = AsyncMock(return_value=stub)

        transport = ASGITransport(app=app_instance)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            r = await client.post(
                "/api/onboarding/narration",
                json={
                    "tour_id": "generic-30sec-v1",
                    "waypoint_index": 0,
                    "tour_variant": "generic-30sec",
                    "narration_prompt_context": {
                        "purpose": "Welcome the new hire",
                        "building_context": {
                            "label": "main.py",
                            "archetype": "temple",
                            "ownership": "@backend-team",
                            "recent_activity": "25 commits last 30 days",
                        },
                    },
                },
            )
    assert r.status_code == 200
    body = r.json()
    assert body["narration_text"] == "Selamat datang di main.py"
    assert body["model_used"] == "V4-Flash"
    assert body["fallback_chain"] == ["primary"]


@pytest.mark.asyncio
async def test_onboarding_narration_unknown_variant_returns_422(
    app_instance,  # noqa: ANN001
) -> None:
    transport = ASGITransport(app=app_instance)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.post(
            "/api/onboarding/narration",
            json={
                "tour_id": "bogus",
                "waypoint_index": 0,
                "tour_variant": "alien-variant",
                "narration_prompt_context": {
                    "purpose": "x",
                    "building_context": {
                        "label": "x",
                        "archetype": "x",
                        "ownership": "x",
                        "recent_activity": "x",
                    },
                },
            },
        )
    # Pydantic literal Union rejects with 422 before reaching the handler.
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_onboarding_narration_routes_hermes_v4flash_non_think(
    app_instance,  # noqa: ANN001
) -> None:
    """Verify Hermes routing config flows to gateway call."""
    stub = _build_stub_response("Welcome narration")
    with patch("app.api.onboarding.get_llm_gateway") as mock_gateway_getter:
        gateway = mock_gateway_getter.return_value
        gateway.call_with_fallback = AsyncMock(return_value=stub)

        transport = ASGITransport(app=app_instance)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            await client.post(
                "/api/onboarding/narration",
                json={
                    "tour_id": "generic-30sec-v1",
                    "waypoint_index": 0,
                    "tour_variant": "generic-30sec",
                    "narration_prompt_context": {
                        "purpose": "Welcome",
                        "building_context": {
                            "label": "main.py",
                            "archetype": "temple",
                            "ownership": "@backend",
                            "recent_activity": "25 commits",
                        },
                    },
                },
            )
        # Inspect kwargs passed to gateway.
        call = gateway.call_with_fallback.call_args
        assert call.kwargs["prefer_pro"] is False
        assert call.kwargs["thinking_mode"] == "disabled"
        assert call.kwargs["resident_id"] == "Hermes"
        assert call.kwargs["worker"] == "onboarding_endpoint"


# ---------------------------------------------------------------------------
# Security CVSS (Nemesis consumer)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_security_argus_score_parses_json(app_instance) -> None:  # noqa: ANN001
    argus_json = json.dumps(
        {
            "cvss_vector": "AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
            "cvss_base_score": 9.8,
            "exploit_pattern": "CWE-798 Hardcoded credentials",
            "mitigation": "Rotate the secret and move to env var.",
            "references": ["CVE-2024-1234", "https://nvd.nist.gov"],
        }
    )
    stub = _build_stub_response(argus_json)
    with patch("app.api.security.get_llm_gateway") as mock_gateway_getter:
        gateway = mock_gateway_getter.return_value
        gateway.call_with_fallback = AsyncMock(return_value=stub)

        transport = ASGITransport(app=app_instance)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            r = await client.post(
                "/api/security/argus/score",
                json={
                    "finding_id": "f-001",
                    "file_path": "src/auth/oauth.ts",
                    "line_start": 12,
                    "line_end": 14,
                    "category": "hardcoded-secret",
                    "severity": "critical",
                    "title": "Hardcoded secret",
                    "description": "Token committed in source",
                    "code_excerpt": "const token = 'sk-abc';",
                },
            )
        # Verify routing: Argus V4-Flash thinking low.
        call = gateway.call_with_fallback.call_args
        assert call.kwargs["prefer_pro"] is False
        assert call.kwargs["thinking_mode"] == "low"

    assert r.status_code == 200
    body = r.json()
    assert body["finding_id"] == "f-001"
    assert body["cvss_base_score"] == 9.8
    assert body["cvss_vector"].startswith("AV:N")
    assert body["mitigation"].startswith("Rotate")
    assert "CVE-2024-1234" in body["references"]
    assert body["parse_error"] is None


@pytest.mark.asyncio
async def test_security_argus_score_handles_malformed_json(
    app_instance,  # noqa: ANN001
) -> None:
    stub = _build_stub_response("not json content at all")
    with patch("app.api.security.get_llm_gateway") as mock_gateway_getter:
        gateway = mock_gateway_getter.return_value
        gateway.call_with_fallback = AsyncMock(return_value=stub)

        transport = ASGITransport(app=app_instance)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            r = await client.post(
                "/api/security/argus/score",
                json={
                    "finding_id": "f-002",
                    "file_path": "src/x.ts",
                    "line_start": 1,
                    "line_end": 5,
                    "category": "unsafe-sql",
                    "severity": "high",
                    "title": "Unsafe SQL",
                    "description": "Concatenation",
                },
            )
    assert r.status_code == 200
    body = r.json()
    # Malformed JSON: parse_error set, raw_content preserved.
    assert body["parse_error"] == "json_decode_failed"
    assert body["raw_content"] == "not json content at all"
    assert body["cvss_base_score"] is None


@pytest.mark.asyncio
async def test_security_argus_clamps_out_of_range_score(
    app_instance,  # noqa: ANN001
) -> None:
    """Out of range CVSS score gets clamped to 0..10 per Nemesis edge case."""
    argus_json = json.dumps(
        {
            "cvss_vector": "x",
            "cvss_base_score": 99.0,
            "exploit_pattern": "x",
            "mitigation": "x",
            "references": [],
        }
    )
    stub = _build_stub_response(argus_json)
    with patch("app.api.security.get_llm_gateway") as mock_gateway_getter:
        gateway = mock_gateway_getter.return_value
        gateway.call_with_fallback = AsyncMock(return_value=stub)

        transport = ASGITransport(app=app_instance)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            r = await client.post(
                "/api/security/argus/score",
                json={
                    "finding_id": "f-003",
                    "file_path": "src/x.ts",
                    "line_start": 1,
                    "line_end": 2,
                    "category": "missing-auth",
                    "severity": "high",
                    "title": "x",
                    "description": "x",
                },
            )
    body = r.json()
    assert body["cvss_base_score"] == 10.0  # clamped


# ---------------------------------------------------------------------------
# Simulation dispatch (Pandora consumer)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_simulation_turn_test_gen_routes_pro_high(
    app_instance,  # noqa: ANN001
) -> None:
    """test_gen turn routes V4-Pro think high per PRD Section 18.6."""
    stub = _build_stub_response(
        "```\n# FILE: tests/test_2fa.py\ndef test_x(): assert False\n```"
    )
    with patch("app.api.simulation.get_llm_gateway") as mock_gateway_getter:
        gateway = mock_gateway_getter.return_value
        gateway.call_with_fallback = AsyncMock(return_value=stub)

        transport = ASGITransport(app=app_instance)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            r = await client.post(
                "/api/simulation/turn",
                json={
                    "turn": "test_gen",
                    "simulation_id": "sim-1",
                    "user_messages": ["Add 2FA"],
                },
            )
        call = gateway.call_with_fallback.call_args
        assert call.kwargs["prefer_pro"] is True
        assert call.kwargs["thinking_mode"] == "high"
        assert call.kwargs["simulation_id"] == "sim-1"
    assert r.status_code == 200
    body = r.json()
    assert "test_x" in body["content"]
    assert body["turn"] == "test_gen"


@pytest.mark.asyncio
async def test_simulation_turn_diff_serialize_routes_flash_non_think(
    app_instance,  # noqa: ANN001
) -> None:
    stub = _build_stub_response("```diff\n--- a/x\n+++ b/x\n+ y\n```")
    with patch("app.api.simulation.get_llm_gateway") as mock_gateway_getter:
        gateway = mock_gateway_getter.return_value
        gateway.call_with_fallback = AsyncMock(return_value=stub)

        transport = ASGITransport(app=app_instance)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            r = await client.post(
                "/api/simulation/turn",
                json={
                    "turn": "diff_serialize",
                    "simulation_id": "sim-2",
                    "user_messages": ["serialize this"],
                },
            )
        call = gateway.call_with_fallback.call_args
        assert call.kwargs["prefer_pro"] is False
        assert call.kwargs["thinking_mode"] == "disabled"
    assert r.status_code == 200


@pytest.mark.asyncio
async def test_simulation_turn_unknown_returns_422(app_instance) -> None:  # noqa: ANN001
    transport = ASGITransport(app=app_instance)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.post(
            "/api/simulation/turn",
            json={
                "turn": "bogus_turn",
                "simulation_id": "sim-x",
                "user_messages": ["go"],
            },
        )
    assert r.status_code == 422


# ---------------------------------------------------------------------------
# LLM health
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_llm_health_returns_state(app_instance) -> None:  # noqa: ANN001
    transport = ASGITransport(app=app_instance)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.get("/api/llm/health")
    assert r.status_code == 200
    body = r.json()
    assert body["circuit_state"] in {"closed", "open", "half_open"}
    assert body["canned_entries"] >= 10
    assert body["total_cost_usd"] >= 0.0
