# Decision Log: Calliope (Wave 1)

**Worker**: Calliope
**Wave**: 1
**Role**: Landing page Awwwards-tier executor, Designer Prompt 1 bundle port
**Started**: 2026-05-12 19:00 WIB

Append-only log. Each entry captures a decision with rationale + alternatives considered. Entry titles are bracketed.

---

## [Decision 1] Light mode lock + 3 bug fix post-bundle port

**Date**: 2026-05-12 19:30 WIB
**Cycle**: 2 (post bundle 1-to-1 port)
**Severity**: High (visual quality bar lock + downstream cohesion)

**Context**: Designer Prompt 1 bundle landed in `_meta/designer/prompt1-landing/handoff-bundle-extracted/refactory-landing-page/project/` shipped Direction "Glass Tower at 3AM" (dark default + daybreak toggle). Ghaisan picked Direction 1 verbally at claude.ai/design. Post-port, V1 Orch directive received 4 revisions to apply:

1. Revision 1: Light mode lock, dark mode entire code path retired.
2. Revision 2: Trinity code-art font color swap a8d4ff to Matrix green 00ff41 for terminal-hacker legibility.
3. Revision 3: Hero vignette dark halo removed entirely from DOM.
4. Revision 4: Residents grid dividers swapped from `--line-2` alpha 0.20 to `--line` alpha 0.45 for visibility in light mode.

**Decision**: Applied all 4 revisions during port (not as a second-pass), baking the production values into the source files so the dark mode code path can never regress through hot path. Specifically:

- `TWEAK_DEFAULTS` in `components/marketing/MarketingShell.tsx` locked to `{fogDensity: 0.22, motionIntensity: 1.4, dayMode: true, windowGlow: 1.4, labelsVis: 'scroll-only'}`.
- `MarketingThemeLock` client component sets `html.dataset.mode = 'day'` on mount + strips Daedalus's `dark` class on html + replaces body class with `marketing-body` so the route-scoped palette wins. Reverts on unmount so other routes keep Daedalus's dark.
- `lib/marketing/cityEngine.ts` `setMode()` is now a no-op that forces palette = day on every call. Boot is forced day palette directly. Any future caller flipping back to night is silently coerced to day.
- TweakToggle for "Daybreak (opt-in light)" omitted entirely (panel itself is omitted from the production landing port since Tweaks were design-time only).
- `TrinityArt.tsx` every `fill="#a8d4ff"` and `stroke="#a8d4ff"` swapped to constant `CODE_GREEN = '#00ff41'`. Warm amber accents `#ffb060` preserved as secondary. `<g style={{ filter: 'drop-shadow(0 0 6px #00ff4188)' }}>` wraps the code text group for terminal-hacker glow.
- `marketing.css` `.vignette` rule set to `display: none` (defensive null) and the `<div class="vignette">` removed from `MarketingShell.tsx` markup entirely (DOM clean per V1 Orch recommendation).
- `marketing.css` `.res-grid` border-top swap to `var(--line)`, `.res-card` border-right swap to `var(--line)`, mobile breakpoint `.res-card` border-bottom also swap to `var(--line)`.

**Alternatives considered**:

- (A) Keep `dayMode: false` default + leave the bundle's dark-mode-also-supported code path intact, document that Ghaisan flips toggle manually on demo day. Rejected because the directive specifies dark mode retire entire code path; manual flip risks regression under demo stress.
- (B) Apply Revision 2 as global `:root { color: #00ff41 }` instead of targeted SVG fill. Rejected because the broader CSS rule would bleed into resident name labels (`fill="#ffe2c4"`) and break the warm-cool 3-color palette intent.
- (C) Apply Revision 4 by swapping `--line-2` opacity from 0.20 to 0.45 globally. Rejected because `--line-2` is also used by other dividers (`.trinity-rail .step border-top`, `.sprint-stat background`, hero meta blocks, mode-card inset shadow) where the lighter alpha is intentional restraint.

**Impact downstream**:

- Eunomia (Wave 1 auditor) checklist Designer cohesion item: light palette stays consistent with Hestia Entry warm-welcoming light + Selene Dashboard instrument-panel. No conflict.
- Persephone (Wave 2, chat-panel routing) consumer: city layout shell at `/city` is owned by Daedalus + Persephone, untouched here. Marketing route group at `/` is route-scoped via `(marketing)` group.
- Hestia (Wave 1, entry page): `ShyCreature` reusable component shipped in `components/marketing/ShyCreature.tsx`. Hestia can import same path with single-creature override (Hermes only) per Designer Prompt 2 line 138.

**Verification**:

- TypeScript `tsc --noEmit` passes for all Calliope-owned files (no errors in `app/(marketing)/*`, `components/marketing/*`, `lib/marketing/*`). Remaining errors are Iris's `CodeownersRule` export and Selene's chart Formatter type, neither in Calliope scope.
- Next.js `next build --webpack` compiles Calliope source successfully (failures gated by parallel worker code in dashboard scope).
- Dev server smoke test (`next dev --webpack -p 3000`) at http://localhost:3000/ returns HTTP 200 with all key phrases present ("Open the city", "Refactory Hackathon Round 03", "Tim Duopoly").
- Playwright headless inspection confirms:
  - `htmlMode=day`, `htmlClass=""` (no dark class), `bodyComputedBg=oklch(0.96 0.008 240)` light palette.
  - `vignetteExists=false`, DOM clean.
  - `resGridBorderTop=oklch(0.3 0.014 90 / 0.45)` = --line alpha 0.45.
  - `trinityCodeStrokeFirst=rgb(0, 255, 65)` = Matrix green.
  - Trinity step machine progresses correctly under scroll (II. AI residents move in at scroll 3.5x viewport).
- 0 console errors except favicon 404 (cosmetic; Pan post-Wave 3 deliverable).

**Reference**: V1 Orch directive 2026-05-12 19:00 WIB; PRD Section 13.2 visual quality bar; Designer Prompt 1 bundle 17 file at `_meta/designer/prompt1-landing/handoff-bundle-extracted/refactory-landing-page/project/`.

---

## [Decision 2] Path layout coordination with Daedalus, marketing route group strategy

**Date**: 2026-05-12 19:35 WIB
**Cycle**: 2 (mid-port)
**Severity**: Medium (workspace topology coordination)

**Context**: Daedalus bootstrapped frontend with `frontend/app/` (root) + tsconfig `paths: @/* -> ./src/*` (for `@/scene` alias). My initial Calliope spec said `frontend/components/landing/` and the V1 Orch directive said `frontend/components/marketing/`. Wrote files to `frontend/src/app/` initially per tsconfig alias intuition, then realized Next.js auto-picks `app/` over `src/app/` when both exist.

**Decision**: Migrated Calliope files to canonical locations:

- `frontend/app/(marketing)/page.tsx` + `frontend/app/(marketing)/layout.tsx` + `frontend/app/(marketing)/marketing.css` (route group group, lets `/` resolve to marketing landing without affecting `/city` shell that Persephone owns).
- `frontend/components/marketing/*.tsx` (12 component files).
- `frontend/lib/marketing/cityEngine.ts` (vendored Three.js city port, marketing-only).

Imports use relative paths (`'../../components/marketing'`) rather than alias since `@/*` maps only to `src/*` (Daedalus convention).

`MarketingThemeLock` client component handles per-route palette: on mount sets `html.dataset.mode='day'` + strips `dark` class + sets body class to `marketing-body`; on unmount reverts. This keeps Daedalus's dark globals.css active everywhere except inside the marketing route group.

**Alternatives considered**:

- (A) Author my own `app/layout.tsx` and ignore Daedalus's. Rejected (would clobber Daedalus's metadata + tailwind base + canvas styling for `/city`).
- (B) Update Daedalus's `app/layout.tsx` to be route-aware. Rejected (lock 3 silent scope narrow risk; Daedalus owns that file).
- (C) Use a separate `(app)` route group alongside `(marketing)`. Rejected as overkill; existing Daedalus topology already isolates `/city` etc by individual page routes.

