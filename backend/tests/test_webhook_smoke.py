"""Webhook HMAC + dispatch smoke (Hades Wave 3)."""
from __future__ import annotations

import hashlib
import hmac
import json


def _sign(secret: str, body: bytes) -> str:
    """Generate X-Hub-Signature-256 header value."""
    sig = hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()
    return f"sha256={sig}"


def test_webhook_rejects_missing_signature(client):
    resp = client.post(
        "/api/webhook/github",
        json={"action": "opened"},
    )
    assert resp.status_code == 401


def test_webhook_rejects_bad_signature(client):
    body_bytes = json.dumps({"action": "opened"}).encode("utf-8")
    resp = client.post(
        "/api/webhook/github",
        content=body_bytes,
        headers={
            "X-Hub-Signature-256": "sha256=" + ("0" * 64),
            "X-GitHub-Event": "pull_request",
            "Content-Type": "application/json",
        },
    )
    assert resp.status_code == 401


def test_webhook_accepts_valid_signature(client, monkeypatch):
    from app.config import get_settings

    settings = get_settings()
    body = {
        "action": "opened",
        "repository": {"full_name": "Finerium/codeplexRefactory"},
        "pull_request": {
            "number": 42,
            "title": "test PR",
            "html_url": "https://github.com/Finerium/codeplexRefactory/pull/42",
            "user": {"login": "ghaisan"},
            "_files_changed": ["frontend/app/city/page.tsx"],
        },
    }
    body_bytes = json.dumps(body).encode("utf-8")
    sig = _sign(settings.GITHUB_WEBHOOK_SECRET, body_bytes)

    resp = client.post(
        "/api/webhook/github",
        content=body_bytes,
        headers={
            "X-Hub-Signature-256": sig,
            "X-GitHub-Event": "pull_request",
            "X-GitHub-Delivery": "test-delivery-001",
            "Content-Type": "application/json",
        },
    )
    assert resp.status_code == 200, resp.text
    j = resp.json()
    assert j["received"] is True
    assert j["delivery_id"] == "test-delivery-001"
    assert j["events"] == 1
    assert j["duplicate"] is False


def test_webhook_dedup_returns_duplicate_flag(client):
    from app.config import get_settings

    settings = get_settings()
    body = {
        "action": "opened",
        "repository": {"full_name": "Finerium/codeplexRefactory"},
        "pull_request": {
            "number": 43,
            "title": "test PR 2",
            "html_url": "x",
            "user": {"login": "ghaisan"},
            "_files_changed": ["a.py"],
        },
    }
    body_bytes = json.dumps(body).encode("utf-8")
    sig = _sign(settings.GITHUB_WEBHOOK_SECRET, body_bytes)
    headers = {
        "X-Hub-Signature-256": sig,
        "X-GitHub-Event": "pull_request",
        "X-GitHub-Delivery": "test-delivery-dedup-001",
        "Content-Type": "application/json",
    }
    r1 = client.post("/api/webhook/github", content=body_bytes, headers=headers)
    assert r1.status_code == 200
    assert r1.json()["duplicate"] is False
    r2 = client.post("/api/webhook/github", content=body_bytes, headers=headers)
    assert r2.status_code == 200
    assert r2.json()["duplicate"] is True


def test_webhook_persists_via_demeter_stub(client):
    from app.config import get_settings
    from app.services.demeter_service import get_demeter_service

    settings = get_settings()
    body = {
        "action": "opened",
        "repository": {"full_name": "Finerium/codeplexRefactory"},
        "pull_request": {
            "number": 99,
            "title": "demeter persist test",
            "html_url": "x",
            "user": {"login": "ghaisan"},
            "_files_changed": ["x.py", "y.py"],
        },
    }
    body_bytes = json.dumps(body).encode("utf-8")
    sig = _sign(settings.GITHUB_WEBHOOK_SECRET, body_bytes)
    resp = client.post(
        "/api/webhook/github",
        content=body_bytes,
        headers={
            "X-Hub-Signature-256": sig,
            "X-GitHub-Event": "pull_request",
            "X-GitHub-Delivery": "test-delivery-persist-001",
            "Content-Type": "application/json",
        },
    )
    assert resp.status_code == 200
    # Two files -> two BuildingEvents -> two persist calls
    demeter = get_demeter_service()
    assert hasattr(demeter, "persist_calls")
    assert len(demeter.persist_calls) == 2  # type: ignore[attr-defined]
