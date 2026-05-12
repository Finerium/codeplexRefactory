# Handoff Log: Hades Wave 3 Cycle 1 Stub Lock

**Date**: 2026-05-12 21:50 WIB Day 1 evening
**Worker**: Hades (Wave 3 foundation backend)
**Purpose**: Cycle 1 API surface lock for parallel-spawn batch sibling consume
**Status**: SHIP CLEAN. API signatures + Pydantic schemas locked. Cycle 2
full impl ALSO shipped in same batch (collapse into single cycle per
D-Hades-10).

## Stub-and-sync pattern summary

Per Manager Wave 3 spawn directive, Hades cycle 1 was to ship API endpoint
signatures + stub responses so Nemesis + Pandora + Demeter could consume
interfaces immediately. Hades cycle 2 was to ship full impl.

**Actual outcome**: Cycle 1 and cycle 2 ship in single batch because:
1. tree-sitter pivot resolved in cycle 1 (no half-stub risk)
2. OAuth + webhook + WebSocket impl is small enough to ship real in one pass
3. Downstream Nemesis + Pandora + Demeter all spawned in parallel and reached
   first ship clean concurrently with Hades, so the stub-and-sync handshake
   was effectively a no-op (everyone shipped real together)

Decision D-Hades-10 in `_meta/decision_log/hades.md` documents this collapse.

## API surface locked (all real, no half-stubs)

### Auth (Hades-owned)
- `GET /api/auth/github/start` real 302 to github.com authorize
- `GET /api/auth/github/callback` real token exchange + Demeter upsert + JWT
  sign + session cookie + 302 to /city
- `GET /api/auth/github/session` real JWT verify + 200/401
- `POST /api/auth/github/logout` real cookie clear + 302 /start

### Webhook (Hades-owned)
- `POST /api/webhook/github` real HMAC verify + LRU dedup + 14-event translate
  + event_bus publish + Demeter stub persist
- 401 reject on missing/invalid HMAC (Aletheia critical gate)

### WebSocket (Hades-owned)
- `WS /api/ws/building-events` real subscribe to event_bus + JSON send
- `WS /api/ws/refactor-events` (Pandora produces, Asclepius consumes)
- `WS /api/ws/finding-events` (Nemesis produces, Asclepius consumes)

### Parser (Hades-owned, in-process import preferred)
- `from app.parsers import get_parser_service` returns real ParserService
  singleton
- `await parser.parse_file(path)` real tree-sitter via process()
- `await parser.parse_repo(root, exclude_globs=...)` real concurrent parse
- `await parser.find_callsites(root, symbol, language=None)` regex fallback
- `await parser.query_tree(...)` raises NotImplementedError (Lock 3 + 5
  honest disclosure)

### Parser HTTP wrapper (Hades-owned, fallback for cross-process)
- `POST /api/parser/parse-repo` `POST /api/parser/parse-file`
  `POST /api/parser/query-tree`

### Services stubs (Demeter cycle 2 swaps real)
- `get_demeter_service()` returns `_StubDemeterService` cycle 1
- Demeter cycle 2 calls `set_demeter_service(real)` to install
- Hades imports never change

### Services real (Hades-owned)
- `get_event_bus()` real in-memory pubsub
- `verify_session_jwt(token)` real JWT verify
- `sign_session_jwt(github_id, login, scopes)` real JWT sign
- `encrypt_token(plaintext)` `decrypt_token(cipher)` real Fernet
- `translate_webhook_to_building_events(event, payload)` real 14-event union

## Files locked

35 files at `backend/app/**` + `backend/tests/*` + `backend/pyproject.toml`
+ `backend/.python-version` + `backend/README.md`. See checkpoint
`_meta/checkpoints/hades-cycle1.md` for full list.

## Schemas locked (verbatim Pythia contract match)

### ParsedSymbol, ParsedFile, ParsedRepo, Language Literal
Per `_meta/contracts/hades-to-nemesis.md` lines 22-74 + `hades-to-pandora.md`
lines 22-87. All Pydantic v2 BaseModel with frozen=True for hash-stability.

### GitHubUserUpsert, PREventPersist, DemeterServiceProtocol
Per `_meta/contracts/hades-to-demeter.md` lines 22-99. PREventPersist
`event_type` Literal extended to 14 members per Hera Wave 2 handoff lines
17-46.

### BuildingEvent (14-type union)
Hades does NOT define a Pydantic class for BuildingEvent itself (Hera owns
the canonical TypeScript type at `frontend/src/modes/sprint/types.ts` lines
110-194; Hades emits dicts that conform). Each event dict has shape:

```python
{
    "type": <one of 14 string literals>,
    "buildingId": str,
    "resourceNumber": int,
    "timestamp": str (ISO 8601 UTC),
    "payload": dict (event-specific shape)
}
```

## Sync events (Manager Wave 3 consume)

- 2026-05-12 21:32 WIB: Hades spawn (batch 1 of 6)
- 2026-05-12 21:50 WIB: Hades cycle 1 stub + cycle 2 full ship CLEAN
  (consolidated, ~18 min wall-clock)
- Manager Wave 3 progress: 1/6 Hades complete

## What downstream workers can do now

- **Nemesis**: import `get_parser_service`, run parse_repo on test data, use
  ParsedFile.symbols + imports for 5 Apollo detector regex-augmented patterns
- **Pandora**: already shipped (parallel ship); cycle 2 may refine
  proposal_author to call `parser.find_callsites` for impact analysis
- **Demeter**: extend `DemeterServiceProtocol` with `persist_finding`,
  `persist_proposal`, `persist_simulation_event`, `persist_llm_call`;
  install real impl via `set_demeter_service()` in either Hades's lifespan
  hook OR Demeter module side-effect import
- **Atlas**: backend deploy ready, target `python:3.12-slim` Docker image
  (Hades local dev uses 3.14; verify production parity per U-Hades-3)
- **Triton**: already shipped (parallel ship); chat + onboarding + security
  + simulation + llm_health routes mounted via aggregator extension

## Ferry to V1 Orch

NOT triggered. All medium concerns logged in
`_meta/uncertainty/hades-cycle1-20260512-2150.md` for Aletheia review.

## Closing

Cycle 1 stub + cycle 2 full both ship clean. Downstream workers unblock
immediately. Aletheia Wave 3 audit gate verifies acceptance criteria end
of Wave 3 after all 6 sibling workers ship.
