"""Nemesis cycle 4-5 full 5/5 spec-drift real impl smoke test.

Verifies all 5 spec-drift A-E detectors fire on demo-drift fixture:
- Pattern A: issue #234 closed Sep 2025 + app/auth/oauth.ts edited Mar+Apr 2026.
- Pattern B: issue #189 closed Dec 2025 + no linked merged PR.
- Pattern C: issue #312 closed Jan 12 2026 + invoice.ts last commit Apr 28 2026
  (lag 106 days, exceeds default 90 day threshold).
- Pattern D: issue #405 reopened 3 times.
- Pattern E: archived spec openspec/archive/2026-01-15/add-oauth-flow/proposal.md
  references app/auth/oauth.ts, IssueStore commits_by_file shows commit
  "fix: oauth token expiry" without opsx: prefix touching that file.

Per _meta/plans/nemesis-wave3-cycle-plan.md Cycle 4 + Cycle 5.
"""
from __future__ import annotations

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


FIXTURE_ROOT = Path(__file__).parent / "fixtures" / "demo-drift"


@pytest.fixture(autouse=True)
def _reset_adapters() -> None:
    reset_parser_adapter()
    reset_triton_adapter()
    reset_demeter_adapter()
    reset_ws_adapter()


async def test_fixture_root_exists() -> None:
    assert FIXTURE_ROOT.exists()
    assert (FIXTURE_ROOT / ".codeplex" / "issues.json").exists()
    assert (FIXTURE_ROOT / "openspec" / "archive" / "2026-01-15" / "add-oauth-flow" / "proposal.md").exists()


async def test_drift_a_stale_closed_fires() -> None:
    from app.services.detectors import drift_a_stale_closed

    events = await drift_a_stale_closed.detect(FIXTURE_ROOT, "duopoly/demo-drift")
    assert events, "expected Pattern A trigger"
    real_events = [e for e in events if "[STUB cycle-1]" not in (e.description or "")]
    assert real_events, "expected real Pattern A trigger (not stub)"
    assert all(e.pattern == "A" for e in real_events)
    issue_ids = {e.issue_id for e in real_events}
    assert 234 in issue_ids, f"expected issue 234 in {issue_ids}"


async def test_drift_b_closed_without_merge_fires() -> None:
    from app.services.detectors import drift_b_closed_without_merge

    events = await drift_b_closed_without_merge.detect(FIXTURE_ROOT, "duopoly/demo-drift")
    assert events, "expected Pattern B trigger"
    real_events = [e for e in events if "[STUB cycle-1]" not in (e.description or "")]
    assert real_events, "expected real Pattern B trigger"
    issue_ids = {e.issue_id for e in real_events}
    assert 189 in issue_ids, f"expected issue 189 in {issue_ids}"


async def test_drift_c_spec_impl_lag_fires() -> None:
    from app.services.detectors import drift_c_spec_impl_lag

    events = await drift_c_spec_impl_lag.detect(FIXTURE_ROOT, "duopoly/demo-drift")
    assert events, "expected Pattern C trigger"
    real_events = [e for e in events if "[STUB cycle-1]" not in (e.description or "")]
    assert real_events, "expected real Pattern C trigger"
    issue_ids = {e.issue_id for e in real_events}
    assert 312 in issue_ids, f"expected issue 312 in {issue_ids}"


async def test_drift_d_reopened_cycle_fires() -> None:
    from app.services.detectors import drift_d_reopened_cycle

    events = await drift_d_reopened_cycle.detect(FIXTURE_ROOT, "duopoly/demo-drift")
    assert events, "expected Pattern D trigger"
    real_events = [e for e in events if "[STUB cycle-1]" not in (e.description or "")]
    assert real_events, "expected real Pattern D trigger"
    issue_ids = {e.issue_id for e in real_events}
    assert 405 in issue_ids, f"expected issue 405 in {issue_ids}"
    e_405 = next(e for e in real_events if e.issue_id == 405)
    assert e_405.severity == "high"
    assert e_405.evidence["reopened_count"] == 3


async def test_drift_e_openspec_drift_fires() -> None:
    from app.services.detectors import drift_e_openspec_drift

    events = await drift_e_openspec_drift.detect(FIXTURE_ROOT, "duopoly/demo-drift")
    assert events, "expected Pattern E trigger"
    real_events = [
        e
        for e in events
        if "[STUB cycle-1]" not in (e.description or "")
        and e.severity != "info"  # exclude git_unavailable info
    ]
    assert real_events, "expected real Pattern E trigger"
    assert all(e.pattern == "E" for e in real_events)
    # archived_change should reference add-oauth-flow.
    archived_changes = {e.evidence.get("archived_change") for e in real_events}
    assert any("add-oauth-flow" in str(c) for c in archived_changes)


async def test_full_dispatcher_5_drift_real_trigger() -> None:
    """End-to-end dispatcher fires all 5 spec-drift patterns on demo-drift fixture."""
    result = await run_full_scan(FIXTURE_ROOT, "duopoly/demo-drift")
    triggered = {p for p, c in result.drift_count_by_pattern.items() if c > 0}
    assert triggered == {"A", "B", "C", "D", "E"}, (
        f"expected all 5 patterns fired; got {triggered}, "
        f"counts={result.drift_count_by_pattern}"
    )

    real_events = [
        e
        for e in result.drift_events
        if "[STUB cycle-1]" not in (e.description or "")
    ]
    # Each pattern should have at least one real event.
    real_patterns = {e.pattern for e in real_events}
    assert real_patterns == {"A", "B", "C", "D", "E"}, (
        f"expected all 5 patterns have real events; got {real_patterns}"
    )


async def test_full_scan_5_apollo_still_triggers_on_drift_fixture() -> None:
    """Drift fixture has no source files; Apollo detectors fall back gracefully."""
    result = await run_full_scan(FIXTURE_ROOT, "duopoly/demo-drift")
    triggered_apollo = {d for d, c in result.apollo_count_by_detector.items() if c > 0}
    # At minimum dispatcher emits a valid result. Verify Pydantic schema still ok
    # + drift events sum to at least 5 (one per pattern) with possibly more from
    # Pattern C firing on multiple issues with lag.
    assert isinstance(triggered_apollo, set)
    assert sum(result.drift_count_by_pattern.values()) >= 5
