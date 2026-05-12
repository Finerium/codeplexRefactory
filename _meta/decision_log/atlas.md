# Atlas Wave 3 Decision Log

**Worker**: Atlas (Wave 3 last-mile deploy: Docker multi-arch + K8s manifests + scripts + smoke test E2E)
**Wave**: 3
**Spawn**: 2026-05-12 ~21:35 WIB Day 1 evening (Manager Wave 3 batch 6/6)
**Cumulative posture**: Wave 0+1+2 ~2h cumulative buffer ahead nominal, Wave 3 effective window ~8.7h

## Plan: 4-cycle stub-and-sync

Per `.claude/agents/atlas.md` Section 7 immediate task, calibrated to actual environment state:

| Cycle | Scope | Trigger to next |
|---|---|---|
| 1 (stub) | Dockerfile multi-stage + .dockerignore + 5 K8s manifest scaffold + 3 scripts + smoke test E2E + kubectl access probe + Next.js standalone config patch | Cycle 2 await Hades cycle 2 full ship (real OAuth + webhook) + Triton cycle 2 (real DeepSeek + 5 defensive layer) + Nemesis cycle 2 + Pandora cycle 2 + Demeter cycle 2 ready to bake into image |
| 2 (image build) | docker buildx multi-arch build + push ghcr.io OR docker.io fallback, smoke test image locally if Docker available | Cycle 3 await registry auth resolved |
| 3 (deploy) | kubectl apply K8s manifests + populate-secrets.sh execute + rollout status verify | Cycle 4 unblocks |
| 4 (smoke test 3x) | scripts/smoke-test-e2e.sh 3x consecutive PASS no mid-run recovery against live duopoly.hackathon.sev-2.com + curl -I 200 verify + handoff to Aletheia | Aletheia spawn |

## D-Atlas-01: Cycle 1 authoring offline first, kubectl validation deferred contingent on local tooling

**Context**: Pre-flight `which docker` + `which kubectl` exit 127 not-found on Ghaisan machine. PATH scan negative. Common locations (/Applications/Docker.app, /opt/homebrew/bin, /usr/local/bin) negative.

**Decision**: proceed Cycle 1 authoring offline (Dockerfile + manifest + script). Defer docker buildx + kubectl exec to:
- (a) Atlas Cycle 2/3 after Ghaisan installs Docker Desktop + kubectl during Day 1 evening (or)
- (b) Day 2 venue (Telkom Bandung lab) where Refactory pre-provision likely includes Docker + kubectl access

**Rationale**: Atlas agent prompt Section 7 Step 3 explicitly anticipates VPN-only kubectl scenario via "Kalau timeout = VPN-only access, defer test ke hari-H di Telkom venue". Authoring offline keeps Wave 3 critical path moving while Docker install is concurrent. Anti-pattern Lock 4 honest assume: I assume Ghaisan resolves Docker tooling pre Cycle 2/3.

**Impact downstream**: Cycle 2/3 blocked on Docker tooling availability. Ferry trigger if Cycle 3 deploy still blocked > 6h cumulative wall-clock (per Atlas effort budget Section 10 Closing).

## D-Atlas-02: Multi-stage Dockerfile pattern (per Pythia contract atlas-to-production.md)

**Context**: Pythia contract atlas-to-production.md (lock 2026-05-12 16:29 WIB) specifies 3-stage build: frontend-builder (node:22-alpine + pnpm) + backend-builder (python:3.12-slim + uv) + runtime (python:3.12-slim + Node runtime).

Frontend package.json shows `package-lock.json` (npm) not `pnpm-lock.yaml`. Contract template uses pnpm because Themis Wave 0 prepared spec assuming pnpm preferred. Actual Wave 1+2 worker ship used `npm install --legacy-peer-deps` per Hera handoff Cycle 5 (zustand 5.0.13 added via npm).

**Decision**: substitute `npm ci` for `pnpm install --frozen-lockfile` (frontend stage). Substitute `node:20-alpine` for `node:22-alpine` because frontend `engines.node ">=20.11.0"` matches node 20 official LTS line.

**Rationale**: aligned to actual lockfile present + actual install command Wave 1-2 used. Avoid mid-deploy lockfile mismatch.

**Lock 4 honest assume**: I assume `npm ci` succeeds against existing `package-lock.json` (verified locally in Wave 1-2 by Calliope + Hera + Persephone). Risk medium = if lockfile drift from registry meanwhile, build fail. Mitigation: pin Node 20.x LTS major.

