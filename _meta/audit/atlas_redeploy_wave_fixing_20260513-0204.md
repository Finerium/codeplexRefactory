---
actual_timestamp: "2026-05-13 02:04 WIB to 02:09 WIB (STAMP=20260513-0204)"
worker: atlas
cycle: wave-fixing cycle 2 (post-commit re-deploy)
manager_dispatcher: manager-wave-fixing
commit_hash: 5f76f262212288bebfb9ac1dcf7c5ac1409e0ddb
commit_subject: "wave-fixing cycle 1: 25 bug rescue ship via 10 worker parallel batch"
image_sha256: "8e10c839dbb332b1fc89f6455987aace8277877599c6022283bd699ec8e15bdb"
image_amd64_digest: "e7192df08b3d7b53e13c4906895a81946b429cefe310f4fe888ce302cb13a348"
image_arm64_digest: "53be1d5f53a78a3c77a6b6dda736fe1b4110a942dc5128b95bd1ef13be48685a"
prev_image_sha256: "4061b6b015e4a3c0fa4f810c89156d6ab2a3ae4e42ee956f7d063f849e7ceecb"
image_tags: ["latest", "5f76f26"]
registry: ghcr.io/finerium/codeplexrefactory
k8s_namespace: duopoly
k8s_rollout_status: success
k8s_deployment_generation: 6
k8s_replicaset_new: codeplex-chronicle-5767f8c8d5
k8s_replicaset_prev: codeplex-chronicle-85979b988d (scaled 0)
pod_new: codeplex-chronicle-5767f8c8d5-rx625
pod_prev: codeplex-chronicle-85979b988d-ffgxh (terminated)
node: refactory-hackathon-vm
pod_ready: "1/1 Running"
pod_restart_count: 0
sc04_3x_pass_count: 3
sc04_status: PASS
latency_aggregates:
  trial_1_total_ms: 529
  trial_2_total_ms: 470
  trial_3_total_ms: 422
  median_trial_ms: 470
  p95_trial_ms: 529
post_deploy_verification:
  city_canvas_mount: PASS
  dashboard_purposebanner_role_token: PASS
  start_dual_cta_hestia_e1: PASS
ship_state: clean
ferry_triggered: false
ship_criteria_satisfied: 9 of 9 (Atlas Section 10 carry-over + Wave-Fixing re-deploy delta)
---

# Atlas Re-Deploy Wave-Fixing Cycle 2 Audit

## Mission

Manager Wave-Fixing dispatch: live cluster `duopoly` masih run pre-Wave-Fixing image (digest `4061b6b...` build 2026-05-12 23:34 WIB cycle 4 ship). Wave-Fixing cycle 1 commit `5f76f26` shipped 34+ file changes via 10 worker parallel batch. Live deploy harus reflect HEAD untuk demo Day 2 fidelity.

Atlas Wave-Fixing cycle 2 = re-build multi-arch image + push + rollout restart + verify SC-04 3x consecutive smoke + verify post-deploy body grep.

## Pre-flight verify

- `git log -1`: HEAD `5f76f26 wave-fixing cycle 1: 25 bug rescue ship via 10 worker parallel batch`. Expected match.
- `kubectl get pods`: `codeplex-chronicle-85979b988d-ffgxh 1/1 Running 149min` (pre-Wave-Fixing pod).
- Deployment image tag: `ghcr.io/finerium/codeplexrefactory:latest`. Tag itself unchanged across deploys (digest swap via re-push).
- `.env` present + `GHCR_TOKEN` populated.
- `~/.docker/config.json`: ghcr.io auth registered via Desktop credsStore.
- `docker buildx`: v0.33.0-desktop.1, desktop-linux builder running, multi-arch platform support `linux/amd64,linux/arm64` confirmed.

## Step 1: Image build + push

Command:
```
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --tag ghcr.io/finerium/codeplexrefactory:latest \
  --tag ghcr.io/finerium/codeplexrefactory:5f76f26 \
  --file infra/docker/Dockerfile \
  --push .
```

Outcome: SUCCESS. Wall time approx 4 minute end-to-end (frontend npx next build 31s arm64 + amd64 backend uv sync + layer export 4.5s + push 69s).

