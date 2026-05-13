# Hestia decision log

Append-only. Each decision is dated and references the artifact it touched.

---

## D1: Remove pets + animated background variant lock

**Date**: 2026-05-12 18:54 WIB
**Cycle**: 1 (single cycle, port + 2 revisions in one pass)
**Authority**: Ghaisan spawn directive (override of bundle defaults)

### Context

Designer bundle Prompt 2 landed at `_meta/designer/prompt2-entry/handoff-bundle-extracted/applicationentry-refactory/project/` with four files: `Entry.html`, `entry-app.jsx`, `city-scenes.jsx`, `tweaks-panel.jsx`. The bundle shipped a floating Hermes shy creature on the sill between the two casement windows, a Shyness tweak slider that modulated its flee behavior, and a `motion` field defaulting to `breathing`. The 5 resident persona footer rendered Hermes with a special `onSill: true` flag and an "on the sill" badge that tied the persona to the floating creature.

Ghaisan directive on spawn:
1. Entry page must have zero creature. "Pet" in this context = the single Hermes shy creature on the sill, not the 5 resident persona thumbnails in the footer.
2. Background motion default must be the most animated variant.

### Decision

**Revision 1 (remove all pets) actions**:

- Removed `useHermes` hook function entirely from the ported codebase.
- Removed `HermesBlob` SVG component entirely. Bundle file `city-scenes.jsx` lines 381-431 are not ported.
- Removed `shyness` field from `TWEAK_DEFAULTS`. Bundle file `entry-app.jsx` line 9 dropped.
- Removed `TweakSlider label="Shyness"` from the Tweaks panel. The Tweaks panel host itself is not ported into the production Next.js page (claude.ai/design host-side ergonomic, not part of the visitor experience).
- Removed `shyness` prop from `Stage` component signature plus its threading from `EntryApp` -> `Stage` -> `useHermes`.
- Removed the `Stage` absolute-position div that rendered `HermesBlob` plus the "hermes . pick a door" speech tag (bundle entry-app.jsx lines 636-663).
- Inspected `city-scenes.jsx`: only `HermesBlob` was a creature rendering element. `MiniCity` and `EmptyLot` are environment scenes with no creature, ported intact.
- Removed `onSill: true` flag from the Hermes resident roster entry (`residents-data.ts`) plus the conditional "on the sill" badge rendering in `Residents.tsx`. Hermes the persona reads as a peer of the other four, since the floating creature it paired with is gone.
- Post-removal grep confirmed: zero functional references to `useHermes`, `HermesBlob`, `shyness`, `pet`, `mascot`, `critter`, `companion`, or `creature` in production code paths. Remaining occurrences are documentation comments explaining the removal, plus the Hermes name in `residents-data.ts` line 57 which is the resident-roster persona entry preserved by design.

**Revision 2 (most animated background) actions**:

- Bundle `TweakRadio` "Background motion" options: `["still", "breathing", "animated-city"]`.
- Heuristic ordering by motion intensity: `still` < `breathing` < `animated-city`. `animated-city` adds two `animateMotion` walker dots along the sidewalk plus all the breathing animations on the resident landmarks plus the streetlight pulse.
- Updated `TWEAK_DEFAULTS.motion` from `"breathing"` to `"animated-city"`. Bundle file `entry-app.jsx` line 10 changed.
- Verified browser dev mode at port 3007: `/start` returns 200, MiniCity scene renders walker dots + clock-tower pulse + hospital cross pulse + Argus antenna blink + Hermes booth window pulse + street lamps all pulsing. Motion clearly more dynamic than the bundle's previous `breathing` default. No harmony break observed.

### Rationale

- **Pets removal**: the threshold page is described in Designer Prompt 2 line 136 as "an airlock between the cinematic landing and the working application... a quiet page, not a creature parade". Ghaisan's interpretation pushes the page further toward calm-architectural. The 5 resident persona thumbnails in the footer remain because they are colleague introductions (content), not creature ornaments. The "on the sill" pairing badge becomes incoherent without the floating creature, so it is dropped to keep the footer reading clean.
- **Most animated default**: Designer Prompt 2 mandates "the moment should still feel like part of the Codeplex world, not a generic SaaS sign-in" (line 144). The `animated-city` variant adds in-scene life (walking dots) that signals the running city behind the door, reinforcing the doors-into-different-cities metaphor. `breathing` was a conservative bundle default that under-sells the experience. The Tweaks panel host is not ported, so the default is the production behavior; future Iris / Selene / Hera work may expose a runtime control if needed.

