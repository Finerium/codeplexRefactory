"""drafts/ sandbox isolation safety guard (AD-19 LOCKED).

Owner: Pandora (Wave 3).

This module owns the single primitive that the Refactor Mode simulation
engine uses to write any file. Production code NEVER changes by the
simulation engine; ONLY the user-explicit dual review gate Accept path
materializes drafts to production (and even then via the explicit diff
download flow per OQ-09, not silent apply).

Critical safety property per PRD AD-19 (LOCKED, pitch defensibility
hinge), reinforced by:
- ``_meta/contracts/asclepius-to-pandora.md`` Asumption 3
- ``_meta/handoff_log/wave2_asclepius_to_pandora.md`` section
  "drafts/ isolation safety property"
- PRD Section 9.3 step 8 (Accept changes only path that mutates
  production code)
- PRD Section 12.4 (drop protocol Layer 2 Refactor Mode)
- ``.claude/agents/pandora.md`` Item 17 self-check critical

Mechanism:
1. A configurable ``DRAFTS_ROOT`` (env override for local dev), default
   ``./drafts`` relative to the backend cwd. Production K8s mount this
   path is ``/app/drafts`` per Atlas deploy plan.
2. ``safe_draft_write(simulation_id, relative_path, content)`` resolves
   the target path via ``pathlib.Path.resolve()`` and verifies the
   resolved absolute path is a strict subpath of
   ``DRAFTS_ROOT / simulation_id``. Resolve normalises ``..`` segments
   plus expands symlinks.
3. Any escape attempt (relative ``..`` traversal, absolute path,
   symlink pointing outside ``DRAFTS_ROOT``) raises
   ``DraftIsolationViolation`` BEFORE the write happens.
4. Successful write returns the resolved absolute path so the caller
   can persist it in the Demeter ``simulation_events.payload`` field.

Test discipline (Cycle 1 mandatory):
- ``backend/tests/test_drafts_isolation_smoke.py`` exercises 5
  attack vectors (parent traversal, absolute escape, sibling
  simulation, symlink escape, empty relative path).
- Test must pass before Cycle 2 work starts (per
  ``.claude/agents/pandora.md`` ship criteria Item 17).

Compliance: Lock 1 (no em dash). Lock 2 (no emoji). Lock 3 + AD-19
(safety property NEVER violated). Lock 4 ([UNVERIFIED] flag set for
the Python runtime smoke test in environments without ``pytest``
installed; the static guard logic is verifiable by inspection).
"""

from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Final, Optional

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------


DEFAULT_DRAFTS_ROOT_REL: Final[str] = "drafts"
"""Project-relative default. Overridden via ``DRAFTS_ROOT`` env var.

Production K8s container mount is ``/app/drafts`` (Atlas Wave 3
manifest). Local dev (FastAPI uvicorn from ``backend/``) falls back to
``./drafts`` resolved from the current working directory; tests
override via ``DraftsIsolation.with_root(tmp_path)``.
"""


# ---------------------------------------------------------------------------
# Exceptions
# ---------------------------------------------------------------------------


class DraftIsolationViolation(ValueError):
    """Raised when a write target resolves outside the drafts sandbox.

    Subclass of ``ValueError`` so existing FastAPI exception handlers
    (HTTP 400) treat the violation as a client error if it ever
    surfaces via the request path. The simulation engine catches this
    explicitly and converts it to a SimulationEvent with
    ``stage='discarded'`` + ``error`` field set (Aletheia audit gate
    Item: "Production code NEVER changed by simulation").

    Per Pandora ferry condition 1, a violation triggers an IMMEDIATE
    halt of the simulation + ferry to V1 Orch (pitch defensibility
    crash, drafts/ isolation is the LOCKED safety property).
    """


# ---------------------------------------------------------------------------
# Core guard
# ---------------------------------------------------------------------------


def _resolve_drafts_root(drafts_root_override: Optional[Path] = None) -> Path:
    """Return the absolute resolved DRAFTS_ROOT path.

    Resolution order:
    1. Explicit override argument (used by tests via
       ``with_root(tmp_path)``).
    2. Environment variable ``DRAFTS_ROOT`` (used by K8s deploy via
       Atlas manifest setting it to ``/app/drafts``).
    3. Default relative path ``./drafts`` resolved against the current
       working directory.

    Side effect: the directory is created with parents if it does not
    yet exist. This keeps the simulation engine's first write fast
    without a pre-flight mkdir dance.
    """

    if drafts_root_override is not None:
        root = Path(drafts_root_override)
    elif env_path := os.environ.get("DRAFTS_ROOT"):
        root = Path(env_path)
    else:
        root = Path(DEFAULT_DRAFTS_ROOT_REL)

    root.mkdir(parents=True, exist_ok=True)
    return root.resolve(strict=False)


