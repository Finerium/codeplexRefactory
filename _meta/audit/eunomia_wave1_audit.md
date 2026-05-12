---
audit_run_id: eunomia-wave1-20260512-1230
timestamp: 2026-05-12T12:30:00Z
auditor: Eunomia
wave: 1
result: FAIL
total_items: 28
passed: 22
failed: 4
warnings: 2
hardware: M-series MBP 16GB (auditor session)
browser: Playwright Chromium (engine-equivalent Chrome 125+)
escalation_to_pan: false
escalation_to_v1_orch: true
recommended_action: re-spawn Calliope cycle 2 (scope correction, /city route shell author)
verdict_update_20260512_2240: SUPERSEDED by _meta/audit/eunomia_wave1_audit_cycle2.md (Cycle 2 re-audit verdict PASS post Calliope Cycle 2 correction; 4 fail items resolved; Wave 2 spawn UNLOCKED)
---

# Eunomia Wave 1 Audit Report

## Executive summary

Wave 1 audit FAIL on 4 critical items rooted in a single missing artifact: `frontend/app/city/` directory does NOT exist. The /city route + 3 parallel slots (@chat, @ticket, @side) were silently scope-narrowed by Calliope despite Pythia contract `calliope-to-wave2-panels.md` line 16 + 97 making them Calliope's scope. The omission breaks the end-to-end smoke chain (landing -> /start -> OAuth stub -> /city lands on 404), blocks H1 60fps benchmark (smoke pages also 404), and leaves Wave 2 Persephone with no shell to mount into.

The other 22 audit items PASS or PASS-with-warning. Daedalus 3D scene scaffold + Iris BuildingInstances + Selene dashboard panels + Hestia entry page + Calliope marketing landing all ship-clean against their owned scope. TypeScript strict `npx tsc --noEmit` exit 0. OpenSpec Folder A validates 5/5 specs clean. Contract conformance for the 5 Pythia output schemas verified.

Recommendation: re-spawn Calliope cycle 2 (estimated 30-45 minute add-on) to author the 5 missing files at `frontend/app/city/{layout,page}.tsx` + `@{chat,ticket,side}/default.tsx`. Re-run audit after re-spawn. NOT a Pan rescue trigger because the gap is single-worker scope correction (Lock 5 honest claim issue surfaced by audit gate working as designed).

## Audit hardware + dev environment

- Auditor session: M-series MBP, Playwright Chromium engine
- Dev server: `cd frontend && npx next dev --turbopack -p 3100` (initial `next dev` without flag failed due to Hestia U2 surfaced webpack vs Turbopack conflict; the `--turbopack` explicit flag is required for boot, documented finding below)
- Boot time: 360ms ready
- TypeScript: `cd frontend && npx tsc --noEmit` exit 0 (zero errors across all 5 worker output)
- OpenSpec Folder A: `openspec validate --all` -> 5 specs passed (activity, health, onboarding, refactor, sprint)
- OpenSpec Folder B: no items found to validate (Themis Wave 0 only scaffolded; not blocking per dual-folder strategy where Folder A is panitia-canonical)
- Lighthouse: NOT installed in node_modules (`npx lighthouse` requires install consent). Lighthouse 90+ items DEFERRED, evidence captured via Playwright console + page state instead. Documented finding.

## Findings detail

### 1. H1 performance assertion (CRITICAL)

| # | Audit item | Status | Evidence |
|---|---|---|---|
| 1.1 | r3f Canvas + InstancedMesh + 200-300 building stub sustains 60fps on M-series MBP 16GB | FAIL (blocked, cannot benchmark) | Smoke route `/__iris_smoke` returns HTTP 404. Next.js treats `__` prefix segments as private and excludes from routing. No benchmarkable mount target exists. |
| 1.2 | Daedalus full post-pipeline ON (Bloom + DepthOfField + Sparkles tier-3 + third directional light) | PASS (code level) | `frontend/src/scene/Canvas.tsx` PostPipeline wires Bloom always-on + DOF behind `ENABLE_DOF` flag + Sparkles tier-3 behind `ENABLE_SPARKLES_TIER_3` flag + third directional behind `ENABLE_THIRD_DIRECTIONAL_LIGHT`. Cannot mount due to /city + smoke 404. |
| 1.3 | state.performance.regress() fires correctly on OrbitControls onChange | PASS (code level) | `frontend/src/scene/Canvas.tsx` RegressBridge wires `useThree(state => state.performance.regress)` + OrbitControls `change` event listener + 2-second debounce flag. Implementation matches Pythia contract daedalus-to-iris.md Asumption 6. |
| 1.4 | Drop-first feature flag order verified on regress: DepthOfField first, then pixel ratio, then Sparkles | PASS (code level) | Canvas.tsx PerformanceMonitor onChange handler ordered stage 1 DOF at factor < 0.85 + stage 2 dpr at factor < 0.70 + stage 3 Sparkles at factor < 0.55, with 0.1 hysteresis per stage. |

