# Contract: Triton to Pandora

**Edge type**: intra-wave (Wave 3 internal)
**Wave**: Wave 3 producer to Wave 3 consumer
**Status**: locked
**Authored**: 2026-05-12 16:02 WIB

## Producer

**Worker**: Triton (Wave 3)
**Domain**: DeepSeek V4 client (shared with `triton-to-nemesis.md`) + defensive layer + thinking-mode toggle. Triton exposes the LLMClient module for Pandora's Athena proposal author + Refactor Mode simulation engine multi-turn (V4-Pro thinking high per PRD Section 18.3 for Athena; V4-Pro thinking high for simulation engine turns; V4-Flash non-think for diff serialization).

## Consumer

**Worker**: Pandora (Wave 3)
**Domain**: Athena proposal author + OpenSpec change folder generator (Folder A) + Refactor Mode simulation engine multi-turn + drafts/ isolation + dual review gate backend. Pandora is the heaviest LLM consumer in Wave 3 (multi-turn coordination with V4-Pro thinking high, highest cost per call). Cost tracking + cache-hit critical.

## Output schema (producer to consumer)

Pandora uses the same `LLMClient` from `triton-to-nemesis.md` but with multi-turn coordination patterns specific to Refactor simulation engine.

Multi-turn workflow per Phase B inferred algorithm (PRD Section 18.6):

```python
# backend/app/services/simulation_engine.py (Pandora authors)
from app.services.llm_client import get_llm_client, LLMMessage, LLMResponse
from app.services.event_bus import publish_event
from app.parsers import get_parser_service


class SimulationEngine:
    """Refactor Mode multi-turn simulation per PRD Section 18.6."""

    def __init__(self):
        self.llm = get_llm_client()
        self.parser = get_parser_service()

    async def run(
        self,
        simulation_id: str,
        user_intent: str,
        target_repo: str,
    ) -> None:
        """Multi-turn simulation. Publishes SimulationEvent stages."""

        # Turn 0: Proposal context (Athena identifies affected files via LLM + parser)
        await publish_event(SimulationEvent(
            type="simulation.stage", simulation_id=simulation_id, stage="proposed",
            payload={"ghost_buildings": [...]},
        ))

        # Turn 1: Test generation (V4-Pro think high)
        await publish_event(SimulationEvent(
            type="simulation.stage", simulation_id=simulation_id, stage="tests_generating",
        ))
        test_response = await self.llm.call(
            messages=[
                LLMMessage(role="system", content=ATHENA_TEST_GEN_PROMPT),
                LLMMessage(role="user", content=build_test_gen_prompt(user_intent, context)),
            ],
            prefer_pro=True,
            thinking_mode="high",
            max_tokens=4000,
        )
        write_tests_to_drafts(test_response.content, simulation_id)
        await publish_event(SimulationEvent(
            type="simulation.stage", simulation_id=simulation_id, stage="tests_written",
            payload={"files_affected": [...]},
        ))

        # Turn 2: Implementation generation (V4-Pro think high)
        # CRITICAL: do NOT pass reasoning_content from Turn 1 (Phase B quirk)
        await publish_event(SimulationEvent(
            type="simulation.stage", simulation_id=simulation_id, stage="impl_generating",
        ))
        impl_response = await self.llm.call(
            messages=[
                LLMMessage(role="system", content=ATHENA_IMPL_GEN_PROMPT),
                LLMMessage(role="user", content=build_impl_gen_prompt(user_intent, context, test_response.content)),
                # NOTE: test_response.content is the visible content; reasoning_content NOT included
            ],
            prefer_pro=True,
            thinking_mode="high",
            max_tokens=6000,
        )
        write_impl_to_drafts(impl_response.content, simulation_id)
        await publish_event(SimulationEvent(
            type="simulation.stage", simulation_id=simulation_id, stage="impl_written",
        ))

        # Turn 3: Diff serialization (V4-Flash non-think)
        await publish_event(SimulationEvent(
            type="simulation.stage", simulation_id=simulation_id, stage="diff_serializing",
        ))
        diff_response = await self.llm.call(
            messages=[
                LLMMessage(role="system", content=DIFF_SERIALIZE_PROMPT),
                LLMMessage(role="user", content=build_diff_prompt(test_response.content, impl_response.content)),
            ],
            prefer_pro=False,
            thinking_mode="disabled",
            max_tokens=8000,
        )
        write_diff_file(diff_response.content, simulation_id)
        await publish_event(SimulationEvent(
            type="simulation.stage", simulation_id=simulation_id, stage="completed",
            payload={"drafts_path": f"drafts/{simulation_id}/", "diff_file_path": f"drafts/{simulation_id}/changes.diff"},
        ))


# Persona prompts sourced from Hephaestus PromptOpening:
ATHENA_TEST_GEN_PROMPT = """
You are Athena, the architect resident of Codeplex Chronicle.
Refactor Mode Turn 1: Generate failing tests for the user's stated intent.
Output format: TypeScript/Python test files in fenced code blocks with file paths in headers.
Tests MUST fail when run against current implementation. Use existing test framework discovered from repo (Vitest / pytest / etc).
"""

ATHENA_IMPL_GEN_PROMPT = """
You are Athena, the architect resident.
Refactor Mode Turn 2: Generate implementation code to make Turn 1's failing tests pass.
Output format: code files in fenced blocks with file paths in headers.
Files written to drafts/ sandbox; NEVER modify production code.
"""

DIFF_SERIALIZE_PROMPT = """
You are a diff serializer. Convert the test + implementation file changes into unified diff format
(diff --git a/<path> b/<path>). Strict format compliance for downstream apply.
"""
```

