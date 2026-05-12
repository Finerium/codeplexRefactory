# Decision Log: Hades (Wave 3)

**Worker**: Hades, foundation backend
**Spawn**: 2026-05-12 21:32 WIB Day 1 evening (Manager Wave 3 batch 1 of 6)
**Ship**: 2026-05-12 21:50 WIB Day 1 evening (~18 min wall-clock)
**Cycles consolidated**: 1 + 2 + 3 + 4 collapsed into single cycle thanks to
parallel-spawn discipline + pre-flight contract clarity.

## D-Hades-01: tree-sitter-language-pack v1.8 process() API (not v0.7 manual binding)

**Decision**: Use `tree_sitter_language_pack.process(source, ProcessConfig)`
returning `ProcessResult` (high-level: symbols + imports + exports + metrics +
structure + diagnostics) instead of low-level `get_parser()` + `parse()` +
`query()` chain.

**Trigger**: pyproject originally pinned `tree-sitter-language-pack>=0.7.0`
but pip resolved v1.8.0. The v0.7 era exposed `get_parser` returning a
`tree_sitter.Parser` compatible Python object; v1.8 returns a Rust-native
`builtins.Parser` with no `.parse()` method exposed at Python level. Native
bindings also raise `_native::Parser is unsendable, but is being dropped on
another thread` when crossing thread boundaries (incompatible with
`asyncio.run_in_executor`).

**Alternatives considered**:
1. Pin to `tree-sitter-language-pack==0.7.0` (old API): rejected because pip
   resolved unavailable; PyPI now ships v1.8 only. Downgrade would block
   install.
2. Use raw `tree-sitter` + per-language `tree_sitter_python`,
   `tree_sitter_javascript`, ... 11 separate grammar packages: rejected
   because (a) PRD D17 Phase B Topic 3c LOCKS `tree-sitter-language-pack`
   as the single dep, (b) 11 separate grammar installs explode the
   pyproject + binary download surface area.
3. Use v1.8 `process()` API: ACCEPTED. Trade-off: lose `query_tree()`
   tree-sitter query DSL execution (raw Tree not exposed). Find_callsites
   downgraded to regex word-boundary fallback. Symbols + imports + exports
   + structure all present in ProcessResult, sufficient for 5 Apollo
   detectors per Nemesis Wave 3 consumption.

**Impact on contracts**:
- `_meta/contracts/hades-to-nemesis.md` Section 'Output schema' line 101-112
  `query_tree(file_path, query_source)` method: implemented as
  `NotImplementedError` raise with explicit message. Nemesis handoff documents
  the substitution path (regex over source OR process() output inspection).
- `_meta/contracts/hades-to-pandora.md` Section 'Schema specifics' `query_tree`
  reference: same handoff substitution. Pandora's `analyze_intent` uses
  `find_callsites` regex fallback.
- `find_callsites` returns ParsedSymbol list with `kind='method'` (call use,
  distinct from declaration sites). Regex pattern: `\bSYMBOL\s*\(`. Best-effort
  approximation; full AST callsite analysis deferred.

**Confidence**: medium (working impl, but query_tree downgrade is a Lock 3
silent-scope-narrow risk if not honestly documented). Logged in uncertainty
journal. Pre-emptively documented in cycle 4 handoff to Nemesis + Pandora.

## D-Hades-02: H3 cold-start hypothesis SMASHED (10ms total 11-lang, not 300ms budget)

**Decision**: Validate H3 cold-start at the conservative 300ms budget via
`warm_all()` probe with 4x slack margin (1.2s hard ceiling). Actual measured:
~10ms total for 11 languages on macOS Apple Silicon M-series.

**Why much faster than budget**: pack v1.8 ships Rust-native pre-compiled
grammars bundled into the wheel. The `process()` API does not need to
download/compile per language; first call per language is ~0.4-1ms (one-time
JIT-like initialization), subsequent calls < 0.1ms. The PRD 300ms budget was
sized for the older py-tree-sitter manual binding ecosystem.

**Confidence**: high. Aletheia audit gate verifies.

## D-Hades-03: WebSocket auth via query param token, anonymous allowed dev mode

**Decision**: `/api/ws/building-events`, `/refactor-events`, `/finding-events`
all accept anonymous connections when `APP_ENV != production`. JWT validation
via `?token=<jwt>` query param required only in production.

**Rationale**: Hera Wave 2 mock harness `useBuildingEvents.ts` does not yet
have JWT plumbing wired; Wave 3 swap reuses identical hook surface. Hard
gating in dev would block Hera frontend smoke run before full OAuth flow
configured. Aletheia audit gate verifies production gating is strict.

