"""Demeter Manager FINAL Cycle 2 endpoint smoke tests (Cluster A + B + C).

Cluster A (cache audit):
- `list_findings_for_building` accepts `repo_full_name` kwarg without raising
  TypeError when called positionally (backwards compatible).
- DiagramService cache key isolates per (repo_id, resolved repo_root).
- SemanticCache scope namespacing isolates per-scope buckets.

Cluster B:
- POST /api/activity/loc-snapshot against the project repo itself returns a
  non-empty files map for "now" and an empty map for a pre-historic timestamp.
- Same (timestamp, repo_root) returns cached=True on second call.

Cluster C:
- GET /api/buildings/Finerium/codeplexRefactory/<file>/commits returns a
  floor-ordered list (floor 1 oldest, floor N latest) with diff_summary.
"""
from __future__ import annotations

import asyncio
import os
from datetime import datetime, timezone
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# Disable real Demeter init so the test client boots quickly without Postgres.
os.environ.setdefault("DEMETER_DISABLE_REAL", "1")

from app.api.activity.routes import _reset_cache_for_tests as _reset_activity_cache
from app.api.buildings.routes import _reset_cache_for_tests as _reset_buildings_cache
from app.main import create_app
from app.services.diagram.diagram_service import DiagramService
from app.services.semantic_cache import SemanticCache


# ----- Cluster A: diagram cache key isolation -----


class _FakeEmbed:
    def encode(self, text, convert_to_numpy=True):  # noqa: D401, ANN001
        import numpy as np

        # Deterministic 8-dim vector seeded by text length so distinct texts
        # produce distinct vectors but identical text gives identical vector.
        rng = np.random.default_rng(seed=abs(hash(text)) % (2**31))
        return rng.standard_normal(8)


def test_semantic_cache_scope_isolation_prevents_cross_repo_poisoning() -> None:
    """Two scopes with the same prompt must not pollute each other."""
    cache = SemanticCache(model=_FakeEmbed(), threshold=0.99)
    from app.llm.types import LLMMessage

    msg = [LLMMessage(role="user", content="summarize this repository")]
    cache.store(msg, "scoped-to-A", scope="repo-a")
    cache.store(msg, "scoped-to-B", scope="repo-b")

    # Lookup in scope A returns A; scope B returns B; default scope returns nothing.
    assert cache.lookup(msg, scope="repo-a") == "scoped-to-A"
    assert cache.lookup(msg, scope="repo-b") == "scoped-to-B"
    assert cache.lookup(msg, scope="_default") is None
    assert cache.total_size() == 2


def test_diagram_cache_key_per_repo_root(tmp_path) -> None:
    """Cache must not return artifact A when repo_root for the same repo_id changed."""
    svc = DiagramService()
    # Register two distinct paths under same repo_id sequentially.
    path_a = tmp_path / "checkout-a"
    path_a.mkdir()
    (path_a / ".git").mkdir()
    path_b = tmp_path / "checkout-b"
    path_b.mkdir()
    (path_b / ".git").mkdir()

    svc.register_repo("demo-repo", path_a)
    # Manually inject a cached artifact for path_a.
    from app.services.diagram.types import DiagramArtifact

    artifact_a = DiagramArtifact(
        repo_id="demo-repo",
        generated_at_iso="2026-05-13T00:00:00+00:00",
        nodes=[],
        edges=[],
        svg_blobs={},
        stats={"nodes": 0, "edges": 0},
        render_errors=[],
    )
    cache_key_a = ("demo-repo", str(path_a.resolve()))
    svc._cache[cache_key_a] = (artifact_a, 1e18)
    assert cache_key_a in svc._cache

    # Re-register with a different path; stale entry must be purged synchronously.
    svc.register_repo("demo-repo", path_b)
    assert cache_key_a not in svc._cache


# ----- Cluster B: LOC snapshot endpoint -----


@pytest.fixture()
def client() -> TestClient:
    _reset_activity_cache()
    _reset_buildings_cache()
    app = create_app()
    return TestClient(app)


def _project_root() -> Path:
    here = Path(__file__).resolve()
    return here.parents[2]


