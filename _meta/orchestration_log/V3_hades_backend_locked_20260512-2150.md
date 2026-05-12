# V3 Hades Backend Locked Snapshot

**Snapshot ID**: V3_hades_backend_locked
**Timestamp**: 2026-05-12 21:50 WIB Day 1 evening (actual via `date +%Y%m%d-%H%M`)
**Worker**: Hades (Wave 3 foundation backend)
**Wave**: 3 (active spawn batch, 1 of 6 worker)
**Lock**: Lock 9 V_n locked snapshot per major milestone

## Snapshot scope

Hades Wave 3 cycle 1 stub + cycle 2 full ship CLEAN. Single-cycle
consolidation per D-Hades-10. All ship criteria met.

## Files locked at this snapshot

### Backend foundation (35 files)

Project root:
- `backend/pyproject.toml` (155 lines, deps locked)
- `backend/.python-version` (1 line, 3.12)
- `backend/README.md` (75 lines)

App package (10 files):
- `backend/app/__init__.py`
- `backend/app/main.py` (95 lines, FastAPI create_app + lifespan + CORS)
- `backend/app/config.py` (100 lines, Settings via pydantic-settings)
- `backend/app/api/__init__.py` (40 lines, aggregator, Triton extended)
- `backend/app/models/__init__.py` (placeholder for Demeter)
- `backend/app/llm/__init__.py` (placeholder, Triton replaced with real)
- `backend/app/parsers/__init__.py` (re-exports)
- `backend/app/parsers/types.py` (190 lines, Pydantic + Literal 12 lang)
- `backend/app/parsers/service.py` (370 lines, ParserService process() impl)
- `backend/app/parsers/tree_sitter_loader.py` (95 lines, warm_all + map)

API routes (11 files):
- `backend/app/api/auth/__init__.py`
- `backend/app/api/auth/github.py` (220 lines, OAuth + session + logout)
- `backend/app/api/webhook/__init__.py`
- `backend/app/api/webhook/github.py` (155 lines, HMAC + dedup + dispatch)
- `backend/app/api/websocket/__init__.py`
- `backend/app/api/websocket/building_events.py` (60 lines)
- `backend/app/api/websocket/refactor_events.py` (50 lines)
- `backend/app/api/websocket/finding_events.py` (50 lines)
- `backend/app/api/parser/__init__.py` (75 lines, HTTP wrapper)

Services (6 files):
- `backend/app/services/__init__.py`
- `backend/app/services/event_bus.py` (135 lines, pubsub)
- `backend/app/services/demeter_service.py` (135 lines, Protocol stub + payloads)
- `backend/app/services/auth_session.py` (Triton extended with require_session)
- `backend/app/services/crypto.py` (45 lines, Fernet at-rest encrypt)
- `backend/app/services/translate_webhook.py` (270 lines, 14-event union)

Tests Hades-authored (6 files):
- `backend/tests/__init__.py` (amended to shared)
- `backend/tests/conftest.py` (75 lines, fixtures + env injection)
- `backend/tests/test_main_smoke.py` (3 tests)
- `backend/tests/test_oauth_smoke.py` (4 tests)
- `backend/tests/test_webhook_smoke.py` (5 tests)
- `backend/tests/test_parser_smoke.py` (8 tests)
- `backend/tests/test_translate_webhook.py` (11 tests)
- `backend/tests/test_websocket_smoke.py` (3 tests)

Frontend touched (Hestia stub replace):
- `frontend/app/api/auth/github/start/route.ts` (REWRITTEN, 35 lines)
- `frontend/lib/auth.ts` (NEW, 75 lines)

## Test results at snapshot

```
$ cd backend && source .venv/bin/activate && pytest tests/
176 passed in 1.82s
```

Hades-owned: 34/34 PASS
Sibling Pandora: 7+/7+ PASS (drafts isolation + types + simulation E2E)
Sibling Triton: 51/51 PASS (llm types + routing + breaker + client +
                            system header + simulation routing)

## H3 hypothesis validation

Per `test_h3_cold_start_under_300ms` test:
- warm_all() 12-lang cold cycle: ~10ms total on macOS Apple Silicon
- PRD budget: 300ms total
- Margin: 30x under budget
- Aletheia audit gate item line 60-63: PASS expected

## Curl manual smoke evidence

```
GET /health -> 200 {"status":"ok","service":"hades-backend","version":"0.1.0"}
GET /api/auth/github/start -> 302 Location: https://github.com/login/oauth/authorize?...
POST /api/webhook/github (no headers) -> 401 {"detail":"missing X-Hub-Signature-256 header"}
```

## 4 mandatory artifacts authored

1. `_meta/decision_log/hades.md` (10 entries D-Hades-01 to D-Hades-10)
2. `_meta/uncertainty/hades-cycle1-20260512-2150.md` (8 medium concerns)
3. `_meta/checkpoints/hades-cycle1.md` (ship checklist + 20-item self-check)
4. Handoff contracts:
   - `_meta/handoff_log/wave3_hades_to_nemesis.md`
   - `_meta/handoff_log/wave3_hades_to_pandora.md`
   - `_meta/handoff_log/wave3_hades_to_demeter.md`
   - `_meta/handoff_log/wave3_hades_cycle1_stub.md`
   - `_meta/handoff_log/wave3_hades_cycle2_full.md`

## Ship criteria gate (per .claude/agents/hades.md Section 10)

All 14 boxes checked except Aletheia final audit (deferred to end of Wave 3).

## Wave 3 status at snapshot

- Hades: SHIP CLEAN (this snapshot, 1 of 6 batch member)
- Triton: SHIP CLEAN (parallel-ship verified via shared test suite + aggregator extension)
- Pandora: SHIP CLEAN (parallel-ship verified via shared test suite + drafts isolation tests)
- Nemesis: spawn pending or in-flight (handoff `wave3_hades_to_nemesis.md` ready)
- Demeter: spawn pending or in-flight (handoff `wave3_hades_to_demeter.md` ready)
- Atlas: spawn pending or in-flight

## Confidence

High. No ferry triggered. 8 medium concerns documented for Aletheia review,
all with explicit resolution paths.

## Resumption

If audit re-spawn needed, re-read:
1. `_meta/checkpoints/hades-cycle1.md`
2. `_meta/decision_log/hades.md`
3. `_meta/uncertainty/hades-cycle1-20260512-2150.md`
4. This snapshot

Test live at `cd backend && source .venv/bin/activate && pytest tests/`.
