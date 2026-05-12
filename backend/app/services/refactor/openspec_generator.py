"""OpenSpec change folder generator (Pandora Wave 3).

Owner: Pandora (Wave 3).

Generates the canonical OpenSpec v1.0 change folder structure:

    openspec/changes/<change-name>/
        proposal.md  (ADDED Requirement plus user-facing why)
        design.md    (technical approach + alternative considered + trade-off)
        tasks.md     (actionable checklist)

Plus the Folder B mirror per PRD Section 17.1 D27 LOCKED:

    .agent-openspec/changes/<change-name>/
        proposal.md  (internal workflow narration)
        design.md    (internal agent-only notes)
        tasks.md     (internal cycle tracking)

The Folder A copy is panitia-facing (Refactory judges review). The
Folder B copy is internal workflow agent output (NOT panitia
consumption).

References:
- ``.claude/skills/openspec-workflow/SKILL.md`` (canonical layout)
- PRD Section 17.1 D27 LOCKED (dual-folder strategy)
- ``_meta/contracts/asclepius-to-pandora.md`` line 59 (simulationId
  matches change folder name)
- OpenSpec docs https://github.com/Fission-AI/OpenSpec

Compliance: Lock 1 (no em dash). Lock 2 (no emoji). Lock 4 ([INFERRED]
for the OpenSpec v1.0 spec template structure; the templates below
match the project-local ``openspec/specs/*/spec.md`` files Themis
authored Wave 0 Cycle 6 + the OpenSpec docs README example).
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from .types import ProposalContext

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Folder roots (override via env in K8s; default to repo-relative)
# ---------------------------------------------------------------------------


def _default_folder_a_root() -> Path:
    return Path("openspec")


def _default_folder_b_root() -> Path:
    return Path(".agent-openspec")


# ---------------------------------------------------------------------------
# Markdown templates
# ---------------------------------------------------------------------------


PROPOSAL_TEMPLATE = """# Proposal: {title}

> Authored by Athena (Refactor Mode) on {timestamp}. Folder A panitia-facing primary spec; mirror lives at `.agent-openspec/changes/{change_name}/` for the internal workflow agent layer.

## Why

{summary}

## What changes

{user_intent_section}

## Impact

- **Affected files** ({affected_count}): {affected_files_list}
- **Complexity**: {complexity}
- **Callsite count from parser pre-pass**: {callsite_count}

## Ghost building hints

{ghost_hints_section}

## Out of scope

- The simulation engine writes ALL files under `drafts/{change_name}/`; production code is untouched until the user clicks Accept at the dual review gate.
- This proposal does NOT auto-create a PR. Per OQ-09, the Accept path returns a downloadable diff for manual apply.

## Open questions

- _None at proposal time. Add concerns to `_meta/uncertainty/pandora-cycle<N>-<timestamp>.md` if they surface during simulation._
"""


DESIGN_TEMPLATE = """# Design: {title}

> Technical approach plus alternatives considered. Authored by Athena (Refactor Mode) on {timestamp}.

## Approach

Athena V4-Pro thinking high routed via Triton client. Simulation engine 3-turn workflow:

- Turn 1 (V4-Pro think high): generate failing tests against the proposed module.
- Turn 2 (V4-Pro think high): generate implementation code that makes Turn 1 tests pass.
- Turn 3 (V4-Flash non-think): serialise the test plus impl changes into a unified diff.

Per PRD Section 18.6 + Phase B Topic 3c.

## Alternatives considered

1. **Single-turn generation**: rejected. V4-Pro think high benefits from explicit test-first prompting; single-turn output mixes test plus impl and tends to produce inconsistent test/impl pairs.
2. **Auto-apply diff on simulation completion**: rejected per PRD AD-19. Production code never changes by the simulation engine. Only the user-explicit Accept path materialises a downloaded diff (OQ-09).
3. **Multi-language simulation**: deferred. Wave 3 demo covers TypeScript / JavaScript (NodeGoat) + Python (PyGoat) only.

## Trade-offs

- **Cost**: 3 V4-Pro think high calls per simulation cost ~$0.05 to $0.20. Hafiz $5 budget covers 25 to 100 simulations.
- **Latency**: V4-Pro think high turns can take 5 to 15 seconds each. Total simulation ~30 to 60 seconds. Acceptable for the SAFETY-FIRST pitch beat ("AI explores in drafts; you commit to production").
- **Ghost position layout**: deterministic placement at x >= 65 outside the Iris treemap envelope. Cycle 2 polish: adopt a per-district adjacent-band placement if the 2D scrubber overlays the ghosts.

## drafts/ isolation safety property (AD-19 LOCKED)

The simulation engine writes ONLY under `drafts/{change_name}/`. The
guard at `backend/app/services/refactor/drafts_isolation.py` enforces
this via `pathlib.Path.resolve` plus a subpath check; escape attempts
raise `DraftIsolationViolation` before any filesystem write.

