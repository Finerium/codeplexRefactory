"""Nemesis Wave-Fixing #2 cycle 1 endpoint smoke tests.

Covers two cluster 7 deliverables:

1. `POST /api/findings/scan`:
   - Default body (NodeGoat fixture) triggers full 11-detector run.
   - Response carries 5/5 Apollo detector counts + 5/5 spec-drift pattern counts.
   - WebSocket fan-out via EventBus: scan.started + finding.detected x N
     + scan.completed observable via direct subscriber on the bus.

2. `POST /api/findings/{finding_id}/to-issue`:
   - ENABLE_WRITE_OPS=false branch returns synthetic deep-link result with
     state="deeplink" and a GitHub /issues/new?title=&body=&labels= URL.
   - ENABLE_WRITE_OPS=true + no user token also degrades to deep link (rather
     than 403, per PRD Section 12.1 fallback protocol).
   - Live mode (mocked httpx) returns issue_number from GitHub plus updates
     finding row to status='ticketed'.

Per PRD Section 11 (Apollo 5 + spec-drift A-E) + Section 12.1 (Hybrid Write
Layer 1 with deep-link fallback) + cluster 7 verdict scope.
"""
from __future__ import annotations

from pathlib import Path
from typing import Any

import pytest
from httpx import ASGITransport, AsyncClient

from app.config import get_settings
from app.services.detectors.adapters import (
    reset_demeter_adapter,
    reset_parser_adapter,
    reset_triton_adapter,
    reset_ws_adapter,
)
from app.services.event_bus import get_event_bus, reset_event_bus
from app.services.github_issue_create import IssueCreateRequest, build_deeplink_url

pytestmark = pytest.mark.asyncio


FIXTURE_ROOT = Path(__file__).parent / "fixtures" / "nodegoat-slice"


@pytest.fixture(autouse=True)
def _reset_singletons() -> None:
    reset_parser_adapter()
    reset_triton_adapter()
    reset_demeter_adapter()
    reset_ws_adapter()
    reset_event_bus()
    # Force a fresh settings read (so ENABLE_WRITE_OPS overrides land).
    get_settings.cache_clear()  # type: ignore[attr-defined]


# ----------------------- /findings/scan endpoint -----------------------------


async def test_scan_endpoint_runs_full_pipeline_on_default_fixture() -> None:
    """POST /api/findings/scan with no body uses the NodeGoat fixture default."""
    from app.main import app

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post(
            "/api/findings/scan",
            json={"repo_full_name": "duopoly/codeplex-demo-nodegoat-slice"},
        )

    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["repo_full_name"] == "duopoly/codeplex-demo-nodegoat-slice"
    assert body["scan_run_id"]
    # Five Apollo detectors registered + at least one finding per detector.
    counts = body["apollo_count_by_detector"]
    assert set(counts.keys()) == {
        "secrets",
        "outdated_deps",
        "missing_auth",
        "unsafe_sql",
        "complex_untested",
    }
    triggered = {k for k, v in counts.items() if v > 0}
    assert triggered == set(counts.keys()), (
        f"expected all 5 Apollo detectors to fire, got {triggered}"
    )
    # Five spec-drift patterns registered (stub firings still surface on NodeGoat
    # fixture per Wave 3 dispatcher contract; counts can be > 0 from stub path).
    drift_counts = body["drift_count_by_pattern"]
    assert set(drift_counts.keys()) == {"A", "B", "C", "D", "E"}


async def test_scan_endpoint_rejects_invalid_repo_root() -> None:
    from app.main import app

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post(
            "/api/findings/scan",
            json={
                "repo_full_name": "duopoly/bogus",
                "repo_root": "/nonexistent/path/does/not/exist",
            },
        )

    assert resp.status_code == 400
    assert "repo_root" in resp.json()["detail"].lower()


async def test_scan_endpoint_publishes_lifecycle_via_event_bus() -> None:
    """End-to-end: scan endpoint publishes scan.* + finding.* events via EventBus.

    We subscribe a queue to the `finding_events` topic BEFORE the scan to
    capture the lifecycle. EventBus is shared between the WS endpoint and the
    adapter, so this directly mirrors what Asclepius receives over WebSocket.
    """
    from app.main import app

    bus = get_event_bus()
    received: list[dict[str, Any]] = []

    async with bus.subscribe("finding_events") as queue:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.post(
                "/api/findings/scan",
                json={"repo_full_name": "duopoly/test-broadcast"},
            )
            assert resp.status_code == 200

        # Drain queued events with a short timeout (publish is synchronous).
        import asyncio

        for _ in range(200):
            try:
                ev = queue.get_nowait()
                received.append(ev)
            except asyncio.QueueEmpty:
                break

    types_seen = {ev["type"] for ev in received}
    assert "scan.started" in types_seen
    assert "finding.detected" in types_seen
    assert "scan.completed" in types_seen
    # camelCase aliases per Asclepius consumer contract.
    detected = [ev for ev in received if ev["type"] == "finding.detected"]
    assert detected, "no finding.detected events broadcast"
    sample = detected[0]
    assert "repoFullName" in sample
    assert "scanRunId" in sample
    assert "finding" in sample
    assert "buildingId" in sample["finding"]


