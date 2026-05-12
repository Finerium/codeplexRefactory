"""GitHub OAuth real flow (Hades Wave 3).

Replaces Hestia Wave 1 stub at `frontend/app/api/auth/github/start/route.ts`.

Endpoints:
- GET /api/auth/github/start    -> 302 to github.com/login/oauth/authorize
- GET /api/auth/github/callback -> exchange code, persist user, set session, 302 /city

OAuth scope LOCKED minimal per PRD Section 19.3:
  read:repo + read:org + read:issues + read:pull_requests + write:issues

CSRF: state cookie (HTTP-only, 10 min max-age) compared against callback query.
PKCE: code_verifier cookie + S256 code_challenge sent to GitHub.

Cycle 1 status: REAL flow scaffold (start real, callback real with stub
                Demeter upsert). Token exchange via httpx is real.
Cycle 2 status: REAL (no swap needed; Demeter persist auto-switches when
                Demeter worker installs real service).

Reference:
- _meta/contracts/hestia-to-hades.md (stub replace contract)
- _meta/contracts/hades-to-demeter.md (upsert payload)
- PRD Section 19.3 (OAuth scope minimal LOCKED)
- agents/hades.md Section 5 (OAuth pattern)
"""
from __future__ import annotations

import base64
import hashlib
import logging
import secrets
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import JSONResponse, RedirectResponse

from app.config import get_settings
from app.services.auth_session import (
    SESSION_COOKIE_NAME,
    set_session_cookie_kwargs,
    sign_session_jwt,
)
from app.services.crypto import encrypt_token
from app.services.demeter_service import GitHubUserUpsert, get_demeter_service

logger = logging.getLogger("hades.api.auth.github")

router = APIRouter(prefix="/auth/github", tags=["auth"])


# OAuth cookies (separate from session cookie, short-lived 10 min).
_STATE_COOKIE = "oauth_state"
_VERIFIER_COOKIE = "oauth_verifier"
_COOKIE_MAX_AGE_SEC = 600


def _pkce_pair() -> tuple[str, str]:
    """Generate (code_verifier, code_challenge) for PKCE S256."""
    verifier = secrets.token_urlsafe(64)
    digest = hashlib.sha256(verifier.encode("utf-8")).digest()
    challenge = base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")
    return verifier, challenge


@router.get("/start")
async def start(request: Request) -> RedirectResponse:
    """Initiate OAuth flow.

    Sets state + verifier cookies (HTTP-only, samesite=lax, secure=production)
    then 302 redirects to github.com authorize URL.
    """
    settings = get_settings()
    state = secrets.token_urlsafe(32)
    verifier, challenge = _pkce_pair()

    query = {
        "client_id": settings.GITHUB_CLIENT_ID,
        "redirect_uri": settings.GITHUB_OAUTH_REDIRECT_URI,
        # Space-separated scope per GitHub OAuth spec (the .env stores
        # comma-separated for readability; convert here).
        "scope": " ".join(settings.github_scopes_list),
        "state": state,
        "code_challenge": challenge,
        "code_challenge_method": "S256",
        "allow_signup": "true",
    }
    authorize_url = f"https://github.com/login/oauth/authorize?{urlencode(query)}"

    response = RedirectResponse(url=authorize_url, status_code=302)
    response.set_cookie(
        _STATE_COOKIE,
        state,
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
        max_age=_COOKIE_MAX_AGE_SEC,
        path="/",
    )
    response.set_cookie(
        _VERIFIER_COOKIE,
        verifier,
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
        max_age=_COOKIE_MAX_AGE_SEC,
        path="/",
    )
    logger.info("oauth start state_set client_id_prefix=%s", settings.GITHUB_CLIENT_ID[:10])
    return response


