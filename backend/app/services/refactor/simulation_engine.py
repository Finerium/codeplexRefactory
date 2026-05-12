"""Refactor Mode simulation engine 3-turn orchestrator (Pandora Wave 3).

Owner: Pandora (Wave 3).

The simulation engine is the heart of Refactor Mode SAFETY-FIRST. It
orchestrates the 3-turn multi-turn LLM workflow per Phase B Topic 3c
+ PRD Section 18.6:

- Turn 1 ``test_gen`` (V4-Pro think high): failing tests
- Turn 2 ``impl_gen`` (V4-Pro think high): impl to make tests pass
- Turn 3 ``diff_serialize`` (V4-Flash non-think): unified diff format

Per turn:
1. Publish ``simulation.stage`` event ``<turn>_generating`` (turn start)
2. Build the user-role prompt via the ``prompts`` builders, EXPLICITLY
   passing only the visible Turn N-1 content (Phase B Topic E quirk:
   never replay ``reasoning_content``).
3. Call the Triton client (stubbed Cycle 1 via ``llm_stub``).
4. Persist the ``LLMCallLog`` row to Demeter.
5. Write the turn output to ``drafts/<sim-id>/<file>`` via
   ``safe_draft_write`` (AD-19 LOCKED guard).
6. Publish ``simulation.stage`` event ``<turn>_written`` (turn end).

Event sequence published per simulation (matches
``_meta/handoff_log/wave2_asclepius_to_pandora.md`` "Event publishing
matrix"):
1. ``simulation.proposal`` (RefactorProposalEvent at Turn 0)
2. stage='tests_generating' progress=10
3. stage='tests_written' progress=35 + filesAffected
4. stage='impl_generating' progress=45
5. stage='impl_written' progress=78 + filesAffected
6. stage='diff_serializing' progress=88
7. stage='completed' progress=100 + draftsPath

On user Accept:
8. stage='accepted' + diffFilePath

On user Discard:
8'. stage='discarded'

Failure path:
- Any turn raises -> publish stage='discarded' + payload.error, cleanup
  drafts.

References:
- ``_meta/contracts/triton-to-pandora.md`` lines 22-130 (3-turn workflow)
- ``_meta/contracts/pandora-to-asclepius.md`` lines 16-110
- ``_meta/handoff_log/wave2_asclepius_to_pandora.md`` lines 139-155
- PRD Section 9.3 + Section 18.6
- PRD AD-19 (drafts/ isolation safety property LOCKED)

Compliance: Lock 1 (no em dash). Lock 2 (no emoji). Lock 3 + AD-19
(drafts/ isolation MANDATORY). Lock 4 ([INFERRED] turn ratio progress
percentages adapted from the Asclepius Wave 2 mock pump timings).
"""

from __future__ import annotations

import logging
import re
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from .demeter_adapter import (
    DemeterAdapterProtocol,
    LLMCallLog,
    ProposalPersist,
    SimulationEventPersist,
    get_demeter_adapter,
)
from .drafts_isolation import (
    DraftIsolationViolation,
    cleanup_simulation_dir,
    safe_draft_write,
    simulation_dir,
)
from .llm_stub import LLMClientProtocol, LLMMessage, get_llm_client
from .prompts import (
    ATHENA_IMPL_GEN_SYSTEM,
    ATHENA_TEST_GEN_SYSTEM,
    DIFF_SERIALIZE_SYSTEM,
    build_diff_user_prompt,
    build_impl_gen_user_prompt,
    build_test_gen_user_prompt,
)
from .types import (
    GhostBuildingHint,
    ProposalContext,
    RefactorProposalEvent,
    SimulationEvent,
    SimulationEventPayload,
)
from .ws_publisher import RefactorEventPublisher

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _utc_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _build_call_id(simulation_id: str, turn: str) -> str:
    return f"call-{simulation_id}-{turn}-{uuid.uuid4().hex[:8]}"


# Pattern to split fenced code blocks per turn output (Athena prompt
# emits each file as ``# FILE: <path>`` header inside a fenced block).
_FENCE_PATTERN = re.compile(
    r"```[^\n]*\n(.*?)```",
    re.DOTALL,
)

_FILE_HEADER_PATTERN = re.compile(
    r"^[#/]+\s*FILE:\s*([^\n]+)\s*$",
    re.MULTILINE,
)


