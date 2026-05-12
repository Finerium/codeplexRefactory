"""GitHub repository list endpoint (Hestia Wave-Fixing cycle 1, E-3 HIGH rescue).

OWNER NOTE (cross-scope): this file is authored by Hestia under Wave-Fixing
because QA round Day 2 surfaced E-3 (no repo picker post-OAuth) and the demo
window is ~10h away. The endpoint logically belongs in Hades' OAuth/auth
domain. Manager should review and either:
  (a) keep this in Hestia ownership (frontend-blocking demo path), or
  (b) move under `app/api/auth/` once Hades cycle 2 hardens Demeter persist
      and we can pull the encrypted token from the DB instead of cookie.

Endpoint:
    GET /api/repos/list -> 200 [{id, full_name, private, html_url, description}]
                          401 if no oauth_access_token_enc cookie set
                          502 if GitHub upstream failed

Auth model:
    The OAuth callback (app/api/auth/github.py) is patched in this same cycle
    to also set a short-lived `oauth_access_token_enc` HTTP-only cookie that
    contains the Fernet-encrypted access token. This endpoint decrypts and
    forwards to GitHub `/user/repos`. The cookie has 30 min max-age so it
    only lives long enough for the repo picker flow; the long-lived session
    JWT is unchanged.

    Stored-token-in-cookie is a deliberate hackathon-scope compromise. Real
    Wave 3 / production replaces this with Demeter `users.encrypted_access_token`
    column lookup keyed by session_jwt.sub.

Compliance:
    Lock 1 (no em dash): clean.
    Lock 2 (no emoji): clean.
    Lock 5 (honest claim): cookie-based token storage flagged above.
"""
from __future__ import annotations

import logging
from typing import Annotated

import httpx
from fastapi import APIRouter, Cookie, HTTPException
from pydantic import BaseModel

from app.services.crypto import decrypt_token

logger = logging.getLogger("hestia.api.repos")

router = APIRouter(prefix="/repos", tags=["repos"])

# Same cookie name used by app/api/auth/github.py callback (set in this cycle).
_OAUTH_TOKEN_COOKIE = "oauth_access_token_enc"


class GitHubRepoSummary(BaseModel):
    """Compact subset of GitHub repo fields needed by the entry repo picker."""

    id: int
    full_name: str
    name: str
    private: bool
    html_url: str
    description: str | None = None
    default_branch: str | None = None
    language: str | None = None
    stargazers_count: int = 0
    updated_at: str | None = None


@router.get("/list", response_model=list[GitHubRepoSummary])
async def list_user_repos(
    oauth_token_enc: Annotated[
        str | None, Cookie(alias=_OAUTH_TOKEN_COOKIE)
    ] = None,
) -> list[GitHubRepoSummary]:
    """Return up to 50 repos for the authenticated GitHub user.

    Reads the encrypted OAuth access token from the `oauth_access_token_enc`
    cookie set by the OAuth callback, decrypts via Fernet, forwards to
    GitHub `/user/repos?per_page=50&sort=updated`.
    """
    if not oauth_token_enc:
        raise HTTPException(
            status_code=401,
            detail="missing oauth_access_token cookie, complete OAuth flow first",
        )

    access_token = decrypt_token(oauth_token_enc)
    if access_token is None:
        raise HTTPException(
            status_code=401,
            detail="oauth token decrypt failed, re-authenticate",
        )

    url = "https://api.github.com/user/repos"
    params = {
        "per_page": 50,
        "sort": "updated",
        "affiliation": "owner,collaborator,organization_member",
    }
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.get(url, params=params, headers=headers)
            resp.raise_for_status()
        except httpx.HTTPStatusError as exc:
            logger.warning(
                "github /user/repos failed status=%s body=%s",
                exc.response.status_code,
                exc.response.text[:200],
            )
            raise HTTPException(
                status_code=502,
                detail=f"github upstream returned {exc.response.status_code}",
            ) from exc
        except httpx.HTTPError as exc:
            logger.warning("github /user/repos network error: %s", exc)
            raise HTTPException(
                status_code=502,
                detail="github upstream unreachable",
            ) from exc

    raw_repos = resp.json()
    if not isinstance(raw_repos, list):
        logger.warning("github /user/repos returned non-list: %s", type(raw_repos))
        raise HTTPException(
            status_code=502, detail="github upstream returned unexpected payload"
        )

    summaries: list[GitHubRepoSummary] = []
    for item in raw_repos:
        if not isinstance(item, dict):
            continue
        try:
            summaries.append(
                GitHubRepoSummary(
                    id=int(item.get("id", 0)),
                    full_name=str(item.get("full_name", "")),
                    name=str(item.get("name", "")),
                    private=bool(item.get("private", False)),
                    html_url=str(item.get("html_url", "")),
                    description=item.get("description"),
                    default_branch=item.get("default_branch"),
                    language=item.get("language"),
                    stargazers_count=int(item.get("stargazers_count", 0) or 0),
                    updated_at=item.get("updated_at"),
                )
            )
        except (TypeError, ValueError) as exc:
            logger.info("skipping malformed repo entry: %s", exc)
            continue

    logger.info("list_user_repos returned %d repos", len(summaries))
    return summaries
