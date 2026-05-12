"""Apollo detector 2: outdated dependencies via OSV API public CVE lookup.

Cycle 1 [STUB]: returns 1 canned outdated dependency finding so dispatcher smoke
can ship.
Cycle 2: real OSV API query (`https://api.osv.dev/v1/query`, free no-auth per
Lock 8) across 7 manifest formats (package.json npm, requirements.txt PyPI,
go.mod Go, Cargo.toml crates.io, pom.xml Maven, Gemfile rubygems, composer.json
packagist).
"""
from __future__ import annotations

from pathlib import Path

from app.parsers.types import ParsedRepo
from app.services.detectors.types import ApolloDetectorId, ApolloFinding, FindingCategory

DETECTOR_ID: ApolloDetectorId = "outdated_deps"
CATEGORY: FindingCategory = "outdated-dependency"


async def detect(
    repo_root: Path,
    parsed_repo: ParsedRepo,
    repo_full_name: str,
) -> list[ApolloFinding]:
    """[STUB cycle-1] returns canned outdated-dependency finding for smoke harness."""
    return [
        ApolloFinding(
            id=f"outdated_deps-stub-{_safe_repo_slug(repo_full_name)}-1",
            detector_id=DETECTOR_ID,
            category=CATEGORY,
            severity="high",
            title="Outdated jquery 1.4.0 with known XSS CVE",
            description=(
                "[STUB cycle-1] OSV API check flagged jquery@1.4.0 with XSS "
                "vulnerability advisory GHSA-2pqj-h3vj-pqgw. Real impl ships "
                "cycle 2 via OSV /v1/query."
            ),
            file_path="package.json",
            line_start=18,
            line_end=18,
            code_snippet='"jquery": "1.4.0"',
            suggested_fix="Upgrade to jquery@3.7.1 or later per OSV advisory.",
            cve_reference="GHSA-2pqj-h3vj-pqgw",
            repo_full_name=repo_full_name,
            building_id="package.json",
        )
    ]


def _safe_repo_slug(repo_full_name: str) -> str:
    return repo_full_name.replace("/", "-").replace(" ", "-")
