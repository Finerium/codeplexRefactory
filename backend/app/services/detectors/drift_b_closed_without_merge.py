"""Spec-drift Pattern B: closed without merge.

PRD Section 11.3: "Issue closed tanpa ada PR yang merge dan touch file relevan."

Cycle 1 [STUB]: returns 1 canned Pattern B drift event.
Cycle 4: real impl via Demeter PR query + closes/fixes/resolves regex on PR body.

Per _meta/decisions/nemesis_drift_algo.md Pattern B.
"""
from __future__ import annotations

from pathlib import Path

from app.services.detectors.types import (
    DriftEvent,
    PATTERN_LABELS,
    SpecDriftPattern,
)

PATTERN: SpecDriftPattern = "B"


async def detect(repo_root: Path, repo_full_name: str) -> list[DriftEvent]:
    """[STUB cycle-1] returns canned Pattern B drift event for smoke harness."""
    return [
        DriftEvent(
            id=f"drift-B-stub-{_safe_repo_slug(repo_full_name)}-1",
            pattern=PATTERN,
            pattern_label=PATTERN_LABELS[PATTERN],
            severity="medium",
            file_paths=["app/notifications/email.ts"],
            issue_id=189,
            description=(
                "[STUB cycle-1] Issue #189 closed without a linked PR that "
                "merged and touched app/notifications/email.ts. Spec orphan: "
                "tracker says done but no implementation evidence."
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
    ]


def _safe_repo_slug(repo_full_name: str) -> str:
    return repo_full_name.replace("/", "-").replace(" ", "-")