**Reference**: Pythia contract `hera-to-hades.md` Asumption 2 (token query
param OK because cookies unreliable on WS upgrade).

**Confidence**: high.

## D-Hades-04: In-memory event_bus (no Redis) per K8s single replica

**Decision**: `app/services/event_bus.py` ships an asyncio.Queue-backed
in-memory pubsub. Topics: `building_events`, `refactor_events`,
`finding_events`. Lagging subscribers drop oldest event (fresh state > old
retention for real-time demo).

**Trade-off**: cross-process pub-sub not supported. If Wave 3 ever scales to
> 1 K8s pod replica, must swap to Redis. Per PRD Section 17 + Pythia contract
`hera-to-hades.md` Asumption 3, single replica is canonical scope.

**Confidence**: high (sufficient for hackathon submission window).

## D-Hades-05: Demeter persistence as Protocol-based stub (no SQLAlchemy in Hades cycle)

**Decision**: `app/services/demeter_service.py` ships `_StubDemeterService`
+ `DemeterServiceProtocol` + `get_demeter_service()` accessor. Hades imports
this stub for type safety. Demeter worker (parallel spawn batch) drops real
SQLAlchemy + asyncpg impl into the same module via `set_demeter_service()`
swap or direct file replacement; Hades imports do NOT change.

**Why**: SQLAlchemy schema + Alembic migration + async pool setup is Demeter's
exclusive ownership per `_meta/contracts/hades-to-demeter.md` Section 'Storage
location'. Hades focuses on call-site discipline; Demeter focuses on
persistence + cache layer.

**Confidence**: high.

## D-Hades-06: tree-sitter-language-pack 'typescript' lang covers .tsx files

**Decision**: `LANGUAGE_PACK_MAP['typescript'] = 'typescript'` (not 'tsx').
Confirmed via process() inspection that bundled typescript grammar handles
`.tsx` files without separate jsx-typescript pack.

**Trigger**: Hades agent prompt Section 5 LANGUAGE_PACK_MAP suggested
`'typescript': 'tsx'` (old v0.7 era).

**Confidence**: high (tested via fixture file).

## D-Hades-07: HMAC verify constant-time + LRU dedup 1024 entries

**Decision**: webhook receiver uses `hmac.compare_digest` for signature
verification (constant-time, side-channel hardened). Dedup via OrderedDict
LRU sized 1024 entries (covers ~17 minutes of webhook activity at 1 event/sec).

**Reference**: PRD Section 19.1 webhook HMAC mandatory. Aletheia critical
audit gate.

**Confidence**: high.

## D-Hades-08: Frontend stub removal: rewrite Hestia route handler to proxy backend

**Decision**: `frontend/app/api/auth/github/start/route.ts` rewritten to
302-redirect to `${NEXT_PUBLIC_API_URL}/api/auth/github/start` (no fallback
to mock). Hestia Wave 1 stub branch entirely removed.

**Why this approach vs Next.js rewrite config**: Direct route handler edit
keeps the CTA wiring at the existing route path, requires no Next.js config
mutation, and surfaces clearly in code review what is forwarded vs locally
handled. Atlas Wave 3 NGINX ingress will additionally route `/api/*` paths
to the FastAPI service same-origin in production so the redirect path stays
internal.

**Confidence**: high (verified via curl smoke against `localhost:8765`).

## D-Hades-09: Python 3.14 ambient instead of 3.12

**Decision**: pyproject `requires-python = ">=3.12"` accepts 3.14. macOS
Apple Silicon ambient is 3.14.3; venv built on 3.14.3 with no compat
warnings; FastAPI 0.129 + pydantic 2.13 + tree-sitter-language-pack 1.8 all
support 3.14.

**Risk**: Atlas Wave 3 may build Docker image on python:3.12-slim; minor
compat delta typically not material. Logged in uncertainty journal medium.

**Confidence**: medium (validated locally; production parity check by Atlas).

## D-Hades-10: Single-cycle consolidation (cycle 1-4 ship together)

**Decision**: Original plan was 4 cycle stub-then-full sequence. Actual ship
consolidated because (a) tree-sitter pivot resolved cycle 2 risk in cycle 1,
(b) OAuth + webhook impl simple enough to ship real in cycle 1 (no half-stub
risk), (c) downstream Nemesis + Pandora + Demeter already shipped in parallel
batch with matching contracts so no stub-then-swap dance needed.

**Effect on STATUS.md**: Hades cycle 1 stub + cycle 2 full both checked off
in single Wave 3 progress entry.

**Confidence**: high (full pytest 125/125 PASS, manual curl OAuth + webhook
verified).