## D-Atlas-03: Single-pod multi-container vs separate frontend/backend deployment

**Context**: Pythia contract atlas-to-production.md (line 113-208) deployment.yaml specifies single Deployment with single container exposing both port 3000 (frontend) + port 8000 (backend) via `start.sh` wrapper. Atlas agent prompt Section 4 says "recommend single pod multi-container Wave 3 hackathon scope".

**Decision**: single Deployment + single container + start.sh wrapper spawns FastAPI uvicorn + Node.js standalone server.js in parallel. Match Pythia contract verbatim.

**Rationale**: simpler operational surface for hackathon. Single rollout unit, single readiness probe (FastAPI /health covers both because frontend depends on backend), single liveness probe. NGINX Ingress routes /api -> port 8000 + / -> port 3000 keeps frontend + backend separation at network layer not at K8s deployment layer.

**Trade-off**: shared pod lifecycle (frontend crash kills backend + vice versa). Acceptable hackathon risk because replicas=1 single pod by design.

## D-Atlas-04: Next.js standalone output requires next.config.ts patch

**Context**: Pythia contract Dockerfile line 58 `COPY --from=frontend-builder /build/frontend/.next/standalone /app/frontend` requires `output: 'standalone'` in `next.config.ts`. Current `next.config.ts` has no `output` field set, defaults to non-standalone build (no `.next/standalone/server.js` generated, COPY would fail).

**Decision**: Atlas Cycle 1 patches `frontend/next.config.ts` to add `output: 'standalone'`. Minimal targeted patch, no other Next.js config touched. Document patch in handoff.

**Rationale**: Lock 3 hard rule: no silent scope narrow + no worker code change. BUT Next.js standalone output is infra-required, not feature-product code, falls within Atlas Dockerfile build domain. This is "deploy plumbing" not "worker product domain". Verified scope: only the `output` field is added.

**Lock 5 honest claim**: documented in this decision log + Atlas handoff doc + cycle 1 checkpoint as a "build-plumbing config touch by Atlas, not a Calliope/Hestia visual change". Auditor (Aletheia) verify infra config touch.

**Alternative considered**: ask Ghaisan to ferry config patch to a frontend worker. Rejected because (a) no frontend worker currently active Wave 3, (b) infra-required minimum patch is < 3 lines isolated to deploy plumbing, (c) ferry adds latency without proportionate isolation benefit. Lock 3 documented exception per "alternative considered" requirement.

## D-Atlas-05: Image registry primary ghcr.io with docker.io fallback

**Context**: Atlas prompt Section 1 line 15 + Atlas contract atlas-to-production.md Asumption 8 specifies ghcr.io/finerium primary. U1 ferry (sourceoftruth Section 3.2) status: open, Ghaisan resolves Atlas Wave 3.

**Decision**: deploy.sh defaults to `REGISTRY=ghcr.io/finerium`. Configurable override via `REGISTRY` env var so docker.io fallback is one-flag flip. Image tag `:latest` per contract default + tag suffix `$(date +%Y%m%d-%H%M)` for traceability.

**Rationale**: ghcr.io is GitHub Container Registry, free tier for public + private hackathon scope. docker.io rate limits unauthenticated pull at 100/6h which is fine for single deploy demo. Auth via GitHub PAT scoped to write:packages (Ghaisan create at Cycle 2 if not yet).

**Lock 8 compliance**: both registries free tier, no paid services.

## D-Atlas-06: K8s Secret population idempotent via dry-run-and-apply

**Context**: contract atlas-to-production.md line 312-340 specifies `kubectl create secret generic --dry-run=client -o yaml | kubectl apply -f -` pattern for idempotency. 4 secret total: duopoly-deepseek (1 key) + duopoly-github-oauth (3 key) + duopoly-db (1 key) + duopoly-session (1 key).

**Decision**: populate-secrets.sh implements dry-run-and-apply pattern. Source `.env` first then create-or-update each secret. SESSION_SECRET sourced via $SESSION_SECRET env (fallback to backend/app/config.py default which is non-prod stub, OR generate fresh 32-byte urlsafe at script run if .env not populated).

**Rationale**: idempotent so re-deploy doesn't fail "AlreadyExists" error. Matches contract Asumption 6. Allows Cycle 3 deploy + Cycle 4 re-deploy without manual secret cleanup.

