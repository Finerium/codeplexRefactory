"""Spec-drift Pattern A: stale closed issue.

PRD Section 11.3: "Issue closed greater-than 6 bulan lalu, tapi file yang mention
di issue terus di-edit setelah closed."

Cycle 1 [STUB]: returns 1 canned Pattern A drift event.
Cycle 4: real impl via Demeter issues query + git log subprocess.

Per _meta/decisions/nemesis_drift_algo.md Pattern A.
"""
from __future__ import annotations

from pathlib import Path

from app.services.detectors.types import (
    DriftEvent,
    PATTERN_LABELS,
    SpecDriftPattern,
)

PATTERN: SpecDriftPattern = "A"


async def detect(repo_root: Path, repo_full_name: str) -> list[DriftEvent]:
    """[STUB cycle-1] returns canned Pattern A drift event for smoke harness."""
    return [
        DriftEvent(
            id=f"drift-A-stub-{_safe_repo_slug(repo_full_name)}-1",
            pattern=PATTERN,
            pattern_label=PATTERN_LABELS[PATTERN],
            severity="medium",
            file_paths=["app/auth/oauth.ts"],
            issue_id=234,
            description=(
                "[STUB cycle-1] Issue #234 closed 8 months ago but "
                "app/auth/oauth.ts edited 12x in the last 3 months. "
                "Implementation likely drifted from original spec."
            ),
            evidence={
                "issue_id": 234,
                "closed_at": "2025-09-12T00:00:00Z",
                "files": [
                    {
                        "path": "app/auth/oauth.ts",
                        "latest_commit_at": "2026-04-28T00:00:00Z",
                        "edits_after_close": 12,
                    }
                ],
            },
            repo_full_name=repo_full_name,
        )
    ]


def _safe_repo_slug(repo_full_name: str) -> str:
    return repo_full_name.replace("/", "-").replace(" ", "-")
