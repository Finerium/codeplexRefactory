"""Dashboard query helper tests (Demeter Wave 3).

Verifies _briefing_template + _status_dot + _severity_clamp + _range_since
without requiring Postgres.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app.services.dashboard_query import (
    DashboardData,
    DriftSummary,
    RefactorProposal,
    _briefing_template,
    _range_since,
    _severity_clamp,
    _status_dot,
)


def test_status_dot_color_thresholds() -> None:
    assert _status_dot(0, 0) == "gray"
    assert _status_dot(3, 5) == "green"
    assert _status_dot(10, 15) == "yellow"
    assert _status_dot(30, 100) == "red"


def test_severity_clamp_valid() -> None:
    assert _severity_clamp("critical") == "critical"
    assert _severity_clamp("high") == "high"
    assert _severity_clamp("info") == "info"


def test_severity_clamp_invalid_falls_back() -> None:
    assert _severity_clamp("unknown") == "info"
    assert _severity_clamp(None) == "info"
    assert _severity_clamp(42) == "info"


def test_range_since_today() -> None:
    s = _range_since("today")
    now = datetime.now(timezone.utc)
    assert (now - s) <= timedelta(days=2)
    assert (now - s) >= timedelta(hours=23)


def test_range_since_sprint() -> None:
    s = _range_since("sprint")
    now = datetime.now(timezone.utc)
    assert (now - s) <= timedelta(days=15)


def test_range_since_quarter() -> None:
    s = _range_since("quarter")
    now = datetime.now(timezone.utc)
    assert (now - s) <= timedelta(days=91)


def test_briefing_template_empty() -> None:
    msg = _briefing_template("S1", [], [])
    assert "Quiet sprint" in msg


def test_briefing_template_with_drift() -> None:
    drift = DriftSummary(
        pattern="A",
        pattern_label="drift A",
        count=3,
        severity="medium",
        resolution_rate=0.0,
    )
    msg = _briefing_template("S1", [drift], [])
    assert "S1" in msg
    assert "3 drift" in msg


def test_dashboard_data_serializes() -> None:
    """DashboardData round-trips through Pydantic."""
    data = DashboardData(
        briefing="test",
        kpis=[],
        velocity=[],
        burndown=[],
        milestones=[],
        contributors=[],
        drifts=[],
        refactor_proposals=[],
        repos=[],
        current_sprint="S1",
        last_refresh="2026-05-12T00:00:00+00:00",
    )
    dumped = data.model_dump()
    assert dumped["briefing"] == "test"
    assert dumped["current_sprint"] == "S1"
