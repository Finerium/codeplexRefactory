"""Nemesis cycle 3 full 5/5 Apollo real impl smoke test.

Verifies all 5 Apollo detectors fire on NodeGoat slice fixture:
- secrets (1): real regex + entropy on config.js MongoDB URI + AWS key + Stripe key.
- outdated_deps (2): real OSV API query on package.json (when network).
- missing_auth (3): real Express route scan flagging /admin.
- unsafe_sql (4): real regex SQL concat detection on allocations-dao.js.
- complex_untested (5): real complexity + colocated-test gap on profile.js.

Per _meta/plans/nemesis-wave3-cycle-plan.md Cycle 3.
"""
from __future__ import annotations

import os
import socket
from pathlib import Path

import pytest

from app.services.detectors.adapters import (
    reset_demeter_adapter,
    reset_parser_adapter,
    reset_triton_adapter,
    reset_ws_adapter,
)
from app.services.detectors.dispatcher import run_full_scan

pytestmark = pytest.mark.asyncio


FIXTURE_ROOT = Path(__file__).parent / "fixtures" / "nodegoat-slice"


@pytest.fixture(autouse=True)
def _reset_adapters() -> None:
    reset_parser_adapter()
    reset_triton_adapter()
    reset_demeter_adapter()
    reset_ws_adapter()


def _has_network() -> bool:
    if os.environ.get("NEMESIS_OFFLINE") == "1":
        return False
    try:
        socket.create_connection(("api.osv.dev", 443), timeout=2.0)
        return True
    except OSError:
        return False


async def test_unsafe_sql_detects_concat_in_allocations_dao() -> None:
    from app.services.detectors import unsafe_sql
    from app.services.detectors.adapters import get_parser_adapter

    parser = get_parser_adapter()
    parsed = await parser.parse_repo(FIXTURE_ROOT)
    findings = await unsafe_sql.detect(
        FIXTURE_ROOT, parsed, "duopoly/codeplex-demo-nodegoat-slice"
    )
    assert findings, "expected unsafe_sql to flag db.query concat in fixture"
    flagged_paths = {f.file_path for f in findings}
    assert any("allocations-dao" in p for p in flagged_paths)
    for f in findings:
        assert f.category == "unsafe-sql"
        assert f.severity == "critical"
        assert "[STUB cycle-1]" not in (f.description or "")


async def test_complex_untested_flags_profile_controller() -> None:
    from app.services.detectors import complex_untested
    from app.services.detectors.adapters import get_parser_adapter

    parser = get_parser_adapter()
    parsed = await parser.parse_repo(FIXTURE_ROOT)
    findings = await complex_untested.detect(
        FIXTURE_ROOT, parsed, "duopoly/codeplex-demo-nodegoat-slice"
    )
    assert findings, "expected complex_untested to flag profile.js (cc > 15, no test)"
    flagged_paths = {f.file_path for f in findings}
    assert any("profile.js" in p for p in flagged_paths)
    for f in findings:
        assert f.category == "complex-untested"
        assert f.severity in ("medium", "high", "critical")
        assert "[STUB cycle-1]" not in (f.description or "")


async def test_full_dispatcher_5_apollo_real_trigger_on_fixture() -> None:
    """Run end-to-end dispatcher; verify all 5 Apollo detector_ids fire at least once."""
    result = await run_full_scan(
        FIXTURE_ROOT, "duopoly/codeplex-demo-nodegoat-slice"
    )
    triggered_detectors = {
        det_id for det_id, count in result.apollo_count_by_detector.items() if count > 0
    }

    # All 5 detectors should fire (outdated_deps may be 0 offline; canned stub
    # path returns 1 finding either way, so it counts as triggered).
    assert "secrets" in triggered_detectors, f"secrets miss: {result.apollo_count_by_detector}"
    assert "missing_auth" in triggered_detectors, f"missing_auth miss: {result.apollo_count_by_detector}"
    assert "unsafe_sql" in triggered_detectors, f"unsafe_sql miss: {result.apollo_count_by_detector}"
    assert "complex_untested" in triggered_detectors, f"complex_untested miss: {result.apollo_count_by_detector}"
    # outdated_deps: with network it should fire, offline falls back to canned stub
    # (still triggers > 0).
    assert "outdated_deps" in triggered_detectors, f"outdated_deps miss: {result.apollo_count_by_detector}"

    # Verify NO finding still labeled cycle-1 stub in real impl path (except
    # known stub fallback when fixture/network unavailable - tolerated for
    # outdated_deps offline only).
    real_findings = [
        f for f in result.apollo_findings
        if f.detector_id != "outdated_deps" or _has_network()
    ]
    for f in real_findings:
        assert "[STUB cycle-1]" not in (f.description or ""), \
            f"finding {f.id} description still stub-labeled: {f.description}"


async def test_full_scan_5_drift_lanes_present() -> None:
    """All 5 drift lanes execute. Manager FINAL Cycle 2 Bug #7 (Cluster F
    Nemesis 20260513-0857) removed the canned NodeGoat stub fallback, so when
    no `.codeplex/issues.json` fixture is present each pattern returns 0
    events honestly instead of 1 fake event. Contract verified: 5 keys
    present, each value >= 0."""
    result = await run_full_scan(
        FIXTURE_ROOT, "duopoly/codeplex-demo-nodegoat-slice"
    )
    assert set(result.drift_count_by_pattern.keys()) == {"A", "B", "C", "D", "E"}
    for pattern in ("A", "B", "C", "D", "E"):
        assert result.drift_count_by_pattern[pattern] >= 0
    # Also assert no canned NodeGoat string leaked.
    for d in result.drift_events:
        haystack = f"{d.description} {d.evidence}"
        assert "[STUB cycle-1]" not in haystack
        assert "Issue #234" not in haystack
        assert "Issue #189" not in haystack
        assert "Issue #312" not in haystack
        assert "Issue #405" not in haystack
        assert "app/auth/oauth.ts" not in haystack
        assert "app/notifications/email.ts" not in haystack
        assert "app/billing/invoice.ts" not in haystack
        assert "app/api/upload.ts" not in haystack
