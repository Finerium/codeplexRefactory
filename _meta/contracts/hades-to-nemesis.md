# Contract: Hades to Nemesis

**Edge type**: intra-wave (Wave 3 internal)
**Wave**: Wave 3 producer to Wave 3 consumer
**Status**: locked
**Authored**: 2026-05-12 15:50 WIB

## Producer

**Worker**: Hades (Wave 3)
**Domain**: FastAPI scaffold + tree-sitter 11-language lazy-load (TypeScript, JavaScript, Python, Go, Java, C, C++, Rust, Ruby, PHP, Kotlin, Swift) per PRD D17. Cold start budget <300ms total via lazy load (H3 validation). Hades exposes parser API for repo scanning + per-file parse + symbol lookup. Tree-sitter via `tree-sitter-language-pack` (Phase B Topic 3c MIT permissive grammars).

## Consumer

**Worker**: Nemesis (Wave 3)
**Domain**: 5 Apollo detector + Argus CVSS scoring + 5 spec-drift pattern A-E. Nemesis consumes Hades parser API for batch repo scan: walk all source files, parse to AST, run detector queries (tree-sitter queries per Phase B Topic 3c), produce findings.

## Output schema (producer to consumer)

Hades exposes parser API as Python module + FastAPI endpoint (Nemesis can call in-process or via HTTP if running separately).

```python
# backend/app/parsers/__init__.py (Hades authors)
from typing import Literal, AsyncIterator
from pydantic import BaseModel
from pathlib import Path
import asyncio

Language = Literal[
    "typescript", "javascript", "python", "go", "java",
    "c", "cpp", "rust", "ruby", "php", "kotlin", "swift",
]


class ParsedSymbol(BaseModel):
    """A named symbol extracted from source."""
    name: str
    kind: Literal[
        "function", "method", "class", "interface", "type",
        "variable", "constant", "import", "export",
    ]
    file_path: str
    line_start: int
    line_end: int
    column_start: int
    column_end: int
    /** Optional decorator/annotation list (e.g., FastAPI @app.get, Spring @RequestMapping). */
    decorators: list[str] = []


class ParsedFile(BaseModel):
    """Per-file parse result."""
    file_path: str
    language: Language
    /** Total source lines (LOC). */
    line_count: int
    /** Top-level symbols. */
    symbols: list[ParsedSymbol]
    /** Imports declared in file. */
    imports: list[str]
    /** Parse error if file failed to parse cleanly. */
    parse_error: str | None = None


class ParsedRepo(BaseModel):
    """Whole-repo parse result."""
    repo_root: str
    /** Files actually parsed (excludes binary, node_modules, etc). */
    files: list[ParsedFile]
    /** Languages encountered. */
    languages_used: list[Language]
    /** Parse stats. */
    stats: dict[str, int]  # {total_files, total_loc, parse_errors, per_language_count}


class ParserService:
    """Tree-sitter parser service Hades exposes."""

    async def parse_file(self, file_path: Path) -> ParsedFile:
        """Parse single file. Language detected from extension.

        Returns ParsedFile with parse_error set if syntax errors found.
        Lazy-loads tree-sitter grammar for the language on first use.
        """
        ...

    async def parse_repo(
        self,
        repo_root: Path,
        exclude_globs: list[str] = None,
    ) -> ParsedRepo:
        """Parse entire repo, returns aggregated result.

        Default exclude_globs:
          - node_modules, .git, .venv, __pycache__, target, dist, build
          - *.min.js, *.bundle.js, vendor/*
        Concurrent file parsing per available CPU; respects asyncio semaphore (max 16 in flight).
        """
        ...

    async def query_tree(
        self,
        file_path: Path,
        query_source: str,
    ) -> list[dict]:
        """Run tree-sitter query on file's AST.

        query_source = tree-sitter query DSL string (e.g., "(function_declaration name: (identifier) @name)").
        Returns list of captures with text + position.
        Used by Nemesis detectors via tree-sitter query patterns per Phase B Topic 3c.
        """
        ...

    async def find_callsites(
        self,
        repo_root: Path,
        symbol_name: str,
        language: Language | None = None,
    ) -> list[ParsedSymbol]:
        """Find all callsites of a symbol across repo.

        Used by Pandora for proposal-author impact analysis (see hades-to-pandora.md).
        """
        ...


def get_parser_service() -> ParserService:
    """Singleton accessor."""
    ...
```

HTTP fallback endpoint if Nemesis runs separately (Wave 3 default is in-process):

```python
# backend/app/api/parser.py (Hades authors HTTP wrapper)
from fastapi import APIRouter, Depends
from pydantic import BaseModel

router = APIRouter(prefix="/api/parser")


@router.post("/parse-repo", response_model=ParsedRepo)
async def parse_repo_endpoint(
    body: dict,  # { repo_root: str, exclude_globs: list[str] }
    session: dict = Depends(require_session),
    parser: ParserService = Depends(get_parser_service),
) -> ParsedRepo:
    return await parser.parse_repo(Path(body["repo_root"]), body.get("exclude_globs"))
```

