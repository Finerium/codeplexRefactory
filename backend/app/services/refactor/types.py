"""Pydantic v2 schema for Refactor Mode Pandora producer surface.

Owner: Pandora (Wave 3).

This module is the canonical Python mirror of the TypeScript types
Asclepius Wave 2 authored at ``frontend/src/modes/refactor/simulationEvents.ts``
per the Pythia contract ``_meta/contracts/asclepius-to-pandora.md``
lines 22-100. Pandora publishes events matching this schema verbatim;
Asclepius client deserializes the JSON payload and renders the
ghost-to-solid animation plus the dual review gate UI lifecycle.

Schema parity LOCKED: any change to ``SimulationStage`` or
``GhostBuildingHint`` must coordinate with the Asclepius TypeScript
counterpart in the same PR/cycle. Drift = pitch defensibility crash +
visual-handoff break.

References:
- ``_meta/contracts/asclepius-to-pandora.md`` lines 22-100 (canonical
  TypeScript schema Asclepius authors, Pandora mirrors).
- ``_meta/contracts/pandora-to-asclepius.md`` lines 16-65 (publish
  surface Asclepius consumes via ``/api/ws/refactor-events``).
- ``_meta/contracts/pandora-to-demeter.md`` lines 26-91 (persist
  surface; ``ProposalPersist`` and ``SimulationEventPersist`` reuse
  the same enums).
- PRD Section 9.3 (9-step Refactor Mode flow).
- PRD AD-19 (drafts/ isolation safety property LOCKED).

Compliance: Lock 1 (no em dash). Lock 2 (no emoji). Lock 4 docstrings
label assumptions where the schema layers diverge from a strict 1:1
TypeScript mapping (Python tuple vs TS tuple, Literal vs enum).
"""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Stage + turn discriminators
# ---------------------------------------------------------------------------


SimulationStage = Literal[
    "proposed",
    "tests_generating",
    "tests_written",
    "impl_generating",
    "impl_written",
    "diff_serializing",
    "completed",
    "accepted",
    "discarded",
]
"""9-stage state machine, mirror of Asclepius
``frontend/src/modes/refactor/simulationEvents.ts`` lines 28-37.

LOCKED Wave 2 hand-off: do NOT remap stages or rename without a
coordinated Asclepius TypeScript counterpart change.
"""


SimulationTurn = Literal["test_gen", "impl_gen", "diff_serialize"]
"""3-turn simulation engine workflow per Phase B Topic 3c + PRD
Section 18.6. Stages map to turns via ``STAGE_TURN``.

- ``test_gen``: Turn 1 V4-Pro think high (failing test generation).
- ``impl_gen``: Turn 2 V4-Pro think high (impl to make tests pass).
- ``diff_serialize``: Turn 3 V4-Flash non-think (unified diff format).
"""


ProposalStage = Literal[
    "proposed",
    "simulating",
    "drafted",
    "accepted",
    "discarded",
    "archived",
]
"""Proposal-level lifecycle, coarser than the 9-stage simulation
machine. Used by Demeter ``proposals.stage`` column per contract
``pandora-to-demeter.md`` line 36-37.
"""


GhostArchetype = Literal[
    "generic-residence",
    "generic-warehouse",
    "generic-office",
]
"""Ghost archetype hint per Pythia contract. Match Asclepius
``frontend/src/modes/refactor/simulationEvents.ts`` lines 47-50.

The hint is intentionally coarser than the runtime ``BuildingArchetype``
enum because the ghost is a synthetic suggestion (not a real file yet).
"""


# ---------------------------------------------------------------------------
# Ghost building hint + connection
# ---------------------------------------------------------------------------


class GhostBuildingConnection(BaseModel):
    """Edge between a ghost building and an existing real building.

    Match Asclepius TS counterpart ``connections`` element per
    ``frontend/src/modes/refactor/simulationEvents.ts`` lines 72-75.
    """

    targetBuildingId: str = Field(
        ...,
        description=(
            "Existing building id (real file path) the ghost connects to. "
            "Iris-emitted building ids use the file path as the canonical key."
        ),
    )
    relationship: Literal["import", "reference", "callsite"] = Field(
        ...,
        description=(
            "Edge semantic: 'import' = module import, 'reference' = "
            "structural reference (e.g., type), 'callsite' = invocation."
        ),
    )


class GhostBuildingHint(BaseModel):
    """Ghost building hint Pandora computes; Asclepius renders directly.

    Iris does NOT recompute (per ``hades-to-pandora.md`` Asumption 5
    + ``asclepius-to-pandora.md`` Asumption 5).

    Position constraint: MUST NOT collide with existing Iris building
    positions. Wave 2 mock uses ``x >= 65`` to stay outside the
    treemap envelope. Wave 3 Pandora may adopt the same strategy or
    compute "adjacent district" positions deterministically.

    Match Asclepius TS counterpart per
    ``frontend/src/modes/refactor/simulationEvents.ts`` lines 58-80.
    """

    ghostId: str = Field(
        ...,
        description='Synthetic id prefixed "ghost-".',
    )
    position: tuple[float, float, float] = Field(
        ...,
        description="Suggested position in city space (x, y, z).",
    )
    archetype: GhostArchetype = Field(
        ...,
        description="Coarse archetype hint for the ghost.",
    )
    width: float = Field(..., ge=0.0)
    depth: float = Field(..., ge=0.0)
    height: float = Field(..., ge=0.0)
    connections: list[GhostBuildingConnection] = Field(default_factory=list)
    label: str = Field(..., description="Tooltip label rendered with the ghost.")
    suggestedFilePath: str = Field(
        ...,
        description=(
            "Suggested file path inside the target repo where the "
            "simulation would write the new module. The path is "
            "relative to the repo root and DOES NOT include the "
            "drafts/<simulation-id>/ prefix; the simulation engine "
            "prepends that prefix when writing to drafts/."
        ),
    )


