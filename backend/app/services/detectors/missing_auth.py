"""Apollo detector 3: missing auth on protected routes via tree-sitter per-framework.

Cycle 1 [STUB]: returns 1 canned missing-auth finding for NodeGoat /admin route.
Cycle 2: real tree-sitter query Express + FastAPI + Flask + Django.
Cycle 3: real tree-sitter query Gin + Echo + Spring + Actix.

Per Phase B Topic 3c blind spot: per-framework auth-route parsing requires per-
framework query trees, no consolidated public library exists. Authored ground-up.
"""
from __future__ import annotations

from pathlib import Path

from app.parsers.types import ParsedRepo
from app.services.detectors.types import ApolloDetectorId, ApolloFinding, FindingCategory

DETECTOR_ID: ApolloDetectorId = "missing_auth"
CATEGORY: FindingCategory = "missing-auth"


async def detect(
    repo_root: Path,
    parsed_repo: ParsedRepo,
    repo_full_name: str,
) -> list[ApolloFinding]:
    """[STUB cycle-1] returns canned missing-auth finding for smoke harness."""
    return [
        ApolloFinding(
            id=f"missing_auth-stub-{_safe_repo_slug(repo_full_name)}-1",
            detector_id=DETECTOR_ID,
            category=CATEGORY,
            severity="critical",
            title="Missing authentication on /admin route",
            description=(
                "[STUB cycle-1] Express route /admin defined at "
                "app/routes/index.js:87 lacks passport.authenticate middleware. "
                "Real impl ships cycle 2 via tree-sitter Express query."
            ),
            file_path="app/routes/index.js",
            line_start=87,
            line_end=110,
            code_snippet=(
                "app.get('/admin', (req, res) => { /* no auth middleware */ });"
            ),
            suggested_fix=(
                "Add passport.authenticate('jwt', { session: false }) middleware "
                "before the handler."
            ),
            repo_full_name=repo_full_name,
            building_id="app/routes/index.js",
        )
    ]


def _safe_repo_slug(repo_full_name: str) -> str:
    return repo_full_name.replace("/", "-").replace(" ", "-")
