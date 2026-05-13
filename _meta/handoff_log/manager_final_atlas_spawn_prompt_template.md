# Atlas Cluster 14 Re-deploy Spawn Prompt Template (Manager FINAL Wave-Fixing 3)

To be dispatched AFTER 10 worker cluster batch completes. Atlas cycle 3.

## Prompt body

```
CYCLE Wave-Fixing 3 cycle 3 Manager FINAL. You're Atlas dispatched for Cluster 14 RE-DEPLOY at `/Users/ghaisan/Documents/codeplexRefactory`.

CONTEXT: Manager FINAL Wave-Fixing 3 fixed ROOT CAUSE of T-1 + E-4 + R-1 + D-1 + Health Convert-to-Ticket: Dockerfile `ARG NEXT_PUBLIC_API_URL=/api` causing /api/api/X 404 in frontend baked bundle. Edits ALREADY APPLIED at `infra/docker/Dockerfile` line 50 plus `infra/k8s/configmap.yaml` line 44 (both empty string now).

10 cluster worker batch (Aether forensic + Daedalus+Iris visual + Persephone+Hera building click + Hestia build-scratch+demos + Pandora Refactor + Asclepius+Nemesis Health + Boreas+Demeter Activity + Selene Dashboard + Calliope Landing + Triton chat-helper+emoji-sanitize) ALL COMPLETE per Manager FINAL handoff. Their changes in working directory ready for Atlas to bundle.

YOUR DUTY this cycle:
**PLUS Aether forensic findings A-1 plus D-1 surfaced 2026-05-13 06:50 WIB Day 2:**
- **A-1 CRITICAL**: Dockerfile does NOT install openspec CLI binary. Add to runtime stage with installer script piped to sh per OpenSpec install docs, OR `npm install -g @fission/openspec` (verify which install path is official). `/api/openspec/list` plus `/api/openspec/validate` return 503 "openspec binary not found" without this. Verify post-install via `kubectl exec ... openspec version`.
- **D-1 LOW**: Dockerfile HEALTHCHECK probes `/health` path. Backend `app/main.py` line 114-117 mounts `/health` at root (port 8000), separate from `/api/...` prefix. Verify image rebuild preserves this endpoint.

1. **Docker rebuild with fix integrated**: `docker buildx build` invoke with multi-arch flags per existing Atlas atlas-to-production.md contract section line 103 onward.
2. **Verify image SHA new** (differs from f12322b5 Manager #2 cycle 2 ship)
3. **K8s rollout**: `kubectl --kubeconfig=$HOME/.kube/duopoly-config -n duopoly rollout restart deployment/codeplex-chronicle` (NOT apply since manifests unchanged except configmap)
4. **K8s ConfigMap apply**: `kubectl apply -f infra/k8s/configmap.yaml` (NEXT_PUBLIC_API_URL empty fix)
5. **Verify rollout status**: `kubectl rollout status deployment/codeplex-chronicle -n duopoly`
6. **Smoke test SC-04 3x consecutive** WITHOUT `-k` flag (real TLS) PLUS 6 trial WITH `-k`:
   - GET /
   - GET /city
   - GET /dashboard
   - GET /api/llm/health (should return 200 with metric)
   - POST /api/chat (no double-api, should return 200 SSE)
   - GET /api/repos/list (should return 401 or 200, NOT 404)
7. **Hit endpoint with curl -X POST /api/chat real DeepSeek dispatch verify**: should return SSE chunks from Hermes/Apollo/etc
8. **Verify drafts/ Pandora write capability**: POST /api/refactor/propose + simulate, then `ls -la drafts/<sim-id>/`
9. **Phanes /api/diagram/demo still alive**: 157 nodes + 274 edges + 3 svg_blobs

OUTPUT (4 mandatory artifacts):
1. `_meta/decision_log/atlas.md` append D-Atlas-WF3-NN entries
2. `_meta/uncertainty/atlas-wf3-cycle3-<STAMP>.md`
3. `_meta/checkpoints/atlas-wf3-cycle3.md`
4. `_meta/handoff_log/wave-fixing-3_atlas_to_aether-final-audit_<STAMP>.md`
5. PLUS V6 atlas snapshot `_meta/orchestration_log/V6_atlas_wave_fixing_3_locked_<STAMP>.md`

ANTI-PATTERN compliance (Lock 1-10) self-check before stop:
- Lock 1 no em dash zero violation
- Lock 2 no emoji zero violation
- Lock 3 no silent scope narrow
- Lock 4 silent assume documented if any
- Lock 5 honest claim (image SHA verified differ, smoke 3x PASS evidence)
- Lock 8 free registry (ghcr.io primary, no paid services)
- Lock 9 V6 snapshot ship

GHCR public flip status: Manager Mini-Cycle #1 documented Ghaisan post-wake Web UI flip pending (~30 sec carry-forward). Atlas does NOT block on this; image build + push remains private but K8s pulls via ghcr-pull docker-registry Secret. If needed, document in handoff for Ghaisan post-wake action.

TLS R-3 cert workaround documented in atlas_ghcr_tls_verification audit (Manager Wave-Fixing #1 ship). NOT this cycle's scope.

DELIVERABLE: summary message back with:
- Image SHA new
- K8s rollout status (deployment generation +1)
- Smoke 3x trial result (all 4 routes 200 OK each trial)
- POST /api/chat real DeepSeek SSE verify
- POST /api/refactor/simulate drafts/<sim-id>/ write verify
- 4 mandatory artifacts list
- Atlas V6 snapshot lock file path

Time budget: max 60 min wall-clock (Atlas typical cycle ~15-25 min).

Ferry V1 Orch ONLY if:
- buildx FAIL (e.g., GHCR auth issue, multi-arch dep missing)
- K8s rollout FAIL (pod CrashLoopBackOff or similar)
- Smoke 3x FAIL (route 5xx or timeout)

GO.
```

## Dispatch as Agent tool call subagent_type=atlas

## Wait condition

Dispatch ONLY after ALL 10 background workers complete (notified by harness). Specifically wait for these agent IDs:
- aeebc7ded3e1cf797 (Aether)
- ab6cc8b43e423d1a4 (Iris+Daedalus)
- a8cca196a88365da2 (Persephone+Hera)
- ab9bc14301b64fa6e (Hestia)
- a139c36c18fff1778 (Pandora)
- a405ec16f98a783c1 (Asclepius+Nemesis)
- a2a11ac9d499814cf (Boreas+Demeter)
- abe995a9eabd61d46 (Selene)
- a9841263b483b3bcf (Calliope)
- afddad98c4d2aec00 (Triton)

## Expected outcome

- Smoke 3x consecutive PASS no -k bypass
- POST /api/chat real SSE response 200 OK
- GET /api/repos/list 401 (without cookie) or 200 (with cookie), not 404
- POST /api/refactor/simulate drafts/<sim-id>/ folder write
- V6 atlas snapshot file authored
- 4 mandatory artifacts list
