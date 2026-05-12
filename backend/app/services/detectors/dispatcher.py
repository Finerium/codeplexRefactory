"""Nemesis detector dispatcher.

Single-entry `run_full_scan` orchestrator: parse repo via Hades, run 5 Apollo
detectors in parallel, enrich security-category findings via Argus + Triton,
run 5 spec-drift detectors in parallel, persist payloads via Demeter, publish
FindingEvent lifecycle (scan.started + finding.detected x N + scan.completed)
via EventBus topic `finding_events` for Asclepius Wave 2 consume.

Per _meta/contracts/nemesis-to-demeter.md + nemesis-to-asclepius.md.
"""
from __future__ import annotations

import asyncio
import hashlib
import logging
import time
from datetime import datetime, timezone
from pathlib import Path

from app.services.detectors import (
    argus_security,
    complex_untested,
    drift_a_stale_closed,
    drift_b_closed_without_merge,
    drift_c_spec_impl_lag,
    drift_d_reopened_cycle,
    drift_e_openspec_drift,
    missing_auth,
    outdated_deps,
    secrets,
    unsafe_sql,
)
from app.services.detectors.adapters import (
    get_demeter_adapter,
    get_parser_adapter,
    get_ws_adapter,
)
from app.services.detectors.types import (
    ApolloDetectorId,
    ApolloFinding,
    DriftEvent,
    DriftEventPersist,
    FindingEvent,
    FindingPersist,
    ScanResult,
    SpecDriftPattern,
)

log = logging.getLogger("nemesis.dispatcher")


APOLLO_DETECTORS = [
    secrets,
    outdated_deps,
    missing_auth,
    unsafe_sql,
    complex_untested,
]

DRIFT_DETECTORS = [
    drift_a_stale_closed,
    drift_b_closed_without_merge,
    drift_c_spec_impl_lag,
    drift_d_reopened_cycle,
    drift_e_openspec_drift,
]


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def generate_scan_run_id(repo_full_name: str) -> str:
    """Deterministic-but-unique scan run id (sha256 prefix of repo + ns clock)."""
    nonce = f"{repo_full_name}-{time.time_ns()}"
    return hashlib.sha256(nonce.encode()).hexdigest()[:16]


def _finding_to_persist(finding: ApolloFinding, scan_run_id: str) -> FindingPersist:
    return FindingPersist(
        finding_id=finding.id,
        building_id=finding.building_id or finding.file_path,
        file_path=finding.file_path,
        line_start=finding.line_start,
        line_end=finding.line_end,
        category=finding.category,
        severity=finding.severity,
        title=finding.title,
        description=finding.description,
        suggested_fix=finding.suggested_fix or "",
        cvss_vector=finding.cvss_vector,
        cvss_base_score=finding.cvss_base_score,
        exploit_pattern=finding.exploit_pattern,
        repo_full_name=finding.repo_full_name,
        scan_run_id=scan_run_id,
        detected_at=finding.detected_at,
    )


def _drift_to_persist(drift: DriftEvent, scan_run_id: str) -> DriftEventPersist:
    if drift.file_paths:
        affected = drift.file_paths[0]
    elif drift.issue_id is not None:
        affected = f"issue-{drift.issue_id}"
    elif drift.pr_number is not None:
        affected = f"pr-{drift.pr_number}"
    else:
        affected = "unknown"
    return DriftEventPersist(
        drift_id=drift.id,
        pattern=drift.pattern,
        pattern_label=drift.pattern_label,
        repo_full_name=drift.repo_full_name,
        affected_resource=affected,
        severity=drift.severity,
        evidence=drift.evidence,
        scan_run_id=scan_run_id,
        detected_at=drift.detected_at,
    )


def _finding_to_event_dict(finding: ApolloFinding) -> dict:
    return {
        "id": finding.id,
        "buildingId": finding.building_id or finding.file_path,
        "severity": finding.severity,
        "category": finding.category,
        "title": finding.title,
        "filePath": finding.file_path,
        "lineStart": finding.line_start,
        "lineEnd": finding.line_end,
    }


def _aggregate_severity_counts(findings: list[ApolloFinding]) -> dict[str, int]:
    counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
    for f in findings:
        counts[f.severity] = counts.get(f.severity, 0) + 1
    return counts