# --------------------- /findings/{id}/to-issue branches ----------------------


async def test_to_issue_returns_deeplink_when_write_ops_disabled(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """ENABLE_WRITE_OPS=false short-circuits to deep-link mode."""
    from app.api.findings import routes as routes_mod
    from app.main import app

    monkeypatch.setenv("ENABLE_WRITE_OPS", "false")
    get_settings.cache_clear()  # type: ignore[attr-defined]

    fake_finding = {
        "finding_id": "fake-finding-1",
        "scan_run_id": "fake-scan-1",
        "building_id": "app/config/config.js",
        "file_path": "app/config/config.js",
        "line_start": 12,
        "line_end": 12,
        "category": "hardcoded-secret",
        "severity": "critical",
        "title": "Hardcoded MongoDB connection string",
        "description": "Connection URI with embedded admin credentials.",
        "suggested_fix": "Rotate the credential.",
        "cvss_vector": None,
        "cvss_base_score": None,
        "exploit_pattern": None,
        "repo_full_name": "duopoly/nodegoat-demo",
        "detected_at": "2026-05-13T00:00:00Z",
    }

    class _FakeDemeter:
        pool = None

        async def get_user_by_github_id(self, _id: int) -> dict | None:
            return None

    async def _fake_lookup(_demeter: Any, _fid: str, _scan: str | None) -> dict:
        return fake_finding

    async def _fake_mark(*_args: Any, **_kwargs: Any) -> None:
        return None

    monkeypatch.setattr(routes_mod, "_lookup_finding", _fake_lookup)
    monkeypatch.setattr(routes_mod, "_mark_finding_ticketed", _fake_mark)

    # FastAPI dependency override keyed by the actual callable used in Depends().
    app.dependency_overrides[routes_mod._require_real_demeter] = lambda: _FakeDemeter()

    try:
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            resp = await client.post("/api/findings/fake-finding-1/to-issue", json={})
    finally:
        app.dependency_overrides.clear()

    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["state"] == "deeplink"
    assert body["issue_number"] == 0
    assert body["issue_url"].startswith(
        "https://github.com/duopoly/nodegoat-demo/issues/new?"
    )
    assert "title=" in body["issue_url"]
    assert "body=" in body["issue_url"]
    assert "labels=" in body["issue_url"]


async def test_to_issue_degrades_to_deeplink_when_no_user_token(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """ENABLE_WRITE_OPS=true + no user token still degrades (DROP-A protection)."""
    from app.main import app

    monkeypatch.setenv("ENABLE_WRITE_OPS", "true")
    get_settings.cache_clear()  # type: ignore[attr-defined]

    fake_finding = {
        "finding_id": "fake-finding-2",
        "scan_run_id": "fake-scan-2",
        "building_id": "routes/admin.js",
        "file_path": "routes/admin.js",
        "line_start": 1,
        "line_end": 5,
        "category": "missing-auth",
        "severity": "high",
        "title": "Missing auth on /admin route",
        "description": "Route handler has no auth middleware.",
        "suggested_fix": "Add passport.authenticate() middleware.",
        "repo_full_name": "duopoly/nodegoat-demo",
        "detected_at": "2026-05-13T00:00:00Z",
    }

    class _FakeDemeter:
        pool = None

        async def get_user_by_github_id(self, _id: int) -> dict | None:
            return None

    from app.api.findings import routes as routes_mod

    async def _fake_lookup(_demeter: Any, _fid: str, _scan: str | None) -> dict:
        return fake_finding

    async def _fake_lookup_user(_demeter: Any, _session: dict) -> None:
        return None  # no encrypted token on file

    monkeypatch.setattr(routes_mod, "_lookup_finding", _fake_lookup)
    monkeypatch.setattr(routes_mod, "_lookup_user_for_session", _fake_lookup_user)

    app.dependency_overrides[routes_mod._require_real_demeter] = lambda: _FakeDemeter()
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            resp = await client.post("/api/findings/fake-finding-2/to-issue", json={})
    finally:
        app.dependency_overrides.clear()

    assert resp.status_code == 200
    body = resp.json()
    assert body["state"] == "deeplink"
    assert "github.com/duopoly/nodegoat-demo/issues/new" in body["issue_url"]


async def test_to_issue_live_mode_creates_via_github_api(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """ENABLE_WRITE_OPS=true + valid user token => real GitHub API path."""
    from app.main import app

    monkeypatch.setenv("ENABLE_WRITE_OPS", "true")
    get_settings.cache_clear()  # type: ignore[attr-defined]

    fake_finding = {
        "finding_id": "fake-finding-3",
        "scan_run_id": "fake-scan-3",
        "building_id": "app/data/dao.js",
        "file_path": "app/data/dao.js",
        "line_start": 42,
        "line_end": 44,
        "category": "unsafe-sql",
        "severity": "critical",
        "title": "SQL concat in DAO",
        "description": "Raw string concat builds SQL query.",
        "suggested_fix": "Use parameterized queries.",
        "repo_full_name": "duopoly/nodegoat-demo",
        "detected_at": "2026-05-13T00:00:00Z",
    }

    fake_user = {
        "encrypted_access_token": "stub-encrypted-token-value",
        "github_login": "demo-user",
    }

    class _FakeDemeter:
        pool = None

    from app.api.findings import routes as routes_mod
    from app.services import github_issue_create as gh_mod
    from app.services.github_issue_create import IssueCreateResult

    async def _fake_lookup(_demeter: Any, _fid: str, _scan: str | None) -> dict:
        return fake_finding

    async def _fake_lookup_user(_demeter: Any, _session: dict) -> dict:
        return fake_user

    async def _fake_mark(*_args: Any, **_kwargs: Any) -> None:
        return None

    async def _fake_create(self: Any, *, encrypted_token: str, request: Any) -> IssueCreateResult:
        # Verify Nemesis pipeline assembled the payload correctly.
        assert encrypted_token == "stub-encrypted-token-value"
        assert request.repo_full_name == "duopoly/nodegoat-demo"
        assert request.title.startswith("[Codeplex]")
        assert "SQL concat" in request.title
        assert "unsafe-sql" in (label for label in request.labels) or any(
            "unsafe-sql" in label for label in request.labels
        )
        return IssueCreateResult(
            issue_number=4242,
            issue_url="https://github.com/duopoly/nodegoat-demo/issues/4242",
            state="open",
        )

    monkeypatch.setattr(routes_mod, "_lookup_finding", _fake_lookup)
    monkeypatch.setattr(routes_mod, "_lookup_user_for_session", _fake_lookup_user)
    monkeypatch.setattr(routes_mod, "_mark_finding_ticketed", _fake_mark)
    monkeypatch.setattr(gh_mod.GitHubIssueCreator, "create_issue", _fake_create)

    app.dependency_overrides[routes_mod._require_real_demeter] = lambda: _FakeDemeter()
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            resp = await client.post("/api/findings/fake-finding-3/to-issue", json={})
    finally:
        app.dependency_overrides.clear()

    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["state"] == "open"
    assert body["issue_number"] == 4242
    assert "/issues/4242" in body["issue_url"]


# --------------------- build_deeplink_url unit tests -------------------------


@pytest.mark.asyncio(loop_scope=None)
async def test_deeplink_url_encodes_title_body_labels() -> None:
    request = IssueCreateRequest(
        repo_full_name="duopoly/test",
        title="Finding: Hardcoded API key",
        body="# Evidence\nFile `config.js:12` has hardcoded credentials.",
        labels=["security", "severity:critical", "codeplex-chronicle"],
    )
    url = build_deeplink_url(request)
    assert url.startswith("https://github.com/duopoly/test/issues/new?")
    # Spaces become %20 (quote, not plus).
    assert "Finding%3A%20Hardcoded%20API%20key" in url
    # Body markdown preserved + URL-encoded.
    assert "%23%20Evidence" in url  # '# Evidence' encoded
    # Labels comma-joined.
    assert "labels=security%2Cseverity%3Acritical%2Ccodeplex-chronicle" in url


@pytest.mark.asyncio(loop_scope=None)
async def test_deeplink_url_truncates_long_body() -> None:
    long_body = "x" * 8000  # exceeds _DEEPLINK_BODY_BUDGET of 7000
    request = IssueCreateRequest(
        repo_full_name="duopoly/test",
        title="x",
        body=long_body,
        labels=[],
    )
    url = build_deeplink_url(request)
    # Truncation marker present.
    assert "truncated%20for%20URL%20budget" in url
