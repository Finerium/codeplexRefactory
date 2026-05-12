# Checkpoint: Demeter cycle 1

**Stamp**: 2026-05-12 22:25 WIB
**Status**: ship-clean

## 20-item self-check

1. PASS Alembic config + env.py async asyncpg pattern boots
2. PASS `alembic upgrade head` clean against live Refactory Postgres (5 revisions applied)
3. PASS 8 ORM models declared in `app/models/event_store.py` (User, PREvent, FindingEvent, DriftLog, Proposal, SimulationEvent, LLMCallLog, SemanticCacheEmbedding)
4. PASS Schema verbatim Pythia contracts (hades + nemesis + pandora to demeter all reflected)
5. PASS `DemeterRealService` implements `DemeterServiceProtocol` (upsert_user + persist_pr_event satisfied)
6. PASS Real service extended with persist_finding + persist_drift_event + persist_proposal + persist_simulation_event + log_llm_call
7. PASS idempotency via ON CONFLICT DO NOTHING / UPDATE on all UNIQUE constraints (verified live tests)
8. PASS Hades stub at `demeter_service.py` UNTOUCHED; registration via `set_demeter_service()` swap
9. PASS FastAPI lifespan installs DemeterRealService on startup; pool cleanup on shutdown
10. PASS `DEMETER_DISABLE_REAL` env gate prevents lifespan swap during Hades stub-tests
11. PASS dashboard_query.py serves DashboardData per selene-to-demeter.md schema
12. PASS activity_query.py serves ActivityData per boreas-to-demeter.md schema
13. PASS cost_tracking.py aggregates llm_call_log + drains Triton in-memory buffer
14. PASS ticket_aggregation.py provides Sprint Mode pr_events GROUP BY status
15. PASS openspec_runtime.py wraps openspec CLI subprocess (list + validate + show + archive)
16. PASS 1-click GitHub issue route at `POST /api/findings/{finding_id}/to-issue` ships with evidence body + suggested label
17. PASS asyncpg datetime coercion via `_parse_dt()` helper (ISO str -> tz-aware datetime)
18. PASS 40 Demeter tests author (20 unit + 13 live + 7 helper)
19. PASS Existing test baseline preserved: 257 PASS / 14 skip on default localhost env; 270 PASS / 1 skip on live env
20. PASS Anti-pattern audit clean: 0 em dash + 0 emoji on 23 Demeter-owned files; Lock 3 token encrypted; Lock 4 schema verbatim Pythia; Lock 5 honest claim; Lock 8 no paid services; Lock 9 V_n snapshot authored
