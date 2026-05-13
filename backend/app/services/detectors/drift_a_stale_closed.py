"""Spec-drift Pattern A: stale closed issue (closed greater-than 6 months,
file mentioned in issue body still edited after close).

Cycle 4: real impl reading from IssueStore fixture (or cycle 1 stub fallback
when fixture absent).

Algorithm per _meta/decisions/nemesis_drift_algo.md Pattern A:
1. Filter closed issues where (now - closed_at) > 6 months (183 days).
2. Extract file paths mentioned in issue body via regex.
3. For each file, find latest commit timestamp from commits_by_file fixture
   (or git subprocess fallback Cycle 5).
4. Trigger if latest_commit_at > closed_at (file edited after close).
5. Severity: medium baseline, high if drift > 365 days.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from pathlib import Path

from app.services.detectors.issue_store import (
    IssueStore,
    extract_file_paths,
    load_issue_store,
    parse_iso8601,
)
from app.services.detectors.types import (
    DriftEvent,
    PATTERN_LABELS,
    SpecDriftPattern,
)

log = logging.getLogger("nemesis.drift_a")

PATTERN: SpecDriftPattern = "A"
STALE_THRESHOLD_DAYS = 183


async def detect(repo_root: Path, repo_full_name: str) -> list[DriftEvent]:
    """Pattern A: stale closed issue with edits after close.

    Manager FINAL Cycle 2 Bug #7 fix (Cluster F Nemesis 20260513-0857): NEVER
    return canned NodeGoat stub event when `.codeplex/issues.json` fixture
    absent. Empty list is the honest answer when the user repo has no issue
    timeline data ingested.
    """
    store = load_issue_store(repo_root)
    if store.source == "missing":
        log.info(
            "drift_a: no .codeplex/issues.json under %s (repo=%s); returning empty",
            repo_root,
            repo_full_name,
        )
        return []

    now = datetime.now(timezone.utc)
    events: list[DriftEvent] = []
    for issue in store.issues:
        if issue.state != "closed":
            continue
        closed_dt = parse_iso8601(issue.closed_at)
        if closed_dt is None:
            continue
        if (now - closed_dt).days < STALE_THRESHOLD_DAYS:
            continue
        candidate_paths = extract_file_paths(issue.body) + extract_file_paths(issue.title)
        candidate_paths = list(dict.fromkeys(candidate_paths))  # dedup keep order
        if not candidate_paths:
            continue

        file_evidence: list[dict] = []
        for file_path in candidate_paths:
            commits = store.commits_by_file.get(file_path, [])
            if not commits:
                continue
            latest = max(
                commits,
                key=lambda c: parse_iso8601(c.committed_at) or datetime.min.replace(tzinfo=timezone.utc),
            )
            latest_dt = parse_iso8601(latest.committed_at)
            if latest_dt is None or latest_dt <= closed_dt:
                continue
            file_evidence.append(
                {
                    "path": file_path,
                    "latest_commit_at": latest.committed_at,
                    "edits_after_close": sum(
                        1
                        for c in commits
                        if (parse_iso8601(c.committed_at) or datetime.min.replace(tzinfo=timezone.utc))
                        > closed_dt
                    ),
                }
            )
        if not file_evidence:
            continue

        drift_age_days = (now - closed_dt).days
        severity = "high" if drift_age_days > 365 else "medium"
        events.append(
            DriftEvent(
                id=f"drift-A-{_safe(repo_full_name)}-issue{issue.id}",
                pattern=PATTERN,
                pattern_label=PATTERN_LABELS[PATTERN],
                severity=severity,
                file_paths=[ev["path"] for ev in file_evidence],
                issue_id=issue.id,
                description=(
                    f"Issue #{issue.id} closed {drift_age_days} days ago, but "
                    f"{len(file_evidence)} mentioned file(s) edited after close. "
                    f"Implementation likely drifted from original spec."
                ),
                evidence={
                    "issue_id": issue.id,
                    "issue_title": issue.title,
                    "closed_at": issue.closed_at,
                    "drift_age_days": drift_age_days,
                    "files": file_evidence,
                },
                repo_full_name=repo_full_name,
            )
        )
    return events


def _stub_event(repo_full_name: str) -> DriftEvent:
    return DriftEvent(
        id=f"drift-A-stub-{_safe(repo_full_name)}-1",
        pattern=PATTERN,
        pattern_label=PATTERN_LABELS[PATTERN],
        severity="medium",
        file_paths=["app/auth/oauth.ts"],
        issue_id=234,
        description=(
            "[STUB cycle-1] Issue #234 closed 8 months ago but app/auth/oauth.ts "
            "edited 12x in the last 3 months. Real impl reads "
            ".codeplex/issues.json fixture when present."
        ),
        evidence={
            "issue_id": 234,
            "closed_at": "2025-09-12T00:00:00Z",
            "files": [
                {"path": "app/auth/oauth.ts", "latest_commit_at": "2026-04-28T00:00:00Z", "edits_after_close": 12}
            ],
        },
        repo_full_name=repo_full_name,
    )


def _safe(value: str) -> str:
    return value.replace("/", "-").replace(" ", "-")
