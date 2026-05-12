"""Pydantic request/response schemas for the Refactor Mode API.

Owner: Pandora (Wave 3).

Compliance: Lock 1 (no em dash). Lock 2 (no emoji).
"""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field


class SimulateRequest(BaseModel):
    """POST /api/refactor/simulate payload."""

    user_intent: str = Field(..., min_length=4, max_length=2000)
    repo_slug: str = Field(default="Finerium/codeplexRefactory")
    author_user_id: Optional[int] = None


class SimulateResponse(BaseModel):
    """POST /api/refactor/simulate response."""

    simulation_id: str
    proposal_id: str
    openspec_change_path: str
    title: str
    summary: str
    stage: Literal["proposed", "simulating"] = "proposed"
    websocket_url: str = Field(
        default="/api/ws/refactor-events",
        description="WebSocket URL clients subscribe to for stage updates.",
    )


class DiscardResponse(BaseModel):
    """POST /api/refactor/{simulation_id}/discard response."""

    simulation_id: str
    stage: Literal["discarded", "archived"] = "discarded"
    drafts_cleaned: bool = True


class AcceptInfoResponse(BaseModel):
    """Optional JSON response from accept-info endpoint (HEAD-style probe)."""

    simulation_id: str
    diff_path: str
    diff_size_bytes: int
    stage: Literal["drafted", "completed", "accepted"]
