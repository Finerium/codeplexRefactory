"""Nemesis cycle 1 stub smoke test.

Verifies:
- Dispatcher runs end-to-end on stub adapters (parser stub, Triton stub, Demeter
  adapter buffering, WS adapter buffering).
- 5/5 Apollo detector stubs trigger (1 finding each).
- 5/5 spec-drift pattern A-E stubs trigger (1 event each).
- Argus enriches 3 security-category findings with CVSS 3.1 vector + score.
- WebSocket lifecycle publishes scan.started + 5 finding.detected + scan.completed.
- Demeter adapter persist buffer captures 5 FindingPersist + 5 DriftEventPersist
  with matching scan_run_id.
- Severity enum compliance (5-enum Asclepius lock).
- Category enum compliance (5-enum kebab-case lock).

Cycle 2-5 will replace stub-mode assertions with real NodeGoat fork +
demo-drift fixture.

Per _meta/contracts/nemesis-to-demeter.md + nemesis-to-asclepius.md +
_meta/plans/nemesis-wave3-cycle-plan.md Task 1.5.
"""
from __future__ import annotations

from pathlib import Path

import pytest

from app.services.detectors.adapters import (
    get_demeter_adapter,
    get_parser_adapter,
    get_triton_adapter,
    get_ws_adapter,
    reset_demeter_adapter,
    reset_parser_adapter,
    reset_triton_adapter,
    reset_ws_adapter,
)
from app.services.detectors.dispatcher import run_full_scan

pytestmark = pytest.mark.asyncio


REPO_FULL = "duopoly/codeplex-demo-nodegoat"
REPO_ROOT = Path("/tmp/stub-nodegoat")


@pytest.fixture(autouse=True)
def _reset_adapters() -> None:
    """Reset all 4 adapter singletons before each test so buffers are clean."""
    reset_parser_adapter()
    reset_triton_adapter()
    reset_demeter_adapter()
    reset_ws_adapter()


async def test_dispatcher_runs_end_to_end() -> None:
    result = await run_full_scan(REPO_ROOT, REPO_FULL)
    assert result.scan_run_id
    assert len(result.scan_run_id) == 16
    assert result.repo_full_name == REPO_FULL
    assert result.cycle == "stub-cycle-1"
    assert result.duration_ms >= 0


async def test_5_apollo_detectors_each_trigger_once() -> None:
    result = await run_full_scan(REPO_ROOT, REPO_FULL)
    assert result.apollo_count_by_detector == {
        "secrets": 1,
        "outdated_deps": 1,
        "missing_auth": 1,
        "unsafe_sql": 1,
        "complex_untested": 1,
    }
    assert len(result.apollo_findings) == 5
    detector_ids = {f.detector_id for f in result.apollo_findings}
    assert detector_ids == {
        "secrets",
        "outdated_deps",
        "missing_auth",
        "unsafe_sql",
        "complex_untested",
    }


async def test_5_drift_patterns_each_trigger_once() -> None:
    result = await run_full_scan(REPO_ROOT, REPO_FULL)
    assert result.drift_count_by_pattern == {"A": 1, "B": 1, "C": 1, "D": 1, "E": 1}
    assert len(result.drift_events) == 5
    patterns = {d.pattern for d in result.drift_events}
    assert patterns == {"A", "B", "C", "D", "E"}


async def test_argus_enriches_security_findings_with_cvss() -> None:
    result = await run_full_scan(REPO_ROOT, REPO_FULL)
    security = [
        f
        for f in result.apollo_findings
        if f.category in ("hardcoded-secret", "missing-auth", "unsafe-sql")
    ]
    assert len(security) == 3
    for f in security:
        assert f.cvss_vector is not None
        assert f.cvss_vector.startswith("CVSS:3.1/")
        assert f.cvss_base_score is not None
        assert 0.0 <= f.cvss_base_score <= 10.0
        assert f.exploit_pattern is not None
        assert "CWE-" in f.exploit_pattern
        assert f.suggested_fix is not None
        assert "[Argus mitigation]" in f.suggested_fix


async def test_non_security_findings_not_enriched_with_cvss() -> None:
    """Lock 4 compliance: only security categories get CVSS, outdated_deps + complex_untested left alone in Apollo lane (Argus handles security only)."""
    result = await run_full_scan(REPO_ROOT, REPO_FULL)
    non_security = [
        f
        for f in result.apollo_findings
        if f.category in ("outdated-dependency", "complex-untested")
    ]
    assert len(non_security) == 2
    for f in non_security:
        assert f.cvss_vector is None
        assert f.cvss_base_score is None
        assert f.exploit_pattern is None