**Lock 3 K8s Secret discipline**: script reads from .env (gitignored mode 600) + injects via stdin to kubectl. NEVER writes real values to YAML file committed. secrets-template.yaml shows structure with `__PLACEHOLDER__` markers, no real value.

## D-Atlas-07: Smoke test E2E HTTP-only no browser automation

**Context**: Atlas contract atlas-to-production.md line 256-290 example shows Python httpx async client. Atlas agent prompt Section 5 example same pattern. Aletheia audit contract aletheia-wave3-audit.md line 92-96 "Trial run 1/2/3" mention manual browser flow + automated.

**Decision**: scripts/smoke-test-e2e.sh + tests/smoke_test_e2e.py implements httpx automation covering 7 HTTP endpoints (landing -> entry -> oauth start -> city -> parser API -> ws upgrade probe -> dashboard). 3x consecutive trial run loop, fail-fast no mid-run recovery. Browser flow E2E coverage deferred to Pan Day 2 demo rehearsal (per Atlas+Pan division per Aletheia contract line 405 "Day 2 jam 11-13 final deploy: Atlas + Pan execute together; Atlas owns deploy script execution, Pan validates demo flow E2E 3x consecutive").

**Rationale**: HTTP automation is reliable + deterministic + machine-verifiable for SC-04 ship criteria. Browser-level E2E (Playwright) adds Day 2 work + flakiness risk. Aletheia audit gate verifies both: HTTP smoke + Pan manual browser run.

**Trade-off**: HTTP smoke may pass while frontend has broken Three.js Canvas runtime (server-side render only verifies HTML shell). Mitigation: Pan Day 2 manual browser rehearsal closes the gap. Documented in Atlas->Aletheia handoff.

## D-Atlas-08: Frontend Next.js standalone Node runtime in image

**Context**: Pythia contract atlas-to-production.md line 60-63 installs Node.js + npm via apt-get in runtime stage. This is required because Next.js standalone server.js needs Node.js binary to execute.

**Decision**: install nodejs + npm via apt-get in runtime stage. Use Debian default Node 20 LTS via NodeSource setup or just rely on default Debian package (likely Node 18 LTS). Pin via NodeSource if Debian default lags.

**Verification approach**: Cycle 1 verify by building image locally if Docker available, OR defer to Cycle 2 image build run.

**Lock 4 honest assume**: I assume Debian default `nodejs` package via apt-get is sufficient for Next.js 16 standalone runtime. If Debian's default is < Node 20.11, will need explicit NodeSource setup. Mitigation: explicit NodeSource line in Dockerfile.

## D-Atlas-09: Health endpoint `/health` already exists in backend/app/main.py

**Context**: Read `backend/app/main.py` line 95-98. `/health` endpoint returns `{"status": "ok", ...}` via FastAPI route. K8s readinessProbe + livenessProbe httpGet path /health port 8000 matches.

**Decision**: no backend code change needed. Atlas reuses existing /health. Verified Hades Cycle 1 stub already shipped backend/app/main.py + health endpoint.

**No Lock 3 violation**: Atlas does not touch backend product code, only reads contract + verifies endpoint exists.

## D-Atlas-10: Wave 0+1+2 V_n discipline timestamp pattern

**Context**: Wave 1+2 V_n snapshots used hallucinated Day 2 timestamps (per STATUS.md note Wave 3 progress section). Wave 3 directive: always `date +%Y%m%d-%H%M` for filename + frontmatter timestamps.

**Decision**: every Atlas artifact (decision log entry, uncertainty journal, checkpoint, handoff log, V_n snapshot if minted) uses `STAMP=$(date +%Y%m%d-%H%M)` pattern. Day 1 evening currently 2026-05-12 ~21:35 WIB.

**Implementation**: `_meta/uncertainty/atlas-cycle1-<actual-stamp>.md` etc.

## D-Atlas-11: Cycle 1 ship even if Docker tooling absent

**Context**: Atlas prompt Step 3 says "Kalau timeout = VPN-only access, defer test ke hari-H di Telkom venue per sourceoftruth, lanjut Dockerfile + manifest authoring offline".

**Decision**: Cycle 1 ship Dockerfile + .dockerignore + 5 K8s manifest scaffold + 3 scripts + smoke test E2E Python automation as authoritative deliverables. Mark "kubectl/docker validation deferred" in uncertainty journal + handoff. Cycle 2 unblocks when Docker tooling available.