**Verification**: Curl http://localhost:3000/ returns HTTP 200 + correct landing markup. Daedalus's `/dashboard` route still returns HTTP 200 (parallel coexistence intact, observed in dev server log).

**Reference**: Daedalus's `frontend/tsconfig.json` (paths config), Daedalus's `frontend/app/layout.tsx` (dark className).

---

## [Decision 3] Vendored cityEngine independent of Daedalus's @/scene

**Date**: 2026-05-12 19:45 WIB
**Cycle**: 2 (mid-port)
**Severity**: Low (clean separation of marketing vs production scene)

**Context**: Designer Prompt 1 bundle `city.js` is a stand-alone Three.js volumetric city for the marketing landing's fixed-canvas backdrop. Daedalus's `@/scene/Canvas.tsx` is the production code-as-city renderer mounted at `/city` (Wave 2 Hera/Asclepius/Boreas wire scene modes). These are two distinct scenes.

**Decision**: Port `city.js` as `frontend/lib/marketing/cityEngine.ts` (ES module, returns a `CityController` factory). Do NOT touch `frontend/src/scene/*` (Daedalus territory). `MarketingShell` calls `initCity(canvas)` once on mount, disposes on unmount. Defensive try/catch around init swallows WebGL failures so the page text remains legible without the canvas (graceful degrade for iOS Safari < 17 or Linux GPU lacking shaders).

**Alternatives considered**:

- (A) Pivot the marketing landing to use Daedalus's `ChronicleCanvas` with mock building data. Rejected; the Designer bundle scene is visually distinct (cinematic camera waypoints over 60-unit obsidian skyline, NOT the production treemap city). Reusing ChronicleCanvas would force Iris's treemap algo on marketing data and dilute the visual.
- (B) Drop the canvas entirely, paint a static SVG backdrop. Rejected; the cinematic moving city is core to Direction 1 mood ("Glass Tower at 3AM, city outside the window is the protagonist").

**Verification**: Playwright `cityCanvasExists=true`, canvas paints; no console errors from cityEngine.

**Reference**: Designer Prompt 1 bundle `city.js`, intent.md Direction 1.

---

## [Decision 4] Cycle 2 correction: /city shell + parallel slots authored post-Eunomia FAIL

**Date**: 2026-05-12 22:10 WIB
**Cycle**: 2 (re-spawn correction per Eunomia Wave 1 audit FAIL verdict)
**Severity**: Critical (Lock 3 silent scope narrow surfaced by audit gate, 4 audit fail items rooted in single missing artifact)

**Context**: Eunomia Wave 1 audit at `_meta/audit/eunomia_wave1_audit.md` ruled FAIL on 4 items (1.1 H1 benchmark blocked, 2.4 /city route missing, 4.5 city/layout.tsx missing, 9.2 + 9.3 full chain breaks at /city) rooted in a single missing artifact: the `frontend/app/city/` directory does not exist. Cycle 1 Decision 2 (line 74) silently scope-narrowed by stating "city layout shell at `/city` is owned by Daedalus + Persephone, untouched here" while Pythia contract `_meta/contracts/calliope-to-wave2-panels.md` lines 16 + 97 explicitly assign /city ownership to Calliope Wave 1. The Cycle 1 silent narrow violated Lock 3.

**Decision**: Authored the 5 missing files at `frontend/app/city/` exactly per Pythia contract Section "Output schema" lines 41-87, and appended the CSS Grid template for `.city-layout` plus 3 slot region classes plus the slot placeholder helper classes to `frontend/app/globals.css` (single append per contract Asumption 4, coordinated with Daedalus globals.css ownership). Also applied Eunomia recommendation 4 to rename `frontend/app/__daedalus_smoke` to `daedalus-smoke` and `frontend/app/__iris_smoke` to `iris-smoke` so the smoke surfaces route correctly (Next.js was rejecting the double underscore prefix as a private segment).

5 files authored:

