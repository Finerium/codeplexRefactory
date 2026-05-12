"""Spec-drift Pattern E: OpenSpec drift (commit hook bypass).

PRD Section 11.3: "Commit yang touch file referenced di archived OpenSpec change
tapi commit message tidak include `opsx:` prefix."

Cycle 1 [STUB]: returns 1 canned Pattern E drift event.
Cycle 5: real impl via openspec/archive/ walk + 3-stage regex referenced file
extraction + git log + commit message opsx prefix check + AST-diff inferred
symbol-absence enrichment via Hades parser.

Per _meta/decisions/nemesis_drift_algo.md Pattern E (Lock 4 LOCKED PRD 11.3,
AST-diff inferred algo Phase B Topic 3c line 151).
"""
from __future__ import annotations

from pathlib import Path

from app.services.detectors.types import (
    DriftEvent,
    PATTERN_LABELS,
    SpecDriftPattern,
)

PATTERN: SpecDriftPattern = "E"


async def detect(repo_root: Path, repo_full_name: str) -> list[DriftEvent]:
    """[STUB cycle-1] returns canned Pattern E drift event for smoke harness."""
    return [
        DriftEvent(
            id=f"drift-E-stub-{_safe_repo_slug(repo_full_name)}-1",
            pattern=PATTERN,
            pattern_label=PATTERN_LABELS[PATTERN],
            severity="high",
            file_paths=["app/auth/oauth.ts"],
            description=(
                "[STUB cycle-1] Commit abc123def456 touches app/auth/oauth.ts "
                "referenced in archived spec openspec/archive/2026-01-15/"
                "add-oauth-flow/ without `opsx:` prefix. Workflow-guard bypass."
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
    ]


def _safe_repo_slug(repo_full_name: str) -> str:
    return repo_full_name.replace("/", "-").replace(" ", "-")
