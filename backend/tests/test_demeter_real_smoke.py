"""Smoke tests for DemeterRealService (Wave 3 cycle 1).

Tests target Pydantic schema satisfaction + Protocol compliance + idempotency
helpers without requiring live Postgres. Postgres-backed tests run in
test_demeter_persist_live.py when DATABASE_URL points to a reachable DB.
"""
from __future__ import annotations

from datetime import datetime, timezone

import pytest

from app.services.demeter_real import (
    DemeterRealService,
    DriftEventPersist,
    FindingPersist,
    LLMCallLogPersist,
    ProposalPersist,
    SimulationEventPersist,
    _to_jsonb,
    make_call_id,
    utc_now_iso,
)
from app.services.demeter_service import (
    DemeterServiceProtocol,
    GitHubUserUpsert,
    PREventPersist,
)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def test_demeter_real_service_satisfies_protocol() -> None:
    """DemeterRealService class signature compatible with DemeterServiceProtocol."""
    assert hasattr(DemeterRealService, "upsert_user")
    assert hasattr(DemeterRealService, "persist_pr_event")
    assert hasattr(DemeterRealService, "persist_finding")
    assert hasattr(DemeterRealService, "persist_drift_event")
    assert hasattr(DemeterRealService, "persist_proposal")
    assert hasattr(DemeterRealService, "persist_simulation_event")
    assert hasattr(DemeterRealService, "log_llm_call")


def test_github_user_upsert_pydantic_validation() -> None:
    payload = GitHubUserUpsert(
        github_id=12345,
        github_login="octocat",
        avatar_url="https://example.test/avatar.png",
        encrypted_access_token="cipher",
        scopes=["read:repo", "write:issues"],
        last_login_at=_now_iso(),
    )
    assert payload.github_id == 12345
    assert "read:repo" in payload.scopes


def test_pr_event_persist_schema() -> None:
    event = PREventPersist(
        event_type="pr.opened",
        delivery_id="deadbeef-1",
        building_id="b-1",
        repo_full_name="o/r",
        resource_number=42,
        resource_title="fix bug",
        author_login="octocat",
        files_changed=["a.py"],
        lines_added=10,
        lines_deleted=2,
        payload={"head": "abc"},
        received_at=_now_iso(),
    )
    assert event.event_type == "pr.opened"
    assert event.lines_added == 10


def test_finding_persist_schema() -> None:
    f = FindingPersist(
        finding_id="f-1",
        building_id="b-1",
        file_path="x.py",
        line_start=1,
        line_end=3,
        category="hardcoded-secret",
        severity="high",
        title="hardcoded API key",
        description="found near top of file",
        suggested_fix="move to env var",
        repo_full_name="o/r",
        scan_run_id="scan-1",
        detected_at=_now_iso(),
    )
    assert f.category == "hardcoded-secret"


def test_drift_event_persist_schema() -> None:
    d = DriftEventPersist(
        drift_id="d-1",
        pattern="A",
        pattern_label="spec drift A",
        repo_full_name="o/r",
        affected_resource="path/a.py",
        severity="medium",
        evidence={"commit": "abc"},
        scan_run_id="scan-1",
        detected_at=_now_iso(),
    )
    assert d.pattern == "A"


def test_proposal_persist_schema() -> None:
    p = ProposalPersist(
        proposal_id="prop-1",
        user_intent="extract function",
        openspec_change_path="openspec/changes/prop-1",
        repo_full_name="o/r",
        author_user_id=1,
        stage="proposed",
        title="extract foo",
        summary="refactor x into foo()",
        affected_files=["a.py", "b.py"],
        created_at=_now_iso(),
    )
    assert p.stage == "proposed"


def test_simulation_event_persist_schema() -> None:
    e = SimulationEventPersist(
        simulation_id="prop-1",
        stage="tests_generating",
        payload={"turn": 1},
        timestamp=_now_iso(),
    )
    assert e.stage == "tests_generating"


def test_llm_call_log_schema() -> None:
    c = LLMCallLogPersist(
        call_id=make_call_id(),
        worker="pandora",
        simulation_id="prop-1",
        resident_id="Athena",
        model_used="V4-Pro",
        thinking_mode="high",
        input_tokens=1000,
        output_tokens=500,
        cost_estimate_usd=0.005,
        latency_ms=2500,
        timestamp=_now_iso(),
    )
    assert c.worker == "pandora"
    assert c.resident_id == "Athena"


def test_to_jsonb_handles_none() -> None:
    assert _to_jsonb(None) == "{}"
    assert _to_jsonb({"a": 1}) == '{"a": 1}'


def test_utc_now_iso_format() -> None:
    s = utc_now_iso()
    # ISO 8601 with timezone offset
    assert "T" in s
    assert s.endswith("+00:00") or s.endswith("Z")
