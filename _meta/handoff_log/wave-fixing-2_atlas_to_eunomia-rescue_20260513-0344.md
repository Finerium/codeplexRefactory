---
from: atlas
to: eunomia-rescue
wave: wave-fixing-2
cycle: 2
stamp: 20260513-0344
ship_state: clean
image_pushed: ghcr.io/finerium/codeplexrefactory:latest@sha256:f12322b5f24d1369d5d4b08c18855832d834e9ecbb89e59f1e5be264669e62d9
image_tags: ["latest", "774f734"]
k8s_namespace: duopoly
k8s_pod: codeplex-chronicle-7b86dd5d8b-6rl6f
k8s_generation: 7
k8s_replicaset_active: codeplex-chronicle-7b86dd5d8b
k8s_replicaset_rb_target: codeplex-chronicle-5767f8c8d5
sc04_status: PASS
sc04_trial_count: 3
sc04_total_trial_ms_median: 413
ferry_triggered: false
---

# Atlas Wave-Fixing #2 Cycle 2 to Eunomia Rescue Handoff

## Mission ship

Manager Wave-Fixing #2 dispatched Atlas cluster 10A re-deploy + smoke test verify after 14-cluster-worker Wave-Fixing #2 batch shipped commit `774f734`. Phanes Bug #11 Lock 3 silent narrow rescue added 3 new Python deps (mermaid-py + graphviz + eralchemy2 transitive pygraphviz) which require system graphviz package install both build-time + runtime. Atlas Cycle 2 wave-fixing-2 produced Dockerfile triple-layer graphviz install, rebuilt multi-arch image, pushed GHCR, rolled out K8s, verified live smoke 3/3 PASS plus 5 resident real LLM dispatch + Pandora real V4-Pro drafts write + /api/diagram/demo Phanes endpoint live.

## What Eunomia Rescue should verify

### Live cluster state

Get pods labeled `app=codeplex-chronicle` in namespace `duopoly`; expected `codeplex-chronicle-7b86dd5d8b-6rl6f` 1/1 Running 0 restart on node `refactory-hackathon-vm`. Describe pod and grep `Image ID`; expected `ghcr.io/finerium/codeplexrefactory@sha256:f12322b5...`.

### Endpoint verify

Curl with insecure flag against `https://duopoly.hackathon.sev-2.com/api/diagram/demo`. Expected JSON with `nodes=157`, `edges=274`, `svg_blobs=3`, `schema_version=v1.0`.

Curl with insecure flag against `https://duopoly.hackathon.sev-2.com/api/llm/health`. Expected JSON `circuit_state=closed`, `total_cost_usd` field present.

### 5 resident real LLM dispatch smoke

POST /api/chat with thread_id + target (Hermes, Athena, Apollo, Argus, Clio) + message + context.current_mode. All 5 residents returned SSE event chunk + event done streams in 2.3 to 3.9s, modelUsed honored per PRD 18.3 routing.

### Pandora real V4-Pro dispatch verify

POST /api/refactor/simulate with user_intent text. Response time can exceed 90s (V4-Pro full generation). Server-side verify via kubectl exec listing `/app/backend/drafts/` showing fresh sim folder write.

AD-19 drafts isolation safety property preserved (production code untouched, all gen writes go to drafts/<sim-id>/ subfolder).

## Smoke test 3x consecutive trial timings (Atlas-recorded)

| Trial | Status | Total | GET / | /start | /api/auth/github/start | /city?mock_auth=true | /api/llm/health | /dashboard | /api/dashboard |
|---|---|---|---|---|---|---|---|---|---|
| 1 | PASS | 1671ms | 1310ms 200 (cold) | 47ms 200 | 38ms 302 | 60ms 200 | 44ms 200 | 46ms 200 | 79ms 200 |
| 2 | PASS | 413ms | 135ms 200 | 47ms 200 | 38ms 302 | 60ms 200 | 44ms 200 | 46ms 200 | 39ms 200 |
| 3 | PASS | 407ms | 137ms 200 | 52ms 200 | 33ms 302 | 42ms 200 | 36ms 200 | 50ms 200 | 55ms 200 |

