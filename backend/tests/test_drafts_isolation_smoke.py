"""Smoke test for the drafts/ isolation safety guard (AD-19 LOCKED).

Owner: Pandora (Wave 3).

This is the Cycle 1 priority test. The 5 attack vectors below MUST
raise ``DraftIsolationViolation`` BEFORE any filesystem write occurs.
A regression here means the simulation engine can escape the sandbox
and mutate production code, which is the pitch defensibility crash
condition per PRD AD-19 LOCKED + ``.claude/agents/pandora.md`` Item 17.

Run locally:
    cd backend
    python -m pytest tests/test_drafts_isolation_smoke.py -v

Compliance: Lock 1 (no em dash). Lock 2 (no emoji). Lock 5 fixtures
labeled as [MOCK simulation_id] where applicable.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

import pytest

# Ensure the backend package is importable when pytest is invoked from
# the repository root or the backend directory.
ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.services.refactor.drafts_isolation import (  # noqa: E402
    DraftIsolationViolation,
    cleanup_simulation_dir,
    safe_draft_read,
    safe_draft_write,
    simulation_dir,
)


SIM_ID = "sim-mock-add-2fa-login"


# ---------------------------------------------------------------------------
# Happy path
# ---------------------------------------------------------------------------


def test_safe_draft_write_happy_path(tmp_path: Path) -> None:
    """Normal write into drafts/<sim_id>/tests/test.py succeeds and returns
    the absolute resolved path under tmp_path."""
    target = safe_draft_write(
        SIM_ID,
        "tests/test_two_factor.py",
        "def test_pass():\n    assert True\n",
        drafts_root_override=tmp_path,
    )
    assert target.exists()
    assert target.is_file()
    assert target.read_text() == "def test_pass():\n    assert True\n"
    # Resolved path is a child of tmp_path / SIM_ID.
    assert target.parent.parent == (tmp_path / SIM_ID).resolve()


def test_safe_draft_write_nested_directories(tmp_path: Path) -> None:
    """Deep nested writes (backend/app/security/two_factor.py) succeed."""
    target = safe_draft_write(
        SIM_ID,
        "backend/app/security/two_factor.py",
        "# 2FA module\n",
        drafts_root_override=tmp_path,
    )
    assert target.exists()
    expected_root = (tmp_path / SIM_ID).resolve()
    # The full nested directory must live under the simulation dir.
    assert str(target).startswith(str(expected_root))


def test_safe_draft_read_round_trip(tmp_path: Path) -> None:
    """Read returns what write produced."""
    safe_draft_write(
        SIM_ID,
        "diff.patch",
        "diff --git a/x b/x\n",
        drafts_root_override=tmp_path,
    )
    content = safe_draft_read(
        SIM_ID,
        "diff.patch",
        drafts_root_override=tmp_path,
    )
    assert content == "diff --git a/x b/x\n"


# ---------------------------------------------------------------------------
# Attack vectors (each must raise DraftIsolationViolation BEFORE write)
# ---------------------------------------------------------------------------


def test_parent_traversal_blocked(tmp_path: Path) -> None:
    """Attempt to escape via ../../ parent traversal raises."""
    with pytest.raises(DraftIsolationViolation):
        safe_draft_write(
            SIM_ID,
            "../../etc/passwd",
            "malicious",
            drafts_root_override=tmp_path,
        )
    # Verify no write happened.
    target_check = (tmp_path / SIM_ID / ".." / ".." / "etc").resolve()
    assert not target_check.exists() or not (target_check / "passwd").exists()


def test_absolute_path_blocked(tmp_path: Path) -> None:
    """Absolute paths (starting with /) are rejected before resolve."""
    with pytest.raises(DraftIsolationViolation):
        safe_draft_write(
            SIM_ID,
            "/etc/passwd",
            "malicious",
            drafts_root_override=tmp_path,
        )


def test_sibling_simulation_blocked(tmp_path: Path) -> None:
    """Writing into a sibling simulation directory via ../ traversal
    raises even though the target is still under drafts_root."""
    with pytest.raises(DraftIsolationViolation):
        safe_draft_write(
            SIM_ID,
            "../sim-other/leak.py",
            "leak",
            drafts_root_override=tmp_path,
        )


def test_invalid_simulation_id_path_separator_blocked(tmp_path: Path) -> None:
    """simulation_id containing path separator raises."""
    with pytest.raises(DraftIsolationViolation):
        safe_draft_write(
            "../escape",
            "x.py",
            "malicious",
            drafts_root_override=tmp_path,
        )


def test_invalid_simulation_id_special_chars_blocked(tmp_path: Path) -> None:
    """simulation_id with whitespace / special characters raises."""
    with pytest.raises(DraftIsolationViolation):
        safe_draft_write(
            "sim with space",
            "x.py",
            "malicious",
            drafts_root_override=tmp_path,
        )


def test_empty_simulation_id_blocked(tmp_path: Path) -> None:
    """Empty simulation_id raises."""
    with pytest.raises(DraftIsolationViolation):
        safe_draft_write(
            "",
            "x.py",
            "malicious",
            drafts_root_override=tmp_path,
        )


def test_null_byte_in_relative_path_blocked(tmp_path: Path) -> None:
    """Null byte in relative_path raises (defence-in-depth)."""
    with pytest.raises(DraftIsolationViolation):
        safe_draft_write(
            SIM_ID,
            "tests/test\x00escape.py",
            "malicious",
            drafts_root_override=tmp_path,
        )


def test_symlink_escape_blocked(tmp_path: Path) -> None:
    """Symlink pointing outside drafts root is caught by resolve check.

    Setup: create drafts/<sim_id>/escape -> /tmp (or sibling). Attempt
    to write through it should raise.
    """
    # Build the simulation dir then plant a symlink.
    sim_dir = simulation_dir(SIM_ID, drafts_root_override=tmp_path)
    escape_target = tmp_path.parent / "outside_drafts"
    escape_target.mkdir(parents=True, exist_ok=True)
    link = sim_dir / "escape"
    if link.exists() or link.is_symlink():
        link.unlink()
    try:
        link.symlink_to(escape_target, target_is_directory=True)
    except OSError:
        # Platform without symlink support (Windows without admin):
        # skip this attack vector; the absolute resolve guard above
        # is still active and would catch it if symlinks existed.
        pytest.skip("symlink not supported on this platform")
        return

    with pytest.raises(DraftIsolationViolation):
        safe_draft_write(
            SIM_ID,
            "escape/leak.py",
            "leaked",
            drafts_root_override=tmp_path,
        )
    # Cleanup so the test directory does not leak.
    if (escape_target / "leak.py").exists():
        (escape_target / "leak.py").unlink()
    escape_target.rmdir()


# ---------------------------------------------------------------------------
# Cleanup behaviour
# ---------------------------------------------------------------------------


def test_cleanup_simulation_dir_removes_tree(tmp_path: Path) -> None:
    """Discard path cleans the entire simulation directory."""
    safe_draft_write(
        SIM_ID,
        "tests/test_a.py",
        "a",
        drafts_root_override=tmp_path,
    )
    safe_draft_write(
        SIM_ID,
        "src/two_factor.py",
        "b",
        drafts_root_override=tmp_path,
    )
    sim_dir = simulation_dir(SIM_ID, drafts_root_override=tmp_path)
    assert sim_dir.exists()
    ok = cleanup_simulation_dir(SIM_ID, drafts_root_override=tmp_path)
    assert ok is True
    assert not sim_dir.exists()


def test_cleanup_idempotent_when_missing(tmp_path: Path) -> None:
    """Cleaning a non-existent simulation returns True (no-op)."""
    ok = cleanup_simulation_dir("sim-not-created", drafts_root_override=tmp_path)
    assert ok is True


# ---------------------------------------------------------------------------
# Env override (DRAFTS_ROOT)
# ---------------------------------------------------------------------------


def test_env_var_overrides_default(tmp_path: Path, monkeypatch) -> None:
    """DRAFTS_ROOT env var is honored when no explicit override."""
    monkeypatch.setenv("DRAFTS_ROOT", str(tmp_path / "env-drafts"))
    target = safe_draft_write(
        SIM_ID,
        "x.py",
        "via env",
    )
    assert (tmp_path / "env-drafts").resolve() in target.parents
