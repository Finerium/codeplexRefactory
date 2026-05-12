# Nemesis Wave 3 Cycle Plan: 11 Detector Suite Implementation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship 11 detector (5 Apollo + Argus CVSS enrich + 5 spec-drift A-E) producing FindingPersist + DriftEventPersist persisted via Demeter + WebSocket push to Asclepius Wave 2 glow trigger.

**Architecture:** 5-cycle progressive: cycle 1 stub-and-sync ship (all 11 signatures + dispatcher + mock returns labeled), cycle 2-3 Apollo real impl (gitleaks subprocess + OSV API + tree-sitter framework queries + radon cyclomatic), cycle 4-5 spec-drift A-E real impl + smoke test verify. Hades + Triton consumed via adapter layer with cycle 1 STUB labels swapped for real client cycle 2+.

**Tech Stack:** Python 3.12 async + Pydantic v2 + tree-sitter-language-pack 11 grammar lazy load + httpx for OSV API + subprocess for gitleaks + git log + radon for cyclomatic + Demeter session for persist + WebSocket publisher for Asclepius.

**Capacity budget**: ~6-7 jam total Nemesis domain, 5 cycle x ~80 min each.

---

## File Structure (all files under `backend/app/services/detectors/`)

| File | Responsibility | Cycle |
|---|---|---|
| `__init__.py` | Registry + module exports | 1 |
| `types.py` | Pydantic schemas (ApolloFinding, DriftEvent, FindingPersist, DriftEventPersist, Severity enum, FindingCategory enum, ApolloDetectorId enum, SpecDriftPattern enum) | 1 |
| `dispatcher.py` | `run_full_scan` orchestrator: parse repo via Hades adapter, run all 5 Apollo + 5 drift detectors, enrich via Argus security, persist via Demeter, publish WebSocket | 1 |
| `secrets.py` | Apollo detector 1: gitleaks subprocess + entropy 3.5-4.5 + `.gitleaks.toml` | 1 stub + 2 full |
| `outdated_deps.py` | Apollo detector 2: parse 7 manifest format + OSV API query | 1 stub + 2 full |
| `missing_auth.py` | Apollo detector 3: tree-sitter query 8 framework | 1 stub + 2 full |
| `unsafe_sql.py` | Apollo detector 4: regex + tree-sitter string concat in SQL context | 1 stub + 3 full |
| `complex_untested.py` | Apollo detector 5: radon cyclomatic + parse import for test coverage stub | 1 stub + 3 full |
| `argus_security.py` | CVSS scoring engine + Triton client adapter + mitigation cite | 1 stub + 3 full |
| `drift_a_stale_closed.py` | Pattern A: issue closed greater-than 6 months + file edited after | 1 stub + 4 full |
| `drift_b_closed_without_merge.py` | Pattern B: closed issue without linked merged PR | 1 stub + 4 full |
| `drift_c_spec_impl_lag.py` | Pattern C: positive gap close_at to last_commit_at | 1 stub + 4 full |
| `drift_d_reopened_cycle.py` | Pattern D: reopened event count greater-than-or-equal-to 2 | 1 stub + 5 full |
| `drift_e_openspec_drift.py` | Pattern E: commit touches archived spec file without `opsx:` prefix | 1 stub + 5 full |
| `adapters/hades_adapter.py` | Parser client adapter: cycle 1 STUB returns canned ParsedRepo, cycle 2+ imports real `app.parsers.get_parser_service` | 1 |
| `adapters/triton_adapter.py` | LLM client adapter: cycle 1 STUB returns canned Argus response, cycle 2+ imports real `app.services.llm_client.get_llm_client` | 1 |
| `adapters/demeter_adapter.py` | Persist client adapter: cycle 1 STUB logs to JSON, cycle 2+ imports real `app.services.demeter_service.get_demeter_service` | 1 |
| `adapters/ws_publisher_adapter.py` | WebSocket publisher adapter: cycle 1 STUB logs events, cycle 2+ imports real `app.services.event_bus.publish_event` | 1 |
| `queries/missing_auth_express.scm` | Tree-sitter query Express | 2 |
| `queries/missing_auth_fastapi.scm` | Tree-sitter query FastAPI | 2 |
| `queries/missing_auth_flask.scm` | Tree-sitter query Flask | 2 |
| `queries/missing_auth_django.scm` | Tree-sitter query Django | 2 |
| `queries/missing_auth_gin.scm` | Tree-sitter query Gin Go | 3 |
| `queries/missing_auth_echo.scm` | Tree-sitter query Echo Go | 3 |
| `queries/missing_auth_spring.scm` | Tree-sitter query Spring Java | 3 |
| `queries/missing_auth_actix.scm` | Tree-sitter query Actix Rust | 3 |
| `queries/unsafe_sql.scm` | Tree-sitter query SQL concat | 3 |
| `.gitleaks.toml` | Custom gitleaks config (entropy 3.5-4.5 thresholds) | 2 |

Tests: `backend/tests/test_detectors_smoke.py` (one file consolidating 11 detector smoke + dispatcher integration + WebSocket publish + persist verify).

---

## Cycle 1: Stub + types + dispatcher + adapters (~80 min)

### Task 1.1: Initialize backend Python package + types module

**Files:**
- Create: `backend/__init__.py` (empty)
- Create: `backend/app/__init__.py` (empty)
- Create: `backend/app/services/__init__.py` (empty)
- Create: `backend/app/services/detectors/__init__.py`
- Create: `backend/app/services/detectors/types.py`

- [ ] **Step 1: Run `STAMP=$(date +%Y%m%d-%H%M) && echo $STAMP` to capture actual timestamp**

- [ ] **Step 2: Create `backend/app/services/detectors/types.py` with full Pydantic schema**

Match `nemesis-to-demeter.md` line 26-69 + `nemesis-to-asclepius.md` line 36-60 verbatim 5-enum Severity + 5-enum kebab-case FindingCategory. Schema content:

```python
"""Nemesis detector types. Schemas match Pythia contracts verbatim:
- nemesis-to-demeter.md FindingPersist + DriftEventPersist
- nemesis-to-asclepius.md FindingEvent
- triton-to-nemesis.md CVSSScore consumer pattern
"""
from __future__ import annotations
from typing import Literal, Optional
from datetime import datetime
from pydantic import BaseModel, Field

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

SECURITY_CATEGORIES: frozenset[FindingCategory] = frozenset({
    "hardcoded-secret", "missing-auth", "unsafe-sql",
})


class ApolloFinding(BaseModel):
    """Internal finding model produced by Apollo detector before persist."""
    id: str
    detector_id: ApolloDetectorId
    category: FindingCategory
    severity: Severity
    title: str
    description: str
    file_path: str
    line_start: int
    line_end: int
    code_snippet: Optional[str] = None
    suggested_fix: Optional[str] = None
    cvss_vector: Optional[str] = None
    cvss_base_score: Optional[float] = None
    exploit_pattern: Optional[str] = None
    cve_reference: Optional[str] = None
    detected_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    repo_full_name: str = ""
    building_id: str = ""


class CVSSScore(BaseModel):
    """Argus CVSS scoring result per triton-to-nemesis.md."""
    vector: str
    base_score: float
    exploit_pattern: str
    mitigation: str
    references: list[str] = Field(default_factory=list)


class FindingPersist(BaseModel):
    """Demeter persist payload per nemesis-to-demeter.md line 26."""
    finding_id: str
    building_id: str
    file_path: str
    line_start: int
    line_end: int
    category: FindingCategory
    severity: Severity
    title: str
    description: str
    suggested_fix: str
    cvss_vector: Optional[str] = None
    cvss_base_score: Optional[float] = None
    exploit_pattern: Optional[str] = None
    repo_full_name: str
    scan_run_id: str
    detected_at: str


class DriftEvent(BaseModel):
    """Internal drift event model produced by spec-drift detector before persist."""
    id: str
    pattern: SpecDriftPattern
    pattern_label: str
    severity: Severity
    file_paths: list[str] = Field(default_factory=list)
    issue_id: Optional[int] = None
    pr_number: Optional[int] = None
    description: str
    evidence: dict = Field(default_factory=dict)
    detected_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    repo_full_name: str = ""


class DriftEventPersist(BaseModel):
    """Demeter persist payload per nemesis-to-demeter.md line 53."""
    drift_id: str
    pattern: SpecDriftPattern
    pattern_label: str
    repo_full_name: str
    affected_resource: str
    severity: Severity
    evidence: dict
    scan_run_id: str
    detected_at: str


class FindingEvent(BaseModel):
    """WebSocket payload per nemesis-to-asclepius.md line 33."""
    type: Literal[
        "finding.detected",
        "finding.resolved",
        "finding.ticketed",
        "finding.snoozed",
        "scan.started",
        "scan.completed",
    ]
    repoFullName: str
    scanRunId: str
    finding: Optional[dict] = None
    scanSummary: Optional[dict] = None
    timestamp: str


class ScanResult(BaseModel):
    """Dispatcher output summary."""
    scan_run_id: str
    repo_full_name: str
    apollo_findings: list[ApolloFinding]
    drift_events: list[DriftEvent]
    apollo_count_by_detector: dict[ApolloDetectorId, int]
    drift_count_by_pattern: dict[SpecDriftPattern, int]
    duration_ms: int
    cycle: Literal["stub-cycle-1", "full-cycle-2", "full-cycle-3", "full-cycle-4", "full-cycle-5"] = "stub-cycle-1"


PATTERN_LABELS: dict[SpecDriftPattern, str] = {
    "A": "Stale closed issue",
    "B": "Closed without merge",
    "C": "Spec-implementation lag",
    "D": "Reopened cycle",
    "E": "OpenSpec drift",
}
```

- [ ] **Step 3: Create `backend/app/services/detectors/__init__.py` exporting types**

```python
"""Nemesis 11 detector suite. See _meta/decisions/nemesis_drift_algo.md."""
from .types import (
    Severity, FindingCategory, ApolloDetectorId, SpecDriftPattern,
    ApolloFinding, CVSSScore, FindingPersist,
    DriftEvent, DriftEventPersist, FindingEvent, ScanResult,
    DETECTOR_TO_CATEGORY, SECURITY_CATEGORIES, PATTERN_LABELS,
)

__all__ = [
    "Severity", "FindingCategory", "ApolloDetectorId", "SpecDriftPattern",
    "ApolloFinding", "CVSSScore", "FindingPersist",
    "DriftEvent", "DriftEventPersist", "FindingEvent", "ScanResult",
    "DETECTOR_TO_CATEGORY", "SECURITY_CATEGORIES", "PATTERN_LABELS",
]
```

