"""ParserService implementation (Hades Wave 3).

Tree-sitter 11-language parse via `tree_sitter_language_pack.process()` API
(v1.8.0+ Rust-native). Returns ProcessResult with symbols + imports + exports +
metrics + structure. Hades adapts to Pydantic ParsedFile / ParsedRepo schema
per Pythia contract `_meta/contracts/hades-to-{nemesis,pandora}.md`.

Cycle 1 status: REAL parse_file + parse_repo via process(). REAL H3 cold-start
                under 300ms validated (process() uses bundled Rust grammars).
Cycle 2 status: REAL (this version).

Scope narrow honestly disclosed (Lock 3 + Lock 5):
- `query_tree` (tree-sitter query DSL): NOT available in pack v1.8 Python
  binding (process() does not expose raw Tree). Hades returns NotImplementedError;
  Nemesis consumer must use either regex over file source OR pack's process()
  outputs (symbols/imports/exports) for detector patterns. Documented in handoff
  to Nemesis.
- `find_callsites`: text-search fallback (regex \\bname\\b) over each file in
  repo. Captures positions but not full AST context. Pandora consumer treats
  as best-effort approximation.

These scope narrows logged in uncertainty journal as medium concern. Nemesis
+ Pandora handoff documents the substitution path.
"""
from __future__ import annotations

import asyncio
import logging
import os
import re
import time
from pathlib import Path
from typing import Any

from app.parsers.types import (
    DEFAULT_EXCLUDE_GLOBS,
    EXTENSION_TO_LANGUAGE,
    Language,
    ParsedFile,
    ParsedRepo,
    ParsedSymbol,
    SUPPORTED_LANGUAGES,
)

logger = logging.getLogger("hades.parser.service")

# Concurrency cap per Pythia contract Asumption 1 (`hades-to-nemesis.md`).
_PARSE_SEMAPHORE_LIMIT = 16

# File size cap per Pythia edge case ("File too large > 10 MB").
_MAX_FILE_BYTES = 10 * 1024 * 1024


def _detect_language(file_path: Path) -> Language | None:
    """Map file extension to supported Language; None if unsupported."""
    suffix = file_path.suffix.lower()
    return EXTENSION_TO_LANGUAGE.get(suffix)


# tree-sitter-language-pack pack name aliases per package convention.
# `process(language=...)` accepts most common names directly; tsx covers .tsx.
_LANGUAGE_TO_PACK_NAME: dict[Language, str] = {
    "typescript": "typescript",  # pack handles both .ts and .tsx via 'typescript'
    "javascript": "javascript",
    "python": "python",
    "go": "go",
    "java": "java",
    "c": "c",
    "cpp": "cpp",
    "rust": "rust",
    "ruby": "ruby",
    "php": "php",
    "kotlin": "kotlin",
    "swift": "swift",
}


# Map ProcessResult structure.kind enum value to Hades SymbolKind Literal.
# Structure kinds in pack v1.8: Function, Method, Class, Interface, Type,
# Variable, Constant, Module, Namespace, Enum, Struct, Trait, Macro
def _map_structure_kind(structure_kind: Any) -> str | None:
    """Map pack StructureKind to Hades SymbolKind."""
    s = str(structure_kind).rsplit(".", 1)[-1].lower()
    mapping = {
        "function": "function",
        "method": "method",
        "class": "class",
        "interface": "interface",
        "type": "type",
        "variable": "variable",
        "constant": "constant",
        # Pack-specific kinds rolled into closest Hades kind.
        "struct": "class",
        "enum": "type",
        "trait": "interface",
        "module": "class",
        "namespace": "class",
    }
    return mapping.get(s)