## DeepSeek reasoning_content quirk (Phase B Topic E)

Multi-turn coordination does NOT replay `reasoning_content` from prior
turns. The Triton client builder strips `reasoning_content` from
assistant messages before submitting subsequent turns; the Pandora
prompt builders also drop it defensively (see `prompts.py`).
"""


TASKS_TEMPLATE = """# Tasks: {title}

> Actionable checklist for the Athena proposal. Track completion in `_meta/decision_log/pandora.md` plus the dual review gate stage events.

## 1. Proposal authoring (Athena Turn 0)

- [x] Capture user intent: `{user_intent_one_line}`
- [x] Parser pre-pass (Hades `find_callsites`) collect candidate symbols
- [x] Athena V4-Pro think high call to produce proposal JSON
- [x] Compute deterministic ghost building positions
- [x] Generate this OpenSpec change folder (proposal.md plus design.md plus tasks.md)

## 2. Simulation engine (3-turn)

- [ ] Turn 1 test_gen (V4-Pro think high): generate failing tests, write under `drafts/{change_name}/tests/`
- [ ] Turn 2 impl_gen (V4-Pro think high): generate implementation, write under `drafts/{change_name}/`
- [ ] Turn 3 diff_serialize (V4-Flash non-think): produce `drafts/{change_name}/diff.patch`
- [ ] Publish SimulationEvent at each stage to `/api/ws/refactor-events`
- [ ] Persist SimulationEvent rows in Demeter `simulation_events` table

## 3. Dual review gate

- [ ] User reviews the diff in the Asclepius dual review gate UI
- [ ] On Accept: POST /api/refactor/{change_name}/accept returns `drafts/{change_name}/diff.patch` as a FileResponse download (OQ-09)
- [ ] On Discard: POST /api/refactor/{change_name}/discard cleans up the drafts directory

## 4. Archival (post-Accept)

- [ ] Move `openspec/changes/{change_name}/` to `openspec/archive/{change_name}/`
- [ ] Mirror move under `.agent-openspec/archive/{change_name}/`
- [ ] Update Demeter `proposals.stage` to `accepted`

## 5. Cleanup

- [ ] On Discard, mark Demeter `proposals.stage` to `discarded`
- [ ] Remove `drafts/{change_name}/` (best-effort, see `drafts_isolation.cleanup_simulation_dir`)
"""


FOLDER_B_PROPOSAL_TEMPLATE = """# Internal workflow proposal: {title}

> Folder B mirror of `openspec/changes/{change_name}/proposal.md`. Internal workflow agent layer; NOT panitia-facing. Pandora Wave 3 + Aletheia audit consume.

## What

{summary}

## Why this matters to the workflow agent

This proposal triggered the Refactor Mode simulation engine on {timestamp}. The agent layer records this so Aletheia audit can verify the 9-stage SimulationStage sequence completed.

## Workflow agent specific concerns

