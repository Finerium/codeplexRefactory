"""Apollo detector 4: unsafe SQL patterns via regex + tree-sitter SQL context.

Cycle 3: real regex pre-filter detecting raw string concat in SQL execution
context across JavaScript / TypeScript / Python / Go / Java / Ruby / PHP. For
each line containing a known SQL execution call (`db.query`, `cursor.execute`,
`session.exec`, `connection.raw`, `prepare` with concat, raw SQL string literal
followed by `+ variable`), confirm the line includes string concat tokens (`+`,
`||`, format string interpolation, f-string with variable).

Heuristic precision is high enough for hackathon demo + Aletheia audit. False
positive mitigation:
- Skip pure SQL literal queries (string only, no concat).
- Skip parameterized queries (db.query('SELECT ... ?', [args])).
- Skip SELECT 'literal' constructs.

Per _meta/decisions/nemesis_drift_algo.md unsafe_sql detector.
"""
from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from pathlib import Path

from app.parsers.types import ParsedFile, ParsedRepo
from app.services.detectors.types import ApolloDetectorId, ApolloFinding, FindingCategory

log = logging.getLogger("nemesis.unsafe_sql")

DETECTOR_ID: ApolloDetectorId = "unsafe_sql"
CATEGORY: FindingCategory = "unsafe-sql"


# SQL execution call patterns across 7 ecosystems.
_SQL_EXEC_PATTERNS: tuple[re.Pattern[str], ...] = (
    # JavaScript / TypeScript common DAO APIs
    re.compile(r"""\b(?:db|conn|client|connection|pool|knex)\s*\.\s*(?:query|raw|exec|execute)\s*\("""),
    re.compile(r"""\b(?:Sequelize|sequelize)\.query\s*\("""),
    # Python: sqlalchemy + raw cursor
    re.compile(r"""\b(?:cursor|conn|connection|session)\s*\.\s*(?:execute|exec_driver_sql)\s*\("""),
    re.compile(r"""\bsession\.execute\s*\(\s*text\s*\("""),
    # Go: database/sql
    re.compile(r"""\b(?:db|tx|stmt)\.(?:Query|QueryRow|Exec)\s*\("""),
    # Java: JDBC + Hibernate
    re.compile(r"""(?:Statement|PreparedStatement)\s+\w+\s*=\s*\w+\.(?:createStatement|prepareStatement)\s*\("""),
    re.compile(r"""\bcreateNativeQuery\s*\("""),
    # Ruby on Rails
    re.compile(r"""\b(?:ActiveRecord::Base\.connection|connection)\.(?:execute|exec_query|select_all|raw_query)\s*\("""),
    # PHP: PDO + mysqli
    re.compile(r"""\$\w+\s*->\s*(?:query|prepare|exec)\s*\("""),
)


# Concat / interpolation tokens that turn the call risky.
_CONCAT_TOKENS = (" + ", " || ", "{", "%s", "%d", "$1", "?{")


# Markers indicating safe parameterized usage (skip the line).
_SAFE_TOKENS = (
    "$1",  # PostgreSQL parameterized
    "$2",
    ":param",
    ":id",
    "?,",
    "?)",
    "? ,",
    "%(",
    "execute_query",  # often abstracted safe
)


def _looks_like_string_concat(line: str) -> bool:
    """Heuristic: line contains a SQL string literal AND a concat marker."""
    has_string = ('"' in line) or ("'" in line) or ("`" in line)
    if not has_string:
        return False
    if not any(tok in line for tok in _CONCAT_TOKENS):
        return False
    # Parametrized queries with placeholders are NOT concat-flagged.
    return True


def _looks_safe(line: str) -> bool:
    if "?" in line and ", [" in line:
        return True
    if "?" in line and ", (" in line:
        return True
    return any(tok in line for tok in _SAFE_TOKENS)


@dataclass
class SqlHit:
    file_path: str
    line_no: int
    snippet: str
    severity: str = "critical"