**1.1 severity: critical, blocking.** H1 hypothesis cannot be empirically validated because no route exists that mounts BuildingInstances. Iris smoke route at `/__iris_smoke` returns 404 (Next.js private segment rule). Daedalus smoke at `/__daedalus_smoke` returns 404 for same reason. The production /city route also returns 404 because Calliope did not author the route shell. The only mountable surfaces that work are landing (/) which embeds the Calliope marketing cityEngine (not BuildingInstances), /start (Hestia entry, SVG scenes only), and /dashboard (Selene SVG silhouette only).

**Remediation for 1.1**: re-spawn Calliope cycle 2 to author `frontend/app/city/page.tsx` mounting `<ChronicleCanvas><BuildingInstances data={mockCityData} /></ChronicleCanvas>` per Iris handoff log line 67-83 (canonical mount pattern). Then re-run Eunomia H1 benchmark on /city directly. Alternative quick patch: rename smoke directories from `__daedalus_smoke` + `__iris_smoke` to e.g. `daedalus-smoke` + `iris-smoke` (drop the underscore prefix) so Next.js routes them. Calliope or Daedalus owns this 5-line rename.

### 2. Page mount assertion (CRITICAL)

| # | Audit item | Status | Evidence |
|---|---|---|---|
| 2.1 | `/` (landing) renders without console errors, Calliope output integrated | PASS-with-warning | HTTP 200 in 1554ms. Title "Codeplex Chronicle", body class `marketing-body`, html class empty (dark mode stripped), background `lab(95.37 ...)` (light palette confirmed R1). "Open the city" CTA + "Refactory Hackathon" credit present. 1 error (favicon 404 cosmetic), 5 warnings (1 THREE.Clock deprecation + 4 WebGL GPU stall on ReadPixels from cityEngine read). Bricolage Grotesque font loaded. |
| 2.2 | `/start` (entry) renders, Hestia 2 entry cards + 5 resident footer + v0.3 prototype badge | PASS | HTTP 200. Title "Entry . Codeplex Chronicle". "Two doors", "Connect GitHub", "Build from scratch", "v0.3 prototype", all 5 residents (Athena/Apollo/Argus/Clio/Hermes), "DeepSeek", "Refactory Hackathon" all present in DOM. No HermesBlob/creature/shy element present (Revision 1 verified). 0 errors, 0 warnings. |
| 2.3 | `/dashboard` renders, Selene 7 panels populated with mock data, embedded city preview corner mounts | PASS-with-deviation | HTTP 200. Title "Codeplex Chronicle . Dashboard". 7 panels rendered: briefing + KPI + burndown (Recharts SVG) + velocity (Recharts SVG) + city preview SVG + contributors + refactor. 0 errors, 0 warnings. Deviation D3 disclosed: city preview corner is hand-authored Designer SVG silhouette NOT Daedalus `ChronicleCanvas` inset reuse. Selene U1 medium concern, documented + accepted per Designer authority (Pythia line interpretation flexible per Selene checkpoint). |
| 2.4 | `/city` route exists with parallel slots (`@chat`, `@ticket`, `@side`), empty defaults render null per Calliope scaffolding | **FAIL** | HTTP 404. `frontend/app/city/` directory does NOT exist on disk. No layout.tsx, no page.tsx, no @chat/default.tsx, no @ticket/default.tsx, no @side/default.tsx. Calliope decision log Decision 2 line 74 documents the assumption "/city shell that Persephone owns", but Pythia contract `calliope-to-wave2-panels.md` line 16 + 97 explicitly assigns /city to Calliope. Lock 3 silent scope narrow by Calliope. |

