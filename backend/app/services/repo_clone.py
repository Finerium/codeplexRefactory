"""Server-side shallow repo clone helper (Hades Manager FINAL Cycle 2).

Author: Hades (Bug #7 data integrity fix, 20260513-0857 directive).

Background: prior to Cycle 2 the `/api/findings/scan` endpoint silently fell
back to a bundled NodeGoat fixture whenever the caller omitted `repo_root`.
Ghaisan + Hafiz QA surfaced that the frontend repo-picker flow does not pass
a local path (no client-side checkout exists), so every "real repo" demo
silently rendered NodeGoat data. The fix forces the backend to either:
  - accept a local checkout path (operator pre-cloned), OR
  - shallow-clone the repo itself when given `owner/name`, OR
  - reject the request with HTTP 400.

This module owns option (b): a small, cached, async shallow-clone helper.

Design:
  - `clone_repo_shallow(repo_full_name, *, ref=None, token=None) -> Path`
  - Uses the system `git` binary via asyncio.create_subprocess_exec to avoid
    pulling in GitPython / pygit2 for a hackathon dependency footprint.
  - Shallow clone (`--depth=1`) into a per-process temp cache directory so
    repeated scans of the same repo do not re-clone over and over.
  - Honors a 90 second timeout per clone; fails fast otherwise so the
    endpoint can surface HTTP 422 to the frontend.
  - When `token` is supplied (Fernet-decrypted OAuth token from the user's
    cookie), passes it via `https://x-access-token:<token>@github.com/...`
    so private repos owned by the authenticated user are reachable.

Cache layout:
  ``<tmpdir>/codeplex-repo-cache/<sanitized-owner-name>``
  Cache is filesystem-persistent for the lifetime of the process. Hackathon
  scope: no explicit eviction. Demo session lives ~2h.

Compliance:
  - Lock 1 (no em dash): clean.
  - Lock 2 (no emoji): clean.
  - Lock 5 (honest claim): subprocess clone failure is surfaced upstream
    rather than swallowed.
  - Lock 3 (OAuth scope): token only forwarded when supplied by caller; no
    silent scope escalation.
"""
from __future__ import annotations

import asyncio
import logging
import os
import re
import shutil
import tempfile
from pathlib import Path

logger = logging.getLogger("hades.repo_clone")

_CACHE_DIR_NAME = "codeplex-repo-cache"
_CLONE_TIMEOUT_SECONDS = 90.0
_REPO_FULL_NAME_RE = re.compile(r"^[A-Za-z0-9._-]+/[A-Za-z0-9._-]+$")


class CloneError(Exception):
    """Raised when a shallow clone fails (network, auth, not found, timeout)."""


def _cache_root() -> Path:
    """Return the persistent cache root path."""
    root = Path(tempfile.gettempdir()) / _CACHE_DIR_NAME
    root.mkdir(parents=True, exist_ok=True)
    return root


def _sanitize_segment(repo_full_name: str) -> str:
    """Convert ``owner/name`` to a filesystem-safe directory segment."""
    return repo_full_name.replace("/", "__")


def _validate_repo_full_name(repo_full_name: str) -> None:
    if not _REPO_FULL_NAME_RE.match(repo_full_name):
        raise CloneError(
            f"invalid repo_full_name {repo_full_name!r}; "
            "expected owner/name with ASCII alnum + . _ -"
        )


def _build_clone_url(repo_full_name: str, token: str | None) -> str:
    """Construct an HTTPS clone URL with optional token injection."""
    if token:
        # `x-access-token` is GitHub's convention for OAuth/PAT auth over HTTPS.
        return f"https://x-access-token:{token}@github.com/{repo_full_name}.git"
    return f"https://github.com/{repo_full_name}.git"


async def _run_git(args: list[str], cwd: Path | None = None) -> tuple[int, str, str]:
    """Run a git subprocess with timeout. Returns (returncode, stdout, stderr)."""
    proc = await asyncio.create_subprocess_exec(
        "git",
        *args,
        cwd=str(cwd) if cwd else None,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        env={**os.environ, "GIT_TERMINAL_PROMPT": "0"},
    )
    try:
        stdout, stderr = await asyncio.wait_for(
            proc.communicate(), timeout=_CLONE_TIMEOUT_SECONDS
        )
    except asyncio.TimeoutError as exc:
        try:
            proc.kill()
        except ProcessLookupError:
            pass
        raise CloneError(
            f"git operation timed out after {_CLONE_TIMEOUT_SECONDS:.0f}s: {' '.join(args[:3])}"
        ) from exc
    return (
        proc.returncode or 0,
        stdout.decode("utf-8", errors="replace"),
        stderr.decode("utf-8", errors="replace"),
    )


