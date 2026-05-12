# Contract: Pandora to Demeter

**Edge type**: intra-wave (Wave 3 internal)
**Wave**: Wave 3 producer to Wave 3 consumer
**Status**: locked
**Authored**: 2026-05-12 16:17 WIB

## Producer

**Worker**: Pandora (Wave 3)
**Domain**: Athena proposal author + Refactor Mode simulation engine multi-turn + drafts/ isolation + dual review gate backend. Pandora produces three categories of events for Demeter persistence: (1) proposal records, (2) simulation events per stage, (3) LLM call cost logs.

## Consumer

**Worker**: Demeter (Wave 3)
**Domain**: PostgreSQL event store. Demeter extends `DemeterService` interface with `persist_proposal` + `persist_simulation_event` + `persist_llm_call` methods + `proposals` + `simulation_events` + `llm_call_log` schemas.

## Output schema (producer to consumer)

```python
# backend/app/services/demeter_service.py (Demeter extends)
from pydantic import BaseModel
from typing import Literal


class ProposalPersist(BaseModel):
    """Refactor proposal record Pandora sends to Demeter on Athena authorship."""
    proposal_id: str  # Stable id; matches OpenSpec change folder name
    user_intent: str
    /** OpenSpec Folder A change path relative to repo root. */
    openspec_change_path: str
    repo_full_name: str
    /** Author user id (from session). */
    author_user_id: int
    /** Initial stage = 'proposed'. */
    stage: Literal["proposed", "simulating", "drafted", "accepted", "discarded", "archived"]
    title: str
    summary: str
    /** Affected file paths. */
    affected_files: list[str]
    /** Created at ISO 8601. */
    created_at: str


class SimulationEventPersist(BaseModel):
    """Simulation engine stage event Pandora sends to Demeter."""
    simulation_id: str  # Matches proposal_id
    stage: Literal[
        "proposed", "tests_generating", "tests_written",
        "impl_generating", "impl_written", "diff_serializing",
        "completed", "accepted", "discarded",
    ]
    /** Stage-specific payload. */
    payload: dict
    /** Event timestamp ISO 8601. */
    timestamp: str


class LLMCallLog(BaseModel):
    """LLM call cost + latency log Pandora (or any Wave 3 worker) sends per LLM call.

    NOTE: This applies to ALL LLM consumers (Pandora, Nemesis Argus, Triton residents).
    Pandora is heaviest consumer so contract documents from this perspective.
    """
    call_id: str  # Stable id
    /** Worker that initiated the call. */
    worker: Literal["pandora", "nemesis", "triton-residents", "boreas-onboarding"]
    /** Optional simulation id if part of simulation. */
    simulation_id: str | None
    /** Optional resident id if resident-routed call. */
    resident_id: Literal["Athena", "Apollo", "Argus", "Clio", "Hermes"] | None
    /** Model used (after defensive layer routing decided). */
    model_used: Literal["V4-Flash", "V4-Pro"]
    /** Thinking mode. */
    thinking_mode: Literal["disabled", "low", "medium", "high"]
    /** Cache hit (skips API call). */
    cache_hit: bool
    /** Canned hit (skips API call). */
    canned_hit: bool
    /** Tokens. */
    input_tokens: int
    output_tokens: int
    /** Cost estimate USD. */
    cost_estimate_usd: float
    /** Latency ms (excludes cache hit). */
    latency_ms: int
    /** Timestamp ISO 8601. */
    timestamp: str
    /** Optional error message if failed. */
    error: str | None


# Demeter service additions
class DemeterService:
    # ... existing methods from hades-to-demeter.md + nemesis-to-demeter.md ...

    async def persist_proposal(self, proposal: ProposalPersist) -> None:
        """Inserts row in `proposals` table.

        UNIQUE constraint on (proposal_id).
        """
        ...

    async def update_proposal_stage(
        self,
        proposal_id: str,
        new_stage: str,
    ) -> None:
        """Updates `proposals.stage` field; called on Accept/Discard."""
        ...

    async def persist_simulation_event(self, event: SimulationEventPersist) -> None:
        """Inserts row in `simulation_events` table."""
        ...

    async def persist_llm_call(self, call: LLMCallLog) -> None:
        """Inserts row in `llm_call_log` table.

        Used by ALL Wave 3 workers (Pandora, Nemesis, Triton residents endpoint).
        """
        ...

    async def aggregate_session_cost(
        self,
        user_id: int,
        since: str,
    ) -> dict:
        """Returns session cost summary for dashboard.

        { total_usd, by_worker: {pandora, nemesis, ...}, by_model: {V4-Flash, V4-Pro} }
        """
        ...
```

Postgres schema:

