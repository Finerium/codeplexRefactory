"""ownership_distribution + commit_frequency_per_building materialized views

Revision ID: 005_activity_views
Revises: 004_dashboard_views
Create Date: 2026-05-12 22:14:00.000000

Per `_meta/contracts/demeter-to-boreas.md` lines 95-154.
Activity query layer for Boreas.
"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op

revision: str = "005_activity_views"
down_revision: Union[str, Sequence[str], None] = "004_dashboard_views"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Commit frequency per building per day
    op.execute(
        """
        CREATE MATERIALIZED VIEW commit_frequency_per_building AS
        SELECT
            repo_full_name,
            building_id,
            DATE_TRUNC('day', received_at) AS date,
            COUNT(*)::INTEGER AS commit_count,
            MAX(received_at) AS last_commit_at
        FROM pr_events
        WHERE event_type = 'pr.merged'
          AND building_id IS NOT NULL
        GROUP BY repo_full_name, building_id, DATE_TRUNC('day', received_at)
        WITH NO DATA;
        """
    )
    op.execute(
        "CREATE INDEX commit_freq_repo_building_idx ON commit_frequency_per_building(repo_full_name, building_id);"
    )
    op.execute(
        "CREATE INDEX commit_freq_date_idx ON commit_frequency_per_building(date);"
    )

    # Ownership distribution (last 6 months blame proxy)
    op.execute(
        """
        CREATE MATERIALIZED VIEW ownership_distribution AS
        WITH author_contributions AS (
            SELECT
                repo_full_name,
                building_id,
                author_login,
                COALESCE(SUM(lines_added + lines_deleted), 0) AS total_lines_changed
            FROM pr_events
            WHERE event_type = 'pr.merged'
              AND received_at > NOW() - INTERVAL '6 months'
              AND building_id IS NOT NULL
              AND author_login IS NOT NULL
            GROUP BY repo_full_name, building_id, author_login
        ),
        ranked AS (
            SELECT
                repo_full_name,
                building_id,
                author_login,
                total_lines_changed,
                SUM(total_lines_changed) OVER (PARTITION BY repo_full_name, building_id) AS building_total,
                ROW_NUMBER() OVER (
                    PARTITION BY repo_full_name, building_id
                    ORDER BY total_lines_changed DESC
                ) AS rank
            FROM author_contributions
        )
        SELECT
            repo_full_name,
            building_id,
            MAX(CASE WHEN rank = 1 THEN author_login END) AS primary_owner_login,
            MAX(
                CASE WHEN rank = 1
                THEN total_lines_changed::float / NULLIF(building_total, 0) * 100
                END
            ) AS primary_owner_share_percent,
            JSONB_AGG(
                JSONB_BUILD_OBJECT(
                    'github_login', author_login,
                    'share_percent', total_lines_changed::float / NULLIF(building_total, 0) * 100
                ) ORDER BY total_lines_changed DESC
            ) AS contributors
        FROM ranked
        GROUP BY repo_full_name, building_id
        WITH NO DATA;
        """
    )
    op.execute(
        "CREATE INDEX ownership_repo_idx ON ownership_distribution(repo_full_name);"
    )


def downgrade() -> None:
    op.execute("DROP MATERIALIZED VIEW IF EXISTS ownership_distribution;")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS commit_frequency_per_building;")
