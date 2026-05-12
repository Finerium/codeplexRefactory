# Codeplex Chronicle Backend (Hades Wave 3)

FastAPI async backend foundation: tree-sitter 11-language parser + GitHub OAuth real flow + webhook receiver HMAC + WebSocket 3 channel pubsub.

## Stack

- Python 3.12+ (Wave 0 lock per PRD Section 17)
- FastAPI 0.115+
- tree-sitter-language-pack 0.7+ (305+ grammars, MIT permissive, Phase B Topic 3c anchor)
- httpx + websockets + Pydantic v2 + SQLAlchemy async + asyncpg

## Layout

```
backend/
  app/
    main.py              FastAPI app + lifespan + CORS + router aggregation
    config.py            Settings via pydantic-settings (.env reader)
    api/
      auth/github.py     OAuth real start + callback (state CSRF + PKCE S256 + minimal scope)
      webhook/github.py  Webhook receiver HMAC X-Hub-Signature-256 + 14-event dispatch
      websocket/         3 channel: building-events, refactor-events, finding-events
      parser/            POST /api/parser/parse-repo + parse-file endpoints
    parsers/             Tree-sitter service + types + lazy-load 11-language
    services/            event_bus, demeter_service (Protocol stub), translate_webhook, auth_session
    models/              SQLAlchemy schemas (Demeter Wave 3 owns)
    llm/                 Triton Wave 3 owns (DeepSeek client)
  tests/                 pytest smoke
  pyproject.toml         Dep pin
```

## Stub-and-sync pattern

Cycle 1 (this commit): API signatures locked + stub responses callable. Downstream Nemesis (consume parser), Pandora (consume parser + drafts verify), Demeter (consume OAuth/webhook persist payload) can wire their cycle 1 stubs against Hades's locked Pydantic schemas immediately.

Cycle 2 (next commit): Real tree-sitter lazy-load + real OAuth callback token exchange + real webhook event dispatch + real WebSocket pubsub fanout. Backwards-compatible swap, no schema change.

## Dev setup

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
```

## Smoke

```bash
pytest backend/tests/
```

## H3 hypothesis

Cold start parse 11 languages < 300ms total via lazy-load. Aletheia Wave 3 audit gate verifies.

## Anti-pattern compliance

10 locks per `.claude/skills/anti-pattern-locks/SKILL.md`. Special focus:
- Lock 3 OAuth scope LOCKED minimal `read:repo + read:org + read:issues + read:pull_requests + write:issues`
- Lock 4 tree-sitter H3 < 300ms cold start
- Lock 5 honest claim discipline (cycle 1 stubs labeled, cycle 2 real)
- Lock 8 paid services restricted (tree-sitter-language-pack MIT permissive used)

## Reference

- `_meta/contracts/hades-to-{nemesis,pandora,demeter}.md`
- `_meta/contracts/hera-to-hades.md` (14-event union)
- `_meta/contracts/hestia-to-hades.md` (OAuth stub replace)
- `.claude/agents/hades.md`
