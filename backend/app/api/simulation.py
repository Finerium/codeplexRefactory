"""Refactor Mode simulation dispatch endpoint (Triton Wave 3, Pandora consumer).

Owner: Triton (Wave 3).

Per contract ``_meta/contracts/triton-to-pandora.md`` lines 24-130. Pandora's
``SimulationEngine`` orchestrates the 3 turn flow (test_gen, impl_gen,
diff_serialize) and persists drafts/. This endpoint exposes a single-turn
LLM dispatch so Pandora can call once per turn through HTTP if it ever runs
its engine out-of-process; the typical Wave 3 path is Pandora directly
importing ``get_llm_gateway`` in-process. The endpoint is also useful for
ops debug + audit replay.

Routing per PRD Section 18.6:
- ``test_gen``: V4-Pro think high.
- ``impl_gen``: V4-Pro think high.
- ``diff_serialize``: V4-Flash non-think.

Compliance:
- Lock 1 (no em dash): clean.
- Lock 2 (no emoji): clean.
- Lock 4 (PRD 18.6 LOCKED): config from ``SIMULATION_ROUTING``.
"""

from __future__ import annotations

import logging
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.llm.resident_routing import get_simulation_routing
from app.llm.system_header import build_simulation_system_prompt
from app.llm.types import LLMMessage, SimulationTurn
from app.services.auth_session import require_session
from app.services.llm_client import get_llm_gateway

router = APIRouter(prefix="/simulation", tags=["simulation"])
logger = logging.getLogger(__name__)


class SimulationTurnRequest(BaseModel):
    """Single-turn dispatch request."""

    turn: Literal["test_gen", "impl_gen", "diff_serialize"]
    simulation_id: str
    # Pandora supplies user-role messages (the system prompt is composed here).
    user_messages: list[str] = Field(default_factory=list)
    # Optional inline override of system prompt (Pandora may supply its own
    # turn-specific persona prepared in proposal author logic).
    system_override: str | None = None


class SimulationTurnResponse(BaseModel):
    """Single-turn dispatch response."""

    simulation_id: str
    turn: str
    content: str
    cache_hit: bool = False
    canned_hit: bool = False
    input_tokens: int = 0
    output_tokens: int = 0
    cost_estimate_usd: float = 0.0
    latency_ms: int = 0
    model_used: str = "V4-Flash"
    thinking_mode: str = "disabled"
    fallback_chain: list[str] = Field(default_factory=list)


def _build_messages(req: SimulationTurnRequest) -> list[LLMMessage]:
    turn: SimulationTurn = req.turn  # type: ignore[assignment]
    system_content = req.system_override or build_simulation_system_prompt(turn)
    messages: list[LLMMessage] = [LLMMessage(role="system", content=system_content)]
    for user_msg in req.user_messages:
        messages.append(LLMMessage(role="user", content=user_msg))
    if len(messages) == 1:
        # No user message: feed a stub asking for the turn output.
        messages.append(
            LLMMessage(
                role="user",
                content=(
                    "Execute the simulation turn using the system prompt "
                    "above. Output only the artifact body for this turn."
                ),
            )
        )
    return messages


@router.post("/turn", response_model=SimulationTurnResponse)
async def dispatch_turn(
    req: SimulationTurnRequest,
    session: dict = Depends(require_session),  # noqa: B008
) -> SimulationTurnResponse:
    """Run one simulation turn through the LLM gateway."""
    _ = session
    valid_turns = {"test_gen", "impl_gen", "diff_serialize"}
    if req.turn not in valid_turns:
        raise HTTPException(
            status_code=422,
            detail=f"Unknown turn '{req.turn}'. Valid: {sorted(valid_turns)}",
        )
    config = get_simulation_routing(req.turn)  # type: ignore[arg-type]
    messages = _build_messages(req)
    gateway = get_llm_gateway()
    try:
        resp = await gateway.call_with_fallback(
            messages=messages,
            prefer_pro=config["prefer_pro"],
            thinking_mode=config["thinking_mode"],
            max_tokens=config["max_tokens"],
            worker="simulation_endpoint",
            simulation_id=req.simulation_id,
            resident_id=req.turn,
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception(
            "Simulation turn=%s simulation_id=%s failed err=%s",
            req.turn, req.simulation_id, exc,
        )
        raise HTTPException(
            status_code=503,
            detail=f"Simulation turn '{req.turn}' temporarily unavailable.",
        ) from exc

    return SimulationTurnResponse(
        simulation_id=req.simulation_id,
        turn=req.turn,
        content=resp.content,
        cache_hit=resp.cache_hit,
        canned_hit=resp.canned_hit,
        input_tokens=resp.input_tokens,
        output_tokens=resp.output_tokens,
        cost_estimate_usd=resp.cost_estimate_usd,
        latency_ms=resp.latency_ms,
        model_used=resp.model_used,
        thinking_mode=resp.thinking_mode,
        fallback_chain=list(resp.fallback_chain),
    )