- [ ] **Step 4: Verify schema imports**

Run: `cd /Users/ghaisan/Documents/codeplexRefactory/backend && python -c "from app.services.detectors import ApolloFinding, DriftEvent, ScanResult; print('schemas ok')"`
Expected: `schemas ok`

### Task 1.2: Author adapter layer (Hades + Triton + Demeter + WS)

**Files:**
- Create: `backend/app/services/detectors/adapters/__init__.py`
- Create: `backend/app/services/detectors/adapters/hades_adapter.py`
- Create: `backend/app/services/detectors/adapters/triton_adapter.py`
- Create: `backend/app/services/detectors/adapters/demeter_adapter.py`
- Create: `backend/app/services/detectors/adapters/ws_publisher_adapter.py`

- [ ] **Step 1: `adapters/__init__.py`**

```python
from .hades_adapter import get_parser_adapter, ParserAdapter
from .triton_adapter import get_triton_adapter, TritonAdapter
from .demeter_adapter import get_demeter_adapter, DemeterAdapter
from .ws_publisher_adapter import get_ws_adapter, WSPublisherAdapter

__all__ = [
    "get_parser_adapter", "ParserAdapter",
    "get_triton_adapter", "TritonAdapter",
    "get_demeter_adapter", "DemeterAdapter",
    "get_ws_adapter", "WSPublisherAdapter",
]
```

- [ ] **Step 2: `adapters/hades_adapter.py` with cycle 1 STUB labeled**

```python
"""Hades parser client adapter.

[STUB cycle-1: Hades cycle 1 stub not shipped yet, returns canned ParsedRepo].
Cycle 2+: swap to real `from app.parsers import get_parser_service`.
Per _meta/contracts/hades-to-nemesis.md ParserService interface.
"""
from __future__ import annotations
from pathlib import Path
from dataclasses import dataclass, field


@dataclass
class StubParsedSymbol:
    name: str
    kind: str
    file_path: str
    line_start: int
    line_end: int
    column_start: int = 0
    column_end: int = 0
    decorators: list[str] = field(default_factory=list)


@dataclass
class StubParsedFile:
    file_path: str
    language: str
    line_count: int
    symbols: list[StubParsedSymbol] = field(default_factory=list)
    imports: list[str] = field(default_factory=list)
    parse_error: str | None = None


@dataclass
class StubParsedRepo:
    repo_root: str
    files: list[StubParsedFile] = field(default_factory=list)
    languages_used: list[str] = field(default_factory=list)
    stats: dict[str, int] = field(default_factory=dict)


class ParserAdapter:
    """Adapter to Hades ParserService.

    Cycle 1: STUB returns canned ParsedRepo for NodeGoat smoke fixture.
    Cycle 2+: delegates to real `get_parser_service()`.
    """

    def __init__(self, real_parser=None) -> None:
        self._real = real_parser
        self._is_stub = real_parser is None

    async def parse_repo(self, repo_root: Path, exclude_globs: list[str] | None = None):
        if self._is_stub:
            return _canned_nodegoat_repo(repo_root)
        return await self._real.parse_repo(repo_root, exclude_globs)

    async def parse_file(self, file_path: Path):
        if self._is_stub:
            return _canned_file(str(file_path))
        return await self._real.parse_file(file_path)

    async def query_tree(self, file_path: Path, query_source: str) -> list[dict]:
        if self._is_stub:
            return []
        return await self._real.query_tree(file_path, query_source)

    async def find_callsites(self, repo_root: Path, symbol_name: str, language: str | None = None):
        if self._is_stub:
            return []
        return await self._real.find_callsites(repo_root, symbol_name, language)

    @property
    def is_stub(self) -> bool:
        return self._is_stub


def _canned_nodegoat_repo(repo_root: Path) -> StubParsedRepo:
    """[MOCK cycle-1] canned NodeGoat-shaped repo for smoke test."""
    files = [
        StubParsedFile(
            file_path="app/config/config.js",
            language="javascript",
            line_count=42,
            symbols=[StubParsedSymbol(name="dbUrl", kind="variable",
                                      file_path="app/config/config.js",
                                      line_start=12, line_end=12)],
            imports=["dotenv"],
        ),
        StubParsedFile(
            file_path="app/routes/index.js",
            language="javascript",
            line_count=180,
            symbols=[StubParsedSymbol(name="adminRoute", kind="function",
                                      file_path="app/routes/index.js",
                                      line_start=87, line_end=110)],
            imports=["express", "passport"],
        ),
        StubParsedFile(
            file_path="app/data/allocations-dao.js",
            language="javascript",
            line_count=95,
            symbols=[StubParsedSymbol(name="searchAllocations", kind="function",
                                      file_path="app/data/allocations-dao.js",
                                      line_start=34, line_end=58)],
            imports=["mongodb"],
        ),
        StubParsedFile(
            file_path="package.json",
            language="javascript",
            line_count=50,
            imports=["jquery", "express", "mongodb"],
        ),
        StubParsedFile(
            file_path="app/controllers/profile.js",
            language="javascript",
            line_count=320,
            symbols=[StubParsedSymbol(name="profileController", kind="function",
                                      file_path="app/controllers/profile.js",
                                      line_start=1, line_end=320)],
            imports=["express", "mongodb"],
        ),
    ]
    return StubParsedRepo(
        repo_root=str(repo_root),
        files=files,
        languages_used=["javascript"],
        stats={"total_files": len(files), "total_loc": sum(f.line_count for f in files),
               "parse_errors": 0, "js_count": len(files)},
    )


def _canned_file(file_path: str) -> StubParsedFile:
    return StubParsedFile(file_path=file_path, language="javascript", line_count=0)


_singleton: ParserAdapter | None = None


def get_parser_adapter(force_real: bool = False) -> ParserAdapter:
    global _singleton
    if _singleton is not None:
        return _singleton
    real = None
    if force_real:
        try:
            from app.parsers import get_parser_service
            real = get_parser_service()
        except ImportError:
            real = None
    _singleton = ParserAdapter(real_parser=real)
    return _singleton
```

- [ ] **Step 3: `adapters/triton_adapter.py` with cycle 1 STUB**

```python
"""Triton LLM client adapter for Argus security CVSS scoring.

[STUB cycle-1: Triton cycle 1 not shipped, returns canned CVSS for security categories].
Cycle 2+: swap to real `from app.services.llm_client import get_llm_client`.
Per _meta/contracts/triton-to-nemesis.md.
"""
from __future__ import annotations
from ..types import CVSSScore, FindingCategory


_CANNED_CVSS_BY_CATEGORY: dict[FindingCategory, CVSSScore] = {
    "hardcoded-secret": CVSSScore(
        vector="CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
        base_score=9.8,
        exploit_pattern="CWE-798: Use of Hard-coded Credentials",
        mitigation="Rotate the credential, move to environment variable or secrets manager (HashiCorp Vault, AWS Secrets Manager). Add gitleaks pre-commit hook.",
        references=["https://cwe.mitre.org/data/definitions/798.html"],
    ),
    "missing-auth": CVSSScore(
        vector="CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N",
        base_score=9.1,
        exploit_pattern="CWE-306: Missing Authentication for Critical Function",
        mitigation="Add authentication middleware to route. For Express use passport.authenticate, for FastAPI use Depends(get_current_user).",
        references=["https://cwe.mitre.org/data/definitions/306.html"],
    ),
    "unsafe-sql": CVSSScore(
        vector="CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
        base_score=9.8,
        exploit_pattern="CWE-89: Improper Neutralization of Special Elements used in an SQL Command",
        mitigation="Use parameterized queries or prepared statements. Never concatenate user input into SQL strings.",
        references=["https://cwe.mitre.org/data/definitions/89.html"],
    ),
    "outdated-dependency": CVSSScore(
        vector="CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:L/I:L/A:N",
        base_score=4.7,
        exploit_pattern="CWE-1104: Use of Unmaintained Third Party Components",
        mitigation="Upgrade to patched version per OSV advisory.",
        references=[],
    ),
    "complex-untested": CVSSScore(
        vector="CVSS:3.1/AV:N/AC:H/PR:L/UI:N/S:U/C:L/I:L/A:N",
        base_score=3.4,
        exploit_pattern="CWE-1120: Excessive Code Complexity",
        mitigation="Refactor function into smaller units. Add unit test coverage.",
        references=["https://cwe.mitre.org/data/definitions/1120.html"],
    ),
}


class TritonAdapter:
    """Adapter to Triton LLMClient for Argus persona V4-Flash think low."""

    def __init__(self, real_llm=None) -> None:
        self._real = real_llm
        self._is_stub = real_llm is None

    async def argus_cvss_score(self, category: FindingCategory, title: str, description: str) -> CVSSScore:
        """Returns CVSS score for a security finding via Argus persona."""
        if self._is_stub:
            base = _CANNED_CVSS_BY_CATEGORY.get(category)
            if base is not None:
                return base
            return CVSSScore(
                vector="CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:L",
                base_score=5.0,
                exploit_pattern="CWE-Other: see references",
                mitigation="Manual review required.",
                references=[],
            )
        from ..types import CVSSScore as _CVSSScore
        prompt = (
            f"Assess the following security finding. Return CVSS 3.1 vector, base score, "
            f"CWE id with description, mitigation steps, and references.\n\n"
            f"Category: {category}\nTitle: {title}\nDescription: {description}\n"
        )
        response = await self._real.call(
            messages=[{"role": "user", "content": prompt}],
            prefer_pro=False, thinking_mode="low", max_tokens=400,
        )
        return _parse_cvss_response(response.content)

    @property
    def is_stub(self) -> bool:
        return self._is_stub


def _parse_cvss_response(content: str) -> CVSSScore:
    """Cycle 2+ JSON parse with regex fallback. Cycle 1 unused (stub mode)."""
    import json, re
    try:
        data = json.loads(content)
        return CVSSScore(
            vector=data.get("cvss_vector", "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:L"),
            base_score=float(data.get("cvss_base_score", 5.0)),
            exploit_pattern=data.get("exploit_pattern", "CWE-Other"),
            mitigation=data.get("mitigation", ""),
            references=data.get("references", []),
        )
    except (json.JSONDecodeError, ValueError, TypeError):
        vec_match = re.search(r"CVSS:3\.1/[A-Z:/]+", content)
        score_match = re.search(r"base[_\s]score[:\s]+([0-9]+\.?[0-9]*)", content, re.IGNORECASE)
        return CVSSScore(
            vector=vec_match.group(0) if vec_match else "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:L",
            base_score=float(score_match.group(1)) if score_match else 5.0,
            exploit_pattern="CWE-Other (parse fallback)",
            mitigation=content[:200],
            references=[],
        )


_singleton: TritonAdapter | None = None


def get_triton_adapter(force_real: bool = False) -> TritonAdapter:
    global _singleton
    if _singleton is not None:
        return _singleton
    real = None
    if force_real:
        try:
            from app.services.llm_client import get_llm_client
            real = get_llm_client()
        except ImportError:
            real = None
    _singleton = TritonAdapter(real_llm=real)
    return _singleton
```