Median warm trial 410ms; p95 cold trial 1671ms (SSR first-hit). SC-04 ship criteria PASS.

## Image registry details

| Tag | Push time | Manifest |
|---|---|---|
| `ghcr.io/finerium/codeplexrefactory:latest` | 2026-05-13 03:58:30 WIB | `f12322b5...` |
| `ghcr.io/finerium/codeplexrefactory:774f734` | 2026-05-13 03:58:50 WIB | `f12322b5...` |
| RB target `ghcr.io/finerium/codeplexrefactory:5f76f26` | 2026-05-13 02:08 WIB | `8e10c839...` |

Both arm64 + amd64 manifests + attestation manifests packaged in `f12322b5` list.

## Rollback procedure (if Eunomia surfaces Wave-Fixing #2 regression)

Run `kubectl rollout undo deployment/codeplex-chronicle` (default reverts to last revision). For explicit revision target use the rollout history command and the `to-revision` flag with value 6.

Reverts to `codeplex-chronicle-5767f8c8d5` ReplicaSet (Wave-Fixing #1 image `8e10c839`) within 30s (image cached on node, no pull needed).

## Open carry-forward concerns (none escalated to high)

5 medium-tier uncertainty items documented in `_meta/uncertainty/atlas-wf2-cycle2-20260513-0344.md`:

1. Pandora /api/refactor/simulate response time can exceed 90s under cold V4-Pro generation. Demo Day Pan rehearsal must budget wait time OR pre-cache via similar user_intent canned hit.
2. Image size delta plus 30MB runtime (graphviz binary plus fonts). Pod cold-start pull approx 3 to 5s longer. Acceptable.
3. /api/llm/health calls_recorded is in-memory counter reset on pod restart. Demeter `llm_call_log` is persistent source of truth.
4. Traefik default cert self-signed: HTTP 000 without insecure flag, HTTP 200 with insecure flag. Refactory infra owns TLS lifecycle. Pan demo rehearsal note advised "Advanced plus Proceed" browser flow OR Hafiz Day 2 request real cert.
5. GHCR_TOKEN scope write:packages preserved; `ghcr-pull` K8s Secret operative. If token rotated, populate-secrets.sh plus patch needed.

## 4 mandatory artifact verify (per Lock 6)

- [x] `_meta/decision_log/atlas.md` (5 entries D-Atlas-WF2-01 to D-Atlas-WF2-05 appended)
- [x] `_meta/uncertainty/atlas-wf2-cycle2-20260513-0344.md` (5 medium concerns, 0 high)
- [x] `_meta/checkpoints/atlas-wf2-cycle2.md` (10 of 10 ship criteria match)
- [x] `_meta/handoff_log/wave-fixing-2_atlas_to_eunomia-rescue_20260513-0344.md` (this file)
- [x] `_meta/orchestration_log/V5_atlas_wave_fixing_2_locked_20260513-0344.md` (V5 snapshot post-cycle)

## Files touched

**Modified** (1):
- `infra/docker/Dockerfile` (D-Atlas-WF2-01 graphviz triple-layer install plus libc6-dev plus python3-dev plus g++)

**New** (5 metadata artifact files listed above)

**Docker image registry** (cluster-only state):
- Push manifest list `f12322b5` for both `:latest` + `:774f734` tag
- Predecessor manifest `8e10c839` retained at GHCR (RB target via Atlas explicit tag preservation strategy D-Atlas-WF2-02)

**Live cluster delta**:
- Deployment generation 6 to 7
- ReplicaSet `codeplex-chronicle-7b86dd5d8b` new (1/1 Ready)
- ReplicaSet `codeplex-chronicle-5767f8c8d5` scaled to 0 (preserved RB target)
- Pod `codeplex-chronicle-7b86dd5d8b-6rl6f` new (1/1 Running)
- Pod `codeplex-chronicle-5767f8c8d5-rx625` terminated gracefully

## Hand-back

Atlas Wave-Fixing #2 Cycle 2 ship clean. Manager Wave-Fixing #2 dispatch Eunomia-rescue audit cluster 10B per cluster-10 split plan.

Atlas standby for additional Wave-Fixing scope OR demo rehearsal sign-off. Gas.