Athena proposal author (Turn 0) uses different prompt:

```python
# backend/app/services/proposal_author.py (Pandora)
ATHENA_PROPOSAL_PROMPT = """
You are Athena, the architect resident of Codeplex Chronicle.
Your role: when a user states a refactoring intent in plain language, you:
  1. Identify affected files + dependencies (use parser callsite query).
  2. Propose ghost building locations + suggested file paths.
  3. Generate OpenSpec proposal.md + design.md + tasks.md content.
Tone: thoughtful, architectural reasoning. Cite affected callsite counts.
Output: structured JSON with proposal_summary, design_notes, task_breakdown.
"""
```

## Storage location

- LLM client: `backend/app/services/llm_client.py` (Triton, shared with Nemesis)
- Simulation engine: `backend/app/services/simulation_engine.py` (Pandora)
- Proposal author: `backend/app/services/proposal_author.py` (Pandora)
- Athena persona prompts: `PromptOpening-codeplex-chronicle.md` (Hephaestus Wave 0)
- Drafts directory: `drafts/<simulation_id>/` (Pandora writes; FIles never touch production code)
- OpenSpec change folder: `openspec/changes/<simulation_id>/` (Pandora writes proposal.md + design.md + tasks.md)
- Cost log: `llm_call_log` table via Demeter (see `pandora-to-demeter.md`)

## Asumption baked

1. Athena routes to V4-Pro thinking high per PRD Section 18.3 (locked).
2. Simulation engine 3-turn architecture per Phase B inferred algorithm + PRD Section 18.6.
3. CRITICAL: do NOT replay `reasoning_content` from prior turns in multi-turn (Phase B Topic E quirk). LLMClient builder strips reasoning_content from assistant messages in subsequent turns.
4. drafts/ isolation safety property: write only inside `drafts/<simulation_id>/`. Production code NEVER changes (PRD AD-19 safety lock).
5. Multi-turn cost budget: 3 turns at V4-Pro think high ~ $0.05-0.20 per simulation per Phase B estimates. Hafiz $5 budget supports 25-100 simulations across hackathon.
6. Each simulation has unique simulation_id; can run concurrently if multiple users; each writes to isolated drafts dir.

## Validation steps

**Producer responsibility (Triton)**:
- `LLMClient.call` supports multi-turn message lists correctly; system + user + assistant alternation honored.
- thinking_mode="high" parameter passes correctly to DeepSeek API.
- reasoning_content captured in response but builder helper strips before next turn.
- Cost estimate accurate per PRD Section 18.1 pricing.
- Cache-hit possible across simulations if user intents similar (semantic cache cosine 0.85 threshold).

**Consumer responsibility (Pandora)**:
- 3 turns execute in order; each turn publishes SimulationEvent before + after.
- Drafts directory write paths validated against `drafts/<simulation_id>/` prefix (no path traversal).
- Test + impl + diff prompts use Hephaestus PromptOpening Athena persona.
- Diff serialization Turn 3 produces parseable unified diff format.
- Smoke test: 2FA proposal on NodeGoat fork produces drafts/ with failing tests, passing impl, valid diff.

## Edge case handling

- LLM call timeout (V4-Pro think high can be slow): Triton enforces 30s default, 60s max per turn. Pandora retries once on timeout.
- Drafts dir already exists (rare; simulation_id collision): Pandora regenerates id with counter suffix.
- Generated code malformed (parse error per `hades-to-pandora.md` verify_draft_syntax): Pandora retries Turn 2 with stricter prompt + parse error context; max 2 retries before marking simulation 'failed'.
- Diff serialization produces empty diff (no actual changes generated): Pandora marks simulation 'failed' with error "No changes generated" + suggests user refine intent.
- Cost budget approaching limit: Demeter cost tracker publishes warning event; Pandora can be configured to halt new simulations if budget < $0.50 remaining.

## Open questions

- OQ-07 (model split optimal): Athena V4-Pro think high locked per PRD; smoke test Wave 3 reveals if latency > 10s consistently, fallback to V4-Flash think high for Turn 1+2 trial.
- Multi-language simulation: Wave 3 demo focuses on TypeScript/JavaScript (NodeGoat) + Python (PyGoat). Other languages stretch.
- Concurrent simulations: tested at 3 simultaneous; rate limit budget allows; demo focuses on serial 1-at-a-time.

## Reference

- Metis Agentic Structure md Section 2 DAG: Triton LLM client module consumed by Pandora for Athena proposal author multi-turn
- Metis Section 5.6 Triton + Pandora ship criteria
- PRD Section 9.3 (Refactor Mode SAFETY-FIRST + drafts/ sandbox + dual review gate)
- PRD Section 18.3 (Athena V4-Pro think high locked; simulation engine V4-Pro think high)
- PRD Section 18.6 (DeepSeek multi-turn coordination Refactor Mode)
- PRD AD-19 (drafts/ isolation safety property)
- Phase B Topic E (DeepSeek V4 reliability + reasoning_content quirk LOCKED)
- Hephaestus Wave 0 PromptOpening (Athena persona prompts)
- Contract `triton-to-nemesis.md` (sibling LLM client consumer)
- Contract `hades-to-pandora.md` (parser API for proposal author file query + drafts verification)
- Contract `asclepius-to-pandora.md` (SimulationEvent stage stream)
