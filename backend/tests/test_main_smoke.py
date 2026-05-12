"""Smoke test: FastAPI app boots + /health + / + /api/docs render."""
from __future__ import annotations


def test_health_endpoint(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["service"] == "hades-backend"


def test_root_endpoint(client):
    resp = client.get("/")
    assert resp.status_code == 200
    body = resp.json()
    assert body["owner"] == "Hades Wave 3"


def test_openapi_schema_includes_4_route_groups(client):
    resp = client.get("/api/openapi.json")
    assert resp.status_code == 200
    schema = resp.json()
    paths = schema.get("paths", {})
    # Auth group.
    assert "/api/auth/github/start" in paths
    assert "/api/auth/github/callback" in paths
    assert "/api/auth/github/session" in paths
    # Webhook group.
    assert "/api/webhook/github" in paths
    # Parser group.
    assert "/api/parser/parse-repo" in paths
    assert "/api/parser/parse-file" in paths
    assert "/api/parser/query-tree" in paths