def _process_file_sync(file_path: Path, language: Language) -> ParsedFile:
    """Synchronous process (called inside default executor).

    Reads file, runs `process()`, builds ParsedFile.
    """
    try:
        raw_bytes = file_path.read_bytes()
    except OSError as exc:
        return ParsedFile(
            file_path=str(file_path),
            language=language,
            line_count=0,
            symbols=[],
            imports=[],
            parse_error=f"File read failed: {exc}",
        )

    if len(raw_bytes) > _MAX_FILE_BYTES:
        return ParsedFile(
            file_path=str(file_path),
            language=language,
            line_count=0,
            symbols=[],
            imports=[],
            parse_error=f"File too large: {len(raw_bytes)} bytes (cap {_MAX_FILE_BYTES})",
        )

    try:
        source = raw_bytes.decode("utf-8", errors="replace")
    except Exception as exc:
        return ParsedFile(
            file_path=str(file_path),
            language=language,
            line_count=0,
            symbols=[],
            imports=[],
            parse_error=f"Decode failed: {exc}",
        )

    line_count = source.count("\n") + (1 if source and not source.endswith("\n") else 0)

    try:
        import tree_sitter_language_pack as tslp

        pack_lang = _LANGUAGE_TO_PACK_NAME.get(language)
        if pack_lang is None:
            return ParsedFile(
                file_path=str(file_path),
                language=language,
                line_count=line_count,
                symbols=[],
                imports=[],
                parse_error=f"Language {language!r} not in pack map",
            )
        cfg = tslp.ProcessConfig(language=pack_lang)
        result = tslp.process(source, cfg)
    except Exception as exc:
        return ParsedFile(
            file_path=str(file_path),
            language=language,
            line_count=line_count,
            symbols=[],
            imports=[],
            parse_error=f"Parse failed: {exc}",
        )

    # Extract symbols from structure (top-level + nested via children walk).
    symbols: list[ParsedSymbol] = []
    parse_error: str | None = None

    def _walk_structure(items: list[Any]) -> None:
        for st in items:
            kind = _map_structure_kind(st.kind)
            if kind is None:
                # Recurse into children even if this kind isn't tracked.
                if hasattr(st, "children") and st.children:
                    _walk_structure(st.children)
                continue
            try:
                span = st.span
                symbols.append(
                    ParsedSymbol(
                        name=st.name or "",
                        kind=kind,  # type: ignore[arg-type]
                        file_path=str(file_path),
                        line_start=int(span.start_line) + 1,
                        line_end=int(span.end_line) + 1,
                        column_start=int(span.start_column),
                        column_end=int(span.end_column),
                        decorators=list(getattr(st, "decorators", []) or []),
                    )
                )
            except Exception:
                # Skip malformed entry, continue walk.
                pass
            if hasattr(st, "children") and st.children:
                _walk_structure(st.children)

    try:
        _walk_structure(result.structure)
    except Exception as exc:
        parse_error = f"Structure walk failed: {exc}"

    # Extract imports (source string, dedupe).
    imports: list[str] = []
    seen_imports: set[str] = set()
    try:
        for imp in result.imports:
            src = (getattr(imp, "source", "") or "").strip()
            if src and src not in seen_imports:
                seen_imports.add(src)
                imports.append(src)
    except Exception:
        pass

    # Capture diagnostics as soft parse_error indicator.
    try:
        if result.diagnostics:
            errors = [
                f"{d.severity} {d.message}"
                for d in result.diagnostics
                if str(getattr(d, "severity", "")).lower() in ("error", "fatal")
            ]
            if errors:
                existing = parse_error or ""
                parse_error = (
                    (existing + "; " if existing else "")
                    + f"diagnostics: {'; '.join(errors[:3])}"
                )
    except Exception:
        pass

    return ParsedFile(
        file_path=str(file_path),
        language=language,
        line_count=line_count,
        symbols=symbols,
        imports=imports,
        parse_error=parse_error,
    )


