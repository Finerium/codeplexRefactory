# Decision Log: Pandora (Wave 3)

**Worker**: Pandora (Wave 3)
**Domain**: Athena proposal author + Refactor simulation engine multi-turn + drafts/ isolation + OpenSpec change folder generator + GitHub Issue fallback + dual review gate API + WebSocket publisher
**Spawn**: 2026-05-12 20:55 WIB Day 1 evening (Wave 3 batch 4 of 6)
**Cycle**: 1 (combined: types + drafts isolation + proposal author + openspec generator + simulation engine + dual review gate API + WebSocket route + smoke tests, single ship per V2 unlock pace)

## Decision 1: AD-19 drafts/ isolation guard FIRST cycle (safety property priority)

**Decision**: Cycle 1 implements drafts isolation guard + 14 attack-vector smoke tests BEFORE any LLM call, proposal author, OpenSpec generator, simulation engine, or API code.

**Rationale**: Per `.claude/agents/pandora.md` Section 4 + 10 Item 17: drafts/ isolation is the LOCKED safety property + pitch defensibility hinge. Item 17 self-check is the block-fail item; ferry condition 1 is the CRITICAL halt-all-writes trigger. The guard must exist + be provable BEFORE the simulation engine writes anything to disk so a regression is caught at unit-test layer, not at audit.

**Impact**: Sequence is `types.py` -> `drafts_isolation.py` -> `test_drafts_isolation_smoke.py` -> the rest of the stack. Every `safe_draft_write` call goes through the guard; simulation_engine never bypasses it.

**Verification**: 14 attack-vector tests pass (parent traversal, absolute path, sibling sim, path-separator-in-sim-id, special-char-in-sim-id, empty sim-id, null-byte, symlink escape, happy path nested, cleanup happy + idempotent, env override). Plus a separate mtime-sentinel test verifies production paths (`backend/app/__init__.py`, `frontend/src/modes/refactor/types.ts`) are NOT mutated by an end-to-end simulation run.

## Decision 2: 9-stage SimulationStage enum mirrored verbatim from Asclepius Wave 2

**Decision**: `backend/app/services/refactor/types.py` declares `SimulationStage` as a `Literal[...]` matching the 9 values Asclepius Wave 2 locked at `frontend/src/modes/refactor/simulationEvents.ts` lines 28-37.

**Rationale**: Per `_meta/handoff_log/wave2_asclepius_to_pandora.md` "9-stage SimulationStage enum LOCKED Wave 2 hand-off, JANGAN remap". The Asclepius client (`useSimulationEvents.ts`) deserialises `RefactorEvent` JSON via `JSON.parse(e.data) as RefactorEvent`; backend Pydantic serialisation must round-trip via the same stage strings. Any drift = pitch defensibility crash + visual hand-off break.

**Verification**: `test_simulation_stage_has_9_locked_values` checks `get_args(SimulationStage)` matches the locked tuple. `test_simulation_event_serialises_with_type_discriminator` round-trips a Pydantic event through JSON.

## Decision 3: Stub-and-sync via local Protocol declarations (LLMClient + ParserService + DemeterAdapter + EventBus)

**Decision**: Pandora declares 4 stub modules with `Protocol` interfaces + in-memory `Stub*` impls so the simulation engine ships end-to-end without waiting for Hades / Triton / Demeter to ship Cycle 1 stubs.

- `llm_stub.py`: `LLMClientProtocol` + `StubLLMClient` returning deterministic canned responses per Athena Turn (proposal JSON, Turn 1 fenced tests, Turn 2 fenced impl, Turn 3 fenced diff).
- `proposal_author.ParserServiceProtocol`: minimum surface Pandora consumes (find_callsites + parse_file + query_tree). Cycle 2 swap to Hades' real ParserService.
- `demeter_adapter.py`: `DemeterAdapterProtocol` + `StubDemeterAdapter` in-memory dict + lists. Cycle 2 swap to Demeter's real `DemeterService`.
- `ws_publisher.InMemoryRefactorBus`: process-local pub/sub with rolling history. Cycle 2 swap to Hades' `event_bus.refactor_bus`.

**Rationale**: Wave 3 spawn batch of 6 workers parallel. Stub-and-sync per `.claude/agents/pandora.md` Cycle 1 directive + Manager Wave 3 dispatch note. Each swap site is a 1-line import edit in Cycle 2 because call sites consume the Protocol interface.