async def test_websocket_publishes_scan_lifecycle() -> None:
    result = await run_full_scan(REPO_ROOT, REPO_FULL)
    ws = get_ws_adapter()
    events = ws.published
    types = [e.type for e in events]
    assert types[0] == "scan.started"
    assert types[-1] == "scan.completed"

    finding_events = [e for e in events if e.type == "finding.detected"]
    assert len(finding_events) == 5
    for e in finding_events:
        assert e.scan_run_id == result.scan_run_id
        assert e.repo_full_name == REPO_FULL
        assert e.finding is not None
        assert e.finding["severity"] in ("critical", "high", "medium", "low", "info")
        assert e.finding["category"] in (
            "hardcoded-secret",
            "outdated-dependency",
            "missing-auth",
            "unsafe-sql",
            "complex-untested",
        )

    started = next(e for e in events if e.type == "scan.started")
    completed = next(e for e in events if e.type == "scan.completed")
    assert started.scan_run_id == completed.scan_run_id == result.scan_run_id
    assert completed.scan_summary is not None
    assert completed.scan_summary["totalFindings"] == 5
    assert completed.scan_summary["driftCount"] == 5
    assert "bySeverity" in completed.scan_summary
    assert "byCategory" in completed.scan_summary


async def test_demeter_adapter_buffers_findings_and_drift() -> None:
    result = await run_full_scan(REPO_ROOT, REPO_FULL)
    demeter = get_demeter_adapter()
    assert len(demeter.buffered_findings) == 5
    assert len(demeter.buffered_drift) == 5
    for p in demeter.buffered_findings:
        assert p.scan_run_id == result.scan_run_id
        assert p.repo_full_name == REPO_FULL
    for d in demeter.buffered_drift:
        assert d.scan_run_id == result.scan_run_id
        assert d.pattern in ("A", "B", "C", "D", "E")


async def test_severity_enum_lock_compliance() -> None:
    """Asclepius store LOCKED 5-enum: critical | high | medium | low | info."""
    result = await run_full_scan(REPO_ROOT, REPO_FULL)
    allowed = {"critical", "high", "medium", "low", "info"}
    for f in result.apollo_findings:
        assert f.severity in allowed, f"finding {f.id} severity {f.severity} not in lock"
    for d in result.drift_events:
        assert d.severity in allowed, f"drift {d.id} severity {d.severity} not in lock"


async def test_category_enum_kebab_lock_compliance() -> None:
    """Asclepius store LOCKED 5-enum kebab-case category."""
    result = await run_full_scan(REPO_ROOT, REPO_FULL)
    allowed = {
        "hardcoded-secret",
        "outdated-dependency",
        "missing-auth",
        "unsafe-sql",
        "complex-untested",
    }
    for f in result.apollo_findings:
        assert f.category in allowed, f"finding {f.id} category {f.category} not in lock"


async def test_pattern_enum_lock_compliance() -> None:
    """PRD Section 11.3 LOCKED 5 pattern A-E. Lock 4."""
    result = await run_full_scan(REPO_ROOT, REPO_FULL)
    allowed = {"A", "B", "C", "D", "E"}
    for d in result.drift_events:
        assert d.pattern in allowed


async def test_finding_event_payload_camelcase_aliases() -> None:
    """Wire format MUST use camelCase per Asclepius TypeScript consumer."""
    await run_full_scan(REPO_ROOT, REPO_FULL)
    ws = get_ws_adapter()
    finding_events = [e for e in ws.published if e.type == "finding.detected"]
    for e in finding_events:
        payload = e.model_dump(by_alias=True, exclude_none=True)
        assert "repoFullName" in payload
        assert "scanRunId" in payload
        assert "finding" in payload
        assert "buildingId" in payload["finding"]
        assert "filePath" in payload["finding"]
        assert "lineStart" in payload["finding"]
        assert "lineEnd" in payload["finding"]


async def test_two_scans_have_distinct_run_ids() -> None:
    r1 = await run_full_scan(REPO_ROOT, REPO_FULL)
    r2 = await run_full_scan(REPO_ROOT, REPO_FULL)
    assert r1.scan_run_id != r2.scan_run_id


async def test_persist_finding_id_stable_across_scans() -> None:
    """Same repo + canned stub yields same finding.id; only scan_run_id differs.

    This validates Pythia FindingPersist UNIQUE (finding_id, scan_run_id)
    idempotency rationale: deduplication relies on stable finding.id.
    """
    r1 = await run_full_scan(REPO_ROOT, REPO_FULL)
    r2 = await run_full_scan(REPO_ROOT, REPO_FULL)
    ids_1 = sorted(f.id for f in r1.apollo_findings)
    ids_2 = sorted(f.id for f in r2.apollo_findings)
    assert ids_1 == ids_2


async def test_adapters_singleton_persistence() -> None:
    """Adapters initialized once, dispatched ops accumulate per session."""
    a1 = get_parser_adapter()
    a2 = get_parser_adapter()
    assert a1 is a2

    t1 = get_triton_adapter()
    t2 = get_triton_adapter()
    assert t1 is t2

    d1 = get_demeter_adapter()
    d2 = get_demeter_adapter()
    assert d1 is d2

    w1 = get_ws_adapter()
    w2 = get_ws_adapter()
    assert w1 is w2
