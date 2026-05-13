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

## D-Hades-WF2-01: E-4 root cause = endpoint correct, test coverage gap

**Cycle**: Wave-Fixing #2 cycle 1 (STAMP 20260513-0312 WIB Day 2 dini hari)
**Trigger**: Manager Wave-Fixing #2 dispatch citing QA round Day 2 E-4
`/api/repos/list` 404 then live-verify 03:07 WIB returning 401
"missing oauth_access_token cookie, complete OAuth flow first".

**Investigation findings** (15 min reading):
1. `backend/app/api/repos.py:12` route defined, prefix `/repos`, aggregator
   mounts with `/api` prefix. Final path `/api/repos/list` correct.
2. `backend/app/api/auth/github.py:248` sets cookie
   `oauth_access_token_enc` Fernet encrypted in callback redirect to
   `/start/pick-repo` with `max_age=1800`, `path=/`, `httponly=True`,
   `samesite=lax`, `secure=settings.is_production`.
3. `Cookie(alias=_OAUTH_TOKEN_COOKIE)` parameter binding in `repos.py:70`
   is canonical FastAPI usage and works (verified by direct test below).
4. `decrypt_token` helper in `services/crypto.py` correctly returns
   `str | None` on success / decrypt fail.
5. Prior to this cycle, **NO test exercised the cookie present 200 path**.
   The QA 03:07 verify was a single request without prior OAuth completion
   in the same browser session, so cookie was simply absent. 401 was the
   correct response.

**Decision**: Treat E-4 as a **coverage gap** rather than a wiring bug.
Lock the 200 path with a focused test that mocks GitHub `/user/repos` and
asserts the entire chain (cookie alias bind, Fernet decrypt, GitHub
forward, Pydantic GitHubRepoSummary marshal).

**Why this approach vs editing endpoint logic**:
- Editing live endpoint logic during the submission window risks
  introducing actual regressions (the live verify 401 was a false alarm).
- A regression test is the durable fix: the next QA round can run
  `pytest tests/test_repos_list_smoke.py` and know in 1.3 seconds whether
  the wiring still works.

**Verification**: 5 new test cases in `tests/test_repos_list_smoke.py` all
PASS in 1.26 s. Full backend suite 268 PASS / 14 skipped, 0 regression.

**Confidence**: high.

## D-Hades-WF2-02: Observability tweak distinguish 401 absent vs decrypt fail

**Decision**: Add `logger.info` (absent) and `logger.warning` (decrypt
fail) lines at the two 401 branches in `repos.py` so a future QA pass can
read the log line and immediately know which 401 path fired.

**Rationale**: Manager hypothesis at spawn time conflated the two paths
("missing oauth_access_token cookie OR Fernet decrypt path"). Splitting
the log emit makes the next debugging round 5 minutes faster.

**Confidence**: high (no behaviour change, log only).

## D-Hades-WF2-03: Phanes diagram route registration stub (anti-collision honored)

**Decision**: Create `backend/app/api/diagram/__init__.py` with a single
`GET /api/diagram/{repo_id}` handler that returns **503 with detail naming
Phanes as owner**. Register router in `app/api/__init__.py` so OpenAPI
exposes the endpoint immediately.

**Why not 404 / 501**:
- 404 looks like a misroute, panitia would file a bug for the wrong owner.
- 501 says "server does not support this feature" which is permanent.
- 503 says "service unavailable, try again" which is correct semantics for
  a pending implementation slot. Detail body explicitly names Phanes so
  any reviewer routes the bug to the right worker.

**Anti-collision honored**: Manager directive at spawn: "Phanes ownership
content, you only register router include if separate diagram_routes.py
module". I created the stub with **explicit comment in module header**
designating Phanes as owner and noting Hades responsibility is only the
include registration. Phanes can replace the handler body without
touching anything else in the api package.

**Verification**: 2 new tests in `tests/test_diagram_route_registration.py`
both PASS. OpenAPI `/api/openapi.json` now includes `/api/diagram/{repo_id}`.

**Confidence**: high.

## D-Hades-WF2-04: Webhook event family coverage expansion

**Decision**: Add two new smoke tests in `test_webhook_smoke.py`:
- `test_webhook_accepts_issues_opened_event` covers the issues event
  family (not previously tested).
- `test_webhook_accepts_pull_request_review_requested` covers the PR
  review_requested action (previously only opened was covered).

**Rationale**: Manager rescue directive enumerates 5 PR event types +
2 issue event types; prior smoke locked only one of seven. With these two
additions, 3 of 7 are now regression guarded. The translate_webhook
module (line 138-242) already supports all 7 actions, so the test
additions exercise existing code paths rather than driving new logic.

**Confidence**: high (both tests PASS first run).

