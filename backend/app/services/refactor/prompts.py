"""Athena persona prompts for Refactor Mode proposal + simulation engine.

Owner: Pandora (Wave 3).

Prompt strings sourced from:
- ``_meta/contracts/triton-to-pandora.md`` lines 112-145 (Athena
  TEST_GEN + IMPL_GEN + DIFF_SERIALIZE + ATHENA_PROPOSAL).
- Hephaestus PromptOpening Athena persona block.
- PRD Section 10 (5 resident personas).
- PRD Section 18.3 (per-resident routing).

Athena routing per PRD Section 18.3:
- ``ATHENA_PROPOSAL``: V4-Pro thinking high (heavy LLM, deep analysis).
- ``ATHENA_TEST_GEN``: V4-Pro thinking high (Turn 1).
- ``ATHENA_IMPL_GEN``: V4-Pro thinking high (Turn 2).
- ``DIFF_SERIALIZE``: V4-Flash non-think (Turn 3, mechanical format).

CRITICAL anti-pattern per Phase B Topic E + Triton client:
multi-turn does NOT replay ``reasoning_content`` from prior turns.
The Triton ``LLMClient.call`` builder strips ``reasoning_content``
from assistant messages before submitting subsequent turns.

Compliance: Lock 1 (no em dash). Lock 2 (no emoji). Lock 4
([INFERRED] notes where Hephaestus PromptOpening Athena block does
not specify a literal field name; this module documents the chosen
field name + reasoning).
"""

from __future__ import annotations

import json
from typing import Mapping


# ---------------------------------------------------------------------------
# Athena persona system prompts
# ---------------------------------------------------------------------------


ATHENA_PROPOSAL_SYSTEM = """You are Athena, the architect resident of Codeplex Chronicle.

Your role: when a user states a refactoring intent in plain language, you:
1. Identify affected files plus dependencies (use parser callsite query results provided as context).
2. Propose 1 to 3 ghost building locations with suggested file paths.
3. Draft an OpenSpec change proposal summary (title plus 1-2 sentence summary).

Tone: thoughtful, architectural reasoning. Cite affected callsite counts when provided. Be concise; the side panel renders your output as cards.

Output format: STRICT JSON. The schema is:
{
  "title": "<3-10 word title>",
  "summary": "<1-2 sentence summary>",
  "affected_files": ["<repo-relative path>", ...],
  "ghost_hints": [
    {
      "ghostId": "ghost-<kebab-case-name>",
      "archetype": "generic-residence" | "generic-warehouse" | "generic-office",
      "label": "<tooltip label>",
      "suggestedFilePath": "<repo-relative path>",
      "connections": [
        { "targetBuildingId": "<existing file path>", "relationship": "import" | "reference" | "callsite" }
      ]
    }
  ],
  "complexity": "simple" | "moderate" | "complex",
  "rationale": "<short architectural reasoning>"
}

Do not include any prose outside the JSON object."""


ATHENA_TEST_GEN_SYSTEM = """You are Athena, the architect resident of Codeplex Chronicle.

Refactor Mode Turn 1 of 3: Generate failing tests for the user's stated intent.

Constraints:
- Output one or more test files in fenced code blocks. Each block MUST start with a header line: `// FILE: <repo-relative path>` (TypeScript / JavaScript) OR `# FILE: <repo-relative path>` (Python).
- Tests MUST fail when run against the current implementation (because the impl does not exist yet). Use the test framework discovered from the repo context (Vitest / Jest / pytest / etc).
- File paths are repo-relative and MUST NOT contain `..` or absolute prefixes. The simulation engine writes them under `drafts/<simulation-id>/` automatically.
- Do not generate the production code yet; that is Turn 2.

Tone: clinical, architectural. Concise comment lines only. Total output budget ~3000 tokens."""


ATHENA_IMPL_GEN_SYSTEM = """You are Athena, the architect resident of Codeplex Chronicle.

Refactor Mode Turn 2 of 3: Generate implementation code that makes Turn 1's failing tests pass.

Constraints:
- Output one or more code files in fenced code blocks. Each block MUST start with a header line: `// FILE: <repo-relative path>` OR `# FILE: <repo-relative path>`.
- The implementation MUST be sufficient to pass the failing tests from Turn 1.
- Files are written to `drafts/<simulation-id>/` sandbox automatically; NEVER reference production paths as targets.
- Honour the repo's existing code style discovered from the context (Python 3.12 + Pydantic v2 / TypeScript strict).
- Do not produce a diff yet; that is Turn 3.

Tone: precise, idiomatic. No commentary outside fenced code blocks. Total output budget ~5000 tokens."""


DIFF_SERIALIZE_SYSTEM = """You are a diff serializer.

Refactor Mode Turn 3 of 3: convert the test plus implementation file changes into a unified diff in the canonical `diff --git a/<path> b/<path>` format.

Constraints:
- Output one fenced ```diff block containing the full unified diff.
- Each file change MUST begin with `diff --git a/<path> b/<path>` followed by the standard `---` / `+++` plus `@@` hunk headers.
- The diff applies cleanly under `git apply --check`. No trailing whitespace, no smart-quote characters, no em dash.
- The file path is relative to the repository root. The drafts sandbox prefix `drafts/<simulation-id>/` is stripped before serialisation; the diff reads as if the changes target production paths (this is what the user downloads on Accept).

Tone: mechanical. No commentary outside the fenced diff. Total output budget ~6000 tokens."""


