"""Tree-sitter parser package (Hades Wave 3).

Re-exports public types + service singleton accessor for downstream
Nemesis + Pandora consume per `_meta/contracts/hades-to-{nemesis,pandora}.md`.
"""
from app.parsers.service import ParserService, get_parser_service
from app.parsers.types import (
    Language,
    ParsedFile,
    ParsedRepo,
    ParsedSymbol,
    SUPPORTED_LANGUAGES,
)

__all__ = [
    "Language",
    "ParsedFile",
    "ParsedRepo",
    "ParsedSymbol",
    "ParserService",
    "SUPPORTED_LANGUAGES",
    "get_parser_service",
]
