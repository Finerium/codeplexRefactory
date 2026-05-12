---
actual_timestamp: 2026-05-13 01:49 WIB Day 2 dini hari
agent: Atlas (rescue identity, Wave-Fixing cycle 1)
manager: Manager Wave-Fixing
cluster: 7b (GHCR visibility + TLS cert known-issue document)
scope_bugs:
  - R-2 HIGH (GHCR package visibility 404)
  - R-3 MEDIUM (Production TLS self-signed cert)
verdict_per_bug:
  R-2: documented known-issue + resolution instruction (Option B+C hybrid, panitia gh CLI auth path)
  R-3: documented known-issue + browser workaround instruction (Option A documentation, defensive)
locks_honest:
  Lock_1: no fabricated verification, all curl + openssl + gh outputs captured
  Lock_2: no scope creep, verification + documentation only
  Lock_5: ship-clean honest, NO live remediation executed because PAT scope gap (admin:packages + read:packages missing on current gh token), explicit ferry-style instruction surfaced to panitia
---

# Atlas GHCR + TLS Verification Audit

## Context

Manager Wave-Fixing dispatched Atlas rescue identity for Cluster 7b 01:46 WIB Day 2. Two bugs in scope:

- **R-2 HIGH**: GHCR package page `https://github.com/Finerium/codeplexrefactory/pkgs/container/codeplexrefactory` returns HTTP 404 unauthenticated. Hafiz QA screenshot `_meta/qa_screenshots/ContainerRefactory.png` confirms GitHub 404 "This is not the web page you are looking for" surface.
- **R-3 MEDIUM**: Production TLS cert at `https://duopoly.hackathon.sev-2.com` is Traefik default self-signed (`CN=TRAEFIK DEFAULT CERT`). Browser shows "Connection Not Private" interstitial. Atlas methodology gap re smoke test using `INSECURE_TLS=1` curl `-k` bypass.

Per V3 atlas snapshot `_meta/orchestration_log/V3_atlas_deploy_live_locked_20260512-2337.md` D-Atlas-17 + D-Atlas-21, both states are known to Atlas baseline. This audit doc formalizes the verification + resolution surface for panitia handoff.

## Verification result

### R-2 GHCR visibility

```
$ curl -sIo /dev/null -w "STATUS=%{http_code}\n" \
    "https://github.com/Finerium/codeplexrefactory/pkgs/container/codeplexrefactory"
STATUS=404

$ curl -sIo /dev/null -w "STATUS=%{http_code}\n" \
    "https://ghcr.io/v2/finerium/codeplexrefactory/manifests/latest"
STATUS=401
```

Both responses confirm the package is **private** (not deleted). HTTP 404 on github.com pkg page is GitHub's stock behavior for unauthenticated visitors viewing a private container; HTTP 401 on the registry v2 manifest endpoint confirms auth challenge (`WWW-Authenticate: Bearer realm=...`). The image exists at `ghcr.io/finerium/codeplexrefactory:latest@sha256:4061b6b015e4a3c0fa4f810c89156d6ab2a3ae4e42ee956f7d063f849e7ceecb` (multi-arch manifest list, amd64 + arm64) per V3 snapshot.

```
$ gh auth status
github.com (account Finerium): logged in via keyring
  Token scopes: 'gist', 'read:org', 'repo', 'workflow'
```

Current PAT does NOT include `admin:packages` (required to flip visibility) or even `read:packages` (required to list packages via REST). Confirmed via API probe:

```
$ gh api "/user/packages?package_type=container"
HTTP 403: "You need at least read:packages scope to list packages."
```

### R-3 TLS cert

```
$ echo | openssl s_client -connect duopoly.hackathon.sev-2.com:443 \
    -servername duopoly.hackathon.sev-2.com 2>/dev/null \
    | openssl x509 -noout -subject -issuer -dates
subject=CN=TRAEFIK DEFAULT CERT
issuer=CN=TRAEFIK DEFAULT CERT
notBefore=May 12 18:13:42 2026 GMT
notAfter=May 12 18:13:42 2027 GMT
```