1. `frontend/app/city/layout.tsx`, 64 line, parallel route slot wiring with the 3 named slot props (`chat`, `ticket`, `side`) plus the `children` mount for the canvas region. CSS Grid `.city-layout` container; 3 aside regions with class names matching the Pythia contract verbatim.

2. `frontend/app/city/page.tsx`, 78 line, Client Component mounting `<ChronicleCanvas cameraTarget=[0,0,0] cameraPosition=[0,90,140]><CityScene /></ChronicleCanvas>` where `CityScene` consumes `useCityData()` plus `useBuildingClickDispatch()` plus `useBuildingClick(handler)` per the Iris handoff log lines 56-83 canonical pattern. Wave 1 demo subscriber logs building click + mount snapshot to console so audit gate can confirm dispatch pipeline lives.

3. `frontend/app/city/@chat/default.tsx`, 28 line, renders labeled stub placeholder `[STUB: Wave 2 Persephone replace with chat panel]` inside `.city-slot-placeholder` chrome.

4. `frontend/app/city/@ticket/default.tsx`, 26 line, same pattern for ticket panel.

5. `frontend/app/city/@side/default.tsx`, 26 line, same pattern for the 3-mode side panel.

Globals.css append (47 new line inside `@layer components`):

- `.city-layout` relative-positioned full-viewport container.
- `.city-canvas-region` absolute inset-0 z-0 for ChronicleCanvas full bleed.
- `.city-chat-slot` docked right 22rem wide.
- `.city-ticket-slot` docked bottom right (offset 22rem from right to clear the chat dock) 24rem x 16rem.
- `.city-side-slot` docked left 18rem wide.
- `.city-slot-placeholder` helper class for Wave 1 stub chrome (rounded card, glass blur).
- `.city-slot-tag` + `.city-slot-hint` typography helpers.

Smoke rename:

- `frontend/app/__daedalus_smoke` -> `frontend/app/daedalus-smoke` (plain mv, files untouched, smoke harness reference unchanged because the harness imports from `@/scene/__smoke__/canvas.smoke` not from the directory name).
- `frontend/app/__iris_smoke` -> `frontend/app/iris-smoke` (plain mv, same rationale, Iris smoke imports from `@/scene` barrel).

**Alternatives considered**:

- (A) Render `null` in the 3 slot defaults per the literal Pythia contract example line 78-80. Rejected because Next.js 16 + the slot regions need a visible chrome so the audit gate and demo audiences can confirm the grid layout works without a real panel mounted. Stub placeholders are Lock 5 compliant via the `[STUB: ...]` label. Wave 2 Persephone replaces these with the production panels per the handoff contract.

- (B) Move the CSS Grid to a new `frontend/styles/globals.css` per the original Calliope spec section 3 file structure. Rejected because Daedalus already owns `frontend/app/globals.css` as the canonical globals file, the tailwind config `content` array does not include `frontend/styles/**`, and the marketing route group already uses scoped `marketing.css` not a styles directory. Single append to the canonical globals.css is the surgical path per contract Asumption 4.

- (C) Skip the smoke rename optional polish. Rejected because the audit gate explicitly recommended the rename in finding 1.1 remediation, the rename is 2 plain mv calls without code edits, and unblocking the Iris + Daedalus smoke surfaces gives Eunomia + Pan empirical 60fps benchmark targets isolated from the production /city route.

**Impact downstream**:

- Eunomia (Wave 1 auditor) re-audit: 4 audit fail items resolved. H1 benchmark unblocked because `/city` now mounts the production BuildingInstances surface, plus `/iris-smoke` + `/daedalus-smoke` now route 200 OK for isolated benchmark. Lighthouse 90+ deferred items still deferred to Pan post Wave 3 per the audit report tooling-not-installed caveat.

- Persephone (Wave 2, chat-panel + ticket-panel + side-panel) consumer: parallel route slot grid ready, 3 default.tsx slots authored with stub chrome that Persephone replaces with the real panels. The `.city-layout` grid stays intact per contract Asumption 2 (Persephone styles panel internals only).