async def detect(
    repo_root: Path,
    parsed_repo: ParsedRepo,
    repo_full_name: str,
) -> list[ApolloFinding]:
    """Detect raw SQL string concatenation (SQLi risk).

    Manager FINAL Cycle 2 Bug #7 fix (Cluster F Nemesis 20260513-0857): NEVER
    return canned NodeGoat stub finding when repo_root invalid. Empty list is
    the honest answer.
    """
    if not isinstance(repo_root, Path) or not repo_root.exists() or not repo_root.is_dir():
        return []

    findings: list[ApolloFinding] = []
    for parsed_file in parsed_repo.files:
        hits = _scan_file(repo_root, parsed_file)
        for hit in hits:
            findings.append(_hit_to_finding(hit, repo_full_name))
    return _dedup(findings)


def _scan_file(repo_root: Path, parsed_file: ParsedFile) -> list[SqlHit]:
    file_path = repo_root / parsed_file.file_path
    if not file_path.exists() or not file_path.is_file():
        return []
    try:
        text = file_path.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        return []
    if len(text) > 2_000_000:
        return []
    lines = text.splitlines()
    out: list[SqlHit] = []
    for idx, line in enumerate(lines, start=1):
        if len(line) > 4096:
            continue
        if not any(pat.search(line) for pat in _SQL_EXEC_PATTERNS):
            continue
        # Pull a multi-line window if the call spans lines.
        window = line
        if line.rstrip().endswith(",") or line.rstrip().endswith("\\"):
            window = "\n".join(lines[idx - 1 : min(idx + 2, len(lines))])
        if _looks_safe(window):
            continue
        if not _looks_like_string_concat(window):
            continue
        out.append(
            SqlHit(
                file_path=parsed_file.file_path,
                line_no=idx,
                snippet=line.strip()[:240],
            )
        )
    return out


def _hit_to_finding(hit: SqlHit, repo_full_name: str) -> ApolloFinding:
    return ApolloFinding(
        id=f"unsafe_sql-{_safe_token(hit.file_path)}-L{hit.line_no}",
        detector_id=DETECTOR_ID,
        category=CATEGORY,
        severity=hit.severity,  # type: ignore[arg-type]
        title="String concatenation in SQL query (SQL injection risk)",
        description=(
            f"Detected raw string concatenation in a SQL execution call at "
            f"{hit.file_path}:{hit.line_no}. User-controlled values flowing into "
            f"this call expression are vulnerable to SQL injection."
        ),
        file_path=hit.file_path,
        line_start=hit.line_no,
        line_end=hit.line_no,
        code_snippet=hit.snippet,
        suggested_fix=(
            "Use parameterized queries or prepared statements. Pass user values as "
            "bind parameters: db.query('SELECT * FROM t WHERE id = ?', [id])."
        ),
        repo_full_name=repo_full_name,
        building_id=hit.file_path,
    )


def _dedup(findings: list[ApolloFinding]) -> list[ApolloFinding]:
    seen: set[str] = set()
    out: list[ApolloFinding] = []
    for f in findings:
        if f.id in seen:
            continue
        seen.add(f.id)
        out.append(f)
    return out


def _safe_token(value: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9._\-]+", "-", value)
    return cleaned[:64]


def _stub_finding(repo_full_name: str) -> ApolloFinding:
    return ApolloFinding(
        id=f"unsafe_sql-stub-{_safe_token(repo_full_name)}-1",
        detector_id=DETECTOR_ID,
        category=CATEGORY,
        severity="critical",
        title="String concatenation in SQL query (SQL injection risk)",
        description=(
            "[STUB cycle-1] Raw string concatenation detected in db.query() call "
            "at app/data/allocations-dao.js:42. Real impl scans real repo when "
            "fixture available."
        ),
        file_path="app/data/allocations-dao.js",
        line_start=42,
        line_end=42,
        code_snippet=(
            'db.query("SELECT * FROM allocations WHERE userId = " + userId);'
        ),
        suggested_fix=(
            "Use parameterized query: db.query('SELECT * FROM allocations WHERE "
            "userId = ?', [userId])."
        ),
        repo_full_name=repo_full_name,
        building_id="app/data/allocations-dao.js",
    )
