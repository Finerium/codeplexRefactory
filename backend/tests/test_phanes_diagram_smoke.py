"""Phanes diagram pipeline smoke tests (Wave-Fixing #2 cycle 1).

Verifies Bug #11 rescue ship criteria:
1. DiagramArtifact types validate Pydantic shape
2. DiagramService.generate produces non-empty artifact for demo repo
3. 3 SVG blobs present + base64-decodable + non-trivial size
4. GET /api/diagram/repos lists demo
5. GET /api/diagram/demo returns 200 + artifact JSON
6. POST /api/diagram/demo/refresh emits diagram_events WS event
"""
from __future__ import annotations

import base64
import os

import pytest
from fastapi.testclient import TestClient


# Disable Demeter real Postgres pool for these smoke tests (no DB needed).
os.environ.setdefault("DEMETER_DISABLE_REAL", "1")


@pytest.fixture(autouse=True)
def _reset_diagram_singleton():
    """Drop diagram + parser service singletons before each test.

    Manager FINAL Cycle 2: parser holds an asyncio.Semaphore bound to the
    event loop of the first async caller; under TestClient (sync) each test
    spins a fresh loop, so the singleton must reset too or the second test
    raises `bound to a different event loop`.
    """
    from app.services.diagram import reset_diagram_service
    from app.parsers.service import reset_parser_service

    reset_diagram_service()
    reset_parser_service()
    yield
    reset_diagram_service()
    reset_parser_service()


def test_diagram_types_pydantic_shape():
    """DiagramNode + DiagramEdge + DiagramArtifact validate."""
    from app.services.diagram.types import DiagramArtifact, DiagramEdge, DiagramNode

    node = DiagramNode(
        id="app/main.py",
        label="main.py",
        type="file",
        metadata={"loc": 120, "module": "app"},
    )
    assert node.id == "app/main.py"
    assert node.metadata["loc"] == 120

    edge = DiagramEdge(src="app/main.py", dst="app/config.py", kind="import", weight=2.0)
    assert edge.kind == "import"
    assert edge.weight == 2.0

    art = DiagramArtifact(
        repo_id="demo",
        generated_at_iso="2026-05-13T03:14:00+00:00",
        nodes=[node],
        edges=[edge],
        svg_blobs={"architecture": "", "dependency": "", "erd": ""},
        stats={"nodes": 1, "edges": 1},
    )
    assert art.schema_version == "v1.0"
    assert len(art.nodes) == 1


@pytest.mark.asyncio
async def test_diagram_service_generate_demo_nonempty():
    """DiagramService.generate('demo') returns non-empty artifact."""
    from app.services.diagram import get_diagram_service

    svc = get_diagram_service()
    assert "demo" in svc.list_repos()

    artifact = await svc.generate("demo", force=True)

    # demo repo = backend/ itself: must yield non-trivial node count.
    assert len(artifact.nodes) > 5, (
        f"expected >5 nodes for backend/ scan; got {len(artifact.nodes)}"
    )
    # SVG blobs present for all 3 renderers.
    assert set(artifact.svg_blobs.keys()) == {"architecture", "dependency", "erd"}
    # Each blob is non-trivially sized (>200 bytes after base64 decode).
    for key, b64 in artifact.svg_blobs.items():
        raw = base64.b64decode(b64)
        assert len(raw) > 200, f"blob {key} too small: {len(raw)} bytes"
        # Must start with SVG signal (either <?xml or <svg).
        assert raw[:5] in (b"<?xml", b"<svg ", b"<svg>"), (
            f"blob {key} not SVG-shaped: {raw[:32]!r}"
        )


@pytest.mark.asyncio
async def test_diagram_service_unknown_repo_404_marker():
    """Unknown repo_id yields render_errors=['repo_not_registered']."""
    from app.services.diagram import get_diagram_service

    svc = get_diagram_service()
    artifact = await svc.generate("nonexistent-repo-xyz", force=True)
    assert artifact.render_errors == ["repo_not_registered"]
    assert artifact.nodes == []


@pytest.mark.asyncio
async def test_diagram_service_cache_hit_returns_same_artifact():
    """Cache: same repo_id within TTL returns same artifact object."""
    from app.services.diagram import get_diagram_service

    svc = get_diagram_service()
    a = await svc.generate("demo", force=False)
    b = await svc.generate("demo", force=False)
    # Same instance from cache (frozen Pydantic model identity check).
    assert a is b