- Hera (Wave 2, Sprint Mode HERO 14 PM concept overlay) consumer: `/city` is the real production mount surface now, Hera mounts `SprintOverlay` as a child of `<ChronicleCanvas>` within the city page (replaces or augments the demo console subscriber).

- Hades (Wave 3, real OAuth) consumer: Hestia stub redirect target `/city?mock_auth=true` now lands on a real 200 page, the OAuth chain end-to-end works for both `stub=true` and the no-stub baseline.

**Verification**:

- `cd frontend && npx tsc --noEmit` exit 0 (post 5 file write + globals.css append + smoke rename). Pre-rename verify exit 0 also.

- `cd frontend && npx next dev --turbopack -p 3100` boots in 423ms.

- `curl -I http://localhost:3100/city` -> HTTP 200.

- OAuth chain end-to-end:
  - `curl -I http://localhost:3100/` -> HTTP 200.
  - `curl -I http://localhost:3100/start` -> HTTP 200.
  - `curl -I http://localhost:3100/api/auth/github/start` -> HTTP 302 Location `/city?mock_auth=true`.
  - `curl -I "http://localhost:3100/api/auth/github/start?stub=true"` -> HTTP 302 Location `/city?mock_auth=true&stub=true`.
  - `curl -I "http://localhost:3100/city?mock_auth=true"` -> HTTP 200.
  - `curl -I "http://localhost:3100/city?mock_auth=true&stub=true"` -> HTTP 200.

- Smoke rename verify:
  - `curl -I http://localhost:3100/daedalus-smoke` -> HTTP 200.
  - `curl -I http://localhost:3100/iris-smoke` -> HTTP 200.

- `/dashboard` still 200 (Selene cohabit verified).

- Dev server log clean for the 6 requests above (no error or warn lines surfaced in the windowed grep).

**Lock 3 honest disclosure**: the Cycle 1 silent narrow was a real violation. The Cycle 2 correction makes Calliope-owned scope match the Pythia canonical contract verbatim. Decision log entry kept full per audit-trail accountability. Lock 5 honest claim discipline applied to the slot defaults via the `[STUB: ...]` label so the audit gate can verify no hidden production claim exists for the placeholder regions.

**Reference**: Eunomia Wave 1 audit report `_meta/audit/eunomia_wave1_audit.md` findings 1.1 + 2.4 + 4.5 + 9.2 + 9.3 + recommendations 1 to 4. Pythia contract `_meta/contracts/calliope-to-wave2-panels.md` Section "Output schema" lines 41-87. Iris handoff log `_meta/handoff_log/wave1_iris_to_hera.md` lines 56-83 canonical mount pattern. Daedalus contract `_meta/contracts/daedalus-to-iris.md` ChronicleCanvas + usePerformanceState + FEATURE_FLAGS surface lines 22-77.

---

## [D-Calliope-Final-01] LANDING-BUTTON-BROKEN fix, anchor target id + smooth scroll polish

**Date**: 2026-05-13 06:38 WIB
**Cycle**: Wave-Fixing 3 Manager Final
**Severity**: High (Wave 1 ship-claim hollow, demo Day 2 risk)

**Context**: Ghaisan QA Day 2 05:51 WIB flagged the CloserSection ghost CTA "View the residents ->" as inert. Hover state showed, click produced zero response. Trace shows the link `<a className="cta cta--ghost" href="#residents">` at `frontend/components/marketing/CloserSection.tsx` line 27 wired to fragment identifier `#residents`, but the target `<section className="residents">` at `frontend/components/marketing/ResidentsSection.tsx` line 14 had no `id="residents"` attribute. Browser anchor scroll resolves on `id`, not on `class`, so the click had no destination to scroll to.

**Decision**: Applied Option A (anchor scroll to section) per Manager Final dispatch directive, with two surgical edits:

1. `frontend/components/marketing/ResidentsSection.tsx` line 14: added `id="residents"` to the residents section element. Single attribute insertion, no behavioral change to the existing layout or styling. The id co-exists with the existing `className="residents"` so the MarketingShell's scroll-progress detector (which queries `document.querySelector('.residents')`) keeps working unchanged.

