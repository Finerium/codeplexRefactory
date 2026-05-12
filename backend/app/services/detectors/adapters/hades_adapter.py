"""Hades parser client adapter for Nemesis detectors.

Connects to real ParserService when available. Falls back to canned ParsedRepo
shaped after NodeGoat slice so cycle 1 dispatcher smoke can ship before any real
fixture exists.

Per _meta/contracts/hades-to-nemesis.md ParserService interface.
"""
from __future__ import annotations

from pathlib import Path
from typing import Any

from app.parsers.types import ParsedFile, ParsedRepo, ParsedSymbol


class ParserAdapter:
    """Adapter to Hades ParserService.

    When real ParserService imports cleanly, delegates. Otherwise serves a
    canned NodeGoat-shaped ParsedRepo so cycle 1 dispatcher smoke can run.
    """

    def __init__(self, real_parser: Any | None = None) -> None:
        self._real = real_parser
        self._is_stub = real_parser is None

    @property
    def is_stub(self) -> bool:
        return self._is_stub

    async def parse_repo(
        self,
        repo_root: Path,
        exclude_globs: list[str] | None = None,
    ) -> ParsedRepo:
        if self._real is not None:
            return await self._real.parse_repo(repo_root, exclude_globs)
        return _canned_nodegoat_repo(repo_root)

    async def parse_file(self, file_path: Path) -> ParsedFile:
        if self._real is not None:
            return await self._real.parse_file(file_path)
        return _canned_file(str(file_path))

    async def query_tree(
        self,
        file_path: Path,
        query_source: str,
    ) -> list[dict]:
        if self._real is not None:
            return await self._real.query_tree(file_path, query_source)
        return []

    async def find_callsites(
        self,
        repo_root: Path,
        symbol_name: str,
        language: str | None = None,
    ) -> list[ParsedSymbol]:
        if self._real is not None:
            return await self._real.find_callsites(repo_root, symbol_name, language)
        return []


def _canned_nodegoat_repo(repo_root: Path) -> ParsedRepo:
    """Canned NodeGoat-shaped ParsedRepo for cycle 1 smoke fallback.

    Used when real ParserService unavailable in test env. Real NodeGoat fork
    parsing happens once Hades fixtures + real fork populated cycle 2+.
    """
    files = [
        ParsedFile(
            file_path="app/config/config.js",
            language="javascript",
            line_count=42,
            symbols=[
                ParsedSymbol(
                    name="dbUrl",
                    kind="variable",
                    file_path="app/config/config.js",
                    line_start=12,
                    line_end=12,
                    column_start=0,
                    column_end=10,
                )
            ],
            imports=["dotenv"],
        ),
        ParsedFile(
            file_path="app/routes/index.js",
            language="javascript",
            line_count=180,
            symbols=[
                ParsedSymbol(
                    name="adminRoute",
                    kind="function",
                    file_path="app/routes/index.js",
                    line_start=87,
                    line_end=110,
                    column_start=0,
                    column_end=80,
                )
            ],
            imports=["express", "passport"],
        ),
        ParsedFile(
            file_path="app/data/allocations-dao.js",
            language="javascript",
            line_count=95,
            symbols=[
                ParsedSymbol(
                    name="searchAllocations",
                    kind="function",
                    file_path="app/data/allocations-dao.js",
                    line_start=34,
                    line_end=58,
                    column_start=0,
                    column_end=80,
                )
            ],
            imports=["mongodb"],
        ),
        ParsedFile(
            file_path="package.json",
            language="javascript",
            line_count=50,
            symbols=[],
            imports=["jquery", "express", "mongodb"],
        ),
        ParsedFile(
            file_path="app/controllers/profile.js",
            language="javascript",
            line_count=320,
            symbols=[
                ParsedSymbol(
                    name="profileController",
                    kind="function",
                    file_path="app/controllers/profile.js",
                    line_start=1,
                    line_end=320,
                    column_start=0,
                    column_end=80,
                )
            ],
            imports=["express", "mongodb"],
        ),
    ]
    return ParsedRepo(
        repo_root=str(repo_root),
        files=files,
        languages_used=["javascript"],
        stats={
            "total_files": len(files),
            "total_loc": sum(f.line_count for f in files),
            "parse_errors": 0,
            "count_javascript": len(files),
        },
    )


def _canned_file(file_path: str) -> ParsedFile:
    return ParsedFile(
        file_path=file_path,
        language="javascript",
        line_count=0,
        symbols=[],
        imports=[],
    )


_singleton: ParserAdapter | None = None


def get_parser_adapter(force_real: bool = False) -> ParserAdapter:
    """Singleton accessor.

    `force_real=True` attempts to import real ParserService and raises if
    unavailable (use in production / integration tests). Default tries real
    then falls back to canned stub.
    """
    global _singleton
    if _singleton is not None:
        return _singleton

    real = None
    try:
        from app.parsers import get_parser_service

        real = get_parser_service()
    except (ImportError, AttributeError):
        if force_real:
            raise
        real = None

    _singleton = ParserAdapter(real_parser=real)
    return _singleton


def reset_parser_adapter() -> None:
    """Test helper: reset singleton so next call rebinds."""
    global _singleton
    _singleton = None