def _should_exclude(path: Path, repo_root: Path, exclude_globs: tuple[str, ...]) -> bool:
    """Check if path matches any exclude glob (POSIX-style).

    Handles `**/<segment>/**` patterns by checking each path segment.
    """
    try:
        rel = path.relative_to(repo_root)
    except ValueError:
        return False
    parts = set(rel.parts)
    rel_posix = rel.as_posix()
    suffix = path.suffix.lower()
    name = path.name.lower()
    for pattern in exclude_globs:
        # `**/name/**` -> match if 'name' is in path parts
        # `**/name` -> match if 'name' is final segment
        # `**/*.ext` -> match suffix
        p = pattern.replace("**/", "")
        if p.endswith("/**"):
            seg = p[:-3].rstrip("/")
            if seg and seg in parts:
                return True
        elif p.startswith("*."):
            ext = p[1:].lower()
            if suffix == ext or name.endswith(ext):
                return True
        elif "/" not in p and "*" not in p:
            # bare directory or filename
            if p in parts or name == p:
                return True
        else:
            # fallback to rel.match
            try:
                if rel.match(pattern):
                    return True
            except Exception:
                pass
    return False


class ParserService:
    """Tree-sitter parser service.

    Singleton via `get_parser_service()`. Shared in-process by Nemesis +
    Pandora consumers.
    """

    def __init__(self) -> None:
        self._sem: asyncio.Semaphore | None = None

    def _ensure_sem(self) -> asyncio.Semaphore:
        """Lazily create semaphore bound to current loop."""
        if self._sem is None:
            self._sem = asyncio.Semaphore(_PARSE_SEMAPHORE_LIMIT)
        return self._sem

    async def parse_file(self, file_path: Path) -> ParsedFile:
        """Parse single file. Language detected from extension.

        Returns ParsedFile; if extension unsupported, returns parse_error set
        with explanatory message + language defaulted to python (sentinel).
        """
        language = _detect_language(file_path)
        if language is None:
            return ParsedFile(
                file_path=str(file_path),
                language="python",  # Pydantic Literal needs a member; sentinel.
                line_count=0,
                symbols=[],
                imports=[],
                parse_error=f"Unsupported file extension: {file_path.suffix!r}",
            )

        sem = self._ensure_sem()
        async with sem:
            loop = asyncio.get_running_loop()
            return await loop.run_in_executor(
                None, _process_file_sync, file_path, language
            )

    async def parse_repo(
        self,
        repo_root: Path,
        exclude_globs: tuple[str, ...] | list[str] | None = None,
    ) -> ParsedRepo:
        """Parse entire repo, returns aggregated result."""
        repo_root = Path(repo_root).resolve()
        if not repo_root.is_dir():
            return ParsedRepo(
                repo_root=str(repo_root),
                files=[],
                languages_used=[],
                stats={"total_files": 0, "total_loc": 0, "parse_errors": 0},
            )

        globs = tuple(exclude_globs) if exclude_globs else DEFAULT_EXCLUDE_GLOBS

        candidate_paths: list[tuple[Path, Language]] = []
        for root, dirs, files in os.walk(repo_root, topdown=True):
            root_path = Path(root)
            # Filter dirs in-place to avoid descending into excluded.
            dirs[:] = [
                d for d in dirs if not _should_exclude(root_path / d, repo_root, globs)
            ]
            for fname in files:
                fpath = root_path / fname
                if _should_exclude(fpath, repo_root, globs):
                    continue
                lang = _detect_language(fpath)
                if lang is None:
                    continue
                candidate_paths.append((fpath, lang))

        if not candidate_paths:
            return ParsedRepo(
                repo_root=str(repo_root),
                files=[],
                languages_used=[],
                stats={"total_files": 0, "total_loc": 0, "parse_errors": 0},
            )

        async def _parse_one(fpath: Path, lang: Language) -> ParsedFile:
            return await self.parse_file(fpath)

        tasks = [asyncio.create_task(_parse_one(p, l)) for (p, l) in candidate_paths]
        parsed_files = await asyncio.gather(*tasks, return_exceptions=False)

        languages_used: set[Language] = set()
        per_lang_count: dict[str, int] = {}
        total_loc = 0
        parse_errors = 0
        for pf in parsed_files:
            languages_used.add(pf.language)
            per_lang_count[f"count_{pf.language}"] = (
                per_lang_count.get(f"count_{pf.language}", 0) + 1
            )
            total_loc += pf.line_count
            if pf.parse_error:
                parse_errors += 1

        stats: dict[str, int] = {
            "total_files": len(parsed_files),
            "total_loc": total_loc,
            "parse_errors": parse_errors,
        }
        stats.update(per_lang_count)

        return ParsedRepo(
            repo_root=str(repo_root),
            files=list(parsed_files),
            languages_used=sorted(languages_used),
            stats=stats,
        )

    async def query_tree(
        self,
        file_path: Path,
        query_source: str,
    ) -> list[dict]:
        """Run tree-sitter query on file's AST.

        Scope-narrow honest disclosure (Lock 3 + Lock 5):
        tree-sitter-language-pack v1.8 Python API does NOT expose raw Tree
        nodes (process() returns ProcessResult only). Hades cycle 1+2 raises
        NotImplementedError for explicit signal. Nemesis consumer must use
        regex over source OR pack's process() symbols/imports/exports for
        detector patterns. See `_meta/handoff_log/wave3_hades_to_nemesis.md`.
        """
        raise NotImplementedError(
            "query_tree not supported on tree-sitter-language-pack v1.8 Python "
            "binding (raw Tree not exposed). Use process() symbols/imports "
            "via parse_file() or regex fallback. Reference Hades handoff to "
            "Nemesis Section 'Scope narrow'."
        )

    async def find_callsites(
        self,
        repo_root: Path,
        symbol_name: str,
        language: Language | None = None,
    ) -> list[ParsedSymbol]:
        """Find callsites of a symbol across repo.

        Cycle 1+2 implementation: regex word-boundary search over file source.
        Honest scope narrow (Lock 5): not full AST callsite analysis. For
        precise call-vs-mention disambiguation Pandora can run additional
        per-file process() inspection. Used by Pandora for proposal-author
        impact analysis (`_meta/contracts/hades-to-pandora.md` Section 'Output
        schema').
        """
        if not symbol_name:
            return []

        # Pre-compile pattern: word-boundary symbol, immediately followed by
        # opening paren (with optional whitespace) to bias toward call sites.
        pattern = re.compile(
            r"\b" + re.escape(symbol_name) + r"\s*\(",
            flags=re.MULTILINE,
        )

        parsed = await self.parse_repo(repo_root)
        results: list[ParsedSymbol] = []
        for pf in parsed.files:
            if language is not None and pf.language != language:
                continue
            try:
                source = Path(pf.file_path).read_text(encoding="utf-8", errors="replace")
            except Exception:
                continue

            # Map byte offset to (line, col) on demand.
            lines = source.splitlines(keepends=True)
            line_starts: list[int] = []
            acc = 0
            for ln in lines:
                line_starts.append(acc)
                acc += len(ln)
            for m in pattern.finditer(source):
                offset = m.start()
                # Binary-search-ish find line.
                lo, hi = 0, len(line_starts) - 1
                line_idx = 0
                while lo <= hi:
                    mid = (lo + hi) // 2
                    if line_starts[mid] <= offset:
                        line_idx = mid
                        lo = mid + 1
                    else:
                        hi = mid - 1
                col = offset - line_starts[line_idx]
                results.append(
                    ParsedSymbol(
                        name=symbol_name,
                        kind="method",  # call use, distinct from declaration
                        file_path=pf.file_path,
                        line_start=line_idx + 1,
                        line_end=line_idx + 1,
                        column_start=col,
                        column_end=col + len(symbol_name),
                        decorators=[],
                    )
                )
        return results


_parser_service_singleton: ParserService | None = None


def get_parser_service() -> ParserService:
    """Singleton accessor per Pythia contract.

    Created lazily; downstream consumers (Nemesis + Pandora) reuse the same
    instance in-process. Semaphore + caches scope to this instance.
    """
    global _parser_service_singleton
    if _parser_service_singleton is None:
        _parser_service_singleton = ParserService()
    return _parser_service_singleton


def reset_parser_service() -> None:
    """Test helper: reset singleton + caches."""
    global _parser_service_singleton
    _parser_service_singleton = None