@router.get("/callback")
async def callback(
    request: Request,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
) -> Response:
    """OAuth callback handler.

    Validates state CSRF + PKCE verifier presence, exchanges code via httpx
    POST, fetches user profile, calls Demeter upsert (stub cycle 1), signs
    session JWT, sets cookie, 302 to /city.
    """
    settings = get_settings()

    # OAuth declined.
    if error:
        logger.info("oauth callback declined: %s", error)
        return RedirectResponse(
            url=f"/start?error={error}",
            status_code=302,
        )

    if not code or not state:
        raise HTTPException(status_code=400, detail="missing code or state")

    # Validate state CSRF.
    cookie_state = request.cookies.get(_STATE_COOKIE)
    if not cookie_state or not secrets.compare_digest(cookie_state, state):
        logger.warning("oauth state mismatch")
        return RedirectResponse(url="/start?error=csrf", status_code=302)

    verifier = request.cookies.get(_VERIFIER_COOKIE)
    if not verifier:
        logger.warning("oauth verifier cookie missing")
        return RedirectResponse(url="/start?error=pkce_missing", status_code=302)

    # Exchange code for access token.
    token_url = "https://github.com/login/oauth/access_token"
    token_body = {
        "client_id": settings.GITHUB_CLIENT_ID,
        "client_secret": settings.GITHUB_CLIENT_SECRET,
        "code": code,
        "redirect_uri": settings.GITHUB_OAUTH_REDIRECT_URI,
        "code_verifier": verifier,
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            token_resp = await client.post(
                token_url,
                data=token_body,
                headers={"Accept": "application/json"},
            )
            token_resp.raise_for_status()
        except httpx.HTTPError as exc:
            logger.warning("oauth token exchange failed: %s", exc)
            return RedirectResponse(
                url="/start?error=token_exchange",
                status_code=302,
            )

        token_data = token_resp.json()
        access_token = token_data.get("access_token")
        if not access_token:
            logger.warning("oauth token response missing access_token: %s", token_data)
            return RedirectResponse(
                url="/start?error=token_response",
                status_code=302,
            )

        # Token type, expires_in, scope echoed by GitHub.
        granted_scope_str = token_data.get("scope", "") or ""
        granted_scopes = [s.strip() for s in granted_scope_str.split(",") if s.strip()]

        # Fetch user profile.
        try:
            user_resp = await client.get(
                "https://api.github.com/user",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                },
            )
            user_resp.raise_for_status()
        except httpx.HTTPError as exc:
            logger.warning("oauth user fetch failed: %s", exc)
            return RedirectResponse(
                url="/start?error=user_fetch",
                status_code=302,
            )

        user_data = user_resp.json()

    github_id = int(user_data.get("id", 0))
    github_login = user_data.get("login", "")
    avatar_url = user_data.get("avatar_url", "")

    if not github_id or not github_login:
        logger.warning("oauth user response missing id/login: %s", user_data)
        return RedirectResponse(url="/start?error=user_data", status_code=302)

    # Persist via Demeter (stub cycle 1; real cycle 2).
    encrypted_token = encrypt_token(access_token)
    from datetime import datetime, timezone
    now_iso = datetime.now(tz=timezone.utc).isoformat()
    demeter = get_demeter_service()
    await demeter.upsert_user(
        GitHubUserUpsert(
            github_id=github_id,
            github_login=github_login,
            avatar_url=avatar_url,
            encrypted_access_token=encrypted_token,
            scopes=granted_scopes or settings.github_scopes_list,
            last_login_at=now_iso,
        )
    )

    # Sign session JWT.
    session_token = sign_session_jwt(
        github_id=github_id,
        github_login=github_login,
        scopes=granted_scopes or settings.github_scopes_list,
    )

    # 302 to /city + set session cookie + clear short-lived OAuth cookies.
    redirect_to_city = RedirectResponse(url="/city", status_code=302)
    redirect_to_city.set_cookie(**set_session_cookie_kwargs(session_token))
    redirect_to_city.delete_cookie(_STATE_COOKIE, path="/")
    redirect_to_city.delete_cookie(_VERIFIER_COOKIE, path="/")
    logger.info("oauth callback success login=%s id=%s", github_login, github_id)
    return redirect_to_city


@router.get("/session")
async def session_introspect(request: Request) -> JSONResponse:
    """Introspect current session.

    Returns 200 with claims dict if session cookie present + valid, 401 otherwise.
    Frontend `useSession` consumes this (per `hestia-to-hades.md` Section
    'Frontend session contract').
    """
    from app.services.auth_session import verify_session_jwt

    cookie = request.cookies.get(SESSION_COOKIE_NAME)
    if not cookie:
        return JSONResponse(status_code=401, content={"authenticated": False})
    claims = verify_session_jwt(cookie)
    if claims is None:
        return JSONResponse(status_code=401, content={"authenticated": False})
    return JSONResponse(
        status_code=200,
        content={
            "authenticated": True,
            "githubLogin": claims.login,
            "githubId": int(claims.sub) if claims.sub.isdigit() else claims.sub,
            "scopes": claims.scopes,
        },
    )


@router.post("/logout")
async def logout() -> RedirectResponse:
    """Clear session cookie + redirect to /start."""
    response = RedirectResponse(url="/start", status_code=302)
    response.delete_cookie(SESSION_COOKIE_NAME, path="/")
    return response
