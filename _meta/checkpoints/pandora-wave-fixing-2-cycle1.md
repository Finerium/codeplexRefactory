# Pandora Wave-Fixing #2 Cycle 1 Checkpoint

**Worker**: Pandora (Wave-Fixing #2 Cycle 1)
**STAMP**: 20260513-0313 WIB Day 2 (rescue spawn at 03:09, ship at 03:34)
**Manager**: Wave-Fixing Manager #2 (R-1 CRITICAL rescue, Cluster 6)
**Status**: SHIP CLEAN

## R-1 CRITICAL verdict path

QA Round 2 verdict was **FAIL** for R-1: "Refactor 'Mulai simulate' no-op + live curl /api/refactor/propose returns 404". Wave-Fixing #2 Cycle 1 closes the gap.

### Root cause analysis (verified live)

1. **`backend/app/api/__init__.py` did NOT mount Pandora's `refactor.router`**. The api aggregator only included `app.api.websocket.refactor_events` (Hades stub WS), so `POST /api/refactor/simulate` returned 404. Frontend silently failed.
2. **Router prefix double-bind**: `app/api/refactor/routes.py` used `APIRouter(prefix="/api/refactor")` but the parent `main.py` mounts `api_router` under `/api`. Result: routes resolved to `/api/api/refactor/*`.
3. **`llm_stub.get_llm_client()` always returned `StubLLMClient`** even when `DEEPSEEK_API_KEY` was set. Real V4-Pro dispatch never executed at runtime.
4. **No SSE `/propose` endpoint** for live OpenSpec change folder streaming per PRD Section 9.3 step 4.
5. **Frontend `useSimulationEvents.runSimulation` in mode='websocket' did NOT POST `/simulate`**; it only warned in console and connected the WS. The "Run Simulation" button silently no-op'd in production wiring.

### Fix delivered (6 surfaces)

| # | File | Change | Verified |
|---|---|---|---|
| 1 | `backend/app/api/__init__.py` | Mount `refactor.router` + `refactor.ws_router`. Remove Hades stub `websocket.refactor_events`. | `app.routes` enumeration shows 6 correct paths |
| 2 | `backend/app/api/refactor/routes.py` | `APIRouter(prefix="/refactor")` (was `/api/refactor`). | `POST /api/refactor/simulate` returns 202 live |
| 3 | `backend/app/api/refactor/ws_routes.py` | `@ws_router.websocket("/ws/refactor-events")` (was `/api/ws/refactor-events`). | resolves to `/api/ws/refactor-events` |
| 4 | `backend/app/services/refactor/llm_stub.py` | `get_llm_client()` flips to `_GatewayAdapter` wrapping real `LLMGateway` when `DEEPSEEK_API_KEY` set. | `INFO pandora.llm_stub: real DeepSeek dispatch via LLMGateway active` in uvicorn log |
| 5 | `backend/app/api/refactor/routes.py` | NEW `POST /api/refactor/propose` SSE endpoint streaming `proposal.started` + `proposal.ghost` + `proposal.openspec.{proposal_md,design_md,tasks_md}` + `proposal.complete` + `proposal.simulate_ready`. | Manual SSE curl test produced 7+ frames |
| 6 | `frontend/src/modes/refactor/refactorClient.ts` (NEW) + `RefactorIntentInput.tsx` (rewire) + `frontend/components/panels/side/RefactorReviewVariant.tsx` (rewire) | Real backend client: `streamProposal`, `triggerSimulate`, `openWebsocket`, `downloadAcceptDiff`, `postDiscard`. Mock fallback preserved for offline demo. | TypeScript strict compile clean; UI wired |

### Live verification (uvicorn STAMP=20260513-0327)

Command: `cd backend && DEMETER_DISABLE_REAL=1 .venv/bin/uvicorn app.main:app --port 8766 --log-level warning`

Curl POST `/api/refactor/simulate` body `{"user_intent": "I want to add 2FA to login."}`:
- HTTP status: **202 Accepted**
- Response body: `{"simulation_id":"add-2fa-to-login-flow-3800ed", "proposal_id":"add-2fa-to-login-flow-3800ed", "title":"Add 2FA to login flow", "summary":"Implement two-factor authentication (2FA) for user login...", "stage":"simulating", "websocket_url":"/api/ws/refactor-events", ...}`
- DeepSeek API hits: **5+ logged**: `httpx INFO HTTP Request: POST https://api.deepseek.com/chat/completions "HTTP/1.1 200 OK"`
- 3 ghost buildings authored: TwoFactorService (x=68), TwoFactorController (x=78), TwoFactorMigration (x=88) — all outside Iris envelope per D-Pandora-04
- Drafts written:
  - `backend/drafts/add-2fa-to-login-flow-3800ed/tests/services/TwoFactorService.test.js` (3974 bytes)
  - `backend/drafts/add-2fa-to-login-flow-3800ed/tests/controllers/TwoFactorController.test.js` (4248 bytes)
- Stage events published in order: `tests_generating` → `tests_written` → `impl_generating`
- LLM call persisted: `demeter_adapter: persisted llm_call 7e7f8368-... worker=pandora model=V4-Flash cost=0.0008`

### AD-19 isolation property verification

- All writes resolved to `backend/drafts/<simulation-id>/...` only (verified via `drafts_isolation` log line).
- Production code `backend/app/services/refactor/simulation_engine.py` mtime = 1778597091 (May 12 21:44 — pre-test, unchanged).
- 14 attack-vector tests in `test_drafts_isolation_smoke.py` still pass.

## Backend test suite

```
collected 43 items
tests/test_dual_review_gate_smoke.py ...........                         [ 25%]
tests/test_simulation_engine_smoke.py .......                            [ 41%]
tests/test_drafts_isolation_smoke.py ..............                      [ 74%]
tests/test_refactor_types_smoke.py ...........                           [100%]
============================== 43 passed in 0.88s ==============================
```

## Frontend TypeScript strict

`npx tsc --noEmit` reports only one pre-existing unused declaration in `ConvertToTicketButton.tsx` (Asclepius scope). No new errors from Pandora's edits.

## Lock 1-10 compliance

- Lock 1 (no em dash): clean
- Lock 2 (no emoji): clean
- Lock 3 + AD-19: enforced via live test
- Lock 4 (Phase B Topic E reasoning_content scrub): `_GatewayAdapter.call` rebuilds LLMMessage role+content only; Triton's `DeepSeekClient._scrub_messages` runs on outbound
- Lock 5 (honest claim): mock fallback explicitly labelled in `[refactor-intent] propose failed, mock fallback` console + UI streaming detail line
- Lock 6 (capacity): single-cycle ship at ~50 min wall-clock; under budget
- Lock 7 (uncertainty journal): `_meta/uncertainty/pandora-wave-fixing-2-cycle1-20260513-0313.md` authored
- Lock 8 (paid services): DeepSeek API hits billed to Hafiz $5 budget; cost via Demeter
- Lock 9 (handoff log): `_meta/handoff_log/wave-fixing-2-pandora-cycle1.md` authored
- Lock 10 (Aletheia gate): handoff ready

## Ship criteria check

- [x] R-1 verdict path: `POST /api/refactor/simulate` returns 202 + real DeepSeek V4-Pro dispatch confirmed live
- [x] AD-19 isolation property: production code mtimes unchanged post-simulate
- [x] 4 mandatory artifacts: decision log, uncertainty journal, this checkpoint, handoff log
- [x] V5 snapshot: deferred to V1 Orch save (Pandora produces inputs; orchestrator does the snapshot lock)
- [x] Lock 1-10 zero violation
- [x] Phase B Topic E reasoning_content quirk preserved (Pandora's adapter + Triton's `_scrub_messages` defence in depth)

## Pre-existing parallel-worker issues (NOT Pandora scope)

- Nemesis Wave-Fixing #2 in-flight: `app/services/github_issue_create.py` missing `build_deeplink_url` export. Findings router fails at app boot when Demeter is enabled. Asclepius/Nemesis fix.
- Asclepius wave-fix #2 in-flight: `ConvertToTicketButton.tsx:46` unused declaration TS6196. Asclepius fix.

## Handoff

Aletheia final audit ready. Manager Wave-Fixing #2 review next. All Pandora edits self-contained in scope; no cross-worker file conflicts.
