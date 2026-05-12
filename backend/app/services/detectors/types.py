"""Nemesis detector types.

Schemas match Pythia contracts verbatim:
- nemesis-to-demeter.md FindingPersist + DriftEventPersist (5-enum kebab-case category)
- nemesis-to-asclepius.md FindingEvent + 5-enum Severity LOCKED
- triton-to-nemesis.md CVSSScore consumer pattern

5-enum Severity LOCKED: critical | high | medium | low | info (Asclepius store).
5-enum FindingCategory LOCKED kebab-case: hardcoded-secret | outdated-dependency
| missing-auth | unsafe-sql | complex-untested.
5-enum SpecDriftPattern LOCKED PRD Section 11.3: A | B | C | D | E (Lock 4).
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


Severity = Literal["critical", "high", "medium", "low", "info"]

FindingCategory = Literal[
    "hardcoded-secret",
    "outdated-dependency",
    "missing-auth",
    "unsafe-sql",
    "complex-untested",
]

ApolloDetectorId = Literal[
    "secrets",
    "outdated_deps",
    "missing_auth",
    "unsafe_sql",
    "complex_untested",
]

SpecDriftPattern = Literal["A", "B", "C", "D", "E"]

DETECTOR_TO_CATEGORY: dict[ApolloDetectorId, FindingCategory] = {
    "secrets": "hardcoded-secret",
    "outdated_deps": "outdated-dependency",
    "missing_auth": "missing-auth",
    "unsafe_sql": "unsafe-sql",
    "complex_untested": "complex-untested",
}

SECURITY_CATEGORIES: frozenset[FindingCategory] = frozenset(
    {"hardcoded-secret", "missing-auth", "unsafe-sql"}
)

PATTERN_LABELS: dict[SpecDriftPattern, str] = {
    "A": "Stale closed issue",
    "B": "Closed without merge",
    "C": "Spec-implementation lag",
    "D": "Reopened cycle",
    "E": "OpenSpec drift",
}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


class ApolloFinding(BaseModel):
    """Internal Apollo detector output before persist + WebSocket publish."""

    model_config = ConfigDict(extra="forbid")

    id: str
    detector_id: ApolloDetectorId
    category: FindingCategory
    severity: Severity
    title: str
    description: str
    file_path: str
    line_start: int = Field(ge=1)
    line_end: int = Field(ge=1)
    code_snippet: str | None = None
    suggested_fix: str | None = None
    cvss_vector: str | None = None
    cvss_base_score: float | None = None
    exploit_pattern: str | None = None
    cve_reference: str | None = None
    detected_at: str = Field(default_factory=_now_iso)
    repo_full_name: str = ""
    building_id: str = ""


class CVSSScore(BaseModel):
    """Argus CVSS scoring result per triton-to-nemesis.md."""

    model_config = ConfigDict(extra="forbid")

    vector: str
    base_score: float = Field(ge=0.0, le=10.0)
    exploit_pattern: str
    mitigation: str
    references: list[str] = Field(default_factory=list)


class FindingPersist(BaseModel):
    """Demeter persist payload for finding_events table.

    Per _meta/contracts/nemesis-to-demeter.md line 26.
    """

    model_config = ConfigDict(extra="forbid")

    finding_id: str
    building_id: str
    file_path: str
    line_start: int = Field(ge=1)
    line_end: int = Field(ge=1)
    category: FindingCategory
    severity: Severity
    title: str
    description: str
    suggested_fix: str
    cvss_vector: str | None = None
    cvss_base_score: float | None = None
    exploit_pattern: str | None = None
    repo_full_name: str
    scan_run_id: str
    detected_at: str


class DriftEvent(BaseModel):
    """Internal spec-drift detector output before persist."""

    model_config = ConfigDict(extra="forbid")

    id: str
    pattern: SpecDriftPattern
    pattern_label: str
    severity: Severity
    file_paths: list[str] = Field(default_factory=list)
    issue_id: int | None = None
    pr_number: int | None = None
    description: str
    evidence: dict[str, Any] = Field(default_factory=dict)
    detected_at: str = Field(default_factory=_now_iso)
    repo_full_name: str = ""


class DriftEventPersist(BaseModel):
    """Demeter persist payload for drift_log table.

    Per _meta/contracts/nemesis-to-demeter.md line 53.
    """

    model_config = ConfigDict(extra="forbid")

    drift_id: str
    pattern: SpecDriftPattern
    pattern_label: str
    repo_full_name: str
    affected_resource: str
    severity: Severity
    evidence: dict[str, Any]
    scan_run_id: str
    detected_at: str


FindingEventType = Literal[
    "finding.detected",
    "finding.resolved",
    "finding.ticketed",
    "finding.snoozed",
    "scan.started",
    "scan.completed",
]


class FindingEvent(BaseModel):
    """WebSocket payload Asclepius consumes via /api/ws/finding-events.

    Per _meta/contracts/nemesis-to-asclepius.md line 33. Field names use camelCase
    on the JSON wire (Asclepius TypeScript consumer), Pydantic aliases produce
    the right output.
    """

    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    type: FindingEventType
    repo_full_name: str = Field(alias="repoFullName")
    scan_run_id: str = Field(alias="scanRunId")
    finding: dict[str, Any] | None = None
    scan_summary: dict[str, Any] | None = Field(default=None, alias="scanSummary")
    timestamp: str = Field(default_factory=_now_iso)


CycleLabel = Literal[
    "stub-cycle-1",
    "full-cycle-2",
    "full-cycle-3",
    "full-cycle-4",
    "full-cycle-5",
]


class ScanResult(BaseModel):
    """Dispatcher output summary."""

    model_config = ConfigDict(extra="forbid")

    scan_run_id: str
    repo_full_name: str
    apollo_findings: list[ApolloFinding]
    drift_events: list[DriftEvent]
    apollo_count_by_detector: dict[ApolloDetectorId, int]
    drift_count_by_pattern: dict[SpecDriftPattern, int]
    duration_ms: int
    cycle: CycleLabel = "stub-cycle-1"
