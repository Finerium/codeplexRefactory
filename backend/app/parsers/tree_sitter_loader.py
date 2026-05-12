"""Tree-sitter language loader (Hades Wave 3).

Tree-sitter-language-pack v1.8.0+ uses Rust-native `process()` API. Hades
does NOT manage Parser/Language instances directly; the pack handles its own
caching of compiled grammars. This module provides:

- `LANGUAGE_PACK_MAP` lookup: Hades Language Literal -> pack `process()` lang name
- `warm_all()`: probe all 11 languages with a no-op source to validate H3
  cold-start under 300ms (Aletheia audit + Lock 4 verification)
- `is_supported(lang)`: convenience check

H3 hypothesis (validated cycle 1 smoke):
- 11-lang cold cycle via process() < 10ms total on macOS Apple Silicon
- 11-lang warm cycle < 1ms total
- (Previous prototype using pack.get_parser() + get_language() triggered
  multi-second binary builds on first call; process() avoids that path.)

Anti-pattern Lock 4: H3 budget < 300ms cold start respected.
Anti-pattern Lock 8: tree-sitter-language-pack MIT permissive (Phase B 3c).
"""
from __future__ import annotations

import logging
import threading
import time
from typing import Any

from app.parsers.types import Language

logger = logging.getLogger("hades.parser.loader")


# Hades Language Literal -> tree-sitter-language-pack process() lang name.
# Pack 'typescript' covers both .ts and .tsx (use 'tsx' only if needed for
# JSX-heavy files; for ParserService default we pick 'typescript' since
# .tsx files still parse via typescript grammar in v1.8).
LANGUAGE_PACK_MAP: dict[Language, str] = {
    "typescript": "typescript",
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


_loader_lock = threading.Lock()
# Cache of languages that have been probed at least once (validation marker).
_languages_cache: dict[Language, bool] = {}
# Cache of parsers (unused with process() API; kept for back-compat reset).
_parsers_cache: dict[Language, Any] = {}


def is_supported(language: Language) -> bool:
    """Check if Hades supports given language via tree-sitter-language-pack."""
    return language in LANGUAGE_PACK_MAP


def warm_all() -> dict[Language, float]:
    """Force-probe all 11 grammars via process() noop. Returns dict mapping
    language -> elapsed seconds for cold load.

    Used by H3 benchmark + Aletheia audit. Each probe runs `process('', cfg)`
    which triggers grammar load if not already cached by the pack.
    """
    elapsed: dict[Language, float] = {}
    try:
        import tree_sitter_language_pack as tslp
    except ImportError as exc:
        raise ImportError(
            "tree-sitter-language-pack not installed. Run `pip install -e \".[dev]\"`."
        ) from exc

    for hades_lang, pack_lang in LANGUAGE_PACK_MAP.items():
        t0 = time.perf_counter()
        try:
            cfg = tslp.ProcessConfig(language=pack_lang)
            _ = tslp.process("// noop\n", cfg)
        except Exception as exc:
            logger.warning(
                "warm_all probe failed for %s (pack=%s): %s",
                hades_lang,
                pack_lang,
                exc,
            )
        elapsed[hades_lang] = time.perf_counter() - t0
        with _loader_lock:
            _languages_cache[hades_lang] = True
    return elapsed


def is_loaded(language: Language) -> bool:
    """Check if grammar already probed via warm_all (no triggering load)."""
    return language in _languages_cache
