# Handoff Log: Wave 3 Pandora to Wave 3 Demeter

**Edge**: Wave 3 Pandora (Refactor simulation engine + Athena proposal author + drafts/ isolation + dual review gate API) to Wave 3 Demeter (PostgreSQL event store + persist methods + materialized views).
**Contract**: `_meta/contracts/pandora-to-demeter.md`
**Date**: 2026-05-12 21:48 WIB Day 1 evening
**Status**: Pandora Cycle 1 ship clean; awaits Demeter Cycle 1 stub for the swap.

## What Pandora delivers

### Persist surface Pandora calls per simulation

Pandora's `SimulationEngine.run` invokes the Demeter adapter at these 4 points (in order):

1. `persist_proposal(ProposalPersist)` once at Turn 0 (stage='proposed').
2. `persist_simulation_event(SimulationEventPersist)` x6 (one per stage transition: tests_generating, tests_written, impl_generating, impl_written, diff_serializing, completed).
3. `persist_llm_call(LLMCallLog)` x3 (one per Triton call: Turn 1 V4-Pro think high, Turn 2 V4-Pro think high, Turn 3 V4-Flash non-think).
4. `update_proposal_stage(proposal_id, 'drafted')` on completion.

On user Accept (via `POST /api/refactor/{simulation_id}/accept`):
5. `update_proposal_stage(proposal_id, 'accepted')`.
6. `persist_simulation_event(SimulationEventPersist)` with stage='accepted' + payload.diffFilePath.

On user Discard (via `POST /api/refactor/{simulation_id}/discard`):
5'. `update_proposal_stage(proposal_id, 'discarded')`.
6'. `persist_simulation_event(SimulationEventPersist)` with stage='discarded'.

### Pandora local interface (Demeter swap site)

Pandora declares `DemeterAdapterProtocol` at `backend/app/services/refactor/demeter_adapter.py`. The Protocol surface is:

```python
class DemeterAdapterProtocol(Protocol):
    async def persist_proposal(self, proposal: ProposalPersist) -> None: ...
    async def update_proposal_stage(
        self, proposal_id: str, new_stage: str,
    ) -> None: ...
    async def persist_simulation_event(
        self, event: SimulationEventPersist,
    ) -> None: ...
    async def persist_llm_call(self, call: LLMCallLog) -> None: ...
```

Demeter Cycle 1 stub MUST implement these 4 methods with the field schema documented in `_meta/contracts/pandora-to-demeter.md` lines 26-91.

### Stub-and-sync swap

When Demeter Cycle 1 stub ships `backend/app/services/demeter_service.py` with a class `DemeterService` implementing the Protocol surface above, Pandora replaces the singleton factory:

```python
# backend/app/services/refactor/demeter_adapter.py

# Cycle 1 stub:
def get_demeter_adapter() -> DemeterAdapterProtocol:
    global _singleton
    if _singleton is None:
        _singleton = StubDemeterAdapter()
    return _singleton

# Cycle 2 swap (after Demeter Cycle 1 ship):
from app.services.demeter_service import get_demeter_service
def get_demeter_adapter() -> DemeterAdapterProtocol:
    return get_demeter_service()
```

Single import edit; call sites unchanged.

## What Demeter needs to know

### Table schemas required

Per `_meta/contracts/pandora-to-demeter.md` lines 137-191, three tables with these exact columns:

```sql
CREATE TABLE proposals (
    id BIGSERIAL PRIMARY KEY,
    proposal_id TEXT UNIQUE NOT NULL,
    user_intent TEXT NOT NULL,
    openspec_change_path TEXT NOT NULL,
    repo_full_name TEXT NOT NULL,
    author_user_id INTEGER REFERENCES users(id),
    stage TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    affected_files TEXT[],
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE simulation_events (
    id BIGSERIAL PRIMARY KEY,
    simulation_id TEXT NOT NULL,
    stage TEXT NOT NULL,
    payload JSONB,
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE llm_call_log (
    id BIGSERIAL PRIMARY KEY,
    call_id TEXT UNIQUE NOT NULL,
    worker TEXT NOT NULL,
    simulation_id TEXT,
    resident_id TEXT,
    model_used TEXT NOT NULL,
    thinking_mode TEXT NOT NULL,
    cache_hit BOOLEAN NOT NULL DEFAULT FALSE,
    canned_hit BOOLEAN NOT NULL DEFAULT FALSE,
    input_tokens INTEGER NOT NULL,
    output_tokens INTEGER NOT NULL,
    cost_estimate_usd NUMERIC(10, 6) NOT NULL,
    latency_ms INTEGER,
    timestamp TIMESTAMPTZ NOT NULL,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Pandora's Pydantic record dataclasses at `backend/app/services/refactor/demeter_adapter.py` mirror these schemas field-by-field. Demeter migration file at `backend/migrations/versions/003_proposals_simulations_llm.py` (per contract) MUST match the column types.

### Cost budget enforcement (Cycle 2 swap)

Pandora's `_meta/decision_log/pandora.md` Decision 10 notes a Cycle 2 polish task: cost-budget check via `aggregate_session_cost(user_id, since)` materialized view query. Per PRD Section 18.8: halt new simulations if remaining budget < $0.50. Demeter Cycle 1 stub: declare the `aggregate_session_cost` method signature; Cycle 2 ship: implement against the materialized view.

### Idempotency contract

Per `_meta/contracts/pandora-to-demeter.md` lines 234-238 + Validation Steps "Idempotency":

- `proposal_id` UNIQUE constraint: re-running simulation with same id should not duplicate row.
- `call_id` UNIQUE constraint: defensive against retried LLM calls.
- `simulation_events` append-only with timestamp ordering (no UNIQUE on (simulation_id, stage) because the same stage may publish twice across a turn start + complete event sequence).

Pandora's stub uses dict-by-id for proposals + append-list for events + append-list for llm_calls; matches the production schema semantics.

## Validation steps for Demeter before consume

1. Verify migration 003 creates the 3 tables with the exact column schema documented above.
2. Run Pandora's smoke test against the real Demeter adapter:

```bash
cd backend
# Override the Demeter singleton in the test fixture to use the real service
python3 -m pytest tests/test_simulation_engine_smoke.py -v
```

3. Verify Demeter persists 1 proposal + 6 simulation_events + 3 llm_calls per simulation run.
4. Verify `update_proposal_stage` updates `proposals.stage` + `proposals.updated_at`.
5. Verify the cost aggregate query: `SELECT SUM(cost_estimate_usd) FROM llm_call_log WHERE simulation_id = ?` returns the total cost.

## Open questions for Demeter

- Materialized view `session_cost_aggregate` refresh strategy: on insert (Demeter Cycle 2 trigger) vs scheduled refresh (cron 1 min). Decision deferred to Demeter; Pandora consumes whatever surface lands.
- LLM call log retention policy: hackathon scope = keep all; Demeter Cycle 2 may add a TTL.

## References

- Pandora prompt: `.claude/agents/pandora.md`
- Plan file: `docs/superpowers/plans/20260512-pandora-wave3.md`
- Pandora Cycle 1 checkpoint: `_meta/checkpoints/pandora-cycle1.md`
- Pandora decisions: `_meta/decision_log/pandora.md`
- Pandora uncertainty journal: `_meta/uncertainty/pandora-cycle1-20260512-2148.md`
- Pythia contracts: `_meta/contracts/pandora-to-demeter.md`
- Backend source: `backend/app/services/refactor/demeter_adapter.py`
