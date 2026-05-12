"""Apollo detector 1: hardcoded secrets via gitleaks subprocess + entropy 3.5-4.5.

Cycle 1 [STUB]: returns 1 canned hardcoded secret finding for NodeGoat config.js
line 12 so dispatcher smoke can ship before gitleaks fixture wired.
Cycle 2: real gitleaks subprocess + custom .gitleaks.toml profile + entropy check.

Per PRD Section 9.5 + Phase B Topic 3c (gitleaks canonical pattern).
"""
from __future__ import annotations

from pathlib import Path

from app.parsers.types import ParsedRepo
from app.services.detectors.types import ApolloDetectorId, ApolloFinding, FindingCategory

DETECTOR_ID: ApolloDetectorId = "secrets"
CATEGORY: FindingCategory = "hardcoded-secret"


async def detect(
    repo_root: Path,
    parsed_repo: ParsedRepo,
    repo_full_name: str,
) -> list[ApolloFinding]:
    """[STUB cycle-1] returns canned hardcoded-secret finding for smoke harness."""
    return [
        ApolloFinding(
            id=f"secrets-stub-{_safe_repo_slug(repo_full_name)}-1",
            detector_id=DETECTOR_ID,
            category=CATEGORY,
            severity="critical",
            title="Hardcoded MongoDB connection string with embedded credentials",
            description=(
                "[STUB cycle-1] gitleaks pattern flagged a hardcoded database "
                "connection string with embedded admin credentials at "
                "app/config/config.js:12. Real impl ships cycle 2 via gitleaks "
                "subprocess + entropy 3.5-4.5 + custom .gitleaks.toml."
            ),
            file_path="app/config/config.js",
            line_start=12,
            line_end=12,
            code_snippet=(
                'const dbUrl = "mongodb://admin:p@ssw0rd@localhost:27017/nodegoat";'
            ),
            suggested_fix=(
                "Rotate the credential, move to environment variable, add gitleaks "
                "pre-commit hook to block future leaks."
            ),
            repo_full_name=repo_full_name,
            building_id="app/config/config.js",
        )
    ]


def _safe_repo_slug(repo_full_name: str) -> str:
    return repo_full_name.replace("/", "-").replace(" ", "-")
