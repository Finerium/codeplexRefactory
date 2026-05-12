# Pandora Wave 3 Implementation Plan

> **For agentic workers:** Single-worker Wave 3 cycle plan. Pandora executes inline using superpowers:executing-plans discipline. Checkbox tracking for cycle progress.

**Goal:** Ship Athena proposal author + 3-turn refactor simulation engine + drafts/ isolation safety guard + OpenSpec change folder generator + GitHub Issue fallback + dual review gate API + WebSocket publisher for Refactor Mode SAFETY-FIRST.

**Architecture:** FastAPI async backend service. Pandora owns `backend/app/services/refactor/` + `backend/app/api/refactor/`. Stub-and-sync with Hades ParserService + Triton LLMClient. Publishes events to Asclepius Wave 2 via WebSocket. Persists to Demeter Postgres tables. Critical safety property: drafts/<simulation-id>/ pathlib resolve guard, production code IMMUTABLE.

**Tech Stack:** Python 3.12 strict + FastAPI + Pydantic v2 + pathlib + asyncio + pytest. DeepSeek V4-Pro think high (Turn 1+2) + V4-Flash non-think (Turn 3). 9-stage SimulationStage enum locked verbatim from Asclepius Wave 2 contract.

---

## Cycle 1: Types + drafts isolation safety guard (PRIORITY: AD-19 safety property FIRST)

**Rationale**: Item 17 self-check is the block-fail item. Author safety guard + tests BEFORE any LLM/simulation work so AD-19 property is provable from the first commit. drafts isolation = pitch defensibility hinge.

**Files**:
- Create: `backend/app/services/refactor/__init__.py` (barrel)
- Create: `backend/app/services/refactor/types.py` (Pydantic mirror of Asclepius 9-stage SimulationStage + GhostBuildingHint + SimulationEvent + RefactorProposalEvent + ProposalStage + ProposalContext)
- Create: `backend/app/services/refactor/drafts_isolation.py` (safe_draft_write + safe_draft_read + path resolve guard)
- Create: `backend/app/services/refactor/proposal_author.py` (stub signature for Cycle 2 expansion)
- Create: `backend/app/services/refactor/simulation_engine.py` (stub signature for Cycle 3 expansion)
- Create: `backend/tests/__init__.py` (test package)
- Create: `backend/tests/test_drafts_isolation_smoke.py` (ValueError on path escape)
- Create: `backend/tests/test_types_smoke.py` (Pydantic schema parity with Asclepius enum)

**Steps**:
- [x] Step 1: Author `types.py` mirroring Asclepius TS enum verbatim (9 stages)
- [x] Step 2: Author `drafts_isolation.py` with pathlib resolve guard
- [x] Step 3: Author smoke test verifying path escape raises ValueError
- [x] Step 4: Run smoke test (or document Python env unavailable per Lock 4 [UNVERIFIED] flag)
- [x] Step 5: Stub `proposal_author.py` + `simulation_engine.py` signatures with [STUB Cycle 2 full impl] labels
- [x] Step 6: Author Cycle 1 stub handoff to Hades + Triton

## Cycle 2: Proposal author + OpenSpec change folder generator + GitHub Issue fallback

**Files**:
- Modify: `backend/app/services/refactor/proposal_author.py` (real Athena V4-Pro think high call via Triton stub)
- Create: `backend/app/services/refactor/openspec_generator.py` (auto-generate Folder A change folder per OpenSpec v1.0 + Folder B mirror)
- Create: `backend/app/services/refactor/github_issue_fallback.py` (when no openspec/ dir, fallback structured GitHub Issue draft)
- Create: `backend/app/services/refactor/prompts.py` (Athena persona prompts per Pythia contract)
- Create: `backend/tests/test_openspec_generator_smoke.py` (validates generated proposal.md + design.md + tasks.md per OpenSpec v1.0)

**Steps**:
- [x] Step 1: Author Athena persona prompts (proposal + test_gen + impl_gen + diff_serialize)
- [x] Step 2: Author proposal_author.py with analyze_intent + ProposalContext output
- [x] Step 3: Author openspec_generator.py with proposal.md + design.md + tasks.md scaffolds
- [x] Step 4: Author github_issue_fallback.py with structured issue draft
- [x] Step 5: Smoke test OpenSpec generator output

## Cycle 3: Simulation engine 3-turn orchestrator + WebSocket publisher

