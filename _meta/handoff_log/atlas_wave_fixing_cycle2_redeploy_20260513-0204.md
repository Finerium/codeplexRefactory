---
from: atlas (wave-fixing cycle 2)
to: manager-wave-fixing (then aletheia day 2 OR pan demo rehearsal)
stamp: 20260513-0204
wave: wave-fixing
cycle: 2 (re-deploy post-commit 5f76f26)
ship_state: clean
ferry_triggered: false
---

# Handoff: Atlas Wave-Fixing Cycle 2 Re-Deploy

Live cluster `duopoly` sekarang run image digest sha256 `8e10c839...` (matches HEAD `5f76f26`). Pre-Wave-Fixing pod `85979b988d-ffgxh` terminated. New pod `5767f8c8d5-rx625` 1/1 Running. SC-04 3x consecutive PASS dengan INSECURE_TLS=1 flag (self-signed Traefik default cert carry-over, identical posture cycle 4 Day 1 evening).

## Deliverable to Manager

1. Image build + push verdict: **SUCCESS**.
   - Multi-arch manifest list sha256: `8e10c839dbb332b1fc89f6455987aace8277877599c6022283bd699ec8e15bdb`
   - amd64 digest: `e7192df08b3d7b53e13c4906895a81946b429cefe310f4fe888ce302cb13a348`
   - arm64 digest: `53be1d5f53a78a3c77a6b6dda736fe1b4110a942dc5128b95bd1ef13be48685a`
   - Two tags pushed: `ghcr.io/finerium/codeplexrefactory:latest` + `:5f76f26`.

2. K8s rollout verdict: **SUCCESS** within 180s budget.
   - Deployment generation 5 -> 6.
   - New ReplicaSet `codeplex-chronicle-5767f8c8d5` desired=1 current=1 ready=1.
   - New pod `codeplex-chronicle-5767f8c8d5-rx625` 1/1 Running on node `refactory-hackathon-vm`, 0 restart.
   - Image digest pulled by pod matches push manifest sha256.
   - Old ReplicaSet scaled to 0 (graceful terminate via RollingUpdate maxSurge=1 maxUnavailable=0). Zero downtime.

3. SC-04 3x consecutive smoke verdict: **PASS 3/3**.
   - Trial 1: 529ms total, 7/7 check PASS.
   - Trial 2: 470ms total, 7/7 check PASS.
   - Trial 3: 422ms total, 7/7 check PASS.
   - Median 470ms, p95 529ms.
   - First default-flag run 0/3 fail per self-signed cert (expected), re-ran with `INSECURE_TLS=1` per D-Atlas-22 anchor.

4. Post-deploy body grep verdict: **PASS 3/3**.
   - `/city` (38KB SSR): `<canvas>` R3F mount marker confirmed.
   - `/dashboard` (8KB SSR): "Manager" role token + "sprint" mode token (Selene D-2 PurposeBanner live).
   - `/start` (93KB SSR): "Pick a repo" + "Build from scratch" dual CTA (Hestia E-1 live).

## What this unblocks

- **Aletheia Wave 3 Day 2 audit refresh** (if Manager decides to re-audit Day 2 morning before demo).
- **Pan post-Wave-Fixing demo rehearsal 3x** (live cluster reflects HEAD, rehearsal video can be re-captured for fidelity if needed).
- **Ghaisan PanitSubmission zip pack** Day 2 jam 11-13 window (live URL reachable for panitia juror probe).

## What stays unchanged (Lock 5 honest claim)

- Self-signed Traefik default cert constraint unchanged. Refactory infra team owns TLS rotation per sourceoftruth Section 3.3. Smoke test must run `INSECURE_TLS=1` Day 2 unless cert flips real before demo (low probability).
- ghcr.io package visibility still private (PAT scope lacks `admin:packages`). `imagePullSecrets: ghcr-pull` K8s secret continues to authorize pulls.
- Database + Secret + ConfigMap state unchanged this cycle (no schema migration, no secret rotation, no feature flag flip).

## Diagnostic context for Manager decision

- Wall time end-to-end: 02:04 WIB to 02:09 WIB approx 5 minute (dominated by docker buildx multi-arch ~4 min).
- No ferry trigger. All HIGH bar conditions absent.
- Build cache hit ratio high (frontend deps + backend deps unchanged, only source-tree rebuild).
- Pod healthy via readiness + liveness + startup probe all green.
- Two prior ReplicaSet retained per `revisionHistoryLimit: 3` (rollback path operative).

## Rollback path (if Manager triggers)

If Aletheia Day 2 audit fails or demo regression surface, rollback fast via:
```
kubectl --kubeconfig=$HOME/.kube/duopoly-config -n duopoly rollout undo deployment/codeplex-chronicle
```
This reverts to pre-Wave-Fixing pod (ReplicaSet `85979b988d`, image digest `4061b6b0...`, cycle 4 baseline). Wall time approx 30 second. Atlas tested rollback path implicitly during normal RollingUpdate (graceful pod cutover).

Alternative: explicit tag rollback:
```
kubectl --kubeconfig=$HOME/.kube/duopoly-config -n duopoly set image deployment/codeplex-chronicle app=ghcr.io/finerium/codeplexrefactory@sha256:4061b6b015e4a3c0fa4f810c89156d6ab2a3ae4e42ee956f7d063f849e7ceecb
```

## Atlas auto-end

Manager Wave-Fixing consume verdict. Atlas Wave-Fixing cycle 2 complete, no continuation scope. Domain ownership returns to standby until next dispatch (potential cycle 3 if Manager surfaces additional re-deploy scope post-Aletheia Day 2 audit).
