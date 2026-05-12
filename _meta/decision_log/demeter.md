# Decision log: Demeter (Wave 3)

Append-only log per `_meta/contracts/` convention. Cycle 1 ship 2026-05-12.

## D-Demeter-01 (2026-05-12 22:10 WIB)

Adopt Alembic async asyncpg pattern with `async_engine_from_config` + manual `_database_url` injection (bypass ConfigParser interpolation due to `%` chars in URL-encoded password). Validated against live Refactory Postgres `103.185.52.138:1185/duopoly`.

## D-Demeter-02 (2026-05-12 22:11 WIB)

Ship real impl at `app/services/demeter_real.py` (NOT overwrite Hades stub at `app/services/demeter_service.py`). Register via `set_demeter_service(DemeterRealService(pool))` at FastAPI lifespan startup. Preserves Hades Protocol type-stability. Stub remains as fallback when DB unreachable.

## D-Demeter-03 (2026-05-12 22:12 WIB)

5 Alembic migration revisions (001-005) split by domain: users+pr_events, finding+drift, proposals+sim+llm+semantic_cache, dashboard views, activity views. Migration `WITH NO DATA` clause on materialized views so initial `alembic upgrade head` does not block on empty event store. `refresh_dashboard_views()` + `refresh_activity_views()` ship for on-demand population.

## D-Demeter-04 (2026-05-12 22:13 WIB)

asyncpg timestamptz codec rejects str at bind; switched all timestamp bindings to `_parse_dt()` helper that coerces ISO 8601 string to `datetime.datetime` UTC-aware. Pydantic schemas remain str-typed per Pythia contracts; conversion happens at service layer.

## D-Demeter-05 (2026-05-12 22:14 WIB)

Cost tracking: SOFT_WARN_THRESHOLD_USD=4.50 + HARD_HALT_THRESHOLD_USD=4.90 per PRD Section 18.8 (Hafiz $5 budget). Drain Triton in-memory `LLMCallLogBuffer` to Postgres `llm_call_log` via `CostTrackingService.drain_buffer_to_postgres()`; ON CONFLICT (call_id) DO NOTHING for idempotency.

## D-Demeter-06 (2026-05-12 22:15 WIB)

1-click GitHub issue Hybrid Layer 1 ships at `POST /api/findings/{finding_id}/to-issue`. Evidence body pre-fills CVSS + file path + line range + suggested fix. Decrypt access token via existing `app/services/crypto.py` Fernet helper. Update finding row `status='ticketed'` + `linked_issue_number` on success. Dev session stub accepted (production hardening Hades cycle 2).

## D-Demeter-07 (2026-05-12 22:16 WIB)

OpenSpec runtime wraps `openspec list --specs --json` + `validate` + `show --diff` + `archive` via `asyncio.create_subprocess_exec`. Folder A primary; Folder B internal not invoked. Timeout 30s default.

## D-Demeter-08 (2026-05-12 22:17 WIB)

`DEMETER_DISABLE_REAL=1` env gate at lifespan startup. Conftest sets default so existing Hades stub tests (`test_webhook_persists_via_demeter_stub`) remain green. Live Demeter persist tests opt in via explicit `DATABASE_URL` non-localhost.

## D-Demeter-09 (2026-05-12 22:18 WIB)

Dashboard + activity Pydantic models intentionally use snake_case Python field names. Selene TypeScript consumer expects camelCase JSON; alias generator deferred (selene-to-demeter.md Asumption 1 documents the gap). Wave 1 Selene swaps mock for real endpoint cycle 2 will surface mismatch + add Pydantic `alias_generator` if needed.
