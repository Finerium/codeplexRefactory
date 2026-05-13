"""Apollo detector 5: complex untested files.

Cycle 3: real complexity + test-coverage detection using radon (Python) + a
language-agnostic branch-counter (JS/TS/Go/Java/etc.) plus filesystem glob for
co-located test file.

Heuristic complexity (per language family):
- Python: radon cc_visit to compute McCabe cyclomatic complexity per function.
- Other languages: count decision tokens (`if`, `else if`, `elif`, `case`,
  `for`, `while`, `&&`, `||`, `?`) in each file, divided across functions or
  flat per-file approximation.

Severity thresholds:
- complexity 15-25 + no co-located test: medium
- complexity 25-40 + no co-located test: high
- complexity greater-than 40 + no co-located test: critical
- with co-located test: skip (test presence implies coverage; this is a
  conservative stub for Demeter cycle 2 deeper coverage analysis).

Per _meta/decisions/nemesis_drift_algo.md complex_untested detector.
"""
from __future__ import annotations

import logging
import re
from pathlib import Path

from app.parsers.types import ParsedFile, ParsedRepo
from app.services.detectors.types import ApolloDetectorId, ApolloFinding, FindingCategory

log = logging.getLogger("nemesis.complex_untested")

DETECTOR_ID: ApolloDetectorId = "complex_untested"
CATEGORY: FindingCategory = "complex-untested"


_DECISION_TOKEN_RE = re.compile(
    r"\b(?:if|else if|elif|case|for|while|catch|except)\b|\?\s*[^?:]+\s*:|&&|\|\|"
)


def _cyclomatic_complexity_python(text: str) -> int:
    try:
        from radon.complexity import cc_visit

        blocks = cc_visit(text)
        return max((b.complexity for b in blocks), default=0)
    except Exception:  # pragma: no cover - defensive
        return _approximate_complexity(text)


def _approximate_complexity(text: str) -> int:
    matches = _DECISION_TOKEN_RE.findall(text)
    # Per McCabe: complexity = 1 + decision count.
    return 1 + len(matches)


def _is_test_file(file_path: Path) -> bool:
    """A file is a test file if its NAME indicates so. Path ancestry is not
    used because real fixture / repo trees may live under any path.
    """
    name = file_path.name
    if name.startswith("test_") or name.endswith("_test.py"):
        return True
    if any(seg in name for seg in (".test.", ".spec.")):
        return True
    # Only look at the IMMEDIATE parent directory for `__tests__` (Jest
    # convention) rather than full ancestry.
    immediate_parent = file_path.parent.name.lower()
    if immediate_parent in ("__tests__", "spec"):
        return True
    return False


def _has_colocated_test(repo_root: Path, file_path: Path) -> bool:
    """Look for co-located test file by common naming convention."""
    name = file_path.stem
    parent = file_path.parent
    suffix = file_path.suffix

    candidates = [
        parent / f"test_{name}.py",
        parent / f"{name}_test.py",
        parent / f"{name}.test{suffix}",
        parent / f"{name}.spec{suffix}",
        parent / "__tests__" / f"{name}{suffix}",
        parent / "__tests__" / f"{name}.test{suffix}",
        parent / "tests" / f"test_{name}.py",
        parent / "tests" / f"{name}_test.py",
        parent.parent / "tests" / f"test_{name}.py",
        parent.parent / "tests" / f"{name}_test.py",
        parent.parent / "tests" / f"{name}.test{suffix}",
        parent.parent / "tests" / f"{name}.spec{suffix}",
        parent.parent / "__tests__" / f"{name}{suffix}",
        parent.parent / "__tests__" / f"{name}.test{suffix}",
    ]
    for c in candidates:
        try:
            if c.exists() and c.is_file():
                return True
        except OSError:
            continue
    # Best-effort glob fallback for shallow trees
    try:
        for match in repo_root.rglob(f"test_{name}.py"):
            return True
        for match in repo_root.rglob(f"{name}.test{suffix}"):
            return True
    except Exception:  # pragma: no cover - defensive
        pass
    return False


def _severity_for_complexity(complexity: int) -> str | None:
    # Thresholds align with McCabe academic guidance:
    #   1-10 simple, 11-20 moderate (medium), 21-50 complex (high), >50 unstable (critical).
    if complexity > 50:
        return "critical"
    if complexity > 20:
        return "high"
    if complexity > 10:
        return "medium"
    return None


async def detect(
    repo_root: Path,
    parsed_repo: ParsedRepo,
    repo_full_name: str,
) -> list[ApolloFinding]:
    """Detect high cyclomatic complexity without co-located test.

    Manager FINAL Cycle 2 Bug #7 fix (Cluster F Nemesis 20260513-0857): NEVER
    return canned NodeGoat stub finding when repo_root invalid. Empty list is
    the honest answer.
    """
    if not isinstance(repo_root, Path) or not repo_root.exists() or not repo_root.is_dir():
        return []

    findings: list[ApolloFinding] = []
    seen: set[str] = set()
    for parsed_file in parsed_repo.files:
        file_path = repo_root / parsed_file.file_path
        if not file_path.exists() or not file_path.is_file():
            continue
        if _is_test_file(file_path):
            continue
        try:
            text = file_path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        if not text:
            continue
        if parsed_file.language == "python":
            complexity = _cyclomatic_complexity_python(text)
        else:
            complexity = _approximate_complexity(text)
        severity = _severity_for_complexity(complexity)
        if severity is None:
            continue
        if _has_colocated_test(repo_root, file_path):
            continue
        finding_id = f"complex_untested-{_safe_token(parsed_file.file_path)}-cc{complexity}"
        if finding_id in seen:
            continue
        seen.add(finding_id)
        findings.append(
            ApolloFinding(
                id=finding_id,
                detector_id=DETECTOR_ID,
                category=CATEGORY,
                severity=severity,  # type: ignore[arg-type]
                title=f"High complexity ({complexity}) without co-located test",
                description=(
                    f"Cyclomatic complexity estimate {complexity} for "
                    f"{parsed_file.file_path}, no co-located test file detected. "
                    f"High-risk for regressions when refactored without coverage."
                ),
                file_path=parsed_file.file_path,
                line_start=1,
                line_end=max(parsed_file.line_count, 1),
                suggested_fix=(
                    "Refactor into smaller, single-responsibility units. Add unit "
                    "test coverage on the new units before merging."
                ),
                repo_full_name=repo_full_name,
                building_id=parsed_file.file_path,
            )
        )
    return findings


def _safe_token(value: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9._\-]+", "-", value)
    return cleaned[:64]


def _stub_finding(repo_full_name: str) -> ApolloFinding:
    return ApolloFinding(
        id=f"complex_untested-stub-{_safe_token(repo_full_name)}-1",
        detector_id=DETECTOR_ID,
        category=CATEGORY,
        severity="medium",
        title="High cyclomatic complexity without test coverage (estimate 52)",
        description=(
            "[STUB cycle-1] profile.js estimated cyclomatic complexity 52, no "
            "co-located test file. Real impl runs on real fixture cycle 3."
        ),
        file_path="app/controllers/profile.js",
        line_start=1,
        line_end=320,
        suggested_fix=(
            "Refactor into smaller, single-responsibility functions. Add unit "
            "tests covering decision branches."
        ),
        repo_full_name=repo_full_name,
        building_id="app/controllers/profile.js",
    )