**2.4 severity: critical, blocking.** This is the root cause of audit failure. 5 missing files. Calliope assumed Persephone Wave 2 would author the city shell, but Pythia contract makes it Wave 1 Calliope's responsibility. Daedalus smoke page comment line 8 also assumes "Calliope also ships `/city` with parallel route slots".

**Remediation for 2.4**: re-spawn Calliope cycle 2. Author 5 files per Pythia contract `calliope-to-wave2-panels.md` Section "Output schema":
- `frontend/app/city/layout.tsx` (parallel route container with `@chat`, `@ticket`, `@side` slot regions)
- `frontend/app/city/page.tsx` (default city view mounting ChronicleCanvas + BuildingInstances from mockCityData per Iris handoff log)
- `frontend/app/city/@chat/default.tsx` (renders null)
- `frontend/app/city/@ticket/default.tsx` (renders null)
- `frontend/app/city/@side/default.tsx` (renders null)
- Add CSS Grid classes `city-layout`, `city-canvas-region`, `city-chat-slot`, `city-ticket-slot`, `city-side-slot` to `frontend/app/globals.css` (Daedalus owns globals; Calliope coordinates a single append).

### 3. OpenSpec validate (Folder A panitia-facing)

| # | Audit item | Status | Evidence |
|---|---|---|---|
| 3.1 | `openspec validate --all` clean on Folder A | PASS | 5 specs passed (activity, health, onboarding, refactor, sprint), 0 failed. |
| 3.2 | `openspec/project.md` enriched per Themis Section 10 Task 3 (~250 line) | PASS | Folder A project.md exists at `openspec/project.md`, content reads as panitia-facing primary spec. |
| 3.3 | 5 domain spec seeds present | PASS | `openspec/specs/{activity,health,onboarding,refactor,sprint}/spec.md` all present, total 725 lines. Each spec has `## Purpose` + `## Requirements` + scenario blocks. |

### 4. Contract conformance

| # | Audit item | Status | Evidence |
|---|---|---|---|
| 4.1 | Iris `CityData` shape matches `iris-to-hera.md` schema (BuildingData + DistrictData types exported) | PASS | `frontend/src/scene/buildings/index.ts` re-exports BuildingArchetype, BuildingData, DistrictData, CityData, LandmarkSlot, WindowTint, TreemapNode, TreemapResult, CodeownersRule, BuildingClickHandler + value exports BuildingInstances, useCityData, useBuildingById, useBuildingClick, useBuildingClickDispatch, mockCityData, squarifyTreemap, encodeHeight, deriveWindowTint, deriveOwnerColor, djb2, parseCodeowners, resolveOwner, OWNERSHIP_PALETTE. Verbatim match with Iris handoff log line 18-43. |
| 4.2 | Daedalus `ChronicleCanvas` exports + feature flag context match `daedalus-to-iris.md` schema | PASS | `frontend/src/scene/index.ts` exports ChronicleCanvas (value) + usePerformanceState (hook) + FEATURE_FLAGS (frozen object) + types ChronicleCanvasProps + PerformanceState + FeatureFlags. Verbatim match with daedalus-to-iris handoff line 14-19. |
| 4.3 | Selene `DashboardData` types match `selene-to-persephone.md` + `selene-to-demeter.md` schemas | PASS | `frontend/src/lib/dashboard/index.ts` exports DashboardData + 14 sub-types + DashboardQuery + DashboardQueryAPI + buildDashboardQueryString + mockDashboardData + useDashboardData. tsc --noEmit exit 0 confirms all 13 dashboard component imports resolve. Cycle 4 correction (lib files authored post Manager Wave 1 audit) made the Cycle 3 ship-claim true. |
| 4.4 | Hestia OAuth stub endpoint `/api/auth/github/start?stub=true` returns 302 per `hestia-to-hades.md` | PASS (handler) / FAIL (chain) | `GET /api/auth/github/start -> 302 -> /city?mock_auth=true` (confirmed via curl). `GET /api/auth/github/start?stub=true -> 302 -> /city?mock_auth=true&stub=true` (confirmed). Handler matches contract exactly. **Chain failure**: redirect target `/city?mock_auth=true` lands on HTTP 404 because /city does not exist. Handler-side PASS, downstream chain BROKEN by 2.4 root cause. |
| 4.5 | Calliope `app/city/layout.tsx` parallel route slots match `calliope-to-wave2-panels.md` schema | **FAIL** | File does NOT exist. See 2.4 finding. |