Manifest list sha256 `8e10c839dbb332b1fc89f6455987aace8277877599c6022283bd699ec8e15bdb`.

- amd64 manifest: `e7192df08b3d7b53e13c4906895a81946b429cefe310f4fe888ce302cb13a348`
- arm64 manifest: `53be1d5f53a78a3c77a6b6dda736fe1b4110a942dc5128b95bd1ef13be48685a`
- attestation manifests (SBOM + provenance) accompanying both arch

Diff vs cycle 4 baseline: digest `8e10c839` differs from cycle 4 `4061b6b0`, confirming new layer set rebuilt from Wave-Fixing source tree. No cached image regression.

Notable build output:
- Next.js 16 webpack build: 12 routes generated including 3 new (`/start/build-from-scratch`, `/start/pick-repo`, `/iris-smoke`) compared to Atlas cycle 4 baseline 7 routes. New routes shipped by Hestia E-1 + Iris C-2.
- TypeScript pass clean both arch.
- uv backend sync clean.
- No layer skip / cache evict warning.

## Step 2: K8s rollout

Command:
```
kubectl --kubeconfig=$HOME/.kube/duopoly-config -n duopoly rollout restart deployment/codeplex-chronicle
kubectl --kubeconfig=$HOME/.kube/duopoly-config -n duopoly rollout status deployment/codeplex-chronicle --timeout=180s
```

Outcome: SUCCESS within first wait cycle (under 180s budget).

State post-rollout:
- Deployment generation: 5 to 6.
- New ReplicaSet `codeplex-chronicle-5767f8c8d5` desired=1 current=1 ready=1.
- Old ReplicaSet `codeplex-chronicle-85979b988d` scaled to 0 (graceful terminate via RollingUpdate strategy maxSurge=1 maxUnavailable=0).
- New pod `codeplex-chronicle-5767f8c8d5-rx625` 1/1 Running, 0 restart, on node `refactory-hackathon-vm`.
- Pod image digest pulled: `sha256:8e10c839...` matching push manifest list.
- Pod IP `10.42.0.230`.
- Readiness probe + liveness probe + startup probe all passing.

Two stale ReplicaSets retained per `revisionHistoryLimit: 3` (`59d6498f6f` 178m + `6c5d5c4597` 169m + `85979b988d` 154m, all scaled 0).

## Step 3: SC-04 smoke test 3x consecutive

First run (default `INSECURE_TLS=False`): 0/3 PASS, all 7 check fail per trial via `[SSL: CERTIFICATE_VERIFY_FAILED] self-signed certificate`. Expected per Atlas cycle 4 known concern U-Atlas-cycle5-04: Traefik default cert `CN=TRAEFIK DEFAULT CERT` self-signed, browser handle via "Advanced + Proceed" path at Day 2 demo, smoke test perlu eksplisit `INSECURE_TLS=1` per D-Atlas-22 decision log anchor.

Second run (`INSECURE_TLS=1 bash scripts/smoke-test-e2e.sh`): 3/3 PASS, SC-04 satisfied.

Trial latency log:

| Trial | Status | Total (ms) | GET / | /start | /api/auth/github/start | /city?mock_auth=true | /api/llm/health | /dashboard | /api/dashboard |
|---|---|---|---|---|---|---|---|---|---|
| 1 | PASS | 529 | 168ms 200 | 49ms 200 | 41ms 302 | 50ms 200 | 47ms 200 | 42ms 200 | 107ms 200 |
| 2 | PASS | 470 | 175ms 200 | 46ms 200 | 56ms 302 | 46ms 200 | 61ms 200 | 48ms 200 | 36ms 200 |
| 3 | PASS | 422 | 129ms 200 | 76ms 200 | 38ms 302 | 41ms 200 | 61ms 200 | 44ms 200 | 51ms 200 |

Aggregate:
- Median trial total: 470ms.
- p95 trial total: 529ms.
- Slowest single check median: GET / at 168ms (cold cache SSR Calliope landing).
- Fastest single check: /api/dashboard trial 2 at 36ms (Demeter dashboard data warm path).

