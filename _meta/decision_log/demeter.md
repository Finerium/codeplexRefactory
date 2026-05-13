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

## D-Demeter-10 (2026-05-13 03:18 WIB Day 2 - Wave-Fixing #2)

Activity endpoint `days` parameter migrated from `Literal[30, 60, 90]` to `int` with `Query(ge=30, le=90)` + server-side snap-to-nearest-valid-window logic. Pydantic strict literal parser raises `literal_error` on str input from query string (production verified: `/api/activity?days=30` returned 422 pre-fix). Service layer `ActivityQueryService.fetch_activity` also accepts plain `int` to match. Trade-off: silent snap on non-30/60/90 values (e.g., days=45 -> 30) chosen over 400-reject for Boreas TimelineScrubber UX compatibility.

## D-Demeter-11 (2026-05-13 03:20 WIB Day 2 - Wave-Fixing #2)

`/api/cost/summary` defaults to `auto_drain=true` to close gap identified post-Triton-smoke: `/api/llm/health.total_cost_usd` showed real DeepSeek spend in in-memory buffer but `/api/cost/summary.total_usd` returned $0.0 (Postgres `llm_call_log` empty). New default drains Triton buffer to Postgres before aggregate, opt-out via `?auto_drain=false`. Idempotent via ON CONFLICT (call_id) DO NOTHING. Response includes `auto_drained_rows` field so caller can detect drain spikes.

## D-Demeter-12 (2026-05-13 03:21 WIB Day 2 - Wave-Fixing #2)

`/api/dashboard?aggregate=cross-repo` flag added (default `per-repo`). When `cross-repo` set, `repo` filter forced to `all` + briefing prefixed with cross-repo aggregate marker. Selene multi-repo dashboard scope (Wave-Fixing #2 D-1/D-2) consumes this. No new DashboardData field added to avoid Pythia contract amendment; marker via briefing string sufficient signal. Future enhancement (post-submission): add `aggregate_mode: Literal["per-repo", "cross-repo"]` dedicated field.

## D-Demeter-13 (2026-05-13 03:22 WIB Day 2 - Wave-Fixing #2)

DemoSeedService (`app/services/demo_seed.py`) authored as idempotent seed driver for NodeGoat + fastapi-fullstack visual demo readiness. Deterministic via Random(20260513) seed -> same delivery_id + scan_run_id on rerun, ON CONFLICT DO NOTHING guards duplicates. Each row tagged `seed-demo-` prefix in delivery_id + scan_run_id + `payload.seed_demo=true` field per Lock 3 honest scope. Endpoint POST /api/demo/seed exposes driver. Refreshes 7 matviews automatically. Smoke-verified: 962 pr_events + 10 findings + 10 drifts = 5 dashboard matviews populated 8+10+3+230+16 rows respectively. Trade-off: 2 demo repos hard-coded (not env-configurable), sufficient for cross-repo aggregate visual proof at hackathon scale.

## D-Demeter-14 (2026-05-13 03:22 WIB Day 2 - Wave-Fixing #2)

OpenSpec runtime HTTP surface: `/api/openspec/list` + `/api/openspec/validate?change_id=X` GET endpoints added. Wraps existing `app/services/openspec_runtime.py` OpenSpecRuntime subprocess class (Wave 3 ship, no changes). Enables Pan demo curl + Aletheia smoke verification of openspec CLI integration without requiring SSH into pod. No auth gate (intentional: openspec output is intentionally public, aligns hackathon Open Source posture).


## D-Demeter-15 (2026-05-13 ~06:30 WIB Day 2 - Wave-Fixing #3 Manager FINAL paired with Boreas)

**Context**: Manager Wave-Fixing #3 cycle paired Boreas (Activity Mode UX rewrite) + Demeter (backend verify). Boreas extended `TimelineMarker` with commitHash + commitMessage + filePath fields for the per-cursor commit popup card.

**Decision**: Backend `/api/activity` endpoint remains stable + verified operational (Wave-Fixing #2 D-Demeter-09 already shipped). `ActivityQueryService` Pydantic models do NOT include the new TimelineMarker fields yet because:

1. Materialized views `commit_frequency_per_building` + `ownership_distribution` cover hotspots + ownership; pr_events table has author_login + delivery_id + event_type fields suitable for marker synthesis but no commit message body (GitHub webhook PR payload carries `pull_request.title` not file-level commit message).
2. Boreas Wave 2 already extends ActivityData client-side with `timelineMarkers` array (Pythia contract notes: "Wave 2 + Wave 3 extension over Pythia contract"). Mock + real coexist via `useActivityData` adapter which inherits markers from mock when server returns empty.
3. The per-cursor popup card consumes Boreas-side mock data in Wave 3 demo posture; Demeter swap requires either (a) joining pr_events with parsed git commit metadata table (out-of-scope for hackathon) or (b) using `pull_request.title` as the message body (lightweight, fits webhook payload shape).

**Verification path**: live curl `/api/activity?days=30&repo=all` returns 200 with `timeline + hotspots + ownership + summary` matching Pydantic schema (verified Wave-Fixing #2 cycle 1). Frontend `useActivityData` adapter handles empty server response by falling back to mock + preserves markers from mock for visual continuity.

**No changes to backend services this cycle**. Frontend-only Boreas work. Documenting here so Demeter Wave 4 (if any) knows where to extend pr_events surface if the per-cursor popup card is wanted on real data.

**Confidence**: HIGH. Backend endpoint operational + Pydantic schema compatible. Boreas client-side extension preserves wave-3 swap path.
