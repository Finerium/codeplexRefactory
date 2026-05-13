"""DemeterRealService: real asyncpg-backed persistence (Wave 3 cycle 1 ship).

Implements `DemeterServiceProtocol` from `demeter_service.py` stub + extends
with `persist_finding` + `persist_drift_event` + `persist_proposal` +
`persist_simulation_event` + `log_llm_call` + aggregate query methods per
Pythia contracts.

Registration: FastAPI lifespan in `app/main.py` calls
`set_demeter_service(DemeterRealService(pool))` to swap the singleton.

Idempotency: INSERT ... ON CONFLICT DO NOTHING / UPDATE per Pythia.

Anti-pattern Lock 5: real impl, no mock.
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any

import asyncpg
from pydantic import BaseModel, Field
from typing import Literal

from app.services.demeter_service import (
    DemeterServiceProtocol,
    GitHubUserUpsert,
    PREventPersist,
)

logger = logging.getLogger("demeter.real")


# ---------- Extended Pydantic payload schemas ----------


class FindingPersist(BaseModel):
    """Finding event Nemesis sends to Demeter (per nemesis-to-demeter.md)."""

    finding_id: str
    building_id: str
    file_path: str
    line_start: int
    line_end: int
    category: Literal[
        "hardcoded-secret",
        "outdated-dependency",
        "missing-auth",
        "unsafe-sql",
        "complex-untested",
    ]
    severity: Literal["critical", "high", "medium", "low", "info"]
    title: str
    description: str = ""
    suggested_fix: str = ""
    cvss_vector: str | None = None
    cvss_base_score: float | None = None
    exploit_pattern: str | None = None
    repo_full_name: str
    scan_run_id: str
    detected_at: str


class DriftEventPersist(BaseModel):
    """Spec-drift event Nemesis sends to Demeter."""

    drift_id: str
    pattern: Literal["A", "B", "C", "D", "E"]
    pattern_label: str
    repo_full_name: str
    affected_resource: str
    severity: Literal["critical", "high", "medium", "low", "info"]
    evidence: dict = Field(default_factory=dict)
    scan_run_id: str
    detected_at: str


class ProposalPersist(BaseModel):
    """Refactor proposal Pandora sends to Demeter."""

    proposal_id: str
    user_intent: str
    openspec_change_path: str
    repo_full_name: str
    author_user_id: int | None = None
    stage: Literal[
        "proposed",
        "simulating",
        "drafted",
        "accepted",
        "discarded",
        "archived",
    ] = "proposed"
    title: str
    summary: str = ""
    affected_files: list[str] = Field(default_factory=list)
    created_at: str


class SimulationEventPersist(BaseModel):
    """Simulation stage event Pandora sends to Demeter."""

    simulation_id: str
    stage: Literal[
        "proposed",
        "tests_generating",
        "tests_written",
        "impl_generating",
        "impl_written",
        "diff_serializing",
        "completed",
        "accepted",
        "discarded",
    ]
    payload: dict = Field(default_factory=dict)
    timestamp: str


class LLMCallLogPersist(BaseModel):
    """LLM call cost log per pandora-to-demeter.md lines 60-91."""

    call_id: str
    worker: Literal[
        "pandora",
        "nemesis",
        "triton-residents",
        "boreas-onboarding",
        "triton-chat",
        "triton-onboarding",
        "triton-security",
        "triton-simulation",
    ]
    simulation_id: str | None = None
    resident_id: Literal["Athena", "Apollo", "Argus", "Clio", "Hermes"] | None = None
    model_used: Literal["V4-Flash", "V4-Pro", "deepseek-v4-flash", "deepseek-v4-pro"]
    thinking_mode: Literal["disabled", "low", "medium", "high"]
    cache_hit: bool = False
    canned_hit: bool = False
    input_tokens: int
    output_tokens: int
    cost_estimate_usd: float
    latency_ms: int = 0
    timestamp: str
    error: str | None = None


# ---------- Real service impl ----------


class DemeterRealService:
    """Real asyncpg-backed Demeter service.

    Implements DemeterServiceProtocol from stub module + extended methods.
    Pool lifetime owned by FastAPI lifespan.
    """

    def __init__(self, pool: asyncpg.Pool) -> None:
        self._pool = pool

    # ---------- Hades surface (DemeterServiceProtocol) ----------

    async def upsert_user(self, user: GitHubUserUpsert) -> None:
        """Upsert user row, ON CONFLICT (github_id) DO UPDATE."""
        async with self._pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO users (
                    github_id, github_login, avatar_url,
                    encrypted_access_token, scopes, last_login_at
                ) VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (github_id) DO UPDATE SET
                    github_login = EXCLUDED.github_login,
                    avatar_url = EXCLUDED.avatar_url,
                    encrypted_access_token = EXCLUDED.encrypted_access_token,
                    scopes = EXCLUDED.scopes,
                    last_login_at = EXCLUDED.last_login_at;
                """,
                user.github_id,
                user.github_login,
                user.avatar_url,
                user.encrypted_access_token,
                user.scopes,
                _parse_dt(user.last_login_at),
            )
        logger.info("user upsert github_id=%s login=%s", user.github_id, user.github_login)

    async def persist_pr_event(self, event: PREventPersist) -> None:
        """Insert pr_event row, ON CONFLICT (delivery_id) DO NOTHING."""
        async with self._pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO pr_events (
                    event_type, delivery_id, building_id, repo_full_name,
                    resource_number, resource_title, author_login,
                    files_changed, lines_added, lines_deleted,
                    story_points, assignee_login, payload, received_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7,
                    $8, $9, $10, $11, $12, $13::jsonb, $14
                )
                ON CONFLICT (delivery_id) DO NOTHING;
                """,
                event.event_type,
                event.delivery_id,
                event.building_id,
                event.repo_full_name,
                event.resource_number,
                event.resource_title,
                event.author_login,
                event.files_changed,
                event.lines_added,
                event.lines_deleted,
                event.story_points,
                event.assignee_login,
                _to_jsonb(event.payload),
                _parse_dt(event.received_at),
            )

    # ---------- Nemesis surface ----------

    async def persist_finding(self, finding: FindingPersist) -> None:
        """Insert finding_event row, ON CONFLICT (finding_id, scan_run_id) DO NOTHING."""
        async with self._pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO finding_events (
                    finding_id, scan_run_id, building_id, file_path,
                    line_start, line_end, category, severity, title,
                    description, suggested_fix, cvss_vector,
                    cvss_base_score, exploit_pattern, repo_full_name,
                    status, detected_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9,
                    $10, $11, $12, $13, $14, $15, 'open', $16
                )
                ON CONFLICT (finding_id, scan_run_id) DO NOTHING;
                """,
                finding.finding_id,
                finding.scan_run_id,
                finding.building_id,
                finding.file_path,
                finding.line_start,
                finding.line_end,
                finding.category,
                finding.severity,
                finding.title,
                finding.description,
                finding.suggested_fix,
                finding.cvss_vector,
                finding.cvss_base_score,
                finding.exploit_pattern,
                finding.repo_full_name,
                _parse_dt(finding.detected_at),
            )

    async def persist_drift_event(self, drift: DriftEventPersist) -> None:
        """Insert drift_log row, ON CONFLICT (drift_id, scan_run_id) DO NOTHING."""
        async with self._pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO drift_log (
                    drift_id, pattern, pattern_label, repo_full_name,
                    affected_resource, severity, evidence,
                    scan_run_id, detected_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9
                )
                ON CONFLICT (drift_id, scan_run_id) DO NOTHING;
                """,
                drift.drift_id,
                drift.pattern,
                drift.pattern_label,
                drift.repo_full_name,
                drift.affected_resource,
                drift.severity,
                _to_jsonb(drift.evidence),
                drift.scan_run_id,
                _parse_dt(drift.detected_at),
            )

    async def list_findings_for_building(
        self,
        building_id: str,
        status_filter: list[str] | None = None,
        repo_full_name: str | None = None,
    ) -> list[dict[str, Any]]:
        """Query open findings for a building (Asclepius glow consumer).

        Manager FINAL Cycle 2 Cluster A audit fix: `repo_full_name` optional
        filter prevents cross-repo collision when two repos share a logical
        `building_id` (for example `src/index.js` exists in both repos and
        building_id is derived from file_path). Without this filter, switching
        the active repo in the UI could surface findings from a prior repo.
        Legacy callers may omit the arg and continue to receive cross-repo
        rows (backwards compatible).
        """
        async with self._pool.acquire() as conn:
            statuses = status_filter or ["open"]
            if repo_full_name:
                rows = await conn.fetch(
                    """
                    SELECT
                        finding_id, scan_run_id, building_id, file_path,
                        line_start, line_end, category, severity, title,
                        description, suggested_fix, cvss_vector,
                        cvss_base_score, exploit_pattern, repo_full_name,
                        status, linked_issue_number, detected_at
                    FROM finding_events
                    WHERE building_id = $1
                      AND repo_full_name = $2
                      AND status = ANY($3::text[])
                    ORDER BY detected_at DESC
                    LIMIT 200;
                    """,
                    building_id,
                    repo_full_name,
                    statuses,
                )
            else:
                rows = await conn.fetch(
                    """
                    SELECT
                        finding_id, scan_run_id, building_id, file_path,
                        line_start, line_end, category, severity, title,
                        description, suggested_fix, cvss_vector,
                        cvss_base_score, exploit_pattern, repo_full_name,
                        status, linked_issue_number, detected_at
                    FROM finding_events
                    WHERE building_id = $1 AND status = ANY($2::text[])
                    ORDER BY detected_at DESC
                    LIMIT 200;
                    """,
                    building_id,
                    statuses,
                )
            return [dict(r) for r in rows]

    async def list_drift_events(
        self,
        repo_full_name: str,
        since: str | None = None,
    ) -> list[dict[str, Any]]:
        """Query drift events for dashboard summary."""
        async with self._pool.acquire() as conn:
            if since:
                rows = await conn.fetch(
                    """
                    SELECT drift_id, pattern, pattern_label, repo_full_name,
                           affected_resource, severity, evidence, scan_run_id,
                           detected_at
                    FROM drift_log
                    WHERE repo_full_name = $1 AND detected_at > $2
                    ORDER BY detected_at DESC;
                    """,
                    repo_full_name,
                    _parse_dt(since),
                )
            else:
                rows = await conn.fetch(
                    """
                    SELECT drift_id, pattern, pattern_label, repo_full_name,
                           affected_resource, severity, evidence, scan_run_id,
                           detected_at
                    FROM drift_log
                    WHERE repo_full_name = $1
                    ORDER BY detected_at DESC
                    LIMIT 500;
                    """,
                    repo_full_name,
                )
            return [dict(r) for r in rows]

    # ---------- Pandora surface ----------

    async def persist_proposal(self, proposal: ProposalPersist) -> None:
        """Insert or update proposals row keyed by proposal_id."""
        async with self._pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO proposals (
                    proposal_id, user_intent, openspec_change_path,
                    repo_full_name, author_user_id, stage, title, summary,
                    affected_files, created_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
                )
                ON CONFLICT (proposal_id) DO UPDATE SET
                    stage = EXCLUDED.stage,
                    title = EXCLUDED.title,
                    summary = EXCLUDED.summary,
                    affected_files = EXCLUDED.affected_files,
                    updated_at = NOW();
                """,
                proposal.proposal_id,
                proposal.user_intent,
                proposal.openspec_change_path,
                proposal.repo_full_name,
                proposal.author_user_id,
                proposal.stage,
                proposal.title,
                proposal.summary,
                proposal.affected_files,
                _parse_dt(proposal.created_at),
            )

    async def update_proposal_stage(self, proposal_id: str, new_stage: str) -> None:
        """Update proposals.stage by proposal_id."""
        async with self._pool.acquire() as conn:
            await conn.execute(
                """
                UPDATE proposals SET stage = $2, updated_at = NOW()
                WHERE proposal_id = $1;
                """,
                proposal_id,
                new_stage,
            )

    async def persist_simulation_event(self, event: SimulationEventPersist) -> None:
        """Insert simulation_events row (append-only)."""
        async with self._pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO simulation_events (
                    simulation_id, stage, payload, timestamp
                ) VALUES ($1, $2, $3::jsonb, $4);
                """,
                event.simulation_id,
                event.stage,
                _to_jsonb(event.payload),
                _parse_dt(event.timestamp),
            )

    async def log_llm_call(self, call: LLMCallLogPersist) -> None:
        """Insert llm_call_log row, ON CONFLICT (call_id) DO NOTHING."""
        async with self._pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO llm_call_log (
                    call_id, worker, simulation_id, resident_id,
                    model_used, thinking_mode, cache_hit, canned_hit,
                    input_tokens, output_tokens, cost_estimate_usd,
                    latency_ms, timestamp, error
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                    $11, $12, $13, $14
                )
                ON CONFLICT (call_id) DO NOTHING;
                """,
                call.call_id,
                call.worker,
                call.simulation_id,
                call.resident_id,
                call.model_used,
                call.thinking_mode,
                call.cache_hit,
                call.canned_hit,
                call.input_tokens,
                call.output_tokens,
                call.cost_estimate_usd,
                call.latency_ms,
                _parse_dt(call.timestamp),
                call.error,
            )

    # ---------- Materialized view refresh + introspection ----------

    async def refresh_dashboard_views(self) -> None:
        """Refresh dashboard materialized views (idempotent, safe to call repeatedly)."""
        views = [
            "velocity_per_sprint",
            "cycle_time_aggregate",
            "lead_time_aggregate",
            "drift_summary_view",
            "repo_status_view",
        ]
        async with self._pool.acquire() as conn:
            for v in views:
                try:
                    await conn.execute(f"REFRESH MATERIALIZED VIEW {v};")
                except Exception as exc:
                    logger.warning("refresh %s failed: %s", v, exc)

    async def refresh_activity_views(self) -> None:
        """Refresh activity materialized views."""
        views = ["commit_frequency_per_building", "ownership_distribution"]
        async with self._pool.acquire() as conn:
            for v in views:
                try:
                    await conn.execute(f"REFRESH MATERIALIZED VIEW {v};")
                except Exception as exc:
                    logger.warning("refresh %s failed: %s", v, exc)

    async def get_user_by_github_id(self, github_id: int) -> dict[str, Any] | None:
        """Lookup user row by github_id."""
        async with self._pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT id, github_id, github_login, encrypted_access_token, scopes "
                "FROM users WHERE github_id = $1;",
                github_id,
            )
            return dict(row) if row else None

    @property
    def pool(self) -> asyncpg.Pool:
        return self._pool