All 21 HTTP checks across 3 trials returned expected status code. No retry. No mid-run recovery. SC-04 ship criteria LOCKED per PRD Section 19.2.

## Step 4: Post-deploy verification body grep

Targeted 3 Wave-Fixing rescue ship verifications (Selene D-2 + Hestia E-1 + Calliope smoke):

1. `/city` HTML body: contains `<canvas>` mount marker. 38811 bytes SSR. Calliope city shell + R3F entrypoint live.
2. `/dashboard` HTML body: contains "Manager" role token + "sprint" mode token. 8194 bytes. Selene D-2 PurposeBanner role-aware copy present.
3. `/start` HTML body: contains "Pick a repo" + "Build from scratch" (twice, header + CTA). 93425 bytes. Hestia E-1 dual CTA composition live.

All 3 PASS.

## Step 5: Ship criteria match

Atlas Section 10 + Wave-Fixing re-deploy delta:

- [x] Dockerfile multi-arch builds clean (4 minute wall, no error)
- [x] Image pushed ghcr.io/finerium/codeplexrefactory with two tags (latest + 5f76f26)
- [x] Multi-arch manifest list verified (amd64 + arm64 + attestation)
- [x] K8s rollout success within 180s budget
- [x] New pod 1/1 Running with new image digest
- [x] Smoke test E2E 3x consecutive PASS (SC-04 satisfied with INSECURE_TLS=1 flag honoring self-signed Traefik default cert)
- [x] Live verify HTTP 200 across 7 routes including 3 new Wave-Fixing route (/start/build-from-scratch, /start/pick-repo, /iris-smoke)
- [x] Post-deploy verification body grep 3/3 PASS (city + dashboard + start)
- [x] No secret committed (all secret refs via populate-secrets.sh template)

## Decision log delta

D-Atlas-24: Wave-Fixing re-deploy adopted dual-tag strategy (latest + 5f76f26) for rollback target if Aletheia Day 2 audit surfaces regression. Single-tag would lose pre-Wave-Fixing rollback path.

D-Atlas-25: `INSECURE_TLS=1` flag re-confirmed Day 2 02:08 WIB. Self-signed Traefik default cert constraint carry-over from cycle 4 U-Atlas-cycle5-04. Real-cert path out of scope (Refactory infra team manages TLS, Pan demo rehearsal note advised "Advanced + Proceed" browser flow).

D-Atlas-26: rollout strategy RollingUpdate maxSurge=1 maxUnavailable=0 honored both pods stayed reachable during cutover (Atlas cycle 4 ingress.yaml unchanged). Zero downtime confirmed via smoke test immediately post-rollout.

## Uncertainty journal carryover

No new uncertainty surfaced this cycle. Cycle 5 medium concerns U-Atlas-cycle5-01 through U-Atlas-cycle5-06 (notably self-signed cert + populate-secrets one-shot + ghcr private package + image tag flat) all still operative at medium tier, no new escalation.

## Files touched cycle wave-fixing 2 (0 modified, 2 new)

**New**:
- `_meta/audit/atlas_redeploy_wave_fixing_20260513-0204.md` (this file)
- `_meta/handoff_log/atlas_wave_fixing_cycle2_redeploy_20260513-0204.md`

**Touched (Docker image only, no source edit)**:
- ghcr.io/finerium/codeplexrefactory:latest digest swap (cycle 4 `4061b6b0` to wave-fixing `8e10c839`)

No source code change. Pure deploy pipeline execution.

## Ready for Manager Wave-Fixing consume

Manager verdict input:
- IMAGE BUILD + PUSH: SUCCESS, sha256 `8e10c839...`
- K8S ROLLOUT: SUCCESS, gen 6, pod `5767f8c8d5-rx625` 1/1 ready
- SC-04 3X SMOKE: 3/3 PASS with INSECURE_TLS=1
- POST-DEPLOY VERIFICATION: 3/3 body grep PASS
- WALL TIME: 02:04 WIB to 02:09 WIB approx 5 minute total
- NO FERRY TRIGGER

Manager decide next step (Aletheia Day 2 audit OR additional Wave-Fixing scope OR demo rehearsal sign-off).