2. `frontend/app/(marketing)/marketing.css` insert after `.marketing-body ::selection` rule: appended `html:has(body.marketing-body) { scroll-behavior: smooth; }` plus `.marketing-body .residents { scroll-margin-top: 64px; }`. The `:has(body.marketing-body)` selector keeps smooth scroll scoped to the marketing route, avoiding interference with Daedalus's other routes. The `scroll-margin-top: 64px` compensates for the fixed topnav (16px padding y + ~22px content height) so the "Five residents" eyebrow lands below the nav, not flush behind it. The pre-existing `prefers-reduced-motion` @media block at line 721 already overrides `scroll-behavior: auto !important`, so users with the OS motion-reduce setting get an instant jump (Lock 10 a11y floor maintained).

**Alternatives considered**:

- (A) Wire onClick handler to dispatch programmatic `window.scrollTo()`. Rejected because the existing `href="#residents"` is the semantically correct hyperlink pattern. Adding JavaScript would shadow the browser-native anchor behavior, bloat the bundle, and break right-click "Open in new tab" / "Copy link". The DOM is one attribute away from working as designed.

- (B) Modal pop with 5 resident card preview. Rejected because the ResidentsSection already lives on the same page below the CloserSection. A modal would duplicate content and break the cinematic act-progression of the landing (Act 4 Residents is dedicated narrative real estate). Also out of scope for a 60-min dispatch.

- (C) Navigate to /start entry page. Rejected because /start is the threshold (OAuth + repo picker) authored by Hestia. The ghost CTA is positioned next to the primary CTA "Open the city ->" which already wires to /start. Two CTAs going to the same destination would be redundant + violate Designer intent (ghost CTA is the in-page exploration alt path, primary CTA is the commit-to-city action).

**Impact downstream**:

- Aether-audit (Wave-Fixing 3 audit gate): button click verified at SSR + CSS bundle level. The 2-edit fix is minimal-surface, no side-effects on other landing components, no dev-time regression.

- Pan (post-Wave 3 polish + demo rehearsal): the ghost CTA now responds, Day 2 demo can showcase the closer-to-residents anchor scroll if Ghaisan + Hafiz choose to demonstrate it. Reduced-motion users still get an instant jump per the pre-existing a11y guard.

- No contract impact: the parallel route slot schema for /city is untouched, the MarketingShell scroll progress observer is untouched (still uses `.residents` querySelector), and the existing `href="#residents"` wiring in CloserSection is preserved as-is.

**Verification**:

- `curl -s http://localhost:3000/ | grep -oE '(id="residents"|href="#residents")'` returns BOTH markers, confirming the anchor target + anchor link are co-present in the SSR HTML payload.

- CSS bundle verify: `curl -s "http://localhost:3000/_next/static/css/app/(marketing)/layout.css" | grep -oE "scroll-(behavior|margin)[^;}]+"` returns 4 lines: smooth-scroll comment, `scroll-behavior: smooth`, `scroll-margin-top: 64px`, and the pre-existing reduced-motion `scroll-behavior: auto !important`.

- Playwright snapshot landing route: the `<a href="#residents">` link is present at ref e516, and the residents section serves as the target. Bounding box geometry verified the section renders below the closer in document order.

- Hero screenshot captured at `_meta/audit/calliope-final-landing-top.jpeg` (cinematic hero, light mode lock intact, no console errors on root navigation).

**Lock 5 honest disclosure**: Playwright in-session click verification was inconclusive due to a separate browser-session state bug that auto-redirects the Playwright tab to /city or /start/pick-repo on every viewport screenshot retry, unrelated to the landing fix. The fix itself is verified at SSR HTML + CSS bundle + source-code level. Real-browser human click test recommended at Pan's demo rehearsal step.

**Reference**: Ghaisan QA Day 2 05:51 WIB, Manager Final dispatch directive 2026-05-13. Source code change: `frontend/components/marketing/ResidentsSection.tsx` line 14 + `frontend/app/(marketing)/marketing.css` lines 51-65 insertion.

---

## Manager FINAL Cycle 2, Cluster G accessibility nav button

