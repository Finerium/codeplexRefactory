"""Session JWT helper (Hades Wave 3).

OAuth callback signs JWT with SESSION_SECRET HS256 and sets HTTP-only cookie.
WebSocket upgrade reads `?token=<jwt>` query param (cookies not transmitted
reliably on WS upgrade per `hera-to-hades.md` Asumption 2).

Token claims:
  sub: GitHub user id (stable)
  login: GitHub login
  scopes: list[str]
  iat: issued-at
  exp: expiry (default 7 days)

Anti-pattern Lock 5 honest claim: HS256 single-secret sufficient for hackathon
scope. Production rotation deferred. The ``require_session`` FastAPI
dependency returns an open anonymous session in Wave 3 cycle 1 stub so Triton
chat endpoints work end-to-end; Hades cycle 2 hardens the dep to validate
cookie + reject 401 when invalid.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from fastapi import Cookie
from pydantic import BaseModel

from app.config import get_settings

logger = logging.getLogger("hades.auth_session")

_ALGORITHM = "HS256"
_DEFAULT_EXPIRY_DAYS = 7


class SessionClaims(BaseModel):
    """JWT claims structure."""

    sub: str  # GitHub user id as str
    login: str
    scopes: list[str]
    iat: int
    exp: int


def sign_session_jwt(
    github_id: int,
    github_login: str,
    scopes: list[str],
    expires_days: int = _DEFAULT_EXPIRY_DAYS,
) -> str:
    """Sign JWT for OAuth callback success."""
    settings = get_settings()
    now = datetime.now(tz=timezone.utc)
    expiry = now + timedelta(days=expires_days)
    payload: dict[str, Any] = {
        "sub": str(github_id),
        "login": github_login,
        "scopes": scopes,
        "iat": int(now.timestamp()),
        "exp": int(expiry.timestamp()),
    }
    token = jwt.encode(payload, settings.SESSION_SECRET, algorithm=_ALGORITHM)
    return token


def verify_session_jwt(token: str) -> SessionClaims | None:
    """Verify JWT signature + expiry. Returns SessionClaims or None on failure."""
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.SESSION_SECRET, algorithms=[_ALGORITHM])
    except jwt.ExpiredSignatureError:
        logger.info("Session JWT expired")
        return None
    except jwt.InvalidTokenError as exc:
        logger.info("Session JWT invalid: %s", exc)
        return None
    try:
        return SessionClaims(**payload)
    except Exception as exc:
        logger.warning("Session JWT claims malformed: %s", exc)
        return None


SESSION_COOKIE_NAME = "hades_session"


def set_session_cookie_kwargs(token: str) -> dict[str, Any]:
    """Return kwargs for FastAPI Response.set_cookie call.

    HTTP-only + SameSite=lax + secure in production.
    """
    settings = get_settings()
    return {
        "key": SESSION_COOKIE_NAME,
        "value": token,
        "httponly": True,
        "samesite": "lax",
        "secure": settings.is_production,
        "max_age": _DEFAULT_EXPIRY_DAYS * 24 * 3600,
        "path": "/",
    }


# ----------------------------------------------------------------------------
# FastAPI dependency (Triton Wave 3 cycle 3 consumes; Hades cycle 2 hardens)
# ----------------------------------------------------------------------------


# [STUB Wave 3 cycle 3, real Hades cycle 2 cookie verify + 401 reject]
# Triton chat / onboarding / security / simulation endpoints accept this
# dependency so the signature is stable. Hades cycle 2 will replace the body
# with cookie extraction + JWT verify + lookup against Demeter users table.
async def require_session(
    hades_session: str | None = Cookie(default=None, alias=SESSION_COOKIE_NAME),
) -> dict[str, Any]:
    """Return a session payload for the authenticated user.

    Wave 3 cycle 3 stub: returns an open anonymous session when no cookie is
    present so demo flow stays unblocked. Hades cycle 2 will raise
    ``HTTPException(401)`` for missing or invalid tokens.

    Args:
        hades_session: optional JWT from the ``hades_session`` cookie. Pulled
            via FastAPI ``Cookie`` parameter so it does not require a Request
            object in scope.

    Returns:
        Dict with ``user_id``, ``github_login``, ``scopes``, ``is_authenticated``.
    """
    if hades_session is None:
        return {
            "user_id": "anonymous-demo",
            "github_login": "demo-user",
            "scopes": [],
            "is_authenticated": False,
            "stub": True,
        }
    claims = verify_session_jwt(hades_session)
    if claims is None:
        return {
            "user_id": "anonymous-demo",
            "github_login": "demo-user",
            "scopes": [],
            "is_authenticated": False,
            "stub": True,
        }
    return {
        "user_id": claims.sub,
        "github_login": claims.login,
        "scopes": claims.scopes,
        "is_authenticated": True,
        "stub": False,
    }
