---
actual_timestamp: 2026-05-13T03:28+07:00 (WIB) / 2026-05-12T20:28:00Z (UTC)
worker: Hestia
identity_mode: rescue
wave: Wave-Fixing #2
cycle: 1
stamp: 20260513-0328
ship_state: clean
scope_bugs: [E-5, E-6]
verdict_per_bug:
  E-5: FIXED
  E-6: PARTIAL (Hestia-side ship clean; /city render owned by Iris/Hera/Persephone)
---

# Hestia Wave-Fixing #2 cycle 1 checkpoint

## Cycle scope

Manager Wave-Fixing #2 dispatch cluster 5: rescue E-5 (Build from scratch client exception) + E-6 (demo dataset client exception) + entry-page polish (Docs + Changelog nav + 5 resident strip + v0.3 badge verify). Submission deadline ~9.5h ahead at cycle start.

## Files added or edited

### New

- `frontend/components/start/BlankCityWorkspace.tsx`
  In-memory virtual FS workspace. VirtualFS model with localStorage persistence under `codeplex.blank-city.vfs.v1`. Textarea editor. File tree with create/delete. SVG skyline with grow animation per file. PRD 7.1 in-memory virtual FS spec satisfied entirely within Hestia file ownership.

### Edited

- `frontend/app/start/build-from-scratch/page.tsx`
  Rewrite from redirect-only Server Component into a real Next.js page that mounts `<BlankCityWorkspace />`. Same next/font wiring as `/start`. Title and description updated.

- `frontend/components/entry/EntryApp.tsx`
  `BLANK_CITY_TARGET` constant retargeted from `/city?mock_auth=true&mode=empty` to `/start/build-from-scratch`. Right-door click now navigates to the Hestia-owned workspace directly.

- `frontend/components/entry/Header.tsx`
  Added `<nav aria-label="entry nav">` with Docs anchor link (`#privacy-notice`) and Changelog external link (GitHub commits, `target=_blank rel=noopener`). 1px divider between nav and the build tag + v0.3 prototype badge.

- `frontend/components/entry/PrivacyNotice.tsx`
  Added `id="privacy-notice"` plus `scrollMarginTop: 80` so the Docs anchor lands cleanly below the fixed header.

- `frontend/components/entry/RepoPickerStep.tsx`
  Added third demo dataset (OWASP PyGoat) matching PRD line 320-323. Added `?fallback_reason=demo_crash` query handler with a warn banner so a future Iris/Hera/Persephone city-side patch can route users back here with a clear explanation rather than a dead end.

## Bug E-5 CRITICAL: "Build from scratch" client-side exception

### Root cause

Wave-Fixing #1 cycle 1 had fixed the original 404 by retargeting the right door at `/city?mock_auth=true&mode=empty`. The `/city` route is Iris/Hera/Persephone domain and either threw a runtime client-side exception in the production webpack build or silently rendered the full mockCityData regardless of the `mode=empty` query. Both outcomes violated PRD Section 7.1 line 292 spec for "Build from scratch entry option (in-memory virtual FS)".

### Fix

Sidestep the failing `/city` chain by shipping a real Hestia-owned workspace at `/start/build-from-scratch` that satisfies PRD 7.1 inside the Hestia ownership boundary:

1. `BlankCityWorkspace` component renders an empty city (one anchor light + three seed buildings).
2. In-app text editor uses a vanilla `<textarea>` with monospace font. Zero new npm dependency.
3. File create handler raises a new building glyph in the SVG skyline. Glyphs animate-grow from the ground over 1.1s. Per-path hash + `mulberry32` PRNG keeps each file's glyph deterministic across renders.
4. localStorage persistence under key `codeplex.blank-city.vfs.v1`. Try/catch wraps both read and write so the workspace survives private-browsing / quota-exceeded.
5. "Save to GitHub" button labeled honest ("Wave 3 follow-up") plus a status banner that surfaces on click. No silent fake persistence (Lock 5 compliance).

### Verification path

Local dev probe (`npm run dev`, port 3000):

1. Navigate `/start` then click "Build from scratch". The casement animation runs (~2.2s) then navigates to `/start/build-from-scratch`. Verified via direct GET 200 + Playwright snapshot showing the workspace tree.
2. Direct hit on `/start/build-from-scratch` renders the workspace tree: header with title "Build the city as you type", skyline section with 3 seed buildings, file tree with `/README.md` (active), `/app/health.ts`, `/app/main.ts`, editor showing README content, footer with PRD 7.1 in-memory virtual FS disclosure.
3. Console clean. Zero errors, zero warnings (only the expected backend `ERR_CONNECTION_REFUSED` for `/api/activity` from the city route during browser warmup, which is unrelated).
4. SSR HTML inspection: skyline rect heights are stable between server and client (avoids React 19 hydration mismatch via the `SEED_EPOCH = 0` sentinel timestamp pattern documented in source).
5. TypeScript noEmit: zero errors after the changes.

### Verdict

**FIXED**.

## Bug E-6 CRITICAL: Demo dataset client-side exception

### Root cause investigation