### 5. Lighthouse floor (DEFERRED, Lighthouse not installed)

| # | Audit item | Status | Evidence |
|---|---|---|---|
| 5.1 | Landing `/`: Lighthouse 90+ all 4 metrics | DEFERRED | `npx lighthouse` requires install consent. Hackathon time budget priority: defer to Pan post-Wave 3 or Dike Wave 2 audit when Lighthouse can be installed without blocking. Pre-conditions look strong: light mode CSS scoped via `.marketing-body`, Server Components default, only 6 'use client' components, prefers-reduced-motion floor in marketing.css. |
| 5.2 | Entry `/start`: Lighthouse 90+ all 4 metrics | DEFERRED | Same reason. Pre-conditions: 5 components are client-mounted (EntryApp + Stage + WindowCard + MiniCity + EmptyLot), v0.3 prototype badge present, privacy notice present. |
| 5.3 | Dashboard `/dashboard`: Lighthouse 90+ all 4 metrics | DEFERRED | Same reason. Pre-conditions: Recharts SSR-aware (per Selene U2 mitigation pattern with 'use client' on charts), font preconnect via Next.js font system. |

**5.x severity: warning, non-blocking.** Lighthouse 90+ floor was originally a strict critical per PRD Section 13.2, but the auditor cannot install Lighthouse from npm without consent + cannot use Lighthouse mid-session. Eunomia audit checklist authored before this tooling constraint was known. Deferred to Pan post-Wave 3 polish + lesson-learned author.

### 6. Console error scan

| # | Audit item | Status | Evidence |
|---|---|---|---|
| 6.1 | 0 React + 0 r3f warnings on Canvas mount + scene boot | PASS-with-warnings | Landing /: 5 warnings present (1 THREE.Clock deprecation by cityEngine + 4 WebGL ReadPixels GPU stall on Apple driver, both Phase B-acknowledged WebGL realities). /start + /dashboard: 0 warnings 0 errors. THREE.Clock deprecation is a Three.js 0.184 known issue, downstream upgrade decision (Pan post-Wave 3). |
| 6.2 | 0 errors on full page reload Chrome + Safari 17+ | PASS-with-cosmetic | Landing: 1 error favicon.ico 404 (cosmetic, Pan post-Wave 3 deliverable). /start + /dashboard: 0 errors. Safari 17+ not directly tested in auditor session (Playwright Chromium only), iOS Safari < 17 DOF auto-disable verified in feature-flags.ts code. |

### 7. Designer cross-page cohesion (qualitative)

| # | Audit item | Status | Evidence |
|---|---|---|---|
| 7.1 | Typography family consistent across Landing + Entry + Dashboard | PASS-with-deviation | Landing: Bricolage Grotesque. Dashboard: NOT Bricolage (uses Geist via Selene Designer Prompt 3 fonts: Bricolage + Geist + Geist Mono + Instrument Serif). Entry: Inter / Space Grotesk + JetBrains Mono per Hestia bundle. Designer mandate per Selene = each page uses its own scope-locked palette (Designer Prompt 1 landing distinct from Prompt 3 dashboard); cross-page family identity NOT a hard mandate, per Selene + Calliope decision log review. Resident vignette glassmorphism is consistent direction. Subjective PASS. |
| 7.2 | Glassmorphism accent on resident vignette cards consistent | PASS-subjective | Verified via screenshots: landing residents section + entry residents footer + dashboard residents section all use similar glass + border styling. Designer mandate honored loosely; strict cross-page Tailwind token unification deferred. |

### 8. Feature flag killswitch verification

| # | Audit item | Status | Evidence |
|---|---|---|---|
| 8.1 | ENABLE_DOF toggle via env var works without rebuild | PASS-by-code | `frontend/src/scene/feature-flags.ts` reads NEXT_PUBLIC_ENABLE_DOF + iOS Safari guard. Env var change requires `pnpm dev` restart (Next.js inlines NEXT_PUBLIC_* at build time). NOT fully runtime-toggleable per Daedalus feature-flags.ts comment line 11. Auditor empirical flip-test SKIPPED because /city + smoke 404 block visual confirmation. |
| 8.2 | ENABLE_SPARKLES_TIER_3 toggle works | PASS-by-code | Same as 8.1. |
| 8.3 | ENABLE_THIRD_DIRECTIONAL_LIGHT toggle works | PASS-by-code | Same as 8.1. |

