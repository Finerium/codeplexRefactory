---
actual_timestamp: 2026-05-13T03:28+07:00 (WIB) / 2026-05-12T20:28:00Z (UTC)
agent: Hestia
identity_mode: rescue
wave: Wave-Fixing #2
cycle: 1
stamp: 20260513-0328
scope_bugs: [E-5, E-6, entry_polish]
verdict_per_bug:
  E-5: FIXED
  E-6: PARTIAL (Hestia-side ship clean, /city render owned by Iris/Hera/Persephone)
  entry_polish: SHIPPED
code_files_touched:
  frontend:
    new:
      - frontend/components/start/BlankCityWorkspace.tsx
    edited:
      - frontend/app/start/build-from-scratch/page.tsx
      - frontend/components/entry/EntryApp.tsx
      - frontend/components/entry/Header.tsx
      - frontend/components/entry/PrivacyNotice.tsx
      - frontend/components/entry/RepoPickerStep.tsx
deferred_reasons:
  E-6_city_demo_render: |
    The /city route's useCityData() returns a singleton hardcoded to
    mockCityData regardless of the searchParams.get('demo') value. The
    actual demo distinction in the picker is currently cosmetic. Fixing
    the render path means editing src/scene/buildings/useCityData.ts +
    optionally cityEngine.ts to branch on the demo key. Both files are
    Iris/Hera/Persephone domain per Manager anti-collision rule. The
    schema swap for per-demo pre-parsed JSON is a Day-0 prep deliverable
    per PRD line 320-323; if those datasets exist they need to be wired
    through the existing useCityData hook.
ferry_surfaced: |
    E-6 partial: Iris/Hera/Persephone coordinate /city demo schema swap.
    Hestia signaling rail in place via ?fallback_reason=demo_crash; the
    other workers can wire the redirect from their error boundary back
    to /start/pick-repo with that query so the user sees a clear
    fallback. Atlas re-deploy needed to surface this Wave-Fixing #2
    cycle 1 ship on the live cluster.
---

# Hestia Wave-Fixing #2 cycle 1 handoff

Manager Wave-Fixing #2 dispatch post QA round Day 2. Three scope items
assigned to Hestia cluster 5: E-5 CRITICAL (Build from scratch client
exception), E-6 CRITICAL (demo dataset client exception), entry-page
polish (Docs + Changelog nav + 5 resident strip + v0.3 badge verify).

Submission window approximately 9.5h ahead at the time of this handoff
(Day 2 13:00 WIB).

## Bug E-5 CRITICAL: "Build from Scratch" client-side exception

### Root cause

Wave-Fixing #1 cycle 1 had fixed the original 404 by retargeting the right
door to `/city?mock_auth=true&mode=empty`. The `/city` route is
Iris/Hera/Persephone domain. The production webpack build either threw a
runtime exception in the browser or silently rendered the full mockCityData
regardless of the `mode=empty` query. Both outcomes contradicted PRD
Section 7.1 line 292 spec for "Build from scratch entry option (in-memory
virtual FS)".

### Fix

Replace the redirect-into-failing-chain with a real Hestia-owned workspace
at `/start/build-from-scratch`. The workspace satisfies PRD 7.1 entirely
within Hestia file ownership boundaries.

Three coordinated changes shipped:

1. **New file** `frontend/components/start/BlankCityWorkspace.tsx` (~600
   lines). VirtualFS model with localStorage persistence under
   `codeplex.blank-city.vfs.v1`. Three seed files
   (`/README.md`, `/app/main.ts`, `/app/health.ts`) with stable
   `SEED_EPOCH = 0` timestamps (avoids React 19 hydration mismatch). In-app
   editor is a vanilla `<textarea>` with monospace font (zero new
   dependency). File tree with create/delete + path validation against
   `^/[A-Za-z0-9._/-]+[A-Za-z0-9._-]$`. SVG skyline where each file path
   hashes to a stable (x, height, hue) glyph via FNV-1a + `mulberry32`
   PRNG (reusing `components/entry/scene-helpers.ts`). Newly created files
   animate-grow from the ground over 1.1s. "Save to GitHub" button is
   labeled Wave 3 follow-up with a status banner explaining the
   placeholder (Lock 5 compliance, no fake persistence).

2. **Rewrite** `frontend/app/start/build-from-scratch/page.tsx`. Was a
   redirect-only Server Component. Now a real Next.js page that mounts
   `<BlankCityWorkspace />` with the same `Space_Grotesk` + `JetBrains_Mono`
   next/font wiring as `/start`. Title and description updated.