- [ ] **Step 4: `adapters/demeter_adapter.py` with cycle 1 STUB**

```python
"""Demeter persist adapter for finding_events + drift_log tables.

[STUB cycle-1: Demeter cycle 1 not shipped, persists in-memory + logs to stdout].
Cycle 2+: swap to real `from app.services.demeter_service import get_demeter_service`.
Per _meta/contracts/nemesis-to-demeter.md.
"""
from __future__ import annotations
import logging
from ..types import FindingPersist, DriftEventPersist


log = logging.getLogger("nemesis.demeter_adapter")


class DemeterAdapter:
    def __init__(self, real_demeter=None) -> None:
        self._real = real_demeter
        self._is_stub = real_demeter is None
        self._stub_findings: list[FindingPersist] = []
        self._stub_drift: list[DriftEventPersist] = []

    async def persist_finding(self, finding: FindingPersist) -> None:
        if self._is_stub:
            self._stub_findings.append(finding)
            log.info("[STUB persist_finding] %s", finding.finding_id)
            return
        await self._real.persist_finding(finding)

    async def persist_drift_event(self, drift: DriftEventPersist) -> None:
        if self._is_stub:
            self._stub_drift.append(drift)
            log.info("[STUB persist_drift_event] %s pattern=%s", drift.drift_id, drift.pattern)
            return
        await self._real.persist_drift_event(drift)

    @property
    def stub_findings(self) -> list[FindingPersist]:
        return list(self._stub_findings)

    @property
    def stub_drift(self) -> list[DriftEventPersist]:
        return list(self._stub_drift)

    @property
    def is_stub(self) -> bool:
        return self._is_stub


_singleton: DemeterAdapter | None = None


def get_demeter_adapter(force_real: bool = False) -> DemeterAdapter:
    global _singleton
    if _singleton is not None:
        return _singleton
    real = None
    if force_real:
        try:
            from app.services.demeter_service import get_demeter_service
            real = get_demeter_service()
        except ImportError:
            real = None
    _singleton = DemeterAdapter(real_demeter=real)
    return _singleton
```

- [ ] **Step 5: `adapters/ws_publisher_adapter.py` with cycle 1 STUB**

```python
"""WebSocket /api/ws/finding-events publisher adapter for Asclepius glow trigger.

[STUB cycle-1: Hades event_bus cycle 1 not shipped, captures published events in-memory].
Cycle 2+: swap to real `from app.services.event_bus import publish_event`.
Per _meta/contracts/nemesis-to-asclepius.md.
"""
from __future__ import annotations
import logging
from ..types import FindingEvent


log = logging.getLogger("nemesis.ws_publisher")


class WSPublisherAdapter:
    def __init__(self, real_publisher=None) -> None:
        self._real = real_publisher
        self._is_stub = real_publisher is None
        self._published: list[FindingEvent] = []

    async def publish(self, event: FindingEvent) -> None:
        if self._is_stub:
            self._published.append(event)
            log.info("[STUB ws.publish] %s repo=%s", event.type, event.repoFullName)
            return
        await self._real(event.dict())

    @property
    def published(self) -> list[FindingEvent]:
        return list(self._published)

    @property
    def is_stub(self) -> bool:
        return self._is_stub


_singleton: WSPublisherAdapter | None = None


def get_ws_adapter(force_real: bool = False) -> WSPublisherAdapter:
    global _singleton
    if _singleton is not None:
        return _singleton
    real = None
    if force_real:
        try:
            from app.services.event_bus import publish_event
            real = publish_event
        except ImportError:
            real = None
    _singleton = WSPublisherAdapter(real_publisher=real)
    return _singleton
```

- [ ] **Step 6: Verify adapter imports**

Run: `cd /Users/ghaisan/Documents/codeplexRefactory/backend && python -c "from app.services.detectors.adapters import get_parser_adapter, get_triton_adapter, get_demeter_adapter, get_ws_adapter; print('adapters ok')"`
Expected: `adapters ok`

### Task 1.3: 11 detector signature stubs (5 Apollo + Argus + 5 drift)

**Files:** 11 new detector files under `backend/app/services/detectors/`.

- [ ] **Step 1: `secrets.py` stub signature**

```python
"""Apollo detector 1: hardcoded secrets via gitleaks subprocess + entropy 3.5-4.5.

[STUB cycle-1: returns 1 canned secret finding for NodeGoat config.js line 12].
Cycle 2: real gitleaks subprocess + entropy check + .gitleaks.toml profile.
"""
from __future__ import annotations
from pathlib import Path
from .types import ApolloFinding, ApolloDetectorId, FindingCategory


DETECTOR_ID: ApolloDetectorId = "secrets"
CATEGORY: FindingCategory = "hardcoded-secret"


async def detect(repo_root: Path, parsed_repo, repo_full_name: str) -> list[ApolloFinding]:
    """[STUB cycle-1] returns 1 canned hardcoded secret finding for smoke test."""
    return [
        ApolloFinding(
            id=f"secrets-stub-{repo_full_name.replace('/', '-')}-1",
            detector_id=DETECTOR_ID,
            category=CATEGORY,
            severity="critical",
            title="Hardcoded database connection string detected",
            description="[STUB cycle-1] gitleaks regex flagged hardcoded credential in config.js line 12. Real impl ships cycle 2 via gitleaks subprocess.",
            file_path="app/config/config.js",
            line_start=12,
            line_end=12,
            code_snippet='const dbUrl = "mongodb://admin:p@ssw0rd@localhost:27017/nodegoat";',
            suggested_fix="Move credential to .env or secrets manager. Add gitleaks pre-commit hook.",
            repo_full_name=repo_full_name,
            building_id="app/config/config.js",
        ),
    ]
```

- [ ] **Step 2: `outdated_deps.py` stub signature**

```python
"""Apollo detector 2: outdated dependencies via OSV API public CVE lookup.

[STUB cycle-1: returns 1 canned outdated dependency finding for jquery 1.4 in NodeGoat].
Cycle 2: real OSV API query for 7 manifest format.
"""
from __future__ import annotations
from pathlib import Path
from .types import ApolloFinding, ApolloDetectorId, FindingCategory


DETECTOR_ID: ApolloDetectorId = "outdated_deps"
CATEGORY: FindingCategory = "outdated-dependency"


async def detect(repo_root: Path, parsed_repo, repo_full_name: str) -> list[ApolloFinding]:
    """[STUB cycle-1] returns 1 canned outdated dep finding for smoke test."""
    return [
        ApolloFinding(
            id=f"outdated_deps-stub-{repo_full_name.replace('/', '-')}-1",
            detector_id=DETECTOR_ID,
            category=CATEGORY,
            severity="high",
            title="Outdated jquery 1.4.0 with known XSS CVE",
            description="[STUB cycle-1] OSV API check flagged jquery@1.4.0 GHSA-2pqj-h3vj-pqgw XSS vulnerability. Real impl ships cycle 2.",
            file_path="package.json",
            line_start=18,
            line_end=18,
            code_snippet='"jquery": "1.4.0"',
            suggested_fix="Upgrade to jquery@3.7.1 or later per OSV advisory.",
            cve_reference="GHSA-2pqj-h3vj-pqgw",
            repo_full_name=repo_full_name,
            building_id="package.json",
        ),
    ]
```

- [ ] **Step 3: `missing_auth.py` stub signature**

```python
"""Apollo detector 3: missing auth via tree-sitter per-framework query (8 framework).

[STUB cycle-1: returns 1 canned missing auth finding for admin route in NodeGoat].
Cycle 2: real tree-sitter query Express + FastAPI + Flask + Django.
Cycle 3: real tree-sitter query Gin + Echo + Spring + Actix.
"""
from __future__ import annotations
from pathlib import Path
from .types import ApolloFinding, ApolloDetectorId, FindingCategory


DETECTOR_ID: ApolloDetectorId = "missing_auth"
CATEGORY: FindingCategory = "missing-auth"


async def detect(repo_root: Path, parsed_repo, repo_full_name: str) -> list[ApolloFinding]:
    """[STUB cycle-1] returns 1 canned missing auth finding for smoke test."""
    return [
        ApolloFinding(
            id=f"missing_auth-stub-{repo_full_name.replace('/', '-')}-1",
            detector_id=DETECTOR_ID,
            category=CATEGORY,
            severity="critical",
            title="Missing authentication on /admin route",
            description="[STUB cycle-1] Express route /admin lacks passport.authenticate middleware. Real impl ships cycle 2 via tree-sitter Express query.",
            file_path="app/routes/index.js",
            line_start=87,
            line_end=110,
            code_snippet="app.get('/admin', (req, res) => { /* no auth middleware */ });",
            suggested_fix="Add passport.authenticate('jwt', { session: false }) middleware.",
            repo_full_name=repo_full_name,
            building_id="app/routes/index.js",
        ),
    ]
```

- [ ] **Step 4: `unsafe_sql.py` stub signature**

```python
"""Apollo detector 4: unsafe SQL via regex + tree-sitter string concat in SQL context.

[STUB cycle-1: returns 1 canned SQL injection finding for NodeGoat allocations-dao].
Cycle 3: real regex + tree-sitter query.
"""
from __future__ import annotations
from pathlib import Path
from .types import ApolloFinding, ApolloDetectorId, FindingCategory


DETECTOR_ID: ApolloDetectorId = "unsafe_sql"
CATEGORY: FindingCategory = "unsafe-sql"


async def detect(repo_root: Path, parsed_repo, repo_full_name: str) -> list[ApolloFinding]:
    """[STUB cycle-1] returns 1 canned SQL injection finding for smoke test."""
    return [
        ApolloFinding(
            id=f"unsafe_sql-stub-{repo_full_name.replace('/', '-')}-1",
            detector_id=DETECTOR_ID,
            category=CATEGORY,
            severity="critical",
            title="String concatenation in SQL query (SQL injection risk)",
            description="[STUB cycle-1] Raw string concatenation detected in db.query() call. Real impl ships cycle 3 via tree-sitter SQL context query.",
            file_path="app/data/allocations-dao.js",
            line_start=42,
            line_end=42,
            code_snippet='db.query("SELECT * FROM allocations WHERE userId = " + userId);',
            suggested_fix="Use parameterized query: db.query('SELECT * FROM allocations WHERE userId = ?', [userId]).",
            repo_full_name=repo_full_name,
            building_id="app/data/allocations-dao.js",
        ),
    ]
```