Nemesis consumer pattern:

```python
# backend/app/services/detectors/__init__.py (Nemesis authors)
from app.parsers import get_parser_service, ParsedRepo, ParsedSymbol
from app.services.findings import FindingService


async def scan_repo_for_findings(repo_root: Path) -> list[Finding]:
    parser = get_parser_service()
    parsed = await parser.parse_repo(repo_root)
    findings = []
    findings.extend(await detect_hardcoded_secrets(parsed))
    findings.extend(await detect_outdated_dependencies(parsed))
    findings.extend(await detect_missing_auth(parsed))
    findings.extend(await detect_unsafe_sql(parsed))
    findings.extend(await detect_complex_untested(parsed))
    return findings
```

## Storage location

- Parser service: `backend/app/parsers/__init__.py` (Hades)
- Tree-sitter grammar loaders: `backend/app/parsers/loaders/{<language>}.py` (Hades, lazy-loaded)
- Detector queries (tree-sitter query DSL strings): `backend/app/services/detectors/queries/{<detector>}.scm` (Nemesis)
- HTTP wrapper endpoint: `backend/app/api/parser.py` (Hades)
- In-process call (Wave 3 default): Nemesis imports `from app.parsers import get_parser_service` directly

## Asumption baked

1. tree-sitter-language-pack provides 11 language grammars MIT permissive (Phase B Topic 3c anchor).
2. Lazy load via grammar module imports on first `parse_file` call per language; total cold start <300ms (H3 hypothesis).
3. Parsing in-process Wave 3 default; no separate process unless H3 fails benchmarks.
4. ParsedRepo cached in Demeter via materialized view-like pattern; subsequent parse_repo calls reuse cached if repo HEAD unchanged.
5. Exclude globs hardcoded list per common ecosystems; Nemesis can override per detector if needed.
6. Tree-sitter queries (.scm files) live with the detector that uses them, not in parser module; parser provides generic `query_tree()` execution.

## Validation steps

**Producer responsibility (Hades)**:
- 11 language grammars available via lazy load; first parse_file for each language < 300ms cold.
- parse_repo handles 5000-file repo without OOM (asyncio semaphore caps concurrency).
- query_tree executes tree-sitter query DSL correctly; returns captures with positions.
- find_callsites returns symbol uses across repo via tree-sitter parsing (no regex fallback unless tree-sitter grammar lacks expression-level granularity).
- Smoke test: parse NodeGoat fork (TypeScript/JavaScript heavy), parse fastapi/full-stack-fastapi-template (Python heavy), parse OWASP/PyGoat (Python), all complete < 5 seconds.

**Consumer responsibility (Nemesis)**:
- Import `get_parser_service` in-process; do not call HTTP wrapper (overhead unnecessary).
- 5 Apollo detectors use tree-sitter queries via `parser.query_tree()`.
- Spec-drift patterns A-E primarily use git history + OpenSpec metadata; tree-sitter for AST-diff (Pattern E commit-bypass detection).
- Smoke test: 5/5 detectors fire on NodeGoat fork (authentic findings per PRD).
- 5/5 spec-drift patterns trigger on prepared demo dataset.

## Edge case handling

- File too large (> 10 MB): Hades skips with `parse_error: "File too large"`; Nemesis treats as non-target.
- Binary file (no language detected): Hades skips silently; not included in `files`.
- Parse error (syntax error in source): Hades returns ParsedFile with `parse_error` populated + best-effort partial symbols.
- Tree-sitter query syntax invalid: `query_tree` raises ValueError; Nemesis catches + logs detector bug; falls back to regex-based detector if mandatory.
- Repo not local (URL passed): Hades returns 400; clone-first responsibility on calling code (typically Pandora or webhook handler).

## Open questions

- Tree-sitter version pin: tree-sitter-language-pack ships compatible grammars; Hades validates on first call.
- AST cache invalidation: when repo files change (webhook event), Demeter invalidates cached ParsedRepo by repo + HEAD sha; Hades re-parses on next call.

## Reference

- Metis Agentic Structure md Section 2 DAG: Hades parser API consumed by Nemesis
- Metis Section 5.6 Hades + Nemesis ship criteria
- PRD Section 17.2 (Python 3.12 + FastAPI + tree-sitter 11-language locked)
- PRD D17 (Multi-language tree-sitter 11-language LOCKED)
- PRD Section 9.5 (Health Mode 5 Apollo detector patterns)
- PRD Section 11 (5 spec-drift pattern A-E definitions)
- Phase B Deep Research Topic 3c (tree-sitter-language-pack MIT permissive)
- Phase B H3 hypothesis (cold start budget <300ms validation Wave 3)
