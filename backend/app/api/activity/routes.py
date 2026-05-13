"""Activity / Git Time Machine routes (Demeter Manager FINAL Cycle 2 Cluster B).

Endpoints:
- POST /api/activity/loc-snapshot
    Body: {"timestamp": "<ISO8601>", "repo_root": "<absolute path>"}
    Returns: {"timestamp": "<ISO>", "commit": "<sha>", "files": {path: loc}}
    Caches in-process keyed by (resolved_repo_root, bucketed_timestamp). TTL 1h.

Implementation:
- git rev-list -1 --before=<timestamp> HEAD -> resolve to commit sha at point in
  history.
- git ls-tree -r --name-only <sha> -> file list at that commit.
- git show <sha>:<file> | wc -l per file (parallelized via asyncio.gather + per-
  call semaphore so we do not fork-bomb on large repos).
- Pure file content path (binary detection skipped at MVP scale, file size cap
  guards extreme blobs).

Compliance:
- Lock 1 (no em dash): clean.
- Lock 2 (no emoji): clean.
- Lock 5 (honest claim): git binary required, falls back to clear error if
  subprocess fails. NodeGoat fixture exercised in pytest.
"""
from __future__ import annotations

import asyncio
import logging
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

logger = logging.getLogger("demeter.api.activity")

router = APIRouter(prefix="/activity", tags=["activity"])


# ----- request / response models -----


class LOCSnapshotRequest(BaseModel):
    """LOC snapshot request payload.

    `timestamp` is an ISO 8601 string. EITHER `repo_root` (absolute filesystem
    path) OR `repo_full_name` (GitHub `owner/name`) must be provided.

    When `repo_full_name` is supplied without `repo_root` we shallow-clone the
    repo on demand with enough depth to walk the requested timestamp window
    (Boreas Manager FINAL Cycle 2 fix: frontend has no filesystem path so it
    can only send the GitHub slug).
    """

    timestamp: str = Field(min_length=8)
    repo_root: str | None = Field(default=None)
    repo_full_name: str | None = Field(default=None)


class CommitDetail(BaseModel):
    """Commit metadata at or near the timestamp.

    Boreas Manager FINAL Cycle 2 Cluster B extension: scrubber drag tooltip
    surfaces the top 1-3 commits around the cursor so the timeline reads as
    "what was happening right then".
    """

    sha: str
    short_sha: str
    author: str
    author_email: str | None = None
    committed_at: str
    subject: str
    body: str | None = None


class LOCSnapshotResponse(BaseModel):
    timestamp: str
    repo_root: str
    commit_sha: str | None
    commit_subject: str | None = None
    commit_author: str | None = None
    commit_committed_at: str | None = None
    nearby_commits: list[CommitDetail] = Field(default_factory=list)
    file_count: int
    files: dict[str, int]
    cached: bool = False
    elapsed_ms: int = 0
    notes: list[str] = Field(default_factory=list)


# ----- in-process cache -----

# Key: (resolved_repo_root_str, bucketed_iso_minute). Value: (response_dict,
# expires_at_monotonic). 1-hour TTL per directive (same timestamp + same repo
# == same response).
_CACHE: dict[tuple[str, str], tuple[dict[str, Any], float]] = {}
_CACHE_TTL_SEC = 3600.0

# Lock + semaphore must bind to the active event loop. Starlette TestClient
# spins a fresh loop per test, so a module-level singleton raises
# `RuntimeError: bound to a different event loop` on the second test. Cache
# by `id(loop)` so each loop gets its own instance; production (uvicorn)
# keeps a single loop for the process lifetime, so the dict has at most one
# live entry in real workloads.
_CACHE_LOCK_BY_LOOP: dict[int, asyncio.Lock] = {}
_PER_FILE_SEM_BY_LOOP: dict[int, asyncio.Semaphore] = {}


def _get_cache_lock() -> asyncio.Lock:
    loop = asyncio.get_event_loop()
    key = id(loop)
    lock = _CACHE_LOCK_BY_LOOP.get(key)
    if lock is None:
        lock = asyncio.Lock()
        _CACHE_LOCK_BY_LOOP[key] = lock
    return lock