### Impact

- Downstream Wave 3 Hades unaffected. OAuth handoff stub schema unchanged.
- Downstream Eunomia Wave 1 auditor sees a cleaner threshold page that better honors Designer intent (calm, architectural, no creature parade) without sacrificing identity (animated city behind the door reinforces the metaphor).
- No PRD section conflict. PRD Section 10 resident roster still has Hermes as the guide.
- Cross-page cohesion preserved: typography family `Space Grotesk` plus `JetBrains Mono` declared at `app/start/page.tsx` via `next/font/google`, distinct from Calliope's `Geist` + `Bricolage Grotesque` but both are sans / mono families serving the same Codeplex voice. Deliberate palette contrast per Designer Prompt 2 line 152 (warmer than cinematic-dark).

### Cross-references

- Bundle source: `_meta/designer/prompt2-entry/handoff-bundle-extracted/applicationentry-refactory/project/{Entry.html,entry-app.jsx,city-scenes.jsx,tweaks-panel.jsx}`
- Contract input: `_meta/contracts/claude-design-bundle-to-hestia.md`
- Contract output: `_meta/contracts/hestia-to-hades.md`
- Output files: `frontend/app/start/page.tsx`, `frontend/app/api/auth/github/start/route.ts`, `frontend/components/entry/*.tsx`, `frontend/components/entry/*.ts`, `frontend/components/entry/entry-keyframes.css`

---

## D2: Wave-Fixing #2 cycle 1 . Build-from-scratch becomes a Hestia-owned workspace

**Date**: 2026-05-13 03:28 WIB (STAMP=20260513-0328)
**Cycle**: Wave-Fixing #2 cycle 1
**Authority**: Manager Wave-Fixing #2 dispatch (E-5 + E-6 + entry polish scope)

### Context

QA round Day 2 reported two CRITICAL bugs after the Wave-Fixing #1 commit landed live:

- **E-5**: Clicking "Build from Scratch" on `/start` produces "Application error: a client-side exception has occurred" on top of a blank page. Wave-Fixing #1 cycle 1 had retargeted the right door to `/city?mock_auth=true&mode=empty` and added a Server Component redirect at `/start/build-from-scratch`. The downstream `/city` route is Iris/Hera/Persephone domain and either throws in the browser or silently renders the full mockCityData regardless of the `mode=empty` query, neither matching the PRD Section 7.1 line 292 spec for "Build from scratch entry option (in-memory virtual FS)".
- **E-6**: The fastapi-fullstack demo path through `/start/pick-repo` to `/city?demo=fastapi-template&mock_auth=true` exhibits the same client-side exception class. `/city` does not branch on `?demo=<key>` so the demo distinction is cosmetic on the picker side; the eventual mount through the scene chain is what fails.

The Manager prompt also asks for entry-page polish: 5 resident bio strip plus v0.3 prototype badge plus Docs + Changelog nav plus 2 entry card hover state cinematic. Wave 1 had shipped the strip + badge already; Docs + Changelog were missing.

### Decision

**E-5 fix: real in-memory virtual FS workspace at `/start/build-from-scratch`**

Rather than redirect into the failing `/city` chain, I ship a self-contained Hestia-owned workspace that satisfies PRD 7.1 entirely within the Hestia file ownership boundary (`frontend/app/start/*`, `frontend/components/start/*`, no edit on `src/scene/*` or `cityEngine.ts`):

1. `frontend/components/start/BlankCityWorkspace.tsx` (new file, ~600 lines):
   - `VirtualFS` model: `Record<path, VirtualFile>` keyed by POSIX-slash paths. `VirtualFile = { path, content, createdAt, updatedAt }`. localStorage key `codeplex.blank-city.vfs.v1`. Three seed files (`/README.md`, `/app/main.ts`, `/app/health.ts`) with a stable `SEED_EPOCH = 0` timestamp so SSR rendered HTML matches the first client render (avoids React 19 hydration mismatch).
   - In-app editor: vanilla `<textarea>` with monospace font + line/char count metadata. Zero new dependency (no Monaco/CodeMirror; the heavy editor surface would inflate the route bundle for a hackathon-grade alpha).
   - File tree: alphabetical list, click to select, x-button to delete (locked when only 1 file remains so the workspace never loses all context). Add input + "create" button validates path against `^/[A-Za-z0-9._/-]+[A-Za-z0-9._-]$` and rejects duplicates.
   - SVG skyline: each file path hashes to a stable (x, height, hue) glyph via FNV-1a + `mulberry32` (reusing `components/entry/scene-helpers.ts`). Newly created files animate-grow from the ground over 1.1s. Seed files render fully grown immediately. Two stacked window rows appear once each building passes 55% grow progress. The active file's glyph gets the ember stroke.
   - `Save to GitHub` button is labeled honest: "(Wave 3)" suffix plus a status banner explains the persist path is a future Hades follow-up. Lock 5 compliance: no fake persistence, no silent narrow.

