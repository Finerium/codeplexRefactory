"""Parser Pydantic types (Hades Wave 3 producer).

Schema matches Pythia contract `_meta/contracts/hades-to-nemesis.md` lines 22-74
and `_meta/contracts/hades-to-pandora.md` lines 22-87 verbatim. Nemesis +
Pandora consume in-process; Demeter persists ParsedRepo cache.

11-language pack lock per PRD D17:
- TypeScript, JavaScript (tsx/jsx variants handled)
- Python
- Go, Java, C, C++, Rust
- Ruby, PHP, Kotlin, Swift
"""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Language = Literal[
    "typescript",
    "javascript",
    "python",
    "go",
    "java",
    "c",
    "cpp",
    "rust",
    "ruby",
    "php",
    "kotlin",
    "swift",
]

# Iteration source for cold-start H3 benchmark + smoke tests.
SUPPORTED_LANGUAGES: tuple[Language, ...] = (
    "typescript",
    "javascript",
    "python",
    "go",
    "java",
    "c",
    "cpp",
    "rust",
    "ruby",
    "php",
    "kotlin",
    "swift",
)


SymbolKind = Literal[
    "function",
    "method",
    "class",
    "interface",
    "type",
    "variable",
    "constant",
    "import",
    "export",
]


class ParsedSymbol(BaseModel):
    """A named symbol extracted from source.

    Position fields use 1-indexed line numbers (tree-sitter native is 0-indexed;
    Hades increments before returning to match editor + GitHub link convention).
    """

    model_config = ConfigDict(frozen=True)

    name: str
    kind: SymbolKind
    file_path: str
    line_start: int = Field(ge=1)
    line_end: int = Field(ge=1)
    column_start: int = Field(ge=0)
    column_end: int = Field(ge=0)
    decorators: list[str] = Field(default_factory=list)


class ParsedFile(BaseModel):
    """Per-file parse result.

    `parse_error` populated if tree-sitter detected ERROR node; partial symbols
    still returned best-effort.
    """

    model_config = ConfigDict(frozen=True)

    file_path: str
    language: Language
    line_count: int = Field(ge=0)
    symbols: list[ParsedSymbol] = Field(default_factory=list)
    imports: list[str] = Field(default_factory=list)
    parse_error: str | None = None


class ParsedRepo(BaseModel):
    """Whole-repo parse result.

    `stats` dict carries `total_files`, `total_loc`, `parse_errors`, plus
    `count_<language>` per language encountered.
    """

    model_config = ConfigDict(frozen=True)

    repo_root: str
    files: list[ParsedFile] = Field(default_factory=list)
    languages_used: list[Language] = Field(default_factory=list)
    stats: dict[str, int] = Field(default_factory=dict)


# Extension to Language map (used by service to detect language from file path).
# tsx + jsx route to TypeScript / JavaScript respectively per Hades agent prompt
# Section 5 LANGUAGE_PACK_MAP convention.
EXTENSION_TO_LANGUAGE: dict[str, Language] = {
    # TypeScript family
    ".ts": "typescript",
    ".tsx": "typescript",
    ".mts": "typescript",
    ".cts": "typescript",
    # JavaScript family
    ".js": "javascript",
    ".jsx": "javascript",
    ".mjs": "javascript",
    ".cjs": "javascript",
    # Python
    ".py": "python",
    ".pyi": "python",
    # Go
    ".go": "go",
    # Java
    ".java": "java",
    # C
    ".c": "c",
    ".h": "c",
    # C++
    ".cpp": "cpp",
    ".cc": "cpp",
    ".cxx": "cpp",
    ".hpp": "cpp",
    ".hh": "cpp",
    ".hxx": "cpp",
    # Rust
    ".rs": "rust",
    # Ruby
    ".rb": "ruby",
    # PHP
    ".php": "php",
    # Kotlin
    ".kt": "kotlin",
    ".kts": "kotlin",
    # Swift
    ".swift": "swift",
}


# Default exclude globs per contract Asumption 5.
DEFAULT_EXCLUDE_GLOBS: tuple[str, ...] = (
    "**/node_modules/**",
    "**/.git/**",
    "**/.venv/**",
    "**/__pycache__/**",
    "**/target/**",
    "**/dist/**",
    "**/build/**",
    "**/*.min.js",
    "**/*.bundle.js",
    "**/vendor/**",
    "**/.next/**",
    "**/coverage/**",
)