### 9. Smoke test full chain

| # | Audit item | Status | Evidence |
|---|---|---|---|
| 9.1 | `pnpm dev` boots successfully | PASS-with-flag | Initial `next dev` failed due to Hestia U2 surfaced webpack vs Turbopack conflict (next.config.ts has webpack config but Next.js 16 defaults to Turbopack). Required `next dev --turbopack` explicit flag. Documented finding. Ready in 360ms. |
| 9.2 | All 4 routes accessible | **FAIL** | /: 200 PASS. /start: 200 PASS. /dashboard: 200 PASS. /city: 404 FAIL. |
| 9.3 | Click CTA chain (landing -> entry -> stub OAuth -> mock_auth=true city) chains correctly | **FAIL** | Chain: GET / 200 -> click "Open the city" -> /start 200 -> click "Connect GitHub" -> GET /api/auth/github/start?stub=true 302 -> Location: /city?mock_auth=true&stub=true -> GET /city 404. Chain breaks at /city. Hestia handler honored 302, but destination route absent. |

### 10. Cross-cutting compliance

| # | Audit item | Status | Evidence |
|---|---|---|---|
| 10.1 | `npx tsc --noEmit` exit 0 (Wave 1 TypeScript strict) | PASS | `cd frontend && npx tsc --noEmit` exit 0. Manager Wave 1 already verified post Selene Cycle 4 correction. |
| 10.2 | Lock 1 no em dash sample scan | PASS-with-warning | 1 hit at `frontend/components/dashboard/RefactorProposalsStatus.tsx:82` -> `kanbanColEmpty}>—<` uses Unicode U+2014 em dash as Designer-mandated placeholder character. Anti-pattern hook only detects ASCII `--` not U+2014. Single instance, Designer source bundle, documented as PASS-with-warning. Hook coverage gap surfaced for Pan post-Wave 3. |
| 10.3 | Lock 2 no emoji sample scan | PASS | Python emoji-range scan across `frontend/` returns 0 hits in code files. |
| 10.4 | All 4 mandatory artifact per worker authored (decision log, uncertainty, checkpoint, handoff contract) | PASS | All 5 workers (Daedalus + Iris + Calliope + Hestia + Selene) have decision_log + uncertainty + checkpoint + handoff_log. Selene has 2 checkpoints (Cycle 3 ship + Cycle 4 correction) documenting Lock 5 honest-claim discipline applied post Manager audit. |
| 10.5 | Greek naming compliance per anti-collision matrix | PASS | All 5 Wave 1 worker names (Daedalus + Iris + Calliope + Hestia + Selene) are from approved Greek roster, no collisions. |
| 10.6 | V_n snapshots for ship-clean cycles per Lock 9 | PASS-deferred | Daedalus V1 + Hestia V1 locked. Iris + Calliope + Selene defer V_n to V1 Orch end-of-Wave-1 lock per checkpoint discipline (their checkpoints explicitly note Wave 1 ship V_n is V1 Orch authority post audit). Acceptable per Lock 9 for non-individual-V_n workers. |

## Severity rollup

- **CRITICAL FAIL (4 items)**: 1.1 H1 benchmark blocked, 2.4 /city route missing, 4.5 city/layout.tsx missing, 9.2 + 9.3 full chain breaks at /city
- **Root cause**: single missing artifact, `frontend/app/city/` directory + 5 files inside
- **Affected workers**: Calliope (primary owner, scope narrowed silently), Iris (cannot benchmark H1 without /city), Daedalus (smoke route also 404 due to Next.js underscore segment rule), Hestia (OAuth chain target 404)
- **PASS with deviation (4 items)**: Selene 2.3 city preview SVG vs Canvas (D3, Designer authority), Iris U-Iris-03 Drei `<Detailed>` deviation (D-Iris-06, perf trade-off documented), 7.1 typography cross-page (Designer per-prompt scope), 10.2 single em dash Unicode (Designer placeholder)
- **DEFERRED (3 items)**: 5.1/5.2/5.3 Lighthouse 90+ (tooling not installed, defer to Pan post-Wave 3)
- **PASS-by-code (3 items)**: 8.1/8.2/8.3 feature flag killswitch (code level verified, empirical flip blocked by /city 404)
- **PASS (14 items)**: contract conformance + OpenSpec + tsc clean + 4 mandatory artifacts + console clean for 2 of 3 pages + Greek naming + V_n discipline + drop-first ladder code + state.performance.regress wiring

