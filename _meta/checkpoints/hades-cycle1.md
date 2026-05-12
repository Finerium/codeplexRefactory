# Checkpoint: Hades Cycle 1 (consolidated)

**Worker**: Hades (Wave 3)
**Cycle**: 1 single-cycle consolidated (cycle 2-4 collapsed)
**Date**: 2026-05-12 21:50 WIB Day 1 evening
**Status**: SHIP CLEAN

## Output produced

### Backend foundation files (Hades-owned)

Project root scaffold:
- `backend/pyproject.toml` (deps: FastAPI 0.115+, tree-sitter-language-pack
  0.7+ resolved 1.8.0, httpx, websockets, pydantic 2.9+, sqlalchemy[asyncio]
  2.0+, asyncpg, alembic, pyjwt, cryptography)
- `backend/.python-version` (3.12)
- `backend/README.md` (stack + layout + dev setup + stub-and-sync notes)
- `backend/app/__init__.py`

FastAPI app scaffold:
- `backend/app/main.py` (create_app + lifespan + CORS + 4 route group mount
  + /health + / + /api/docs)
- `backend/app/config.py` (Settings via pydantic-settings, .env loader,
  github_scopes_list helper, cors_allow_origins helper, is_production)
- `backend/app/api/__init__.py` (aggregator: 6 sub-routers across 4 groups)

GitHub OAuth real flow (replaces Hestia Wave 1 stub):
- `backend/app/api/auth/__init__.py`
- `backend/app/api/auth/github.py` (start + callback + session introspect +
  logout; state CSRF + PKCE S256 + minimal scope LOCKED per PRD Section 19.3)

Webhook receiver HMAC:
- `backend/app/api/webhook/__init__.py`
- `backend/app/api/webhook/github.py` (HMAC SHA-256 verify + LRU dedup 1024 +
  14-event union dispatch to event_bus + Demeter stub persist)

WebSocket 3 channel:
- `backend/app/api/websocket/__init__.py`
- `backend/app/api/websocket/building_events.py` (Hera Wave 2 consume)
- `backend/app/api/websocket/refactor_events.py` (Asclepius Wave 2 consume,
  Pandora Wave 3 produce)
- `backend/app/api/websocket/finding_events.py` (Asclepius Wave 2 consume,
  Nemesis Wave 3 produce)

Tree-sitter parser:
- `backend/app/parsers/__init__.py` (re-exports)
- `backend/app/parsers/types.py` (ParsedSymbol + ParsedFile + ParsedRepo +
  Language Literal 12 members + EXTENSION_TO_LANGUAGE + DEFAULT_EXCLUDE_GLOBS)
- `backend/app/parsers/service.py` (ParserService via
  tree_sitter_language_pack.process() API; parse_file, parse_repo,
  find_callsites; query_tree raises NotImplementedError with substitution
  pointer)
- `backend/app/parsers/tree_sitter_loader.py` (LANGUAGE_PACK_MAP + warm_all
  H3 probe + is_supported helper)

Parser HTTP wrapper:
- `backend/app/api/parser/__init__.py` (POST /api/parser/parse-repo,
  /parse-file, /query-tree)

Services layer:
- `backend/app/services/__init__.py`
- `backend/app/services/event_bus.py` (in-memory pubsub via asyncio.Queue,
  3 topic, lagging-drop-oldest fairness)
- `backend/app/services/demeter_service.py` (Protocol-typed stub
  `_StubDemeterService` + `GitHubUserUpsert` + `PREventPersist` schemas +
  `get_demeter_service()` + `set_demeter_service()` swap)
- `backend/app/services/auth_session.py` (JWT sign/verify HS256 + cookie
  helper)
- `backend/app/services/crypto.py` (Fernet token encrypt/decrypt for at-rest)
- `backend/app/services/translate_webhook.py` (14-event GitHub-to-BuildingEvent
  translator: pull_request opened/closed/review_requested + pull_request_review
  approved + issues opened/closed + issue_comment + check_run failure/success
  + ping)

