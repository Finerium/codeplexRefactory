"""Demeter persist adapter for finding_events + drift_log tables.

Demeter Wave 3 cycle 2 owns the real SQL impl. Nemesis cycle 1 ships a buffered
in-memory adapter that satisfies the persist contract so dispatcher smoke can
verify end-to-end. The adapter also calls through to the real DemeterService
when the consumer worker has installed it via `set_demeter_service`.

Per _meta/contracts/nemesis-to-demeter.md.
"""
from __future__ import annotations

import logging
from typing import Any

from app.services.detectors.types import DriftEventPersist, FindingPersist

log = logging.getLogger("nemesis.demeter_adapter")


class DemeterAdapter:
    """Wraps Demeter persist methods + maintains diagnostic buffer.

    Real persist methods (`persist_finding`, `persist_drift_event`) are defined
    on Demeter Wave 3 cycle 2. Until they ship, this adapter buffers payloads
    in memory + logs them so tests can assert payload structure. When the
    methods become available on the real service via duck-typing, the adapter
    delegates AND buffers.
    """

    def __init__(self, real_demeter: Any | None = None) -> None:
        self._real = real_demeter
        self._is_stub = real_demeter is None or not (
            hasattr(real_demeter, "persist_finding")
            and hasattr(real_demeter, "persist_drift_event")
        )
        self._buffered_findings: list[FindingPersist] = []
        self._buffered_drift: list[DriftEventPersist] = []

    @property
    def is_stub(self) -> bool:
        return self._is_stub

    @property
    def buffered_findings(self) -> list[FindingPersist]:
        return list(self._buffered_findings)

    @property
    def buffered_drift(self) -> list[DriftEventPersist]:
        return list(self._buffered_drift)

    def clear_buffers(self) -> None:
        self._buffered_findings.clear()
        self._buffered_drift.clear()

    async def persist_finding(self, finding: FindingPersist) -> None:
        self._buffered_findings.append(finding)
        if self._real is not None and hasattr(self._real, "persist_finding"):
            try:
                await self._real.persist_finding(finding)
                return
            except Exception as exc:  # pragma: no cover - defensive
                log.warning("Demeter persist_finding failed; buffered: %s", exc)
        log.info(
            "[adapter persist_finding] id=%s category=%s severity=%s",
            finding.finding_id,
            finding.category,
            finding.severity,
        )

    async def persist_drift_event(self, drift: DriftEventPersist) -> None:
        self._buffered_drift.append(drift)
        if self._real is not None and hasattr(self._real, "persist_drift_event"):
            try:
                await self._real.persist_drift_event(drift)
                return
            except Exception as exc:  # pragma: no cover - defensive
                log.warning("Demeter persist_drift_event failed; buffered: %s", exc)
        log.info(
            "[adapter persist_drift_event] id=%s pattern=%s severity=%s",
            drift.drift_id,
            drift.pattern,
            drift.severity,
        )


_singleton: DemeterAdapter | None = None


def get_demeter_adapter(force_real: bool = False) -> DemeterAdapter:
    """Singleton accessor.

    Tries `app.services.demeter_service.get_demeter_service()`. Falls back to
    stub when import fails.
    """
    global _singleton
    if _singleton is not None:
        return _singleton

    real = None
    try:
        from app.services.demeter_service import get_demeter_service

        real = get_demeter_service()
    except (ImportError, AttributeError):
        if force_real:
            raise
        real = None

    _singleton = DemeterAdapter(real_demeter=real)
    return _singleton


def reset_demeter_adapter() -> None:
    """Test helper: reset singleton so next call rebinds."""
    global _singleton
    _singleton = None