def _aggregate_category_counts(findings: list[ApolloFinding]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for f in findings:
        counts[f.category] = counts.get(f.category, 0) + 1
    return counts


async def run_full_scan(
    repo_root: Path | str,
    repo_full_name: str,
) -> ScanResult:
    """Orchestrate full scan pipeline. Single entry point used by API + tests.

    Pipeline:
    1. Publish `scan.started`.
    2. Parse repo via Hades adapter.
    3. Run 5 Apollo detectors in parallel (`asyncio.gather`).
    4. Argus enrich security-category findings via Triton adapter.
    5. Run 5 spec-drift detectors in parallel.
    6. Persist FindingPersist + DriftEventPersist via Demeter adapter.
    7. Publish `finding.detected` per Apollo finding.
    8. Publish `scan.completed` with summary.
    """
    start = time.monotonic()
    scan_run_id = generate_scan_run_id(repo_full_name)
    repo_root_path = Path(repo_root) if not isinstance(repo_root, Path) else repo_root

    parser = get_parser_adapter()
    demeter = get_demeter_adapter()
    ws = get_ws_adapter()

    await ws.publish(
        FindingEvent(
            type="scan.started",
            repo_full_name=repo_full_name,
            scan_run_id=scan_run_id,
            timestamp=_now_iso(),
        )
    )

    try:
        parsed_repo = await parser.parse_repo(repo_root_path)
    except Exception as exc:  # pragma: no cover - defensive
        log.warning("Parser failed; continuing with empty repo: %s", exc)
        from app.parsers.types import ParsedRepo

        parsed_repo = ParsedRepo(
            repo_root=str(repo_root_path),
            files=[],
            languages_used=[],
            stats={"total_files": 0, "total_loc": 0, "parse_errors": 1},
        )

    apollo_results = await asyncio.gather(
        *(d.detect(repo_root_path, parsed_repo, repo_full_name) for d in APOLLO_DETECTORS),
        return_exceptions=False,
    )
    apollo_findings: list[ApolloFinding] = []
    apollo_by_detector: dict[ApolloDetectorId, int] = {}
    for detector_module, findings in zip(APOLLO_DETECTORS, apollo_results):
        apollo_findings.extend(findings)
        apollo_by_detector[detector_module.DETECTOR_ID] = len(findings)

    apollo_findings = await argus_security.enrich_findings(apollo_findings)

    drift_results = await asyncio.gather(
        *(d.detect(repo_root_path, repo_full_name) for d in DRIFT_DETECTORS),
        return_exceptions=False,
    )
    drift_events: list[DriftEvent] = []
    drift_by_pattern: dict[SpecDriftPattern, int] = {}
    for detector_module, events in zip(DRIFT_DETECTORS, drift_results):
        drift_events.extend(events)
        drift_by_pattern[detector_module.PATTERN] = len(events)

    for finding in apollo_findings:
        await demeter.persist_finding(_finding_to_persist(finding, scan_run_id))
        await ws.publish(
            FindingEvent(
                type="finding.detected",
                repo_full_name=repo_full_name,
                scan_run_id=scan_run_id,
                finding=_finding_to_event_dict(finding),
                timestamp=_now_iso(),
            )
        )

    for drift in drift_events:
        await demeter.persist_drift_event(_drift_to_persist(drift, scan_run_id))

    duration_ms = int((time.monotonic() - start) * 1000)

    await ws.publish(
        FindingEvent(
            type="scan.completed",
            repo_full_name=repo_full_name,
            scan_run_id=scan_run_id,
            scan_summary={
                "totalFindings": len(apollo_findings),
                "bySeverity": _aggregate_severity_counts(apollo_findings),
                "byCategory": _aggregate_category_counts(apollo_findings),
                "driftCount": len(drift_events),
                "durationMs": duration_ms,
            },
            timestamp=_now_iso(),
        )
    )

    return ScanResult(
        scan_run_id=scan_run_id,
        repo_full_name=repo_full_name,
        apollo_findings=apollo_findings,
        drift_events=drift_events,
        apollo_count_by_detector=apollo_by_detector,
        drift_count_by_pattern=drift_by_pattern,
        duration_ms=duration_ms,
        cycle="stub-cycle-1",
    )