## D-Hades-Mf2-01: Eliminate silent demo fallback in /api/findings/scan

**Decision**: Replace `payload or ScanRequest(repo_full_name=DEMO)` + the
`if req.repo_root: use req; else: use _DEFAULT_DEMO_FIXTURE` branch with an
explicit 4-arm resolver:
  1. `repo_root` -> use local path (validate exists).
  2. `repo_full_name` -> server shallow-clone via new `repo_clone` helper.
  3. `demo=True` -> use NodeGoat fixture (explicit opt-in only).
  4. Otherwise -> HTTP 400 with explanation.

**Rationale**: Bug #7 root cause Hypothesis A (V1 Orch pre-flight confirmed).
The old default silently masked any client-side bug that dropped the
target. Empty body, missing repo_root, missing repo_full_name, all routed
to NodeGoat with no signal. Hafiz reported that his repo
`gadablotnok/web-esp32log` rendered NodeGoat data, which is exactly the
expected failure mode of the old code.

**Trade-offs**: more verbose error path; old callers that relied on the
default now must opt-in. Acceptable because there is exactly one such
caller in the codebase (frontend `triggerScan`) and it is updated in this
same change.

**Confidence**: high (Lock 5 evidence captured via 4 live curl scenarios).

## D-Hades-Mf2-02: Server-side shallow clone helper repo_clone.py

**Decision**: New module `app/services/repo_clone.py` implementing
`clone_repo_shallow(repo_full_name, ref=None, token=None, force_refresh=False)`
backed by system `git` via `asyncio.create_subprocess_exec`. Cache layout
`<tmpdir>/codeplex-repo-cache/<owner__name>`. Timeout 90s. Cache hit path
runs `git fetch --depth=1` + optional `checkout` to keep fresh; cache miss
clones from scratch.

**Rationale**:
- No prior clone infrastructure existed; without it the
  `repo_full_name` arm of the new resolver could not work.
- Using system `git` avoids adding GitPython / pygit2 (Lock 8 paid services
  guideline, prefer minimal deps in hackathon scope).
- Shallow depth=1 keeps clone fast enough for live demo (~1-3s for
  small repos).
- Token-via-URL injection (`x-access-token:<token>@github.com/...`)
  matches GitHub's documented OAuth-over-HTTPS pattern. Token only
  forwarded when caller supplies; no silent scope escalation.

**Trade-offs**: filesystem cache grows for session lifetime. Acceptable for
hackathon scope, ~2h session. Pan can sweep on close.

**Confidence**: high (clone of `gadablotnok/web-esp32log` succeeded with
34 files in <2s on first run, ~0.3s on cache hit).

## D-Hades-Mf2-03: Frontend triggerScan target requirement

**Decision**: Remove the `duopoly/codeplex-demo-nodegoat-slice` default in
`findingsClient.triggerScan()`. Add explicit guard: when caller passes
neither `repoFullName`, `repoRoot`, nor `demo`, return
`{ ok: false, error: "scan target missing..." }` without hitting the
network. Also surface backend `detail` JSON when response is non-200 so
the user sees the real error reason.

**Rationale**: A frontend bug that omits the target should not be hidden
by a network round-trip. Refusing to send the call surfaces the bug at
the caller in dev tools.

**Confidence**: high.

## D-Hades-Mf2-04: HealthFindingsVariant URL query consumer

**Decision**: `loadRealScan` reads `?repo=<full_name>` and `?demo=<key>`
from `window.location.search` and forwards to `triggerScan`. When neither
is set, lands on an explicit 'error' state instead of calling the backend.

**Rationale**: The repo picker navigates the user to
`/city?repo=<owner/name>` but the panel previously never consumed that
query. This was the second half of the Bug #7 root cause (the first being
the backend silent fallback). Both must be fixed together to close the
data-substitution gap.

**Trade-offs**: One panel mounts before the URL query may be available
during SSR. Guarded with `typeof window !== 'undefined'`.

**Confidence**: high (verified end-to-end via uvicorn + 4 curl scenarios;
verifying browser-side query consumption requires Playwright which is
queued for the Cluster A handoff to Aether for cross-validation).

## D-Hades-Mf2-05: 'error' SourcePill variant + RescanRow surface

**Decision**: Add a rose-colored 'Scan failed' pill + a surfaced error
rationale row to `HealthFindingsVariant`. Real-repo backend errors now
land on this state instead of silent mock-fallback (which previously
rendered MOCK_FINDINGS on every backend failure). Mock-fallback retained
only when (a) backend unreachable AND (b) the caller explicitly opted
into `demo=true`.

**Rationale**: A real-repo target failing should look different from
"backend offline during a demo dataset render". Lock 5 honest claim.

**Confidence**: high.
