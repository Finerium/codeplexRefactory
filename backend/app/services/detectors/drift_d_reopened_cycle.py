"""Spec-drift Pattern D: reopened cycle.

PRD Section 11.3: "Issue di-reopen greater-than-or-equal-to 2x atau ada multiple
closing PR yang reverted."

Cycle 1 [STUB]: returns 1 canned Pattern D drift event.
Cycle 5: real impl via Demeter issue_events table reopen count + revert detection.

Per _meta/decisions/nemesis_drift_algo.md Pattern D.
"""
from __future__ import annotations

from pathlib import Path

from app.services.detectors.types import (
    DriftEvent,
    PATTERN_LABELS,
    SpecDriftPattern,
)

PATTERN: SpecDriftPattern = "D"


async def detect(repo_root: Path, repo_full_name: str) -> list[DriftEvent]:
    """[STUB cycle-1] returns canned Pattern D drift event for smoke harness."""
    return [
        DriftEvent(
            id=f"drift-D-stub-{_safe_repo_slug(repo_full_name)}-1",
            pattern=PATTERN,
            pattern_label=PATTERN_LABELS[PATTERN],
            severity="high",
            file_paths=["app/api/upload.ts"],
            issue_id=405,
            description=(
                "[STUB cycle-1] Issue #405 reopened 3 times. Spec keeps "
                "changing; building unstable. Real impl cycle 5 via issue_events "
                "reopen counter."
            ),
            evidence={
                "issue_id": 405,
                "reopened_count": 3,
                "reopened_at": [
                    "2025-11-01T00:00:00Z",
                    "2026-01-15T00:00:00Z",
                    "2026-03-10T00:00:00Z",
                ],
                "revert_detected": False,
            },
            repo_full_name=repo_full_name,
        )
    ]


def _safe_repo_slug(repo_full_name: str) -> str:
    return repo_full_name.replace("/", "-").replace(" ", "-")