# ---------------------------------------------------------------------------
# User prompt builders
# ---------------------------------------------------------------------------


def build_proposal_user_prompt(
    user_intent: str,
    repo_slug: str,
    callsite_summary: Mapping[str, int] | None = None,
    sample_files: list[str] | None = None,
) -> str:
    """Build the user-role prompt for the ``ATHENA_PROPOSAL_SYSTEM`` turn.

    Args:
        user_intent: verbatim user input ("I want to add 2FA to login").
        repo_slug: repository slug (``Finerium/codeplexRefactory``).
        callsite_summary: mapping of candidate symbol to callsite count
            (provided by Hades ``find_callsites`` query). Helps Athena
            cite numbers like "the symbol ``loginUser`` has 4
            callsites across auth / session / oauth".
        sample_files: optional list of likely affected file paths so
            Athena anchors the proposal to real repo files.
    """

    parts: list[str] = []
    parts.append(f"Repository: {repo_slug}")
    parts.append(f"User intent: {user_intent}")
    if callsite_summary:
        parts.append("")
        parts.append("Callsite counts from Hades parser (symbol -> count):")
        for symbol, count in sorted(callsite_summary.items()):
            parts.append(f"  - {symbol}: {count}")
    if sample_files:
        parts.append("")
        parts.append("Likely affected files (Hades pre-analysis):")
        for path in sample_files[:20]:
            parts.append(f"  - {path}")
    parts.append("")
    parts.append("Produce the strict JSON response per the system schema.")
    return "\n".join(parts)


def build_test_gen_user_prompt(
    user_intent: str,
    context: Mapping[str, object],
) -> str:
    """Build the user-role prompt for Turn 1 test_gen.

    Args:
        user_intent: verbatim user input.
        context: includes the Athena proposal title + summary + ghost
            hints + sample file contents (Hades parsed). The dict
            keys read by the prompt are documented inline.
    """

    parts: list[str] = []
    parts.append(f"User intent: {user_intent}")
    title = context.get("title")
    summary = context.get("summary")
    if title:
        parts.append(f"Proposal title: {title}")
    if summary:
        parts.append(f"Proposal summary: {summary}")
    ghost_hints = context.get("ghost_hints", [])
    if ghost_hints:
        parts.append("")
        parts.append("Ghost building hints (new files this proposal would create):")
        parts.append(json.dumps(ghost_hints, indent=2))
    sample_files = context.get("sample_files", [])
    if sample_files:
        parts.append("")
        parts.append("Sample existing files (context for test style):")
        parts.append(json.dumps(sample_files, indent=2))
    parts.append("")
    parts.append("Generate the failing tests now per Turn 1 instructions.")
    return "\n".join(parts)


def build_impl_gen_user_prompt(
    user_intent: str,
    test_content: str,
    context: Mapping[str, object],
) -> str:
    """Build the user-role prompt for Turn 2 impl_gen.

    CRITICAL per Phase B Topic E: caller MUST NOT pass
    ``reasoning_content`` from Turn 1 assistant message. Pass only
    the visible ``test_content`` string here. The Triton LLMClient
    builder strips ``reasoning_content`` defensively if the call
    history is passed, but Pandora keeps the contract explicit.
    """

    parts: list[str] = []
    parts.append(f"User intent: {user_intent}")
    title = context.get("title")
    summary = context.get("summary")
    if title:
        parts.append(f"Proposal title: {title}")
    if summary:
        parts.append(f"Proposal summary: {summary}")
    parts.append("")
    parts.append("Failing tests from Turn 1 (visible content only, reasoning_content stripped):")
    parts.append("```")
    parts.append(test_content)
    parts.append("```")
    parts.append("")
    parts.append("Generate the implementation code now per Turn 2 instructions.")
    return "\n".join(parts)


def build_diff_user_prompt(
    test_content: str,
    impl_content: str,
) -> str:
    """Build the user-role prompt for Turn 3 diff_serialize.

    Caller passes the Turn 1 + Turn 2 visible content (no
    reasoning_content). The diff is produced fresh in V4-Flash
    non-think; no thinking budget is needed for mechanical formatting.
    """

    parts: list[str] = []
    parts.append("Turn 1 test files:")
    parts.append("```")
    parts.append(test_content)
    parts.append("```")
    parts.append("")
    parts.append("Turn 2 implementation files:")
    parts.append("```")
    parts.append(impl_content)
    parts.append("```")
    parts.append("")
    parts.append("Produce the unified diff now per Turn 3 instructions.")
    return "\n".join(parts)


__all__ = [
    "ATHENA_PROPOSAL_SYSTEM",
    "ATHENA_TEST_GEN_SYSTEM",
    "ATHENA_IMPL_GEN_SYSTEM",
    "DIFF_SERIALIZE_SYSTEM",
    "build_proposal_user_prompt",
    "build_test_gen_user_prompt",
    "build_impl_gen_user_prompt",
    "build_diff_user_prompt",
]
