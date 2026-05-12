"""Smoke test for the dual review gate API endpoints (Pandora Wave 3).

Owner: Pandora (Wave 3).

Endpoints exercised:
- ``POST /api/refactor/simulate`` 202 Accepted with simulation_id
- ``GET /api/refactor/{id}/accept-info`` 200 with diff metadata
- ``POST /api/refactor/{id}/accept`` 200 with FileResponse download
- ``POST /api/refactor/{id}/discard`` 200 with cleanup confirmation
- ``WebSocket /api/ws/refactor-events`` event streaming

Run locally:
    cd backend
    python -m pytest tests/test_dual_review_gate_smoke.py -v

Compliance: Lock 1 (no em dash). Lock 2 (no emoji).
"""

from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.api.refactor import router, ws_router  # noqa: E402
from app.services.refactor.demeter_adapter import (  # noqa: E402
    StubDemeterAdapter,
    set_demeter_adapter,
)
from app.services.refactor.drafts_isolation import simulation_dir  # noqa: E402
from app.services.refactor.llm_stub import StubLLMClient, set_llm_client  # noqa: E402
from app.services.refactor.ws_publisher import (  # noqa: E402
    InMemoryRefactorBus,
    set_refactor_bus,
)


@pytest.fixture
def app(tmp_path: Path, monkeypatch) -> FastAPI:
    """Spin up a fresh FastAPI app with isolated singletons + drafts root."""
    # Reset every singleton so tests do not leak state.
    set_llm_client(StubLLMClient())
    set_demeter_adapter(StubDemeterAdapter())
    set_refactor_bus(InMemoryRefactorBus())
    monkeypatch.setenv("DRAFTS_ROOT", str(tmp_path / "drafts"))

    # Wave-Fixing #2 Cycle 1 (Pandora rescue R-1, STAMP=20260513-0313):
    # Pandora's ``refactor.router`` carries prefix ``/refactor`` (was
    # ``/api/refactor`` pre-rescue) because production wiring mounts
    # ``api_router`` under ``/api`` in ``app.main:app``. Test fixture must
    # mirror the production prefix (``/api``) so the test URL paths still
    # match the contract (``/api/refactor/...``).
    app = FastAPI()
    app.include_router(router, prefix="/api")
    app.include_router(ws_router, prefix="/api")
    return app


@pytest.fixture
def client(app: FastAPI) -> TestClient:
    return TestClient(app)


# ---------------------------------------------------------------------------
# POST /api/refactor/simulate
# ---------------------------------------------------------------------------


def test_simulate_endpoint_returns_202_with_simulation_id(client: TestClient) -> None:
    response = client.post(
        "/api/refactor/simulate",
        json={"user_intent": "I want to add 2FA to login."},
    )
    assert response.status_code == 202
    body = response.json()
    assert "simulation_id" in body
    assert body["simulation_id"]
    assert body["proposal_id"] == body["simulation_id"]
    assert body["title"]
    assert body["stage"] == "simulating"
    assert body["websocket_url"] == "/api/ws/refactor-events"


def test_simulate_endpoint_validates_user_intent_length(client: TestClient) -> None:
    response = client.post(
        "/api/refactor/simulate",
        json={"user_intent": "no"},
    )
    assert response.status_code == 422


def test_simulate_creates_drafts_dir_after_background_task(
    client: TestClient,
    tmp_path: Path,
) -> None:
    response = client.post(
        "/api/refactor/simulate",
        json={"user_intent": "I want to add 2FA to login."},
    )
    body = response.json()
    sim_id = body["simulation_id"]
    # BackgroundTasks fire AFTER the response in the TestClient. Poll for
    # the diff.patch to appear with a short bounded budget.
    drafts_root = tmp_path / "drafts"
    diff = drafts_root / sim_id / "diff.patch"
    for _ in range(40):
        if diff.exists():
            break
        import time as _t

        _t.sleep(0.05)
    assert diff.exists(), f"diff did not materialise at {diff}"
    assert diff.read_text().startswith("diff --git")


# ---------------------------------------------------------------------------
# GET /api/refactor/{id}/accept-info
# ---------------------------------------------------------------------------


def test_accept_info_returns_diff_metadata(client: TestClient, tmp_path: Path) -> None:
    response = client.post(
        "/api/refactor/simulate",
        json={"user_intent": "I want to add 2FA to login."},
    )
    sim_id = response.json()["simulation_id"]
    # Wait for the simulation to finish.
    diff = tmp_path / "drafts" / sim_id / "diff.patch"
    for _ in range(40):
        if diff.exists():
            break
        import time as _t

        _t.sleep(0.05)
    info = client.get(f"/api/refactor/{sim_id}/accept-info")
    assert info.status_code == 200
    body = info.json()
    assert body["simulation_id"] == sim_id
    assert body["diff_size_bytes"] > 0
    assert body["diff_path"].endswith("diff.patch")