**Stamp**: 20260513-0857
**Cluster**: G (Dashboard accessibility, /city -> /dashboard nav button)
**Manager decision context**: D-MF2-02 Option A top-right nav button "Dashboard" on /city.

### D-MF2-Calliope-01: positional layout, horizontal stack vs vertical

CityNav placed at fixed `right: 170, top: 18, z-index: 41` so it sits LEFT of the existing DirectorModeButton (`right: 18, top: 18, z-index: 40`). Both stay always visible top-right of the canvas. Inline-style chosen over the heavier `.glass-panel` Tailwind utility because:
1. Director button uses raw inline style for tight pill control, the two should match each other.
2. `.glass-panel` is rounded-2xl with shadow-2xl, intended for full panel docks, would feel over-decorated for a single nav primitive.
3. Backdrop-filter + 72% void background + 1px white/18 border match the cinematic-dark city aesthetic without competing with HUDs.

### D-MF2-Calliope-02: back-nav coverage from /dashboard delegated to Selene

Selene Cluster H authored `DashboardTopBar.tsx` and added an explicit "City" topbar pill (ref=e24 in Playwright snapshot) AND a "Dashboard | City view" segmented toggle (ref=e42) AND an inline `/city` link in the Manager view banner AND an "ENTER CITY" CTA card in the cross-nav rail. Four redundant back-nav surfaces on /dashboard. Per directive Section 2 "Don't duplicate if existing nav covers it", Calliope adds zero modification to /dashboard. Coordination logged in handoff doc.

### D-MF2-Calliope-03: active repo context preservation via repoSlug prop

CityNav exposes optional `repoSlug?: string | null` prop. CityPage derives the value via `useState + useEffect` SSR-safe URL search-param read on mount. When the user lands on /city with `?repo=<slug>`, the Dashboard button href becomes `/dashboard?repo=<slug>`. Mirror of Selene's `DashboardTopBar` cityHref pattern. Round-trip preserves the active repo context bi-directionally. Verified via Playwright snapshot at `/url: /dashboard?repo=gadablotnok%2Fweb-esp32log`.

### D-MF2-Calliope-04: persistent header pattern, decline for landing

Per directive Section 3 OQ, the landing `/` route was considered for a dashboard link too. Declined: pre-OAuth landing should not surface manager-facing dashboard nav (confuses the flow). /start onboarding stays linear (no dashboard nav). Direction matches directive Section 3 hint.

**Verification**:

- Playwright nav round-trip:
  - Navigate `/city?repo=test-direct`. Snapshot: `navigation "City to Dashboard navigation" [ref=e8]` with `link "Open manager Dashboard" [ref=e9] -> /url: /dashboard?repo=test-direct`. PASS.
  - Navigate `/dashboard?repo=gadablotnok%2Fweb-esp32log`. Dashboard renders cleanly with 4 back-nav surfaces. PASS.
- Screenshot evidence (jpeg compressed for r3f canvas compatibility plus png viewport for stability):
  - `_meta/audit/screenshots/cycle2-20260513-0857/calliope-nav-01-city-full.png` shows both "DASHBOARD" (CityNav) and "DIRECTOR MODE" pill top-right of /city with no collision.
  - `_meta/audit/screenshots/cycle2-20260513-0857/calliope-nav-04-dashboard-from-city-nav.jpeg` shows /dashboard topbar with full set of back-nav surfaces.

**Lock 5 honest disclosure**: r3f `<Canvas>` paints frames continuously which kept Playwright `page.screenshot()` in "waiting for fonts to load" + "attempting scroll into view" loops on certain JPEG/element captures. Workaround: PNG viewport captures landed cleanly. Snapshot accessibility tree is the primary truth for DOM state. Functional behavior verified end-to-end via URL transitions plus rendered output read-back.

**Reference**: Ghaisan + Hafiz accessibility blocker reported pre-spawn 08:57 WIB. Source code change `frontend/components/marketing/CityNav.tsx` (new) plus `frontend/app/city/page.tsx` (import + state hook + mount).

---