# ---------------------------------------------------------------------------
# Event payload + envelope (publish surface)
# ---------------------------------------------------------------------------


class SimulationEventPayload(BaseModel):
    """Stage-specific payload union per Asclepius TS counterpart.

    Match ``frontend/src/modes/refactor/simulationEvents.ts`` lines
    86-99. The stage discriminator selects which optional fields are
    populated; all fields are Optional to keep the wire payload sparse.
    """

    ghostBuildings: Optional[list[GhostBuildingHint]] = None
    filesAffected: Optional[list[str]] = None
    draftsPath: Optional[str] = None
    diffFilePath: Optional[str] = None
    progressPercent: Optional[int] = Field(default=None, ge=0, le=100)
    error: Optional[str] = None


class SimulationEvent(BaseModel):
    """Stage event Pandora publishes at every state transition.

    Match ``frontend/src/modes/refactor/simulationEvents.ts`` lines
    107-116. The ``type`` field is a literal discriminator so the
    Asclepius client can narrow on it before dispatching to the
    ``RefactorProposalEvent`` handler.
    """

    type: Literal["simulation.stage"] = "simulation.stage"
    simulationId: str
    stage: SimulationStage
    timestamp: str = Field(
        ...,
        description="ISO 8601 timestamp (UTC, e.g., 2026-05-12T20:55:00Z).",
    )
    payload: SimulationEventPayload = Field(default_factory=SimulationEventPayload)


class RefactorProposalEvent(BaseModel):
    """Proposal event published once at Turn 0.

    Carries OpenSpec change folder reference + ghost building hints.
    Match ``frontend/src/modes/refactor/simulationEvents.ts`` lines
    124-139.

    Per contract ``pandora-to-asclepius.md`` Asumption 3, the
    ``ghostBuildings`` hints are published once at Turn 0; subsequent
    SimulationEvent stages do NOT repeat hints (Asclepius caches them).
    """

    type: Literal["simulation.proposal"] = "simulation.proposal"
    simulationId: str
    openspecChangePath: str
    title: str
    summary: str
    userIntent: str
    ghostBuildings: list[GhostBuildingHint] = Field(default_factory=list)
    timestamp: str


# ---------------------------------------------------------------------------
# Proposal author types (Hades-to-Pandora consumer + producer)
# ---------------------------------------------------------------------------


class ProposalContext(BaseModel):
    """Output of ``proposal_author.analyze_intent``.

    Mirror of ``_meta/contracts/hades-to-pandora.md`` lines 105-113
    plus extension to support the OpenSpec change folder generator
    handoff. Pandora's proposal_author writes this; the simulation
    engine consumes it as Turn 0 input.
    """

    user_intent: str
    affected_files: list[str] = Field(default_factory=list)
    callsite_count: int = 0
    ghost_hints: list[GhostBuildingHint] = Field(default_factory=list)
    openspec_change_path: str = Field(
        ...,
        description="OpenSpec change folder relative path Pandora will create.",
    )
    complexity: Literal["simple", "moderate", "complex"] = "moderate"
    title: str = Field(..., description="Athena-authored proposal title.")
    summary: str = Field(..., description="Athena-authored 1-2 sentence summary.")


class RefactorProposal(BaseModel):
    """Persisted proposal row Demeter stores.

    Mirror of ``_meta/contracts/pandora-to-demeter.md`` lines 26-43
    plus the runtime fields Pandora tracks (simulation_id alignment,
    accepted_at timestamp, repo slug).
    """

    id: str
    title: str
    user_intent: str
    repo_slug: str
    affected_buildings: list[str] = Field(default_factory=list)
    ghost_building_hints: list[GhostBuildingHint] = Field(default_factory=list)
    openspec_change_path: Optional[str] = None
    github_issue_fallback_url: Optional[str] = None
    stage: ProposalStage = "proposed"
    created_at: int
    accepted_at: Optional[int] = None
    author_user_id: Optional[int] = None
    summary: str = ""
    affected_files: list[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Helper constants (parity with Asclepius TS STAGE_LABEL + STAGE_TURN)
# ---------------------------------------------------------------------------


STAGE_LABEL: dict[str, str] = {
    "proposed": "Proposal authored",
    "tests_generating": "Generating failing tests",
    "tests_written": "Tests written to drafts",
    "impl_generating": "Generating implementation",
    "impl_written": "Implementation written to drafts",
    "diff_serializing": "Serializing diff",
    "completed": "Ready for review",
    "accepted": "Accepted, applied to production",
    "discarded": "Discarded, drafts preserved",
}
"""Parity copy of Asclepius
``frontend/src/modes/refactor/simulationEvents.ts`` ``STAGE_LABEL``
lines 151-161. Backend uses for logging + LLM call log narration only;
the frontend reads the TS copy directly (no transport).
"""


STAGE_TURN: dict[str, int] = {
    "proposed": 0,
    "tests_generating": 1,
    "tests_written": 1,
    "impl_generating": 2,
    "impl_written": 2,
    "diff_serializing": 3,
    "completed": 4,
    "accepted": 4,
    "discarded": 4,
}
"""Parity copy of Asclepius
``frontend/src/modes/refactor/simulationEvents.ts`` ``STAGE_TURN``
lines 168-178. Used by simulation engine to compute progress and by
the LLM call logger to tag turns.
"""
