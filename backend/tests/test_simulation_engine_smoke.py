"""End-to-end smoke test for the Refactor Mode simulation engine.

Owner: Pandora (Wave 3).

Scenario per ``_meta/handoff_log/wave2_asclepius_to_pandora.md`` +
``.claude/agents/pandora.md`` Section 10 ship criteria:

> "Smoke test NodeGoat 2FA proposal E2E (intent -> simulate ->
>  drafts/<id>/diff.patch -> Accept download)."

Test plan:
1. Run ``ProposalAuthor.analyze_intent`` with NodeGoat 2FA intent.
2. Run ``SimulationEngine.run`` end-to-end with the stub LLM.
3. Verify the event sequence (proposal + 6 stage events + completed)
   was published to the in-memory bus.
4. Verify drafts/<sim_id>/ contains tests + impl + diff.patch.
5. Verify Demeter persist captured 1 proposal + ~7 simulation events
   + 3 LLM calls.
6. Verify production code paths were NOT touched (AD-19 LOCKED).
7. Verify the OpenSpec change folder generator works against a
   tmp_path repo with openspec/ directory.
8. Verify the GitHub Issue fallback returns a non-empty draft URL
   when the repo has no openspec/.

Run locally:
    cd backend
    python -m pytest tests/test_simulation_engine_smoke.py -v

Compliance: Lock 1 (no em dash). Lock 2 (no emoji). Lock 5 fixtures
labelled [MOCK NodeGoat fork 2FA proposal] where applicable.
"""

from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.services.refactor.demeter_adapter import StubDemeterAdapter  # noqa: E402
from app.services.refactor.github_issue_fallback import (  # noqa: E402
    draft_github_issue,
    has_openspec_folder,
)
from app.services.refactor.llm_stub import StubLLMClient  # noqa: E402
from app.services.refactor.openspec_generator import OpenSpecGenerator  # noqa: E402
from app.services.refactor.proposal_author import ProposalAuthor  # noqa: E402
from app.services.refactor.simulation_engine import SimulationEngine  # noqa: E402
from app.services.refactor.types import ProposalContext  # noqa: E402
from app.services.refactor.ws_publisher import (  # noqa: E402
    InMemoryRefactorBus,
    RefactorEventPublisher,
)


# ---------------------------------------------------------------------------
# Athena proposal author
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_proposal_author_nodegoat_2fa_intent() -> None:
    """[MOCK NodeGoat 2FA] Athena analyzes 'add 2FA to login' intent."""
    author = ProposalAuthor(llm=StubLLMClient())
    ctx = await author.analyze_intent(
        user_intent="I want to add 2FA to login.",
        repo_slug="OWASP/NodeGoat",
    )
    assert isinstance(ctx, ProposalContext)
    assert ctx.user_intent == "I want to add 2FA to login."
    assert ctx.title  # Athena produced a title
    assert ctx.summary  # Athena produced a summary
    assert ctx.openspec_change_path.startswith("openspec/changes/")
    # Stub LLM canned response includes at least 1 ghost hint.
    assert len(ctx.ghost_hints) >= 1
    # Ghost positions deterministic; x >= 65 to stay outside Iris envelope.
    for hint in ctx.ghost_hints:
        assert hint.position[0] >= 65.0
        assert hint.ghostId.startswith("ghost-")