3. **Edit** `frontend/components/entry/EntryApp.tsx` line 35-45.
   `BLANK_CITY_TARGET` constant changed from `/city?mock_auth=true&mode=empty`
   to `/start/build-from-scratch`. The right-door click navigates to the
   Hestia-owned workspace directly. No `/city` dependency.

### Why a 2D SVG skyline instead of a 3D `<BuildingInstances>` scene

Iris owns `cityEngine.ts` and the 3D city renderer per Manager Wave-Fixing
#2 anti-collision rule. Without an Iris coordination handshake landing in
the same cycle, the only way to render a 3D scene from a Hestia-owned route
would be to either (a) duplicate the city engine code into a Hestia module
(Lock 8 DRY violation, plus a major bundle-size hit on the entry surface)
or (b) cross the ownership boundary.

The SVG skyline approach keeps Hestia inside its boundary while honoring
PRD 7.1 intent (buildings rise as files are created). The visual language
quotes the right-door MiniCity preview (same `mulberry32` PRNG, same warm
palette, same vertical building glyphs), so the workspace reads as a
continuation of the entry-page scene.

A future cycle can swap the SVG mount for a 3D `<BuildingInstances>` mount
if Iris ships a `useVirtualFS()` adapter that Hestia can compose. The
`freshFS()` + `loadFS()` + `saveFS()` API surface is factored to make this
clean.

### Verification path

Local dev probe (`npm run dev`, port 3000):

- Navigate `/start` then click "Build from scratch". The casement animation
  runs (~2.2s) then navigates to `/start/build-from-scratch`. Verified via
  Playwright snapshot + direct GET 200.
- Direct hit on `/start/build-from-scratch` renders the workspace tree.
  Verified via Playwright snapshot: header, skyline (3 seed buildings),
  file tree with active `/README.md`, editor showing seed content, footer.
- Console clean. Zero hydration errors after the `SEED_EPOCH` sentinel fix.
- TypeScript noEmit: zero errors across touched files.

### Verdict

**FIXED**.

## Bug E-6 CRITICAL: Demo dataset client-side exception

### Root cause investigation

QA round 2 reported the same client-side exception class when loading the
demo fastapi-fullstack path through the picker. The picker at
`/start/pick-repo` navigates to `/city?demo=fastapi-template&mock_auth=true`.

The `/city` route's `useCityData()` hook (`frontend/src/scene/buildings/useCityData.ts`)
is a singleton hardcoded to `mockCityData.ts` (Iris Wave 1 ship) and does
not branch on `searchParams.get('demo')`. The actual crash is downstream
of Hestia file ownership.

I could not reproduce the production client-side exception in the local
dev environment; `/city?demo=...` returns 200 and the page mounts cleanly
in dev. The QA evidence pointed at the live production build; production
webpack tree-shake is more aggressive and may surface runtime issues that
dev hides.

### Fix (partial, Hestia-side)

Within the Hestia surface I shipped two changes:

1. **PyGoat demo dataset added** to `frontend/components/entry/RepoPickerStep.tsx`.
   The `DEMO_DATASETS` array now includes all three datasets named in PRD
   line 320-323 (NodeGoat, fastapi-template, PyGoat). Wave-Fixing #1 only
   surfaced the first two.

2. **Fallback signaling rail**: `RepoPickerStep` now reads
   `?fallback_reason` from `window.location.search` on mount. When the
   value is `demo_crash`, a warn banner surfaces:
   > the previous demo render threw a client-side exception before the
   > city could mount. Try a different demo dataset below, or paste a
   > repository URL.

   The banner is idempotent (no flag = no banner). This is a signaling
   rail that an Iris/Hera/Persephone cycle can trigger by adding an error
   boundary to `/city` that redirects back to `/start/pick-repo?fallback_reason=demo_crash`
   when the city scene throws on a demo dataset. Hestia ships the receiving
   end of the contract this cycle.

### Cross-scope handoff to Iris / Hera / Persephone

The Iris/Hera/Persephone team owns the actual `/city` demo schema swap.
Recommended actions for the next cycle:

- Modify `frontend/src/scene/buildings/useCityData.ts` so the hook reads
  `useSearchParams` (with proper Suspense wrapping) or accepts the demo
  key as a prop from the city page. Switch on the key to load the
  corresponding pre-parsed dataset from `/public/datasets/<repo-id>.json`
  (the PRD line 327 deliverable).
