"""Apollo detector 2: outdated dependencies via OSV API public CVE lookup.

Cycle 2: real OSV API query (`https://api.osv.dev/v1/query`, free no-auth per
Lock 8) across 7 manifest formats: package.json npm, requirements.txt PyPI,
go.mod Go, Cargo.toml crates.io, pom.xml Maven, Gemfile RubyGems, composer.json
Packagist.

Behavior:
- If real manifests exist under repo_root, parse + query OSV concurrently
  (semaphore 10) + emit ApolloFinding per vulnerable package.
- If no manifest detected (smoke test stub path), fall back to canned finding
  matching cycle 1 contract so dispatcher smoke + downstream tests keep passing.
- OSV rate limit hit + exhaust retry: emit info severity finding labeled
  `osv_rate_limit_skipped` per Lock 5 honest claim.
- Always offline-safe: network failure returns canned finding rather than crash.

Per _meta/decisions/nemesis_drift_algo.md OSV API consumption + PRD Section 9.5.
"""
from __future__ import annotations

import logging
from pathlib import Path

from app.parsers.types import ParsedRepo
from app.services.detectors.manifest_parser import ManifestDep, parse_all_manifests
from app.services.detectors.osv_client import (
    OSVClient,
    OSVPackageQuery,
    OSVVulnerability,
    severity_for_label,
)
from app.services.detectors.types import ApolloDetectorId, ApolloFinding, FindingCategory

log = logging.getLogger("nemesis.outdated_deps")

DETECTOR_ID: ApolloDetectorId = "outdated_deps"
CATEGORY: FindingCategory = "outdated-dependency"


_STUB_FINDING = ApolloFinding(
    id="outdated_deps-stub-fallback-1",
    detector_id=DETECTOR_ID,
    category=CATEGORY,
    severity="high",
    title="Outdated jquery 1.4.0 with known XSS CVE",
    description=(
        "[STUB cycle-1] OSV API check would flag jquery@1.4.0 with XSS "
        "advisory GHSA-2pqj-h3vj-pqgw, but no real manifest found at scan "
        "path. Falls back to canned finding for dispatcher smoke."
    ),
    file_path="package.json",
    line_start=18,
    line_end=18,
    code_snippet='"jquery": "1.4.0"',
    suggested_fix="Upgrade to jquery@3.7.1 or later per OSV advisory.",
    cve_reference="GHSA-2pqj-h3vj-pqgw",
    building_id="package.json",
)


async def detect(
    repo_root: Path,
    parsed_repo: ParsedRepo,
    repo_full_name: str,
) -> list[ApolloFinding]:
    """Walk repo for manifests, query OSV per package, emit findings.

    Manager FINAL Cycle 2 Bug #7 fix (Cluster F Nemesis 20260513-0857): NEVER
    return canned NodeGoat stub finding when no manifest detected. Empty list
    is the honest answer when the user repo has no recognized dependency
    manifest. Frontend renders empty state with explicit reason. Real-browser
    evidence Lock 5 amplified.
    """
    if not isinstance(repo_root, Path) or not repo_root.exists() or not repo_root.is_dir():
        log.warning(
            "outdated_deps: repo_root invalid %s (repo=%s); returning empty",
            repo_root,
            repo_full_name,
        )
        return []

    deps = parse_all_manifests(repo_root)
    if not deps:
        log.info(
            "outdated_deps: no recognized manifest under %s (repo=%s); returning empty",
            repo_root,
            repo_full_name,
        )
        return []

    findings = await _query_and_map(deps, repo_full_name)
    if not findings:
        return []
    return findings


async def _query_and_map(
    deps: list[ManifestDep],
    repo_full_name: str,
) -> list[ApolloFinding]:
    queries = [OSVPackageQuery(name=d.name, version=d.version, ecosystem=d.ecosystem) for d in deps]
    client = OSVClient()
    try:
        results = await client.query_many(queries)
    finally:
        await client.aclose()

    findings: list[ApolloFinding] = []
    for dep in deps:
        key = f"{dep.ecosystem}:{dep.name}@{dep.version}"
        vulns = results.get(key, [])
        for vuln in vulns:
            findings.append(_vuln_to_finding(dep, vuln, repo_full_name))

    if client.rate_limited:
        findings.append(_rate_limited_finding(repo_full_name))

    return findings


def _vuln_to_finding(
    dep: ManifestDep,
    vuln: OSVVulnerability,
    repo_full_name: str,
) -> ApolloFinding:
    finding_id = f"outdated_deps-{vuln.id}-{dep.ecosystem.lower()}-{_safe_token(dep.name)}-{_safe_token(dep.version)}"
    severity = severity_for_label(vuln.severity_label)
    title = f"{dep.ecosystem} {dep.name}@{dep.version} has {vuln.id} ({vuln.severity_label})"
    description = vuln.summary or f"OSV advisory {vuln.id} affects {dep.name}@{dep.version}."
    suggested = (
        f"Upgrade to {vuln.fixed_in} or later per OSV advisory {vuln.id}."
        if vuln.fixed_in
        else f"Review OSV advisory {vuln.id} and upgrade {dep.name} to a patched version."
    )
    reference = vuln.references[0] if vuln.references else f"https://osv.dev/vulnerability/{vuln.id}"
    return ApolloFinding(
        id=finding_id,
        detector_id=DETECTOR_ID,
        category=CATEGORY,
        severity=severity,
        title=title,
        description=description,
        file_path=_relative_path(dep.file_path),
        line_start=dep.line_start,
        line_end=dep.line_start,
        code_snippet=f"{dep.name}@{dep.version}",
        suggested_fix=suggested,
        cve_reference=reference,
        repo_full_name=repo_full_name,
        building_id=_relative_path(dep.file_path),
    )


def _rate_limited_finding(repo_full_name: str) -> ApolloFinding:
    return ApolloFinding(
        id=f"outdated_deps-osv_rate_limit_skipped-{_safe_token(repo_full_name)}",
        detector_id=DETECTOR_ID,
        category=CATEGORY,
        severity="info",
        title="OSV rate limit hit; some packages skipped (osv_rate_limit_skipped)",
        description=(
            "OSV API returned 429 after retry exhaustion. Outdated dependency "
            "scan is partial. Re-run later to fill gap."
        ),
        file_path="package.json",
        line_start=1,
        line_end=1,
        suggested_fix="Wait 60 seconds and re-run scan, or query OSV manually.",
        repo_full_name=repo_full_name,
        building_id="package.json",
    )


def _stub_finding_for_repo(repo_full_name: str) -> ApolloFinding:
    return ApolloFinding(
        id=f"outdated_deps-stub-{_safe_token(repo_full_name)}-1",
        detector_id=DETECTOR_ID,
        category=CATEGORY,
        severity="high",
        title="Outdated jquery 1.4.0 with known XSS CVE",
        description=(
            "[STUB cycle-1] OSV API check flagged jquery@1.4.0 with XSS "
            "advisory GHSA-2pqj-h3vj-pqgw. Real impl ships cycle 2 via OSV "
            "/v1/query when manifest files present."
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


def _safe_token(value: str) -> str:
    return value.replace("/", "-").replace(" ", "-").replace("@", "-at-").replace(":", "-")


def _relative_path(file_path: str) -> str:
    # Prefer last 3 path components to keep building_id concise + relative-feeling.
    parts = file_path.replace("\\", "/").split("/")
    return "/".join(parts[-3:]) if len(parts) > 3 else file_path.replace("\\", "/")
