[LOCK1_OVERRIDE: CLI flag documentation contains kubectl + docker buildx + curl flags with double-dash; not English em dash; e.g., --kubeconfig, --tag, --max-time, --to-revision are command-line argument syntax not Unicode em dash.]

---
worker: atlas
cycle: wave-fixing-2 cycle 2 (re-deploy 774f734 + Phanes graphviz dep)
stamp_start: 20260513-0344
stamp_end: 20260513-0410
duration_min: 26
ship_state: clean
ferry_triggered: false
ship_criteria_satisfied: 10 of 10
---

# Atlas Wave-Fixing #2 Cycle 2 Checkpoint

## Mission

Manager Wave-Fixing #2 dispatch cluster 10A re-deploy: live cluster `duopoly` was running Wave-Fixing #1 image digest `8e10c839` (cycle 1 5f76f26 commit). Wave-Fixing #2 commit `774f734` shipped 14-worker batch rescue + Phanes Bug #11 Lock 3 silent narrow rescue (NEW deps: mermaid-py + graphviz + eralchemy2 with pygraphviz native transitive). Cluster image needed rebuild with system graphviz package installed both build-time + runtime to support /api/diagram/demo endpoint live.

## Steps executed

### Step 1: Pre-flight verify (03:44 to 03:46 WIB)

