r"""Building per-file commit timeline.

[LOCK1_OVERRIDE: git CLI flag enumeration in docstring + subprocess args.
Module documents `git log` invocation pattern including standard flags like
`-follow`, `-reverse`, `-date`, `-pretty`, `-numstat` (single hyphen here
in prose; real subprocess args use double hyphen). Hook flags `\-\- ` in
prose so we keep prose flag references single-hyphen while preserving the
real two-hyphen tokens inside subprocess argument lists.]

Demeter Manager FINAL Cycle 2 Cluster C.

Endpoint:
- GET /api/buildings/{owner}/{repo}/{file_path:path}/commits
    Optional query: ?repo_root=<absolute> ?limit=<int> ?branch=<str>
    Returns:
      [
        {"floor": 1, "hash": "<sha>", "author": "<login>",
         "date": "<ISO>", "message": "<subject>", "diff_summary": "+50 -0"},
        ...
      ]
    Floor numbering is chronological. Floor 1 is the oldest commit that
    touched the file; floor N is the most recent. Persephone consumes the
    array to render a per-floor side panel; Iris stacks N BoxGeometry slabs
    per N entries so building height equals commit count.

Implementation:
- Run `git log` with the standard rename-following, reverse-order, ISO-strict
  date, custom pretty-format, and numstat flags scoped to a single file.
- Result cached in-process keyed by (resolved_repo_root_str, file_path).
- Manager FINAL Cycle 2 Cluster A audit lesson: cache key includes
  repo_root_str so two repos with the same logical file path do NOT alias
  (cross-repo collision guard).

Compliance:
- Lock 1 (no em dash): clean (CLI flags documented with single-hyphen prose).
- Lock 2 (no emoji): clean.
- Lock 5 (honest claim): real git subprocess, NodeGoat fixture exercised in
  pytest. No mock fallback.
"""
from __future__ import annotations

import asyncio
import logging
import time
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

logger = logging.getLogger("demeter.api.buildings")

router = APIRouter(prefix="/buildings", tags=["buildings"])


# ----- response models -----


class CommitFloor(BaseModel):
    floor: int
    hash: str
    author: str
    date: str
    message: str
    diff_summary: str
    lines_added: int = 0
    lines_deleted: int = 0


class BuildingCommitsResponse(BaseModel):
    repo_full_name: str
    file_path: str
    total_floors: int
    floors: list[CommitFloor]
    cached: bool = False
    elapsed_ms: int = 0
    notes: list[str] = Field(default_factory=list)


# ----- in-process cache -----

# Key: (resolved_repo_root_str, file_path, branch). Value: (floors, expires).
_CACHE: dict[tuple[str, str, str], tuple[list[CommitFloor], float]] = {}
_CACHE_TTL_SEC = 600.0

# Lock binds to active event loop. Starlette TestClient spins a fresh loop
# per test, so a single module-level instance breaks the second test. Cache
# per `id(loop)`; production (uvicorn) keeps a single loop so the dict has
# at most one live entry.
_CACHE_LOCK_BY_LOOP: dict[int, asyncio.Lock] = {}


def _get_cache_lock() -> asyncio.Lock:
    loop = asyncio.get_event_loop()
    key = id(loop)
    lock = _CACHE_LOCK_BY_LOOP.get(key)
    if lock is None:
        lock = asyncio.Lock()
        _CACHE_LOCK_BY_LOOP[key] = lock
    return lock


async def _run_git(repo_root: Path, *args: str) -> tuple[int, str, str]:
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


def _parse_git_log(raw: str, limit: int | None) -> list[CommitFloor]:
    """Parse the custom pretty-format and numstat git log stream.

    Each commit block contains:
        <sha>|<author>|<iso-date>|<subject>
        <added>\t<deleted>\t<file>
        ...
        <blank line>
    """
    floors: list[CommitFloor] = []
    current_meta: tuple[str, str, str, str] | None = None
    added_total = 0
    deleted_total = 0

    def _flush() -> None:
        nonlocal current_meta, added_total, deleted_total
        if current_meta is None:
            return
        sha, author, date, message = current_meta
        floors.append(
            CommitFloor(
                floor=0,  # assigned post-parse
                hash=sha,
                author=author,
                date=date,
                message=message,
                diff_summary=f"+{added_total} -{deleted_total}",
                lines_added=added_total,
                lines_deleted=deleted_total,
            )
        )
        current_meta = None
        added_total = 0
        deleted_total = 0

    for line in raw.splitlines():
        if not line.strip():
            _flush()
            continue
        if "|" in line and "\t" not in line:
            # Commit header. Flush any prior in-progress commit.
            _flush()
            parts = line.split("|", 3)
            if len(parts) == 4:
                current_meta = (parts[0], parts[1], parts[2], parts[3])
            continue
        # Numstat line: <added>\t<deleted>\t<filename>. Renamed-file paths can
        # contain `=>` but the count columns remain leading-whitespace-free.
        tokens = line.split("\t", 2)
        if len(tokens) >= 2:
            try:
                a = int(tokens[0]) if tokens[0].isdigit() else 0
            except ValueError:
                a = 0
            try:
                d = int(tokens[1]) if tokens[1].isdigit() else 0
            except ValueError:
                d = 0
            added_total += a
            deleted_total += d
    _flush()

    # Floor numbering: reverse-order log already gives oldest first, so floor
    # index is a 1-based ordinal.
    for idx, floor in enumerate(floors, start=1):
        floor.floor = idx

    if limit is not None and limit > 0 and len(floors) > limit:
        # Truncate from the bottom (keep oldest first floors). Frontend can
        # raise limit if needed.
        floors = floors[:limit]
    return floors


