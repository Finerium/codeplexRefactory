# Handoff Log: Pandora Cycle 1 Stub (Stub-and-Sync to Hades + Triton + Demeter)

**Worker**: Pandora (Wave 3)
**Cycle**: 1 (combined cycle 1-5 single ship)
**Date**: 2026-05-12 21:48 WIB Day 1 evening
**Purpose**: Document the local Protocol stubs Pandora declares so the simulation engine + dual review gate API + tests run end-to-end without waiting for Hades / Triton / Demeter Cycle 1 stubs.

## Why this handoff exists

Per `.claude/agents/pandora.md` Cycle 1 directive + Manager Wave 3 spawn batch note: 6 workers spawn parallel; stub-and-sync inter-worker dependency. Pandora cannot block on Hades + Triton + Demeter because (a) Wave 3 wall-clock is ~6.7h vs Pandora budget ~5-6 jam, (b) the V2 unlock pace is ~2h ahead of nominal so the buffer is generous, (c) the simulation engine smoke test needs a deterministic LLM + bus + persist to validate AD-19 isolation + Phase B Topic E quirk + 9-stage enum parity.

## Stubs Pandora declares (4)

### Stub 1: LLMClient (Triton domain)

- File: `backend/app/services/refactor/llm_stub.py`
- Protocol: `LLMClientProtocol` (mirror of `_meta/contracts/triton-to-pandora.md` `LLMClient.call` signature).
- Stub impl: `StubLLMClient`. Deterministic canned responses keyed by system prompt content:
  - Athena proposal JSON (system prompt contains "STRICT JSON" or "ghost_hints"): returns the canned 2FA proposal JSON.
  - Athena Turn 1 test_gen (system prompt contains "Turn 1 of 3"): returns the canned Python test fenced block.
  - Athena Turn 2 impl_gen (system prompt contains "Turn 2 of 3"): returns the canned Python impl fenced block.
  - Diff serialize Turn 3 (system prompt contains "Turn 3 of 3"): returns the canned unified diff fenced block.
  - Fallback: returns a labelled placeholder.
- Singleton factory: `get_llm_client()` returns the `StubLLMClient` singleton; `set_llm_client(client)` overrides.
- Cycle 2 swap site: when Triton ships `backend/app/services/llm_client.py` with `DeepSeekClient` implementing `LLMClientProtocol`, replace `get_llm_client` body with `from app.services.llm_client import get_llm_client as _real; return _real()`.

### Stub 2: ParserService (Hades domain)

- File: `backend/app/services/refactor/proposal_author.py` (Protocol declared locally; no separate stub file because Pandora can run with `parser=None`).
- Protocol: `ParserServiceProtocol` (mirror of `_meta/contracts/hades-to-pandora.md` subset Pandora consumes).
- Stub behaviour: `ProposalAuthor.__init__` accepts `parser=None`; `_parser_pre_pass` returns empty dict when parser is None; `verify_draft_syntax` returns empty list when parser is None.
- Cycle 2 swap site: when Hades ships `backend/app/parsers/__init__.py` with `get_parser_service()` returning a real `ParserService`, replace `ProposalAuthor.__init__` parser default: `self._parser = parser or get_parser_service()`.

### Stub 3: DemeterAdapter (Demeter domain)

- File: `backend/app/services/refactor/demeter_adapter.py`
- Protocol: `DemeterAdapterProtocol` (mirror of `_meta/contracts/pandora-to-demeter.md` `DemeterService` surface).
- Stub impl: `StubDemeterAdapter` (in-memory dict for proposals + lists for simulation_events + llm_calls).
- Singleton factory: `get_demeter_adapter()` returns the `StubDemeterAdapter` singleton; `set_demeter_adapter(adapter)` overrides.
- Cycle 2 swap site: when Demeter ships `backend/app/services/demeter_service.py` with `DemeterService` implementing the Protocol, replace `get_demeter_adapter` body.

### Stub 4: RefactorEventBus (Hades domain)

- File: `backend/app/services/refactor/ws_publisher.py`
- Class: `InMemoryRefactorBus` (process-local pub/sub with rolling 64-event history).
- Singleton factory: `get_refactor_bus()` returns the `InMemoryRefactorBus` singleton; `set_refactor_bus(bus)` overrides.
- Cycle 2 swap site: when Hades ships `backend/app/services/event_bus.py` with `refactor_bus` (real process-global bus or Redis-backed), replace `get_refactor_bus` body.

## Tests verifying stub-and-sync isolation

- `test_simulate_endpoint_returns_202_with_simulation_id`: full POST /simulate flow against the stubs.
- `test_simulation_engine_e2e_publishes_full_event_sequence`: end-to-end run against the stubs, asserts 1 proposal + 6 stage events + 3 LLM calls.
- `test_simulation_engine_does_not_touch_production_paths`: AD-19 mtime sentinel test.

All 43 Pandora-owned tests pass on the stubs alone; the real upstream impls only need to satisfy the Protocol surface to be drop-in compatible.

## When upstream handoffs land

Pandora monitors STATUS.md Wave 3 sync events. Expected timeline per Manager Wave 3 dispatch:

- Hades cycle 1 stub: API signature locked + stub response callable.
- Triton cycle 1 stub: LLM client module signature + stub response per resident.
- Demeter cycle 1 stub: SQLAlchemy schema + Alembic migration + stub query.

When all 3 ship, Pandora Cycle 2 swap applies 4 import-edit changes + re-runs the smoke test against the real surfaces. Cycle 2 also wires:
- Parser pre-pass: `proposal_author._parser_pre_pass` calls Hades `find_callsites`.
- Draft syntax verification: `simulation_engine` calls `verify_draft_syntax` after Turn 2.
- Cost-budget enforcement: query Demeter `aggregate_session_cost` before each new simulation.
- Defensive layer integration: catch Triton `circuit_breaker_open` exception + publish `stage='discarded'` + payload.error.

## Ferry status

NOT triggered. Pandora ships Cycle 1 clean; downstream Demeter + Asclepius handoff contracts authored.

## References

- Pandora prompt: `.claude/agents/pandora.md`
- Plan file: `docs/superpowers/plans/20260512-pandora-wave3.md`
- Pandora Cycle 1 checkpoint: `_meta/checkpoints/pandora-cycle1.md`
- Pandora decisions: `_meta/decision_log/pandora.md`
- Pandora uncertainty journal: `_meta/uncertainty/pandora-cycle1-20260512-2148.md`
- Downstream handoffs: `_meta/handoff_log/wave3_pandora_to_demeter.md` + `_meta/handoff_log/wave3_pandora_to_asclepius.md`
- Upstream Pythia contracts: `_meta/contracts/triton-to-pandora.md` + `_meta/contracts/hades-to-pandora.md` + `_meta/contracts/pandora-to-demeter.md`
- Upstream handoff doc anchor: `_meta/handoff_log/wave2_asclepius_to_pandora.md`
