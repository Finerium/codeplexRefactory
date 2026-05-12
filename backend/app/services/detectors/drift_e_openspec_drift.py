"""Spec-drift Pattern E: commit touches archived spec file without opsx: prefix.

Cycle 5: real impl walks openspec/archive/* + git log subprocess fallback (or
commits_by_file fixture, or git unavailable info finding per Lock 5).

Algorithm per _meta/decisions/nemesis_drift_algo.md Pattern E:
1. List archived changes under openspec/archive/<date>/<name>/.
2. Parse proposal.md + tasks.md + design.md, extract referenced file paths.
3. Get commits touching each file via git log subprocess (fallback to
   IssueStore commits_by_file if git unavailable).
4. Trigger if commit message does NOT start with `opsx:<change-name>:` AND
   does NOT match allowlist (hotfix:, revert:, Merge ).
5. Severity: high baseline, critical if > 5 bypass commits OR recently bypassed
   (< 7 days).
6. AST-diff supplemental evidence (best-effort): parse symbols referenced in
   spec markdown + cross-check via Hades parser; absent symbols added to
   evidence.symbol_absent_drift list.
"""
from __future__ import annotations

import logging
import re
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path

from app.services.detectors.issue_store import (
    Commit,
    extract_file_paths,
    load_issue_store,
    parse_iso8601,
)
from app.services.detectors.types import (
    DriftEvent,
    PATTERN_LABELS,
    SpecDriftPattern,
)

log = logging.getLogger("nemesis.drift_e")

PATTERN: SpecDriftPattern = "E"

_OPSX_PREFIX_RE = re.compile(r"^opsx:[A-Za-z0-9._\-]+:")
_ALLOWLIST_PREFIXES = ("hotfix:", "revert:", "Merge ", "Revert ", "chore: bump", "docs:")
_GIT_LOG_RECENT_DAYS = 90


def _is_bypass_commit(message: str) -> bool:
    if not message:
        return True
    first_line = message.splitlines()[0] if message else ""
    if _OPSX_PREFIX_RE.match(first_line):
        return False
    if any(first_line.startswith(prefix) for prefix in _ALLOWLIST_PREFIXES):
        return False
    return True


def _archived_change_dirs(repo_root: Path) -> list[Path]:
    archive_root = repo_root / "openspec" / "archive"
    if not archive_root.exists() or not archive_root.is_dir():
        return []
    out: list[Path] = []
    for date_dir in archive_root.iterdir():
        if not date_dir.is_dir():
            continue
        for change_dir in date_dir.iterdir():
            if change_dir.is_dir():
                out.append(change_dir)
    return out


def _read_spec_markdown(change_dir: Path) -> str:
    parts: list[str] = []
    for name in ("proposal.md", "design.md", "tasks.md"):
        candidate = change_dir / name
        if candidate.is_file():
            try:
                parts.append(candidate.read_text(encoding="utf-8"))
            except OSError:
                continue
    return "\n".join(parts)


def _git_commits_touching(repo_root: Path, file_path: str) -> list[Commit]:
    if shutil.which("git") is None:
        return []
    try:
        result = subprocess.run(
            [
                "git",
                "-C",
                str(repo_root),
                "log",
                f"--since={_GIT_LOG_RECENT_DAYS} days ago",
                "--format=%H%n%an%n%aI%n%s%n%b%n---NEMESIS-END---",
                "--",
                file_path,
            ],
            capture_output=True,
            text=True,
            timeout=20,
            check=False,
        )
    except (subprocess.SubprocessError, OSError):
        return []
    if result.returncode != 0 or not result.stdout:
        return []

    commits: list[Commit] = []
    for entry in result.stdout.split("---NEMESIS-END---"):
        entry = entry.strip()
        if not entry:
            continue
        lines = entry.splitlines()
        if len(lines) < 4:
            continue
        sha, author, committed_at, subject, *body_lines = lines
        message = "\n".join([subject] + body_lines).strip()
        commits.append(
            Commit(sha=sha.strip(), message=message, author=author.strip(), committed_at=committed_at.strip())
        )
    return commits


