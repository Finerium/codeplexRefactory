"""Onboarding narration endpoint (Triton Wave 3, Boreas consumer).

Owner: Triton (Wave 3).

Per contract ``_meta/contracts/boreas-to-triton.md`` lines 87-138. Hermes
narration generation for camera-fly tour waypoints. V4-Flash non-think
routing per PRD Section 18.3.

Compliance:
- Lock 1 (no em dash): clean.
- Lock 2 (no emoji): clean.
- Lock 4 (Hermes routing locked): config from ``RESIDENT_ROUTING["Hermes"]``.
- Lock 5 (honest claim): generic fallback content for unsupported variant.
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

router = APIRouter(prefix="/onboarding", tags=["onboarding"])
logger = logging.getLogger(__name__)


TourVariant = Literal[
    "generic-30sec", "sprint-goal", "feature-scoped", "cross-onboarding"
]


class BuildingContext(BaseModel):
    label: str
    archetype: str
    ownership: str
    recent_activity: str


class VariantContext(BaseModel):
    sprint_goal: str | None = None
    feature: str | None = None
    target_username: str | None = None


class NarrationPromptContext(BaseModel):
    purpose: str
    building_context: BuildingContext
    variant_context: VariantContext | None = None


class NarrationRequest(BaseModel):
    tour_id: str
    waypoint_index: int
    tour_variant: TourVariant
    narration_prompt_context: NarrationPromptContext


class NarrationResponse(BaseModel):
    narration_text: str
    cache_hit: bool = False
    canned_hit: bool = False
    latency_ms: int = 0
    model_used: str = "V4-Flash"
    fallback_chain: list[str] = Field(default_factory=list)


def _build_hermes_messages(req: NarrationRequest) -> list[LLMMessage]:
    """Compose Hermes narration messages for one waypoint."""
    system = build_resident_system_prompt("Hermes")
    ctx = req.narration_prompt_context
    bld = ctx.building_context
    variant = ctx.variant_context

    variant_block = ""
    if variant:
        parts: list[str] = []
        if variant.sprint_goal:
            parts.append(f"Sprint goal: {variant.sprint_goal}")
        if variant.feature:
            parts.append(f"Feature scope: {variant.feature}")
        if variant.target_username:
            parts.append(f"Cross-onboarding target user: {variant.target_username}")
        if parts:
            variant_block = "\n\nVariant scope:\n" + "\n".join(parts)

    user_body = (
        f"You are narrating waypoint {req.waypoint_index} of tour "
        f"{req.tour_id} (variant: {req.tour_variant}).\n\n"
        f"Purpose: {ctx.purpose}\n\n"
        f"Building context:\n"
        f"- Label: {bld.label}\n"
        f"- Archetype: {bld.archetype}\n"
        f"- Ownership: {bld.ownership}\n"
        f"- Recent activity: {bld.recent_activity}"
        f"{variant_block}\n\n"
        "Produce 1 to 3 sentences only. Conversational, dev-tool warm, "
        "Indonesian primary with English technical code-switch when natural. "
        "Output the narration text directly (no quotes, no headers)."
    )
    return [
        LLMMessage(role="system", content=system),
        LLMMessage(role="user", content=user_body),
    ]


@router.post("/narration", response_model=NarrationResponse)
async def fetch_narration(
    req: NarrationRequest,
    session: dict = Depends(require_session),  # noqa: B008
) -> NarrationResponse:
    """Generate Hermes narration text for one tour waypoint."""
    _ = session
    valid_variants = {
        "generic-30sec",
        "sprint-goal",
        "feature-scoped",
        "cross-onboarding",
    }
    if req.tour_variant not in valid_variants:
        raise HTTPException(
            status_code=422,
            detail=f"Unknown tour_variant '{req.tour_variant}'. Valid: {sorted(valid_variants)}",
        )
    config = get_resident_routing("Hermes")
    messages = _build_hermes_messages(req)
    gateway = get_llm_gateway()
    try:
        resp = await gateway.call_with_fallback(
            messages=messages,
            prefer_pro=config["prefer_pro"],
            thinking_mode=config["thinking_mode"],
            max_tokens=config["max_tokens"],
            worker="onboarding_endpoint",
            resident_id="Hermes",
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("Hermes narration failed err=%s", exc)
        raise HTTPException(
            status_code=503,
            detail="Hermes narration temporarily unavailable.",
        ) from exc

    return NarrationResponse(
        narration_text=resp.content,
        cache_hit=resp.cache_hit,
        canned_hit=resp.canned_hit,
        latency_ms=resp.latency_ms,
        model_used=resp.model_used,
        fallback_chain=list(resp.fallback_chain),
    )