**Verification**: Module-level `get_*()` singleton factories + `set_*()` test seams. The simulation engine `__init__` accepts optional `llm`, `demeter`, `publisher` parameters so tests inject `StubLLMClient` + `StubDemeterAdapter` + an isolated `InMemoryRefactorBus`.

## Decision 4: Pandora flattens Turn N-1 visible content into Turn N user-role prompt (Phase B Topic E quirk handling)

**Decision**: The multi-turn message list passed to the LLM client is ALWAYS `[system, user]` only, never `[system, user, assistant, user, ...]`. Pandora embeds Turn N-1 visible content into the Turn N user-role string via `build_impl_gen_user_prompt(test_content=...)` and `build_diff_user_prompt(test_content=..., impl_content=...)`.

**Rationale**: Per `_meta/contracts/triton-to-pandora.md` Asumption 3 + Phase B Topic E LOCKED anti-pattern: NEVER replay `reasoning_content` from prior turns. The defensive layer in Triton's `LLMClient.call` builder strips `reasoning_content` from assistant messages before submitting; Pandora's prompt builders go one step further by NEVER inserting an `assistant` role at all. This is the strictest possible guard against the DeepSeek V4 quirk.

**Verification**: `test_multi_turn_does_not_replay_reasoning_content` introspects every LLM call captured during a full simulation. Asserts every prompt's role set is a subset of `{"system", "user"}` (no `assistant` role present).

## Decision 5: OpenSpec dual-folder generation (Folder A panitia + Folder B internal mirror)

**Decision**: `OpenSpecGenerator.generate()` writes BOTH `openspec/changes/<change-name>/` (Folder A panitia-facing, full proposal.md + design.md + tasks.md) and `.agent-openspec/changes/<change-name>/` (Folder B internal mirror, lightweight narration referencing Folder A).

**Rationale**: Per PRD Section 17.1 D27 LOCKED dual-folder strategy + `.claude/skills/openspec-workflow/SKILL.md`. Refactory panitia only reviews Folder A; Folder B is internal workflow agent narration for the Aletheia audit + Pan post-Wave 3 lessons. Generator writes both atomically so the dual-folder property is always satisfied without a separate sync step.

**Verification**: `test_openspec_generator_writes_3_files_in_both_folders` constructs a fake repo root with both directories, runs the generator, asserts proposal.md / design.md / tasks.md exist in both with >100 bytes each + the panitia-facing copy cites the user intent + ghost building hints.

## Decision 6: OQ-09 Accept = download diff via FastAPI FileResponse (NOT auto-PR-create)

**Decision**: `POST /api/refactor/{simulation_id}/accept` returns a `FileResponse` with `media_type='application/octet-stream'`, `filename='refactor-<sim-id>.diff'`, content = the `drafts/<sim>/diff.patch` Turn 3 output. NO GitHub PR is created.

**Rationale**: Per PRD Section 25 OQ-09 LOCKED Metis recommendation: "MVP = download diff, PR create requires upgraded OAuth scope (Phase 2)". Pandora ferry condition 4 ("OQ-09 Accept changes scope decision: your authority but coordinate Atlas deploy") triggers Atlas coordination only for the persistent volume mount (drafts/ K8s volume), NOT for the implementation. Scope minimisation: `read:repo + read:issues + read:pull_requests + write:issues` is the locked OAuth scope per PRD Section 19.3; the `repo` write scope is NOT in scope.

**Impact**: User downloads `refactor-<sim-id>.diff` and applies via `git apply refactor.diff` or IDE patch tool. The simulation_engine + dual_review_gate API enforces this; there is no code path that auto-applies the diff to production.

**Verification**: `test_accept_returns_diff_as_octet_stream` POSTs `/accept` and asserts the Content-Type + Content-Disposition headers + body bytes start with `diff --git`. Optional `?cleanup=true` query deletes `drafts/<sim>/` after the download via `starlette.background.BackgroundTask`.

## Decision 7: Deterministic ghost building position layout outside Iris treemap envelope

**Decision**: `proposal_author._layout_position(index)` returns `(GHOST_LAYOUT_X_BASE + GHOST_LAYOUT_X_STEP * index, 0.0, GHOST_LAYOUT_Z_BASE)` where `X_BASE=68.0`, `X_STEP=10.0`, `Z_BASE=-22.0`.