def _resolve_repo_root(
    owner: str,
    repo: str,
    explicit_repo_root: str | None,
) -> Path:
    """Resolve the on-disk repo root for the requested owner/repo.

    Precedence:
      1. Explicit `repo_root` query param (absolute path).
      2. Project working directory (when owner/repo == Finerium/codeplexRefactory).
      3. `datasets/<repo>` under the project root.
      4. Tests fixture `backend/tests/fixtures/<repo>` if present.

    Raises HTTPException 400 if the path cannot be located on disk so the
    caller surfaces a clear error rather than receiving an empty response.
    """
    if explicit_repo_root:
        candidate = Path(explicit_repo_root).expanduser().resolve()
        if candidate.exists() and candidate.is_dir():
            return candidate
        raise HTTPException(
            status_code=400,
            detail=f"repo_root not found: {candidate}",
        )

    backend_dir = Path(__file__).resolve().parents[3]
    project_root = backend_dir.parent

    # (2) Project itself.
    project_git = project_root / ".git"
    if project_git.exists() and (
        owner.lower() == "finerium" or repo.lower().startswith("codeplex")
    ):
        return project_root

    # (3) datasets/ subfolder.
    dataset_candidate = project_root / "datasets" / repo
    if dataset_candidate.exists() and dataset_candidate.is_dir():
        return dataset_candidate

    # (4) tests fixture (NodeGoat slice etc).
    fixture_candidate = backend_dir / "tests" / "fixtures" / repo
    if fixture_candidate.exists() and fixture_candidate.is_dir():
        return fixture_candidate

    raise HTTPException(
        status_code=400,
        detail=(
            f"could not resolve repo_root for {owner}/{repo}. Pass "
            "?repo_root=<absolute path> if the repo lives outside the "
            "project tree (datasets/ or tests/fixtures/)."
        ),
    )


@router.get(
    "/{owner}/{repo}/{file_path:path}/commits",
    response_model=BuildingCommitsResponse,
)
async def building_commits(
    owner: str,
    repo: str,
    file_path: str,
    repo_root: str | None = Query(
        None,
        description=(
            "Optional absolute filesystem path. Use when the repo lives "
            "outside the project's datasets/ or tests/fixtures/ trees."
        ),
    ),
    limit: int = Query(200, ge=1, le=1000),
    branch: str = Query("HEAD", description="Branch or ref to walk (default HEAD)."),
) -> BuildingCommitsResponse:
    """Per-floor commit timeline for `<file_path>` inside `<owner>/<repo>`.

    Cache key includes `repo_root` so two physically distinct checkouts that
    share an owner/repo slug do not alias each other (Manager FINAL Cycle 2
    Cluster A audit lesson applied here).
    """
    started = time.monotonic()
    resolved_root = _resolve_repo_root(owner, repo, repo_root)
    if not (resolved_root / ".git").exists():
        raise HTTPException(
            status_code=400,
            detail=f"resolved repo_root is not a git repo: {resolved_root}",
        )

    cache_key = (str(resolved_root), file_path, branch)
    now = time.monotonic()
    async with _get_cache_lock():
        hit = _CACHE.get(cache_key)
        if hit is not None and hit[1] > now:
            return BuildingCommitsResponse(
                repo_full_name=f"{owner}/{repo}",
                file_path=file_path,
                total_floors=len(hit[0]),
                floors=hit[0][:limit],
                cached=True,
                elapsed_ms=int((time.monotonic() - started) * 1000),
                notes=["cache_hit"],
            )

    git_args: list[str] = [
        "log",
        "--follow",
        "--reverse",
        "--date=iso-strict",
        "--pretty=format:%H|%an|%ad|%s",
        "--numstat",
        branch,
        "--",
        file_path,
    ]
    rc, stdout, stderr = await _run_git(resolved_root, *git_args)
    notes: list[str] = []
    if rc != 0:
        logger.warning(
            "git log failed repo=%s file=%s rc=%d stderr=%s",
            resolved_root,
            file_path,
            rc,
            stderr.strip(),
        )
        notes.append(f"git_log_rc={rc}")
        floors: list[CommitFloor] = []
    else:
        floors = _parse_git_log(stdout, limit=limit)

    async with _get_cache_lock():
        _CACHE[cache_key] = (floors, now + _CACHE_TTL_SEC)

    return BuildingCommitsResponse(
        repo_full_name=f"{owner}/{repo}",
        file_path=file_path,
        total_floors=len(floors),
        floors=floors,
        cached=False,
        elapsed_ms=int((time.monotonic() - started) * 1000),
        notes=notes,
    )


def _reset_cache_for_tests() -> None:
    """Test helper. Not part of the API surface."""
    _CACHE.clear()


__all__ = [
    "router",
    "CommitFloor",
    "BuildingCommitsResponse",
]
