"""finding_events + drift_log tables

Revision ID: 002_finding_drift
Revises: 001_users_pr_events
Create Date: 2026-05-12 22:11:00.000000

Schema verbatim per `_meta/contracts/nemesis-to-demeter.md` lines 156-202.
"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "002_finding_drift"
down_revision: Union[str, Sequence[str], None] = "001_users_pr_events"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "finding_events",
        sa.Column("id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("finding_id", sa.Text, nullable=False),
        sa.Column("scan_run_id", sa.Text, nullable=False),
        sa.Column("building_id", sa.Text, nullable=False),
        sa.Column("file_path", sa.Text, nullable=False),
        sa.Column("line_start", sa.Integer, nullable=False),
        sa.Column("line_end", sa.Integer, nullable=False),
        sa.Column("category", sa.Text, nullable=False),
        sa.Column("severity", sa.Text, nullable=False),
        sa.Column("title", sa.Text, nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("suggested_fix", sa.Text, nullable=True),
        sa.Column("cvss_vector", sa.Text, nullable=True),
        sa.Column("cvss_base_score", sa.Numeric(3, 1), nullable=True),
        sa.Column("exploit_pattern", sa.Text, nullable=True),
        sa.Column("repo_full_name", sa.Text, nullable=False),
        sa.Column(
            "status",
            sa.Text,
            nullable=False,
            server_default=sa.text("'open'"),
        ),
        sa.Column("linked_issue_number", sa.Integer, nullable=True),
        sa.Column("detected_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint("finding_id", "scan_run_id", name="uq_finding_scan"),
    )
    op.create_index("finding_events_building_idx", "finding_events", ["building_id"])
    op.create_index("finding_events_repo_idx", "finding_events", ["repo_full_name"])
    op.create_index("finding_events_severity_idx", "finding_events", ["severity"])
    op.create_index("finding_events_status_idx", "finding_events", ["status"])

    op.create_table(
        "drift_log",
        sa.Column("id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("drift_id", sa.Text, nullable=False),
        sa.Column("pattern", sa.Text, nullable=False),
        sa.Column("pattern_label", sa.Text, nullable=False),
        sa.Column("repo_full_name", sa.Text, nullable=False),
        sa.Column("affected_resource", sa.Text, nullable=False),
        sa.Column("severity", sa.Text, nullable=False),
        sa.Column("evidence", postgresql.JSONB, nullable=False),
        sa.Column("scan_run_id", sa.Text, nullable=False),
        sa.Column("detected_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint("drift_id", "scan_run_id", name="uq_drift_scan"),
    )
    op.create_index("drift_log_repo_idx", "drift_log", ["repo_full_name"])
    op.create_index("drift_log_pattern_idx", "drift_log", ["pattern"])


def downgrade() -> None:
    op.drop_index("drift_log_pattern_idx", table_name="drift_log")
    op.drop_index("drift_log_repo_idx", table_name="drift_log")
    op.drop_table("drift_log")
    op.drop_index("finding_events_status_idx", table_name="finding_events")
    op.drop_index("finding_events_severity_idx", table_name="finding_events")
    op.drop_index("finding_events_repo_idx", table_name="finding_events")
    op.drop_index("finding_events_building_idx", table_name="finding_events")
    op.drop_table("finding_events")
