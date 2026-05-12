# Decision Log: Triton (Wave 3)

Append-only log of Triton-scope decisions. Per `.claude/agents/triton.md`
Section 4 mandatory artifact 1 of 4.

## D-Triton-01: LLMResponse shape mirrors Pandora StubLLMClient verbatim

**Date**: 2026-05-12 21:42 WIB Day 1 evening
**Decision**: Triton's `LLMResponse` Pydantic model uses field names matching
Pandora's local stub `LLMResponse` dataclass at
`backend/app/services/refactor/llm_stub.py` (Cycle 1 ship).
**Why**: Pandora consumes `LLMClientProtocol` via the local stub during Cycle 1
because Wave 3 spawned 6 workers in parallel. The Cycle 2 swap target must be a
1-line import flip. Identical field names + types (`content`, `model_used`,
`thinking_mode`, `cache_hit`, `canned_hit`, `input_tokens`, `output_tokens`,
`cost_estimate_usd`, `latency_ms`, `reasoning_content`, `error`, `call_id`)
makes that swap zero call-site diff.
**Trade-off**: Triton-only `fallback_chain` field is additive (default empty
list) so it does not break Pandora's older consumer.
**Impact**: Pandora swap is single import line. Nemesis Argus consumer also
benefits because it can hold a typed reference to `LLMClientProtocol` and let
Triton fill it.

## D-Triton-02: LLMMessage Pydantic ConfigDict(extra="forbid") for Lock 4 defense in depth

**Date**: 2026-05-12 21:42 WIB
**Decision**: `LLMMessage` rejects any extra fields including
`reasoning_content` at type-construction time.
**Why**: Phase B Topic E LOCKED critical anti-pattern. DeepSeek V4 thinking
mode ignores `reasoning_content` on input but pollutes context tokens + cost.
Three layers of defense: (1) Pydantic `extra=forbid` blocks type-level
injection; (2) `DeepSeekClient._scrub_messages` rebuilds outgoing wire dicts
with only role + content; (3) regression test
`test_triton_reasoning_content_strip.py` audits client.py source for the
forbidden assembly pattern.
**Trade-off**: Pydantic dict-bypass construction raises ValidationError. This
is intended behavior: any caller hitting the trap learns immediately via
exception rather than silent context pollution.
**Impact**: Phase B Lock 4 critical anti-pattern enforced at every layer.

## D-Triton-03: Per-resident routing config locked + pinned by parametrized test

**Date**: 2026-05-12 21:43 WIB
**Decision**: `RESIDENT_ROUTING` and `SIMULATION_ROUTING` mappings in
`app/llm/resident_routing.py` mirror PRD Section 18.3 and 18.6 verbatim, and
the test `test_resident_routing_locked_per_prd_18_3` is parametrized over
all 5 residents + all 3 simulation turns.
**Why**: Lock 4 no silent assume. CI failure on edit forces a ferry-or-revert
decision. Defaults to ferry V1 Orch + Ghaisan for any routing remap.
**Trade-off**: A genuine routing tune (e.g., Argus needs V4-Pro because CVSS
quality insufficient on V4-Flash) requires both PRD edit and a ferry log
entry. Acceptable trade for routing stability.
**Impact**: PRD lock holds without policy slippage.

## D-Triton-04: 5 chat persona prompts inlined in system_header.py

**Date**: 2026-05-12 21:46 WIB
**Decision**: `app/llm/system_header.py` declares the 5 chat resident persona
blocks (`ATHENA_CHAT_PERSONA`, `APOLLO_CHAT_PERSONA`, `ARGUS_CHAT_PERSONA`,
`CLIO_CHAT_PERSONA`, `HERMES_CHAT_PERSONA`) inline with the label `[INLINE:
hephaestus-persona-summary-expansion]` rather than parsing them from
`PromptOpening-codeplex-chronicle.md`.
**Why**: Hephaestus PromptOpening Section 4 provides persona voice summaries
(not full persona blocks). Wave 3 needs the full blocks for runtime routing.
Inlining honors Lock 5 honest claim (the source is labeled explicitly) and
keeps the file parseable. Pan post-Wave 3 may re-issue PromptOpening with
explicit blocks; the loader pattern allows file-based override without code
change.
**Trade-off**: Persona content lives in Python source rather than the
canonical PromptOpening file. Two-source risk mitigated by the inline label +
agent-prompt cross-reference.
**Impact**: Wave 3 ships now without blocking on a Hephaestus re-author cycle.

## D-Triton-05: Simulation system prompts re-exported from Pandora module

**Date**: 2026-05-12 21:46 WIB
**Decision**: `build_simulation_system_prompt(turn)` imports from
`app.services.refactor.prompts` (Pandora-owned canonical prompts) rather than
copying the strings into `system_header.py`.
**Why**: Single source of truth. Pandora authored
`ATHENA_TEST_GEN_SYSTEM`, `ATHENA_IMPL_GEN_SYSTEM`, `DIFF_SERIALIZE_SYSTEM`
in Cycle 1 with the full system prompt content tuned for the Refactor Mode
simulation engine. Triton wires the runtime; Pandora owns the content.
**Trade-off**: Slight Python import-order coupling (Triton imports Pandora
module). Acceptable because Pandora module has zero downstream Triton imports
(no cycle).
**Impact**: Future Pandora prompt tunes flow through to Triton without code
sync.