- [ ] **Step 5: `complex_untested.py` stub signature**

```python
"""Apollo detector 5: complex untested via radon cyclomatic + parse import test coverage stub.

[STUB cycle-1: returns 1 canned complex untested finding for NodeGoat profile.js].
Cycle 3: real radon cyclomatic + test file co-located check.
"""
from __future__ import annotations
from pathlib import Path
from .types import ApolloFinding, ApolloDetectorId, FindingCategory


DETECTOR_ID: ApolloDetectorId = "complex_untested"
CATEGORY: FindingCategory = "complex-untested"


async def detect(repo_root: Path, parsed_repo, repo_full_name: str) -> list[ApolloFinding]:
    """[STUB cycle-1] returns 1 canned complex untested finding for smoke test."""
    return [
        ApolloFinding(
            id=f"complex_untested-stub-{repo_full_name.replace('/', '-')}-1",
            detector_id=DETECTOR_ID,
            category=CATEGORY,
            severity="medium",
            title="High cyclomatic complexity without test coverage (estimate 52)",
            description="[STUB cycle-1] profile.js cyclomatic complexity 52, no co-located test file. Real impl ships cycle 3 via radon.",
            file_path="app/controllers/profile.js",
            line_start=1,
            line_end=320,
            suggested_fix="Refactor into smaller functions. Add unit tests for branches.",
            repo_full_name=repo_full_name,
            building_id="app/controllers/profile.js",
        ),
    ]
```

- [ ] **Step 6: `argus_security.py` stub signature**

```python
"""Argus security CVSS scoring + exploit pattern + mitigation citation.

[STUB cycle-1: enriches security category findings via canned Triton adapter responses].
Cycle 3: real Triton LLM client call V4-Flash think low.
Per _meta/contracts/triton-to-nemesis.md.
"""
from __future__ import annotations
from .types import ApolloFinding, SECURITY_CATEGORIES
from .adapters import get_triton_adapter


async def enrich_findings(findings: list[ApolloFinding]) -> list[ApolloFinding]:
    """Enrich security-category findings with CVSS scoring."""
    triton = get_triton_adapter()
    enriched: list[ApolloFinding] = []
    for finding in findings:
        if finding.category not in SECURITY_CATEGORIES:
            enriched.append(finding)
            continue
        cvss = await triton.argus_cvss_score(
            category=finding.category, title=finding.title, description=finding.description,
        )
        finding.cvss_vector = cvss.vector
        finding.cvss_base_score = cvss.base_score
        finding.exploit_pattern = cvss.exploit_pattern
        if cvss.references:
            finding.cve_reference = cvss.references[0]
        finding.suggested_fix = (finding.suggested_fix or "") + f"\n\n[Argus mitigation] {cvss.mitigation}"
        enriched.append(finding)
    return enriched
```

- [ ] **Step 7: 5 drift detector stub signatures (one Write per file)**

`drift_a_stale_closed.py`:

```python
"""Pattern A: stale closed issue (closed greater-than 6 months, file edited after).

[STUB cycle-1: returns 1 canned Pattern A drift event].
Cycle 4: real impl via Demeter issues query + git log.
Per _meta/decisions/nemesis_drift_algo.md Pattern A.
"""
from __future__ import annotations
from pathlib import Path
from .types import DriftEvent, SpecDriftPattern, PATTERN_LABELS


PATTERN: SpecDriftPattern = "A"


async def detect(repo_root: Path, repo_full_name: str) -> list[DriftEvent]:
    """[STUB cycle-1] returns 1 canned Pattern A drift event for smoke test."""
    return [
        DriftEvent(
            id=f"drift-A-stub-{repo_full_name.replace('/', '-')}-1",
            pattern=PATTERN,
            pattern_label=PATTERN_LABELS[PATTERN],
            severity="medium",
            file_paths=["app/auth/oauth.ts"],
            issue_id=234,
            description="[STUB cycle-1] Issue #234 closed 8 months ago but app/auth/oauth.ts edited 12x in last 3 months. Real impl cycle 4.",
            evidence={"issue_id": 234, "closed_at": "2025-09-12T00:00:00Z",
                      "files": [{"path": "app/auth/oauth.ts", "edits_after_close": 12}]},
            repo_full_name=repo_full_name,
        ),
    ]
```

`drift_b_closed_without_merge.py`:

```python
"""Pattern B: issue closed without linked merged PR touching file.

[STUB cycle-1: returns 1 canned Pattern B drift event].
Cycle 4: real impl via Demeter PR query + closes regex.
Per _meta/decisions/nemesis_drift_algo.md Pattern B.
"""
from __future__ import annotations
from pathlib import Path
from .types import DriftEvent, SpecDriftPattern, PATTERN_LABELS


PATTERN: SpecDriftPattern = "B"


async def detect(repo_root: Path, repo_full_name: str) -> list[DriftEvent]:
    """[STUB cycle-1] returns 1 canned Pattern B drift event for smoke test."""
    return [
        DriftEvent(
            id=f"drift-B-stub-{repo_full_name.replace('/', '-')}-1",
            pattern=PATTERN,
            pattern_label=PATTERN_LABELS[PATTERN],
            severity="medium",
            file_paths=["app/notifications/email.ts"],
            issue_id=189,
            description="[STUB cycle-1] Issue #189 closed without linked PR. Spec orphan. Real impl cycle 4.",
            evidence={"issue_id": 189, "closed_at": "2025-12-01T00:00:00Z", "matched_prs": [],
                      "reason": "no_linked_pr_with_merge_and_file_touch"},
            repo_full_name=repo_full_name,
        ),
    ]
```

`drift_c_spec_impl_lag.py`:

```python
"""Pattern C: spec-implementation lag (positive gap close_at to last_commit).

[STUB cycle-1: returns 1 canned Pattern C drift event].
Cycle 4: real impl via Demeter issues + git log lag computation.
Per _meta/decisions/nemesis_drift_algo.md Pattern C.
"""
from __future__ import annotations
from pathlib import Path
from .types import DriftEvent, SpecDriftPattern, PATTERN_LABELS


PATTERN: SpecDriftPattern = "C"


async def detect(repo_root: Path, repo_full_name: str) -> list[DriftEvent]:
    """[STUB cycle-1] returns 1 canned Pattern C drift event for smoke test."""
    return [
        DriftEvent(
            id=f"drift-C-stub-{repo_full_name.replace('/', '-')}-1",
            pattern=PATTERN,
            pattern_label=PATTERN_LABELS[PATTERN],
            severity="medium",
            file_paths=["app/billing/invoice.ts"],
            issue_id=312,
            description="[STUB cycle-1] Issue #312 closed 4 months ago, app/billing/invoice.ts last commit 2 weeks ago (lag 105 days). Real impl cycle 4.",
            evidence={"issue_id": 312, "closed_at": "2026-01-12T00:00:00Z",
                      "latest_commit_at": "2026-04-28T00:00:00Z", "lag_days": 106},
            repo_full_name=repo_full_name,
        ),
    ]
```

`drift_d_reopened_cycle.py`:

```python
"""Pattern D: issue reopened greater-than-or-equal-to 2 times.

[STUB cycle-1: returns 1 canned Pattern D drift event].
Cycle 5: real impl via Demeter issue_events table reopen count.
Per _meta/decisions/nemesis_drift_algo.md Pattern D.
"""
from __future__ import annotations
from pathlib import Path
from .types import DriftEvent, SpecDriftPattern, PATTERN_LABELS


PATTERN: SpecDriftPattern = "D"


async def detect(repo_root: Path, repo_full_name: str) -> list[DriftEvent]:
    """[STUB cycle-1] returns 1 canned Pattern D drift event for smoke test."""
    return [
        DriftEvent(
            id=f"drift-D-stub-{repo_full_name.replace('/', '-')}-1",
            pattern=PATTERN,
            pattern_label=PATTERN_LABELS[PATTERN],
            severity="high",
            file_paths=["app/api/upload.ts"],
            issue_id=405,
            description="[STUB cycle-1] Issue #405 reopened 3 times. Spec keeps changing. Real impl cycle 5.",
            evidence={"issue_id": 405, "reopened_count": 3,
                      "reopened_at": ["2025-11-01T00:00:00Z", "2026-01-15T00:00:00Z", "2026-03-10T00:00:00Z"]},
            repo_full_name=repo_full_name,
        ),
    ]
```

`drift_e_openspec_drift.py`:

```python
"""Pattern E: commit touches archived spec file without opsx: prefix.

[STUB cycle-1: returns 1 canned Pattern E drift event].
Cycle 5: real impl via openspec/archive/ walk + git log + commit message regex.
Per _meta/decisions/nemesis_drift_algo.md Pattern E (Lock 4 LOCKED, AST-diff inferred algo).
"""
from __future__ import annotations
from pathlib import Path
from .types import DriftEvent, SpecDriftPattern, PATTERN_LABELS


PATTERN: SpecDriftPattern = "E"


async def detect(repo_root: Path, repo_full_name: str) -> list[DriftEvent]:
    """[STUB cycle-1] returns 1 canned Pattern E drift event for smoke test."""
    return [
        DriftEvent(
            id=f"drift-E-stub-{repo_full_name.replace('/', '-')}-1",
            pattern=PATTERN,
            pattern_label=PATTERN_LABELS[PATTERN],
            severity="high",
            file_paths=["app/auth/oauth.ts"],
            description="[STUB cycle-1] Commit abc123 touches archived spec file without opsx: prefix. Workflow-guard bypass. Real impl cycle 5.",
            evidence={"archived_change": "openspec/archive/2026-01-15/add-oauth-flow/",
                      "referenced_file": "app/auth/oauth.ts",
                      "bypass_commits": [{"sha": "abc123def456", "message": "fix: oauth token expiry",
                                          "author": "dev-bot", "committed_at": "2026-04-20T00:00:00Z"}]},
            repo_full_name=repo_full_name,
        ),
    ]
```

