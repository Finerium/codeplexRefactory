"""Spec-drift Pattern B: issue closed without linked merged PR touching file.

Cycle 4: real impl reading from IssueStore fixture (or cycle 1 stub fallback
when fixture absent).

Algorithm per _meta/decisions/nemesis_drift_algo.md Pattern B:
1. Filter closed issues.
2. For each, check linked_prs: if no linked PR with merged_at set, OR no
   merged PR touches files mentioned in issue body, trigger.
3. False-positive mitigation: skip if issue title/body contains "duplicate"
   keyword (closed-as-duplicate, not orphan spec).
4. Severity: medium baseline, high if mentioned files still exist on disk
   without edits (spec orphan).
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

log = logging.getLogger("nemesis.drift_b")

PATTERN: SpecDriftPattern = "B"


_DUPLICATE_KEYWORDS = ("duplicate", "dup ", " dup", "duplicates ")


def _looks_like_duplicate(issue) -> bool:
    text = f"{issue.title} {issue.body}".lower()
    return any(kw in text for kw in _DUPLICATE_KEYWORDS)


async def detect(repo_root: Path, repo_full_name: str) -> list[DriftEvent]:
    store = load_issue_store(repo_root)
    if store.source == "missing":
        return [_stub_event(repo_full_name)]

    events: list[DriftEvent] = []
    for issue in store.issues:
        if issue.state != "closed":
            continue
        if _looks_like_duplicate(issue):
            continue

        candidate_paths = extract_file_paths(issue.body) + extract_file_paths(issue.title)
        candidate_paths = list(dict.fromkeys(candidate_paths))
        # If issue body has no file mentions, skip (Pattern A/C scope).
        if not candidate_paths:
            continue

        merged_prs = [pr for pr in issue.linked_prs if pr.merged_at]
        if not merged_prs:
            severity = "medium"
            reason = "no_linked_pr_with_merge"
        else:
            touched = set()
            for pr in merged_prs:
                touched.update(pr.files)
            mentioned_files_touched = any(p in touched for p in candidate_paths)
            if mentioned_files_touched:
                continue
            severity = "medium"
            reason = "linked_pr_merged_but_no_file_touch"

        events.append(
            DriftEvent(
                id=f"drift-B-{_safe(repo_full_name)}-issue{issue.id}",
                pattern=PATTERN,
                pattern_label=PATTERN_LABELS[PATTERN],
                severity=severity,
                file_paths=candidate_paths,
                issue_id=issue.id,
                description=(
                    f"Issue #{issue.id} closed without a merged PR touching the "
                    f"file(s) mentioned in the issue. Spec orphan: tracker says done "
                    f"but no implementation evidence."
                ),
                evidence={
                    "issue_id": issue.id,
                    "issue_title": issue.title,
                    "closed_at": issue.closed_at,
                    "expected_files": candidate_paths,
                    "matched_prs": [
                        {"number": pr.number, "merged_at": pr.merged_at, "files": list(pr.files)}
                        for pr in merged_prs
                    ],
                    "reason": reason,
                },
                repo_full_name=repo_full_name,
            )
        )
    return events


def _stub_event(repo_full_name: str) -> DriftEvent:
    return DriftEvent(
        id=f"drift-B-stub-{_safe(repo_full_name)}-1",
        pattern=PATTERN,
        pattern_label=PATTERN_LABELS[PATTERN],
        severity="medium",
        file_paths=["app/notifications/email.ts"],
        issue_id=189,
        description=(
            "[STUB cycle-1] Issue #189 closed without a linked PR that merged + "
            "touched app/notifications/email.ts. Spec orphan: tracker says done "
            "but no implementation evidence."
        ),
        evidence={
            "issue_id": 189,
            "closed_at": "2025-12-01T00:00:00Z",
            "expected_files": ["app/notifications/email.ts"],
            "matched_prs": [],
            "reason": "no_linked_pr_with_merge_and_file_touch",
        },
        repo_full_name=repo_full_name,
    )


def _safe(value: str) -> str:
    return value.replace("/", "-").replace(" ", "-")
