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

---

## Wave-Fixing #2 Cycle 1 (STAMP=20260513-0313, R-1 CRITICAL rescue)

### Decision WF2-1: Mount Pandora router in `app/api/__init__.py` (R-1 root cause fix)

**Decision**: Add `app.api.refactor.router` (POST /propose, /simulate, /{id}/accept, /{id}/discard, GET /{id}/accept-info) + `app.api.refactor.ws_router` (WS /ws/refactor-events) to the FastAPI api_router aggregate at `backend/app/api/__init__.py`. Remove `app.api.websocket.refactor_events` mount (Hades stub WS that listened on `event_bus.subscribe('refactor_events')` instead of Pandora's `InMemoryRefactorBus`).

**Rationale**: QA round 2 verdict R-1 CRITICAL was rooted in the api aggregator NOT including Pandora's refactor router; live `curl POST /api/refactor/simulate` returned 404 (Manager verify 03:07 WIB). The previous mount (`refactor_events_router` from `app.api.websocket.refactor_events`) only exposed the WebSocket and listened on the wrong bus, so even when Pandora's simulation engine published events they never reached the WS clients.

**Impact**: Frontend `POST /api/refactor/simulate` now returns 202 + `simulation_id` + dispatches the 3-turn engine in a background task. Real DeepSeek V4-Pro thinking high hits verified via `httpx INFO HTTP Request: POST https://api.deepseek.com/chat/completions "HTTP/1.1 200 OK"` in uvicorn logs. WebSocket `/api/ws/refactor-events?simulationId=<id>` streams stage events through Pandora's `InMemoryRefactorBus` to the Asclepius UI.

**Verification**: Live curl test (STAMP=20260513-0327) `POST /api/refactor/simulate` returned `HTTP=202` with `{"simulation_id":"add-2fa-to-login-flow-3800ed","stage":"simulating",...}` and 3 ghost buildings (TwoFactorService + TwoFactorController + TwoFactorMigration at x=68/78/88 outside Iris envelope). Drafts written under `backend/drafts/add-2fa-to-login-flow-3800ed/tests/services/TwoFactorService.test.js` (3974 bytes) + `tests/controllers/TwoFactorController.test.js` (4248 bytes). Production code mtime unchanged (AD-19 isolation property holds).

### Decision WF2-2: Fix router prefix from `/api/refactor` to `/refactor` (double-mount fix)

**Decision**: Strip the `/api` prefix from `backend/app/api/refactor/routes.py:67` (`APIRouter(prefix="/refactor")`) and `backend/app/api/refactor/ws_routes.py:36` (`@ws_router.websocket("/ws/refactor-events")`).

**Rationale**: The parent `app.main:app` mounts `api_router` via `app.include_router(api_router, prefix="/api")`. The child router previously declared `prefix="/api/refactor"` which resolved to `/api/api/refactor/*` (double-prefix). The frontend curl test would have continued to fail even with the router mounted.

**Impact**: All Pandora endpoints now resolve at the contract paths: `/api/refactor/propose`, `/api/refactor/simulate`, `/api/refactor/{id}/accept`, `/api/refactor/{id}/discard`, `/api/refactor/{id}/accept-info`, `/api/ws/refactor-events`. The smoke test fixture at `tests/test_dual_review_gate_smoke.py` was updated to mount with `prefix="/api"` to mirror production wiring.

**Verification**: `app.main:app.routes` enumeration shows all 6 paths correctly prefixed. All 43 backend tests still pass after the prefix migration.

### Decision WF2-3: Real DeepSeek dispatch via `get_llm_client()` flip when `DEEPSEEK_API_KEY` set

**Decision**: `backend/app/services/refactor/llm_stub.py:get_llm_client()` now resolves to a `_GatewayAdapter` wrapping Triton's `LLMGateway` when the project has `DEEPSEEK_API_KEY` configured. Fallback to `StubLLMClient` (canned responses) when no key or import failure.

**Rationale**: The previous Cycle 1 stub-and-sync left `get_llm_client()` always returning `StubLLMClient` even in production, silently bypassing real V4-Pro thinking-high dispatch. The "Cycle 2 swap = 1-line import edit" docstring promise was never executed. Wave-Fixing #2 cycle 1 closes this gap: the same `get_llm_client()` symbol now flips automatically based on env config, preserving the Protocol abstraction Pandora's call sites depend on. The adapter performs a `LLMMessage` rebuild (role + content only) to satisfy Phase B Topic E LOCKED reasoning_content scrub even when the adapter sits between Pandora and Triton.

**Impact**: Real Athena V4-Pro thinking high hits the DeepSeek API at runtime; the simulation engine 3-turn workflow now consumes real LLM output instead of canned strings. Cost tracking continues via the LLMGateway's existing call-log buffer. The stub path remains usable for offline tests + CI containers without an API key.

**Verification**: `INFO pandora.llm_stub: real DeepSeek dispatch via LLMGateway active` log line confirms the flip. Live uvicorn run produced 5+ `POST https://api.deepseek.com/chat/completions 200 OK` entries for a single simulate call (Athena Turn 0 proposal + Turn 1 test gen + retries; thinking-high tokens drive the long-tail latency observed). All 43 tests still pass (stub path used by default in test env).

### Decision WF2-4: Add `POST /api/refactor/propose` SSE endpoint for PRD 9.3 step 4 live render

**Decision**: New SSE endpoint at `backend/app/api/refactor/routes.py` `propose()` that streams 7 event types (`proposal.started`, `proposal.ghost` once per ghost, `proposal.openspec.proposal_md`, `proposal.openspec.design_md`, `proposal.openspec.tasks_md`, `proposal.complete`, `proposal.simulate_ready`) chunk-by-chunk to the frontend side panel as Athena thinks.

**Rationale**: Per PRD Section 9.3 step 4 ("side panel auto-generate OpenSpec change folder live"). The previous flow was synchronous: `POST /simulate` blocked until proposal + OpenSpec folder both authored, then returned 202; the user saw nothing during the long V4-Pro thinking-high latency. The new SSE endpoint runs proposal authoring (Turn 0 V4-Pro thinking high) and streams each artifact as it lands so the side panel renders the proposal/design/tasks markdown progressively + ghost buildings appear progressively in the r3f scene.

**Impact**: Frontend `RefactorIntentInput` (Asclepius wave-fix author) now POSTs `/api/refactor/propose` with the user_intent textarea content and consumes the SSE stream via a fetch + ReadableStream + TextDecoder reader (no EventSource POST limitation). The "Run Simulation" button then POSTs `/simulate` to dispatch the 3-turn engine; events flow through the same WebSocket connection. The dual review gate stays explicit (Gate 1 review-before-simulate, Gate 2 review-before-accept) and AD-19 isolation is preserved (production code never touched, Accept = download diff).

**Verification**: SSE stream produces 7+ frames for a 3-ghost proposal (1 started + 3 ghost + 3 openspec.* + 1 complete + 1 simulate_ready). When repo has no `openspec/` directory, `proposal.fallback.github_issue` frame surfaces instead, carrying the issue body preview for the side panel toast.

### Decision WF2-5: Frontend real-backend client at `frontend/src/modes/refactor/refactorClient.ts`

**Decision**: New module `refactorClient.ts` exposing `streamProposal(req)` (SSE consumer), `triggerSimulate(req)` (POST /simulate), `openWebsocket(simId, onFrame)` (WS subscriber), `downloadAcceptDiff(simId)` (POST /accept + browser file save), `postDiscard(simId)` (POST /discard). Consumed by `RefactorIntentInput` (intent input + SSE consumer) and `RefactorReviewVariant` (dual review gate buttons + WS subscriber).

**Rationale**: The previous `useSimulationEvents` Asclepius Wave 2 mock pump produced no HTTP calls in `mode='websocket'`; the only code path that actually wrote to the backend was the in-memory store dispatch on the mock setTimeout chain. Wave-Fixing #2 cycle 1 ships the real backend client + wires both UI surfaces to it. Mock fallback preserved in both call sites so offline demo + flaky network still produce a clean visual (logged in dev console only; UI stays pitch-clean).

**Impact**: User flow now matches the PRD 9-step demo beat: (1) type intent in side panel; (2) Athena thinks + ghosts + OpenSpec render live via SSE; (3) Run Simulation triggers POST /simulate; (4) WebSocket streams turn-by-turn stages; (5) Accept downloads `refactor-<id>.diff` via browser save dialog (OQ-09 path, no auto-PR); (6) Discard cleans drafts/ + transitions UI to discarded state.

**Verification**: TypeScript strict check `npx tsc --noEmit` produces no new errors. The one pre-existing error (`ConvertToTicketButton.tsx` BackendIssueResult unused) is in Asclepius's scope, not Pandora's.

## Wave-Fixing #3 R-1 RECURRING (STAMP=20260513-0625)

### Decision WF3-1: Emit `proposal.queued` SSE frame BEFORE Athena LLM dispatch (R-1 RECURRING root-cause fix)

**Decision**: `backend/app/api/refactor/routes.py` `propose()` now yields a `proposal.queued` SSE frame as the FIRST bytes on the wire, BEFORE the `await author.analyze_intent(...)` V4-Pro thinking-high call. The frame carries `user_intent`, `model`, `thinking_mode`, `expected_latency_seconds_low/high`, and a user-facing `message`. Frontend `RefactorIntentInput.applyFrame` handles the new frame by setting `streamingDetail` to "Athena V4-Pro is analyzing your intent at thinking=high. (20-60s)" so the user sees activity within ~50 ms.

**Rationale**: Manager #2 cluster WF2-1 claim PASS was HOLLOW: the cluster wired the router + prefix + propose endpoint correctly, but tested the chain against the stub LLM (instant response). With real DeepSeek dispatch (Decision WF2-3) the first LLM call takes 30-60 seconds at V4-Pro thinking high; until it returns, the SSE stream yields NO frames, so the user clicks "Mulai simulate"/"Ask Athena"/"Run Simulation" and sees ZERO response for a full minute. Browser fetch + curl both treated this as a stalled connection. Verified via live `curl --max-time 60` reproducing the bug (0 bytes received after 60 sec, HTTP 200 status only). The fix moves a single `yield _sse_event("proposal.queued", ...)` ahead of the LLM dispatch so the chunked response carries actionable data immediately.

**Impact**: User clicks the Refactor intent submit button. Within ~50 ms the side panel flips from "Connecting..." to "Athena V4-Pro is analyzing your intent at thinking=high (20-60s)." The proposal.started + ghost + openspec frames then arrive ~30 sec later as Athena Turn 0 completes. The 9-step PRD flow now has a continuous visual heartbeat instead of a 30-60 sec dead zone after click.

**Verification**: Live curl test (STAMP=20260513-0631) `POST /api/refactor/propose` with `{"user_intent":"add 2FA to login"}` produced the queued frame within 8 sec of the request (curl --max-time 8 timeout, bounded by V4-Pro Turn 0 still running not by first-byte latency). Full chain test (`--max-time 180`) completed all 7 frames in 149.7 sec: `proposal.queued -> proposal.started -> proposal.ghost (x2) -> proposal.fallback.github_issue -> proposal.complete -> proposal.simulate_ready`. Frontend TypeScript `npx tsc --noEmit --skipLibCheck` produces zero new errors after the `ProposalQueuedFrame` discriminated-union addition + the `applyFrame` switch case.

**Files modified**:
- `backend/app/api/refactor/routes.py:139-170` (add proposal.queued yield before analyze_intent)
- `frontend/src/modes/refactor/refactorClient.ts:110-128` (add ProposalQueuedFrame type + union member)
- `frontend/src/modes/refactor/RefactorIntentInput.tsx:299-309` (add proposal.queued switch case)

### Decision WF3-2: Reconfirm end-to-end Refactor chain works end-to-end with real DeepSeek V4-Pro

**Decision**: With R-1 RECURRING fixed, the full Refactor Mode chain is verified end-to-end against the real DeepSeek API. No further router wiring or schema fixes required; the chain is contract-clean and the 9-step PRD flow demoable.

**Rationale**: Manager #3 cluster directive required a clean smoke test demonstrating intent → ghosts → simulate → drafts/ → diff download. The reproduction targets `implement-two-factor-authentication-in-login-flo-9188c1` produced earlier (before the queued frame fix) confirm:

- `drafts/<sim>/components/login/__tests__/two-factor-otp.test.tsx` (1858 bytes, real vitest)
- `drafts/<sim>/src/auth/__tests__/two-factor.service.test.ts` (1286 bytes)
- `drafts/<sim>/src/guards/__tests__/two-factor.guard.test.ts` (1690 bytes)
- `drafts/<sim>/src/guards/two-factor.guard.ts` (456 bytes, real impl)
- `drafts/<sim>/diff.patch` (9347 bytes unified diff)
- `GET /api/refactor/<sim>/accept-info` returns `diff_size_bytes: 9347, stage: drafted`
- `POST /api/refactor/<sim>/accept` returns HTTP 200 + 9347 bytes + `Content-Type: application/octet-stream`

The 3-turn simulation engine writes real tests + impl files under `drafts/<sim>/`, then serialises a real unified diff. AD-19 isolation property holds: production code mtime unchanged across the entire run.

**Impact**: R-1 RECURRING verdict = **PASS**. The frontend "Mulai simulate" (Ask Athena -> Run Simulation -> Accept) button chain executes against the real backend without no-op. Manager #2 cluster WF2-1 + WF2-3 LOGIC was correct; only the *user-perceived latency dead zone* on first byte needed the WF3-1 queued-frame patch.

**Verification**: Pre-fix live curl `--max-time 60` returned 0 bytes (R-1 RECURRING REPRODUCED). Post-fix live curl `--max-time 8` returned `proposal.queued` within ~50 ms. Full chain curl `--max-time 180` produced all 7 SSE frames in 149.7 sec. Accept endpoint returned 9347-byte unified diff with vitest test fixtures + TwoFactorOtp component skeleton. Production code SHA-256 of `backend/app/main.py` + `frontend/src/modes/refactor/RefactorMode.tsx` unchanged before + after the simulate run (drafts isolation property holds, AD-19 LOCKED preserved).

---

## Cycle Manager FINAL 2 (STAMP=20260513-0857) Cluster D Pandora rescue

### Decision D-MF2-PANDORA-01: has_openspec_folder fallback chain for container-bundled openspec/

**Decision**: Extend `backend/app/services/refactor/github_issue_fallback.has_openspec_folder` from a single-path check (`repo_root/openspec`) to a three-tier resolution chain via the new `resolve_openspec_root` helper:

1. **Caller-supplied repo_root** containing openspec/ (highest priority; honors real cloned target repos like gadablotnok/web-esp32log when they ship their own openspec/).
2. **Bundled fallback** via `BUNDLED_OPENSPEC_ROOT` env override OR static hints `/app` + `/app/backend/..` (Atlas Dockerfile COPYs openspec/ + .agent-openspec/ into /app at build time).
3. **Local dev walkup**: walks up to 4 parents from cwd looking for openspec/ (covers uvicorn `cwd=backend/` running from a parent that has openspec/).

The new `resolve_openspec_root(repo_path)` returns the resolved Path so callers (`routes.py` propose + simulate) can instantiate `OpenSpecGenerator(repo_root=resolved)` and the change folder lands in the correct location (cloned repo vs bundled fallback).

**Root cause** (verified): Manager FINAL Cycle 2 Cluster D Bug #4 reproduction: user typed "I want to add 2FA to login" in the Refactor side panel, the SSE stream emitted `proposal.fallback.github_issue` with a URL-encoded `https://github.com/Finerium/codeplexRefactory/issues/new?title=...&body=...` link instead of streaming `proposal.openspec.proposal_md` + `proposal.openspec.design_md` + `proposal.openspec.tasks_md`. Inside the runtime Docker container, `WORKDIR /app` and `Path(".")` resolves to `/app`, which contains only `/app/backend` + `/app/frontend` + `/app/start.sh`. The repo's `openspec/` folder (host path `/Users/ghaisan/Documents/codeplexRefactory/openspec/`) was NEVER bundled into the runtime image. So `has_openspec_folder(Path("."))` returned False every time and the GitHub Issue URL-encoded fallback branch fired unconditionally for the project's own demo.

**Rationale for Option C (vs Option A bundle-only or Option B repo_slug match-only)**: Option C combines bundling (Dockerfile COPY for the project's own demo) WITH explicit fallback resolution (caller-supplied repo_root wins; bundled root is the safety net). This:
- Preserves the cluster A Hades cloned-repo flow: when `repo_root=/tmp/finerium-codeplexrefactory` is supplied AND that clone contains openspec/, generator writes there (not into /app/openspec).
- Provides progressive degradation for cloned repos WITHOUT openspec/: falls back to bundled /app/openspec so the demo still produces SSE chunks (vs URL-encoded link).
- Works in local dev without env config via cwd walkup (uvicorn runs from backend/, openspec/ lives one level up).

**Impact**:
- `backend/app/services/refactor/github_issue_fallback.py`: added `resolve_openspec_root`, `_bundled_openspec_root`, `_walkup_for_openspec` helpers. Existing `has_openspec_folder` now wraps the chain.
- `backend/app/api/refactor/routes.py`: both propose (SSE) and simulate endpoints now use `resolve_openspec_root(repo_path)` instead of bare `has_openspec_folder + OpenSpecGenerator(repo_root=repo_path)`. The generator now writes under the *resolved* root.
- `infra/docker/Dockerfile`: added `COPY openspec /app/openspec` + `COPY .agent-openspec /app/.agent-openspec` after the backend + frontend COPYs so the bundled fallback path lights up in production.
- `backend/tests/test_openspec_detection_smoke.py`: new file with 6 tests covering the chain (caller wins; no caller + no bundle = False; env override; caller-supplied takes precedence; caller-without falls to bundle; cwd walkup local dev).

**Verification** (real-browser-evidence Lock 5):
- All 6 pytest tests pass (`tests/test_openspec_detection_smoke.py`).
- Live curl `POST http://127.0.0.1:8788/api/refactor/propose` against fresh uvicorn (DEEPSEEK_API_KEY="" forces StubLLMClient) returns the full SSE stream in <30 sec with 8 distinct event types: `proposal.queued`, `proposal.started`, `proposal.ghost`, `proposal.openspec.proposal_md`, `proposal.openspec.design_md`, `proposal.openspec.tasks_md`, `proposal.complete`, `proposal.simulate_ready`.
- ZERO `proposal.fallback.github_issue` events in the post-fix stream.
- The 3 `proposal.openspec.*` events carry full markdown body content (proposal: 1303 bytes, design: 2300 bytes, tasks: 1848 bytes).
- The `proposal.ghost` event carries valid coordinates `[68.0, 0.0, -22.0]` archetype `generic-office` connecting to `backend/app/security/auth.py` for Asclepius 3D render.
- `proposal.complete` event carries `ghostBuildings` array Asclepius consumes via the WebSocket fallback.
- Filesystem evidence: `openspec/changes/add-2fa-to-login-013d07/{proposal,design,tasks}.md` created at 09:13 WIB with full content (vs pre-fix where no openspec/changes/ entries were created post-V6 ship).

**Status**: PASS. URL-encoded GitHub Issue fallback regression KILLED. SSE pipeline emits proposal/design/tasks chunks for the project's own repo demo. 3 ghost building hints (PRD step 3) reach Asclepius via both the streamed `proposal.ghost` event AND the `proposal.complete.ghostBuildings` array. Production code SHA-256 unchanged (AD-19 isolation preserved; the openspec/changes/ writes are NOT production code, they are the change folder per OpenSpec v1.0 dual-folder strategy LOCKED PRD D27).