- [ ] **Step 8: Verify all 11 detector imports**

Run: `cd /Users/ghaisan/Documents/codeplexRefactory/backend && python -c "
from app.services.detectors import secrets, outdated_deps, missing_auth, unsafe_sql, complex_untested, argus_security
from app.services.detectors import drift_a_stale_closed, drift_b_closed_without_merge, drift_c_spec_impl_lag, drift_d_reopened_cycle, drift_e_openspec_drift
print('11 detector modules ok')
"`
Expected: `11 detector modules ok`

### Task 1.4: Dispatcher + WebSocket publish + persist orchestrator

**Files:**
- Create: `backend/app/services/detectors/dispatcher.py`

- [ ] **Step 1: `dispatcher.py` with run_full_scan orchestrator**

```python
"""Nemesis detector dispatcher. Orchestrates 5 Apollo + Argus enrich + 5 spec-drift detectors.

Pipeline:
1. Parse repo via Hades adapter (cycle 1 STUB returns canned ParsedRepo).
2. Run 5 Apollo detectors in parallel.
3. Argus enrich security-category findings via Triton adapter.
4. Run 5 spec-drift detectors in parallel.
5. Persist findings + drift events via Demeter adapter.
6. Publish FindingEvent (scan.started, finding.detected*, scan.completed) via WebSocket adapter.

Per _meta/contracts/nemesis-to-demeter.md + nemesis-to-asclepius.md.
"""
from __future__ import annotations
import asyncio
import hashlib
import time
from pathlib import Path
from datetime import datetime, timezone

from .types import (
    ApolloFinding, DriftEvent, FindingPersist, DriftEventPersist, FindingEvent,
    ScanResult, ApolloDetectorId, SpecDriftPattern, PATTERN_LABELS,
)
from .adapters import (
    get_parser_adapter, get_triton_adapter, get_demeter_adapter, get_ws_adapter,
)
from . import secrets as d_secrets
from . import outdated_deps as d_outdated
from . import missing_auth as d_auth
from . import unsafe_sql as d_sql
from . import complex_untested as d_complex
from . import argus_security
from . import drift_a_stale_closed as d_a
from . import drift_b_closed_without_merge as d_b
from . import drift_c_spec_impl_lag as d_c
from . import drift_d_reopened_cycle as d_d
from . import drift_e_openspec_drift as d_e


APOLLO_DETECTORS = [d_secrets, d_outdated, d_auth, d_sql, d_complex]
DRIFT_DETECTORS = [d_a, d_b, d_c, d_d, d_e]


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def generate_scan_run_id(repo_full_name: str) -> str:
    nonce = f"{repo_full_name}-{time.time_ns()}"
    return hashlib.sha256(nonce.encode()).hexdigest()[:16]


def _finding_to_persist(finding: ApolloFinding, scan_run_id: str) -> FindingPersist:
    return FindingPersist(
        finding_id=finding.id, building_id=finding.building_id,
        file_path=finding.file_path, line_start=finding.line_start, line_end=finding.line_end,
        category=finding.category, severity=finding.severity,
        title=finding.title, description=finding.description,
        suggested_fix=finding.suggested_fix or "",
        cvss_vector=finding.cvss_vector, cvss_base_score=finding.cvss_base_score,
        exploit_pattern=finding.exploit_pattern,
        repo_full_name=finding.repo_full_name,
        scan_run_id=scan_run_id, detected_at=finding.detected_at,
    )


def _drift_to_persist(drift: DriftEvent, scan_run_id: str) -> DriftEventPersist:
    affected = drift.file_paths[0] if drift.file_paths else (
        f"issue-{drift.issue_id}" if drift.issue_id is not None else "unknown"
    )
    return DriftEventPersist(
        drift_id=drift.id, pattern=drift.pattern, pattern_label=drift.pattern_label,
        repo_full_name=drift.repo_full_name, affected_resource=affected,
        severity=drift.severity, evidence=drift.evidence,
        scan_run_id=scan_run_id, detected_at=drift.detected_at,
    )


def _finding_to_event_dict(finding: ApolloFinding) -> dict:
    return {
        "id": finding.id, "buildingId": finding.building_id,
        "severity": finding.severity, "category": finding.category,
        "title": finding.title, "filePath": finding.file_path,
        "lineStart": finding.line_start, "lineEnd": finding.line_end,
    }


async def run_full_scan(repo_root: Path | str, repo_full_name: str) -> ScanResult:
    """Single-entry orchestrator. Returns ScanResult summary."""
    start = time.monotonic()
    scan_run_id = generate_scan_run_id(repo_full_name)
    parser = get_parser_adapter()
    demeter = get_demeter_adapter()
    ws = get_ws_adapter()
    repo_root_path = Path(repo_root) if not isinstance(repo_root, Path) else repo_root

    await ws.publish(FindingEvent(
        type="scan.started", repoFullName=repo_full_name,
        scanRunId=scan_run_id, timestamp=_now_iso(),
    ))

    parsed_repo = await parser.parse_repo(repo_root_path)

    apollo_results = await asyncio.gather(
        *[d.detect(repo_root_path, parsed_repo, repo_full_name) for d in APOLLO_DETECTORS],
        return_exceptions=False,
    )
    apollo_findings: list[ApolloFinding] = []
    apollo_by_detector: dict[ApolloDetectorId, int] = {}
    for detector_module, findings in zip(APOLLO_DETECTORS, apollo_results):
        apollo_findings.extend(findings)
        apollo_by_detector[detector_module.DETECTOR_ID] = len(findings)

    apollo_findings = await argus_security.enrich_findings(apollo_findings)

    drift_results = await asyncio.gather(
        *[d.detect(repo_root_path, repo_full_name) for d in DRIFT_DETECTORS],
        return_exceptions=False,
    )
    drift_events: list[DriftEvent] = []
    drift_by_pattern: dict[SpecDriftPattern, int] = {}
    for detector_module, events in zip(DRIFT_DETECTORS, drift_results):
        drift_events.extend(events)
        drift_by_pattern[detector_module.PATTERN] = len(events)

    for finding in apollo_findings:
        await demeter.persist_finding(_finding_to_persist(finding, scan_run_id))
        await ws.publish(FindingEvent(
            type="finding.detected", repoFullName=repo_full_name,
            scanRunId=scan_run_id, finding=_finding_to_event_dict(finding),
            timestamp=_now_iso(),
        ))

    for drift in drift_events:
        await demeter.persist_drift_event(_drift_to_persist(drift, scan_run_id))

    severity_counts = {s: 0 for s in ("critical", "high", "medium", "low", "info")}
    category_counts: dict[str, int] = {}
    for f in apollo_findings:
        severity_counts[f.severity] = severity_counts.get(f.severity, 0) + 1
        category_counts[f.category] = category_counts.get(f.category, 0) + 1

    duration_ms = int((time.monotonic() - start) * 1000)

    await ws.publish(FindingEvent(
        type="scan.completed", repoFullName=repo_full_name,
        scanRunId=scan_run_id,
        scanSummary={
            "totalFindings": len(apollo_findings),
            "bySeverity": severity_counts, "byCategory": category_counts,
            "durationMs": duration_ms,
        },
        timestamp=_now_iso(),
    ))

    return ScanResult(
        scan_run_id=scan_run_id, repo_full_name=repo_full_name,
        apollo_findings=apollo_findings, drift_events=drift_events,
        apollo_count_by_detector=apollo_by_detector,
        drift_count_by_pattern=drift_by_pattern,
        duration_ms=duration_ms, cycle="stub-cycle-1",
    )
```

- [ ] **Step 2: Verify dispatcher import**

Run: `cd /Users/ghaisan/Documents/codeplexRefactory/backend && python -c "from app.services.detectors.dispatcher import run_full_scan, generate_scan_run_id; print('dispatcher ok')"`
Expected: `dispatcher ok`

### Task 1.5: Cycle 1 smoke test (10/10 stub finding trigger)

**Files:**
- Create: `backend/tests/__init__.py` (empty)
- Create: `backend/tests/test_detectors_smoke.py`
- Create: `backend/pyproject.toml` (minimal: pytest + pytest-asyncio + pydantic v2)

- [ ] **Step 1: `pyproject.toml` minimal**

```toml
[project]
name = "codeplex-chronicle-backend"
version = "0.1.0"
description = "Codeplex Chronicle backend (Wave 3)"
requires-python = ">=3.12"
dependencies = [
    "pydantic>=2.0",
    "httpx>=0.27",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "pytest-asyncio>=0.23",
]

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
pythonpath = ["."]
```

- [ ] **Step 2: `tests/test_detectors_smoke.py` cycle 1 smoke**

