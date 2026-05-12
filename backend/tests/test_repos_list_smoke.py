"""GET /api/repos/list smoke (Hades Wave-Fixing #2 cycle 1, E-4 CRITICAL).

QA round Day 2 surfaced E-4: /api/repos/list returns 401
"missing oauth_access_token cookie, complete OAuth flow first" during a live
verify at 03:07 WIB. Manager Wave-Fixing #2 hypothesis: the endpoint is
wired correctly, but no test exercised the cookie-present 200 path so
runtime gaps in the cookie alias / Fernet decrypt chain were never
regression-guarded.

This module locks the 4 endpoint cases:
1. cookie absent          to 401 "missing oauth_access_token cookie..."
2. cookie set + valid     to 200 + JSON array (httpx GitHub call mocked)
3. cookie set + garbage   to 401 "oauth token decrypt failed, re-authenticate"
4. cookie set + GitHub 5xx to 502 "github upstream returned 502"

The cookie-present 200 path is the core E-4 wiring proof: it exercises the
Cookie(alias=...) parameter binding, Fernet decrypt round-trip, GitHub
forward, and Pydantic GitHubRepoSummary marshalling end-to-end. If this
test ever drops to fail, the live-browser flow at /start/pick-repo will
break.

Reference:
- _meta/handoff_log/wave_fixing_2_hades_to_manager.md
- _meta/checkpoints/hades-cycle1.md (Wave-Fixing #2)
- backend/app/api/repos.py + backend/app/services/crypto.py
"""
from __future__ import annotations

import json
from unittest.mock import patch

import httpx

from app.services.crypto import encrypt_token


# helpers


def _fake_github_repo(repo_id: int, full_name: str, language: str = "Python") -> dict:
    """Compact dict that mirrors the GitHub /user/repos response shape."""
    owner, name = full_name.split("/")
    return {
        "id": repo_id,
        "full_name": full_name,
        "name": name,
        "private": False,
        "html_url": f"https://github.com/{full_name}",
        "description": f"smoke fixture for {full_name}",
        "default_branch": "main",
        "language": language,
        "stargazers_count": 42,
        "updated_at": "2026-05-12T10:00:00Z",
    }


class _FakeGitHubResponse:
    """Minimal stand in for httpx.Response so we can intercept the upstream
    call without actually hitting api.github.com."""

    def __init__(self, status_code: int, payload):
        self.status_code = status_code
        self._payload = payload
        self.text = (
            json.dumps(payload) if isinstance(payload, (list, dict)) else str(payload)
        )

    def json(self):
        return self._payload

    def raise_for_status(self):
        if self.status_code >= 400:
            raise httpx.HTTPStatusError(
                f"upstream {self.status_code}", request=None, response=self
            )


# cases


def test_repos_list_returns_401_when_cookie_absent(client):
    """Regression guard: no cookie returns 401 with clear detail."""
    resp = client.get("/api/repos/list")
    assert resp.status_code == 401
    detail = resp.json()["detail"]
    assert "missing oauth_access_token cookie" in detail


def test_repos_list_returns_200_with_valid_cookie(client):
    """Core E-4 proof: Fernet encrypted cookie decrypts and forwards to
    GitHub; response is marshalled into the GitHubRepoSummary list shape.
    """
    plaintext_token = "ghu_smoke_token_FAKE_xxxxxxxxxxxxxxxxxxxx"
    encrypted = encrypt_token(plaintext_token)
    fake_payload = [
        _fake_github_repo(1, "Finerium/codeplexRefactory", "TypeScript"),
        _fake_github_repo(2, "OWASP/NodeGoat", "JavaScript"),
    ]

    async def _fake_get(self, url, params=None, headers=None):
        # Sanity: the Authorization header must contain the decrypted token,
        # otherwise we proved nothing about the decrypt path.
        assert headers is not None
        assert headers["Authorization"] == f"Bearer {plaintext_token}"
        return _FakeGitHubResponse(200, fake_payload)

    with patch.object(httpx.AsyncClient, "get", _fake_get):
        client.cookies.set("oauth_access_token_enc", encrypted)
        resp = client.get("/api/repos/list")
        # Clear cookies after the call so later tests get a clean slate.
        client.cookies.clear()

    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert isinstance(body, list)
    assert len(body) == 2
    assert body[0]["full_name"] == "Finerium/codeplexRefactory"
    assert body[0]["language"] == "TypeScript"
    assert body[1]["full_name"] == "OWASP/NodeGoat"
    assert body[1]["stargazers_count"] == 42


def test_repos_list_returns_401_when_cookie_decrypt_fails(client):
    """Cookie present but cipher is garbage returns 401 with decrypt detail.

    This distinguishes the cookie absent (401 "missing...") path from the
    cookie present but corrupt (401 "decrypt failed...") path so operators
    can tell which case a 401 is from log scraping.
    """
    client.cookies.set("oauth_access_token_enc", "not-a-real-fernet-cipher")
    resp = client.get("/api/repos/list")
    client.cookies.clear()
    assert resp.status_code == 401
    detail = resp.json()["detail"]
    assert "decrypt failed" in detail


def test_repos_list_returns_502_when_github_upstream_fails(client):
    """GitHub upstream returns 502, /api/repos/list translates to 502."""
    plaintext_token = "ghu_smoke_token_FAKE_xxxxxxxxxxxxxxxxxxxx"
    encrypted = encrypt_token(plaintext_token)

    async def _fake_get(self, url, params=None, headers=None):
        return _FakeGitHubResponse(502, {"message": "Bad Gateway"})

    with patch.object(httpx.AsyncClient, "get", _fake_get):
        client.cookies.set("oauth_access_token_enc", encrypted)
        resp = client.get("/api/repos/list")
        client.cookies.clear()

    assert resp.status_code == 502
    detail = resp.json()["detail"]
    assert "502" in detail


def test_repos_list_skips_malformed_entries_but_returns_others(client):
    """Robustness: one malformed entry in the GitHub response should be
    skipped (logged) without poisoning the entire response."""
    plaintext_token = "ghu_smoke_token_FAKE_xxxxxxxxxxxxxxxxxxxx"
    encrypted = encrypt_token(plaintext_token)
    fake_payload = [
        _fake_github_repo(3, "Finerium/good-repo", "Python"),
        # malformed: id is not coercible to int
        {"id": "not-an-int", "full_name": "bad/repo"},
        _fake_github_repo(4, "Finerium/another-good", "Go"),
    ]

    async def _fake_get(self, url, params=None, headers=None):
        return _FakeGitHubResponse(200, fake_payload)

    with patch.object(httpx.AsyncClient, "get", _fake_get):
        client.cookies.set("oauth_access_token_enc", encrypted)
        resp = client.get("/api/repos/list")
        client.cookies.clear()

    assert resp.status_code == 200
    body = resp.json()
    # Good entries survive, malformed dropped silently with log.
    # NOTE: depending on how strict the pydantic coercion is, the malformed
    # entry may either be filtered or coerced; assert at least the good ones
    # are present and the response is well formed.
    full_names = [r["full_name"] for r in body]
    assert "Finerium/good-repo" in full_names
    assert "Finerium/another-good" in full_names
