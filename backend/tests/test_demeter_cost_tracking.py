"""Cost tracking aggregation tests (Demeter Wave 3).

Verifies normalizers + threshold constants without requiring Postgres.
"""
from __future__ import annotations

from app.services.cost_tracking import (
    HARD_HALT_THRESHOLD_USD,
    SOFT_WARN_THRESHOLD_USD,
    _normalize_model,
    _normalize_resident,
    _normalize_worker,
)


def test_normalize_worker_known() -> None:
    assert _normalize_worker("pandora") == "pandora"
    assert _normalize_worker("nemesis") == "nemesis"
    assert _normalize_worker("triton-chat") == "triton-chat"


def test_normalize_worker_unknown_falls_back() -> None:
    assert _normalize_worker("triton-mystery") == "triton-residents"
    assert _normalize_worker("unknown") == "triton-residents"


def test_normalize_model_flash_alias() -> None:
    assert _normalize_model("V4-Flash") == "V4-Flash"
    assert _normalize_model("deepseek-v4-flash") == "deepseek-v4-flash"
    assert _normalize_model("some-flash-variant") == "deepseek-v4-flash"


def test_normalize_model_pro_alias() -> None:
    assert _normalize_model("V4-Pro") == "V4-Pro"
    assert _normalize_model("deepseek-v4-pro") == "deepseek-v4-pro"
    assert _normalize_model("v4-pro-thinking") == "deepseek-v4-pro"


def test_normalize_resident_known() -> None:
    assert _normalize_resident("Athena") == "Athena"
    assert _normalize_resident("athena") == "Athena"
    assert _normalize_resident(None) is None


def test_normalize_resident_unknown() -> None:
    assert _normalize_resident("unknown") is None


def test_threshold_constants() -> None:
    """Per PRD Section 18.8: Hafiz $5 budget; soft warn $4.50, hard halt $4.90."""
    assert SOFT_WARN_THRESHOLD_USD == 4.50
    assert HARD_HALT_THRESHOLD_USD == 4.90
    assert HARD_HALT_THRESHOLD_USD < 5.0
    assert SOFT_WARN_THRESHOLD_USD < HARD_HALT_THRESHOLD_USD