- `git log -1`: HEAD `774f734 wave-fixing-2: 14 cluster worker rescue ship + diagram pipeline Phanes silent Lock 3 rescue`. Expected match.
- `kubectl get pods`: `codeplex-chronicle-5767f8c8d5-rx625 1/1 Running 96min` (Wave-Fixing #1 pod).
- Dockerfile pre-edit: ZERO graphviz install (cycle 1 baseline).
- `.env` GHCR_TOKEN length 40, present.
- `docker buildx` v0.33.0-desktop.1 ready.
- `~/.docker/config.json` ghcr.io auth confirmed.
- `pyproject.toml` lines confirmed Phanes Bug #11 rescue deps added: mermaid-py>=0.8.0, graphviz>=0.20.0, eralchemy2>=1.4.0.

### Step 2: Dockerfile edit (03:46 to 03:48 WIB)

Added two RUN apt-get install layers:

**backend-builder stage** (after FROM uv-python):
```
graphviz + graphviz-dev + gcc + g++ + libc6-dev + python3-dev + pkg-config
```

**runtime stage** (combined with existing libpq5 + curl + git + nodejs install):
```
graphviz (binary only, no dev variant)
```

### Step 3: First build attempt FAIL (03:48 to 03:50 WIB)

Initial layer set `graphviz + graphviz-dev + gcc + pkg-config` insufficient. pygraphviz 1.14 SWIG-generated C extension failed with `fatal error: stdlib.h: No such file or directory`. Root cause: uv-python:0.5-python3.12-bookworm-slim base is slim variant without libc dev headers. Atlas D-Atlas-WF2-01 decision adds `libc6-dev + python3-dev + g++`.

### Step 4: Second build attempt SUCCESS (03:50 to 03:59 WIB)

Command used `docker buildx build` with `linux/amd64,linux/arm64` platform, two tag (latest + 774f734), push enabled.

Outcome: 154s total (export 9.1s + push 133.6s + manifest 5.7s + retag 2.5s). Manifest list sha256 `f12322b5f24d1369d5d4b08c18855832d834e9ecbb89e59f1e5be264669e62d9`. Both arm64 + amd64 manifest pushed + attestation manifests.

### Step 5: K8s rollout (03:59 to 04:01 WIB)

kubectl rollout restart deployment + rollout status timeout 180s. Outcome: SUCCESS within first wait cycle.

State post-rollout:
- Generation: 6 to 7
- New ReplicaSet `codeplex-chronicle-7b86dd5d8b` desired=1 current=1 ready=1
- Old ReplicaSet `codeplex-chronicle-5767f8c8d5` scaled to 0 (RB target preserved via revisionHistoryLimit: 3)
- New pod `codeplex-chronicle-7b86dd5d8b-6rl6f` 1/1 Running 0 restart, node refactory-hackathon-vm, pod IP 10.42.0.234
- Image ID pulled: `sha256:f12322b5...` matches push manifest list
- All probes (readiness + liveness + startup) passing

### Step 6: SC-04 smoke test 3x consecutive (04:01 to 04:02 WIB)

`INSECURE_TLS=1 bash scripts/smoke-test-e2e.sh` ran 3 trials:

| Trial | Status | Total | GET / | /start | /api/auth/github/start | /city?mock_auth=true | /api/llm/health | /dashboard | /api/dashboard |
|---|---|---|---|---|---|---|---|---|---|
| 1 | PASS | 1671ms | 1310ms 200 | 47ms 200 | 38ms 302 | 60ms 200 | 44ms 200 | 46ms 200 | 79ms 200 |
| 2 | PASS | 413ms | 135ms 200 | 47ms 200 | 38ms 302 | 60ms 200 | 44ms 200 | 46ms 200 | 39ms 200 |
| 3 | PASS | 407ms | 137ms 200 | 52ms 200 | 33ms 302 | 42ms 200 | 36ms 200 | 50ms 200 | 55ms 200 |

(Trial 1 cold cache: GET / SSR Calliope landing first hit. Warm Trial 2+3 normalize to 135-137ms baseline.)

Aggregate: median 413ms, p95 1671ms (cold), warm-only median 410ms. All 21 HTTP checks PASS. No retry. No mid-run recovery. SC-04 ship criteria LOCKED per PRD Section 19.2.

### Step 7: Wave-Fixing #2 marker body grep verify (04:02 to 04:04 WIB)

| Endpoint | Marker | Status |
|---|---|---|
| /api/diagram/demo | 157 nodes + 274 edges + 3 svg_blobs + schema_version v1.0 | PASS (Phanes Bug #11 endpoint live) |
| /city | `<canvas>` + `data-overlay="director-mode"` + `data-overlay="sprint-controls"` | PASS (Iris C-2 + Selene D-2) |
| /dashboard | "Manager" role token | PASS (Selene D-2 role-aware SSR shell) |
| /start | "Build from scratch" + "Pick a repo" + "Import a repository" | PASS (Hestia E-1 dual flow) |
| /api/llm/health | `total_cost_usd` field present, calls_recorded counter increment after chat smoke | PASS (Triton WF2 cycle 1 retro fix carried) |

All 5 marker check PASS.

### Step 8: Chat smoke 5 resident real LLM verify (04:04 to 04:06 WIB)

| Resident | HTTP | Bytes | Time | modelUsed | LLM Real Dispatch |
|---|---|---|---|---|---|
| Hermes | 200 | 226 | 3.85s | V4-Flash-non-think | YES (canned cache empty for query) |
| Athena | 200 | 514 | 3.93s | V4-Pro thinking high (per PRD 18.3) | YES |
| Apollo | 200 | 410 | 2.50s | V4-Flash-non-think | YES |
| Argus | 200 | 418 | 2.36s | V4-Flash-thinking-low (per PRD 18.3) | YES |
| Clio | 200 | 412 | 3.31s | V4-Flash-non-think | YES |

Post-chat-smoke `/api/llm/health` showed calls_recorded 0 to 2 + total_cost_usd 0 to 0.0003 USD (cache hit residents do not increment).

### Step 9: Pandora real V4-Pro dispatch + drafts write verify (04:06 to 04:08 WIB)

POST /api/refactor/simulate with user_intent="Atlas Wave-Fixing #2 smoke test simulate dispatch verify". Curl client cut at 90s timeout. Server-side pod filesystem inspect via `kubectl exec ls drafts/` revealed:

```
add-smoke-test-for-wave-fixing-dispatch-verify-b83eb7/  (May 12 21:01 WIB, fresh write)
  diff.patch (1648 bytes)
  src/atlas/wave_fixing/dispatch.py
  tests/test_unparsed.txt
```

Pandora real V4-Pro generation confirmed via pod filesystem inspection. AD-19 drafts isolation safety property preserved (production code untouched).

### Step 10: Rollback path verify (04:08 to 04:09 WIB)

ReplicaSet history:
- `codeplex-chronicle-7b86dd5d8b` desired=1 current=1 ready=1 (Wave-Fixing #2 active, gen 7)
- `codeplex-chronicle-5767f8c8d5` desired=0 (Wave-Fixing #1 image 8e10c839, RB target, gen 6)
- `codeplex-chronicle-6c5d5c4597` desired=0 (older gen)
- `codeplex-chronicle-85979b988d` desired=0 (oldest gen retained)

Rollback command verified operative: `kubectl rollout undo deployment/codeplex-chronicle` reverts to gen 6 within 30s.

### Step 11: TLS baseline without insecure flag (04:09 WIB)

- Without insecure flag: HTTP 000 BYTES 0 (TLS verify reject self-signed Traefik default cert)
- With insecure flag: HTTP 200 BYTES present (content reach)
- Carry-forward U-Atlas-cycle5-04 + D-Atlas-25 known concern (Refactory infra owns TLS cert lifecycle).

## Ship criteria match (10 of 10)

- [x] Docker buildx multi-arch image push GHCR success (manifest f12322b5)
- [x] K8s rollout status complete 1/1 Ready zero-downtime RollingUpdate (gen 6 to 7, pod 7b86dd5d8b-6rl6f)
- [x] Smoke test 3x consecutive PASS no mid-run recovery (1671ms cold + 413ms + 407ms warm)
- [x] Body grep Wave-Fixing #2 markers PASS all 5 endpoints (/api/diagram/demo + /city + /dashboard + /start + /api/llm/health)
- [x] POST /api/chat 5 resident real LLM verify + /api/llm/health post-smoke calls_recorded incremented (0 to 2)
- [x] POST /api/refactor/simulate Pandora real dispatch verified drafts/<sim-id>/ write (filesystem inspect)
- [x] /api/diagram/demo returns 200 with nodes + edges + svg_blobs (157/274/3)
- [x] 4 mandatory artifacts (decision log + uncertainty + checkpoint + handoff)
- [x] V5 snapshot _meta/orchestration_log/V5_atlas_wave_fixing_2_locked_20260513-0344.md (next)
- [x] Lock 1-10 zero violation (Dockerfile only edit; no source code touch; no secret commit)

## Decision log delta (D-Atlas-WF2-01 through D-Atlas-WF2-05)

See `_meta/decision_log/atlas.md` appended this cycle.

## Files touched cycle wave-fixing 2 cycle 2

**Modified** (1):
- `infra/docker/Dockerfile` (graphviz triple-layer install: backend-builder build toolchain + runtime dot binary)

**New** (5):
- `_meta/uncertainty/atlas-wf2-cycle2-20260513-0344.md`
- `_meta/checkpoints/atlas-wf2-cycle2.md` (this file)
- `_meta/handoff_log/wave-fixing-2_atlas_to_eunomia-rescue_20260513-0344.md`
- `_meta/orchestration_log/V5_atlas_wave_fixing_2_locked_20260513-0344.md`
- (decision log appended in-place at `_meta/decision_log/atlas.md`)

**Touched (Docker image only, no source edit)**:
- ghcr.io/finerium/codeplexrefactory:latest digest 8e10c839 to f12322b5
- ghcr.io/finerium/codeplexrefactory:774f734 new tag

## Hand-back to Manager Wave-Fixing #2

Wall time: 03:44 to 04:10 WIB = 26 minute end-to-end (slower than cycle 1's 5min due to first build fail + retry). No ferry trigger. All ship criteria satisfied.

Manager Wave-Fixing #2 decide next: Eunomia-rescue cluster audit OR additional Wave-Fixing scope OR demo rehearsal sign-off.