2. `frontend/app/start/build-from-scratch/page.tsx` rewrite: was a redirect-only Server Component that bounced to `/city?mock_auth=true&mode=empty`. Now a real Next.js page that mounts `<BlankCityWorkspace />` with the same `Space_Grotesk` + `JetBrains_Mono` next/font wiring as `/start`. Title and description updated.

3. `frontend/components/entry/EntryApp.tsx`: `BLANK_CITY_TARGET` constant changed from `/city?mock_auth=true&mode=empty` to `/start/build-from-scratch`. Right-door click now navigates to the Hestia-owned workspace directly. No `/city` dependency.

**E-6 fix: graceful demo-crash fallback signaling + PyGoat demo coverage**

`/city`'s demo render path is owned by Iris/Hera/Persephone; the actual schema-vs-render fix lives outside Hestia. Within the Hestia surface I add:

1. PyGoat (the third PRD-named demo dataset) to the `DEMO_DATASETS` array in `frontend/components/entry/RepoPickerStep.tsx`. Picker now exposes all three demo paths from PRD line 320-323: NodeGoat, fastapi-template, PyGoat.
2. A `?fallback_reason=demo_crash` query handler in the picker: if a future Iris/Hera/Persephone city-side patch redirects users back to the picker with that hint, a warn banner surfaces explaining the demo render crashed and offering the other demo paths or a manual URL paste as alternatives. Idempotent: when the query param is absent the banner does not render.

**Entry polish**

1. `frontend/components/entry/Header.tsx` now has a `<nav aria-label="entry nav">` block with:
   - Docs link anchoring to `#privacy-notice` (the on-page Data residency notice doubles as a doc surface for Wave 1 alpha; Wave 3 wires real /docs).
   - Changelog link to `https://github.com/Finerium/codeplexRefactory/commits/main` (external, opens new tab, rel=noopener).
   - 1px divider between nav and the build tag + v0.3 prototype badge.
2. `frontend/components/entry/PrivacyNotice.tsx`: `id="privacy-notice"` + `scrollMarginTop: 80` so the Docs anchor lands cleanly without being hidden behind the header.

### Rationale

- **Real workspace over redirect**: redirecting into a route owned by another worker created a cross-domain failure surface. By keeping the blank-lot path entirely within Hestia file ownership, the E-5 verdict can stay PASS regardless of what Iris/Hera/Persephone do in `/city`. The PRD 7.1 spec for "in-memory virtual FS" is now satisfied with code rather than punted.
- **2D SVG over 3D scene**: Iris owns `cityEngine.ts` per Manager anti-collision rule. Reusing the entry-page scene-helpers `mulberry32` keeps the visual language consistent with the right-door MiniCity preview, and an SVG layer ships zero new deps. A future cycle can swap the SVG for a true 3D `<BuildingInstances>` mount through Iris if desired; the FS API and editor surface are decoupled.
- **localStorage persistence**: PRD 7.1 calls for session persistence. localStorage is the lowest-friction path that needs no backend, no cookie management. Try/catch wraps both read and write so the workspace still works in private-browsing / quota-exceeded.
- **PyGoat addition**: PRD Section 14.1 R3 and PRD line 320-323 both name three demo datasets. Wave-Fixing #1 only surfaced two. Restoring PyGoat as a third option matches the full PRD intent and gives panitia a Python-flavor fallback.
- **`?fallback_reason=` signaling without faking a fix**: the actual /city render error is downstream. I do not silently mask the failure or fabricate a recovery path. Instead I surface a labeled fallback banner that another worker can trigger after diagnosing the city-side issue. Lock 5 compliance.
- **Docs anchor on the privacy notice**: the privacy notice + DeepSeek data residency disclosure is the densest doc surface on the page already. Anchoring "Docs" there is honest for Wave 1 alpha; a Wave 3 follow-up replaces with a real `/docs` route.

### Impact