# ---------------------------------------------------------------------------
# Simulation engine end-to-end
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_simulation_engine_e2e_publishes_full_event_sequence(
    tmp_path: Path,
) -> None:
    """[MOCK NodeGoat 2FA] Run the simulation engine end-to-end.

    Verifies:
    1. Events published in order: proposal + 6 stages + completed.
    2. drafts/<sim>/ contains tests + impl + diff.patch.
    3. Demeter persist captured 1 proposal + 7 simulation events + 3 LLM calls.
    """
    bus = InMemoryRefactorBus()
    publisher = RefactorEventPublisher(bus=bus)
    demeter = StubDemeterAdapter()
    llm = StubLLMClient()

    author = ProposalAuthor(llm=llm)
    proposal = await author.analyze_intent(
        user_intent="I want to add 2FA to login.",
        repo_slug="OWASP/NodeGoat",
    )

    # Use a deterministic simulation_id for assertion clarity.
    simulation_id = "sim-2fa-test-001"
    proposal.openspec_change_path = f"openspec/changes/{simulation_id}/"

    engine = SimulationEngine(
        llm=llm,
        demeter=demeter,
        publisher=publisher,
        drafts_root_override=tmp_path,
        repo_slug="OWASP/NodeGoat",
    )
    result = await engine.run(
        simulation_id=simulation_id,
        proposal=proposal,
        author_user_id=42,
    )

    # 1. Result shape
    assert result["simulation_id"] == simulation_id
    assert result["stage"] == "completed"
    assert result["diff_path"].endswith("diff.patch")
    assert result["files_affected"]

    # 2. Drafts directory contains tests + impl + diff
    sim_dir = tmp_path / simulation_id
    assert sim_dir.exists()
    diff_file = sim_dir / "diff.patch"
    assert diff_file.exists()
    assert diff_file.read_text().startswith("diff --git")

    # At least one test file under tests/ and one impl file outside tests/
    test_files = list(sim_dir.glob("tests/**/*"))
    assert any(p.is_file() for p in test_files)
    impl_files = [p for p in sim_dir.rglob("*") if p.is_file() and "tests" not in p.parts and p.name != "diff.patch"]
    assert any(impl_files)

    # 3. Event sequence
    history = await bus.history(simulation_id)
    types_in_order = [ev.get("type") for ev in history]
    stages_in_order = [ev.get("stage") for ev in history if ev.get("type") == "simulation.stage"]
    assert types_in_order[0] == "simulation.proposal"
    assert stages_in_order == [
        "tests_generating",
        "tests_written",
        "impl_generating",
        "impl_written",
        "diff_serializing",
        "completed",
    ]
    # Progress percentages match the contract matrix.
    progress_by_stage = {
        ev["stage"]: ev["payload"].get("progressPercent")
        for ev in history
        if ev.get("type") == "simulation.stage"
    }
    assert progress_by_stage["tests_generating"] == 10
    assert progress_by_stage["tests_written"] == 35
    assert progress_by_stage["impl_generating"] == 45
    assert progress_by_stage["impl_written"] == 78
    assert progress_by_stage["diff_serializing"] == 88
    assert progress_by_stage["completed"] == 100

    # 4. Demeter persist captured records
    assert len(demeter.proposals) == 1
    persisted = demeter.proposals[simulation_id]
    # On completion the engine updates stage to 'drafted'.
    assert persisted.stage == "drafted"
    assert len(demeter.simulation_events) == 6
    assert len(demeter.llm_calls) == 3
    # Verify each LLM call tagged with Athena resident + simulation_id.
    for call in demeter.llm_calls:
        assert call.simulation_id == simulation_id
        assert call.resident_id == "Athena"
        assert call.worker == "pandora"
    # Models per turn: V4-Pro think high (Turn 1+2), V4-Flash non-think (Turn 3).
    assert demeter.llm_calls[0].model_used == "V4-Pro"
    assert demeter.llm_calls[0].thinking_mode == "high"
    assert demeter.llm_calls[1].model_used == "V4-Pro"
    assert demeter.llm_calls[1].thinking_mode == "high"
    assert demeter.llm_calls[2].model_used == "V4-Flash"
    assert demeter.llm_calls[2].thinking_mode == "disabled"


@pytest.mark.asyncio
async def test_simulation_engine_does_not_touch_production_paths(
    tmp_path: Path,
) -> None:
    """AD-19 LOCKED: production paths NEVER mutated by simulation engine.

    Set DRAFTS_ROOT to tmp_path; verify nothing under
    ``backend/app`` or ``frontend/src`` was touched (mtime check on
    selected representative files before vs after).
    """
    # Pick representative production files; if they exist, snapshot mtime.
    sentinels: list[tuple[Path, float]] = []
    for rel in (
        "backend/app/__init__.py",
        "frontend/src/modes/refactor/types.ts",
    ):
        path = Path(__file__).resolve().parents[2] / rel
        if path.exists():
            sentinels.append((path, path.stat().st_mtime))

    bus = InMemoryRefactorBus()
    publisher = RefactorEventPublisher(bus=bus)
    demeter = StubDemeterAdapter()
    llm = StubLLMClient()
    author = ProposalAuthor(llm=llm)
    proposal = await author.analyze_intent(
        user_intent="Refactor login module to support TOTP",
        repo_slug="OWASP/NodeGoat",
    )
    simulation_id = "sim-ad19-check"
    proposal.openspec_change_path = f"openspec/changes/{simulation_id}/"
    engine = SimulationEngine(
        llm=llm,
        demeter=demeter,
        publisher=publisher,
        drafts_root_override=tmp_path,
    )
    await engine.run(simulation_id=simulation_id, proposal=proposal)

    for path, mtime_before in sentinels:
        assert path.stat().st_mtime == mtime_before, (
            f"AD-19 VIOLATION: production file mtime changed: {path}"
        )


# ---------------------------------------------------------------------------
# OpenSpec change folder generator
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_openspec_generator_writes_3_files_in_both_folders(
    tmp_path: Path,
) -> None:
    """Folder A + Folder B mirror per PRD Section 17.1 D27 LOCKED."""
    # Prepare a fake repo root with an openspec/ directory.
    repo_root = tmp_path / "fake-repo"
    (repo_root / "openspec").mkdir(parents=True)
    (repo_root / ".agent-openspec").mkdir(parents=True)

    author = ProposalAuthor(llm=StubLLMClient())
    ctx = await author.analyze_intent(
        user_intent="I want to add 2FA to login.",
        repo_slug="OWASP/NodeGoat",
    )

    generator = OpenSpecGenerator(repo_root=repo_root)
    folder_a, folder_b = generator.generate(ctx)

    assert folder_a.exists()
    assert folder_b.exists()
    for name in ("proposal.md", "design.md", "tasks.md"):
        assert (folder_a / name).exists()
        assert (folder_b / name).exists()
        # Files non-empty.
        assert (folder_a / name).stat().st_size > 100

    # Folder A proposal.md cites the user intent + ghost building hints.
    folder_a_proposal = (folder_a / "proposal.md").read_text()
    assert "I want to add 2FA to login" in folder_a_proposal
    assert "Ghost building hints" in folder_a_proposal


