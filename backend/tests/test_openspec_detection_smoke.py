"""Smoke test for has_openspec_folder + resolve_openspec_root.

Manager FINAL Cycle 2 Cluster D Pandora ship (STAMP=20260513-0857).

Captures the regression that produced URL-encoded GitHub Issue fallback
links inside the runtime Docker container. Pre-fix: ``Path(".")`` in the
container resolves to /app where openspec/ is NOT present, so
``has_openspec_folder`` returned False and the SSE stream branched into
``proposal.fallback.github_issue`` instead of streaming the proposal
plus design plus tasks markdown.

Fix (verified by these tests):
1. ``has_openspec_folder`` consults the bundled fallback chain.
2. ``resolve_openspec_root`` returns the path of whichever ancestor
   directory contains openspec/, so OpenSpecGenerator writes the change
   folder in the right place.
3. BUNDLED_OPENSPEC_ROOT env override wins over the static /app hint.

Compliance: Lock 1 (no em dash). Lock 2 (no emoji).
"""

from __future__ import annotations

import os
from pathlib import Path

import pytest

from app.services.refactor.github_issue_fallback import (
    has_openspec_folder,
    resolve_openspec_root,
)


@pytest.fixture(autouse=True)
def _isolate_env(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    """Clear BUNDLED_OPENSPEC_ROOT + chdir to tmp so production env never leaks in."""
    monkeypatch.delenv("BUNDLED_OPENSPEC_ROOT", raising=False)
    monkeypatch.chdir(tmp_path)


def _make_openspec_dir(parent: Path) -> Path:
    """Create a minimal openspec/ subtree under ``parent``."""
    openspec = parent / "openspec"
    (openspec / "specs").mkdir(parents=True)
    (openspec / "changes").mkdir(parents=True)
    (openspec / "project.md").write_text("# project")
    return openspec


def test_has_openspec_returns_true_when_repo_root_has_it(tmp_path: Path) -> None:
    """The classic happy path: caller passes a path with openspec/."""
    _make_openspec_dir(tmp_path)
    assert has_openspec_folder(tmp_path) is True
    assert resolve_openspec_root(tmp_path) == tmp_path


def test_has_openspec_returns_false_when_no_repo_root_and_no_bundle(
    tmp_path: Path,
) -> None:
    """No caller path + no bundled path = GitHub Issue fallback fires."""
    empty = tmp_path / "empty"
    empty.mkdir()
    # No bundled root, no /app/openspec (we are on macOS / Linux laptop).
    assert has_openspec_folder(empty) is False
    assert resolve_openspec_root(empty) is None


def test_bundled_root_env_overrides_missing_repo_root(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Cluster D fix verification: BUNDLED_OPENSPEC_ROOT lights up the path.

    Inside the runtime container the project ships at /app and openspec/
    is bundled at /app/openspec via the Atlas Dockerfile COPY. Tests
    simulate this with an explicit BUNDLED_OPENSPEC_ROOT pointing at a
    tmp_path that contains openspec/.
    """
    bundle = tmp_path / "container_root"
    bundle.mkdir()
    _make_openspec_dir(bundle)
    monkeypatch.setenv("BUNDLED_OPENSPEC_ROOT", str(bundle))

    empty_caller = tmp_path / "no_openspec_here"
    empty_caller.mkdir()
    assert has_openspec_folder(empty_caller) is True
    assert resolve_openspec_root(empty_caller) == bundle.resolve()


def test_caller_path_wins_over_bundled_root(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Real cloned repo path should take precedence over the bundle.

    Otherwise a user pointing at gadablotnok/web-esp32log (no openspec/)
    would silently land in the project's own openspec/changes/, which
    would confuse the demo.
    """
    bundle = tmp_path / "bundle"
    bundle.mkdir()
    _make_openspec_dir(bundle)
    monkeypatch.setenv("BUNDLED_OPENSPEC_ROOT", str(bundle))

    real_repo = tmp_path / "real_repo"
    _make_openspec_dir(real_repo)
    assert has_openspec_folder(real_repo) is True
    # Returns the caller path (not the bundle) so OpenSpecGenerator writes
    # into the real cloned repo's openspec/changes/.
    assert resolve_openspec_root(real_repo) == real_repo


def test_caller_path_without_openspec_falls_back_to_bundle(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A cloned repo without openspec/ falls through to bundled (for demo).

    This is the project-self-demo case: /tmp/finerium-codeplexrefactory
    is cloned without its openspec/, so we fall back to /app/openspec
    which Atlas bundled at build time.
    """
    bundle = tmp_path / "bundle"
    bundle.mkdir()
    _make_openspec_dir(bundle)
    monkeypatch.setenv("BUNDLED_OPENSPEC_ROOT", str(bundle))

    cloned_without = tmp_path / "cloned_without"
    cloned_without.mkdir()  # no openspec/ inside
    assert has_openspec_folder(cloned_without) is True
    assert resolve_openspec_root(cloned_without) == bundle.resolve()


def test_cwd_walkup_discovers_openspec_for_local_dev(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Local dev: uvicorn cwd is ``backend/``; openspec/ at ``../openspec``.

    Without BUNDLED_OPENSPEC_ROOT env, the walkup discovery should find
    the project openspec/ one level up so the local dev test against
    `localhost:8000/api/refactor/propose` works the same way as the
    container demo.
    """
    project_root = tmp_path / "project"
    project_root.mkdir()
    _make_openspec_dir(project_root)

    backend_dir = project_root / "backend"
    backend_dir.mkdir()
    monkeypatch.chdir(backend_dir)

    caller = Path(".")  # uvicorn default
    assert has_openspec_folder(caller) is True
    assert resolve_openspec_root(caller) == project_root.resolve()