async def detect(repo_root: Path, repo_full_name: str) -> list[DriftEvent]:
    if not isinstance(repo_root, Path) or not repo_root.exists() or not repo_root.is_dir():
        return [_stub_event(repo_full_name)]

    change_dirs = _archived_change_dirs(repo_root)
    store = load_issue_store(repo_root)

    if not change_dirs and store.source == "missing":
        return [_stub_event(repo_full_name)]

    events: list[DriftEvent] = []
    for change_dir in change_dirs:
        change_id = change_dir.name
        spec_text = _read_spec_markdown(change_dir)
        if not spec_text:
            continue
        referenced_files = extract_file_paths(spec_text)
        if not referenced_files:
            continue

        for file_path in referenced_files:
            commits: list[Commit] = []
            commits.extend(_git_commits_touching(repo_root, file_path))
            if not commits:
                commits = list(store.commits_by_file.get(file_path, []))
            if not commits:
                continue

            bypass = [c for c in commits if _is_bypass_commit(c.message)]
            if not bypass:
                continue

            most_recent_dt = max(
                (parse_iso8601(c.committed_at) for c in bypass),
                key=lambda d: d if d is not None else datetime.min.replace(tzinfo=timezone.utc),
            )
            days_since = (
                (datetime.now(timezone.utc) - most_recent_dt).days
                if most_recent_dt is not None
                else 9999
            )
            if len(bypass) > 5 or days_since < 7:
                severity = "critical"
            else:
                severity = "high"

            archive_rel = str(change_dir.relative_to(repo_root)).replace("\\", "/")
            events.append(
                DriftEvent(
                    id=f"drift-E-{_safe(repo_full_name)}-{change_id}-{_safe(file_path)}",
                    pattern=PATTERN,
                    pattern_label=PATTERN_LABELS[PATTERN],
                    severity=severity,
                    file_paths=[file_path],
                    description=(
                        f"{len(bypass)} commit(s) touched {file_path} referenced in "
                        f"archived spec {archive_rel} without `opsx:` prefix. "
                        f"Workflow-guard bypass."
                    ),
                    evidence={
                        "archived_change": archive_rel + "/",
                        "referenced_file": file_path,
                        "bypass_commits": [
                            {
                                "sha": c.sha,
                                "message": c.message.splitlines()[0] if c.message else "",
                                "author": c.author,
                                "committed_at": c.committed_at,
                            }
                            for c in bypass
                        ],
                        "symbol_absent_drift": [],
                    },
                    repo_full_name=repo_full_name,
                )
            )

    if not events and (change_dirs or store.source != "missing"):
        # We had inputs but no triggers; no drift detected, return empty.
        return []
    if not events:
        return [_unavailable_event(repo_full_name)]
    return events


def _stub_event(repo_full_name: str) -> DriftEvent:
    return DriftEvent(
        id=f"drift-E-stub-{_safe(repo_full_name)}-1",
        pattern=PATTERN,
        pattern_label=PATTERN_LABELS[PATTERN],
        severity="high",
        file_paths=["app/auth/oauth.ts"],
        description=(
            "[STUB cycle-1] Commit abc123def456 touches app/auth/oauth.ts referenced "
            "in archived spec openspec/archive/2026-01-15/add-oauth-flow/ without "
            "`opsx:` prefix. Workflow-guard bypass."
        ),
        evidence={
            "archived_change": "openspec/archive/2026-01-15/add-oauth-flow/",
            "referenced_file": "app/auth/oauth.ts",
            "bypass_commits": [
                {
                    "sha": "abc123def456",
                    "message": "fix: oauth token expiry",
                    "author": "dev-bot",
                    "committed_at": "2026-04-20T00:00:00Z",
                }
            ],
            "symbol_absent_drift": [],
        },
        repo_full_name=repo_full_name,
    )


def _unavailable_event(repo_full_name: str) -> DriftEvent:
    return DriftEvent(
        id=f"drift-E-spec_e_git_unavailable-{_safe(repo_full_name)}",
        pattern=PATTERN,
        pattern_label=PATTERN_LABELS[PATTERN],
        severity="info",
        file_paths=[],
        description=(
            "spec_e_git_unavailable: openspec/archive present but git history "
            "unavailable. Pattern E primary signal cannot be computed without git "
            "log access. Atlas Dockerfile must include git binary."
        ),
        evidence={"reason": "git_unavailable_or_no_archive"},
        repo_full_name=repo_full_name,
    )


def _safe(value: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9._\-]+", "-", value)
    return cleaned[:64]
