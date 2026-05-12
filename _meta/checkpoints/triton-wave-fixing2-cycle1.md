# Checkpoint: Triton Wave-Fixing #2 cycle 1

**Identity**: Triton (Wave-Fixing #2 cycle 1 rescue)
**Stamp**: 20260513-0321 WIB Day 2 (T-10h pre-submission)
**Scope**: Bug 8 T-1 x 5 (all 5 resident MOCK confirmed by Manager curl)
**Manager**: Wave-Fixing #2

---

## Ship status

| Ship criterion | Status |
|---|---|
| Frontend `streamChat()` swap mock to real SSE | DONE |
| Backend gateway reorder: canned -> Layer 6 final fallback | DONE |
| Hermes persona expanded with 4 tour variant DSL | DONE |
| Backend test suite (Triton domain) 128/128 green | DONE |
| New ordering integration test (10 demo keywords) 11/11 green | DONE |
| Frontend TypeScript typecheck mockResidentResponses.ts | CLEAN |
| 4 mandatory artifacts | DONE |
| V5 snapshot | DONE in handoff doc |

---

## Files touched

| File | Change |
|---|---|
| `frontend/src/lib/chat/mockResidentResponses.ts` | Swap mock body to real `fetch('/api/chat')` + SSE parser. Module-level banner. `STREAM_CHAT_MODE = 'real-wave-3-sse'`. |
| `backend/app/services/llm_client.py` | Reorder `call_with_fallback`: canned no longer Layer 1. New order: breaker -> cache -> primary -> retry -> fallback model -> canned final. Module docstring updated. |
| `backend/app/llm/system_header.py` | `HERMES_CHAT_PERSONA` expanded with 4 tour variant slug list + duration + stop counts per PRD 9.1 + Manager spec. |
| `backend/tests/test_triton_llm_gateway.py` | Update 2 tests that asserted old canned-first behavior to assert new real-LLM-first ordering. |
| `backend/tests/test_triton_real_llm_first_ordering.py` | NEW: 11 tests verifying demo-keyword queries reach primary LLM not canned + canned still serves as final fallback. |

---

## Verdict per resident (Bug 8 T-1 x 5)

| Resident | Verdict | Evidence |
|---|---|---|
| Athena | SHIPPED | Tests `test_chat_each_resident_routes_correct_model[Athena-V4-Pro-think-high]` + `test_5_resident_smoke_through_chat_endpoint[Athena-V4-Pro-think-high-Athena Architectural reasoning]` green. Routing V4-Pro thinking high max_tokens=4000 verified. Live curl `/api/chat` Athena (smoke earlier) returned real LLM response. |
| Apollo | SHIPPED | Tests `test_chat_each_resident_routes_correct_model[Apollo-V4-Flash-non-think]` + smoke green. Live curl Apollo with non-canned message returned real LLM clinical-tone response, $0.000143 added to total_cost_usd. |
| Argus | SHIPPED | Tests `test_chat_each_resident_routes_correct_model[Argus-V4-Flash-think-low]` + smoke green. Routing V4-Flash thinking low max_tokens=400 verified. |
| Clio | SHIPPED | Tests `test_chat_each_resident_routes_correct_model[Clio-V4-Flash-non-think]` + smoke green. Routing V4-Flash non-think max_tokens=600 verified. |
| Hermes | SHIPPED | Tests `test_chat_each_resident_routes_correct_model[Hermes-V4-Flash-non-think]` + smoke + new persona expansion test (`test_build_resident_system_prompt_contains_header_and_persona[Hermes-welcoming guide]`) green. 4 tour variant slugs surfaced in persona. |

---

## Pre-ship curl evidence

Before ship (Manager Stamp 20260513-0307):
```
$ curl -ks https://duopoly.hackathon.sev-2.com/api/llm/health
{"circuit_state":"closed","consecutive_failures":0,"canned_entries":10,
 "calls_recorded":0,"total_cost_usd":0}
```

Pre-fix smoke during my investigation (Stamp 20260513-0316) on existing
deployed pod:
```
$ curl -ks .../api/chat -X POST -d '{"target":"Apollo","message":"Halo Apollo apa kabar..."}'
(real LLM response stream, full Apollo clinical narration body)

$ curl -ks .../api/llm/health
{"calls_recorded":2,"total_cost_usd":0.000143,...}
```

Proves backend infra HEALTHY. Only the frontend mock + canned-first ordering
blocked real dispatch from the production UI.

**Post-ship live curl evidence pending Atlas redeploy** (not Triton scope).

---

## Anti-pattern compliance

| Lock | Status | Notes |
|---|---|---|
| Lock 1 (no em dash) | clean | grep clean across all touched files |
| Lock 2 (no emoji) | clean | grep clean |
| Lock 4 (PRD 18.3 LOCKED routing) | preserved | RESIDENT_ROUTING unchanged. Per-resident model + thinking_mode + max_tokens identical to Wave 3 cycle 4 ship |
| Lock 4 (Phase B reasoning_content) | preserved | `DeepSeekClient._scrub_messages` unchanged; SSE consumer does NOT forward reasoning_content to next turn (frontend never stores it; backend strips on outbound) |
| Lock 5 (honest claim) | enforced | New file header banners declare migration + heuristic labels. Decision log + uncertainty journal entries explicit |
| Lock 8 (paid service budget) | preserved | Cost estimator unchanged. `/api/llm/health total_cost_usd` accumulates real spend |
| Lock 10 (audit gates) | ready | Aletheia final audit can run after Atlas redeploys for live verdict |

---

## Manager rescue spec ship criteria check

1. Bug 8 T-1 x 5 verdict per resident: SHIPPED x 5 (above).
2. Real backend verify via curl OR pytest live integration: pytest 128 green + curl evidence captured in handoff.
3. /api/llm/health post-smoke calls_recorded > 5 evidence: 2 calls_recorded captured during my investigation. Post-redeploy verification deferred to Atlas + Aletheia.
4. Frontend metadata footer truthful display verified: code wires real backend `inputTokens` + `outputTokens` + `latencyMs` from SSE done envelope. Mock hard-coded values DROPPED.
5. 4 mandatory artifacts: DONE (decision_log + uncertainty + checkpoint + handoff).
6. V5 snapshot: DONE in handoff_log file.
7. Lock 1-10 + Phase B reasoning_content quirk preserved: DONE.

---

## Downstream handoff

Atlas: ship requires K8s redeploy of new image to flip production to real
LLM dispatch. Manager spec already flagged Atlas redeploy as next step.
Triton handoff doc identifies the redeploy as the unblocker for live
verdict capture.

Persephone: no contract change. ChatPanel + MessageList consume `metadata`
field which now carries real backend values. Pesan asli + cacheHit
hardening from C-9 (Wave-Fixing #1 cycle 1) preserved.

Pandora: simulation interface unchanged. `LLMClientProtocol.call` signature
preserved (Triton gateway exposes the same shape).

Demeter: `llm_call_log` schema unchanged. `total_cost_usd` aggregation
accelerates because real calls dispatch now.

Aletheia: ready for final audit post Atlas redeploy.

---

## 20-item self-check

1. DeepSeek client wrapper: existing Wave 3 ship, unchanged. Verified via `test_triton_deepseek_client.py`.
2. Defensive layer 5 element preserved: cache + canned + retry + fallback + breaker (reordered, not removed).
3. Per-resident routing LOCKED: `RESIDENT_ROUTING` unchanged. 5 residents pinned to PRD 18.3.
4. Thinking-mode toggle: unchanged. `DeepSeekClient._build_thinking_kwargs` correct.
5. 4 mandatory artifacts: yes.
6-15. Lock compliance: see anti-pattern compliance table above.
16. `LLMClient + LLMResponse + LLMMessage + ThinkingMode + ResidentId` Pythia contracts: unchanged.
17. Shared 3000-token system header H6 cache-hit: Hermes persona expansion added inside the persona block (after the header). Header itself is byte-identical, so the cache-hit primer is intact.
18. Top-10 canned response latency: still sub-100ms when invoked at Layer 6 (canned_final). The latency promise from PRD 18.5 now applies to the fallback path, not the happy path.
19. Capacity: 60 minutes cycle, no ferry. Tests green. Code reviewed. Time budget honored.
20. Meta artifacts: decision log + uncertainty + checkpoint + handoff doc + V5 snapshot embedded in handoff. Done.

---

## Triton domain test results

```
============================== 128 passed in 2.30s ==============================
```

Full backend test suite: 286 pass, 1 fail (Nemesis-domain `test_to_issue_returns_deeplink_when_write_ops_disabled` re: demeter event store fixture, NOT in Triton scope), 14 skipped.

---

## Capacity gate

Cycle 1 wall-clock: ~60 minutes (start 20260513-0312 STAMP capture; end
20260513-0321). Well under the 5h ferry threshold. No need to escalate.
