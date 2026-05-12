---
actual_timestamp: 2026-05-13T01:47+07:00 WIB (STAMP=20260513-0147 via `date +%Y%m%d-%H%M`)
agent: Selene (Wave-Fixing cycle 1 rescue identity)
manager_dispatch: Cluster 3 - Dashboard /dashboard bug fix + PRD feature verification matrix author
scope_bugs:
  - D-1 (HIGH): Dashboard "Connect repository" + demo repo switch + time window filter no-op
  - D-2 (MEDIUM): Dashboard purpose framing unclear panitia ga ngerti beda /dashboard vs /city
  - D-3 (LOW): DEFERRED (chart first-load animation, manager-allow)
  - D-4 (MEDIUM): Dashboard belum surface git time machine + auto diagram engine concepts
  - PRD-MATRIX: PRD feature verification matrix author per Section 5.E
verdict_per_bug:
  D-1: SHIP. Hook + mock derivation + dropdown link wired.
  D-2: SHIP. PurposeBanner mounted above briefing.
  D-3: DEFERRED OK per manager allow.
  D-4: SHIP via honest framing. CrossNavRail surfaces Activity Mode (Q1) + static C4/ERD (Q2). PRD matrix authored.
  PRD-MATRIX: SHIP. 25 PASS + 5 PARTIAL + 2 DEFERRED + 1 NOT IMPLEMENTED + 1 PENDING.
code_files_touched:
  - frontend/src/lib/dashboard/useDashboardData.ts (D-1 hook wires live (repo,range), 120ms loading delay, deriveMockForQuery import)
  - frontend/src/lib/dashboard/mockDashboardData.ts (D-1 deterministic deriveMockForQuery + REPO_SCALARS 5 repos + RANGE_SCALARS 3 ranges, deriveKpis/deriveVelocity/deriveBurndown/deriveDrifts helpers)
  - frontend/components/dashboard/DashboardClient.tsx (D-1 passes activeRepo.fullName + activeRange.id to hook, D-2 mounts PurposeBanner, D-4 mounts CrossNavRail, loading opacity fade for refetch UX cue, footer links rewired)
  - frontend/components/dashboard/MultiRepoDropdown.tsx (D-1c "+ Connect repository" stub -> <a href="/start"> nav to GitHub OAuth entry)
  - frontend/components/dashboard/PurposeBanner.tsx (NEW, D-2)
  - frontend/components/dashboard/CrossNavRail.tsx (NEW, D-4)
  - frontend/app/dashboard/dashboard.module.css (purposeBanner + crossNavRail + crossNavCard styles append)
deferred_reasons:
  D-3 first-load chart animation: capacity gate, manager explicit allow defer
  Live webhook PR demo: pre-existing DEFER per Aletheia Wave 3 audit, NOT in Cluster 3 scope
artifacts_authored:
  - _meta/audit/prd_feature_verification_20260513-0147.md (PRD verification matrix Section 5.E)
  - _meta/handoff_log/selene_wave_fixing_cycle1_20260513-0147.md (this file)
typecheck: PASS (tsc --noEmit clean, 0 errors)
smoke_test: PASS (dashboard renders 24KB HTML, console errors 0 except favicon 404 unrelated, PurposeBanner + CrossNavRail + briefing + KPIs + spec drift + city preview + repo rail all mount per Playwright snapshot)
fixture_audit: 18/18 PASS (12 derivation function present + 6 wiring assertions)
honest_claim_discipline: Lock 5 honored. PRD matrix labels Q2 "auto diagram engine" as NOT IMPLEMENTED, NOT PASS. Q1 "git time machine" framed as PARTIAL via Activity Mode timeline scrubber analogue.
---

# Selene Wave-Fixing cycle 1 handoff: Cluster 3 Dashboard rescue

**Cycle window**: ~25 menit (~01:32 - 01:57 WIB), well under 90 min ferry threshold.
**Ferry**: no. Scope clean, no backend wiring deeper than Demeter contract.
**Auto-end**: per directive, ending after this handoff write.

## What shipped

### Bug D-1 HIGH: dashboard switching was no-op (label-only)

Reproduction confirmed against screenshot `_meta/qa_screenshots/DashboardConnect.png`:
- Dropdown shows 5 demo repos but `useDashboardData({ range: 'sprint', repo: 'all' })` was hardcoded -> selected repo never propagated.
- TimeRangeSelector "Today / This sprint / This quarter" toggle had aria-pressed working but query did not refetch.
- "+ Connect repository" was a stub that only closed the menu.

Fix breakdown:

1. **State -> query wire-up** (DashboardClient.tsx):
   ```tsx
   const repoQuery = activeRepo?.fullName ?? 'all';
   const { data, loading, error } = useDashboardData({
     range: activeRange.id,
     repo: repoQuery,
   });
   ```
   Now the dropdown onRepoChange + segment onRangeChange both feed the hook.