```python
"""Nemesis cycle 1 stub smoke test.

Verifies: dispatcher runs end-to-end on stub adapters, returns ScanResult with
5/5 Apollo + 5/5 spec-drift stub findings, WebSocket publishes events,
Demeter persist stub captures findings.

Cycle 2-5 will replace stub-mode assertions with real NodeGoat fork + demo dataset.
"""
from __future__ import annotations
import pytest
from pathlib import Path

from app.services.detectors.dispatcher import run_full_scan
from app.services.detectors.adapters import (
    get_parser_adapter, get_demeter_adapter, get_ws_adapter, get_triton_adapter,
)


pytestmark = pytest.mark.asyncio


REPO_FULL = "duopoly/codeplex-demo-nodegoat"


async def test_dispatcher_runs_end_to_end():
    result = await run_full_scan(Path("/tmp/stub-nodegoat"), REPO_FULL)
    assert result.scan_run_id
    assert result.repo_full_name == REPO_FULL
    assert result.cycle == "stub-cycle-1"


async def test_5_apollo_detectors_trigger():
    result = await run_full_scan(Path("/tmp/stub-nodegoat"), REPO_FULL + "-apollo")
    assert result.apollo_count_by_detector == {
        "secrets": 1, "outdated_deps": 1, "missing_auth": 1,
        "unsafe_sql": 1, "complex_untested": 1,
    }
    assert len(result.apollo_findings) == 5


async def test_5_drift_patterns_trigger():
    result = await run_full_scan(Path("/tmp/stub-nodegoat"), REPO_FULL + "-drift")
    assert result.drift_count_by_pattern == {"A": 1, "B": 1, "C": 1, "D": 1, "E": 1}
    assert len(result.drift_events) == 5


async def test_argus_enriches_security_findings():
    result = await run_full_scan(Path("/tmp/stub-nodegoat"), REPO_FULL + "-argus")
    security = [f for f in result.apollo_findings if f.category in
                ("hardcoded-secret", "missing-auth", "unsafe-sql")]
    assert len(security) == 3
    for f in security:
        assert f.cvss_vector and f.cvss_vector.startswith("CVSS:3.1/")
        assert f.cvss_base_score is not None and 0.0 <= f.cvss_base_score <= 10.0
        assert f.exploit_pattern and "CWE-" in f.exploit_pattern


async def test_websocket_publishes_scan_lifecycle():
    ws = get_ws_adapter()
    initial = len(ws.published)
    result = await run_full_scan(Path("/tmp/stub-nodegoat"), REPO_FULL + "-ws")
    new_events = ws.published[initial:]
    types = [e.type for e in new_events]
    assert "scan.started" in types
    assert "scan.completed" in types
    finding_events = [e for e in new_events if e.type == "finding.detected"]
    assert len(finding_events) == 5
    for e in finding_events:
        assert e.finding is not None
        assert e.finding["severity"] in ("critical", "high", "medium", "low", "info")
        assert e.finding["category"] in (
            "hardcoded-secret", "outdated-dependency", "missing-auth",
            "unsafe-sql", "complex-untested",
        )


async def test_demeter_persists_findings_and_drift():
    demeter = get_demeter_adapter()
    initial_f, initial_d = len(demeter.stub_findings), len(demeter.stub_drift)
    result = await run_full_scan(Path("/tmp/stub-nodegoat"), REPO_FULL + "-persist")
    assert len(demeter.stub_findings) - initial_f == 5
    assert len(demeter.stub_drift) - initial_d == 5
    new_persisted = demeter.stub_findings[initial_f:]
    for p in new_persisted:
        assert p.scan_run_id == result.scan_run_id


async def test_severity_enum_compliance():
    """Lock asclepius schema: severity must be one of 5 enum strings."""
    result = await run_full_scan(Path("/tmp/stub-nodegoat"), REPO_FULL + "-enum")
    allowed = {"critical", "high", "medium", "low", "info"}
    for f in result.apollo_findings:
        assert f.severity in allowed
    for d in result.drift_events:
        assert d.severity in allowed


async def test_adapters_are_stub_cycle_1():
    """Cycle 1 verification: all 4 adapters in stub mode (upstream cycle 1 ships unblock cycle 2+)."""
    assert get_parser_adapter().is_stub
    assert get_triton_adapter().is_stub
    assert get_demeter_adapter().is_stub
    assert get_ws_adapter().is_stub
```

- [ ] **Step 3: Install deps + run cycle 1 smoke**

Run:
```bash
cd /Users/ghaisan/Documents/codeplexRefactory/backend && python -m venv .venv && \
  .venv/bin/pip install -q pydantic httpx pytest pytest-asyncio && \
  .venv/bin/pytest tests/test_detectors_smoke.py -v
```
Expected: 8 PASSED.

- [ ] **Step 4: Commit cycle 1 stub ship**

```bash
cd /Users/ghaisan/Documents/codeplexRefactory && git add backend/ _meta/decisions/nemesis_drift_algo.md _meta/plans/nemesis-wave3-cycle-plan.md
git commit -m "$(cat <<'EOF'
nemesis wave3 cycle 1 stub ship: 11 detector signature + dispatcher + 4 adapter + smoke 8/8 PASS

5 Apollo (secrets, outdated_deps, missing_auth, unsafe_sql, complex_untested) + Argus security + 5 spec-drift A-E all signature-only stub returning labeled [MOCK cycle-1] findings. Dispatcher orchestrator wires 11 detector pipeline + Argus enrich + Demeter persist + WebSocket publish lifecycle (scan.started + finding.detected x5 + scan.completed). 4 adapter (Hades + Triton + Demeter + WS) in stub mode until upstream cycle 1 ships. Drift algo decision locked at _meta/decisions/nemesis_drift_algo.md per Phase B inferred AST-diff + 5 pattern A-E LOCKED PRD 11.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

### Task 1.6: Cycle 1 mandatory artifacts (decision log, uncertainty, checkpoint, 2 handoff)

**Files:**
- Create: `_meta/decision_log/nemesis.md`
- Create: `_meta/uncertainty/nemesis-cycle1-<actual-timestamp>.md` (use `date +%Y%m%d-%H%M`)
- Create: `_meta/checkpoints/nemesis-cycle1.md`
- Create: `_meta/handoff_log/wave3_nemesis_to_demeter.md`
- Create: `_meta/handoff_log/wave3_nemesis_to_asclepius.md`

- [ ] **Step 1: Run `STAMP=$(date +%Y%m%d-%H%M) && echo $STAMP` for actual timestamp.**

- [ ] **Step 2: Author `_meta/decision_log/nemesis.md`** with cycle 1 5 decisions: D-Nemesis-01 adapter pattern for stub-and-sync, D-Nemesis-02 Pydantic schema verbatim Pythia, D-Nemesis-03 dispatcher single-entry orchestrator, D-Nemesis-04 Argus enrich post Apollo, D-Nemesis-05 drift algo doc locked.

- [ ] **Step 3: Author `_meta/uncertainty/nemesis-cycle1-$STAMP.md`** with medium concerns: (a) 7 framework tree-sitter queries Cycle 2-3 risk per Phase B blind spot, (b) OSV API rate limit Cycle 2 risk, (c) git log subprocess fallback when git unavailable Pattern E, (d) AST-diff inferred algo not validated empirically until Cycle 5.

- [ ] **Step 4: Author `_meta/checkpoints/nemesis-cycle1.md`** with state snapshot: 11 detector signature shipped, dispatcher tested 8/8 PASS, all adapters stub mode, awaiting Hades cycle 1 + Triton cycle 1 + Demeter cycle 1 sync signal.

- [ ] **Step 5: Author `_meta/handoff_log/wave3_nemesis_to_demeter.md`** documenting FindingPersist + DriftEventPersist payload contract reaffirm + cycle 1 stub status.

- [ ] **Step 6: Author `_meta/handoff_log/wave3_nemesis_to_asclepius.md`** documenting WebSocket FindingEvent payload reaffirm + 5-enum severity + 5-enum kebab-case category lock + scan lifecycle event sequence.

- [ ] **Step 7: Update STATUS.md** "Wave 3 progress" line Nemesis from `spawn pending` to `cycle 1 stub SHIP-CLEAN <STAMP>` + add `Wave 3 sync events` line `Nemesis cycle 1 stub ship, awaiting Hades + Triton + Demeter cycle 1 sync for cycle 2 spawn`.

- [ ] **Step 8: Commit artifacts**

```bash
cd /Users/ghaisan/Documents/codeplexRefactory && git add _meta/decision_log/nemesis.md _meta/uncertainty/nemesis-cycle1-*.md _meta/checkpoints/nemesis-cycle1.md _meta/handoff_log/wave3_nemesis_to_demeter.md _meta/handoff_log/wave3_nemesis_to_asclepius.md STATUS.md
git commit -m "$(cat <<'EOF'
nemesis cycle 1 mandatory artifacts: decision log + uncertainty journal + checkpoint + 2 handoff log + STATUS update

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Cycle 2: Apollo detector 1-3 real impl (~80 min)

### Task 2.1: Sync gate (wait Hades + Triton + Demeter cycle 1 stub ship)

- [ ] **Step 1: Poll STATUS.md** for entries `Hades cycle 1 stub SHIP`, `Triton cycle 1 stub SHIP`, `Demeter cycle 1 stub SHIP`. Wave 3 Manager facilitates sync. If absent after 30 min wait, ferry V1 Orch (HIGH bar trigger: critical block more-than 30 min).

- [ ] **Step 2: Read `_meta/handoff_log/wave3_hades_cycle1_stub.md` + `wave3_triton_cycle1_stub.md` + `wave3_demeter_cycle1_stub.md`** to confirm callable surface match Nemesis adapter expectations.

### Task 2.2: secrets.py real gitleaks subprocess impl

**Files:**
- Modify: `backend/app/services/detectors/secrets.py` (replace stub)
- Create: `backend/app/services/detectors/.gitleaks.toml`

- [ ] **Step 1: Write failing test for secrets.detect with NodeGoat fixture**

Add to `tests/test_detectors_smoke.py`:

```python
@pytest.mark.skipif(not _gitleaks_available(), reason="gitleaks not installed")
async def test_secrets_detector_real_gitleaks_on_fixture():
    from app.services.detectors import secrets as d_secrets
    from app.services.detectors.adapters import get_parser_adapter
    parsed = await get_parser_adapter().parse_repo(Path("backend/tests/fixtures/nodegoat-slice"))
    findings = await d_secrets.detect(Path("backend/tests/fixtures/nodegoat-slice"), parsed, REPO_FULL)
    assert any(f.severity in ("critical", "high") for f in findings)
    assert all("[STUB cycle-1]" not in f.description for f in findings)
```

Helper `_gitleaks_available()` checks `shutil.which("gitleaks")`.

- [ ] **Step 2: Run test, expect FAIL** (stub still returns canned, no real gitleaks).

- [ ] **Step 3: Author `.gitleaks.toml`** custom config with entropy 3.5-4.5 thresholds and rule set covering AWS keys, GitHub tokens, MongoDB connection strings, generic high-entropy strings.

- [ ] **Step 4: Replace `secrets.py` stub with real impl** using `subprocess.run(["gitleaks", "dir", "--report-format", "json", "--no-banner", "--config", ".gitleaks.toml", str(repo_root)], capture_output=True, text=True, timeout=120)` + JSON parse + map to ApolloFinding. Add fallback if gitleaks subprocess returns non-zero or absent: emit `info` severity finding labeled "secrets_gitleaks_unavailable" per Lock 5.

- [ ] **Step 5: Author `backend/tests/fixtures/nodegoat-slice/`** minimal fixture: `app/config/config.js` containing hardcoded `mongodb://admin:p@ssw0rd@localhost:27017/nodegoat` connection string.

- [ ] **Step 6: Run test, expect PASS.**

- [ ] **Step 7: Commit.**

### Task 2.3: outdated_deps.py real OSV API impl

**Files:**
- Modify: `backend/app/services/detectors/outdated_deps.py` (replace stub)

- [ ] **Step 1: Write failing test** for parse `package.json` with `jquery@1.4.0` + OSV API mock returning GHSA-2pqj-h3vj-pqgw. Use `respx` or `httpx_mock` to intercept OSV POST.