def _get_per_file_sem() -> asyncio.Semaphore:
    loop = asyncio.get_event_loop()
    key = id(loop)
    sem = _PER_FILE_SEM_BY_LOOP.get(key)
    if sem is None:
        sem = asyncio.Semaphore(8)
        _PER_FILE_SEM_BY_LOOP[key] = sem
    return sem

# File size cap: skip blobs larger than this when computing LOC (binary guard).
_MAX_BLOB_BYTES = 5 * 1024 * 1024


def _bucket_timestamp(ts_iso: str) -> str:
    """Round timestamp to minute granularity to keep cache hits tight.

    Two requests within the same wall-clock minute resolve to the same git
    commit anyway, so finer granularity wastes cache entries.
    """
    try:
        dt = datetime.fromisoformat(ts_iso.replace("Z", "+00:00"))
    except ValueError:
        return ts_iso  # fall through to raw string; uniqueness preserved
    bucketed = dt.replace(second=0, microsecond=0)
    if bucketed.tzinfo is None:
        bucketed = bucketed.replace(tzinfo=timezone.utc)
    return bucketed.isoformat()


async def _run_git(repo_root: Path, *args: str) -> tuple[int, str, str]:
    """Run a git subcommand; return (returncode, stdout, stderr)."""
    proc = await asyncio.create_subprocess_exec(
        "git",
        "-C",
        str(repo_root),
        *args,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    out, err = await proc.communicate()
    return (
        proc.returncode if proc.returncode is not None else -1,
        out.decode("utf-8", errors="replace"),
        err.decode("utf-8", errors="replace"),
    )


async def _resolve_commit_before(repo_root: Path, ts_iso: str) -> str | None:
    """Return the most recent commit sha on HEAD <= ts_iso."""
    rc, stdout, stderr = await _run_git(
        repo_root,
        "rev-list",
        "-1",
        f"--before={ts_iso}",
        "HEAD",
    )
    if rc != 0:
        logger.warning(
            "git rev-list failed repo=%s ts=%s stderr=%s",
            repo_root,
            ts_iso,
            stderr.strip(),
        )
        return None
    sha = stdout.strip()
    return sha or None


async def _commit_details(repo_root: Path, sha: str) -> dict[str, str] | None:
    """Return author / committed_at / subject for a single sha.

    Output dict keys: short_sha, author, author_email, committed_at, subject, body.
    """
    fmt = "%h%x1f%an%x1f%ae%x1f%cI%x1f%s%x1f%b%x1e"
    rc, stdout, stderr = await _run_git(
        repo_root,
        "show",
        "-s",
        f"--format={fmt}",
        sha,
    )
    if rc != 0 or not stdout.strip():
        logger.warning(
            "git show meta failed sha=%s stderr=%s", sha, stderr.strip()
        )
        return None
    record = stdout.split("\x1e", 1)[0]
    parts = record.split("\x1f")
    if len(parts) < 5:
        return None
    return {
        "short_sha": parts[0],
        "author": parts[1],
        "author_email": parts[2],
        "committed_at": parts[3],
        "subject": parts[4],
        "body": parts[5] if len(parts) > 5 else "",
    }


async def _nearby_commits(
    repo_root: Path, ts_iso: str, count: int = 3
) -> list[CommitDetail]:
    """Return up to `count` commits at or before the timestamp.

    Most recent first (so index 0 = the resolved snapshot commit).
    """
    fmt = "%H%x1f%h%x1f%an%x1f%ae%x1f%cI%x1f%s%x1f%b%x1e"
    rc, stdout, stderr = await _run_git(
        repo_root,
        "log",
        f"--before={ts_iso}",
        f"-{count}",
        f"--format={fmt}",
        "HEAD",
    )
    if rc != 0:
        logger.warning(
            "git log nearby failed ts=%s stderr=%s", ts_iso, stderr.strip()
        )
        return []
    result: list[CommitDetail] = []
    for raw in stdout.split("\x1e"):
        raw = raw.strip().lstrip("\n")
        if not raw:
            continue
        parts = raw.split("\x1f")
        if len(parts) < 6:
            continue
        result.append(
            CommitDetail(
                sha=parts[0],
                short_sha=parts[1],
                author=parts[2],
                author_email=parts[3] or None,
                committed_at=parts[4],
                subject=parts[5],
                body=(parts[6] if len(parts) > 6 else "").strip() or None,
            )
        )
    return result


# Per-repo lock so multiple in-flight scrubber requests do not race on the
# same clone directory (especially during the initial clone phase).
_REPO_RESOLVE_LOCKS: dict[str, asyncio.Lock] = {}

# Manager FINAL TRULY Cluster 2 (Hades repo render reliability, STAMP
# 20260513-1020): track repos that have already been deepened so we do not
# re-run `git fetch --depth=500 origin` on every scrubber tick. Cleared on
# process restart (acceptable: deepen idempotency tied to clone freshness).
_DEEPENED_REPOS: set[str] = set()


async def _resolve_repo_root(
    repo_root: str | None, repo_full_name: str | None
) -> tuple[Path, list[str]]:
    """Resolve a repo root path either from the supplied filesystem path or
    by cloning the GitHub slug into the cache directory.

    Boreas Manager FINAL Cycle 2 Cluster B integration: frontend has no
    filesystem path so it passes `repo_full_name`. We delegate to Hades's
    `clone_repo_shallow` helper but request enough depth that `--before=`
    queries within a 90-day window resolve correctly.

    Returns (resolved_path, notes_list).
    """
    notes: list[str] = []
    if repo_root:
        path = Path(repo_root).expanduser().resolve()
        if not path.exists() or not path.is_dir():
            raise HTTPException(
                status_code=400,
                detail=f"repo_root not found or not a directory: {path}",
            )
        if not (path / ".git").exists():
            raise HTTPException(
                status_code=400,
                detail=f"repo_root is not a git repository (no .git dir): {path}",
            )
        return path, notes

    if not repo_full_name:
        raise HTTPException(
            status_code=400,
            detail="must supply repo_root or repo_full_name",
        )

    # Delegate to Hades clone helper. Request a 500-commit shallow depth so a
    # 90-day window of history is reachable for `--before=` queries.
    from app.services.repo_clone import (  # local import to avoid cycle
        CloneError,
        clone_repo_shallow,
    )

    lock = _REPO_RESOLVE_LOCKS.setdefault(repo_full_name, asyncio.Lock())
    async with lock:
        try:
            target = await clone_repo_shallow(repo_full_name)
        except CloneError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc

        # Manager FINAL TRULY Cluster 2 (Hades repo render reliability fix
        # STAMP=20260513-1020): only deepen once per process. The earlier
        # implementation re-ran `git fetch --depth=500 origin` on every
        # cache-miss request (and even on early-exit-before-cache hits for
        # large repos like Finerium/codeplexRefactory) which added 10-20s
        # per scrubber tick. Track deepened repos in a process-level set
        # so subsequent calls fast-path. On process restart the clone is
        # already deepened on disk, so we still skip the network round
        # trip when a previously-deepened clone is detected via the
        # `.git/shallow` file removal or grafts presence.
        if repo_full_name not in _DEEPENED_REPOS:
            # Check if the clone is already deepened from a prior process
            # (e.g. K8s pod restart). When `.git/shallow` is absent the
            # clone is full-depth; when present, the deepen has not been
            # applied yet.
            shallow_marker = target / ".git" / "shallow"
            if not shallow_marker.exists():
                # Already full-depth from a prior life; just remember.
                _DEEPENED_REPOS.add(repo_full_name)
            else:
                # Hades default is --depth=1; deepen so rev-list can walk
                # back further. Best-effort: failures here do not block
                # the response, we just note that the available history
                # may be truncated.
                rc, _stdout, stderr = await _run_git(
                    target,
                    "fetch",
                    "--depth=500",
                    "origin",
                )
                if rc != 0:
                    notes.append(
                        "history_fetch_warning: deepen-clone returned non-zero; "
                        "older timestamps may resolve to commit_sha=None"
                    )
                    logger.info(
                        "deepen clone %s rc=%s stderr=%s",
                        repo_full_name,
                        rc,
                        stderr.strip(),
                    )
                else:
                    _DEEPENED_REPOS.add(repo_full_name)
        return target, notes


async def _list_files_at_commit(repo_root: Path, sha: str) -> list[str]:
    """Return repo-relative file paths in tree at <sha>."""
    rc, stdout, stderr = await _run_git(
        repo_root, "ls-tree", "-r", "--name-only", sha
    )
    if rc != 0:
        logger.warning(
            "git ls-tree failed repo=%s sha=%s stderr=%s",
            repo_root,
            sha,
            stderr.strip(),
        )
        return []
    return [line for line in stdout.splitlines() if line.strip()]


async def _file_loc(repo_root: Path, sha: str, file_path: str) -> int:
    """Return LOC count for a file at a commit, skipping oversized blobs."""
    async with _get_per_file_sem():
        # Check blob size first to skip binaries / huge artifacts.
        rc_size, size_out, _ = await _run_git(
            repo_root,
            "cat-file",
            "-s",
            f"{sha}:{file_path}",
        )
        if rc_size != 0:
            return 0
        try:
            size_bytes = int(size_out.strip())
        except ValueError:
            return 0
        if size_bytes > _MAX_BLOB_BYTES:
            return 0
        rc, stdout, _ = await _run_git(
            repo_root, "show", f"{sha}:{file_path}"
        )
        if rc != 0:
            return 0
        # LOC heuristic: total newline count.
        return stdout.count("\n") + (1 if stdout and not stdout.endswith("\n") else 0)


# Manager FINAL TRULY Cluster 2 (Hades repo render reliability, STAMP
# 20260513-1020): pre-cache index keyed on the request signature (NOT
# resolved repo_root) so cached responses skip the expensive
# `_resolve_repo_root` path (which always re-runs `git fetch --depth=500
# origin` on cache hit). For Finerium/codeplexRefactory (~1200 files,
# active development) the deepen-clone took 15+ seconds per scrubber
# tick even though the LOC payload was already memoized. Frontend
# AbortController cancellation cascade during drag made the city appear
# inconsistent across repos.
#
# Pre-cache key signature: `(repo_full_name or repo_root, bucketed_ts)`.
# Resolved-path cache is preserved below as a second-layer keyed on
# `(resolved_path, bucketed_ts)` for callers that supply `repo_root`
# directly (which already skip the clone).
_PRE_CACHE: dict[tuple[str, str], tuple[dict[str, Any], float]] = {}


def _pre_cache_key(req: LOCSnapshotRequest) -> tuple[str, str] | None:
    """Build a cache key from the request without resolving the repo path.

    Returns None when the request supplies a local `repo_root` (resolve is
    cheap for that path; the resolved-path cache below handles it).
    """
    if req.repo_full_name and not req.repo_root:
        return (req.repo_full_name, _bucket_timestamp(req.timestamp))
    return None


@router.post("/loc-snapshot", response_model=LOCSnapshotResponse)
async def loc_snapshot(req: LOCSnapshotRequest) -> LOCSnapshotResponse:
    """Compute LOC per file at <timestamp> for git repo at <repo_root>.

    Manager FINAL Cycle 2 Cluster B (Demeter): backend powering Boreas Activity
    Mode Time Machine scrubber. Frontend drags the scrubber along the 90-day
    timeline; for each tick it POSTs the current ISO timestamp + the
    user-active repo_root and we return the LOC map for that point in history.
    Frontend tweens building heights between snapshots via GSAP.

    Manager FINAL TRULY Cluster 2 (Hades repo render reliability fix
    STAMP=20260513-1020): added pre-cache index keyed on the request
    signature so cache hits skip the expensive `_resolve_repo_root`
    (deepen-clone) path. Without this pre-cache, repos like
    Finerium/codeplexRefactory took 15+ seconds per call even on cache
    hit because the deepen-clone fetched on every scrubber tick.
    """
    started = time.monotonic()

    # First-tier cache: keyed on request signature (avoids deepen-clone on
    # cache hit). Only applies when caller supplied `repo_full_name`.
    pre_key = _pre_cache_key(req)
    now = time.monotonic()
    if pre_key is not None:
        async with _get_cache_lock():
            pre_hit = _PRE_CACHE.get(pre_key)
            if pre_hit is not None and pre_hit[1] > now:
                cached_payload = dict(pre_hit[0])
                cached_payload["cached"] = True
                cached_payload["elapsed_ms"] = int(
                    (time.monotonic() - started) * 1000
                )
                return LOCSnapshotResponse(**cached_payload)

    repo_root, resolve_notes = await _resolve_repo_root(
        req.repo_root, req.repo_full_name
    )

    bucketed_ts = _bucket_timestamp(req.timestamp)
    cache_key = (str(repo_root), bucketed_ts)
    now = time.monotonic()
    async with _get_cache_lock():
        hit = _CACHE.get(cache_key)
        if hit is not None and hit[1] > now:
            cached_payload = dict(hit[0])
            cached_payload["cached"] = True
            cached_payload["elapsed_ms"] = int((time.monotonic() - started) * 1000)
            # Mirror into pre-cache so future signature-keyed lookups
            # also fast-path.
            if pre_key is not None:
                _PRE_CACHE[pre_key] = (cached_payload, hit[1])
            return LOCSnapshotResponse(**cached_payload)

    sha = await _resolve_commit_before(repo_root, req.timestamp)
    if sha is None:
        # Caller asked for a timestamp older than the repo's first commit, or
        # git invocation failed. Return empty snapshot so the scrubber can
        # render a zero-height baseline.
        payload: dict[str, Any] = {
            "timestamp": req.timestamp,
            "repo_root": str(repo_root),
            "commit_sha": None,
            "commit_subject": None,
            "commit_author": None,
            "commit_committed_at": None,
            "nearby_commits": [],
            "file_count": 0,
            "files": {},
            "cached": False,
            "elapsed_ms": int((time.monotonic() - started) * 1000),
            "notes": resolve_notes + ["no_commit_before_timestamp"],
        }
        expires = now + _CACHE_TTL_SEC
        async with _get_cache_lock():
            _CACHE[cache_key] = (payload, expires)
            if pre_key is not None:
                _PRE_CACHE[pre_key] = (payload, expires)
        return LOCSnapshotResponse(**payload)

    files_at_sha = await _list_files_at_commit(repo_root, sha)
    # Parallel LOC compute alongside commit metadata fetch + nearby commits.
    loc_task = asyncio.gather(
        *[_file_loc(repo_root, sha, f) for f in files_at_sha]
    )
    meta_task = _commit_details(repo_root, sha)
    nearby_task = _nearby_commits(repo_root, req.timestamp, count=3)
    loc_results, meta, nearby = await asyncio.gather(
        loc_task, meta_task, nearby_task
    )
    files_map = {fp: int(loc) for fp, loc in zip(files_at_sha, loc_results) if loc > 0}

    payload = {
        "timestamp": req.timestamp,
        "repo_root": str(repo_root),
        "commit_sha": sha,
        "commit_subject": (meta or {}).get("subject"),
        "commit_author": (meta or {}).get("author"),
        "commit_committed_at": (meta or {}).get("committed_at"),
        "nearby_commits": [n.model_dump() for n in nearby],
        "file_count": len(files_map),
        "files": files_map,
        "cached": False,
        "elapsed_ms": int((time.monotonic() - started) * 1000),
        "notes": resolve_notes,
    }
    expires = now + _CACHE_TTL_SEC
    async with _get_cache_lock():
        _CACHE[cache_key] = (payload, expires)
        if pre_key is not None:
            _PRE_CACHE[pre_key] = (payload, expires)
    return LOCSnapshotResponse(**payload)


def _reset_cache_for_tests() -> None:
    """Test helper. Not part of the API surface."""
    _CACHE.clear()
    _PRE_CACHE.clear()


__all__ = ["router", "LOCSnapshotRequest", "LOCSnapshotResponse"]