def test_accept_info_404_when_diff_missing(client: TestClient) -> None:
    info = client.get("/api/refactor/never-simulated/accept-info")
    assert info.status_code == 404


# ---------------------------------------------------------------------------
# POST /api/refactor/{id}/accept (OQ-09 download diff)
# ---------------------------------------------------------------------------


def test_accept_returns_diff_as_octet_stream(client: TestClient, tmp_path: Path) -> None:
    sim = client.post(
        "/api/refactor/simulate",
        json={"user_intent": "I want to add 2FA to login."},
    )
    sim_id = sim.json()["simulation_id"]
    diff = tmp_path / "drafts" / sim_id / "diff.patch"
    for _ in range(40):
        if diff.exists():
            break
        import time as _t

        _t.sleep(0.05)

    accept = client.post(f"/api/refactor/{sim_id}/accept")
    assert accept.status_code == 200
    assert accept.headers["content-type"] == "application/octet-stream"
    assert "refactor-" in accept.headers["content-disposition"]
    assert accept.headers["content-disposition"].endswith('.diff"')
    assert accept.content.startswith(b"diff --git")


def test_accept_404_before_simulation_done(client: TestClient) -> None:
    accept = client.post("/api/refactor/never-simulated/accept")
    assert accept.status_code == 404


def test_accept_with_cleanup_query_removes_drafts(
    client: TestClient,
    tmp_path: Path,
) -> None:
    sim = client.post(
        "/api/refactor/simulate",
        json={"user_intent": "I want to add 2FA to login."},
    )
    sim_id = sim.json()["simulation_id"]
    diff = tmp_path / "drafts" / sim_id / "diff.patch"
    for _ in range(40):
        if diff.exists():
            break
        import time as _t

        _t.sleep(0.05)
    accept = client.post(f"/api/refactor/{sim_id}/accept?cleanup=true")
    assert accept.status_code == 200
    # The background task fires after the response is fully read in
    # TestClient. Poll for the drafts dir to disappear with a short
    # bounded budget.
    sim_dir = tmp_path / "drafts" / sim_id
    for _ in range(40):
        if not sim_dir.exists():
            break
        import time as _t

        _t.sleep(0.05)
    assert not sim_dir.exists(), f"cleanup=true did not remove {sim_dir}"


# ---------------------------------------------------------------------------
# POST /api/refactor/{id}/discard
# ---------------------------------------------------------------------------


def test_discard_marks_stage_and_cleans_drafts(
    client: TestClient,
    tmp_path: Path,
) -> None:
    sim = client.post(
        "/api/refactor/simulate",
        json={"user_intent": "I want to add 2FA to login."},
    )
    sim_id = sim.json()["simulation_id"]
    diff = tmp_path / "drafts" / sim_id / "diff.patch"
    for _ in range(40):
        if diff.exists():
            break
        import time as _t

        _t.sleep(0.05)
    discard = client.post(f"/api/refactor/{sim_id}/discard")
    assert discard.status_code == 200
    body = discard.json()
    assert body["simulation_id"] == sim_id
    assert body["stage"] == "discarded"
    assert body["drafts_cleaned"] is True
    sim_dir = tmp_path / "drafts" / sim_id
    assert not sim_dir.exists()


# ---------------------------------------------------------------------------
# WebSocket /api/ws/refactor-events
# ---------------------------------------------------------------------------


def test_websocket_streams_event_sequence(client: TestClient, tmp_path: Path) -> None:
    """Connect AFTER simulate so the bus history backfills the events."""
    sim = client.post(
        "/api/refactor/simulate",
        json={"user_intent": "I want to add 2FA to login."},
    )
    sim_id = sim.json()["simulation_id"]
    diff = tmp_path / "drafts" / sim_id / "diff.patch"
    for _ in range(40):
        if diff.exists():
            break
        import time as _t

        _t.sleep(0.05)

    with client.websocket_connect(
        f"/api/ws/refactor-events?simulationId={sim_id}"
    ) as ws:
        # Backfill: receive at least the proposal event + 6 stage events.
        received: list[dict] = []
        for _ in range(7):
            received.append(ws.receive_json(mode="text"))
        types = [ev.get("type") for ev in received]
        stages = [ev["stage"] for ev in received if ev.get("type") == "simulation.stage"]
        assert types[0] == "simulation.proposal"
        assert stages == [
            "tests_generating",
            "tests_written",
            "impl_generating",
            "impl_written",
            "diff_serializing",
            "completed",
        ]


def test_websocket_rejects_missing_simulation_id(client: TestClient) -> None:
    with client.websocket_connect("/api/ws/refactor-events") as ws:
        # The server should close right after accepting with code 1008.
        from starlette.websockets import WebSocketDisconnect

        with pytest.raises(WebSocketDisconnect) as excinfo:
            ws.receive_json()
        assert excinfo.value.code == 1008