Issuer == Subject confirms Traefik default self-signed (not LetsEncrypt, not Refactory-managed CA). Cert was minted by the Traefik ingress controller at first pod boot on 2026-05-12 18:13:42 UTC (matches D-Atlas-21 timeline). Valid for one year.

App layer healthy with `-k` flag bypass:
```
$ curl -ksI "https://duopoly.hackathon.sev-2.com/" → HTTP/2 200 (Next.js prerender HIT)
$ curl -ksI "https://duopoly.hackathon.sev-2.com/api/llm/health" → HTTP/2 405 (GET allow)
$ curl -ks  "https://duopoly.hackathon.sev-2.com/api/llm/health"
  → {"circuit_state":"closed","consecutive_failures":0,"canned_entries":10,
     "calls_recorded":9,"total_cost_usd":0.001577}
```

Backend live, Triton LLM gateway initialized, 10 canned cache entries hot, 9 calls already recorded since deploy. SC-04 ship criteria deploy-live + smoke 3x PASS satisfied per V3 atlas snapshot.

## Root cause

### R-2

GitHub Container Registry packages default to **private** visibility on first push. To flip to public:
1. via Web UI: repository owner navigates to https://github.com/users/Finerium/packages/container/codeplexrefactory/settings -> Danger Zone -> Change Visibility -> Public.
2. via REST API: `PATCH /user/packages/container/codeplexrefactory` with body `{"visibility": "public"}`, **requires PAT with `admin:packages` scope**.

Current Atlas PAT (used for image push during V3 cycle 2) has `write:packages + read:packages + repo` scope (write was enough to push). `admin:packages` was not granted at PAT mint time. Current gh CLI token (used for this verification) has even narrower scope: `gist, read:org, repo, workflow` (no packages scope at all).

Mitigation in place: `imagePullSecrets: [ghcr-pull]` is configured in `infra/k8s/deployment.yaml` (D-Atlas-17). K8s docker-registry secret `ghcr-pull` is populated from `$GHCR_TOKEN` (PAT) via populate-secrets path. The cluster pulls fine because it has auth. The 404 only affects external observers (panitia jurors, screenshot reviewers) trying to browse the package page anonymously.

### R-3

Refactory Kubernetes cluster ships Traefik with its default self-signed certificate. The Ingress manifest references `tls.secretName: duopoly-tls` (expected pre-provisioned by Refactory ops per ingress.yaml comment), but the Secret does not exist (or Traefik did not pick it up), so Traefik fell back to default cert.

No cert-manager visible in the cluster from our service account scope (Atlas SA is namespace-scoped to `duopoly`, no cluster-wide cert-manager Issuer/ClusterIssuer access). Re-issuing with LetsEncrypt would require either (a) Refactory cluster admin annotation on the Ingress (`cert-manager.io/cluster-issuer: letsencrypt-prod`) or (b) panitia ops creating the `duopoly-tls` Secret directly. Both are out of Atlas authority.

## Mitigation in place (already shipped Wave 3)

| Bug | Mitigation | File / decision ref |
|---|---|---|
| R-2 | K8s `imagePullSecrets: [ghcr-pull]` on Deployment, docker-registry secret populated from PAT | `infra/k8s/deployment.yaml` line 54-55, D-Atlas-17 |
| R-3 | Smoke test uses `INSECURE_TLS=1` (curl `-k`) to bypass cert check, all 7 routes PASS | `scripts/smoke-test-e2e.sh`, `tests/smoke_test_e2e.py`, D-Atlas-23 |

## Resolution instruction (panitia / repo owner action)

### R-2 instruction: flip GHCR package to public

**Option A (Web UI, recommended, no scope upgrade needed)**:
1. Sign in to GitHub as `Finerium`.
2. Visit https://github.com/users/Finerium/packages/container/codeplexrefactory/settings
3. Scroll to "Danger Zone" -> "Change package visibility".
4. Select "Public", confirm by typing the package name.
5. Re-verify: `curl -sI https://github.com/Finerium/codeplexrefactory/pkgs/container/codeplexrefactory` should return HTTP 200.