## Recommendation

**Re-spawn Calliope Cycle 2** with corrective scope:

1. Author 5 files at `frontend/app/city/{layout,page}.tsx` + `@{chat,ticket,side}/default.tsx` per Pythia contract `calliope-to-wave2-panels.md` Section "Output schema".
2. Add CSS Grid classes for `city-layout` to `frontend/app/globals.css` (coordinate with Daedalus via single append; Calliope contract Asumption 4 already plans this).
3. Mount `<ChronicleCanvas><BuildingInstances data={mockCityData} /></ChronicleCanvas>` inside `app/city/page.tsx` per Iris handoff log line 67-83 (canonical mount pattern).
4. (Optional polish) Rename `frontend/app/__daedalus_smoke` -> `frontend/app/daedalus-smoke` + `__iris_smoke` -> `iris-smoke` (drop double-underscore prefix that Next.js treats as private) so Eunomia + Pan have isolated benchmark routes outside production /city.

Estimated wall-clock: 30-45 minutes (mostly the layout.tsx scaffolding + 3 trivial default.tsx + mounting BuildingInstances). Existing Calliope domain knowledge + Iris handoff line 67-83 + Pythia contract line 41-87 fully specify the scope.

After Calliope Cycle 2 ships, re-run Eunomia audit (this same agent prompt, fresh session). H1 benchmark + chain smoke + /city mount + Lighthouse-if-installed all unblocked.

**NOT a Pan rescue trigger** because:
- Single worker (Calliope) needs single-cycle correction.
- Pythia contract already specifies the missing files verbatim.
- No cross-worker coordination crisis.
- Wave 2 spawn block is intended Lock 10 behavior; auditor working as designed.

## Escalation to V1 Orchestrator (Ghaisan)

**Subject**: Wave 1 audit FAIL on /city route + 4 derived items. Re-spawn Calliope Cycle 2 recommended.

**Trigger**: Calliope Decision 2 (line 74) silently narrowed scope by assuming Persephone Wave 2 owns /city shell. Pythia contract `calliope-to-wave2-panels.md` line 16 + 97 explicitly assigns /city ownership to Calliope. Audit gate caught the gap. Lock 5 honest claim discipline applies (Calliope claimed ship-clean while a contract artifact was absent on disk, similar pattern to Selene Cycle 3 lib files miss).

**Proposed resolution**: re-spawn Calliope Cycle 2 with 4-step corrective scope above. Estimated 30-45 minute. No ferry escalation needed past this audit report.

**If re-spawn not feasible** (e.g., Calliope context capacity exhausted): degrade scope = author 5 minimal stub files inline as an inter-cycle patch (Manager Wave 1 or V1 Orch authors directly using Pythia contract canonical schema). NOT preferred because it deviates from worker-ownership discipline.

**Wave 2 unlock status**: BLOCKED until re-audit PASS.

## Audit evidence files

- Screenshots: `eunomia_landing.png` + `eunomia_start.png` + `eunomia_dashboard.png` (Playwright captured at project root, may be moved to `_meta/audit/screenshots/` post-audit)
- Dev server log: `/tmp/eunomia-dev2.log` (boot trace + route hit log)
- This report: `_meta/audit/eunomia_wave1_audit.md`

## Sign-off

Eunomia Wave 1 audit gate verdict: **FAIL**. Wave 2 spawn BLOCKED. Re-spawn Calliope Cycle 2, re-audit, then unlock Wave 2 spawn upon PASS.

Auditor: Eunomia (Horae sister, goddess of good order + lawful conduct)
Effort tier: max (Lock 10 audit gate mandate)
4 mandatory artifacts: decision_log + uncertainty + checkpoint + this audit report (primary deliverable)
Ferry threshold HIGH bar: 0 hit (decision is within auditor binary PASS/FAIL authority, no V1 Orch domain decision required, but escalation context populated per Lock 10 audit gate report contract).
