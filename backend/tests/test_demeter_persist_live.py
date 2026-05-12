"""Live Postgres persist tests for DemeterRealService.

Skips when DATABASE_URL points at localhost (conftest default for unit tests).
Runs when DATABASE_URL points at live Refactory Postgres (manual smoke).

Anti-pattern Lock 5: tests assert real DB state, not mocked behavior.
"""
from __future__ import annotations

import asyncio
import os
import uuid
from datetime import datetime, timezone

import pytest

from app.services.demeter_real import (
    DemeterRealService,
    DriftEventPersist,
    FindingPersist,
    LLMCallLogPersist,
    ProposalPersist,
    SimulationEventPersist,
    create_pool,
    make_call_id,
)
from app.services.demeter_service import GitHubUserUpsert, PREventPersist


def _is_live_db() -> bool:
    """Check if DATABASE_URL points to a non-localhost host."""
    url = os.environ.get("DATABASE_URL", "")
    return "localhost" not in url and "127.0.0.1" not in url and url != ""


pytestmark = pytest.mark.skipif(
    not _is_live_db(),
    reason="live Postgres tests skipped (DATABASE_URL is localhost or empty)",
)


def _iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@pytest.fixture
async def live_pool():
    """Create asyncpg pool against the live DATABASE_URL."""
    url = os.environ["DATABASE_URL"]
    pool = await create_pool(url, min_size=1, max_size=2)
    yield pool
    await pool.close()


@pytest.fixture
async def demeter(live_pool):
    return DemeterRealService(live_pool)


async def test_alembic_tables_exist(live_pool) -> None:
    """Alembic migrations applied: core tables present."""
    async with live_pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT tablename FROM pg_tables WHERE schemaname = 'public';"
        )
    table_names = {r["tablename"] for r in rows}
    expected = {
        "users",
        "pr_events",
        "finding_events",
        "drift_log",
        "proposals",
        "simulation_events",
        "llm_call_log",
        "semantic_cache_embeddings",
    }
    missing = expected - table_names
    assert not missing, f"missing tables: {missing}"


async def test_upsert_user_idempotent(demeter) -> None:
    """upsert_user with same github_id twice = one row."""
    gh_id = 90000000 + (uuid.uuid4().int % 1000)
    payload = GitHubUserUpsert(
        github_id=gh_id,
        github_login=f"test-{gh_id}",
        avatar_url="https://example.test/x.png",
        encrypted_access_token="cipher",
        scopes=["read:repo"],
        last_login_at=_iso(),
    )
    await demeter.upsert_user(payload)
    await demeter.upsert_user(payload)
    async with demeter.pool.acquire() as conn:
        count = await conn.fetchval(
            "SELECT COUNT(*) FROM users WHERE github_id = $1;", gh_id
        )
        await conn.execute("DELETE FROM users WHERE github_id = $1;", gh_id)
    assert count == 1


async def test_persist_pr_event_idempotent(demeter) -> None:
    """persist_pr_event with same delivery_id twice = one row."""
    delivery = f"delivery-{uuid.uuid4()}"
    event = PREventPersist(
        event_type="pr.opened",
        delivery_id=delivery,
        building_id="b-test",
        repo_full_name="test/repo",
        resource_number=1,
        resource_title="test",
        author_login="testuser",
        files_changed=["a.py"],
        lines_added=10,
        lines_deleted=2,
        received_at=_iso(),
    )
    await demeter.persist_pr_event(event)
    await demeter.persist_pr_event(event)
    async with demeter.pool.acquire() as conn:
        count = await conn.fetchval(
            "SELECT COUNT(*) FROM pr_events WHERE delivery_id = $1;", delivery
        )
        await conn.execute("DELETE FROM pr_events WHERE delivery_id = $1;", delivery)
    assert count == 1


async def test_persist_finding_idempotent(demeter) -> None:
    """persist_finding ON CONFLICT (finding_id, scan_run_id) DO NOTHING."""
    fid = f"f-{uuid.uuid4()}"
    sid = f"scan-{uuid.uuid4()}"
    finding = FindingPersist(
        finding_id=fid,
        building_id="b-test",
        file_path="x.py",
        line_start=1,
        line_end=3,
        category="hardcoded-secret",
        severity="high",
        title="hardcoded API key",
        description="d",
        suggested_fix="s",
        repo_full_name="test/repo",
        scan_run_id=sid,
        detected_at=_iso(),
    )
    await demeter.persist_finding(finding)
    await demeter.persist_finding(finding)
    async with demeter.pool.acquire() as conn:
        count = await conn.fetchval(
            "SELECT COUNT(*) FROM finding_events WHERE finding_id = $1 AND scan_run_id = $2;",
            fid,
            sid,
        )
        await conn.execute(
            "DELETE FROM finding_events WHERE finding_id = $1 AND scan_run_id = $2;",
            fid,
            sid,
        )
    assert count == 1