**Option B (gh CLI, requires PAT upgrade)**:
1. Mint a new PAT at https://github.com/settings/tokens/new with `admin:packages` scope.
2. `gh auth refresh -h github.com -s admin:packages` (or paste the new PAT).
3. `gh api --method PATCH /user/packages/container/codeplexrefactory -f visibility=public`

**Option C (no flip, authenticated pull only, current state)**:
- External viewers (panitia jurors) can pull the image with `gh auth token` or any PAT with `read:packages` scope. Atlas + Manager treat current state as **acceptable** because the deployed cluster already pulls fine via `imagePullSecrets`. Public visibility is a juror UX nicety, not a functional blocker.

### R-3 instruction: TLS browser workaround

The cert is self-signed by Traefik default; browsers WILL show "Connection Not Private" (Chrome) / "Warning: Potential Security Risk" (Firefox). Demo workarounds:

**Day 2 demo (recommended, low effort)**:
- Click through the browser warning: Chrome "Advanced" -> "Proceed to duopoly.hackathon.sev-2.com (unsafe)"; Firefox "Advanced" -> "Accept the Risk and Continue".
- Alternative for screen recording / smoother demo: launch Chrome with `--ignore-certificate-errors` flag (kills the warning entirely):
  ```
  open -na "Google Chrome" --args \
    --ignore-certificate-errors \
    --user-data-dir=/tmp/chrome-demo-profile \
    https://duopoly.hackathon.sev-2.com/
  ```
  (Use a throwaway profile to avoid polluting your real browser cert store.)

**Long-term (post-hackathon, NOT in Atlas scope)**:
- Panitia / Refactory ops annotate the Ingress with cert-manager LetsEncrypt issuer, OR provision `duopoly-tls` Secret with a real cert. Either resolution would auto-pickup on Traefik refresh. Not actionable from team Duopoly side.

## Risk impact assessment

| Bug | Severity (Manager) | Functional impact | Demo impact | Submission impact |
|---|---|---|---|---|
| R-2 | HIGH | Zero - K8s pulls via imagePullSecrets, app running | Low - juror who clicks package link from repo sees 404, must read README note OR auth | Medium - if juror equates 404 with "broken deploy" without reading note. README note + this audit doc closes that gap. |
| R-3 | MEDIUM | Zero - HTTPS works, only browser UI warning | Medium - first-time visitor sees scary interstitial. Click-through works but harms first impression. `--ignore-certificate-errors` flag for screen recording is the demo polish. | Low - jurors trained to recognize self-signed dev/hackathon certs. README note closes the gap. |

**Overall verdict**: both bugs are **documentation-tier**, not functional. Submission ship criteria SC-04 (deploy live + smoke 3x PASS) remains satisfied. Manager preference (R-2 Option B+C, R-3 Option A) executed as documentation deliverable in this audit doc + README note coordination handoff to Pan.

## Files touched this audit

- `_meta/audit/atlas_ghcr_tls_verification_20260513-0149.md` (this file, new)
- `_meta/handoff_log/atlas_wave_fixing_cycle1_20260513-0149.md` (new, see Pan coordination)
- `README.md` (Atlas-surface note for Pan to absorb into final rewrite, see handoff)

## No live remediation executed

Lock 5 honest: Atlas did NOT execute the R-2 visibility flip (PAT scope gap on current gh CLI token, repository owner Finerium would need to either upgrade PAT or click-through Web UI; both are user-level actions, not agent-executable safely without explicit credential elevation). Atlas did NOT trigger R-3 cert re-issue (cert-manager state unknown, cluster-admin annotation out of namespace-scoped SA authority).

Manager preference acknowledged: documentation-tier resolution accepted, instruction surface delivered for panitia / repo-owner to act on if desired.