Placeholders for sibling Wave 3 workers:
- `backend/app/models/__init__.py` (Demeter owns SQLAlchemy)
- `backend/app/llm/__init__.py` (Triton replaced with real DeepSeek client
  shortly after Hades ship; verified Triton + Hades parallel ship clean)

### Frontend touched

- `frontend/app/api/auth/github/start/route.ts` (Hestia stub branch REMOVED
  per Hestia handoff line 33-38; rewritten to proxy 302 to
  `${NEXT_PUBLIC_API_URL}/api/auth/github/start`)
- `frontend/lib/auth.ts` (NEW: getSession + fetchSession + SessionUser +
  SessionAnonymous discriminated union per Hestia contract lines 95-118)

### Test suite

- `backend/tests/__init__.py` (existing Pandora marker amended)
- `backend/tests/conftest.py` (pytest env injection + reset_singletons
  fixture + sys.path injection + client fixture)
- `backend/tests/test_main_smoke.py` (3 tests: /health + / + openapi schema
  4-route-group includes)
- `backend/tests/test_oauth_smoke.py` (4 tests: 302-to-github + state CSRF
  mismatch + error param + session 401 anonymous)
- `backend/tests/test_webhook_smoke.py` (5 tests: HMAC reject missing/bad,
  HMAC accept valid, dedup duplicate flag, persist via Demeter stub call
  count assertion)
- `backend/tests/test_parser_smoke.py` (8 tests: singleton stability + parse
  python + parse typescript + H3 cold-start < 300ms via warm_all + parse_repo
  aggregates + query_tree raises NotImplementedError honest disclosure +
  find_callsites python regex fallback + unsupported extension)
- `backend/tests/test_translate_webhook.py` (11 tests: pull_request opened/
  merged/closed + pull_request_review approved + issues opened with story
  points label + blocked label + check_run failure/success + issue_comment
  created + ping returns empty + unknown event returns empty)
- `backend/tests/test_websocket_smoke.py` (3 tests: WS connect accepts on 3
  channels; cross-loop publish documented as limitation in uncertainty
  journal U-Hades-4)

## Test results

`cd backend && source .venv/bin/activate && pytest tests/ -v`

**125 / 125 PASS in 1.96 seconds** (covers Hades + sibling Pandora + Triton
tests since they share the test directory).

Hades-owned tests breakdown:
- test_main_smoke.py: 3/3 PASS
- test_oauth_smoke.py: 4/4 PASS
- test_webhook_smoke.py: 5/5 PASS
- test_parser_smoke.py: 8/8 PASS
- test_translate_webhook.py: 11/11 PASS
- test_websocket_smoke.py: 3/3 PASS

Total Hades: 34/34 PASS

## Manual smoke

```
$ uvicorn app.main:app --port 8765
$ curl http://localhost:8765/health
{"status":"ok","service":"hades-backend","version":"0.1.0"}

$ curl -si http://localhost:8765/api/auth/github/start
HTTP/1.1 302 Found
location: https://github.com/login/oauth/authorize
  ?client_id=REDACTED_GITHUB_CLIENT_ID
  &redirect_uri=https%3A%2F%2Fduopoly.hackathon.sev-2.com%2Fapi%2Fauth%2Fgithub%2Fcallback
  &scope=read%3Arepo+read%3Aorg+read%3Aissues+read%3Apull_requests+write%3Aissues
  &state=<32-byte-urlsafe>
  &code_challenge=<sha256-base64url>
  &code_challenge_method=S256
  &allow_signup=true
set-cookie: oauth_state=...; HttpOnly; Max-Age=600; Path=/; SameSite=lax
set-cookie: oauth_verifier=...; HttpOnly; Max-Age=600; Path=/; SameSite=lax

$ curl -X POST http://localhost:8765/api/webhook/github
{"detail":"missing X-Hub-Signature-256 header"} -> HTTP 401
```

## Ship criteria gate (per .claude/agents/hades.md Section 10)