- [ ] **Step 2: Run test, expect FAIL.**

- [ ] **Step 3: Implement `parse_manifest()` per ecosystem**: package.json (npm), requirements.txt (PyPI), go.mod (Go), Cargo.toml (crates.io), pom.xml (Maven), Gemfile (rubygems), composer.json (packagist). Use `tomllib` for Cargo.toml + `xml.etree.ElementTree` for pom.xml + line-based parse for requirements.txt + Gemfile.

- [ ] **Step 4: Implement `query_osv(name, version, ecosystem)`** via `httpx.AsyncClient.post("https://api.osv.dev/v1/query", json={...})` with retry exponential backoff 2s 4s 8s on 429.

- [ ] **Step 5: Map OSV response** vulnerability list to ApolloFinding per package. Severity from OSV `severity` field map: CRITICAL/HIGH/MODERATE/LOW + UNKNOWN -> info.

- [ ] **Step 6: Concurrent OSV queries** via `asyncio.gather` with `asyncio.Semaphore(10)` rate limit.

- [ ] **Step 7: Run test, expect PASS.**

- [ ] **Step 8: Commit.**

### Task 2.4: missing_auth.py real tree-sitter Express + FastAPI + Flask + Django

**Files:**
- Modify: `backend/app/services/detectors/missing_auth.py` (replace stub partial: Express + FastAPI + Flask + Django cycle 2, Gin + Echo + Spring + Actix cycle 3)
- Create: `backend/app/services/detectors/queries/missing_auth_express.scm`
- Create: `backend/app/services/detectors/queries/missing_auth_fastapi.scm`
- Create: `backend/app/services/detectors/queries/missing_auth_flask.scm`
- Create: `backend/app/services/detectors/queries/missing_auth_django.scm`

- [ ] **Step 1: Write 4 failing tests** one per framework using minimal fixture file per framework (NodeGoat for Express, fastapi-slice for FastAPI, flask-slice for Flask, django-slice for Django).

- [ ] **Step 2: Run tests, expect FAIL.**

- [ ] **Step 3: Author 4 `.scm` query files.** Express: `(call_expression function: (member_expression object: (identifier) property: (property_identifier) @method))` capturing app.get/app.post + check callback args for middleware presence. FastAPI: `(decorated_definition (decorator) @dec (function_definition parameters: (parameters) @params))` capturing route decorators + check Depends in params. Flask: `(decorated_definition)` capturing @app.route + sibling decorator check for @login_required. Django: function-based view `def *_view(request, ...)` and class `class *View(...)` with mixin check.

- [ ] **Step 4: Implement `detect_missing_auth_<framework>(parsed_file)`** per framework, each function calls `parser.query_tree(file_path, query_source)` + heuristic check.

- [ ] **Step 5: Implement framework detection from imports** map: `express` -> express, `fastapi` -> fastapi, `flask` -> flask, `django` -> django (cycle 3 adds gin/echo/spring/actix). Unknown framework fallback: emit `info` severity finding labeled "missing_auth_framework_unknown" per Lock 5.

- [ ] **Step 6: Run tests, expect PASS.**

- [ ] **Step 7: Commit.**

### Task 2.5: Cycle 2 mandatory artifacts

- [ ] **Step 1: Append decision log entry** D-Nemesis-06 gitleaks subprocess vs Python regex (chose subprocess for 160-pattern coverage), D-Nemesis-07 OSV API concurrent semaphore 10, D-Nemesis-08 framework detection via imports prefix.

- [ ] **Step 2: Author `_meta/uncertainty/nemesis-cycle2-$STAMP.md`** if any medium concerns surfaced.

- [ ] **Step 3: Author `_meta/checkpoints/nemesis-cycle2.md`** with progress: 3/5 Apollo real impl ship.

- [ ] **Step 4: Update STATUS.md** Nemesis cycle 2 progress + ship line.

- [ ] **Step 5: Commit.**

---

## Cycle 3: Apollo detector 4-5 + Argus real + missing_auth completion (~80 min)

### Task 3.1: unsafe_sql.py real regex + tree-sitter SQL context

**Files:**
- Modify: `backend/app/services/detectors/unsafe_sql.py` (replace stub)
- Create: `backend/app/services/detectors/queries/unsafe_sql.scm`

- [ ] **Step 1: Write failing test** with fixture file containing `db.query("SELECT * FROM users WHERE id = " + userId)` JavaScript and `cursor.execute("SELECT * FROM users WHERE id = " + str(user_id))` Python.

- [ ] **Step 2: Implement regex pre-filter** detecting `(query|execute|exec|raw)\s*\(\s*["']` + string concat pattern `["']\s*\+\s*` near SQL keyword.

- [ ] **Step 3: Implement tree-sitter confirm** via parser.query_tree to check identifier is database method, false positive prune.

- [ ] **Step 4: Map matches to ApolloFinding** severity critical.

- [ ] **Step 5: Run test, expect PASS.**

- [ ] **Step 6: Commit.**

### Task 3.2: complex_untested.py real radon + test coverage stub

**Files:**
- Modify: `backend/app/services/detectors/complex_untested.py` (replace stub)
- Modify: `backend/pyproject.toml` add `radon>=6.0`

- [ ] **Step 1: Write failing test** with fixture file containing 30+ branch Python function and missing test_*.py co-located.

- [ ] **Step 2: Implement radon analyze** via `radon.complexity.cc_visit(source)` returning function complexity scores. Filter where `score > 15` (medium), `score > 25` (high), `score > 40` (critical).

- [ ] **Step 3: Implement test file co-located check** via filesystem glob `test_<filename>.py` / `<filename>.test.ts` / `__tests__/<filename>` patterns.

- [ ] **Step 4: Emit findings** only where complexity high AND no co-located test.

- [ ] **Step 5: Run test, expect PASS.**

- [ ] **Step 6: Commit.**

### Task 3.3: argus_security.py real Triton LLM call

**Files:**
- Modify: `backend/app/services/detectors/argus_security.py` (replace canned with real)
- Modify: `backend/app/services/detectors/adapters/triton_adapter.py` set `force_real=True` default when Triton module exists

- [ ] **Step 1: Write failing test** mocking Triton LLM response with valid CVSS JSON `{"cvss_vector": "CVSS:3.1/...", "cvss_base_score": 9.8, "exploit_pattern": "CWE-89: ...", "mitigation": "...", "references": ["CVE-..."]}`.

- [ ] **Step 2: Author Argus persona prompt** per `triton-to-nemesis.md` line 144 template (clinical, brief, decisive, JSON output, cite sources, never speculate beyond public records).

- [ ] **Step 3: Implement `argus_cvss_score()`** in TritonAdapter via real `llm.call()` with V4-Flash thinking low + max_tokens 400 + temperature 0.3.

- [ ] **Step 4: Implement JSON parse with regex fallback** per stub `_parse_cvss_response()`.

- [ ] **Step 5: Run test, expect PASS + verify cache_hit logging propagates per llm_call_log.**

- [ ] **Step 6: Commit.**

### Task 3.4: missing_auth.py Gin + Echo + Spring + Actix

**Files:**
- Modify: `backend/app/services/detectors/missing_auth.py` (extend to 8 framework)
- Create: 4 query files (gin, echo, spring, actix).

- [ ] **Step 1: Write 4 failing tests** with framework-specific fixture files.

- [ ] **Step 2: Author 4 .scm queries** per framework grammar.

- [ ] **Step 3: Run tests, expect PASS.**

- [ ] **Step 4: Commit.**

### Task 3.5: Cycle 3 mandatory artifacts

- [ ] **Step 1-5: Same pattern as cycle 2** (decision log append, uncertainty if any, checkpoint, STATUS, commit).

---

## Cycle 4: Spec-drift A-B-C real impl (~80 min)

### Task 4.1: drift_a_stale_closed.py real Demeter query + git log

**Files:**
- Modify: `backend/app/services/detectors/drift_a_stale_closed.py` (replace stub)
- Create: `backend/app/services/detectors/git_helpers.py` (shared git log subprocess wrapper for Pattern A, C, E)

- [ ] **Step 1: Write failing test** with fixture demo dataset containing closed issue 8 months old + file in fixture repo edited after close.

- [ ] **Step 2: Implement `get_repo_issues(repo_full_name)`** via Demeter adapter consuming `list_issues_for_repo()` from `hades-to-demeter.md`.

- [ ] **Step 3: Implement `extract_file_paths_from_issue_body(body)`** via regex per drift algo doc Pattern A step 2 (path-like extension whitelist plus markdown code-block annotations).

- [ ] **Step 4: Implement `get_file_latest_commit(file_path, repo_root)`** via `subprocess.run(["git", "log", "-1", "--format=%ct", "--", file_path])` in `git_helpers.py`. Fallback: empty result + `info` finding labeled "git_unavailable" per Lock 5.

- [ ] **Step 5: Compute trigger** per algo: `latest_commit > closed_at AND now - closed_at > 6 months`. Severity heuristic medium baseline, high if more-than 1 year drift.

- [ ] **Step 6: Run test, expect PASS.**

- [ ] **Step 7: Commit.**

### Task 4.2: drift_b_closed_without_merge.py real Demeter linked PR check

**Files:**
- Modify: `backend/app/services/detectors/drift_b_closed_without_merge.py` (replace stub)

- [ ] **Step 1: Write failing test** with closed issue + no linked PR with merged_at + expected files in issue body.

- [ ] **Step 2: Implement `get_linked_prs(issue_id, repo_full_name)`** via Demeter PR query + closes/fixes/resolves regex on PR body matching issue.

- [ ] **Step 3: Implement trigger condition** per algo: no linked PR with merged_at AND no PR touches files in issue body.

- [ ] **Step 4: Severity heuristic.**

- [ ] **Step 5: Run test, expect PASS.**

- [ ] **Step 6: Commit.**

### Task 4.3: drift_c_spec_impl_lag.py real positive gap detector

**Files:**
- Modify: `backend/app/services/detectors/drift_c_spec_impl_lag.py` (replace stub)

- [ ] **Step 1: Write failing test** with closed issue 4 months ago + file commit 2 weeks ago (lag 106 days greater-than 3 month threshold).

- [ ] **Step 2: Read `NEMESIS_DRIFT_C_LAG_MONTHS` env var** (default 3) for threshold.