# ---------------------------------------------------------------------------
# GitHub Issue fallback
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_github_issue_fallback_when_no_openspec_dir(tmp_path: Path) -> None:
    """Progressive degradation per PRD Section 11."""
    repo_root = tmp_path / "fake-repo"
    repo_root.mkdir()
    # NOTE: no openspec/ directory created.
    assert has_openspec_folder(repo_root) is False

    author = ProposalAuthor(llm=StubLLMClient())
    ctx = await author.analyze_intent(
        user_intent="I want to add 2FA to login.",
        repo_slug="OWASP/NodeGoat",
    )
    draft = draft_github_issue(ctx, repo_slug="OWASP/NodeGoat")
    assert draft.title.lower().startswith("refactor:")
    assert "Proposal" in draft.body
    assert "Design" in draft.body
    assert "Tasks" in draft.body
    assert "refactor-proposal" in draft.labels
    url = draft.to_url()
    assert "OWASP/NodeGoat" in url
    assert "title=" in url


# ---------------------------------------------------------------------------
# Reasoning content quirk (Phase B Topic E)
# ---------------------------------------------------------------------------


class _ReasoningCaptureLLM(StubLLMClient):
    """Capture the multi-turn prompts to verify reasoning_content is NOT replayed."""

    def __init__(self) -> None:
        super().__init__()
        self.calls: list[dict] = []

    async def call(self, **kwargs):
        self.calls.append(
            {
                "messages": [
                    {"role": m.role, "content": m.content}
                    for m in kwargs["messages"]
                ],
                "prefer_pro": kwargs.get("prefer_pro"),
                "thinking_mode": kwargs.get("thinking_mode"),
            }
        )
        return await super().call(**kwargs)


@pytest.mark.asyncio
async def test_multi_turn_does_not_replay_reasoning_content(tmp_path: Path) -> None:
    """Phase B Topic E quirk: subsequent turns DO NOT include
    reasoning_content from prior turns.

    Pandora's prompt builders pass only ``response.content`` (visible
    text) into the next turn; the assistant role is NEVER explicitly
    inserted with a reasoning_content field. We verify by inspecting
    every prompt: no message role is 'assistant' (Pandora flattens
    Turn N-1 output into the user-role prompt instead, which strips
    reasoning_content by definition).
    """
    llm = _ReasoningCaptureLLM()
    bus = InMemoryRefactorBus()
    publisher = RefactorEventPublisher(bus=bus)
    demeter = StubDemeterAdapter()
    author = ProposalAuthor(llm=llm)
    proposal = await author.analyze_intent(
        user_intent="Refactor login to add 2FA",
        repo_slug="OWASP/NodeGoat",
    )
    proposal.openspec_change_path = "openspec/changes/sim-quirk/"
    engine = SimulationEngine(
        llm=llm,
        demeter=demeter,
        publisher=publisher,
        drafts_root_override=tmp_path,
    )
    await engine.run(simulation_id="sim-quirk", proposal=proposal)

    # Inspect every captured call: no message has role='assistant'.
    for entry in llm.calls:
        roles = {m["role"] for m in entry["messages"]}
        assert "assistant" not in roles, (
            f"Phase B Topic E violation: assistant role in messages={entry['messages']!r}"
        )
        # Every prompt is system + user only.
        assert roles.issubset({"system", "user"})


# ---------------------------------------------------------------------------
# Failure path: simulation engine handles malformed LLM output gracefully
# ---------------------------------------------------------------------------


class _BrokenLLM(StubLLMClient):
    async def call(self, **kwargs):
        from app.services.refactor.llm_stub import LLMResponse

        return LLMResponse(
            content="not_a_fenced_block_or_diff",
            model_used="V4-Pro",
            thinking_mode="high",
        )


@pytest.mark.asyncio
async def test_simulation_engine_handles_unparseable_output(tmp_path: Path) -> None:
    """When LLM output cannot be parsed into fenced files, the engine
    falls back to writing the raw output as a placeholder + still
    produces a completed event (so the UI is never stuck in-flight).
    """
    bus = InMemoryRefactorBus()
    publisher = RefactorEventPublisher(bus=bus)
    demeter = StubDemeterAdapter()
    llm = _BrokenLLM()
    author = ProposalAuthor(llm=llm)
    proposal = await author.analyze_intent(
        user_intent="Refactor module X",
        repo_slug="OWASP/NodeGoat",
    )
    proposal.openspec_change_path = "openspec/changes/sim-broken/"
    engine = SimulationEngine(
        llm=llm,
        demeter=demeter,
        publisher=publisher,
        drafts_root_override=tmp_path,
    )
    result = await engine.run(simulation_id="sim-broken", proposal=proposal)
    assert result["stage"] == "completed"
    sim_dir = tmp_path / "sim-broken"
    diff = sim_dir / "diff.patch"
    assert diff.exists()
