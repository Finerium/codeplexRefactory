"""Spec-drift Pattern D: issue reopened greater-than-or-equal-to 2 times.

Cycle 5: real impl reading IssueStore fixture (or cycle 1 stub fallback when
fixture absent).

Algorithm per _meta/decisions/nemesis_drift_algo.md Pattern D:
1. Issues with reopened_count >= 2.
2. False-positive mitigation: skip if issue body/title contains "flaky",
   "test", "infra", "ci" keywords (legitimate flake reopens).
3. Severity: medium (2 reopens), high (3+), critical (4+).
"""
from __future__ import annotations

import logging
from pathlib import Path

from app.services.detectors.issue_store import (
    extract_file_paths,
    load_issue_store,
)
from app.services.detectors.types import (
    DriftEvent,
    PATTERN_LABELS,
    SpecDriftPattern,
)

log = logging.getLogger("nemesis.drift_d")

PATTERN: SpecDriftPattern = "D"


_FLAKE_KEYWORDS = (
    "flaky", "flake ", " flake", "intermittent", "ci infra", "infra ", "test infra",
)


def _looks_like_flake(issue) -> bool:
    text = f"{issue.title} {issue.body}".lower()
    return any(kw in text for kw in _FLAKE_KEYWORDS)


async def detect(repo_root: Path, repo_full_name: str) -> list[DriftEvent]:
    """Pattern D: issue reopened repeatedly (spec churn signal).

    Manager FINAL Cycle 2 Bug #7 fix (Cluster F Nemesis 20260513-0857): NEVER
    return canned NodeGoat stub event when fixture absent. Empty list honest.
    """
    store = load_issue_store(repo_root)
    if store.source == "missing":
        return []

    events: list[DriftEvent] = []
    for issue in store.issues:
        if issue.reopened_count < 2:
            continue
        if _looks_like_flake(issue):
            continue

        if issue.reopened_count >= 4:
            severity = "critical"
        elif issue.reopened_count >= 3:
            severity = "high"
        else:
            severity = "medium"

        file_paths = extract_file_paths(issue.body) + extract_file_paths(issue.title)
        file_paths = list(dict.fromkeys(file_paths))

        events.append(
            DriftEvent(
                id=f"drift-D-{_safe(repo_full_name)}-issue{issue.id}",
                pattern=PATTERN,
                pattern_label=PATTERN_LABELS[PATTERN],
                severity=severity,
                file_paths=file_paths,
                issue_id=issue.id,
                description=(
                    f"Issue #{issue.id} reopened {issue.reopened_count} times. "
                    f"Spec keeps changing; building unstable."
                ),
                evidence={
                    "issue_id": issue.id,
                    "issue_title": issue.title,
                    "reopened_count": issue.reopened_count,
                    "reopened_at": list(issue.reopened_at),
                    "revert_detected": False,
                },
                repo_full_name=repo_full_name,
            )
        )
    return events


def _stub_event(repo_full_name: str) -> DriftEvent:
    return DriftEvent(
        id=f"drift-D-stub-{_safe(repo_full_name)}-1",
        pattern=PATTERN,
        pattern_label=PATTERN_LABELS[PATTERN],
        severity="high",
        file_paths=["app/api/upload.ts"],
        issue_id=405,
        description=(
            "[STUB cycle-1] Issue #405 reopened 3 times. Spec keeps changing."
        ),
        evidence={
            "issue_id": 405,
            "reopened_count": 3,
            "reopened_at": ["2025-11-01T00:00:00Z", "2026-01-15T00:00:00Z", "2026-03-10T00:00:00Z"],
            "revert_detected": False,
        },
        repo_full_name=repo_full_name,
    )


def _safe(value: str) -> str:
    return value.replace("/", "-").replace(" ", "-")