- [ ] **Step 3: Implement lag computation** per algo: `lag_days = (latest_commit - closed_at).days` and trigger `lag_days > threshold_days AND lag_days > 0`.

- [ ] **Step 4: Severity heuristic** low (3-6mo), medium (6-12mo), high (greater-than 12mo).

- [ ] **Step 5: Run test, expect PASS.**

- [ ] **Step 6: Commit.**

### Task 4.4: Cycle 4 mandatory artifacts

Same pattern.

---

## Cycle 5: Spec-drift D-E real + full 10/10 smoke verify (~80-90 min)

### Task 5.1: drift_d_reopened_cycle.py real Demeter issue_events query

**Files:**
- Modify: `backend/app/services/detectors/drift_d_reopened_cycle.py` (replace stub)

- [ ] **Step 1: Write failing test** with issue having 3 reopened events in fixture.

- [ ] **Step 2: Implement `get_issue_events(issue_id, repo_full_name)`** via Demeter consuming GitHub Issues API `/issues/<n>/events` (persisted via webhook in Hades).

- [ ] **Step 3: Count reopen events** trigger condition reopened_count greater-than-or-equal 2.

- [ ] **Step 4: Implement revert detection** secondary: parse linked PR merge commit for subsequent `Revert "Merge pull request ..."` via git log.

- [ ] **Step 5: Severity heuristic** medium (2 reopens), high (3+), critical (4+ or revert detected).

- [ ] **Step 6: Run test, expect PASS.**

- [ ] **Step 7: Commit.**

### Task 5.2: drift_e_openspec_drift.py real archive walk + git log + opsx prefix check

**Files:**
- Modify: `backend/app/services/detectors/drift_e_openspec_drift.py` (replace stub)
- Create: `backend/app/services/detectors/openspec_parser.py` (shared markdown clause + symbol extractor for Pattern E)

- [ ] **Step 1: Write failing test** with fixture `openspec/archive/2026-01-15/add-oauth-flow/` containing proposal.md referencing `app/auth/oauth.ts` + git fixture commit touching the file with message `fix: oauth token expiry` (no opsx: prefix).

- [ ] **Step 2: Implement `list_archived_changes(repo_root)`** filesystem walk `openspec/archive/<date>/<change>/` returning list of paths.

- [ ] **Step 3: Implement `extract_referenced_files(proposal_md_path)`** per drift algo doc Pattern E step 2: 3-stage regex inline code spans + markdown links + bare path tokens with language extension.

- [ ] **Step 4: Implement `get_commits_touching_file(file_path, since_days=30)`** via `subprocess.run(["git", "log", f"--since={since_days} days ago", "--format=%H%n%s%n%b%n---END---", "--", file_path])`.

- [ ] **Step 5: Implement opsx prefix check** trigger condition: commit message does NOT match `^opsx:<change-name>:` AND does NOT match allowlist (`hotfix:`, `revert:`).

- [ ] **Step 6: Severity heuristic** high baseline, critical if more-than 5 bypass commits or commit less-than 7 days old.

- [ ] **Step 7: AST-diff inferred enrichment** (secondary): parse proposal.md for `(function|class|def|export|async)\s+(\w+)` referenced symbols + tree-sitter confirm presence in current parse via Hades. If symbol referenced but absent from parse, add to evidence as "symbol_absent_drift".

- [ ] **Step 8: Run test, expect PASS.**

- [ ] **Step 9: Commit.**

### Task 5.3: Full 10/10 smoke verify on NodeGoat + demo dataset

**Files:**
- Modify: `backend/tests/test_detectors_smoke.py` (add full smoke tests)
- Create: `backend/tests/fixtures/nodegoat-slice/` (full Apollo fixture)
- Create: `backend/tests/fixtures/demo-drift/` (full drift fixture with closed issues + git history + openspec archive)

- [ ] **Step 1: Author NodeGoat fixture** with 5 distinct files triggering each Apollo detector (1 hardcoded secret, 1 outdated jquery, 1 unauth admin route, 1 SQL concat, 1 complex untested 320-line controller).

- [ ] **Step 2: Author demo-drift fixture** with .git/ initialized + closed issue JSON + openspec/archive/ change + commits matching all 5 pattern A-E triggers.

- [ ] **Step 3: Write 10/10 smoke test**

```python
@pytest.mark.integration
async def test_full_nodegoat_5_apollo_trigger():
    result = await run_full_scan(Path("backend/tests/fixtures/nodegoat-slice"), "duopoly/codeplex-demo-nodegoat")
    detector_ids = {f.detector_id for f in result.apollo_findings}
    assert detector_ids == {"secrets", "outdated_deps", "missing_auth", "unsafe_sql", "complex_untested"}
    assert len(result.apollo_findings) >= 5


@pytest.mark.integration
async def test_full_demo_drift_5_pattern_trigger():
    result = await run_full_scan(Path("backend/tests/fixtures/demo-drift"), "duopoly/codeplex-demo-drift")
    patterns = {d.pattern for d in result.drift_events}
    assert patterns == {"A", "B", "C", "D", "E"}
    assert len(result.drift_events) >= 5


@pytest.mark.integration
async def test_websocket_5_finding_detected_events():
    ws = get_ws_adapter()
    initial = len(ws.published)
    await run_full_scan(Path("backend/tests/fixtures/nodegoat-slice"), "duopoly/codeplex-demo-nodegoat")
    new = ws.published[initial:]
    finding_events = [e for e in new if e.type == "finding.detected"]
    assert len(finding_events) >= 5
    assert any(e.type == "scan.started" for e in new)
    assert any(e.type == "scan.completed" for e in new)
```

- [ ] **Step 4: Run full smoke**

Run: `.venv/bin/pytest tests/test_detectors_smoke.py -v -m integration`
Expected: 10/10 PASS (5 Apollo trigger + 5 drift trigger).

- [ ] **Step 5: Verify ship criteria checklist** per `.claude/agents/nemesis.md` Section 10 13-item.

- [ ] **Step 6: Commit cycle 5 ship-clean.**

### Task 5.4: Cycle 5 V_n snapshot + final artifacts

**Files:**
- Create: `_meta/orchestration_log/V3_nemesis_detectors_locked_<STAMP>.md`
- Modify: `_meta/decision_log/nemesis.md` (append final cycle decisions)
- Create: `_meta/uncertainty/nemesis-cycle5-<STAMP>.md`
- Create: `_meta/checkpoints/nemesis-cycle5.md`
- Modify: `_meta/handoff_log/wave3_nemesis_to_demeter.md` (cycle 2 full)
- Modify: `_meta/handoff_log/wave3_nemesis_to_asclepius.md` (cycle 2 full)
- Modify: `STATUS.md` Nemesis SHIP-CLEAN cycle 5 status

- [ ] **Step 1: Run `STAMP=$(date +%Y%m%d-%H%M)`.**

- [ ] **Step 2: Author V_n snapshot** `V3_nemesis_detectors_locked_$STAMP.md` per Lock 9 with full ship summary (11 detector real impl + 4 adapter real-connected + 10/10 smoke PASS + artifacts).

- [ ] **Step 3: Append decision log cycle 5 entries.**

- [ ] **Step 4: Author uncertainty journal cycle 5** if any medium concerns surfaced (likely Pattern E AST-diff false positive rate, OSV rate limit on full repo scan).

- [ ] **Step 5: Author checkpoint cycle 5.**

- [ ] **Step 6: Append handoff log cycle 2 full sections.**

- [ ] **Step 7: Update STATUS.md** Nemesis SHIP-CLEAN cycle 5 + Wave 3 sync events.

- [ ] **Step 8: Self-check 20-item per `.claude/skills/anti-pattern-locks/SKILL.md`.**

- [ ] **Step 9: Final commit.**

```bash
cd /Users/ghaisan/Documents/codeplexRefactory && git add -A
git commit -m "$(cat <<'EOF'
nemesis wave3 cycle 5 SHIP-CLEAN: 11 detector real impl + 10/10 smoke PASS

5/5 Apollo (gitleaks subprocess + OSV API + 8 framework tree-sitter + SQL context + radon) trigger on NodeGoat fork. 5/5 spec-drift A-E (stale_closed + closed_without_merge + spec_impl_lag + reopened_cycle + openspec_drift opsx bypass) trigger on demo-drift fixture. Argus security CVSS 3.1 enrich security categories via Triton V4-Flash think low. Dispatcher persist Demeter + WebSocket publish lifecycle. V3 snapshot locked.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review

**Spec coverage check:**
- 5 Apollo detector: cycle 1 stub + cycle 2 (1-3) + cycle 3 (4-5) -> COVERED
- Argus security CVSS: cycle 1 stub canned + cycle 3 real Triton -> COVERED
- 5 spec-drift A-E: cycle 1 stub + cycle 4 (A-C) + cycle 5 (D-E) -> COVERED
- Dispatcher orchestrator: cycle 1 -> COVERED
- ApolloFinding/DriftEvent Pydantic match Pythia: cycle 1 types.py verbatim -> COVERED
- OSV API free no-auth: cycle 2 Task 2.3 -> COVERED
- 8 framework tree-sitter missing_auth: cycle 2 (Express+FastAPI+Flask+Django) + cycle 3 (Gin+Echo+Spring+Actix) -> COVERED
- Drift algo decision doc: authored pre-Cycle 1 at `_meta/decisions/nemesis_drift_algo.md` -> COVERED
- Smoke 5/5 Apollo NodeGoat: cycle 5 Task 5.3 -> COVERED
- Smoke 5/5 spec-drift demo dataset: cycle 5 Task 5.3 -> COVERED
- WebSocket push verify Asclepius mock consume: cycle 1 Step 5 + cycle 5 Task 5.3 Step 3 -> COVERED
- 4 mandatory artifact per cycle: each cycle final task -> COVERED
- 20-item self-check: cycle 5 Task 5.4 Step 8 -> COVERED

**Placeholder scan:**
- No "TBD", "TODO", "implement later" in plan.
- Stub labels `[STUB cycle-1]` and `[MOCK cycle-1]` are intentional Lock 5 honest claim discipline, NOT plan placeholders.

**Type consistency:** All 11 detectors signature `async def detect(repo_root: Path, ..., repo_full_name: str) -> list[ApolloFinding|DriftEvent]`. Adapter pattern consistent (`get_*_adapter()` + `is_stub` property). FindingPersist + DriftEventPersist + FindingEvent schemas match Pythia contracts verbatim.

---

Plan complete and saved to `_meta/plans/nemesis-wave3-cycle-plan.md`.
