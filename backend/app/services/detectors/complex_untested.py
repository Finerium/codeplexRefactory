"""Apollo detector 5: complex untested files via radon cyclomatic + test coverage stub.

Cycle 1 [STUB]: returns 1 canned complex-untested finding for NodeGoat profile.js.
Cycle 3: real radon cyclomatic complexity scan + co-located test file presence
check (test_<name>.py / <name>.test.ts / __tests__/<name> glob).
"""
from __future__ import annotations

from pathlib import Path

from app.parsers.types import ParsedRepo
from app.services.detectors.types import ApolloDetectorId, ApolloFinding, FindingCategory

DETECTOR_ID: ApolloDetectorId = "complex_untested"
CATEGORY: FindingCategory = "complex-untested"


async def detect(
    repo_root: Path,
    parsed_repo: ParsedRepo,
    repo_full_name: str,
) -> list[ApolloFinding]:
    """[STUB cycle-1] returns canned complex-untested finding for smoke harness."""
    return [
        ApolloFinding(
            id=f"complex_untested-stub-{_safe_repo_slug(repo_full_name)}-1",
            detector_id=DETECTOR_ID,
            category=CATEGORY,
            severity="medium",
            title="High cyclomatic complexity without test coverage (estimate 52)",
            description=(
                "[STUB cycle-1] profile.js estimated cyclomatic complexity 52, "
                "no co-located test file detected. Real impl ships cycle 3 via "
                "radon + test coverage stub."
            ),
            file_path="app/controllers/profile.js",
            line_start=1,
            line_end=320,
            suggested_fix=(
                "Refactor into smaller, single-responsibility functions. Add "
                "unit tests covering decision branches."
            ),
            repo_full_name=repo_full_name,
            building_id="app/controllers/profile.js",
        )
    ]


def _safe_repo_slug(repo_full_name: str) -> str:
    return repo_full_name.replace("/", "-").replace(" ", "-")
