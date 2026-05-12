"""users + pr_events tables

Revision ID: 001_users_pr_events
Revises:
Create Date: 2026-05-12 22:10:00.000000

Schema verbatim per `_meta/contracts/hades-to-demeter.md` lines 145-180.
"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "001_users_pr_events"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("github_id", sa.BigInteger, nullable=False, unique=True),
        sa.Column("github_login", sa.Text, nullable=False),
        sa.Column("avatar_url", sa.Text, nullable=True),
        sa.Column("encrypted_access_token", sa.Text, nullable=False),
        sa.Column("scopes", postgresql.ARRAY(sa.Text), nullable=False),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    op.create_table(
        "pr_events",
        sa.Column("id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("event_type", sa.Text, nullable=False),
        sa.Column("delivery_id", sa.Text, unique=True, nullable=False),
        sa.Column("building_id", sa.Text, nullable=True),
        sa.Column("repo_full_name", sa.Text, nullable=False),
        sa.Column("resource_number", sa.Integer, nullable=False),
        sa.Column("resource_title", sa.Text, nullable=True),
        sa.Column("author_login", sa.Text, nullable=True),
        sa.Column("files_changed", postgresql.ARRAY(sa.Text), nullable=True),
        sa.Column("lines_added", sa.Integer, nullable=True),
        sa.Column("lines_deleted", sa.Integer, nullable=True),
        sa.Column("story_points", sa.Integer, nullable=True),
        sa.Column("assignee_login", sa.Text, nullable=True),
        sa.Column("payload", postgresql.JSONB, nullable=True),
        sa.Column("received_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("pr_events_repo_idx", "pr_events", ["repo_full_name"])
    op.create_index("pr_events_building_idx", "pr_events", ["building_id"])
    op.create_index("pr_events_received_idx", "pr_events", ["received_at"])


def downgrade() -> None:
    op.drop_index("pr_events_received_idx", table_name="pr_events")
    op.drop_index("pr_events_building_idx", table_name="pr_events")
    op.drop_index("pr_events_repo_idx", table_name="pr_events")
    op.drop_table("pr_events")
    op.drop_table("users")