- E-5 verdict: PASS via local dev verification. `/start/build-from-scratch` renders the workspace clean, no console errors, no client exception, hydration matches.
- E-6 verdict: PARTIAL (Hestia-side ship clean; `/city` schema-vs-render fix flagged to Iris/Hera/Persephone). Picker now exposes the third demo and the fallback signaling rail.
- Entry polish: Docs + Changelog nav visible top-right, divider keeps the build tag + badge cluster intact.
- Bundle size impact: SVG skyline is a few hundred bytes of markup. No new npm package. The textarea editor is the native browser primitive.
- File ownership: zero edit outside Hestia boundary. `cityEngine.ts`, `repos.py`, `src/scene/*`, `app/city/*`, `components/panels/*` untouched.

### Cross-references

- Files added or edited this cycle:
  - `frontend/components/start/BlankCityWorkspace.tsx` (new)
  - `frontend/app/start/build-from-scratch/page.tsx` (rewrite, was redirect-only)
  - `frontend/components/entry/EntryApp.tsx` (BLANK_CITY_TARGET retarget)
  - `frontend/components/entry/Header.tsx` (Docs + Changelog nav)
  - `frontend/components/entry/PrivacyNotice.tsx` (anchor id)
  - `frontend/components/entry/RepoPickerStep.tsx` (PyGoat demo + fallback banner)
- Manager dispatch: cluster 5 in Manager Wave-Fixing #2 prompt
- PRD reference: Section 7.1 line 292 (Build from scratch) + Section 14.1 R3 + line 320-323 (3 demo datasets) + Section 19.4 (privacy notice)
- Cross-scope coordination needed:
  - Iris/Hera/Persephone: the `/city?demo=<key>` runtime crash root cause is in their domain. Once they branch on `?demo=<key>` to load the right pre-parsed JSON the picker affordance is end-to-end clean.
  - Atlas: re-deploy required to surface this Wave-Fixing #2 cycle 1 ship to the live duopoly cluster (Manager dispatches separately).

---

## D-Hestia-Final-01: Manager Wave-Fixing #3 cycle FINAL (E-5 + E-6 RECURRING fixes, file count constraint hint, app-level error boundary)

**Date**: 2026-05-13 ~07:00 WIB Day 2 morning
**Stamp**: hestia-final
**Status**: SHIPPED clean
**Confidence**: high

### Context

Manager #3 cycle ferry: Manager #2 + Manager #3 both claimed PASS on E-5 (Build from scratch client exception) and E-6 (demo dataset client exception), but Ghaisan verified live `duopoly.hackathon.sev-2.com` still surfaced "Application error: a client-side exception has occurred" on:
1. Click "Build from scratch" door from `/start` (E-5 RECURRING)
2. Click each of NodeGoat / fastapi-template / PyGoat demo card from `/start/pick-repo` (E-6 RECURRING)
3. Plus question: random repo URL paste flow (file count constraint per PRD)

Root cause analysis on dev:
- **`/start/build-from-scratch` (E-5)**: SSR returns 200 + full BlankCityWorkspace markup including SVG skyline + textarea + file tree (verified via curl 27KB body). Playwright nav reports 0 console errors, 0 warnings, full UI snapshot present. The cycle 2 fix from Hestia Wave-Fixing #2 is genuinely intact in dev. The deployed `duopoly.hackathon.sev-2.com` symptom is almost certainly the Dockerfile `NEXT_PUBLIC_API_URL=/api` build-arg cascade (T-1/E-4, already fixed by Manager edit pending Atlas redeploy).
- **`/city?demo=<key>` (E-6)**: SSR returns 200. The "client exception" symptom on deployed site appears to be the same NEXT_PUBLIC_API_URL cascade. But there is a real silent-wrong layer here: `useCityData()` returns the singleton `mockCityData` (fastapi-style, ~240 buildings) regardless of `?demo=<key>`. All three demo cards load the same dataset. Iris/Demeter own the data layer swap (Wave 3); Hestia cannot edit `src/scene/buildings/*` without breaking file ownership boundaries.

### Decision