**Lock 5 honest claim**: ship clean = artifacts authored to spec + offline-verifiable (YAML/sh syntax-valid via local lint where possible). Live deploy verification deferred to Cycle 2/3.

---

## Cycle 2-4 decisions (continuation session 2026-05-12 22:30+ WIB Day 1 evening)

## D-Atlas-12: Add git binary to runtime stage (carry-forward Nemesis Pattern E handoff)

Runtime Dockerfile stage 3 adds `git` to apt install list. Required by Nemesis Pattern E (`openspec_drift` detector) subprocess `git log` call for opsx prefix commit check. Without git, pattern E falls back to git_unavailable info log (degraded ship-clean per Lock 5).

## D-Atlas-13: Force webpack builder for frontend, Three.js dedup is load-bearing

Next.js 16 defaults to Turbopack; throws "webpack config with no turbopack config" error against the existing `next.config.ts` webpack() alias block. Dockerfile uses `npx next build --webpack` to keep the webpack dedup alias active. Turbopack-equivalent alias migration deferred (out of Atlas scope, frontend code refactor).

## D-Atlas-14: Three.js alias `three$` exact-match suffix (not bare `three`)

`config.resolve.alias = { three: ... }` rewrites all `three/...` subpath imports to the main entry, breaking `three/examples/jsm/utils/BufferGeometryUtils.js`. Suffix `$` makes the alias exact-match, preserving subpath resolution. Frontend code patch `frontend/next.config.ts` one-character change.

## D-Atlas-15: Wrap `/boreas-smoke` page in Suspense for static prerender

Next.js 16 + webpack prerender errors when `useSearchParams()` invoked inside a client component without a parent `<Suspense>`. Wrapped default export to call `BoreasSmokeInner` inside `<Suspense fallback={null}>`. Minimal patch, behavior identical.

## D-Atlas-16: populate-secrets.sh probes namespace via `get secrets` not `get namespace`

Refactory service account `duopoly-sa` is namespace-scoped (no `get namespace` cluster permission). Original `kc get namespace` probe returns 403 and triggers spurious "namespace not found, creating" branch (also 403). Patched to probe with `kc get secrets` which is namespace-scoped and confirms accessibility.

## D-Atlas-17: imagePullSecrets `ghcr-pull` added to deployment

GHCR_TOKEN PAT scope is `write:packages + read:packages + repo` (missing `admin:packages` to flip visibility to public via REST). K8s `docker-registry` secret `ghcr-pull` created from the PAT and added to deployment.yaml spec.template.spec.imagePullSecrets. K8s now authenticates to ghcr.io.

## D-Atlas-18: backend-builder stage pinned to $TARGETPLATFORM not $BUILDPLATFORM

Original Dockerfile pinned backend-builder to $BUILDPLATFORM, shipping host-arch (amd64) Python binaries into the arm64 runtime image variant via multi-arch buildx. Switched to $TARGETPLATFORM so QEMU emulates the target arch during dep install. Frontend builder remains on $BUILDPLATFORM (Node.js bytecode is portable).

## D-Atlas-19: start.sh invokes uvicorn via `python -m` to bypass venv wrapper shebang

uv-built venv ships wrappers with hardcoded shebang `#!/build/backend/.venv/bin/python` (builder-stage path) that doesn't exist in the runtime image at `/app/backend/.venv/bin/python`. `--relocatable` flag is not supported by uv 0.5. Workaround: invoke `python -m uvicorn` directly; the .venv/bin/python is a symlink to /usr/local/bin/python3.12 which exists. Zero-overhead, fully portable.

## D-Atlas-20: Add `openai` + `numpy` to backend/pyproject.toml

Triton Wave 3 (`app.llm.client`) imports `openai.AsyncOpenAI` and Triton's `app.services.semantic_cache` imports `numpy`. Neither was declared in `backend/pyproject.toml` (Hades baseline didn't include Triton's deps; cross-worker coupling miss). Pod start failed with `ModuleNotFoundError: No module named 'openai'`. Added both as production deps. Cross-worker contract gap not caught by Aletheia plan because Aletheia runs after Atlas ship.

## D-Atlas-21: Ingress class swapped to `traefik` (Refactory cluster ingress controller)