async def test_persist_drift_event(demeter) -> None:
    did = f"d-{uuid.uuid4()}"
    sid = f"scan-{uuid.uuid4()}"
    drift = DriftEventPersist(
        drift_id=did,
        pattern="A",
        pattern_label="drift pattern A",
        repo_full_name="test/repo",
        affected_resource="a.py",
        severity="medium",
        evidence={"commit": "abc"},
        scan_run_id=sid,
        detected_at=_iso(),
    )
    await demeter.persist_drift_event(drift)
    async with demeter.pool.acquire() as conn:
        count = await conn.fetchval(
            "SELECT COUNT(*) FROM drift_log WHERE drift_id = $1;", did
        )
        await conn.execute("DELETE FROM drift_log WHERE drift_id = $1;", did)
    assert count == 1


async def test_persist_proposal_and_update(demeter) -> None:
    pid = f"prop-{uuid.uuid4()}"
    proposal = ProposalPersist(
        proposal_id=pid,
        user_intent="extract",
        openspec_change_path=f"openspec/changes/{pid}",
        repo_full_name="test/repo",
        stage="proposed",
        title="extract foo",
        summary="",
        affected_files=["a.py"],
        created_at=_iso(),
    )
    await demeter.persist_proposal(proposal)
    await demeter.update_proposal_stage(pid, "simulating")
    async with demeter.pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT stage FROM proposals WHERE proposal_id = $1;", pid
        )
        await conn.execute("DELETE FROM proposals WHERE proposal_id = $1;", pid)
    assert row["stage"] == "simulating"


async def test_persist_simulation_event_and_llm_call(demeter) -> None:
    pid = f"prop-{uuid.uuid4()}"
    proposal = ProposalPersist(
        proposal_id=pid,
        user_intent="extract",
        openspec_change_path=f"openspec/changes/{pid}",
        repo_full_name="test/repo",
        stage="proposed",
        title="extract foo",
        summary="",
        affected_files=["a.py"],
        created_at=_iso(),
    )
    await demeter.persist_proposal(proposal)
    await demeter.persist_simulation_event(
        SimulationEventPersist(
            simulation_id=pid,
            stage="tests_generating",
            payload={"turn": 1},
            timestamp=_iso(),
        )
    )
    call_id = make_call_id()
    await demeter.log_llm_call(
        LLMCallLogPersist(
            call_id=call_id,
            worker="pandora",
            simulation_id=pid,
            resident_id="Athena",
            model_used="V4-Pro",
            thinking_mode="high",
            input_tokens=100,
            output_tokens=50,
            cost_estimate_usd=0.001,
            latency_ms=1000,
            timestamp=_iso(),
        )
    )
    async with demeter.pool.acquire() as conn:
        sim_count = await conn.fetchval(
            "SELECT COUNT(*) FROM simulation_events WHERE simulation_id = $1;", pid
        )
        llm_count = await conn.fetchval(
            "SELECT COUNT(*) FROM llm_call_log WHERE call_id = $1;", call_id
        )
        await conn.execute("DELETE FROM simulation_events WHERE simulation_id = $1;", pid)
        await conn.execute("DELETE FROM llm_call_log WHERE call_id = $1;", call_id)
        await conn.execute("DELETE FROM proposals WHERE proposal_id = $1;", pid)
    assert sim_count == 1
    assert llm_count == 1


async def test_refresh_dashboard_views(demeter) -> None:
    """Materialized view refresh works without erroring."""
    await demeter.refresh_dashboard_views()
    # No exception = pass; the views may be empty but refresh is idempotent.


async def test_refresh_activity_views(demeter) -> None:
    await demeter.refresh_activity_views()


async def test_dashboard_query_returns_data_shape(demeter) -> None:
    """DashboardQueryService returns DashboardData shape against live DB."""
    from app.services.dashboard_query import DashboardData, DashboardQueryService

    svc = DashboardQueryService(demeter.pool)
    # Refresh views first so query works on empty DB
    await demeter.refresh_dashboard_views()
    data = await svc.fetch_dashboard(range="sprint", repo="all", sprint=None, user=1)
    assert isinstance(data, DashboardData)
    assert isinstance(data.kpis, list)
    assert isinstance(data.drifts, list)
    assert isinstance(data.repos, list)


async def test_activity_query_returns_data_shape(demeter) -> None:
    """ActivityQueryService returns ActivityData shape against live DB."""
    from app.services.activity_query import ActivityData, ActivityQueryService

    svc = ActivityQueryService(demeter.pool)
    await demeter.refresh_activity_views()
    data = await svc.fetch_activity(days=30, repo="all", district=None, user=1)
    assert isinstance(data, ActivityData)
    assert isinstance(data.timeline, list)
    assert isinstance(data.hotspots, list)
    assert isinstance(data.ownership, list)


async def test_cost_tracking_aggregate(demeter) -> None:
    """CostTrackingService aggregates session cost (may be 0 on empty DB)."""
    from app.services.cost_tracking import CostTrackingService

    svc = CostTrackingService(demeter)
    summary = await svc.aggregate_session_cost()
    assert "total_usd" in summary
    assert "total_calls" in summary
    assert "budget_remaining_usd" in summary
    assert summary["total_usd"] >= 0.0


async def test_ticket_aggregation(demeter) -> None:
    """TicketAggregationService aggregates per-repo ticket state."""
    from app.services.ticket_aggregation import TicketAggregationService

    svc = TicketAggregationService(demeter.pool)
    aggregates = await svc.aggregate_all_repos(window_days=30)
    assert isinstance(aggregates, list)