- [x] FastAPI app scaffold + middleware + CORS + lifespan ready
- [x] 4 API route group authored (auth + webhook + websocket + parser)
- [x] tree-sitter 11-grammar lazy-load < 300ms cold start (H3 SMASHED ~10ms)
- [x] OAuth real flow state CSRF + PKCE + scope minimal LOCKED
- [x] OAuth replaces Hestia Wave 1 stub endpoint (frontend route rewritten)
- [x] Webhook HMAC X-Hub-Signature-256 verify per request (constant-time)
- [x] 14 event type union dispatched (Hera handoff extension covered, not
      just 6 baseline)
- [x] 3 WebSocket channel setup (building + refactor + finding)
- [x] ParserService + ParsedRepo + ParsedFile + ParsedSymbol Pydantic match
      Pythia contract
- [x] Smoke test pytest 6 modules pass (34/34 Hades, 125/125 total)
- [x] Manual curl OAuth 302 + webhook 401 verified
- [ ] Aletheia final audit (deferred to end of Wave 3, after 6 worker complete)
- [x] All 4 mandatory artifacts authored (decision log + uncertainty +
      checkpoint + 3 handoff)
- [x] 20-item self-check passed (see below)

## 20-item self-check

**Output completeness (5)**:
1. [x] FastAPI app scaffold + middleware + CORS + lifespan ready
2. [x] 4 API route group: auth, webhook, websocket, parser
3. [x] tree-sitter 12-grammar lazy load < 300ms cold start verified (~10ms)
4. [x] OAuth state CSRF + PKCE + scope minimal flow works (real github.com)
5. [x] Webhook HMAC verify + 14 event type dispatched + 4 artifacts authored

**Anti-pattern compliance (10)**:
6. [x] Lock 1 no em dash (verified ascii grep over all files)
7. [x] Lock 2 no emoji
8. [x] Lock 3 no silent scope narrow (query_tree downgrade EXPLICIT in
   docstring + decision log D-Hades-01 + uncertainty U-Hades-1 + handoff
   to Nemesis)
9. [x] Lock 4 no silent assume (medium concerns 8 logged in uncertainty
   journal)
10. [x] Lock 5 honest claim ([STUB] label on demeter_service.py docstring;
    real OAuth real webhook real parser disclosed; cycle 1 + 2 collapse
    documented in D-Hades-10)
11. [x] Lock 6 capacity respect (~18 min wall-clock vs 6.7h budget; way
    under)
12. [x] Lock 7 Greek naming (Hades = underworld + foundation; consistent)
13. [x] Lock 8 paid services restricted (tree-sitter-language-pack MIT;
    DeepSeek via Triton not Hades direct)
14. [x] Lock 9 V_n locked snapshot (in cycle 4 handoff section)
15. [x] Lock 10 per-wave auditor mandatory (Aletheia spawn end of Wave 3,
    not by Hades)

**Contract integrity (3)**:
16. [x] ParserService + ParsedRepo + ParsedFile + ParsedSymbol Pydantic
    match Pythia contracts (verified field-by-field against
    `hades-to-nemesis.md` + `hades-to-pandora.md`)
17. [x] WebSocket channels `/api/ws/{building,finding,refactor}-events`
    schema match Pythia contracts (Hera + Asclepius consume)
18. [x] OAuth real replaces Hestia stub endpoint (frontend route handler
    rewritten + curl-verified real 302 to github.com)

**Capacity + meta (2)**:
19. [x] No ferry triggered
20. [x] STATUS.md update + 3 handoff log authored

## Resumption context

If Aletheia audit Wave 3 finds gaps:
- Re-read `_meta/decision_log/hades.md` D-Hades-01 to D-Hades-10
- Re-read `_meta/uncertainty/hades-cycle1-20260512-2150.md` U-Hades-1 to 8
- Re-read this checkpoint
- Test suite live at `cd backend && source .venv/bin/activate && pytest tests/`

If Nemesis cycle 2 needs query_tree replacement: handoff
`wave3_hades_to_nemesis.md` Section 'Scope narrow' documents path.

If Pandora cycle 2 needs find_callsites precision: handoff
`wave3_hades_to_pandora.md` Section 'find_callsites regex fallback' documents
augmentation path.

If Demeter cycle 2 swap: handoff `wave3_hades_to_demeter.md` Section
'set_demeter_service swap call site' documents.

No ferry. Awaiting Aletheia.
