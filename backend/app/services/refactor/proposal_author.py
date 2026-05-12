"""Athena proposal author (Pandora Wave 3).

Owner: Pandora (Wave 3).

Athena (runtime resident, V4-Pro think high per PRD Section 18.3) is
the architect persona that authors Refactor proposals. Pandora wires
the prompt + LLM call + parser callsite query + ghost building hint
position computation here.

Pipeline:
1. ``analyze_intent(user_intent, repo_slug, parser)``:
   - Pre-pass via Hades parser to collect candidate symbols + callsite
     counts (stub-friendly: when parser is None, skip pre-pass).
   - LLM call (V4-Pro think high via Triton) with the Athena proposal
     system prompt to identify affected files + ghost hints + complexity.
   - Parse the strict-JSON LLM output.
   - Compute deterministic ghost positions (place ghosts at x >= 65 to
     stay outside the Iris treemap envelope, per
     ``_meta/handoff_log/wave2_asclepius_to_pandora.md`` "Ghost
     building position computation").
   - Return ``ProposalContext``.

References:
- ``_meta/contracts/hades-to-pandora.md`` lines 29-72 (analyze_intent
  + verify_draft_syntax signatures + ProposalContext schema).
- ``_meta/contracts/triton-to-pandora.md`` lines 132-144 (Athena
  proposal system prompt routing).
- ``_meta/handoff_log/wave2_asclepius_to_pandora.md`` lines 156-167
  (ghost position constraint).
- PRD Section 9.3 (9-step Refactor Mode flow, step 1-4).

Compliance: Lock 1 (no em dash). Lock 2 (no emoji). Lock 4 [INFERRED]
for ghost position layout strategy (Wave 2 mock used x = 68 / 78;
Pandora picks the same band by default; the deterministic placer is
documented inline and surfaced as a medium-confidence concern in
``_meta/uncertainty/pandora-cycle1-*.md``).
"""

from __future__ import annotations

import hashlib
import json
import logging
import re
from dataclasses import dataclass
from typing import Any, Mapping, Optional, Protocol