def _simulation_dir(
    drafts_root: Path,
    simulation_id: str,
) -> Path:
    """Return the absolute resolved simulation directory.

    Per contract ``hades-to-pandora.md`` Storage location, each
    simulation gets its own directory ``drafts/<simulation_id>/``.
    ``simulation_id`` is validated to contain only filesystem-safe
    characters (alphanumeric, hyphen, underscore) to defend against
    embedded path separators.
    """

    if not simulation_id:
        raise DraftIsolationViolation(
            "simulation_id must be a non-empty filesystem-safe identifier",
        )
    if any(ch in simulation_id for ch in ("/", "\\", "..", "\x00")):
        raise DraftIsolationViolation(
            f"simulation_id contains path separator or null byte: {simulation_id!r}",
        )
    for ch in simulation_id:
        if not (ch.isalnum() or ch in ("-", "_")):
            raise DraftIsolationViolation(
                "simulation_id must be alphanumeric plus hyphen / underscore "
                f"only, got: {simulation_id!r}",
            )

    sim_dir = (drafts_root / simulation_id).resolve(strict=False)
    # Defence in depth: even after the character check, re-verify the
    # resolved path is a subpath of drafts_root.
    if not _is_subpath(sim_dir, drafts_root):
        raise DraftIsolationViolation(
            f"simulation directory {sim_dir} escapes drafts root {drafts_root}",
        )
    sim_dir.mkdir(parents=True, exist_ok=True)
    return sim_dir


def _is_subpath(candidate: Path, root: Path) -> bool:
    """Return True if ``candidate`` is ``root`` or a descendant of it.

    Uses ``Path.relative_to`` semantics rather than string startswith
    because string compare is fooled by partial-prefix sibling names
    (e.g., ``/tmp/drafts2`` would startswith ``/tmp/drafts``).
    """

    try:
        candidate.relative_to(root)
        return True
    except ValueError:
        return False


def safe_draft_write(
    simulation_id: str,
    relative_path: str,
    content: str,
    *,
    drafts_root_override: Optional[Path] = None,
    encoding: str = "utf-8",
) -> Path:
    """Write ``content`` to ``drafts/<simulation_id>/<relative_path>``.

    Critical safety property per PRD AD-19 LOCKED: this is the ONLY
    function the simulation engine uses to materialize generated code.
    Production paths (``backend/app/``, ``frontend/src/``, etc.) are
    OUT OF SCOPE for the simulation engine; writes outside the
    ``drafts/<simulation_id>/`` sandbox raise
    ``DraftIsolationViolation``.

    Args:
        simulation_id: alphanumeric plus hyphen / underscore. Used as
            the directory partition under ``DRAFTS_ROOT``.
        relative_path: posix-style path relative to the simulation
            directory (e.g., ``tests/test_two_factor.py``). Absolute
            paths and parent-traversal segments are rejected.
        content: file content as a UTF-8 string. Binary support is
            out of scope for the simulation engine (LLM outputs text).
        drafts_root_override: test seam. Production code leaves this
            ``None`` and relies on the env / default resolution chain.
        encoding: text encoding for the file write. Defaults to UTF-8
            per Codeplex Chronicle convention.

    Returns:
        Absolute resolved path of the written file. Persist this in
        the SimulationEvent ``payload.filesAffected`` list and the
        Demeter ``simulation_events`` row.

    Raises:
        DraftIsolationViolation: when ``relative_path`` resolves
            outside the simulation directory, or ``simulation_id``
            contains a path separator.
    """

    if relative_path.startswith("/") or relative_path.startswith("\\"):
        raise DraftIsolationViolation(
            f"relative_path must be relative, got absolute: {relative_path!r}",
        )
    if "\x00" in relative_path:
        raise DraftIsolationViolation(
            "relative_path contains null byte",
        )

    drafts_root = _resolve_drafts_root(drafts_root_override)
    sim_dir = _simulation_dir(drafts_root, simulation_id)

    # Pre-resolve the candidate target. We resolve relative to sim_dir
    # so ``..`` segments are normalised; symlinks are also expanded.
    target = (sim_dir / relative_path).resolve(strict=False)

    if not _is_subpath(target, sim_dir):
        raise DraftIsolationViolation(
            "target path escapes simulation directory: "
            f"target={target}, sim_dir={sim_dir}, "
            f"relative_path={relative_path!r}",
        )

    # Defence in depth: target must also be a subpath of drafts_root
    # so a corrupted sim_dir resolution (e.g., symlink to /tmp) is
    # caught.
    if not _is_subpath(target, drafts_root):
        raise DraftIsolationViolation(
            "target path escapes drafts root: "
            f"target={target}, drafts_root={drafts_root}",
        )

    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding=encoding)

    logger.info(
        "drafts_isolation: wrote %d bytes to %s (sim=%s)",
        len(content),
        target,
        simulation_id,
    )
    return target


