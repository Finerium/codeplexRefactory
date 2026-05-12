"""Apollo detector 4: unsafe SQL patterns via regex + tree-sitter SQL context.

Cycle 1 [STUB]: returns 1 canned SQL injection finding for NodeGoat allocations-dao.
Cycle 3: real regex pre-filter + tree-sitter query confirm raw string concat in
SQL context for JavaScript / Python / Go / Java / Ruby / PHP.
"""
from __future__ import annotations

from pathlib import Path

from app.parsers.types import ParsedRepo
from app.services.detectors.types import ApolloDetectorId, ApolloFinding, FindingCategory

DETECTOR_ID: ApolloDetectorId = "unsafe_sql"
CATEGORY: FindingCategory = "unsafe-sql"


async def detect(
    repo_root: Path,
    parsed_repo: ParsedRepo,
    repo_full_name: str,
) -> list[ApolloFinding]:
    """[STUB cycle-1] returns canned unsafe-sql finding for smoke harness."""
    return [
        ApolloFinding(
            id=f"unsafe_sql-stub-{_safe_repo_slug(repo_full_name)}-1",
            detector_id=DETECTOR_ID,
            category=CATEGORY,
            severity="critical",
            title="String concatenation in SQL query (SQL injection risk)",
            description=(
                "[STUB cycle-1] Raw string concatenation detected in db.query() "
                "call at app/data/allocations-dao.js:42. Real impl ships cycle 3 "
                "via tree-sitter SQL context query."
            ),
            file_path="app/data/allocations-dao.js",
            line_start=42,
            line_end=42,
            code_snippet=(
                'db.query("SELECT * FROM allocations WHERE userId = " + userId);'
            ),
            suggested_fix=(
                "Use parameterized query: db.query('SELECT * FROM allocations "
                "WHERE userId = ?', [userId])."
            ),
            repo_full_name=repo_full_name,
            building_id="app/data/allocations-dao.js",
        )
    ]


def _safe_repo_slug(repo_full_name: str) -> str:
    return repo_full_name.replace("/", "-").replace(" ", "-")
