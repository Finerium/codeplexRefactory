"""Security CVSS scoring endpoint (Triton Wave 3, Nemesis consumer).

Owner: Triton (Wave 3).

Per contract ``_meta/contracts/triton-to-nemesis.md`` lines 119-156. Argus
CVSS scoring + exploit pattern + mitigation. V4-Flash thinking-low routing
per PRD Section 18.3.

Input shape mirrors Nemesis ``Finding`` payload (file path, line range,
category, current evidence). Output is parsed JSON in the schema declared
by the Argus persona; we surface as a typed Pydantic model with
``raw_content`` fallback so Nemesis can re-parse if Argus returns malformed
JSON (edge case handled at the Nemesis layer).

Compliance:
- Lock 1 (no em dash): clean.
- Lock 2 (no emoji): clean.
- Lock 4 (Argus routing locked): config from ``RESIDENT_ROUTING["Argus"]``.
"""

from __future__ import annotations

import json
import logging
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.llm.resident_routing import get_resident_routing
from app.llm.system_header import build_resident_system_prompt
from app.llm.types import LLMMessage
from app.services.auth_session import require_session
from app.services.llm_client import get_llm_gateway

router = APIRouter(prefix="/security", tags=["security"])
logger = logging.getLogger(__name__)


FindingCategory = Literal[
    "hardcoded-secret",
    "outdated-dependency",
    "missing-auth",
    "unsafe-sql",
    "complex-untested",
]
Severity = Literal["critical", "high", "medium", "low", "info"]


class ArgusFindingInput(BaseModel):
    """Subset of Nemesis Finding needed for Argus CVSS scoring."""

    finding_id: str
    file_path: str
    line_start: int
    line_end: int
    category: FindingCategory
    severity: Severity
    title: str
    description: str
    code_excerpt: str | None = None


class ArgusScoreResponse(BaseModel):
    """Argus output. Structured fields parsed from LLM JSON; raw_content kept
    for Nemesis re-parse if JSON malformed.
    """

    finding_id: str
    cvss_vector: str | None = None
    cvss_base_score: float | None = None
    exploit_pattern: str | None = None
    mitigation: str | None = None
    references: list[str] = Field(default_factory=list)
    raw_content: str
    cache_hit: bool = False
    canned_hit: bool = False
    latency_ms: int = 0
    model_used: str = "V4-Flash"
    fallback_chain: list[str] = Field(default_factory=list)
    parse_error: str | None = None


def _build_argus_messages(finding: ArgusFindingInput) -> list[LLMMessage]:
    system = build_resident_system_prompt("Argus")
    code_block = (
        f"\nCode excerpt:\n```\n{finding.code_excerpt}\n```" if finding.code_excerpt else ""
    )
    user_body = (
        f"Score the following finding. Output STRICT JSON only.\n\n"
        f"Finding identifier: {finding.finding_id}\n"
        f"Category: {finding.category}\n"
        f"Severity (Apollo): {finding.severity}\n"
        f"File: {finding.file_path}:{finding.line_start}-{finding.line_end}\n"
        f"Title: {finding.title}\n"
        f"Description: {finding.description}"
        f"{code_block}\n\n"
        "Required JSON keys: cvss_vector (CVSS 3.1 vector string), "
        "cvss_base_score (float 0..10), exploit_pattern (CWE id + description), "
        "mitigation (1 to 3 sentence remediation), references (list of CVE id "
        "or vendor advisory URL strings). Never speculate beyond public records."
    )
    return [
        LLMMessage(role="system", content=system),
        LLMMessage(role="user", content=user_body),
    ]


def _parse_argus_json(content: str) -> tuple[dict[str, object], str | None]:
    """Best-effort JSON extraction from Argus response. Returns (data, error)."""
    if not content.strip():
        return {}, "empty_content"
    # Try direct JSON first.
    candidates: list[str] = [content.strip()]
    # Fall back to first {...} block.
    start = content.find("{")
    end = content.rfind("}")
    if start != -1 and end != -1 and end > start:
        candidates.append(content[start : end + 1])
    for cand in candidates:
        try:
            data = json.loads(cand)
            if isinstance(data, dict):
                return data, None
        except json.JSONDecodeError:
            continue
    return {}, "json_decode_failed"


@router.post("/argus/score", response_model=ArgusScoreResponse)
async def argus_score(
    finding: ArgusFindingInput,
    session: dict = Depends(require_session),  # noqa: B008
) -> ArgusScoreResponse:
    """Score a security finding via Argus persona (V4-Flash thinking low)."""
    _ = session
    config = get_resident_routing("Argus")
    messages = _build_argus_messages(finding)
    gateway = get_llm_gateway()
    try:
        resp = await gateway.call_with_fallback(
            messages=messages,
            prefer_pro=config["prefer_pro"],
            thinking_mode=config["thinking_mode"],
            max_tokens=config["max_tokens"],
            worker="security_endpoint",
            resident_id="Argus",
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("Argus score failed err=%s", exc)
        raise HTTPException(
            status_code=503, detail="Argus scoring temporarily unavailable."
        ) from exc

    data, parse_error = _parse_argus_json(resp.content)
    base_score_raw = data.get("cvss_base_score")
    base_score: float | None
    try:
        base_score = float(base_score_raw) if base_score_raw is not None else None
        # Clamp to valid CVSS 3.1 base score range per Nemesis edge case handling.
        if base_score is not None:
            base_score = max(0.0, min(10.0, base_score))
    except (TypeError, ValueError):
        base_score = None

    references_raw = data.get("references", [])
    references: list[str]
    if isinstance(references_raw, list):
        references = [str(r) for r in references_raw]
    else:
        references = []

    return ArgusScoreResponse(
        finding_id=finding.finding_id,
        cvss_vector=(str(data["cvss_vector"]) if "cvss_vector" in data else None),
        cvss_base_score=base_score,
        exploit_pattern=(str(data["exploit_pattern"]) if "exploit_pattern" in data else None),
        mitigation=(str(data["mitigation"]) if "mitigation" in data else None),
        references=references,
        raw_content=resp.content,
        cache_hit=resp.cache_hit,
        canned_hit=resp.canned_hit,
        latency_ms=resp.latency_ms,
        model_used=resp.model_used,
        fallback_chain=list(resp.fallback_chain),
        parse_error=parse_error,
    )
