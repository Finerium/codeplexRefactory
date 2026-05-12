"""Refactor Mode SAFETY-FIRST service module (Pandora Wave 3).

Owner: Pandora (Wave 3).

Layer breakdown:
- ``types``: Pydantic v2 mirror of Asclepius Wave 2 9-stage SimulationStage
  enum + GhostBuildingHint + SimulationEvent + RefactorProposalEvent +
  ProposalStage + ProposalContext + RefactorProposal.
- ``drafts_isolation``: pathlib resolve-guard for the safe_draft_write
  primitive. Production code NEVER changes by simulation engine (AD-19
  LOCKED safety property, pitch defensibility hinge).
- ``proposal_author``: Athena (V4-Pro think high) user intent to ghost
  building hint plus OpenSpec change folder generator dispatch.
- ``openspec_generator``: auto-generate Folder A change folder
  proposal.md + design.md + tasks.md per OpenSpec v1.0 canonical layout,
  plus Folder B mirror per PRD Section 17.1 D27 LOCKED.
- ``github_issue_fallback``: progressive degradation when target repo
  has no ``openspec/`` directory; falls back to a structured GitHub
  Issue draft.
- ``simulation_engine``: 3-turn multi-turn orchestrator (Turn 1
  test_gen V4-Pro think high, Turn 2 impl_gen V4-Pro think high, Turn 3
  diff_serialize V4-Flash non-think). Publishes SimulationEvent at
  every stage to /api/ws/refactor-events.
- ``ws_publisher``: thin wrapper around the event bus that Hades owns.
- ``demeter_adapter``: stub interface for ProposalPersist +
  SimulationEventPersist + LLMCallLog persistence (Demeter Cycle 1
  ship target).
- ``prompts``: Athena persona prompt strings (system + user template
  per Turn).

Compliance: Lock 1 (no em dash). Lock 2 (no emoji). Lock 3 + AD-19
(drafts/ isolation safety property NEVER violated).
"""

from .types import (
    GhostArchetype,
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

__all__ = [
    "GhostArchetype",
    "GhostBuildingHint",
    "ProposalContext",
    "ProposalStage",
    "RefactorProposal",
    "RefactorProposalEvent",
    "SimulationEvent",
    "SimulationEventPayload",
    "SimulationStage",
    "SimulationTurn",
    "STAGE_LABEL",
    "STAGE_TURN",
]