Original Ingress used `ingressClassName: nginx`. Cluster cert subject `CN=TRAEFIK DEFAULT CERT` revealed Refactory uses Traefik, not NGINX Ingress Controller. Updated ingressClassName + added Traefik annotations (`router.entrypoints: websecure`, `router.tls: true`). NGINX annotations kept (Traefik ignores unknown annotations gracefully). After re-apply, routes return 200/302 as expected.

## D-Atlas-22: Smoke test E2E payload + endpoint adjustments for live deploy reality

Two payload changes vs cycle 1 stub:
1. Replace `POST /api/parser/parse-repo` with `GET /api/llm/health` — parse-repo requires server-side filesystem `repo_root` path, not testable via pure HTTP without a mounted demo repo. `/api/llm/health` exercises the same api_router chain through Triton's gateway.
2. Replace `GET /health` with `GET /api/dashboard` — backend `/health` (port 8000) is NOT reachable via Traefik Ingress because `/` routes to port 3000 (Next.js); `/health` is K8s pod-level only (readinessProbe/livenessProbe target). `/api/dashboard` exercises the full /api → 8000 chain.

Both substitutions preserve E2E intent (FastAPI routing layer alive + dependency chain initialized) while matching the real ingress topology.

## D-Atlas-23: SC-04 3x consecutive smoke PASS, all checks <120s budget

Trial timings: 677ms / 657ms / 660ms total per trial (7 HTTP checks each). All 21 checks across 3 trials returned expected status (200/302). No mid-run recovery, no retry. SC-04 satisfied per Aletheia audit verify contract.

---

## D-Atlas-WF2-01: Wave-Fixing #2 Cycle 2 Dockerfile graphviz triple-layer install

**Date**: 2026-05-13 03:44 to 03:59 WIB (STAMP=20260513-0344, completed STAMP=20260513-0359)
**Trigger**: Manager Wave-Fixing #2 dispatch cluster 10A re-deploy. Phanes cycle 1 added 3 new Python deps (mermaid-py 0.8.4 + graphviz 0.21 + eralchemy2 1.4.1) which transitive pull pygraphviz 1.14. pygraphviz native C extension requires system headers to compile from sdist on both arm64 + amd64.

**Decision**: Dockerfile gets three additions:

1. **backend-builder stage** (line 96 onward) installs build toolchain:
   - `graphviz` + `graphviz-dev` (Phanes coordination request, cgraph.h header for pygraphviz SWIG-generated wrapper)
   - `gcc` + `g++` + `libc6-dev` + `python3-dev` + `pkg-config` (compile pygraphviz native ext, resolve stdlib.h + Python.h)

2. **runtime stage** (line ~140) installs runtime-only graphviz:
   - `graphviz` (provides `dot` binary that graphviz pure-Python subprocess at request time for SVG render in /api/diagram/demo)
   - NOT graphviz-dev (compiled wheel already in venv from builder stage)

**First build attempt FAILED**: only `graphviz + graphviz-dev + gcc + pkg-config` -> `fatal error: stdlib.h: No such file or directory`. uv-python:0.5-python3.12-bookworm-slim base lacks libc dev headers + python dev headers. Second attempt with libc6-dev + python3-dev + g++ SUCCESS.

**Decision impact**: 
- Image size delta: +180MB approx (graphviz 95MB + dev tools 85MB) but build-only stages discarded; runtime only +30MB (graphviz binary + fonts).
- Build wall time: 4 min cycle 1 baseline to 5.5 min cycle 2 wf2 (extra apt install layer on both arch).
- pygraphviz 1.14 native extension now packaged in /app/backend/.venv/lib/python3.12/site-packages/pygraphviz/ for both arm64 + amd64.

**Reference**: Phanes handoff `_meta/handoff_log/wave-fixing-2_phanes_to_manager-wf2_20260513-0314.md`.

## D-Atlas-WF2-02: Wave-Fixing #2 image push manifest digest f12322b5

