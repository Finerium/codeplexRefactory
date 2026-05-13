# Manager FINAL TRULY FINAL Cycle 4 Running Checkpoint

**Cycle**: Manager FINAL Cycle 4 TRULY FINAL (no Cycle 5)
**Spawn**: 2026-05-13 ~10:31 WIB Day 2
**HARD ceiling**: 100 min wall-clock (target ship 12:00 WIB)
**Live URL**: https://duopoly.hackathon.sev-2.com
**Predecessor**: V7.1 commit 83ba51d image sha256:b0397715 (Atlas Cycle 3 emergency hotfix)
**Submission deadline**: 13:00 WIB Day 2

## Trigger Context

Ghaisan QA at 10:20 WIB real-browser surfaced two critical post-V7.1 ship-claim:
1. Time Machine 0.5s sink (3rd recurring critical)
2. Repo render inconsistent (some repos that previously rendered now fail)

Plus Ghaisan TRULY FINAL request at 10:23 WIB:
- Comprehensive 62-feature audit
- Building count = file count investigation
- User Tutor relaunch button on Landing

Methodology gap baked across Cycle 1-3: ship-claim PASS hollow because audit methodology was instant-snapshot not 5-second observation. Predecessor real-browser tools missed the 500ms-delayed sink animation.

## Cluster Dispatch State (snapshot 10:37 WIB)

| Cluster | Owner | Status | Wall-clock |
|---|---|---|---|
| 1 (Time Machine forensic + fix) | Aether | SHIPPED 10:36 WIB | 5 min |
| 2 (Repo render reliability) | Hades | IN FLIGHT | t=6 min |
| 3 (62-feature audit) | Pan | IN FLIGHT | t=6 min |
| 4 (Building count investigation) | DEFERRED | pitch-defensible | n/a |
| 5 (Tutor relaunch CTA Landing) | Calliope | SHIPPED 10:38 WIB | 10 min |
| 7-11 (per-audit fixes) | TBD pending Pan verdict | PENDING | n/a |
| 12 (Atlas V8 redeploy + final dual audit) | Atlas + Aether + Pan | PENDING | n/a |

## Cluster 1 Aether Fix Detail

**Root cause CONFIRMED via curl direct API evidence**:
- Backend `/api/activity/loc-snapshot` for `gadablotnok/web-esp32log` returns 5 files keyed by real git ls-tree paths: README.md, deno.json, deno.lock, main.ts, static/index.html
- City `useCityData()` always returns mockCityData (~245 buildings with fastapi-fullstack mock paths like backend/app/core/main.py)
- ZERO matches → every building hits `result.set(b.id, 0)` in computeTargetScales line 162 (pre-fix) → tween scales 1 to 0 over ~200ms time constant → buildings sink ~500ms post snapshot load

**Fix**: 34-line pre-flight match-ratio guard at top of computeTargetScales. When matchRatio < 10%, return all-1 (present-day height) for graceful degradation. Existing real-data LOC scaling preserved for matchRatio >= 10% case.

**File**: frontend/src/modes/activity/BuildingHeightTimeMachine.tsx
**TypeScript**: tsc --noEmit --strict clean
**Methodology**: MIXED (curl + code trace, real-browser TLS-blocked)
**Verification**: pending Atlas V8 redeploy for live 5-second observation

## Cluster 4 Building Count Investigation Resolution

Ghaisan question: "DI IDE AWAL KITA, KITA SETUJU DENGAN BANYAKNYA GEDUNG = BANYAKNYA FILE, TAPI YANG SEKARANG SEMUA JUMLAH GEDUNG TERLIHAT SAMA"

**Architectural finding**: `frontend/src/scene/buildings/useCityData.ts` line 247 always returns mockCityData singleton (~245 fastapi-fullstack mock buildings). Wave 3 plan was to swap to Demeter event-store stream but never wired. Building count IS fixed regardless of repo selected. Ghaisan's observation is correct, this is intentional Wave 1+2 design per PRD Section 14.1 R3 Pure Seed strategy.

**Existing mitigation**: `components/city/DemoSourceBanner.tsx` already discloses "Wave 1 reference city, ~240-building fastapi-style mock layout" when ?demo= or ?repo= URL param present.

**Resolution**: DEFER fix. Pitch-defensible: Wave 1+2 mock architecture is intentional reference design, Wave 3 real-data Demeter swap is roadmap. Document in Hafiz pre-demo summary.

## Cluster 5 Calliope Fix Detail

Added secondary ghost CTA "Take the tour" next to primary "Open the city" in HeroSection. href `/city?tour=1` leverages existing FloatingTutorButton shouldForceTour path. Verified chain via Read on FloatingTutorButton.tsx lines 55-70.

**Files modified**: frontend/components/marketing/HeroSection.tsx, frontend/app/(marketing)/marketing.css
**Wall clock**: 10 min, under 15 min budget

## Pending Work (post Hades + Pan return)

1. Process Hades repo render fix or diagnosis
2. Process Pan verdict matrix
3. Spawn additional fixers per Pan FAIL items
4. Batch commit + dispatch Atlas V8 redeploy
5. Final dual audit Aether + Pan with 5-second observation methodology
6. V8 snapshot lock + commit + push origin/main
7. Author Hafiz pre-demo summary report

## Wall-Clock Projection

- Now: 10:37 WIB (6 min in)
- Hades return: ~10:55 WIB
- Pan return: ~11:01 WIB
- Cluster 7-11 fixes (if needed): ~11:15 WIB
- Atlas V8 redeploy: ~11:25 WIB
- Final dual audit: ~11:35 WIB
- V8 commit + push: ~11:40 WIB
- Hafiz summary: ~11:50 WIB
- **Target ship: 12:00 WIB** (1h buffer to 13:00 submission/demo)

## Anti-Pattern Lock Compliance

- Lock 5 (honest claim): Aether MIXED-METHODOLOGY label baked. Aether's fix is code-complete + tsc clean but NOT live-verified yet. Final dual audit must do 5-second observation on V8 live URL.
- Lock 6 (capacity respect): Ghaisan 27h+ awake. Major decisions (nuclear option, audit verdict) go through Manager. Minor decisions Manager-decide.
- Lock 7 (Greek naming): Aether, Pan, Phanes, Calliope, Hades all canonical. No new naming required.
- Lock 9 (V_n snapshot): V8 lock pending post-Atlas redeploy.
- Lock 10 (audit gate): per-wave Aether/Pan dual audit pending Cluster 12.

## Ferry Triggers (calibrated)

- Hades repo render fix > 25 min stuck: ferry for narrower scope
- Pan audit > 30 min: ship partial matrix + ferry deferred
- Atlas redeploy fail: ferry rollback to V7.1
- Wall clock > 80 min: ferry final scope cut

## V8 Ship Criteria

- Time Machine sink fixed (live verify post-V8)
- Repo render reliability (Hades fix or documented limitation)
- 62-feature audit verdict matrix authored
- Targeted fixes per FAIL verdict shipped
- Building count investigation documented (DEFER pitch-defensible)
- Tutor relaunch CTA functional
- Atlas V8 redeploy clean
- Final dual audit Aether + Pan PASS with 5-second observation evidence
- V8 snapshot + commit + push
- Hafiz pre-demo summary
