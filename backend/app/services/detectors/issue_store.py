"""Issue + PR + commit metadata source for spec-drift detectors.

Cycle 4-5: real spec-drift A-E need issue events + linked PR data + commit
history. Demeter `list_issues_for_repo` + `list_prs_for_repo` not yet shipped
(Pythia contract `hades-to-demeter.md`, Demeter cycle 2 owner). This module
provides a portable adapter:

- If `<repo_root>/.codeplex/issues.json` fixture exists, load it. This is the
  Themis Day-0 prep demo dataset format.
- Else, fall back to empty + emit Lock 5 honest claim from each drift detector
  noting `issues_source_unavailable`.

Fixture JSON shape:
```json
{
    "issues": [
        {
            "id": 234, "title": "...", "body": "...",
            "state": "closed", "created_at": "...", "closed_at": "...",
            "reopened_count": 2,
            "reopened_at": ["...", "..."],
            "labels": ["bug"],
            "linked_prs": [{"number": 456, "merged_at": "...", "files": ["..."]}]
        }
    ],
    "commits_by_file": {
        "path/to/file.ts": [
            {"sha": "abc", "message": "fix: ...", "author": "user", "committed_at": "..."}
        ]
    }
}
```

Per _meta/decisions/nemesis_drift_algo.md.
"""
from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any

log = logging.getLogger("nemesis.issue_store")


FIXTURE_RELATIVE_PATH = Path(".codeplex") / "issues.json"


@dataclass(frozen=True)
class LinkedPR:
    number: int
    merged_at: str | None
    files: tuple[str, ...] = ()
    title: str = ""
    body: str = ""

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "LinkedPR":
        return cls(
            number=int(d.get("number", 0)),
            merged_at=d.get("merged_at"),
            files=tuple(str(f) for f in d.get("files", []) if isinstance(f, str)),
            title=str(d.get("title", "")),
            body=str(d.get("body", "")),
        )


@dataclass(frozen=True)
class Issue:
    id: int
    title: str
    body: str
    state: str  # "open" | "closed"
    created_at: str | None
    closed_at: str | None
    reopened_count: int
    reopened_at: tuple[str, ...]
    labels: tuple[str, ...]
    linked_prs: tuple[LinkedPR, ...]

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "Issue":
        return cls(
            id=int(d.get("id", 0)),
            title=str(d.get("title", "")),
            body=str(d.get("body", "")),
            state=str(d.get("state", "open")),
            created_at=d.get("created_at"),
            closed_at=d.get("closed_at"),
            reopened_count=int(d.get("reopened_count", 0)),
            reopened_at=tuple(str(s) for s in d.get("reopened_at", []) if isinstance(s, str)),
            labels=tuple(str(s) for s in d.get("labels", []) if isinstance(s, str)),
            linked_prs=tuple(LinkedPR.from_dict(p) for p in d.get("linked_prs", []) if isinstance(p, dict)),
        )


@dataclass(frozen=True)
class Commit:
    sha: str
    message: str
    author: str
    committed_at: str

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "Commit":
        return cls(
            sha=str(d.get("sha", "")),
            message=str(d.get("message", "")),
            author=str(d.get("author", "")),
            committed_at=str(d.get("committed_at", "")),
        )


@dataclass
class IssueStore:
    issues: list[Issue] = field(default_factory=list)
    commits_by_file: dict[str, list[Commit]] = field(default_factory=dict)
    source: str = "missing"

    @property
    def is_empty(self) -> bool:
        return not self.issues and not self.commits_by_file


def load_issue_store(repo_root: Path) -> IssueStore:
    """Load fixture-backed IssueStore for the given repo root."""
    if not isinstance(repo_root, Path) or not repo_root.exists():
        return IssueStore(source="missing")

    fixture_path = repo_root / FIXTURE_RELATIVE_PATH
    if not fixture_path.exists() or not fixture_path.is_file():
        return IssueStore(source="missing")

    try:
        data = json.loads(fixture_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        log.warning("IssueStore fixture parse failed at %s: %s", fixture_path, exc)
        return IssueStore(source="parse_error")

    issues = [Issue.from_dict(i) for i in (data.get("issues") or []) if isinstance(i, dict)]
    commits_raw = data.get("commits_by_file") or {}
    commits_by_file: dict[str, list[Commit]] = {}
    if isinstance(commits_raw, dict):
        for file_path, commit_list in commits_raw.items():
            if not isinstance(file_path, str) or not isinstance(commit_list, list):
                continue
            commits_by_file[file_path] = [Commit.from_dict(c) for c in commit_list if isinstance(c, dict)]
    return IssueStore(issues=issues, commits_by_file=commits_by_file, source="fixture")


# Path extraction regex (shared by Patterns A + B + C).
_FILE_PATH_REGEX = __import__("re").compile(
    r"""(?xi)
    (?<![A-Za-z0-9_/.])           # word boundary
    (?:[A-Za-z0-9_\-]+/){0,6}     # up to 6 directory components
    [A-Za-z0-9_\-]+
    \.(?:ts|tsx|js|jsx|py|go|java|rs|rb|php|kt|swift|c|cpp|cc|h|hpp|m|mm)
    (?![A-Za-z0-9_])
    """
)


_PATH_ALLOWLIST_FRAGMENTS = (
    "README", "CHANGELOG", "LICENSE", "CONTRIBUTING",
    "test_", "_test.", ".test.", ".spec.", "/tests/", "/test/", "/__tests__/",
)


def extract_file_paths(text: str) -> list[str]:
    """Extract probable source file paths from an issue or PR body.

    Skips README / test fixtures per drift algo doc false-positive mitigation.
    Returns distinct in-order list.
    """
    if not text:
        return []
    seen: set[str] = set()
    out: list[str] = []
    for match in _FILE_PATH_REGEX.finditer(text):
        candidate = match.group(0)
        if any(frag in candidate for frag in _PATH_ALLOWLIST_FRAGMENTS):
            continue
        if candidate in seen:
            continue
        seen.add(candidate)
        out.append(candidate)
    return out


def parse_iso8601(s: str | None) -> datetime | None:
    if not s:
        return None
    try:
        if s.endswith("Z"):
            s = s[:-1] + "+00:00"
        return datetime.fromisoformat(s)
    except (TypeError, ValueError):
        return None


def days_between(later: str | None, earlier: str | None) -> int | None:
    a = parse_iso8601(later)
    b = parse_iso8601(earlier)
    if a is None or b is None:
        return None
    return int((a - b).total_seconds() // 86400)