# ---------- pool factory ----------


async def create_pool(database_url: str, min_size: int = 1, max_size: int = 5) -> asyncpg.Pool:
    """Create asyncpg pool with sane defaults.

    Strips `+asyncpg` driver tag from SQLAlchemy-style URLs since asyncpg
    parses raw `postgresql://` URLs only.
    """
    url = database_url
    if url.startswith("postgresql+asyncpg://"):
        url = url.replace("postgresql+asyncpg://", "postgresql://", 1)
    pool = await asyncpg.create_pool(
        dsn=url,
        min_size=min_size,
        max_size=max_size,
        command_timeout=30.0,
    )
    if pool is None:
        raise RuntimeError("asyncpg.create_pool returned None")
    return pool


# ---------- helpers ----------


def _to_jsonb(d: dict | None) -> str:
    """Serialize dict to JSON text for $::jsonb cast.

    asyncpg accepts str for jsonb when explicitly cast in SQL.
    """
    import json

    if d is None:
        return "{}"
    return json.dumps(d, default=str)


def _parse_dt(value: str | datetime | None) -> datetime | None:
    """Coerce ISO 8601 str or datetime to timezone-aware datetime for asyncpg.

    asyncpg timestamptz codec requires datetime.datetime, not str. We accept
    str from Pydantic schemas (contracts spec ISO strings) and parse here.
    """
    if value is None:
        return None
    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value
    # str path
    s = value
    # fromisoformat (3.11+) handles "+00:00" suffix natively
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"
    try:
        dt = datetime.fromisoformat(s)
    except ValueError:
        # Fallback: try without timezone
        try:
            dt = datetime.strptime(s[:19], "%Y-%m-%dT%H:%M:%S")
        except ValueError:
            return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def make_call_id() -> str:
    """Generate stable call_id for log_llm_call."""
    return str(uuid.uuid4())


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# Verify Protocol satisfaction at import.
_protocol_check: DemeterServiceProtocol = DemeterRealService.__new__(DemeterRealService)  # type: ignore[assignment]


__all__ = [
    "DemeterRealService",
    "FindingPersist",
    "DriftEventPersist",
    "ProposalPersist",
    "SimulationEventPersist",
    "LLMCallLogPersist",
    "create_pool",
    "make_call_id",
    "utc_now_iso",
]