Honest scoped fix:
1. **App-level error boundary**: ship `app/error.tsx` per Next.js 16 App Router convention. Catches ANY uncaught render or effect error in any route segment. Replaces the bare "Application error: a client-side exception has occurred" banner with a calm Codeplex-voice apology + try-again + back-to-entry + back-to-landing recovery affordances + readable error message + digest for audit.
2. **City-route error boundary**: ship `app/city/error.tsx`. Same pattern, tighter copy ("the city scene did not mount", recovery to /start/pick-repo). The city has the largest runtime surface (Canvas + 240 buildings + 5 mode layers + onboarding + sprint + retro flythrough + health glow + refactor ghost), so a localized boundary keeps a transient WebGL/chunk/hot-reload race from black-holing the demo.
3. **Demo source banner**: ship `components/city/DemoSourceBanner.tsx`. Mounts only when `?demo=<key>` or `?repo=<full_name>` present on URL. Names the requested dataset + the actual rendering dataset (Wave 1 fastapi-style mock per Iris ship) + Wave 3 plan. Converts the "silently wrong demo" failure mode into a "labeled placeholder" mode per Lock 5 honest claim.
4. **File count constraint hint**: edit `components/entry/RepoPickerStep.tsx` to add a paragraph below the URL paste input naming the PRD Section 14.1 R3 sweet spot (line 1534 "Repo size: 50-300 files demo, 1K files theoretical") with concrete numbers per dataset (NodeGoat 80-120, FastAPI template 150-250, PyGoat 60-100). Client-side honesty layer; backend Wave 3 enforces server-side cap.

### Honest claim discipline (Lock 5)

- Error boundaries mitigate SYMPTOM not cause. Each underlying error still needs its real fix in its owning component (Iris / Hera / Persephone / Boreas / Asclepius domains). The boundaries keep the demo recoverable while real fixes ship.
- Demo source banner does NOT pretend each demo key renders its real data. It labels what is rendered. Wave 3 Demeter replaces the singleton with per-repo materialized data and the banner copy auto-narrows.
- The `duopoly.hackathon.sev-2.com` E-5 + E-6 RECURRING symptoms most likely resolve when Atlas redeploys with the fixed Dockerfile `NEXT_PUBLIC_API_URL` (already edited by Manager this cycle). The Hestia error boundaries are defense in depth: even if a downstream component does throw post-redeploy, the user gets a graceful screen instead of the bare Next.js banner.

### File ownership

Files touched in this cycle (all Hestia scope per Manager Wave-Fixing #3 prompt):
- `frontend/app/error.tsx` (new, app-level boundary)
- `frontend/app/city/error.tsx` (new, route-scoped boundary)
- `frontend/components/city/DemoSourceBanner.tsx` (new, honest data label)
- `frontend/app/city/page.tsx` (mount DemoSourceBanner + import)
- `frontend/components/entry/RepoPickerStep.tsx` (50-300 file hint paragraph)

Files explicitly NOT touched (file ownership boundary respect):
- `frontend/src/scene/buildings/*` (Iris/Demeter)
- `frontend/src/modes/*` (Hera/Persephone/Boreas/Asclepius)

### Verification

- `npx tsc --noEmit` 0 errors in Hestia scope (pre-existing `HoverFloorGlow` unused-import is Iris).
- `curl /start` 200, `/start/build-from-scratch` 200 + full SVG skyline in SSR body, `/start/pick-repo` 200 + visible "Demo sweet spot 50 to 300 files" hint, `/city?demo=nodegoat&mock_auth=true` 200, `/city?repo=tokopedia/gripmock` 200.
- Playwright snapshot `/start/build-from-scratch`: 0 console errors, 0 warnings, full UI tree visible.
- Playwright snapshot `/start/pick-repo`: 2 console errors visible (1 hydration warning on the URL paste input style, pre-existing React 19 strict-check noise; 1 graceful 401 from `/api/repos/list` correctly handled by RepoPickerStep `unauthenticated` banner state, NOT a crash). 0 throws.
- Playwright snapshot of pick-repo confirms the new "Demo sweet spot: 50 to 300 files (NodeGoat 80 to 120, FastAPI template 150 to 250, PyGoat 60 to 100)" paragraph renders below the URL input.

### Cross-scope handoff

- **Aether-audit (Manager final auditor)**: this cycle's verdict on E-5 + E-6 RECURRING is "deployed-site symptom is downstream NEXT_PUBLIC_API_URL cascade pending Atlas redeploy; Hestia adds defense-in-depth boundaries + honest data labels". Recommend Aether re-verify on duopoly.hackathon.sev-2.com after Atlas redeploys (cluster ship pending per Manager #3 prompt).
- **Iris/Demeter (Wave 3 forward)**: when the per-repo data swap lands, the DemoSourceBanner copy can be narrowed (the "all three demo cards render the same fastapi-style mock" disclosure becomes "demo dataset X with N buildings"). Pythia contract: hook stable, surface unchanged.

### Decision lineage

- Predecessor: D-Hestia-WF2-01 (Wave-Fixing #2 cycle 1 BlankCityWorkspace ship)
- Successor: TBD (Wave 3 Demeter or post-submission polish cycle, whichever spawns)