- Add an error boundary at the city scene root that catches scene-mount
  exceptions and redirects to `/start/pick-repo?fallback_reason=demo_crash`
  rather than showing the Next.js default error page. The receiving banner
  is already in place on the picker.
- Verify the three Day-0 prep datasets exist at
  `/public/datasets/{nodegoat,fastapi-fullstack,pygoat}.json` per PRD line
  320-323. If any are missing the demo dataset feature should be honestly
  labeled accordingly per Lock 5.

### Verdict

**PARTIAL**. Ship-blocking demo-path-back-to-safety delivered. PyGoat
demo coverage parity with PRD restored. The downstream `/city` demo
render schema swap is flagged to Iris/Hera/Persephone for a cross-scope
cycle.

## Entry polish

All three polish items from the Manager prompt:

- **5 resident introduction footer**: verified present + intact (Athena +
  Apollo + Argus + Clio + Hermes). Came in from Wave 1 ship. No edit
  required.
- **v0.3 prototype badge**: verified visible top-right of the header.
  Came in from Wave 1 ship. No edit required.
- **Docs + Changelog nav**: added to `Header.tsx` this cycle.
  - Docs anchors to `#privacy-notice` (the on-page Data residency notice
    contains the densest doc surface for Wave 1 alpha; Wave 3 wires a
    real /docs route).
  - Changelog opens `https://github.com/Finerium/codeplexRefactory/commits/main`
    in a new tab (`target=_blank rel=noopener`).
  - 1px divider between the nav links and the build tag + v0.3 badge.
- **2 entry card hover state cinematic**: verified existing `WindowCard`
  transforms match the Designer Prompt 2 polish bar (`translateY(-4px)` on
  focus + drop-shadow + inset glow + ember border on focus). No edit
  required.

## Smoke verification performed

1. **TypeScript noEmit**: zero errors across all touched files.
2. **Playwright probe** via local dev:
   - `/start` returns 200, renders entry composition with new header nav.
   - `/start/build-from-scratch` returns 200, renders workspace cleanly
     (no hydration errors, 3 seed buildings in skyline, editor focused on
     README).
   - `/start/pick-repo` returns 200, renders picker with 3 demo datasets
     and graceful fallback for backend 404.
3. **HTML inspection of SSR output**: skyline rect coordinates stable
   server-vs-client (the `SEED_EPOCH = 0` sentinel pattern works).
4. **Lock 1 + Lock 2 scan**: zero em dash, zero emoji across all touched
   files (`grep` confirmed).

## Lock compliance

- Lock 1 (no em dash): clean across all touched files.
- Lock 2 (no emoji): clean across all touched files.
- Lock 3 (no silent scope narrow): explicit ship-vs-defer split per bug.
  E-5 FIXED. E-6 PARTIAL with cross-scope handoff explicit.
- Lock 4 (no fabrication): "Save to GitHub" labeled Wave 3 follow-up. SVG
  skyline labeled as 2D placeholder for future 3D Iris mount.
- Lock 5 (honest claim): PARTIAL verdict declared explicitly on E-6.
  Fallback banner is a signaling rail, not a masked failure.
- Lock 7 (Greek mythology naming): worker identity preserved. New
  identifiers (BlankCityWorkspace, VirtualFS) use neutral domain names.
- Lock 8 (DRY): SVG skyline reuses `mulberry32` from `scene-helpers.ts`
  rather than duplicating the PRNG.
- Lock 10 (audit gate): handoff log + decision log + uncertainty journal +
  checkpoint all authored this cycle.

## Recommended next actions (parent / Manager)

1. **Atlas**: re-deploy live cluster on this commit to surface the
   Wave-Fixing #2 ship.
2. **Iris / Hera / Persephone**: pick up the `/city` demo schema swap.
   Switch `useCityData()` on `searchParams.get('demo')` to load the right
   pre-parsed dataset. Add a city-scene error boundary that redirects to
   `/start/pick-repo?fallback_reason=demo_crash` on scene mount failure.
3. **Manager**: confirm the Wave-Fixing #2 ship matrix. The 4 mandatory
   artifacts for this cycle are at:
   - decision log: `_meta/decision_log/hestia.md` (D2 entry)
   - uncertainty: `_meta/uncertainty/hestia-wave-fixing-2-cycle1-20260513-0328.md`
   - checkpoint: `_meta/checkpoints/hestia-wave-fixing-2-cycle1.md`
   - handoff: this file