def test_http_get_diagram_demo_returns_200():
    """GET /api/diagram/demo HTTP integration."""
    from app.main import create_app

    app = create_app()
    client = TestClient(app)
    resp = client.get("/api/diagram/demo")
    assert resp.status_code == 200, f"unexpected: {resp.status_code} {resp.text[:200]}"
    body = resp.json()
    assert body["repo_id"] == "demo"
    assert body["schema_version"] == "v1.0"
    assert len(body["nodes"]) > 5
    assert "architecture" in body["svg_blobs"]


def test_http_get_diagram_invalid_repo_id_400():
    """Path traversal / slash injection rejected."""
    from app.main import create_app

    app = create_app()
    client = TestClient(app)
    resp = client.get("/api/diagram/..")
    # Either 400 (our validator) or 404 (FastAPI's path matcher); both reject.
    assert resp.status_code in (400, 404)


def test_http_list_repos():
    """GET /api/diagram/repos lists demo at minimum."""
    from app.main import create_app

    app = create_app()
    client = TestClient(app)
    resp = client.get("/api/diagram/repos")
    assert resp.status_code == 200
    body = resp.json()
    assert "demo" in body["repos"]


def test_ws_diagram_events_pushes_refresh_payload():
    """WebSocket /api/ws/diagram-events receives refresh event."""
    from app.main import create_app

    app = create_app()
    client = TestClient(app)
    with client.websocket_connect("/api/ws/diagram-events") as ws:
        # Trigger refresh in same client (HTTP) to publish to event bus.
        resp = client.post("/api/diagram/demo/refresh")
        assert resp.status_code == 200
        # Receive published event. Bus delivers JSON dict.
        event = ws.receive_json()
        assert event["kind"] == "diagram-update"
        assert event["repo_id"] == "demo"
        assert event["schema_version"].startswith("v1.")


def test_http_get_diagram_refresh_query_busts_cache():
    """GET /api/diagram/demo?refresh=true forces regenerate + emits WS event.

    Manager FINAL Cycle 2 (D-Phanes-MF2-01): single-call cache-bust path
    for the Selene dashboard Refresh button (avoids POST + GET roundtrip).

    Uses a single `with TestClient(app)` context per fetch so the event-loop
    handle is consistent (parser singleton holds an asyncio.Semaphore bound
    to whichever loop first invoked it). Resetting between calls avoids the
    'bound to a different event loop' singleton trap.
    """
    from app.main import create_app
    from app.services.diagram import reset_diagram_service
    from app.parsers.service import reset_parser_service

    # First call: cold cache, baseline timestamp.
    app1 = create_app()
    with TestClient(app1) as client1:
        resp1 = client1.get("/api/diagram/demo")
        assert resp1.status_code == 200
        gen_iso_1 = resp1.json()["generated_at_iso"]

    # Allow sub-second timestamp granularity to advance.
    import time as _time

    _time.sleep(1.05)

    # Reset singletons before second TestClient so the parser semaphore
    # rebinds to the second TestClient's event loop.
    reset_diagram_service()
    reset_parser_service()

    # Second call: refresh query MUST regenerate (different timestamp).
    app2 = create_app()
    with TestClient(app2) as client2:
        resp2 = client2.get("/api/diagram/demo?refresh=true")
        assert resp2.status_code == 200
        gen_iso_2 = resp2.json()["generated_at_iso"]
    assert gen_iso_2 != gen_iso_1, (
        f"refresh=true did not regenerate: {gen_iso_1} == {gen_iso_2}"
    )


def test_ws_diagram_events_pushes_get_refresh_query_payload():
    """WebSocket receives `diagram-update` when GET ?refresh=true fires.

    Symmetric with the POST /refresh path. Confirms either trigger feeds
    the same WS topic so the frontend can react identically.
    """
    from app.main import create_app

    app = create_app()
    with TestClient(app) as client:
        with client.websocket_connect("/api/ws/diagram-events") as ws:
            resp = client.get("/api/diagram/demo?refresh=true")
            assert resp.status_code == 200
            event = ws.receive_json()
            assert event["kind"] == "diagram-update"
            assert event["repo_id"] == "demo"
            assert event["schema_version"].startswith("v1.")