**Date**: 2026-05-13 03:59 WIB
**Tags**: `latest` + `774f734`
**Manifest list sha256**: `f12322b5f24d1369d5d4b08c18855832d834e9ecbb89e59f1e5be264669e62d9`
**Wall time**: image build + push 5 min 30 sec end-to-end (multi-arch layer export 9.1s + push 133.6s + manifest write 5.7s + retag push 2.5s + auth 3 round-trip).
**Pred digest**: `8e10c839dbb332b1fc89f6455987aace8277877599c6022283bd699ec8e15bdb` (Wave-Fixing #1 cycle 1 image, RB target available via revisionHistoryLimit: 3).

**Decision**: Dual-tag strategy preserved (latest + 774f734) so rollback path via `kubectl rollout undo --to-revision=6` reverts to 8e10c839 within 30s.

## D-Atlas-WF2-03: Rollout success generation 7 zero-downtime

**Date**: 2026-05-13 04:01 WIB
**Rollout time**: under 90s within 180s budget (1 old replica pending termination then rolled out).
**Pod state**: codeplex-chronicle-7b86dd5d8b-6rl6f 1/1 Running 0 restart on refactory-hackathon-vm node, pod IP 10.42.0.234. Image ID matches push digest f12322b5.
**Strategy**: RollingUpdate maxSurge=1 maxUnavailable=0 (zero-downtime cutover verified via smoke test immediately post-rollout).
**ReplicaSets retained**: 7b86dd5d8b active (gen 7) + 5767f8c8d5 (Wave-Fixing #1 cycle 1 RB target, scaled 0) + 6c5d5c4597 + 85979b988d (older scaled 0). `revisionHistoryLimit: 3` preserves 3 prior generations.

## D-Atlas-WF2-04: SC-04 smoke 3/3 PASS + 5 resident real LLM dispatch + Pandora real V4-Pro dispatch + Phanes /api/diagram/demo live

**Date**: 2026-05-13 04:02 WIB
**Smoke 3x consecutive (INSECURE_TLS=1)**:
- Trial 1: 1671ms (cold cache SSR Calliope landing)
- Trial 2: 413ms
- Trial 3: 407ms
- All 21 HTTP checks across 3 trials returned expected status. No mid-run recovery. SC-04 satisfied.

**Body grep markers Wave-Fixing #2 (5 of 5 PASS)**:
- /api/diagram/demo: 157 nodes + 274 edges + 3 svg_blobs + schema_version v1.0 (Phanes Bug #11 rescue live)
- /city: `<canvas>` + `data-overlay="director-mode"` + `data-overlay="sprint-controls"` (Iris C-2 + Selene D-2 markers)
- /dashboard: "Manager" role token present (Selene D-2 role-aware copy SSR shell)
- /start: "Build from scratch" + "Pick a repo" + "Import a repository" 3 CTA (Hestia E-1 dual flow composition)
- /api/llm/health: `total_cost_usd` field present, post-chat-smoke calls_recorded 0 to 2 increment, total_cost_usd 0 to 0.0003 confirming real DeepSeek dispatch

**Chat smoke 5 resident (Hermes + Athena + Apollo + Argus + Clio)**: all SSE stream OK, modelUsed V4-Flash-non-think for non-thinking residents, latencyMs 2.3-3.9s, response Indonesian + English mixed greeting.

**Pandora real V4-Pro dispatch**: POST /api/refactor/simulate with user_intent "Atlas Wave-Fixing #2 smoke test simulate dispatch verify" -> drafts/add-smoke-test-for-wave-fixing-dispatch-verify-b83eb7/ created in pod with diff.patch + src/atlas/wave_fixing/dispatch.py + tests/test_unparsed.txt. Curl client timed out at 90s waiting for full response (V4-Pro generation length), but server-side dispatch confirmed via pod filesystem inspection. AD-19 drafts isolation safety property preserved (production code untouched).

**TLS without -k baseline**: HTTP 000 BYTES 0 (TLS verify reject). HTTP 200 with -k. Same as D-Atlas-25 Refactory cluster Traefik default cert self-signed carry-forward.

## D-Atlas-WF2-05: Rollback path operative confirm

**Date**: 2026-05-13 04:02 WIB
**Rollback target**: ReplicaSet codeplex-chronicle-5767f8c8d5 (Wave-Fixing #1 image digest 8e10c839, generation 6).
**Rollback command**: `kubectl --kubeconfig=$HOME/.kube/duopoly-config -n duopoly rollout undo deployment/codeplex-chronicle --to-revision=6`
**Pre-condition**: revisionHistoryLimit: 3 (deployment.yaml line 33) preserves 5767f8c8d5 + 6c5d5c4597 + 85979b988d scaled 0.
**Expected rollback time**: under 30s (image already cached on node, no pull needed).
**Trigger condition**: Aletheia Day 2 final audit flags Wave-Fixing #2 regression OR demo Day 2 jam X surfaces critical bug.

---

(further decisions appended in chronological order per cycle)