```sql
-- backend/migrations/versions/003_proposals_simulations_llm.py (Demeter)

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
CREATE INDEX proposals_repo_idx ON proposals(repo_full_name);
CREATE INDEX proposals_stage_idx ON proposals(stage);


CREATE TABLE simulation_events (
    id BIGSERIAL PRIMARY KEY,
    simulation_id TEXT NOT NULL,
    stage TEXT NOT NULL,
    payload JSONB,
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX simulation_events_simulation_idx ON simulation_events(simulation_id);
CREATE INDEX simulation_events_timestamp_idx ON simulation_events(timestamp);


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
CREATE INDEX llm_call_log_worker_idx ON llm_call_log(worker);
CREATE INDEX llm_call_log_timestamp_idx ON llm_call_log(timestamp);
CREATE INDEX llm_call_log_resident_idx ON llm_call_log(resident_id);
```

Pandora consumer pattern:

```python
# backend/app/services/simulation_engine.py (Pandora extends from triton-to-pandora.md)
from app.services.demeter_service import (
    get_demeter_service, SimulationEventPersist, LLMCallLog,
)


class SimulationEngine:
    async def run(self, simulation_id: str, user_intent: str, target_repo: str):
        demeter = get_demeter_service()

        # ... 3 turns (Turn 1 tests, Turn 2 impl, Turn 3 diff) ...
        # Each turn:
        #   1. Persist SimulationEventPersist on stage start
        #   2. Run LLM call via Triton client
        #   3. Persist LLMCallLog (Triton client returns metadata)
        #   4. Persist SimulationEventPersist on stage complete
        for turn_result in self._run_turns(simulation_id, user_intent, target_repo):
            await demeter.persist_simulation_event(turn_result.event)
            await demeter.persist_llm_call(turn_result.llm_call)
```

## Storage location

- DemeterService extensions: `backend/app/services/demeter_service.py` (Demeter)
- Migration: `backend/migrations/versions/003_proposals_simulations_llm.py` (Demeter)
- Pandora simulation engine: `backend/app/services/simulation_engine.py` (Pandora)
- Pandora proposal author: `backend/app/services/proposal_author.py` (Pandora)
- Cost tracker: queries `llm_call_log` via materialized view `session_cost_aggregate` (Demeter authors)

## Asumption baked

1. `proposals.proposal_id` matches `simulation_events.simulation_id` matches OpenSpec change folder name (single id across all related records).
2. LLM call log applies to all Wave 3 workers; centralized cost tracking. Triton's LLMClient must accept `worker` + optional `simulation_id` + optional `resident_id` metadata for the log entry.
3. Cost estimate calculated by Triton's `LLMClient.estimate_cost` per PRD Section 18.1 pricing (V4-Flash $0.14 input / $0.28 output; V4-Pro $1.74 input / $3.48 output per 1M tokens).
4. Hafiz $5 budget; Pandora simulation expected $0.05-0.20 per run; cost tracker warns user if budget < $0.50 remaining (PRD Section 18.8 cost protection).
5. Materialized view `session_cost_aggregate` refreshed on llm_call_log insert; dashboard displays cost per session.

## Validation steps

**Producer responsibility (Pandora)**:
- Persist proposal at simulation start (stage='proposed').
- Persist simulation event at each stage transition (7 stages typical: proposed -> tests_generating -> tests_written -> impl_generating -> impl_written -> diff_serializing -> completed).
- Persist LLM call log for each Triton call (Turn 1 + Turn 2 + Turn 3).
- Update proposal stage on user Accept/Discard.
- Idempotency: re-running simulation with same id replaces simulation_events (or appends with timestamp ordering).

**Consumer responsibility (Demeter)**:
- Migration creates 3 new tables.
- Persist methods idempotent (UNIQUE constraints).
- Cost aggregate query returns accurate session totals.
- Smoke test: simulate one proposal, persist 3 LLM calls + 7 simulation events + 1 proposal row; query session cost matches sum.

## Edge case handling

- Persist on disconnected DB: Pandora retries 2 times; persistent failure logs + simulation may continue (events lost but simulation engine doesn't halt).
- Proposal id collision (extremely rare): Pandora regenerates id with counter suffix.
- LLM call failed: persist LLMCallLog with `error` field populated + zero tokens; cost = 0.
- Cost budget exceeded mid-simulation: Pandora pauses simulation between turns + publishes warning event; user confirms continue or abort.

## Open questions

- Cost budget enforcement: hard halt vs warning? PRD Section 18.8 spec hard halt at $4.50 to leave buffer. Wave 3 implementation per Pandora final call.
- LLM call log table retention: hackathon scope = keep all; production retention policy out of scope.

## Reference

- Metis Agentic Structure md Section 2 DAG: Pandora simulation events consumed by Demeter event-store
- Metis Section 5.6 Pandora + Demeter ship criteria
- PRD Section 9.3 (Refactor Mode SAFETY-FIRST)
- PRD Section 18.1 (DeepSeek V4 pricing)
- PRD Section 18.6 (multi-turn simulation engine)
- PRD Section 18.7 (event store schema overview)
- PRD Section 18.8 (cost protection)
- Contract `hades-to-demeter.md` (DemeterService base)
- Contract `nemesis-to-demeter.md` (extension pattern reference)
- Contract `triton-to-pandora.md` (LLM client multi-turn)
