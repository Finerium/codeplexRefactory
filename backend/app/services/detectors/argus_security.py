"""Argus security CVSS scoring + exploit pattern + mitigation enrichment.

Cycle 1 [STUB]: enriches security-category Apollo findings via canned Triton
adapter responses keyed on FindingCategory.
Cycle 3: real Triton LLM call V4-Flash thinking low + Argus persona prompt +
JSON parse with regex fallback.

Per _meta/contracts/triton-to-nemesis.md + PRD Section 10.3 Argus.
"""
from __future__ import annotations

from app.services.detectors.adapters import get_triton_adapter
from app.services.detectors.types import ApolloFinding, SECURITY_CATEGORIES


async def enrich_findings(findings: list[ApolloFinding]) -> list[ApolloFinding]:
    """Enrich security-category findings with CVSS scoring via Triton.

    Mutates each ApolloFinding in place for security categories (hardcoded-secret,
    missing-auth, unsafe-sql), leaves non-security categories untouched.
    Returns the same list to chain dispatcher consumption.
    """
    triton = get_triton_adapter()
    for finding in findings:
        if finding.category not in SECURITY_CATEGORIES:
            continue
        cvss = await triton.argus_cvss_score(
            category=finding.category,
            title=finding.title,
            description=finding.description,
        )
        finding.cvss_vector = cvss.vector
        finding.cvss_base_score = cvss.base_score
        finding.exploit_pattern = cvss.exploit_pattern
        if cvss.references and not finding.cve_reference:
            finding.cve_reference = cvss.references[0]
        if cvss.mitigation:
            existing = finding.suggested_fix or ""
            finding.suggested_fix = (
                f"{existing}\n\n[Argus mitigation] {cvss.mitigation}".strip()
            )
    return findings
