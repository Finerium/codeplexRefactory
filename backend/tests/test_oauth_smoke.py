"""OAuth real-flow smoke (Hades Wave 3).

Validates:
- /api/auth/github/start returns 302 to github.com authorize URL with all
  required query params (client_id, scope, state, code_challenge, S256)
- callback handles state mismatch by redirecting /start?error=csrf
- callback handles error param by redirecting /start?error=<...>
- /api/auth/github/session returns 401 without cookie
"""
from __future__ import annotations

from urllib.parse import parse_qs, urlparse


def test_oauth_start_302_to_github(client):
    resp = client.get("/api/auth/github/start", follow_redirects=False)
    assert resp.status_code == 302
    loc = resp.headers["location"]
    parsed = urlparse(loc)
    assert parsed.netloc == "github.com"
    assert parsed.path == "/login/oauth/authorize"
    q = parse_qs(parsed.query)
    assert q["client_id"][0].startswith("Ov23")
    # scope minimal per PRD 19.3
    scope = q["scope"][0]
    for must in ("read:repo", "read:org", "read:issues", "read:pull_requests", "write:issues"):
        assert must in scope
    # state CSRF cookie present
    assert "state" in q and len(q["state"][0]) >= 16
    # PKCE
    assert q["code_challenge_method"][0] == "S256"
    assert len(q["code_challenge"][0]) >= 32
    # cookies set
    cookies = resp.cookies.jar
    cookie_names = {c.name for c in cookies}
    assert "oauth_state" in cookie_names
    assert "oauth_verifier" in cookie_names


def test_oauth_callback_csrf_mismatch_redirects(client):
    # No state cookie set so any state will mismatch.
    resp = client.get(
        "/api/auth/github/callback?code=fake&state=mismatch",
        follow_redirects=False,
    )
    assert resp.status_code == 302
    assert "error=csrf" in resp.headers["location"]


def test_oauth_callback_error_param_redirects(client):
    resp = client.get(
        "/api/auth/github/callback?error=access_denied",
        follow_redirects=False,
    )
    assert resp.status_code == 302
    assert "error=access_denied" in resp.headers["location"]


def test_session_introspect_401_without_cookie(client):
    resp = client.get("/api/auth/github/session")
    assert resp.status_code == 401
    assert resp.json()["authenticated"] is False
