"""Smoke test for refactor types Pydantic schema parity (Pandora Wave 3).

This verifies the 9-stage SimulationStage enum + GhostBuildingHint +
SimulationEvent + RefactorProposalEvent schema match the Asclepius
Wave 2 TypeScript counterpart at
``frontend/src/modes/refactor/simulationEvents.ts`` so the
WebSocket wire payload deserialises round-trip.

Run locally:
    cd backend
    python -m pytest tests/test_refactor_types_smoke.py -v

Compliance: Lock 1 (no em dash). Lock 2 (no emoji).
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import get_args

# Backend package on sys.path.
ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.services.refactor.types import (  # noqa: E402
    GhostArchetype,
    GhostBuildingConnection,
    GhostBuildingHint,
    ProposalContext,
    ProposalStage,
    RefactorProposal,
    RefactorProposalEvent,
    SimulationEvent,
    SimulationEventPayload,
    SimulationStage,
    SimulationTurn,
    STAGE_LABEL,
    STAGE_TURN,
)


# Asclepius TS canonical enum: 9 stages, locked Wave 2.
EXPECTED_STAGES = (
    "proposed",
    "tests_generating",
    "tests_written",
    "impl_generating",
    "impl_written",
    "diff_serializing",
    "completed",
    "accepted",
    "discarded",
)


def test_simulation_stage_has_9_locked_values() -> None:
    """9-stage enum LOCKED Wave 2 hand-off per Asclepius
    ``frontend/src/modes/refactor/simulationEvents.ts`` lines 28-37."""
    assert tuple(get_args(SimulationStage)) == EXPECTED_STAGES


def test_simulation_turn_has_3_values() -> None:
    """3-turn workflow per Phase B Topic 3c."""
    assert set(get_args(SimulationTurn)) == {"test_gen", "impl_gen", "diff_serialize"}


def test_proposal_stage_has_6_values() -> None:
    """ProposalStage covers proposed + simulating + drafted + accepted + discarded + archived."""
    assert set(get_args(ProposalStage)) == {
        "proposed",
        "simulating",
        "drafted",
        "accepted",
        "discarded",
        "archived",
    }


def test_stage_label_covers_all_stages() -> None:
    """STAGE_LABEL has an entry per stage so the LLM call log never
    encounters a missing key on stage narration."""
    for stage in EXPECTED_STAGES:
        assert stage in STAGE_LABEL, f"STAGE_LABEL missing: {stage}"


def test_stage_turn_covers_all_stages() -> None:
    """STAGE_TURN has an entry per stage so the progress UI never
    sees an undefined turn number."""
    for stage in EXPECTED_STAGES:
        assert stage in STAGE_TURN, f"STAGE_TURN missing: {stage}"


def test_ghost_archetype_has_3_values() -> None:
    """3 coarse archetypes per Asclepius TS counterpart."""
    assert set(get_args(GhostArchetype)) == {
        "generic-residence",
        "generic-warehouse",
        "generic-office",
    }


def test_ghost_building_hint_round_trip_json() -> None:
    """Serialised payload round-trips via JSON (WebSocket wire test)."""
    hint = GhostBuildingHint(
        ghostId="ghost-2fa-verifier",
        position=(68.0, 0.0, -22.0),
        archetype="generic-office",
        width=6.0,
        depth=6.0,
        height=12.0,
        connections=[
            GhostBuildingConnection(
                targetBuildingId="backend/app/security/scanner.py",
                relationship="import",
            ),
        ],
        label="2FA verifier module",
        suggestedFilePath="backend/app/security/two_factor.py",
    )
    payload = hint.model_dump(mode="json")
    blob = json.dumps(payload)
    reparsed = GhostBuildingHint.model_validate_json(blob)
    assert reparsed == hint


def test_simulation_event_serialises_with_type_discriminator() -> None:
    """SimulationEvent JSON includes the 'simulation.stage' discriminator."""
    event = SimulationEvent(
        simulationId="sim-test-1",
        stage="tests_generating",
        timestamp="2026-05-12T20:55:00Z",
        payload=SimulationEventPayload(progressPercent=10),
    )
    blob = event.model_dump(mode="json")
    assert blob["type"] == "simulation.stage"
    assert blob["simulationId"] == "sim-test-1"
    assert blob["stage"] == "tests_generating"
    assert blob["payload"]["progressPercent"] == 10


def test_refactor_proposal_event_serialises_with_type_discriminator() -> None:
    """RefactorProposalEvent JSON includes 'simulation.proposal' discriminator."""
    proposal = RefactorProposalEvent(
        simulationId="sim-test-2",
        openspecChangePath="openspec/changes/add-2fa-login/",
        title="Add 2FA to login",
        summary="Introduce TOTP-based second factor on /api/auth/login.",
        userIntent="I want to add 2FA to login.",
        ghostBuildings=[],
        timestamp="2026-05-12T20:55:00Z",
    )
    blob = proposal.model_dump(mode="json")
    assert blob["type"] == "simulation.proposal"
    assert blob["openspecChangePath"] == "openspec/changes/add-2fa-login/"


def test_proposal_context_minimum_fields() -> None:
    """ProposalContext requires user_intent + openspec_change_path + title + summary."""
    ctx = ProposalContext(
        user_intent="I want to add 2FA to login.",
        openspec_change_path="openspec/changes/add-2fa-login/",
        title="Add 2FA to login",
        summary="TOTP-based second factor on login.",
    )
    assert ctx.complexity == "moderate"
    assert ctx.affected_files == []
    assert ctx.callsite_count == 0
    assert ctx.ghost_hints == []


def test_refactor_proposal_initial_stage_is_proposed() -> None:
    """RefactorProposal defaults to stage='proposed' per contract."""
    proposal = RefactorProposal(
        id="sim-test-3",
        title="Test proposal",
        user_intent="test",
        repo_slug="Finerium/codeplexRefactory",
        created_at=1726200000,
    )
    assert proposal.stage == "proposed"
    assert proposal.accepted_at is None
