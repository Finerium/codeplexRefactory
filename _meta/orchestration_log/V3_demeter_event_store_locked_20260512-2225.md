# V_n snapshot: Demeter event store locked

**Snapshot**: V3_demeter_event_store_locked
**Stamp**: 2026-05-12 22:25 WIB
**Trigger**: Wave 3 Demeter cycle 1 ship-clean (Lock 9 major milestone snapshot)
**Author**: Demeter worker

## Locked artifacts

### Database schema (Alembic upgrade head clean against Refactory Postgres)

- `backend/alembic.ini`
- `backend/migrations/env.py`
- `backend/migrations/script.py.mako`
- `backend/migrations/versions/001_users_pr_events.py`
- `backend/migrations/versions/002_finding_drift.py`
- `backend/migrations/versions/003_proposals_simulation_llm.py`
- `backend/migrations/versions/004_dashboard_views.py`
- `backend/migrations/versions/005_activity_views.py`

### ORM declarative models

- `backend/app/models/event_store.py` (8 tables: users, pr_events, finding_events, drift_log, proposals, simulation_events, llm_call_log, semantic_cache_embeddings)

### Service layer

- `backend/app/services/demeter_real.py` (DemeterRealService asyncpg impl + 5 extended Pydantic schemas)
- `backend/app/services/dashboard_query.py` (DashboardQueryService per selene-to-demeter.md)
- `backend/app/services/activity_query.py` (ActivityQueryService per boreas-to-demeter.md)
- `backend/app/services/cost_tracking.py` (CostTrackingService aggregate + drain)
- `backend/app/services/ticket_aggregation.py` (TicketAggregationService Sprint Mode)
- `backend/app/services/openspec_runtime.py` (subprocess CLI wrapper)
- `backend/app/services/github_issue_create.py` (Hybrid Layer 1 issue creator)

### API

- `backend/app/api/findings/__init__.py`
- `backend/app/api/findings/routes.py` (POST /api/findings/{id}/to-issue + GET /api/findings/by-building/{id} + GET /api/dashboard + GET /api/activity + GET /api/cost/summary + POST /api/cost/drain)
- `backend/app/api/__init__.py` (findings_router include)
- `backend/app/main.py` (lifespan registers DemeterRealService when DEMETER_DISABLE_REAL unset)

### Tests

- `backend/tests/test_demeter_real_smoke.py` (10 tests: Pydantic schema + Protocol compliance)
- `backend/tests/test_demeter_persist_live.py` (13 tests: live Postgres idempotency + query + refresh)
- `backend/tests/test_demeter_issue_create.py` (7 tests: GitHub issue body + label)
- `backend/tests/test_demeter_cost_tracking.py` (8 tests: normalizers + thresholds)
- `backend/tests/test_demeter_dashboard_helpers.py` (10 tests: helper functions)

## Verification evidence

```
alembic upgrade head     -> 5 revisions applied clean
pytest tests/            -> 257 PASS / 14 skip (localhost DATABASE_URL)
pytest tests/            -> 270 PASS / 1 skip (live DATABASE_URL)
pytest tests/test_demeter_*  -> 48 Demeter tests PASS (13 live + 35 unit/helper)
```

Existing baseline preserved: zero regressions on Hades + Triton + Nemesis + Pandora + Atlas tests.

## Schema lock attestation

All 8 tables + 7 materialized views match Pythia contracts verbatim:
- `_meta/contracts/hades-to-demeter.md` users + pr_events
- `_meta/contracts/nemesis-to-demeter.md` finding_events + drift_log
- `_meta/contracts/pandora-to-demeter.md` proposals + simulation_events + llm_call_log
- `_meta/contracts/demeter-to-selene.md` 5 dashboard materialized views
- `_meta/contracts/demeter-to-boreas.md` 2 activity materialized views

## Anti-pattern compliance

- Lock 1 em dash: 0 hits across 23 Demeter-owned files
- Lock 2 emoji: 0 hits across 23 Demeter-owned files
- Lock 3 token encryption: access_token Fernet-encrypted via existing `crypto.py`; decrypt at use site only
- Lock 4 schema locked: Pythia contracts verbatim
- Lock 5 honest claim: real asyncpg impl, no mock lingering
- Lock 8 no paid services: OpenSpec CLI local subprocess
- Lock 9 V_n snapshot: this file
- Lock 10 audit gate: Aletheia Wave 3 auditor mandatory post-Demeter ship

## Cycle 1 status

**SHIP-CLEAN**

No ferries triggered. All scope completed within budget. Sibling Wave 3 ship status unaffected.