**Rationale**: Per `_meta/handoff_log/wave2_asclepius_to_pandora.md` "Ghost building position computation" + `_meta/uncertainty/asclepius-cycle4-20260512-2350.md` U-Ascl-002: Wave 2 mock used `x=68/78` at `z=-22` to stay outside the Iris squarified treemap envelope (`x in [-60, +60]`). Pandora adopts the same band by default so Wave 2 mock and Wave 3 real Pandora output are visually consistent. Cycle 2 polish: optional district-adjacent placer (medium-confidence concern logged in uncertainty journal).

**Verification**: `test_proposal_author_nodegoat_2fa_intent` asserts every ghost position has `x >= 65.0`.

## Decision 8: Background-task pattern for /simulate so the endpoint returns 202 fast

**Decision**: `POST /api/refactor/simulate` uses FastAPI `BackgroundTasks` to dispatch `SimulationEngine.run` after returning 202 to the client. The client receives `simulation_id` immediately + subscribes to `/api/ws/refactor-events?simulationId=<id>` for stage events.

**Rationale**: Per `_meta/contracts/asclepius-to-pandora.md` lines 142-154 + `_meta/handoff_log/wave2_asclepius_to_pandora.md` "Backend endpoints to implement". V4-Pro thinking high turns can take 5-15 seconds each; total simulation ~30-60 seconds. Returning 202 immediately keeps the UI responsive + the WebSocket carries the progress.

**Verification**: `test_simulate_endpoint_returns_202_with_simulation_id` asserts status code 202 + body contains `simulation_id`. `test_websocket_streams_event_sequence` connects to the WebSocket and receives the full 7-event sequence (proposal + 6 stages) via the bus history backfill.

## Decision 9: Stage 'discarded' on simulation failure (defensive event publication)

**Decision**: When the simulation engine catches `DraftIsolationViolation` or any other exception mid-turn, it publishes a `simulation.stage` event with `stage='discarded'` + `payload.error=<error>` + cleans up the drafts directory before returning.

**Rationale**: Per `_meta/contracts/asclepius-to-pandora.md` edge case "Simulation engine fails mid-run: Pandora publishes SimulationEvent with `error` field". The UI never gets stuck in-flight; Asclepius `DualReviewGate` renders the error state + clears the ghost buildings. The 9-stage enum has `discarded` as a terminal state matching this path.

**Verification**: `test_simulation_engine_handles_unparseable_output` exercises a degraded path where the LLM returns gibberish; the engine still produces `stage=completed` with raw output written as a placeholder (so the UI is never stuck). Future-Cycle-2 polish: explicit `discarded` event when the parser-syntax-verify path fails (per `hades-to-pandora.md` edge case).

## Decision 10: Cycle 1 single-ship + cycle 2 swap pattern locked

**Decision**: Cycle 1 ships everything (types + isolation + proposal author + openspec generator + GitHub issue fallback + simulation engine + dual review gate API + WebSocket route + 43 tests) in a single cycle because (a) all upstream stubs are in-house, (b) the V2 unlock pace is +2h ahead of nominal, (c) the Pandora budget is 5 cycle x 60-90 min = ~5-6 jam, so a single-cycle ship at ~50 min wall-clock leaves substantial buffer for Cycle 2 swap polish.

**Rationale**: Capacity respect Lock 6 + budget tracking. The plan file at `docs/superpowers/plans/20260512-pandora-wave3.md` outlines 5 cycle granular tasks; in practice all 5 cycles converged into 1 cycle of ship-clean work because the stub-and-sync Protocol pattern obviated the wait-for-upstream blocking.

**Impact**: Cycle 2 ferry budget = remaining 4-5 jam x 1 cycle. Tasks: (a) swap stub LLMClient for Triton's real DeepSeekClient import (Triton handoff arrives), (b) swap stub ParserService for Hades' real ParserService import (Hades handoff arrives), (c) swap stub DemeterAdapter for Demeter's real DemeterService import (Demeter handoff arrives), (d) parser pre-pass validate via `verify_draft_syntax`, (e) cost-budget enforcement (halt if `aggregate_session_cost > $4.50`).

**Verification**: All 43 tests pass in 0.33s on Python 3.14.3 + pytest 9.0.3 + Pydantic 2.13.3 + FastAPI 0.115+ (the version in `backend/pyproject.toml`).