def _parse_fenced_files(content: str) -> list[tuple[str, str]]:
    """Parse Athena's Turn 1 / Turn 2 output into (path, body) pairs.

    Each fenced block may contain a header line ``# FILE: <path>`` or
    ``// FILE: <path>``. Blocks without a header are skipped.
    """
    pairs: list[tuple[str, str]] = []
    for block in _FENCE_PATTERN.findall(content):
        header_match = _FILE_HEADER_PATTERN.search(block)
        if not header_match:
            continue
        path = header_match.group(1).strip()
        # Strip the header line from the body so the file content does
        # not include it.
        body_lines = block.splitlines()
        body_lines = [
            ln
            for ln in body_lines
            if not _FILE_HEADER_PATTERN.match(ln.strip())
            and not _FILE_HEADER_PATTERN.match(ln)
        ]
        body = "\n".join(body_lines).strip("\n") + "\n"
        pairs.append((path, body))
    return pairs


def _extract_diff_block(content: str) -> str:
    """Pull the unified diff out of a fenced ``` ```diff block.

    Tolerant of:
    - ```diff ... ``` fence
    - ``` ... ``` bare fence
    - bare unfenced diff (lines starting with "diff --git")
    """
    fenced = re.search(r"```(?:diff)?\s*\n(.*?)```", content, re.DOTALL)
    if fenced:
        return fenced.group(1).strip("\n") + "\n"
    if "diff --git" in content:
        return content.strip("\n") + "\n"
    # Fallback: wrap the entire content so the user still gets something.
    return content


# ---------------------------------------------------------------------------
# Simulation engine
# ---------------------------------------------------------------------------