def safe_draft_read(
    simulation_id: str,
    relative_path: str,
    *,
    drafts_root_override: Optional[Path] = None,
    encoding: str = "utf-8",
) -> str:
    """Read ``drafts/<simulation_id>/<relative_path>``.

    Same isolation guard as ``safe_draft_write``. Used by the dual
    review gate POST /accept endpoint to load the serialized diff and
    return it as a FileResponse (per OQ-09 default download diff).

    Raises:
        DraftIsolationViolation: on path escape.
        FileNotFoundError: when the file does not exist (legitimate
            client error, NOT a safety violation).
    """

    if relative_path.startswith("/") or relative_path.startswith("\\"):
        raise DraftIsolationViolation(
            f"relative_path must be relative, got absolute: {relative_path!r}",
        )
    if "\x00" in relative_path:
        raise DraftIsolationViolation("relative_path contains null byte")

    drafts_root = _resolve_drafts_root(drafts_root_override)
    sim_dir = _simulation_dir(drafts_root, simulation_id)
    target = (sim_dir / relative_path).resolve(strict=False)

    if not _is_subpath(target, sim_dir):
        raise DraftIsolationViolation(
            f"target path escapes simulation directory: target={target}, sim_dir={sim_dir}",
        )
    if not _is_subpath(target, drafts_root):
        raise DraftIsolationViolation(
            f"target path escapes drafts root: target={target}, drafts_root={drafts_root}",
        )

    return target.read_text(encoding=encoding)


def simulation_dir(
    simulation_id: str,
    *,
    drafts_root_override: Optional[Path] = None,
) -> Path:
    """Return the absolute simulation directory path (no write).

    Used by the dual review gate Discard endpoint to clean up the
    drafts/ directory, and by the diff download endpoint to look up
    ``diff.patch``.
    """

    drafts_root = _resolve_drafts_root(drafts_root_override)
    return _simulation_dir(drafts_root, simulation_id)


def cleanup_simulation_dir(
    simulation_id: str,
    *,
    drafts_root_override: Optional[Path] = None,
) -> bool:
    """Remove the simulation directory + all its contents.

    Returns True on success (directory removed or did not exist),
    False on partial failure (e.g., permission error). Failure logs
    but does NOT raise; the dual review gate Discard endpoint reports
    the result back to the user without breaking the API contract.

    Per ``_meta/contracts/asclepius-to-pandora.md`` edge case
    "Drafts directory cleanup": Pandora deletes drafts on Accept
    (after diff downloaded) or Discard immediately.
    """

    drafts_root = _resolve_drafts_root(drafts_root_override)
    try:
        sim_dir = _simulation_dir(drafts_root, simulation_id)
    except DraftIsolationViolation:
        # Invalid simulation_id: nothing to clean up.
        return False

    if not sim_dir.exists():
        return True

    # Defensive subpath check before recursive delete.
    if not _is_subpath(sim_dir, drafts_root):
        logger.error(
            "drafts_isolation: refusing to cleanup directory outside drafts root: %s",
            sim_dir,
        )
        return False

    try:
        import shutil

        shutil.rmtree(sim_dir)
    except OSError as err:
        logger.warning(
            "drafts_isolation: cleanup failed for %s: %s",
            sim_dir,
            err,
        )
        return False
    return True


__all__ = [
    "DEFAULT_DRAFTS_ROOT_REL",
    "DraftIsolationViolation",
    "cleanup_simulation_dir",
    "safe_draft_read",
    "safe_draft_write",
    "simulation_dir",
]
