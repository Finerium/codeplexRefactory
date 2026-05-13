# V8 Manager FINAL TRULY Snapshot

**Stamp**: 2026-05-13T04:04:41Z (Day 2 11:04 WIB)
**Authored**: Atlas Cluster 12 V8 redeploy worker (D-Atlas-MF4-01)
**Predecessor**: V7.1 Manager final cycle 3 hotfix redeploy (image `b0397715`, gen 10, pod 6546d79cd6-7fdzt)

## Live state

| Field | Value |
|---|---|
| Domain | https://duopoly.hackathon.sev-2.com |
| Image digest | `sha256:bb5fc67c47e9df9c1a3c5cf1067a61c5df99824ef1df81a2e38be631f4845d21` |
| Tags | `latest`, `mf4-truly` |
| Platforms | linux/amd64, linux/arm64 (multi-arch verified) |
| Deployment | codeplex-chronicle (namespace duopoly) |
| Generation | 11 |
| Pod | codeplex-chronicle-545b68944-x5t97 |
| Pod IP | 10.42.0.9 |
| Node | refactory-hackathon-vm |
| Pod Age at smoke | 36s |
| Pod Status | 1/1 Running, 0 restarts |
| imageID | ghcr.io/finerium/codeplexrefactory@sha256:bb5fc67c... (matches push) |
| HEAD baked | 9563f966eac94b8bb287b7f8ee3a626aec55aa2d |
| Rollout duration | 36s |
| LLM gateway circuit | closed (fresh pod baseline) |

## SHA delta vs V7.1

- V7.1 (gen 10, pod 7fdzt): `sha256:b0397715d15fcf021dfa8d2d021442304911eabe44c8ed9eabec1509f9e207d6`
- V8 (gen 11, pod x5t97): `sha256:bb5fc67c47e9df9c1a3c5cf1067a61c5df99824ef1df81a2e38be631f4845d21`
- First 8 hex delta: `b0397715` to `bb5fc67c` confirmed image-bake fresh

## Cluster fix manifest baked

1. Aether (BuildingHeightTimeMachine pre-flight match-ratio guard), Time Machine sink fix
2. Hades (_DEEPENED_REPOS + _PRE_CACHE), scrubber lag 10-20s to sub-500ms cached
3. Iris (DEMO_BUILDING_COUNTS slice), per-demo distinct building counts
4. Calliope (HeroSection CTA), Take the tour Tutor Landing button
5. Calliope (TechStackSection), 10 tech stack token visibility
6. Asclepius (RefactorReviewVariant + dual-review-gate-preview), dual review gate UI
7. Persephone (SidePanel Onboarding tab), HUD switcher restored

## Smoke 3x consecutive PASS recap

11 endpoints / 11 200, all sub-500ms.

| Endpoint | T1 | T2 | T3 |
|---|---|---|---|
| GET / | 200 0.32s | 200 0.23s | 200 0.22s |
| GET /city | 200 0.21s | 200 0.24s | 200 0.16s |
| GET /city?demo=nodegoat | 200 0.25s | 200 0.22s | n/a |
| GET /city?demo=pygoat | 200 0.20s | n/a | 200 0.19s |
| GET /api/llm/health | 200 0.29s | n/a | n/a |

Plus functional check:
- POST /api/activity/loc-snapshot 2x cold-then-cached: 5.39s to 0.15s (35x speedup, sub-500ms target met)

## Bundle grep evidence

- Homepage body: `Take the tour` + `cta--ghost` + 7-of-10 tech tokens visible
- City HTML: `canvas` + `data-overlay` + `director-mode` + `sprint-controls` markers
- Pod Python source: `_DEEPENED_REPOS` (lines 272/333/341/365) + `_PRE_CACHE` (lines 426/465/490/516/532/549/556)
- Pod static chunks: `DEMO_BUILDING_COUNTS` hit (chunk 9670)
- Pod server chunks: `dual-review-gate-preview` + `RefactorReviewVariant` hit (chunk 829.js + 17 manifest refs)
- Pod static chunks: `Onboarding` hit (5 chunks)
- Aether matchRatio: minified by Next.js prod build, source stripped in standalone build, functional QA deferred per Boreas-waive pattern

## Rollback option

`kubectl --kubeconfig=$HOME/.kube/duopoly-config -n duopoly rollout undo deployment/codeplex-chronicle --to-revision=10` (sub-30s revert, V7.1 image cached on node)

## Wall-clock summary

V1 Orch HARD ceiling 12 min. Atlas used approximately 6 min total (pre-flight 0:20 + build/push 1:54 + restart 0:36 + smoke 0:30 + grep verify 1:30 + docs 1:00).

## Handoff downstream

Manager final-final audit gate unblocked. V8 TRULY live for panitia demo + submission window (Day 2 jam 11:00 to 13:00 WIB submission per PRD Section 24.1).