from .llm_stub import LLMClientProtocol, LLMMessage, get_llm_client
from .prompts import (
    ATHENA_PROPOSAL_SYSTEM,
    build_proposal_user_prompt,
)
from .types import (
    GhostArchetype,
    GhostBuildingConnection,
    GhostBuildingHint,
    ProposalContext,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Parser protocol (consumed from Hades; defined locally for stub-and-sync)
# ---------------------------------------------------------------------------


class ParserServiceProtocol(Protocol):
    """Subset of Hades ParserService Pandora consumes.

    [STUB Cycle 1, real Hades Cycle 2 full impl]

    Per ``_meta/contracts/hades-to-pandora.md`` lines 65-87. Pandora
    only needs ``find_callsites`` + ``parse_file`` + ``query_tree``.
    """

    async def find_callsites(
        self,
        repo_root: Any,
        symbol_name: str,
        language: Any = None,
    ) -> list[Any]: ...

    async def parse_file(self, file_path: Any) -> Any: ...

    async def query_tree(
        self,
        file_path: Any,
        query_source: str,
    ) -> list[dict]: ...


# ---------------------------------------------------------------------------
# Helper: extract JSON from LLM output (robust to fenced code blocks)
# ---------------------------------------------------------------------------


_JSON_FENCE_PATTERN = re.compile(
    r"```(?:json)?\s*(\{.*?\})\s*```",
    re.DOTALL | re.IGNORECASE,
)


def _extract_json_object(text: str) -> dict[str, Any]:
    """Return the first JSON object found in ``text``.

    Tolerant of:
    - Bare JSON (no fence)
    - Fenced ```json {...} ``` block
    - Whitespace / leading commentary
    - Trailing commentary

    Raises ValueError on no parseable object.
    """
    text = text.strip()
    if text.startswith("{") and text.rstrip().endswith("}"):
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass
    match = _JSON_FENCE_PATTERN.search(text)
    if match:
        return json.loads(match.group(1))
    # Last resort: find first { ... } balanced span.
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return json.loads(text[start : end + 1])
    raise ValueError(f"Could not extract JSON object from LLM output: {text[:200]!r}")


# ---------------------------------------------------------------------------
# Ghost position computation (deterministic placer)
# ---------------------------------------------------------------------------


# Wave 2 mock uses x = 68 / 78 / 88 at z = -22 for ghost buildings to
# avoid colliding with the Iris treemap envelope (x roughly in [-60, 60]).
# We adopt the same band (x >= 65) so Wave 2 mock + Wave 3 real Pandora
# output are visually consistent.
GHOST_LAYOUT_X_BASE: float = 68.0
GHOST_LAYOUT_X_STEP: float = 10.0
GHOST_LAYOUT_Z_BASE: float = -22.0
GHOST_LAYOUT_Y: float = 0.0


def _deterministic_ghost_id(suggested_file_path: str) -> str:
    """Return a deterministic ghost id derived from the suggested path."""
    h = hashlib.blake2b(suggested_file_path.encode(), digest_size=4).hexdigest()
    safe = re.sub(r"[^a-zA-Z0-9]+", "-", suggested_file_path.lower()).strip("-")
    safe = safe[:32] or "anon"
    return f"ghost-{safe}-{h}"


def _layout_position(index: int) -> tuple[float, float, float]:
    """Return a deterministic position outside the Iris treemap envelope."""
    x = GHOST_LAYOUT_X_BASE + GHOST_LAYOUT_X_STEP * index
    return (x, GHOST_LAYOUT_Y, GHOST_LAYOUT_Z_BASE)


_DEFAULT_FOOTPRINT = {
    "generic-office": (6.0, 6.0, 12.0),
    "generic-warehouse": (5.0, 5.0, 6.0),
    "generic-residence": (4.0, 4.0, 8.0),
}


def _coerce_archetype(value: Any) -> GhostArchetype:
    """Coerce an arbitrary string to a valid GhostArchetype with fallback."""
    if value in ("generic-residence", "generic-warehouse", "generic-office"):
        return value  # type: ignore[return-value]
    return "generic-office"


def _coerce_relationship(value: Any) -> str:
    if value in ("import", "reference", "callsite"):
        return value
    return "reference"


def _build_ghost_hints(
    raw_hints: list[Mapping[str, Any]],
) -> list[GhostBuildingHint]:
    """Build typed ``GhostBuildingHint`` from raw LLM JSON entries."""
    hints: list[GhostBuildingHint] = []
    for idx, raw in enumerate(raw_hints[:5]):  # Cap at 5 ghosts (PRD step 3).
        suggested_path = str(raw.get("suggestedFilePath") or raw.get("suggested_file_path") or "unknown")
        archetype = _coerce_archetype(raw.get("archetype"))
        width, depth, height = _DEFAULT_FOOTPRINT[archetype]
        connections_raw = raw.get("connections") or []
        connections: list[GhostBuildingConnection] = []
        for c in connections_raw[:8]:
            target = c.get("targetBuildingId") or c.get("target_building_id")
            if not target:
                continue
            connections.append(
                GhostBuildingConnection(
                    targetBuildingId=str(target),
                    relationship=_coerce_relationship(c.get("relationship")),  # type: ignore[arg-type]
                )
            )
        hints.append(
            GhostBuildingHint(
                ghostId=str(
                    raw.get("ghostId")
                    or raw.get("ghost_id")
                    or _deterministic_ghost_id(suggested_path)
                ),
                position=_layout_position(idx),
                archetype=archetype,
                width=width,
                depth=depth,
                height=height,
                connections=connections,
                label=str(raw.get("label") or suggested_path),
                suggestedFilePath=suggested_path,
            )
        )
    return hints


# ---------------------------------------------------------------------------
# Change name slug (used as simulation_id + OpenSpec change folder name)
# ---------------------------------------------------------------------------


def sanitize_change_name(title: str, max_len: int = 48) -> str:
    """Convert an Athena title into a kebab-case slug suitable for use
    as both the simulation_id and the OpenSpec change folder name.

    Per ``_meta/contracts/asclepius-to-pandora.md`` line 59: the
    ``simulationId`` matches the OpenSpec change folder name.

    Examples:
    - "Add 2FA to login" -> "add-2fa-to-login"
    - "Extract payment service from monolith" -> "extract-payment-service-from-monolith"
    - "Refactor Athena's persona module (v2)" -> "refactor-athenas-persona-module-v2"
    """
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", title.lower()).strip("-")
    if len(slug) > max_len:
        slug = slug[:max_len].rstrip("-")
    if not slug:
        slug = "refactor-proposal"
    return slug


# ---------------------------------------------------------------------------
# ProposalAuthor service
# ---------------------------------------------------------------------------


@dataclass(slots=True)
class ProposalAuthorConfig:
    """Tunable config (mostly for tests + Cycle 2 polish)."""

    max_callsites_per_symbol: int = 8
    candidate_symbols: tuple[str, ...] = ()


class ProposalAuthor:
    """Athena's voice. Authors refactor proposals via DeepSeek V4-Pro thinking high.

    Wave 3 Cycle 1 ship: this class is fully runnable against the stub
    LLM (``StubLLMClient`` returns deterministic canned JSON). Cycle 2
    swap: import the real Triton client + Hades parser; no call site
    changes here.
    """

    def __init__(
        self,
        *,
        llm: Optional[LLMClientProtocol] = None,
        parser: Optional[ParserServiceProtocol] = None,
        config: Optional[ProposalAuthorConfig] = None,
    ) -> None:
        self._llm = llm or get_llm_client()
        self._parser = parser
        self._config = config or ProposalAuthorConfig()

    async def analyze_intent(
        self,
        *,
        user_intent: str,
        repo_slug: str,
        simulation_id: Optional[str] = None,
    ) -> ProposalContext:
        """Map user intent to ``ProposalContext`` per
        ``_meta/contracts/hades-to-pandora.md`` analyze_intent signature.

        Steps:
        1. Parser pre-pass (if parser available): collect candidate
           symbol callsite counts.
        2. LLM call V4-Pro think high with Athena proposal system prompt.
        3. Parse strict JSON output; coerce to ProposalContext.
        4. Compute deterministic ghost positions.
        5. Compute the OpenSpec change folder relative path.

        Returns a fully-typed ``ProposalContext``.
        """
        callsite_summary = await self._parser_pre_pass(user_intent, repo_slug)
        messages: list[LLMMessage] = [
            LLMMessage(role="system", content=ATHENA_PROPOSAL_SYSTEM),
            LLMMessage(
                role="user",
                content=build_proposal_user_prompt(
                    user_intent=user_intent,
                    repo_slug=repo_slug,
                    callsite_summary=callsite_summary,
                ),
            ),
        ]
        response = await self._llm.call(
            messages=messages,
            prefer_pro=True,
            thinking_mode="high",
            max_tokens=4000,
            worker="pandora",
            simulation_id=simulation_id,
            resident_id="Athena",
        )
        if response.error:
            raise RuntimeError(f"Athena LLM call failed: {response.error}")
        try:
            payload = _extract_json_object(response.content)
        except (ValueError, json.JSONDecodeError) as err:
            logger.warning(
                "Athena returned malformed JSON; using safe fallback. err=%s output=%s",
                err,
                response.content[:200],
            )
            payload = _safe_fallback_payload(user_intent)

        title = str(payload.get("title") or "Refactor proposal")
        summary = str(
            payload.get("summary") or "Auto-generated refactor proposal."
        )
        affected_files = [str(f) for f in payload.get("affected_files") or []]
        ghost_hints = _build_ghost_hints(payload.get("ghost_hints") or [])
        complexity = payload.get("complexity") or _infer_complexity(len(affected_files))
        if complexity not in ("simple", "moderate", "complex"):
            complexity = "moderate"

        change_name = sanitize_change_name(title)
        openspec_change_path = f"openspec/changes/{change_name}/"

        callsite_count = sum(callsite_summary.values()) if callsite_summary else 0
        return ProposalContext(
            user_intent=user_intent,
            affected_files=affected_files,
            callsite_count=callsite_count,
            ghost_hints=ghost_hints,
            openspec_change_path=openspec_change_path,
            complexity=complexity,
            title=title,
            summary=summary,
        )

    async def _parser_pre_pass(
        self,
        user_intent: str,
        repo_slug: str,
    ) -> dict[str, int]:
        """Run Hades parser pre-pass to gather callsite counts.

        Returns an empty dict when no parser is wired (Cycle 1 stub
        mode + small demo repos where the pre-pass is optional).
        """
        if self._parser is None:
            return {}
        result: dict[str, int] = {}
        symbols = self._config.candidate_symbols
        if not symbols:
            symbols = _heuristic_candidate_symbols(user_intent)
        for symbol in symbols:
            try:
                callsites = await self._parser.find_callsites(repo_slug, symbol)
            except Exception as err:  # pragma: no cover - defensive
                logger.warning(
                    "Parser find_callsites failed for symbol=%s: %s",
                    symbol,
                    err,
                )
                continue
            result[symbol] = len(callsites)
        return result

    async def verify_draft_syntax(
        self,
        simulation_id: str,
        files: list[str],
    ) -> list[dict]:
        """Optional Cycle 2 hook: call parser.parse_file on each draft file.

        Returns a list of parse-result dicts (raw passthrough). Used by
        the simulation engine to flag malformed LLM output before
        publishing ``completed`` stage.
        """
        if self._parser is None:
            return []
        results: list[dict] = []
        for path in files:
            try:
                parsed = await self._parser.parse_file(path)
                results.append({"path": path, "ok": True, "parsed": str(parsed)[:200]})
            except Exception as err:
                results.append({"path": path, "ok": False, "error": str(err)})
        return results


def _heuristic_candidate_symbols(user_intent: str) -> tuple[str, ...]:
    """Pick 2-3 candidate symbols heuristically from the user intent.

    Wave 3 Cycle 1 picks the longest alphanumeric tokens from the
    intent. Cycle 2 polish swap: Triton ``infer_candidate_symbols`` via
    an Athena pre-pass V4-Flash call.
    """
    tokens = re.findall(r"[A-Za-z][A-Za-z0-9]+", user_intent)
    tokens = sorted(set(tokens), key=lambda t: -len(t))
    return tuple(tokens[:3])


def _infer_complexity(file_count: int) -> str:
    """Per ``hades-to-pandora.md`` Asumption 6 complexity heuristic."""
    if file_count <= 3:
        return "simple"
    if file_count <= 10:
        return "moderate"
    return "complex"


def _safe_fallback_payload(user_intent: str) -> dict[str, Any]:
    """Return a safe default payload when the LLM returns malformed JSON.

    The safe path keeps the simulation engine pipeline running so the
    user sees a degraded-but-not-broken response (vs a HTTP 500). The
    Triton call log carries the error tag separately.
    """
    return {
        "title": f"Refactor: {user_intent.strip()[:36]}",
        "summary": (
            "Athena could not parse a structured proposal; the user "
            "intent is captured and a single placeholder ghost building "
            "is suggested."
        ),
        "affected_files": [],
        "ghost_hints": [
            {
                "ghostId": "ghost-fallback",
                "archetype": "generic-office",
                "label": "Placeholder",
                "suggestedFilePath": "drafts/placeholder.txt",
                "connections": [],
            }
        ],
        "complexity": "simple",
        "rationale": "Fallback because Athena response was unparseable JSON.",
    }


__all__ = [
    "GHOST_LAYOUT_X_BASE",
    "GHOST_LAYOUT_X_STEP",
    "GHOST_LAYOUT_Z_BASE",
    "ParserServiceProtocol",
    "ProposalAuthor",
    "ProposalAuthorConfig",
    "sanitize_change_name",
]