QA round 2 reported the same client-side exception class on the demo fastapi-fullstack path. The picker at `/start/pick-repo` navigates to `/city?demo=fastapi-template&mock_auth=true`. The `/city` route's `useCityData()` hook is a singleton hardcoded to `mockCityData.ts` (Iris Wave 1 ship) and does not branch on `searchParams.get('demo')`. The actual crash is downstream of Hestia file ownership.

### Fix (partial, Hestia-side)

Within the Hestia surface:

1. Added OWASP PyGoat as the third demo dataset so the picker exposes all three names from PRD line 320-323 (NodeGoat + fastapi-template + PyGoat).
2. Added `?fallback_reason=demo_crash` query handler in `RepoPickerStep.tsx`. When that flag is present a warn banner surfaces: "the previous demo render threw a client-side exception before the city could mount. Try a different demo dataset below, or paste a repository URL." This is a signaling rail that a future Iris/Hera/Persephone patch can trigger by redirecting back from the city's error boundary; the banner is idempotent (no flag = no banner).
3. The downstream /city demo render schema swap is documented as a cross-scope handoff in the same-cycle handoff log.

### Verdict

**PARTIAL**. The Hestia-side ship is clean (picker has all three demos, fallback signaling lives). The downstream `/city` route's `useCityData()` schema-vs-render fix is flagged to Iris/Hera/Persephone for a cross-scope cycle.

## Entry polish

- 5 resident introduction footer: verified present + intact (Athena + Apollo + Argus + Clio + Hermes), came in from Wave 1 ship, no edit needed.
- v0.3 prototype badge: verified visible top-right, came in from Wave 1 ship.
- Docs + Changelog nav: added to Header in this cycle. Docs anchors to the on-page privacy notice (which contains the data residency doc surface, the densest doc area for Wave 1 alpha). Changelog opens the GitHub commits page in a new tab.
- 2 entry card hover state: verified cinematic, existing WindowCard transforms (`translateY(-4px)` + drop-shadow + glow on focus) match the Designer Prompt 2 polish bar. No edit needed.

## Smoke verification

1. `npx tsc --noEmit -p tsconfig.json`: zero errors across all touched files.
2. Playwright probe via local dev:
   - `/start` returns 200, renders entry composition (header with new nav, two doors, 5 resident strip, footer, privacy notice).
   - `/start/build-from-scratch` returns 200, renders workspace (skyline + file tree + editor + footer).
   - `/start/pick-repo` returns 200, renders picker (now with 3 demo datasets), shows graceful fallback when backend `/api/repos/list` 404 (expected in local dev without backend running).
3. Lock 1 (no em dash) scan: clean across touched files.
4. Lock 2 (no emoji) scan: clean across touched files.

## File ownership compliance

Anti-collision discipline upheld. Zero edit on:

- `cityEngine.ts` (Iris OWN)
- `backend/app/api/auth/github.py` (Hades OWN)
- `backend/app/api/repos.py` (Hades OWN)
- `src/scene/*` (Iris/Hera/Persephone OWN)
- `app/city/*` (Calliope/Hera/Persephone OWN)

All Hestia changes live in `frontend/app/start/*`, `frontend/components/start/*`, `frontend/components/entry/*`. The `components/entry/*` edits are continuation of the same Wave 1 surface I authored.

## Lock compliance

- Lock 1 (no em dash): clean.
- Lock 2 (no emoji): clean.
- Lock 3 (no silent scope narrow): explicit ship-vs-defer split per bug. E-5 FIXED, E-6 PARTIAL with cross-scope handoff documented.
- Lock 4 (no fabrication): "Save to GitHub" labeled Wave 3 follow-up. SVG skyline labeled as 2D placeholder for future 3D Iris mount. Honest claims throughout.
- Lock 5 (honest claim): seed-file `SEED_EPOCH = 0` choice documented inline. Fallback banner is a signaling rail not a masked failure. PARTIAL verdict declared explicitly.
- Lock 7 (Greek mythology naming): all new identifiers use neutral domain names (BlankCityWorkspace, VirtualFS, etc.) plus the Hestia worker identity preserved.
- Lock 10 (audit gate): submission window approaching. This cycle is Wave-Fixing #2 dispatch, audit chain is Manager-controlled.

## Capacity used vs budget

Approximately 1h elapsed (investigation + new workspace authoring + edits + verification + artifacts). Well inside cycle budget for a CRITICAL rescue. No ferry triggered.

## Ferry decision

**No ferry**. Cycle artifacts ship clean within Hestia file ownership. Cross-scope coordination on `/city` demo render documented in handoff log for Manager dispatch routing.

## Recommended next actions

1. **Manager / Atlas**: re-deploy live cluster on this commit to surface the Wave-Fixing #2 ship.
2. **Manager / Iris-or-Hera-or-Persephone**: pick up the `/city` demo render scope. `useCityData()` should branch on `searchParams.get('demo')` to load the right per-demo pre-parsed dataset (PRD line 320-323 Day-0 prep deliverable). Once that lands, the picker's demo affordance is end-to-end clean and the fallback banner can stay quiet.
3. **Manager / Aletheia or equivalent gate**: confirm the build-from-scratch workspace satisfies PRD Section 7.1 expectations for the demo. If the panitia evaluation rubric wants a true 3D city for the blank-lot path, queue an Iris cycle to swap the SVG skyline for a 3D `<BuildingInstances>` mount via a `useVirtualFS()` adapter.