## D-Triton-06: In-memory llm_call_log buffer Wave 3, Demeter Postgres persist deferred

**Date**: 2026-05-12 21:48 WIB
**Decision**: `app/services/llm_call_log_buffer.py` is a bounded deque of
`LLMCallLogEntry` matching Demeter's `llm_call_log` table schema. Demeter
Wave 3 Cycle 2 will add a persist hook that subscribes to `record()` and
INSERTs rows.
**Why**: Wave 3 ships in parallel; Demeter schema migration is not blocking
Triton's gateway. In-memory buffer satisfies the Aletheia audit cost-tracking
requirement (`/api/llm/health` surfaces cumulative cost). Production Phase 2
swaps to Postgres persist.
**Trade-off**: K8s pod restart loses the buffer. Acceptable Wave 3 single-pod
demo scope. Lock 5 [STUB] label on module + class makes intent explicit.
**Impact**: Hafiz $5 budget tracker functional immediately; persistence
upgrade is additive when Demeter ships.

## D-Triton-07: Defensive chain ordering canned-then-cache-then-primary

**Date**: 2026-05-12 21:50 WIB
**Decision**: `LLMGateway.call_with_fallback` evaluates layers in order:
canned response, circuit breaker probe, semantic cache, primary, retry
simplified, fallback model, final canned (or apology). PRD Section 18.4
references canned + cache + primary + retry + fallback + canned final; the
circuit breaker probe slots between canned and cache because canned must
serve even when DeepSeek is hard-down.
**Why**: Canned is sub-100ms in-memory (PRD Section 18.5 latency target).
Putting it before circuit breaker guarantees demo answer availability when
the API is down. Semantic cache after circuit breaker keeps the order
intuitive (cache costs an embedding compute; we only do it when the upstream
might serve).
**Trade-off**: A canned hit short-circuits cache write. We accept this: the
canned answer is canonical for the demo prompts; caching the LLM-generated
version would only displace the canned in subsequent calls if the embedding
similarity drifts.
**Impact**: Demo reliability: even with API down, the top-10 questions
always respond. H6 cache-hit hypothesis still validated on non-canned queries.

## D-Triton-08: SSE streaming via chunkified non-streaming response Wave 3 Cycle 3

**Date**: 2026-05-12 21:52 WIB
**Decision**: Chat endpoint runs a single non-streaming LLM call via the
gateway, then chunks the response into 80-character SSE windows.
**Why**: Wave 3 Cycle 3 priority is wire-format conformance with Persephone's
SSE consumer. OpenAI SDK streaming context manager requires `client.chat.completions.stream(...)`
which doesn't pass through the gateway's defensive fallback chain cleanly. The
chunkified approach gives the UI an identical SSE stream shape with no UX
degradation (the typewriter effect is preserved at the 80-char window).
**Trade-off**: Slightly longer total latency for the first chunk (server
waits for full LLM completion before emitting). Acceptable for demo because
canned hits are sub-100ms and the most common path is canned.
**Impact**: Persephone consumer code unchanged. Cycle 4 may upgrade to native
stream + defensive layer if latency becomes a demo concern.

## D-Triton-09: ResidentId TitleCase matches Persephone contract verbatim

**Date**: 2026-05-12 21:42 WIB
**Decision**: Triton's `ResidentId = Literal["Athena", "Apollo", "Argus", "Clio", "Hermes"]`
uses TitleCase to match Persephone `frontend/src/lib/chat/types.ts` line 25
verbatim.
**Why**: Wire-level consistency. Persephone sends `target: "Apollo"` and
Triton reads it via FastAPI request model. Lowercase would force a layer of
case normalization at every endpoint.
**Trade-off**: Different from PRD Section 18.3 routing config field-name
casing (`apollo_persona` etc.), but those are internal map keys, not wire
values.
**Impact**: Persephone -> Triton SSE round-trip works without case-bridge code.

## D-Triton-10: Auth session dependency extended with require_session FastAPI dep

**Date**: 2026-05-12 21:55 WIB
**Decision**: Triton's Cycle 3 endpoints (chat, onboarding, security,
simulation) use `from app.services.auth_session import require_session` as a
FastAPI dependency. Hades's `auth_session.py` did not previously export this
dep; Triton added it with a `[STUB]` open-session body for Wave 3 Cycle 3 so
endpoints validate cookie when present and fall through to anonymous demo
session otherwise. Hades Cycle 2 will harden to raise 401 on missing/invalid
cookie.
**Why**: Hades + Triton parallel spawn means no worker can wait. Stub
dependency preserves call-site signature stability so Hades's Cycle 2 hardening
is a body-only edit.
**Trade-off**: Lock 5 honest claim required: docstring + Triton handoff note
flag the stub. Aletheia audit verifies before Pan ship.
**Impact**: Triton endpoints functional standalone; Hades unblocked.