class SimulationEngine:
    """Refactor Mode multi-turn simulation orchestrator.

    Wave 3 Cycle 1 ship: fully runnable against the stub LLM +
    in-memory Demeter + in-memory event bus. The drafts/ isolation
    guard is active for every filesystem write (AD-19 LOCKED).
    """

    def __init__(
        self,
        *,
        llm: Optional[LLMClientProtocol] = None,
        demeter: Optional[DemeterAdapterProtocol] = None,
        publisher: Optional[RefactorEventPublisher] = None,
        drafts_root_override: Optional[Path] = None,
        repo_slug: str = "Finerium/codeplexRefactory",
    ) -> None:
        self._llm = llm or get_llm_client()
        self._demeter = demeter or get_demeter_adapter()
        self._publisher = publisher or RefactorEventPublisher()
        self._drafts_root_override = drafts_root_override
        self._repo_slug = repo_slug

    async def run(
        self,
        *,
        simulation_id: str,
        proposal: ProposalContext,
        author_user_id: Optional[int] = None,
    ) -> dict[str, object]:
        """Execute the 3-turn simulation.

        Returns a result dict with keys:
        - ``simulation_id``: str
        - ``drafts_path``: str (the absolute simulation directory)
        - ``diff_path``: str (the diff.patch under the simulation dir)
        - ``files_affected``: list[str] (paths under the simulation dir)
        - ``stage``: 'completed' on success, 'discarded' on failure.
        """
        sim_dir = simulation_dir(simulation_id, drafts_root_override=self._drafts_root_override)
        result: dict[str, object] = {
            "simulation_id": simulation_id,
            "drafts_path": str(sim_dir),
            "diff_path": "",
            "files_affected": [],
            "stage": "proposed",
        }

        try:
            await self._persist_initial_proposal(
                simulation_id=simulation_id,
                proposal=proposal,
                author_user_id=author_user_id,
            )
            await self._publish_proposal(simulation_id, proposal)

            test_content, test_files = await self._run_test_gen_turn(
                simulation_id=simulation_id,
                proposal=proposal,
            )
            impl_content, impl_files = await self._run_impl_gen_turn(
                simulation_id=simulation_id,
                proposal=proposal,
                test_content=test_content,
            )
            diff_path, diff_text = await self._run_diff_serialize_turn(
                simulation_id=simulation_id,
                test_content=test_content,
                impl_content=impl_content,
            )

            all_files = test_files + impl_files + [str(diff_path.relative_to(sim_dir))]
            result["files_affected"] = all_files
            result["diff_path"] = str(diff_path)
            result["stage"] = "completed"

            await self._publish_stage(
                simulation_id=simulation_id,
                stage="completed",
                payload=SimulationEventPayload(
                    progressPercent=100,
                    draftsPath=str(sim_dir),
                    filesAffected=all_files,
                ),
            )
            await self._demeter.update_proposal_stage(simulation_id, "drafted")
            return result

        except DraftIsolationViolation as err:
            # CRITICAL safety property violation per Pandora ferry condition 1.
            logger.error(
                "SimulationEngine: drafts isolation violation on sim=%s: %s",
                simulation_id,
                err,
            )
            await self._publish_stage(
                simulation_id=simulation_id,
                stage="discarded",
                payload=SimulationEventPayload(
                    error=f"drafts isolation violation: {err}",
                ),
            )
            await self._demeter.update_proposal_stage(simulation_id, "discarded")
            cleanup_simulation_dir(simulation_id, drafts_root_override=self._drafts_root_override)
            result["stage"] = "discarded"
            result["error"] = f"drafts_isolation_violation: {err}"
            return result

        except Exception as err:  # pragma: no cover - defensive
            logger.exception("SimulationEngine: unexpected failure on sim=%s", simulation_id)
            await self._publish_stage(
                simulation_id=simulation_id,
                stage="discarded",
                payload=SimulationEventPayload(error=f"{type(err).__name__}: {err}"),
            )
            await self._demeter.update_proposal_stage(simulation_id, "discarded")
            cleanup_simulation_dir(simulation_id, drafts_root_override=self._drafts_root_override)
            result["stage"] = "discarded"
            result["error"] = f"{type(err).__name__}: {err}"
            return result

    # ------------------------------------------------------------------
    # Turn implementations
    # ------------------------------------------------------------------

    async def _run_test_gen_turn(
        self,
        *,
        simulation_id: str,
        proposal: ProposalContext,
    ) -> tuple[str, list[str]]:
        await self._publish_stage(
            simulation_id=simulation_id,
            stage="tests_generating",
            payload=SimulationEventPayload(progressPercent=10),
        )

        messages: list[LLMMessage] = [
            LLMMessage(role="system", content=ATHENA_TEST_GEN_SYSTEM),
            LLMMessage(
                role="user",
                content=build_test_gen_user_prompt(
                    user_intent=proposal.user_intent,
                    context={
                        "title": proposal.title,
                        "summary": proposal.summary,
                        "ghost_hints": [_ghost_to_dict(g) for g in proposal.ghost_hints],
                    },
                ),
            ),
        ]
        started = time.monotonic()
        response = await self._llm.call(
            messages=messages,
            prefer_pro=True,
            thinking_mode="high",
            max_tokens=4000,
            worker="pandora",
            simulation_id=simulation_id,
            resident_id="Athena",
        )
        latency_ms = int((time.monotonic() - started) * 1000)
        await self._log_llm_call(
            simulation_id=simulation_id,
            turn="test_gen",
            response=response,
            latency_ms=latency_ms,
        )

        if response.error:
            raise RuntimeError(f"Turn 1 test_gen failed: {response.error}")

        files = _parse_fenced_files(response.content)
        if not files:
            # Defensive: write the raw output as a single placeholder.
            files = [("tests/test_unparsed.txt", response.content)]

        written: list[str] = []
        for rel_path, body in files:
            target = safe_draft_write(
                simulation_id,
                rel_path,
                body,
                drafts_root_override=self._drafts_root_override,
            )
            sim_dir = simulation_dir(simulation_id, drafts_root_override=self._drafts_root_override)
            written.append(str(target.relative_to(sim_dir)))

        await self._publish_stage(
            simulation_id=simulation_id,
            stage="tests_written",
            payload=SimulationEventPayload(
                progressPercent=35,
                filesAffected=written,
            ),
        )
        return response.content, written

    async def _run_impl_gen_turn(
        self,
        *,
        simulation_id: str,
        proposal: ProposalContext,
        test_content: str,
    ) -> tuple[str, list[str]]:
        await self._publish_stage(
            simulation_id=simulation_id,
            stage="impl_generating",
            payload=SimulationEventPayload(progressPercent=45),
        )

        # CRITICAL Phase B Topic E: pass only visible test_content; never
        # replay reasoning_content from the Turn 1 assistant message.
        messages: list[LLMMessage] = [
            LLMMessage(role="system", content=ATHENA_IMPL_GEN_SYSTEM),
            LLMMessage(
                role="user",
                content=build_impl_gen_user_prompt(
                    user_intent=proposal.user_intent,
                    test_content=test_content,
                    context={
                        "title": proposal.title,
                        "summary": proposal.summary,
                    },
                ),
            ),
        ]
        started = time.monotonic()
        response = await self._llm.call(
            messages=messages,
            prefer_pro=True,
            thinking_mode="high",
            max_tokens=6000,
            worker="pandora",
            simulation_id=simulation_id,
            resident_id="Athena",
        )
        latency_ms = int((time.monotonic() - started) * 1000)
        await self._log_llm_call(
            simulation_id=simulation_id,
            turn="impl_gen",
            response=response,
            latency_ms=latency_ms,
        )

        if response.error:
            raise RuntimeError(f"Turn 2 impl_gen failed: {response.error}")

        files = _parse_fenced_files(response.content)
        if not files:
            files = [("src/impl_unparsed.txt", response.content)]

        written: list[str] = []
        for rel_path, body in files:
            target = safe_draft_write(
                simulation_id,
                rel_path,
                body,
                drafts_root_override=self._drafts_root_override,
            )
            sim_dir = simulation_dir(simulation_id, drafts_root_override=self._drafts_root_override)
            written.append(str(target.relative_to(sim_dir)))

        await self._publish_stage(
            simulation_id=simulation_id,
            stage="impl_written",
            payload=SimulationEventPayload(
                progressPercent=78,
                filesAffected=written,
            ),
        )
        return response.content, written

    async def _run_diff_serialize_turn(
        self,
        *,
        simulation_id: str,
        test_content: str,
        impl_content: str,
    ) -> tuple[Path, str]:
        await self._publish_stage(
            simulation_id=simulation_id,
            stage="diff_serializing",
            payload=SimulationEventPayload(progressPercent=88),
        )

        # Phase B Topic E: visible content only, no reasoning_content.
        messages: list[LLMMessage] = [
            LLMMessage(role="system", content=DIFF_SERIALIZE_SYSTEM),
            LLMMessage(
                role="user",
                content=build_diff_user_prompt(
                    test_content=test_content,
                    impl_content=impl_content,
                ),
            ),
        ]
        started = time.monotonic()
        response = await self._llm.call(
            messages=messages,
            prefer_pro=False,
            thinking_mode="disabled",
            max_tokens=8000,
            worker="pandora",
            simulation_id=simulation_id,
            resident_id="Athena",
        )
        latency_ms = int((time.monotonic() - started) * 1000)
        await self._log_llm_call(
            simulation_id=simulation_id,
            turn="diff_serialize",
            response=response,
            latency_ms=latency_ms,
        )

        if response.error:
            raise RuntimeError(f"Turn 3 diff_serialize failed: {response.error}")

        diff_text = _extract_diff_block(response.content)
        diff_path = safe_draft_write(
            simulation_id,
            "diff.patch",
            diff_text,
            drafts_root_override=self._drafts_root_override,
        )
        return diff_path, diff_text

    # ------------------------------------------------------------------
    # Persistence helpers
    # ------------------------------------------------------------------

    async def _persist_initial_proposal(
        self,
        *,
        simulation_id: str,
        proposal: ProposalContext,
        author_user_id: Optional[int],
    ) -> None:
        record = ProposalPersist(
            proposal_id=simulation_id,
            user_intent=proposal.user_intent,
            openspec_change_path=proposal.openspec_change_path,
            repo_full_name=self._repo_slug,
            author_user_id=author_user_id,
            stage="proposed",
            title=proposal.title,
            summary=proposal.summary,
            affected_files=list(proposal.affected_files),
            created_at=_utc_iso(),
        )
        await self._demeter.persist_proposal(record)

    async def _publish_proposal(
        self,
        simulation_id: str,
        proposal: ProposalContext,
    ) -> None:
        event = RefactorProposalEvent(
            simulationId=simulation_id,
            openspecChangePath=proposal.openspec_change_path,
            title=proposal.title,
            summary=proposal.summary,
            userIntent=proposal.user_intent,
            ghostBuildings=list(proposal.ghost_hints),
            timestamp=_utc_iso(),
        )
        await self._publisher.publish_proposal(event)

    async def _publish_stage(
        self,
        *,
        simulation_id: str,
        stage: str,
        payload: SimulationEventPayload,
    ) -> None:
        timestamp = _utc_iso()
        event = SimulationEvent(
            simulationId=simulation_id,
            stage=stage,  # type: ignore[arg-type]
            timestamp=timestamp,
            payload=payload,
        )
        await self._publisher.publish_stage(event)
        await self._demeter.persist_simulation_event(
            SimulationEventPersist(
                simulation_id=simulation_id,
                stage=stage,
                payload=payload.model_dump(mode="json"),
                timestamp=timestamp,
            )
        )

    async def _log_llm_call(
        self,
        *,
        simulation_id: str,
        turn: str,
        response,
        latency_ms: int,
    ) -> None:
        call = LLMCallLog(
            call_id=getattr(response, "call_id", None) or _build_call_id(simulation_id, turn),
            worker="pandora",
            simulation_id=simulation_id,
            resident_id="Athena",
            model_used=getattr(response, "model_used", "V4-Flash"),
            thinking_mode=getattr(response, "thinking_mode", "disabled"),
            cache_hit=getattr(response, "cache_hit", False),
            canned_hit=getattr(response, "canned_hit", False),
            input_tokens=getattr(response, "input_tokens", 0),
            output_tokens=getattr(response, "output_tokens", 0),
            cost_estimate_usd=getattr(response, "cost_estimate_usd", 0.0),
            latency_ms=latency_ms,
            timestamp=_utc_iso(),
            error=getattr(response, "error", None),
        )
        await self._demeter.persist_llm_call(call)


def _ghost_to_dict(hint: GhostBuildingHint) -> dict[str, object]:
    """Serialise GhostBuildingHint to a JSON-safe dict for the LLM prompt."""
    return hint.model_dump(mode="json")


__all__ = ["SimulationEngine"]
