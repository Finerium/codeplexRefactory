"""Spec-drift Pattern C: spec-implementation lag (positive gap close_at to last_commit).

Cycle 4: real impl reading IssueStore fixture (or cycle 1 stub fallback when
fixture absent).

Algorithm per _meta/decisions/nemesis_drift_algo.md Pattern C:
1. Closed issues + commit timestamps per file.
2. Compute lag: latest_commit - closed_at. Configurable threshold
   `NEMESIS_DRIFT_C_LAG_MONTHS` (default 3 = 90 days).
3. Trigger when lag > threshold AND lag > 0 (positive lag, file edited
   AFTER issue closed, not before).
4. Severity: low (3-6mo), medium (6-12mo), high (>12mo).
"""
from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from pathlib import Path

from app.services.detectors.issue_store import (
    extract_file_paths,
    load_issue_store,
    parse_iso8601,
)
from app.services.detectors.types import (
    DriftEvent,
    PATTERN_LABELS,
    SpecDriftPattern,
)

log = logging.getLogger("nemesis.drift_c")

PATTERN: SpecDriftPattern = "C"
DEFAULT_LAG_DAYS = 90


def _threshold_days() -> int:
    raw = os.environ.get("NEMESIS_DRIFT_C_LAG_MONTHS")
    if raw:
        try:
            months = int(raw)
            return max(1, months) * 30
        except ValueError:
            pass
    return DEFAULT_LAG_DAYS


async def detect(repo_root: Path, repo_full_name: str) -> list[DriftEvent]:
    """Pattern C: spec-impl lag (commits land long after issue close).

    Manager FINAL Cycle 2 Bug #7 fix (Cluster F Nemesis 20260513-0857): NEVER
    return canned NodeGoat stub event when fixture absent. Empty list honest.
    """
    store = load_issue_store(repo_root)
    if store.source == "missing":
        return []

    threshold = _threshold_days()
    events: list[DriftEvent] = []
    for issue in store.issues:
        if issue.state != "closed":
            continue
        closed_dt = parse_iso8601(issue.closed_at)
        if closed_dt is None:
            continue
        candidate_paths = extract_file_paths(issue.body) + extract_file_paths(issue.title)
        candidate_paths = list(dict.fromkeys(candidate_paths))
        if not candidate_paths:
            continue

        file_lags: list[dict] = []
        max_lag_days = 0
        for file_path in candidate_paths:
            commits = store.commits_by_file.get(file_path, [])
            if not commits:
                continue
            latest = max(
                commits,
                key=lambda c: parse_iso8601(c.committed_at) or datetime.min.replace(tzinfo=timezone.utc),
            )
            latest_dt = parse_iso8601(latest.committed_at)
            if latest_dt is None:
                continue
            lag_days = int((latest_dt - closed_dt).total_seconds() // 86400)
            if lag_days <= threshold:
                continue
            file_lags.append(
                {
                    "path": file_path,
                    "latest_commit_at": latest.committed_at,
                    "lag_days": lag_days,
                }
            )
            max_lag_days = max(max_lag_days, lag_days)

        if not file_lags:
            continue

        if max_lag_days > 365:
            severity = "high"
        elif max_lag_days > 180:
            severity = "medium"
        else:
            severity = "low"

        events.append(
            DriftEvent(
                id=f"drift-C-{_safe(repo_full_name)}-issue{issue.id}",
                pattern=PATTERN,
                pattern_label=PATTERN_LABELS[PATTERN],
                severity=severity,
                file_paths=[ev["path"] for ev in file_lags],
                issue_id=issue.id,
                description=(
                    f"Issue #{issue.id} closed {issue.closed_at}, but mentioned "
                    f"file(s) last commit landed {max_lag_days} days after close "
                    f"(threshold {threshold} days). Implementation lagged spec "
                    f"significantly."
                ),
                evidence={
                    "issue_id": issue.id,
                    "issue_title": issue.title,
                    "closed_at": issue.closed_at,
                    "threshold_days": threshold,
                    "max_lag_days": max_lag_days,
                    "files": file_lags,
                },
                repo_full_name=repo_full_name,
            )
        )
    return events


def _stub_event(repo_full_name: str) -> DriftEvent:
    return DriftEvent(
        id=f"drift-C-stub-{_safe(repo_full_name)}-1",
        pattern=PATTERN,
        pattern_label=PATTERN_LABELS[PATTERN],
        severity="medium",
        file_paths=["app/billing/invoice.ts"],
        issue_id=312,
        description=(
            "[STUB cycle-1] Issue #312 closed 4 months ago, but "
            "app/billing/invoice.ts last commit landed 106 days after close."
        ),
        evidence={
            "issue_id": 312,
            "closed_at": "2026-01-12T00:00:00Z",
            "latest_commit_at": "2026-04-28T00:00:00Z",
            "lag_days": 106,
            "threshold_days": 90,
        },
        repo_full_name=repo_full_name,
    )


def _safe(value: str) -> str:
    return value.replace("/", "-").replace(" ", "-")
