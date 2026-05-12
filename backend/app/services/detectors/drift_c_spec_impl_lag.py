"""Spec-drift Pattern C: spec-implementation lag.

PRD Section 11.3: "Issue closed dan file di-touch, tapi gap antara closed
timestamp dan file last commit greater-than X bulan (configurable)."

Cycle 1 [STUB]: returns 1 canned Pattern C drift event.
Cycle 4: real impl via Demeter issues + git log lag computation. Threshold env
override `NEMESIS_DRIFT_C_LAG_MONTHS` default 3.

Per _meta/decisions/nemesis_drift_algo.md Pattern C.
"""
from __future__ import annotations

from pathlib import Path

from app.services.detectors.types import (
    DriftEvent,
    PATTERN_LABELS,
    SpecDriftPattern,
)

PATTERN: SpecDriftPattern = "C"


async def detect(repo_root: Path, repo_full_name: str) -> list[DriftEvent]:
    """[STUB cycle-1] returns canned Pattern C drift event for smoke harness."""
    return [
        DriftEvent(
            id=f"drift-C-stub-{_safe_repo_slug(repo_full_name)}-1",
            pattern=PATTERN,
            pattern_label=PATTERN_LABELS[PATTERN],
            severity="medium",
            file_paths=["app/billing/invoice.ts"],
            issue_id=312,
            description=(
                "[STUB cycle-1] Issue #312 closed 4 months ago, but "
                "app/billing/invoice.ts last commit landed 106 days after close. "
                "Implementation lagged the spec significantly."
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
    ]


def _safe_repo_slug(repo_full_name: str) -> str:
    return repo_full_name.replace("/", "-").replace(" ", "-")
