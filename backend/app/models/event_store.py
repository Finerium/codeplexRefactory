"""SQLAlchemy ORM declarative models for Demeter event store (Wave 3).

Schema verbatim per Pythia contracts:
- `_meta/contracts/hades-to-demeter.md`     -> users, pr_events
- `_meta/contracts/nemesis-to-demeter.md`   -> finding_events, drift_log
- `_meta/contracts/pandora-to-demeter.md`   -> proposals, simulation_events, llm_call_log
- semantic_cache_embeddings: Demeter-defined for Triton semantic cache persist option.

Anti-pattern Lock 4: schema LOCKED Pythia verbatim. Any drift = schema break.
"""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import (
    ARRAY,
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """SQLAlchemy declarative base for all Demeter event store tables."""

    pass


# ---------- users (Hades OAuth callback persist) ----------


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    github_id: Mapped[int] = mapped_column(BigInteger, unique=True, nullable=False)
    github_login: Mapped[str] = mapped_column(Text, nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    encrypted_access_token: Mapped[str] = mapped_column(Text, nullable=False)
    scopes: Mapped[list[str]] = mapped_column(ARRAY(Text), nullable=False)
    last_login_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


# ---------- pr_events (Hades webhook ingest) ----------


class PREvent(Base):
    __tablename__ = "pr_events"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    event_type: Mapped[str] = mapped_column(Text, nullable=False)
    delivery_id: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    building_id: Mapped[str | None] = mapped_column(Text, nullable=True)
    repo_full_name: Mapped[str] = mapped_column(Text, nullable=False)
    resource_number: Mapped[int] = mapped_column(Integer, nullable=False)
    resource_title: Mapped[str | None] = mapped_column(Text, nullable=True)
    author_login: Mapped[str | None] = mapped_column(Text, nullable=True)
    files_changed: Mapped[list[str] | None] = mapped_column(ARRAY(Text), nullable=True)
    lines_added: Mapped[int | None] = mapped_column(Integer, nullable=True)
    lines_deleted: Mapped[int | None] = mapped_column(Integer, nullable=True)
    story_points: Mapped[int | None] = mapped_column(Integer, nullable=True)
    assignee_login: Mapped[str | None] = mapped_column(Text, nullable=True)
    payload: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    __table_args__ = (
        Index("pr_events_repo_idx", "repo_full_name"),
        Index("pr_events_building_idx", "building_id"),
        Index("pr_events_received_idx", "received_at"),
    )


# ---------- finding_events (Nemesis detector persist) ----------


class FindingEvent(Base):
    __tablename__ = "finding_events"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    finding_id: Mapped[str] = mapped_column(Text, nullable=False)
    scan_run_id: Mapped[str] = mapped_column(Text, nullable=False)
    building_id: Mapped[str] = mapped_column(Text, nullable=False)
    file_path: Mapped[str] = mapped_column(Text, nullable=False)
    line_start: Mapped[int] = mapped_column(Integer, nullable=False)
    line_end: Mapped[int] = mapped_column(Integer, nullable=False)
    category: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[str] = mapped_column(Text, nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    suggested_fix: Mapped[str | None] = mapped_column(Text, nullable=True)
    cvss_vector: Mapped[str | None] = mapped_column(Text, nullable=True)
    cvss_base_score: Mapped[float | None] = mapped_column(Numeric(3, 1), nullable=True)
    exploit_pattern: Mapped[str | None] = mapped_column(Text, nullable=True)
    repo_full_name: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(Text, nullable=False, default="open")
    linked_issue_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    detected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    __table_args__ = (
        UniqueConstraint("finding_id", "scan_run_id", name="uq_finding_scan"),
        Index("finding_events_building_idx", "building_id"),
        Index("finding_events_repo_idx", "repo_full_name"),
        Index("finding_events_severity_idx", "severity"),
        Index("finding_events_status_idx", "status"),
    )


# ---------- drift_log (Nemesis spec-drift persist) ----------


class DriftLog(Base):
    __tablename__ = "drift_log"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    drift_id: Mapped[str] = mapped_column(Text, nullable=False)
    pattern: Mapped[str] = mapped_column(Text, nullable=False)
    pattern_label: Mapped[str] = mapped_column(Text, nullable=False)
    repo_full_name: Mapped[str] = mapped_column(Text, nullable=False)
    affected_resource: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[str] = mapped_column(Text, nullable=False)
    evidence: Mapped[dict] = mapped_column(JSONB, nullable=False)
    scan_run_id: Mapped[str] = mapped_column(Text, nullable=False)
    detected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    __table_args__ = (
        UniqueConstraint("drift_id", "scan_run_id", name="uq_drift_scan"),
        Index("drift_log_repo_idx", "repo_full_name"),
        Index("drift_log_pattern_idx", "pattern"),
    )


# ---------- proposals (Pandora refactor proposal persist) ----------


class Proposal(Base):
    __tablename__ = "proposals"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    proposal_id: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    user_intent: Mapped[str] = mapped_column(Text, nullable=False)
    openspec_change_path: Mapped[str] = mapped_column(Text, nullable=False)
    repo_full_name: Mapped[str] = mapped_column(Text, nullable=False)
    author_user_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True
    )
    stage: Mapped[str] = mapped_column(Text, nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    affected_files: Mapped[list[str] | None] = mapped_column(ARRAY(Text), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    __table_args__ = (
        Index("proposals_repo_idx", "repo_full_name"),
        Index("proposals_stage_idx", "stage"),
    )


# ---------- simulation_events (Pandora simulation stage persist) ----------


class SimulationEvent(Base):
    __tablename__ = "simulation_events"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    simulation_id: Mapped[str] = mapped_column(Text, nullable=False)
    stage: Mapped[str] = mapped_column(Text, nullable=False)
    payload: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    __table_args__ = (
        Index("simulation_events_simulation_idx", "simulation_id"),
        Index("simulation_events_timestamp_idx", "timestamp"),
    )


# ---------- llm_call_log (Triton + Pandora + all LLM consumers cost track) ----------


class LLMCallLog(Base):
    __tablename__ = "llm_call_log"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    call_id: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    worker: Mapped[str] = mapped_column(Text, nullable=False)
    simulation_id: Mapped[str | None] = mapped_column(Text, nullable=True)
    resident_id: Mapped[str | None] = mapped_column(Text, nullable=True)
    model_used: Mapped[str] = mapped_column(Text, nullable=False)
    thinking_mode: Mapped[str] = mapped_column(Text, nullable=False)
    cache_hit: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    canned_hit: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    input_tokens: Mapped[int] = mapped_column(Integer, nullable=False)
    output_tokens: Mapped[int] = mapped_column(Integer, nullable=False)
    cost_estimate_usd: Mapped[float] = mapped_column(Numeric(10, 6), nullable=False)
    latency_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    __table_args__ = (
        Index("llm_call_log_worker_idx", "worker"),
        Index("llm_call_log_timestamp_idx", "timestamp"),
        Index("llm_call_log_resident_idx", "resident_id"),
    )


# ---------- semantic_cache_embeddings (Triton optional persist) ----------


class SemanticCacheEmbedding(Base):
    __tablename__ = "semantic_cache_embeddings"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    cache_key: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    prompt_hash: Mapped[str] = mapped_column(Text, nullable=False)
    embedding: Mapped[list[float] | None] = mapped_column(JSONB, nullable=True)
    response_text: Mapped[str] = mapped_column(Text, nullable=False)
    model_used: Mapped[str] = mapped_column(Text, nullable=False)
    hit_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    last_hit_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index("semantic_cache_prompt_hash_idx", "prompt_hash"),
    )


__all__ = [
    "Base",
    "User",
    "PREvent",
    "FindingEvent",
    "DriftLog",
    "Proposal",
    "SimulationEvent",
    "LLMCallLog",
    "SemanticCacheEmbedding",
]


def utcnow() -> datetime:
    """Helper for callers building rows manually."""
    return datetime.now(timezone.utc)
