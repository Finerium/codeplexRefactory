"""cycle_time_aggregate + lead_time_aggregate + velocity_per_sprint + drift_summary_view + repo_status_view materialized views

Revision ID: 004_dashboard_views
Revises: 003_proposals_simulation_llm
Create Date: 2026-05-12 22:13:00.000000

Per `_meta/contracts/demeter-to-selene.md` lines 100-165.
Dashboard query layer for Selene.
"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op

revision: str = "004_dashboard_views"
down_revision: Union[str, Sequence[str], None] = "003_proposals_simulation_llm"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Velocity per sprint
    op.execute(
        """
        CREATE MATERIALIZED VIEW velocity_per_sprint AS
        SELECT
            repo_full_name,
            payload->>'milestone_title' AS sprint_label,
            COALESCE(SUM(story_points), 0)::INTEGER AS points_completed,
            MAX(received_at) AS end_date
        FROM pr_events
        WHERE event_type = 'issue.closed'
          AND payload ? 'milestone_title'
        GROUP BY repo_full_name, payload->>'milestone_title'
        WITH NO DATA;
        """
    )
    op.execute(
        "CREATE INDEX velocity_per_sprint_repo_idx ON velocity_per_sprint(repo_full_name);"
    )

    # Cycle time aggregate (PR opened -> merged median per day)
    op.execute(
        """
        CREATE MATERIALIZED VIEW cycle_time_aggregate AS
        SELECT
            repo_full_name,
            DATE_TRUNC('day', merged_at) AS day,
            percentile_cont(0.5) WITHIN GROUP (
                ORDER BY EXTRACT(EPOCH FROM (merged_at - opened_at)) / 86400.0
            ) AS median_days
        FROM (
            SELECT
                repo_full_name,
                resource_number,
                MIN(CASE WHEN event_type = 'pr.opened' THEN received_at END) AS opened_at,
                MAX(CASE WHEN event_type = 'pr.merged' THEN received_at END) AS merged_at
            FROM pr_events
            GROUP BY repo_full_name, resource_number
        ) AS pr_lifecycle
        WHERE merged_at IS NOT NULL AND opened_at IS NOT NULL
        GROUP BY repo_full_name, DATE_TRUNC('day', merged_at)
        WITH NO DATA;
        """
    )
    op.execute(
        "CREATE INDEX cycle_time_aggregate_repo_idx ON cycle_time_aggregate(repo_full_name);"
    )

    # Lead time aggregate (issue opened -> PR merged median per day)
    op.execute(
        """
        CREATE MATERIALIZED VIEW lead_time_aggregate AS
        SELECT
            repo_full_name,
            DATE_TRUNC('day', merged_at) AS day,
            percentile_cont(0.5) WITHIN GROUP (
                ORDER BY EXTRACT(EPOCH FROM (merged_at - issue_opened_at)) / 86400.0
            ) AS median_days
        FROM (
            SELECT
                p.repo_full_name,
                p.resource_number,
                MIN(CASE WHEN i.event_type = 'issue.opened' THEN i.received_at END) AS issue_opened_at,
                MAX(CASE WHEN p.event_type = 'pr.merged' THEN p.received_at END) AS merged_at
            FROM pr_events p
            LEFT JOIN pr_events i
              ON i.repo_full_name = p.repo_full_name
             AND i.resource_number = p.resource_number
             AND i.event_type = 'issue.opened'
            WHERE p.event_type = 'pr.merged'
            GROUP BY p.repo_full_name, p.resource_number
        ) AS lead_lifecycle
        WHERE merged_at IS NOT NULL AND issue_opened_at IS NOT NULL
        GROUP BY repo_full_name, DATE_TRUNC('day', merged_at)
        WITH NO DATA;
        """
    )
    op.execute(
        "CREATE INDEX lead_time_aggregate_repo_idx ON lead_time_aggregate(repo_full_name);"
    )

    # Drift summary
    op.execute(
        """
        CREATE MATERIALIZED VIEW drift_summary_view AS
        SELECT
            repo_full_name,
            pattern,
            pattern_label,
            COUNT(*) FILTER (WHERE COALESCE(evidence->>'resolved', 'false') = 'false') AS open_count,
            COUNT(*) AS total_count,
            CASE
                WHEN COUNT(*) = 0 THEN 0.0
                ELSE COUNT(*) FILTER (WHERE evidence->>'resolved' = 'true')::float / COUNT(*)
            END AS resolution_rate,
            MAX(severity) AS max_severity
        FROM drift_log
        GROUP BY repo_full_name, pattern, pattern_label
        WITH NO DATA;
        """
    )
    op.execute(
        "CREATE INDEX drift_summary_view_repo_idx ON drift_summary_view(repo_full_name);"
    )

    # Repo status (cross-repo rail)
    op.execute(
        """
        CREATE MATERIALIZED VIEW repo_status_view AS
        SELECT
            repo_full_name,
            repo_full_name AS label,
            COUNT(*) FILTER (
                WHERE event_type = 'pr.opened' AND received_at > NOW() - INTERVAL '7 days'
            )::INTEGER AS open_prs,
            COUNT(*) FILTER (
                WHERE event_type = 'issue.opened' AND received_at > NOW() - INTERVAL '7 days'
            )::INTEGER AS open_issues,
            MAX(received_at) AS last_event_at
        FROM pr_events
        GROUP BY repo_full_name
        WITH NO DATA;
        """
    )
    op.execute(
        "CREATE INDEX repo_status_view_repo_idx ON repo_status_view(repo_full_name);"
    )


def downgrade() -> None:
    op.execute("DROP MATERIALIZED VIEW IF EXISTS repo_status_view;")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS drift_summary_view;")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS lead_time_aggregate;")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS cycle_time_aggregate;")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS velocity_per_sprint;")