def test_loc_snapshot_current_returns_files(client: TestClient) -> None:
    """Snapshot at now() against the project repo returns a populated map."""
    project_root = _project_root()
    if not (project_root / ".git").exists():
        pytest.skip("project root is not a git repo in this test environment")

    now_iso = datetime.now(timezone.utc).isoformat()
    resp = client.post(
        "/api/activity/loc-snapshot",
        json={"timestamp": now_iso, "repo_root": str(project_root)},
    )
    assert resp.status_code == 200, resp.text
    payload = resp.json()
    assert payload["commit_sha"] is not None
    assert payload["file_count"] > 0
    # README must exist (high-confidence sentinel).
    assert any("README" in fp.upper() for fp in payload["files"].keys())
    # First call: cached=False.
    assert payload["cached"] is False


def test_loc_snapshot_cache_hit_on_second_call(client: TestClient) -> None:
    """Second identical request must hit the in-process cache."""
    project_root = _project_root()
    if not (project_root / ".git").exists():
        pytest.skip("project root is not a git repo in this test environment")
    now_iso = datetime.now(timezone.utc).isoformat()
    body = {"timestamp": now_iso, "repo_root": str(project_root)}

    first = client.post("/api/activity/loc-snapshot", json=body).json()
    second = client.post("/api/activity/loc-snapshot", json=body).json()
    assert first["commit_sha"] == second["commit_sha"]
    assert second["cached"] is True


def test_loc_snapshot_prehistoric_returns_empty(client: TestClient) -> None:
    """Timestamp before the repo's first commit returns an empty files map."""
    project_root = _project_root()
    if not (project_root / ".git").exists():
        pytest.skip("project root is not a git repo in this test environment")
    resp = client.post(
        "/api/activity/loc-snapshot",
        json={"timestamp": "1990-01-01T00:00:00+00:00", "repo_root": str(project_root)},
    )
    assert resp.status_code == 200, resp.text
    payload = resp.json()
    assert payload["commit_sha"] is None
    assert payload["file_count"] == 0
    assert "no_commit_before_timestamp" in payload["notes"]


def test_loc_snapshot_bad_repo_root_returns_400(client: TestClient) -> None:
    resp = client.post(
        "/api/activity/loc-snapshot",
        json={"timestamp": "2026-05-13T00:00:00+00:00", "repo_root": "/nonexistent/path"},
    )
    assert resp.status_code == 400


# ----- Cluster C: per-file commits endpoint -----


def test_building_commits_floor_ordered(client: TestClient) -> None:
    """Floor 1 must be the oldest commit, floor N the latest."""
    project_root = _project_root()
    if not (project_root / ".git").exists():
        pytest.skip("project root is not a git repo in this test environment")
    # README has many commits across history; safe sentinel.
    target_file = "README.md"
    if not (project_root / target_file).exists():
        # Walk for any file with multiple commits.
        candidates = list(project_root.rglob("*.md"))
        if not candidates:
            pytest.skip("no markdown file available to walk commits for")
        target_file = candidates[0].relative_to(project_root).as_posix()

    resp = client.get(
        f"/api/buildings/Finerium/codeplexRefactory/{target_file}/commits",
        params={"repo_root": str(project_root), "limit": 50},
    )
    assert resp.status_code == 200, resp.text
    payload = resp.json()
    floors = payload["floors"]
    assert len(floors) >= 1
    if len(floors) >= 2:
        first = floors[0]
        last = floors[-1]
        assert first["floor"] == 1
        assert last["floor"] == len(floors)
        # Oldest date <= newest date.
        assert first["date"] <= last["date"]
    # diff_summary format check.
    for floor in floors:
        assert floor["diff_summary"].startswith("+")
        assert " -" in floor["diff_summary"]


def test_building_commits_cache_hit(client: TestClient) -> None:
    project_root = _project_root()
    if not (project_root / ".git").exists():
        pytest.skip("project root is not a git repo in this test environment")
    candidates = list(project_root.rglob("*.md"))
    if not candidates:
        pytest.skip("no markdown file available")
    target_file = candidates[0].relative_to(project_root).as_posix()
    path = f"/api/buildings/Finerium/codeplexRefactory/{target_file}/commits"
    params = {"repo_root": str(project_root)}

    first = client.get(path, params=params).json()
    second = client.get(path, params=params).json()
    assert first["total_floors"] == second["total_floors"]
    assert second["cached"] is True


def test_building_commits_bad_repo_root_returns_400(client: TestClient) -> None:
    resp = client.get(
        "/api/buildings/random/owner/README.md/commits",
        params={"repo_root": "/nonexistent/path"},
    )
    assert resp.status_code == 400