async def clone_repo_shallow(
    repo_full_name: str,
    *,
    ref: str | None = None,
    token: str | None = None,
    force_refresh: bool = False,
) -> Path:
    """Shallow-clone a repo into the per-process cache and return the path.

    Parameters:
      repo_full_name: GitHub ``owner/name`` slug. Validated.
      ref: optional branch/tag/sha. When omitted uses the remote default.
      token: optional decrypted OAuth access token for private repos.
      force_refresh: when True, delete any existing cached clone first.

    Raises:
      CloneError on any failure path. The endpoint translates to HTTP 422.

    Returns:
      Absolute Path to the cloned working tree.
    """
    _validate_repo_full_name(repo_full_name)

    cache_dir = _cache_root()
    target = cache_dir / _sanitize_segment(repo_full_name)

    if force_refresh and target.exists():
        logger.info("repo cache refresh: removing %s", target)
        shutil.rmtree(target, ignore_errors=True)

    if target.exists() and (target / ".git").exists():
        # Cache hit. Try fetch + reset to keep it fresh, but never fail hard.
        logger.info("repo cache hit %s", target)
        try:
            await _run_git(["fetch", "--depth=1", "origin"], cwd=target)
            if ref:
                await _run_git(["checkout", "-f", ref], cwd=target)
        except CloneError as exc:
            logger.warning(
                "cached repo refresh failed %s reason=%s (continuing with stale tree)",
                target,
                exc,
            )
        return target

    # Cache miss. Clone fresh.
    if target.exists():
        # Stale dir without .git: wipe.
        shutil.rmtree(target, ignore_errors=True)

    url = _build_clone_url(repo_full_name, token)
    clone_args = ["clone", "--depth=1", "--single-branch"]
    if ref:
        clone_args.extend(["--branch", ref])
    clone_args.extend([url, str(target)])

    # Mask any token in logs.
    log_args = list(clone_args)
    for i, a in enumerate(log_args):
        if "x-access-token:" in a:
            log_args[i] = re.sub(
                r"x-access-token:[^@]+@", "x-access-token:***@", a
            )
    logger.info("git %s", " ".join(log_args))

    rc, _stdout, stderr = await _run_git(clone_args)
    if rc != 0:
        # Wipe partial clone so a later attempt can retry cleanly.
        shutil.rmtree(target, ignore_errors=True)
        msg = stderr.strip().splitlines()[-1] if stderr.strip() else f"git exit {rc}"
        # Map common upstream errors to user-friendly reasons.
        lower = msg.lower()
        if "not found" in lower or "repository not found" in lower:
            raise CloneError(f"repo not found: {repo_full_name}")
        if "authentication failed" in lower or "could not read" in lower:
            raise CloneError(
                f"authentication required for {repo_full_name} "
                "(repo private, OAuth token missing or scope insufficient)"
            )
        if "rate limit" in lower:
            raise CloneError(f"GitHub rate limit hit cloning {repo_full_name}")
        if "could not resolve host" in lower:
            raise CloneError("network unreachable (could not resolve github.com)")
        raise CloneError(f"git clone failed: {msg}")

    if not target.is_dir():
        raise CloneError(f"git clone reported success but {target} is not a dir")

    logger.info(
        "cloned repo=%s into=%s (shallow depth=1)", repo_full_name, target
    )
    return target


async def evict_repo(repo_full_name: str) -> bool:
    """Delete a cached clone. Returns True if a directory was removed."""
    _validate_repo_full_name(repo_full_name)
    target = _cache_root() / _sanitize_segment(repo_full_name)
    if target.exists():
        shutil.rmtree(target, ignore_errors=True)
        logger.info("evicted cached clone %s", target)
        return True
    return False


__all__ = ["CloneError", "clone_repo_shallow", "evict_repo"]