def test_http_get_diagram_canned_variants_are_distinct():
    """Pan reactive Cluster B (Bug #8): fastapi-fullstack / nodegoat / pygoat
    each yield a distinct artifact (different stats + different node topology).

    Hafiz Bug #8 verbatim: "Data di dashboard sama untuk seluruh repo ...
    expected: setiap repo diagramnya berbeda". Canned variants ship Phase 1;
    real per-repo parser generation is the Phase 2 roadmap.
    """
    from app.main import create_app

    app = create_app()
    with TestClient(app) as client:
        bodies: dict[str, dict] = {}
        for slug in ("fastapi-fullstack", "nodegoat", "pygoat"):
            r = client.get(f"/api/diagram/{slug}")
            assert r.status_code == 200, f"{slug}: {r.status_code} {r.text[:200]}"
            body = r.json()
            assert body["schema_version"].startswith("v1.")
            assert body["repo_id"] == slug
            # Honest claim marker present (Lock 5 disclosure).
            assert any(
                e.startswith("canned_variant_demo:") for e in body["render_errors"]
            ), f"missing canned marker for {slug}: {body['render_errors']}"
            assert len(body["nodes"]) >= 5, f"{slug} should have nodes"
            assert len(body["edges"]) >= 5, f"{slug} should have edges"
            assert set(body["svg_blobs"].keys()) == {
                "architecture",
                "dependency",
                "erd",
            }
            bodies[slug] = body

        # Stats must be distinct across all three.
        stats_set = {tuple(sorted(b["stats"].items())) for b in bodies.values()}
        assert len(stats_set) == 3, (
            f"canned variants share stats (Bug #8 regression): {stats_set}"
        )
        # First-node id must differ (topology divergence).
        first_node_ids = {b["nodes"][0]["id"] for b in bodies.values()}
        assert len(first_node_ids) == 3, (
            f"canned variants share first-node id: {first_node_ids}"
        )


def test_http_list_repos_includes_canned_slugs():
    """GET /api/diagram/repos surfaces canned demo slugs for dashboard dropdown."""
    from app.main import create_app

    app = create_app()
    with TestClient(app) as client:
        r = client.get("/api/diagram/repos")
        assert r.status_code == 200
        repos = set(r.json()["repos"])
        for slug in ("demo", "fastapi-fullstack", "nodegoat", "pygoat"):
            assert slug in repos, f"missing {slug} in {repos}"


def test_http_post_simulate_returns_canned_2fa_payload():
    """POST /api/diagram/<repo>/simulate returns canned 2FA Service stub.

    Mentor masukan: Engineering Insights view "what if I add 2FA" should
    return a diagram delta with PROPOSED nodes/edges + explanation. Phase 1
    canned stub: regardless of user_intent, returns the 2FA example.
    """
    from app.main import create_app

    app = create_app()
    with TestClient(app) as client:
        r = client.post(
            "/api/diagram/fastapi-fullstack/simulate",
            json={"user_intent": "add 2FA service"},
        )
        assert r.status_code == 200, r.text[:200]
        body = r.json()
        # Schema: base_diagram + proposed_nodes + proposed_edges + explanation.
        assert "base_diagram" in body
        assert body["base_diagram"]["schema_version"].startswith("v1.")
        assert isinstance(body["proposed_nodes"], list)
        assert isinstance(body["proposed_edges"], list)
        assert len(body["proposed_nodes"]) >= 1
        assert len(body["proposed_edges"]) >= 1
        # 2FA canned content present.
        first = body["proposed_nodes"][0]
        assert first["id"] == "two-factor-auth-service"
        assert first["proposed"] is True
        # Edges carry `from` / `to` / `proposed`.
        e0 = body["proposed_edges"][0]
        assert "from" in e0 and "to" in e0 and e0["proposed"] is True
        # Honest claim disclosure (Lock 5).
        assert body.get("canned_stub") is True
        assert body.get("canned_marker") == "phanes_simulate_canned_v1"
        assert isinstance(body["explanation"], str) and body["explanation"]


def test_http_post_simulate_unknown_repo_returns_404():
    """POST /simulate on an unregistered repo yields 404."""
    from app.main import create_app

    app = create_app()
    with TestClient(app) as client:
        r = client.post(
            "/api/diagram/unknown-repo-xyz/simulate",
            json={"user_intent": "anything"},
        )
        assert r.status_code == 404


@pytest.mark.asyncio
async def test_diagram_service_edges_nonempty_for_backend():
    """Edge resolver picks up intra-repo imports (Python 'from X import Y')."""
    from app.services.diagram import get_diagram_service

    svc = get_diagram_service()
    artifact = await svc.generate("demo", force=True)
    # backend/ has many `from app.* import *` statements; expect >20 edges.
    assert len(artifact.edges) > 20, (
        f"expected >20 edges; got {len(artifact.edges)}. "
        f"Edge resolver may be too strict."
    )
    # All edges reference valid node ids.
    node_ids = {n.id for n in artifact.nodes}
    for e in artifact.edges:
        assert e.src in node_ids, f"edge src not in nodes: {e.src}"
        assert e.dst in node_ids, f"edge dst not in nodes: {e.dst}"
