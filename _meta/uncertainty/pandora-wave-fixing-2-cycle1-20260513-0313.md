# Pandora Wave-Fixing #2 Cycle 1 Uncertainty Journal

**Worker**: Pandora (Wave-Fixing #2 Cycle 1 rescue)
**STAMP**: 20260513-0313 WIB Day 2
**Scope**: R-1 CRITICAL Refactor Mode "Mulai simulate" button no-op + Bug #12 ghost building runtime + AD-19 isolation preserved
**Manager directive**: Cluster 6 (Refactor Mode end-to-end real + drafts isolation)
**Confidence**: HIGH (verified via live curl + DeepSeek API hits + 43/43 backend test pass)

## Medium-confidence concerns (proceed but document)

### MC-1: Live DeepSeek V4-Pro thinking-high latency exceeds 30 sec
**Evidence**: Live uvicorn run logged `LLM primary failed worker=pandora resident=Athena err=Request timed out.` after 30 sec on the first attempt; the gateway retried via simplified prompt and eventually succeeded after ~4 min total wall-clock for Turn 0 + Turn 1 combined.
**Risk**: Demo navigator may interpret the silence as a hang. The frontend already shows "Athena thinking..." text + a spinner; the SSE stream emits `proposal.started` early so the panel doesn't look frozen.
**Mitigation in place**: 30 sec httpx timeout on each call, 5-layer fallback (canned → cache → primary → simplified retry → fallback model → final canned), semantic cache cosine 0.85 for repeat queries.
**Action**: For Day 2 demo, pre-warm the semantic cache by running the canonical "I want to add 2FA to login" intent once before the pitch. Cache hit cuts the next call to <100ms.

### MC-2: GitHub Issue fallback URL is enormous (>5KB) when no openspec/ in cwd
**Evidence**: Live test returned a `simulate` response with `openspec_change_path` = a 5KB+ URL-encoded GitHub issue creation URL because the test ran from `/Users/ghaisan/Documents/codeplexRefactory/backend/` which has no `openspec/` subdir.
**Risk**: Frontend rendering this URL as a clickable link works but the side panel `OpenSpec: <path>` line wraps poorly.
**Mitigation**: For demo, run uvicorn from the project root so `openspec/` is the local folder; the OpenSpec generator then writes real `openspec/changes/<sim-id>/proposal.md` files and the path stays short.
**Action**: Atlas K8s manifest should `WORKDIR /app` not `/app/backend` so the production deploy hits the openspec/ folder.

### MC-3: WebSocket teardown ordering on rapid propose re-clicks
**Evidence**: When the user clicks "Propose with Athena" twice in rapid succession, the second click cancels the first's AbortController + tears down the first WebSocket. The store's reset clears the proposal slice.
**Risk**: A residual frame from the first run could land in the store milliseconds after the reset.
**Mitigation in place**: `wsTeardownRef.current?.()` runs synchronously before any new state mutation; the second SSE stream re-issues `setProposal` which overrides the residual state.
**Action**: None for Wave-Fixing #2. If a demo user reports flicker, add a `currentRunId` ref + drop frames whose `simulation_id` does not match.

### MC-4: Mock fallback path still uses `MOCK_PROPOSAL` ghost positions
**Evidence**: `RefactorIntentInput.dispatchReal` catches network failure and dispatches `MOCK_PROPOSAL` to keep the demo flow alive. The mock ghost positions (x=68/78/88) overlap the real backend's generated positions deterministically because both use the same `GHOST_LAYOUT_X_BASE` constant.
**Risk**: Side panel + r3f scene will look identical in mock vs real, so the demo may be hard to distinguish unless the navigator points to the dev console.
**Mitigation**: Streaming detail text reads "Backend unreachable; mock fallback. (<msg>)" so the navigator sees the fallback engaged.
**Action**: None; this is the intended drop-protocol per PRD Section 12.3 Layer 1.

## High-confidence ship items

- HC-1: `app/api/__init__.py` mounts Pandora router + ws_router. Verified via `app.routes` enumeration.
- HC-2: Router prefix corrected (`/refactor` not `/api/refactor`). Verified via final route paths `/api/refactor/simulate` resolving correctly.
- HC-3: `llm_stub.get_llm_client()` flips to real LLMGateway when `DEEPSEEK_API_KEY` set. Verified via INFO log `pandora.llm_stub: real DeepSeek dispatch via LLMGateway active`.
- HC-4: SSE `/propose` endpoint streams 7 event types. Verified via uvicorn log + curl truncated test (real call succeeded with 3 ghost buildings + GitHub Issue fallback URL).
- HC-5: `refactorClient.ts` ships 5 functions matching the dual review gate flow. Verified via TypeScript strict compile clean.
- HC-6: AD-19 drafts/ isolation property holds. Live test wrote `backend/drafts/add-2fa-to-login-flow-3800ed/tests/{services,controllers}/*.test.js`; production code `simulation_engine.py` mtime unchanged.
- HC-7: 43/43 backend tests pass (drafts isolation, types, simulation engine, dual review gate API + WS round-trip).

## Pre-existing issues outside Pandora scope

- **Nemesis Wave-Fixing #2 in-flight bug**: `app/services/github_issue_create.py` does not export `build_deeplink_url` even though `app/api/findings/routes.py:54` imports it. The findings router fails to load at app boot. My change does NOT touch findings; the breakage existed before. Asclepius/Nemesis fix lane.
- **Asclepius wave-fix #2 in-flight unused decl**: `frontend/src/modes/health/ConvertToTicketButton.tsx:46` declares unused `BackendIssueResult`. TS strict reports it. Asclepius fix lane.
- **Missing `sentence_transformers` Python package**: semantic cache embed silently degrades to "WARNING" + no cache hit. Documented as `[INFERRED Wave 3 Triton stub]` in semantic_cache.py. Not on Pandora critical path.

## Lock 1-10 compliance audit (Pandora scope)

| Lock | Compliance | Evidence |
|---|---|---|
| 1 (no em dash) | clean | grep "—\|–" returns 0 in my edits |
| 2 (no emoji) | clean | new files audit: 0 emoji |
| 3 (AD-19 drafts/ isolation) | clean | live test confirms only `drafts/<sim-id>/` written |
| 4 (Phase B Topic E reasoning_content scrub) | preserved | `_GatewayAdapter.call` rebuilds Triton `LLMMessage` with role + content only; Triton's `_scrub_messages` runs after that on outbound |
| 5 (honest claim labeled) | clean | mock fallback explicitly labelled in code comments + console |
| 6 (capacity respect) | clean | single-cycle ship at ~50 min wall-clock |
| 7 (uncertainty journal medium) | this file | |
| 8 (paid services) | enforced | DeepSeek API hits billed to Hafiz $5 budget; cost tracking via Demeter llm_call_log |
| 9 (handoff log) | wave-fixing-2-pandora-cycle1.md authored | |
| 10 (audit gate Aletheia critical) | scheduled | hand to Aletheia after Cycle 1 ship |