**Files**:
- Modify: `backend/app/services/refactor/simulation_engine.py` (3-turn orchestrator Turn 1 test_gen V4-Pro think high + Turn 2 impl_gen V4-Pro think high + Turn 3 diff_serialize V4-Flash non-think)
- Create: `backend/app/services/refactor/ws_publisher.py` (publish_refactor_event helper + event_bus integration with Hades)
- Create: `backend/app/services/refactor/llm_stub.py` (stub LLMClient interface so Pandora Cycle 1-3 ship before Triton lands)
- Modify: `backend/tests/test_simulation_engine_smoke.py` (NodeGoat 2FA E2E with stubbed Triton)

**Steps**:
- [x] Step 1: Author ws_publisher.py with stage event matrix per Asclepius handoff
- [x] Step 2: Author Triton stub interface for stub-and-sync
- [x] Step 3: Wire simulation_engine.py 3-turn orchestrator with publish hooks + drafts write hooks
- [x] Step 4: Smoke test E2E with stub LLM (drafts/<id>/ produces tests + impl + diff)
- [x] Step 5: Verify reasoning_content strip enforced (Phase B Topic E)

## Cycle 4: Dual review gate API 3 endpoints + WebSocket route

**Files**:
- Create: `backend/app/api/refactor/__init__.py` (router barrel)
- Create: `backend/app/api/refactor/routes.py` (POST /simulate + POST /accept + POST /discard)
- Create: `backend/app/api/refactor/ws_routes.py` (WebSocket /api/ws/refactor-events)
- Create: `backend/app/api/refactor/schemas.py` (request/response Pydantic)
- Create: `backend/tests/test_dual_review_gate_smoke.py` (3 endpoint integration test)

**Steps**:
- [x] Step 1: Author POST /simulate endpoint with BackgroundTasks dispatch + simulation_id generation
- [x] Step 2: Author POST /accept endpoint returning FileResponse diff (OQ-09 download diff default)
- [x] Step 3: Author POST /discard endpoint marking stage archived + drafts cleanup
- [x] Step 4: Author WebSocket /api/ws/refactor-events endpoint with simulationId scoping
- [x] Step 5: Smoke test 3 endpoints

## Cycle 5: NodeGoat 2FA E2E smoke test + Demeter persist integration

**Files**:
- Create: `backend/app/services/refactor/demeter_adapter.py` (persist_proposal + persist_simulation_event + persist_llm_call interface stub for Demeter Cycle 1)
- Modify: `backend/tests/test_simulation_engine_smoke.py` (full NodeGoat 2FA E2E with all 6 simulation events + drafts/ output + Demeter persist mock)
- Modify: `STATUS.md` (Wave 3 progress Pandora cycle 2 full ship update)
- Create: `_meta/decision_log/pandora.md` (canonical decision log)
- Create: `_meta/uncertainty/pandora-cycle1-<timestamp>.md` + `_meta/uncertainty/pandora-cycle5-<timestamp>.md`
- Create: `_meta/checkpoints/pandora-cycle1.md` + `_meta/checkpoints/pandora-cycle5.md`
- Create: `_meta/handoff_log/wave3_pandora_to_demeter.md` + `_meta/handoff_log/wave3_pandora_to_asclepius.md` + `_meta/handoff_log/wave3_pandora_cycle1_stub.md`

**Steps**:
- [x] Step 1: Author demeter_adapter.py with stub interface
- [x] Step 2: Author NodeGoat 2FA E2E smoke test consuming all integration points
- [x] Step 3: Verify 20-item self-check passed (item 17 drafts isolation critical)
- [x] Step 4: Author 4 mandatory artifacts (decision log + uncertainty + checkpoint + handoff)
- [x] Step 5: STATUS.md Wave 3 sync event entry

---

**Stub-and-sync notes**:
- Cycle 1 stub handoff to Hades (ParserService) + Triton (LLMClient): I author a thin `_stub.py` interface with the expected method signatures so my code is unblocked. When Hades/Triton ship cycle 1 stub, I swap import paths.
- Cycle 2 full impl swaps stubs for real Hades/Triton imports.

**Ferry triggers (HIGH bar)**:
1. drafts/ isolation violation detected (CRITICAL halt all writes)
2. RefactorProposal/SimulationEvent schema break vs Asclepius
3. Directive to simulate against production code
4. OQ-09 scope coordinate with Atlas deploy
5. Cascade risk

**Honest claim discipline (Lock 5)**:
- LLM client interface stub labeled `[STUB Cycle 1, real Triton Cycle 2 full]`
- Hades ParserService stub labeled `[STUB Cycle 1, real Hades Cycle 2 full]`
- Demeter persist stub labeled `[STUB Cycle 1, real Demeter Cycle 2 full]`
- All test fixtures `[MOCK NodeGoat fixture]` labeled