- `simulationId` = `{change_name}` (matches Folder A change name)
- Athena V4-Pro thinking high call recorded in Demeter `llm_call_log` table.
- Drafts isolation property AD-19 verified at write-time (see `backend/tests/test_drafts_isolation_smoke.py`).
"""


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _format_ghost_hints_md(ctx: ProposalContext) -> str:
    """Render ghost hints as a markdown bullet list."""
    if not ctx.ghost_hints:
        return "- _(none suggested; Athena proposed a structural change with no new files.)_"
    lines: list[str] = []
    for hint in ctx.ghost_hints:
        connections = ", ".join(
            f"`{c.targetBuildingId}` ({c.relationship})" for c in hint.connections
        )
        if not connections:
            connections = "_(none)_"
        lines.append(
            f"- **{hint.label}** ({hint.archetype})\n"
            f"  - Suggested path: `{hint.suggestedFilePath}`\n"
            f"  - Position: ({hint.position[0]:.1f}, {hint.position[1]:.1f}, {hint.position[2]:.1f})\n"
            f"  - Footprint: {hint.width:.1f} x {hint.depth:.1f} x {hint.height:.1f}\n"
            f"  - Connections: {connections}"
        )
    return "\n".join(lines)


def _format_affected_files(ctx: ProposalContext) -> str:
    """Render affected files inline."""
    if not ctx.affected_files:
        return "_(none identified by parser pre-pass)_"
    return ", ".join(f"`{f}`" for f in ctx.affected_files[:20])


def _format_user_intent_section(ctx: ProposalContext) -> str:
    """Render the user intent block."""
    intent = ctx.user_intent.strip()
    if "\n" in intent:
        body = "\n".join(f"> {line}" for line in intent.splitlines())
    else:
        body = f"> {intent}"
    return (
        "User intent (verbatim):\n\n"
        f"{body}\n\n"
        f"Proposal summary: {ctx.summary}"
    )


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Generator
# ---------------------------------------------------------------------------


class OpenSpecGenerator:
    """Generate OpenSpec change folders (Folder A + Folder B mirror)."""

    def __init__(
        self,
        *,
        folder_a_root: Optional[Path] = None,
        folder_b_root: Optional[Path] = None,
        repo_root: Optional[Path] = None,
    ) -> None:
        repo_root = Path(repo_root or ".").resolve()
        self._repo_root = repo_root
        self._folder_a_root = (folder_a_root or repo_root / _default_folder_a_root()).resolve()
        self._folder_b_root = (folder_b_root or repo_root / _default_folder_b_root()).resolve()

    def change_name(self, ctx: ProposalContext) -> str:
        """Derive the change folder name from the OpenSpec change path."""
        # ProposalContext.openspec_change_path is "openspec/changes/<name>/"
        parts = ctx.openspec_change_path.strip("/").split("/")
        return parts[-1] if parts else "refactor-proposal"

    def generate_folder_a(self, ctx: ProposalContext) -> Path:
        """Write the Folder A change folder under ``openspec/changes/``.

        Returns the absolute path of the change folder.
        """
        change_name = self.change_name(ctx)
        folder = self._folder_a_root / "changes" / change_name
        folder.mkdir(parents=True, exist_ok=True)
        self._write_folder_a_files(folder, ctx, change_name)
        logger.info("openspec_generator: wrote Folder A change folder %s", folder)
        return folder

    def generate_folder_b(self, ctx: ProposalContext) -> Path:
        """Write the Folder B mirror under ``.agent-openspec/changes/``."""
        change_name = self.change_name(ctx)
        folder = self._folder_b_root / "changes" / change_name
        folder.mkdir(parents=True, exist_ok=True)
        self._write_folder_b_files(folder, ctx, change_name)
        logger.info("openspec_generator: wrote Folder B mirror %s", folder)
        return folder

    def generate(self, ctx: ProposalContext) -> tuple[Path, Path]:
        """Generate both folders. Returns (folder_a_path, folder_b_path)."""
        return self.generate_folder_a(ctx), self.generate_folder_b(ctx)

    # ------------------------------------------------------------------
    # Internals
    # ------------------------------------------------------------------

    def _write_folder_a_files(
        self,
        folder: Path,
        ctx: ProposalContext,
        change_name: str,
    ) -> None:
        affected_count = len(ctx.affected_files)
        user_intent_one_line = ctx.user_intent.replace("\n", " ").strip()
        context = {
            "title": ctx.title,
            "timestamp": _now_iso(),
            "summary": ctx.summary,
            "user_intent_section": _format_user_intent_section(ctx),
            "affected_count": affected_count,
            "affected_files_list": _format_affected_files(ctx),
            "complexity": ctx.complexity,
            "callsite_count": ctx.callsite_count,
            "ghost_hints_section": _format_ghost_hints_md(ctx),
            "change_name": change_name,
            "user_intent_one_line": user_intent_one_line,
        }
        (folder / "proposal.md").write_text(PROPOSAL_TEMPLATE.format(**context), encoding="utf-8")
        (folder / "design.md").write_text(DESIGN_TEMPLATE.format(**context), encoding="utf-8")
        (folder / "tasks.md").write_text(TASKS_TEMPLATE.format(**context), encoding="utf-8")

    def _write_folder_b_files(
        self,
        folder: Path,
        ctx: ProposalContext,
        change_name: str,
    ) -> None:
        context = {
            "title": ctx.title,
            "summary": ctx.summary,
            "change_name": change_name,
            "timestamp": _now_iso(),
        }
        (folder / "proposal.md").write_text(
            FOLDER_B_PROPOSAL_TEMPLATE.format(**context), encoding="utf-8"
        )
        # Folder B design + tasks are intentionally lighter; the panitia
        # facing copy in Folder A carries the full content. Folder B is
        # internal-only narration per PRD Section 17.1 D27 LOCKED.
        (folder / "design.md").write_text(
            f"# Internal design notes for {ctx.title}\n\n"
            f"See Folder A `openspec/changes/{change_name}/design.md` for the "
            f"panitia-facing copy. This file is the internal workflow agent "
            f"mirror per PRD Section 17.1 D27.\n",
            encoding="utf-8",
        )
        (folder / "tasks.md").write_text(
            f"# Internal task tracker for {ctx.title}\n\n"
            f"See Folder A `openspec/changes/{change_name}/tasks.md` for the "
            f"panitia-facing copy. This file is the internal workflow agent "
            f"mirror.\n",
            encoding="utf-8",
        )


__all__ = [
    "OpenSpecGenerator",
    "PROPOSAL_TEMPLATE",
    "DESIGN_TEMPLATE",
    "TASKS_TEMPLATE",
]
