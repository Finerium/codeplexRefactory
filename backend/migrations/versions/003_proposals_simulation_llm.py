"""proposals + simulation_events + llm_call_log + semantic_cache_embeddings

Revision ID: 003_proposals_simulation_llm
Revises: 002_finding_drift
Create Date: 2026-05-12 22:12:00.000000

Schema verbatim per `_meta/contracts/pandora-to-demeter.md` lines 138-191.
"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "003_proposals_simulation_llm"
down_revision: Union[str, Sequence[str], None] = "002_finding_drift"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "proposals",
        sa.Column("id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("proposal_id", sa.Text, unique=True, nullable=False),
        sa.Column("user_intent", sa.Text, nullable=False),
        sa.Column("openspec_change_path", sa.Text, nullable=False),
        sa.Column("repo_full_name", sa.Text, nullable=False),
        sa.Column(
            "author_user_id",
            sa.Integer,
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("stage", sa.Text, nullable=False),
        sa.Column("title", sa.Text, nullable=False),
        sa.Column("summary", sa.Text, nullable=True),
        sa.Column("affected_files", postgresql.ARRAY(sa.Text), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("proposals_repo_idx", "proposals", ["repo_full_name"])
    op.create_index("proposals_stage_idx", "proposals", ["stage"])

    op.create_table(
        "simulation_events",
        sa.Column("id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("simulation_id", sa.Text, nullable=False),
        sa.Column("stage", sa.Text, nullable=False),
        sa.Column("payload", postgresql.JSONB, nullable=True),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index(
        "simulation_events_simulation_idx", "simulation_events", ["simulation_id"]
    )
    op.create_index(
        "simulation_events_timestamp_idx", "simulation_events", ["timestamp"]
    )

    op.create_table(
        "llm_call_log",
        sa.Column("id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("call_id", sa.Text, unique=True, nullable=False),
        sa.Column("worker", sa.Text, nullable=False),
        sa.Column("simulation_id", sa.Text, nullable=True),
        sa.Column("resident_id", sa.Text, nullable=True),
        sa.Column("model_used", sa.Text, nullable=False),
        sa.Column("thinking_mode", sa.Text, nullable=False),
        sa.Column(
            "cache_hit",
            sa.Boolean,
            nullable=False,
            server_default=sa.text("FALSE"),
        ),
        sa.Column(
            "canned_hit",
            sa.Boolean,
            nullable=False,
            server_default=sa.text("FALSE"),
        ),
        sa.Column("input_tokens", sa.Integer, nullable=False),
        sa.Column("output_tokens", sa.Integer, nullable=False),
        sa.Column("cost_estimate_usd", sa.Numeric(10, 6), nullable=False),
        sa.Column("latency_ms", sa.Integer, nullable=True),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.Column("error", sa.Text, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("llm_call_log_worker_idx", "llm_call_log", ["worker"])
    op.create_index("llm_call_log_timestamp_idx", "llm_call_log", ["timestamp"])
    op.create_index("llm_call_log_resident_idx", "llm_call_log", ["resident_id"])

    op.create_table(
        "semantic_cache_embeddings",
        sa.Column("id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("cache_key", sa.Text, unique=True, nullable=False),
        sa.Column("prompt_hash", sa.Text, nullable=False),
        sa.Column("embedding", postgresql.JSONB, nullable=True),
        sa.Column("response_text", sa.Text, nullable=False),
        sa.Column("model_used", sa.Text, nullable=False),
        sa.Column(
            "hit_count",
            sa.Integer,
            nullable=False,
            server_default=sa.text("0"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("last_hit_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        "semantic_cache_prompt_hash_idx", "semantic_cache_embeddings", ["prompt_hash"]
    )


def downgrade() -> None:
    op.drop_index(
        "semantic_cache_prompt_hash_idx", table_name="semantic_cache_embeddings"
    )
    op.drop_table("semantic_cache_embeddings")
    op.drop_index("llm_call_log_resident_idx", table_name="llm_call_log")
    op.drop_index("llm_call_log_timestamp_idx", table_name="llm_call_log")
    op.drop_index("llm_call_log_worker_idx", table_name="llm_call_log")
    op.drop_table("llm_call_log")
    op.drop_index("simulation_events_timestamp_idx", table_name="simulation_events")
    op.drop_index("simulation_events_simulation_idx", table_name="simulation_events")
    op.drop_table("simulation_events")
    op.drop_index("proposals_stage_idx", table_name="proposals")
    op.drop_index("proposals_repo_idx", table_name="proposals")
    op.drop_table("proposals")