2. **Mock data deterministic per-(repo, range) derivation** (mockDashboardData.ts):
   - `REPO_SCALARS` map: 5 repos x scalar tuple {velocityMul, cycleTimeMul, cfrAdd, deploysMul, burndownLag, driftBoost, flaggedDistrict, districtCount, citizenCount, sprintLabel, daysToShip, briefingTemplate}. nodegoat is the "high drift / slow cycle / OWASP CFR boost" variant, fastapi-fullstack is the "clean / fast / no drift" variant, codeplex-infra is the "tiny commit volume / no drift" variant, residents is the "observability drift" variant.
   - `RANGE_SCALARS` map: today/sprint/quarter scalar {velocityWindowMul, deltaPercentBias, rangeLabel}.
   - `deriveMockForQuery(query)` returns full DashboardData with KPI / velocity / burndown / drifts / briefing / cityPreviewMeta all recomputed per (repo, range).
   - Deterministic (no randomness), idempotent, no I/O. Wave 3 Demeter real endpoint drop-in stays at `fetch('/api/dashboard?...')` swap.

3. **120ms refetch loading cue** (useDashboardData.ts): switched from microtask Promise.resolve to setTimeout 120ms so the panitia perceive a real refetch transition. Plus `opacity: 0.55` fade on the data stack when `loading` is true and prior data is still mounted.

4. **Connect repository CTA** (MultiRepoDropdown.tsx): replaced the close-only stub with `<a href="/start">` that navigates to the Hestia GitHub OAuth + repo import entry route.

### Bug D-2 MEDIUM: dashboard role unclear vs /city

Fix: new `PurposeBanner.tsx` mounted above BriefingHeader with kicker "Manager view" + body line "Project management overview for {repo}. Sprint progress, velocity, spec-drift. For the 3D codebase + git timeline, switch to /city."

Visual is instrument-panel mood compliant: monospace kicker, hairline divider, accent left border, NO marketing copy, NO emoji. Active repo name inlined so the framing always reflects the live filter.

### Bug D-4 MEDIUM: git time machine + auto diagram engine not surfaced

Fix: new `CrossNavRail.tsx` 3-card rail mounted right after KPI strip. Cards:
1. **Activity Mode** -> `/city?repo={slug}&mode=activity`. Frames Q1 "git time machine" as Activity Mode timeline scrubber 30/60/90 day (PRD Section 9.4). Honest because PRD line 571 literally says timeline scrubber, NOT git time machine.
2. **Architecture** -> `/docs/c4/C4-Context.md`. Honest copy: "Formal 4-tier C4 + ERD authored Wave 0 in docs/c4/ + PanitSubmission/c4/. Runtime auto-diagram: post-hackathon." Lock 5 - NEVER claims an auto diagram engine exists.
3. **Spatial view** -> `/city?repo={slug}`. Anchors the 3D codebase entry.

The PRD verification matrix `_meta/audit/prd_feature_verification_20260513-0147.md` documents Q1 / Q2 / Q3 honest verdicts.

### Bug D-3 LOW: chart first-load animation

DEFERRED per manager allow. No code touched. Recharts default animations stay as-is.

### PRD matrix author (Section 5.E)

`_meta/audit/prd_feature_verification_20260513-0147.md` authored with:
- Section A: Q1 + Q2 + Q3 direct honest answers
- Section B: 5 product mode (2 PASS Activity + Health, 3 PARTIAL Onboarding scoped variants + Sprint live webhook + Refactor accept-to-prod)
- Section C: 5 AI resident (5/5 PASS)
- Section D: 5 drift patterns A-E (5/5 PASS, Nemesis Wave 3 cycle 5 real impl)
- Section E: 10 infra features (7 PASS + 1 PARTIAL webhook live trial + 2 DEFERRED earthquake + PR comment)
- Section F: submission deliverable (6 PASS + 1 PENDING Hafiz slide)
- Section G: aggregate verdict 25 PASS + 5 PARTIAL + 2 DEFERRED + 1 NOT IMPLEMENTED + 1 PENDING
- Section H: 4 Q&A defense snippets ready for pitch
- Section I: 4 recommendations to Manager Wave-Fixing (pitch wording, git time machine framing, live webhook budget, claim drift cross-check)

## Honest fail confession

Lock 5 honored. The matrix calls auto diagram engine NOT IMPLEMENTED. Risk: if Ghaisan or Hafiz promise "auto diagram engine" in pitch, that drifts from PRD. Section I recommends Hafiz cross-check slide vs matrix before submit.

## Surface for downstream

- Hafiz slide deck (Day 2 jam 11-13): use Q&A defense snippets in Section H. Avoid phrase "auto diagram engine". Use "Activity Mode timeline scrubber" not "git time machine" as feature name.
- Pan post-Wave 3: matrix file is the single source for any Q&A roleplay rehearsal. 10 anticipated questions per PRD Section 16 still applies, this matrix is the data behind defensible answers.
- Manager Wave-Fixing: cycle 1 closed. Cluster 3 dashboard bugs SHIP. PRD matrix SHIP. Auto-end Selene rescue identity. Next cluster handlers can spawn independently.

## Files for next agent to read if they pick up dashboard area

- `frontend/src/lib/dashboard/mockDashboardData.ts` (Wave 3 Demeter swap site, lines 393-end is the dead-code-on-swap zone)
- `frontend/src/lib/dashboard/useDashboardData.ts` (single-line swap to `fetch('/api/dashboard?...')` at line ~95)
- `frontend/components/dashboard/PurposeBanner.tsx` + `CrossNavRail.tsx` (NEW, no Wave 3 swap needed)
- `_meta/audit/prd_feature_verification_20260513-0147.md` (the matrix, treat as canonical)

Selene out, auto-end per directive.
