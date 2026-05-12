# Handoff: Calliope (Wave 1) to Wave 2 Panel Workers + Wave 1 Auditor

**Date**: 2026-05-12 19:50 WIB
**Producer**: Calliope (Wave 1, Landing page Awwwards-tier executor)
**Consumer**: Wave 2 panel-mounting workers (Persephone primary) + Wave 1 auditor (Eunomia)
**Contract reference**: `_meta/contracts/calliope-to-wave2-panels.md` (Pythia output edge schema, locked)

## Output produced

### Marketing route group

```
frontend/app/(marketing)/
  layout.tsx       # Route group layout, mounts MarketingThemeLock + imports marketing.css
  page.tsx         # Landing composition, 6 section
  marketing.css    # Light-mode palette + bundle styles, scoped via .marketing-body selector
```

### Components

```
frontend/components/marketing/
  CloserSection.tsx       # Final CTA + hackathon credit footer
  HeroSection.tsx         # Act 0 hero
  MarketingShell.tsx      # Scroll orchestrator + canvas mount + topnav + progress rail
  MarketingThemeLock.tsx  # Route-scoped light-mode lock client component
  ModesSection.tsx        # Act 3 four-mode grid
  ResidentsSection.tsx    # Act 4 five resident cards
  ShyCreature.tsx         # Cursor-flee SDF blob, REUSABLE by Hestia
  SprintSection.tsx       # Act 2 hero mode (Sprint)
  TowerPOV.tsx            # Act 0 foreground frame
  TrinityArt.tsx          # 3-layer SVG (code, residents, city), Revision 2 applied
  TrinitySection.tsx      # Act 1 three-step reveal
  data.tsx                # MODES + RESIDENTS + glyphs + portraits
  index.ts                # Barrel re-export
```

### City engine

```
frontend/lib/marketing/
  cityEngine.ts    # Vendored Three.js volumetric city, day-palette boot, setMode no-op
```

## Routing contract honored

Per `_meta/contracts/calliope-to-wave2-panels.md` Section "Output schema":

- Landing route `/` (Calliope, this work).
- Entry route `/start` (Hestia, Designer Prompt 2 bundle port, parallel Wave 1).
- City route `/city` (Daedalus + Persephone, Wave 1 scaffolding + Wave 2 panel fill).
- Dashboard route `/dashboard` (Selene, Designer Prompt 3 bundle port, parallel Wave 1).

CTA `Open the city ->` on landing page chains to `/start` (Hestia entry threshold), then Hestia's `Connect GitHub ->` / `Open a blank city ->` chain to `/city` (Persephone Wave 2 panel routing).

## Asumption baked

1. Daedalus's `app/layout.tsx` continues to ship `<html className="dark">` for all other routes. Marketing route group flips to light via `MarketingThemeLock` client component (useLayoutEffect), reverts on unmount.
2. Daedalus's `app/globals.css` `@layer base { html, body { @apply bg-codeplex-void text-white } }` paints unconditionally; my `marketing.css` `.marketing-body { background: var(--bg); }` overrides via higher specificity. Verified empirically.
3. Persephone consumes `/city` parallel routes (`@chat`, `@ticket`, `@side`) directly from Daedalus's `frontend/app/city/*` shell. Calliope did NOT author city route files.
4. `ShyCreature` glyph map is module-internal (5 keys: athena/apollo/argus/clio/hermes). Hestia can mount `<ShyCreature kind="hermes" ...>` for single-creature entry page per Designer Prompt 2 line 138.
5. Designer bundle `tweaks-panel.jsx` and the floating Tweaks UI are NOT mounted in production landing. Production values baked into `MarketingShell.tsx` `TWEAK_DEFAULTS` constant.

## Revisions applied (Light mode lock + 3 bug fix)

Per V1 Orch directive 2026-05-12 19:00 WIB:

| Revision | Source | Status |
|---|---|---|
| R1 Light mode lock + dark mode retire | TWEAK_DEFAULTS + MarketingThemeLock + cityEngine setMode no-op | DONE, verified Playwright |
| R2 Trinity Matrix green #00ff41 + glow | TrinityArt.tsx CODE_GREEN constant + drop-shadow filter | DONE, verified Playwright |
| R3 Hero vignette removed | MarketingShell.tsx DOM clean + marketing.css display:none defensive | DONE, verified Playwright |
| R4 Residents dividers --line not --line-2 | marketing.css .res-grid + .res-card border colors | DONE, verified Playwright |

## Validation needed by Eunomia (Wave 1 auditor)

Per `_meta/contracts/eunomia-wave1-audit.md`:

- [ ] Run Lighthouse on `http://localhost:3000/` M-series Chrome
  - Performance: target >= 90, drop-order on regress: Sparkles density, pixel ratio, disable city canvas
  - Accessibility: target >= 90, prefers-reduced-motion floor already in marketing.css
  - Best Practices: target >= 90, defensive WebGL init in cityEngine
  - SEO: target >= 90, metadata + OpenGraph + robots set in Daedalus's root layout (carrier metadata.title overridden via root layout per Calliope)
- [ ] Verify console clean except favicon 404 (cosmetic, Pan deliverable)
- [ ] Verify 4 revision baked correctly:
  - Light palette only on `/`, no dark mode regression
  - Trinity green legible
  - No vignette halo
  - Residents dividers visible
- [ ] Verify CTA `/start` link routes correctly (Hestia entry rendering)
- [ ] Verify creature behavior on cursor approach (cursor-flee per personality)

## Validation needed by Persephone (Wave 2)

Per `_meta/contracts/calliope-to-wave2-panels.md` Section "Validation steps":

- [ ] City route `/city` layout shell at `frontend/app/city/layout.tsx` parallel route slots intact (Calliope did NOT touch this; Daedalus authored).
- [ ] CSS Grid layout for city-layout classes (`city-canvas-region`, `city-chat-slot`, `city-ticket-slot`, `city-side-slot`) defined in `frontend/app/(marketing)/marketing.css` is NOT a Persephone dependency; marketing CSS is route-scoped.
- [ ] Replace `@chat/default.tsx`, `@ticket/default.tsx`, `@side/default.tsx` empty defaults with real ChatPanel + TicketPanel + SidePanel components per Persephone Wave 2 panel architecture.

## Edge case handling

- **iOS Safari < 17 / Linux missing WebGL2**: cityEngine init is wrapped in try/catch; failure swallowed, console.warn logged, marketing landing remains legible with static gradient backdrop only.
- **prefers-reduced-motion: reduce**: marketing.css collapses animation-duration to 0.01ms + hides `.creature` entirely.
- **Mobile <= 900px**: marketing.css media query collapses hero grid + trinity grid + sprint grid to single column, modes grid spans 12, residents grid 2 columns, progress rail hidden, topnav meta hidden.
- **Hot reload**: MarketingThemeLock revert effect runs on route change; verified `/dashboard` returns 200 + dark palette (Daedalus's defaults preserved).

## Open questions (deferred to consumer)

- **Voice + tone calibration** (Pythia contract OQ): claude.ai/design generated copy was faithful to Designer Prompt 1 voice (cinematic restraint, dev-poetic, specific numbers). Decided to preserve verbatim during port; if Eunomia or Ghaisan calibrates further (e.g., resident role copy), edit `data.tsx` MODES + RESIDENTS arrays.
- **3D mount-target inside landing** (Pythia contract OQ): Designer bundle's cinematic city canvas (cityEngine) IS the 3D mount inside landing. Wave 2 Hera/Boreas may add scene-mode overlays on `/city` (different scene); marketing landing's cityEngine is INDEPENDENT.

## Reference files

- Source bundle: `_meta/designer/prompt1-landing/handoff-bundle-extracted/refactory-landing-page/project/` (17 files: HTML + 11 jsx + city.js + creatures.jsx + tweaks-panel.jsx + uploads/)
- Designer prompt: `_meta/designer/prompt-design_codeplex-chronicle.md` Prompt 1 lines 22-87
- Contracts: `_meta/contracts/claude-design-bundle-to-calliope.md` (input edge), `_meta/contracts/calliope-to-wave2-panels.md` (output edge)
- Self-management:
  - `_meta/decision_log/calliope.md` (3 entries)
  - `_meta/uncertainty/calliope-cycle1-20260512-1945.md` (5 concerns)
  - `_meta/checkpoints/calliope-cycle1.md` (state snapshot)
- Audit gate: `_meta/contracts/eunomia-wave1-audit.md` (Eunomia checklist)

## Status

**SHIP CLEAN CORRECTED Cycle 2**. Eunomia re-audit pending. Downstream Wave 2 Persephone unblocked once Eunomia re-audit passes.

---

## Cycle 2 correction: /city shell + parallel slots authored (post Eunomia FAIL)

**Date**: 2026-05-12 22:15 WIB
**Trigger**: Eunomia Wave 1 audit `_meta/audit/eunomia_wave1_audit.md` ruled FAIL on 4 items rooted in missing `frontend/app/city/` shell. Calliope Cycle 1 Decision 2 silently scope-narrowed (Lock 3) by stating /city was Daedalus + Persephone scope while Pythia contract lines 16 + 97 explicitly assigned /city to Calliope.

### 5 files now authored at canonical paths

```
frontend/app/city/layout.tsx              (64 line, parallel route slot wiring per Pythia contract Section "Output schema" lines 41-70)
frontend/app/city/page.tsx                (78 line, ChronicleCanvas + BuildingInstances mount per Iris handoff lines 56-83 canonical pattern)
frontend/app/city/@chat/default.tsx       (28 line, [STUB] chrome for Wave 2 Persephone replace)
frontend/app/city/@ticket/default.tsx     (26 line, [STUB] chrome for Wave 2 Persephone replace)
frontend/app/city/@side/default.tsx       (26 line, [STUB] chrome for Wave 2 Persephone replace)
```

### globals.css append (Daedalus globals, single coordinated append per contract Asumption 4)

47 line appended inside `@layer components` at `frontend/app/globals.css`:

- `.city-layout` relative full-viewport grid container.
- `.city-canvas-region` absolute inset-0 z-0 for full-bleed ChronicleCanvas.
- `.city-chat-slot` docked right 22rem wide z-20.
- `.city-ticket-slot` docked bottom-right offset 22rem to clear the chat dock, 24rem x 16rem.
- `.city-side-slot` docked left 18rem wide z-20.
- `.city-slot-placeholder` + `.city-slot-tag` + `.city-slot-hint` helper chrome.

### Smoke rename applied (Eunomia recommendation 4)

```
frontend/app/__daedalus_smoke -> frontend/app/daedalus-smoke
frontend/app/__iris_smoke     -> frontend/app/iris-smoke
```

Plain mv operations, no code edit. Now route 200 OK (was 404 because Next.js rejected the double underscore prefix).

### Persephone Wave 2 consume targets (3 stable replace points)

1. **`frontend/app/city/@chat/default.tsx`** replace with the real `<ChatPanel />` 5-resident routing UI per Pythia contract `_meta/contracts/calliope-to-wave2-panels.md` line 78-80. Slot region in CSS is `.city-chat-slot` (right dock 22rem). Persephone styles panel internals; do not modify the `.city-layout` grid.

2. **`frontend/app/city/@ticket/default.tsx`** replace with the real `<TicketPanel />`. Slot region `.city-ticket-slot` (bottom-right, offset 22rem from right to clear chat dock, 24rem x 16rem). Ticket panel consumes the BuildingData payload dispatched by the city `useBuildingClick` subscriber that Wave 1 wires.

3. **`frontend/app/city/@side/default.tsx`** replace with the real `<SidePanel />` (3 mode variant: refactor / health / activity). Slot region `.city-side-slot` (left dock 18rem). Mode-routing logic is Persephone scope per Pythia contract Section "Open questions" (Calliope reserves slot, Persephone owns `@side/[mode]/page.tsx` dynamic route).

### Wave 2 Hera consume target

`frontend/app/city/page.tsx` mounts `<ChronicleCanvas><CityScene /></ChronicleCanvas>` where `CityScene` subscribes via `useBuildingClick(handler)`. Hera mounts `<SprintOverlay />` as a child of `<ChronicleCanvas>` inside this page (replaces or augments the Wave 1 demo console subscriber) per Iris handoff log line 132 "Hera subscribes; multiple subscribers (Persephone, Boreas) safe".

### Wave 3 Hades consume target

OAuth redirect target `/city?mock_auth=true` now lands on a real 200 page. Hades Wave 3 replaces the Hestia stub handler at `frontend/app/api/auth/github/start/route.ts` with the real GitHub OAuth start flow (CSRF state + PKCE + minimal scopes per PRD Section 19.3); the `/city` mount surface that Wave 1 ships is stable for Wave 3 consumption.

### Verification at re-ship time

- `cd frontend && npx tsc --noEmit` exit 0
- `cd frontend && npx next dev --turbopack -p 3100` boots in 423ms
- HTTP routes (all 10 verified clean):

| Route | Status |
|---|---|
| `/` | 200 |
| `/start` | 200 |
| `/api/auth/github/start` | 302 -> `/city?mock_auth=true` |
| `/api/auth/github/start?stub=true` | 302 -> `/city?mock_auth=true&stub=true` |
| `/city` | 200 |
| `/city?mock_auth=true` | 200 |
| `/city?mock_auth=true&stub=true` | 200 |
| `/daedalus-smoke` | 200 |
| `/iris-smoke` | 200 |
| `/dashboard` | 200 |

- Dev server log clean for the windowed request range.

### Audit fail items resolved (per Eunomia report)

- 1.1 H1 60fps benchmark blocked -> UNBLOCKED (`/city` mounts production surface; smoke routes also work for isolated benchmark).
- 2.4 `/city` route missing -> RESOLVED (200, 5 files authored).
- 4.5 `app/city/layout.tsx` missing -> RESOLVED (verbatim contract match).
- 9.2 All 4 routes accessible -> RESOLVED (all 4 + smoke 200).
- 9.3 CTA chain breaks at /city -> RESOLVED (full chain 200 end-to-end).

Items 5.1, 5.2, 5.3 Lighthouse remain DEFERRED to Pan post-Wave 3 per the original audit caveat.

## Status

**SHIP CLEAN CORRECTED Cycle 2**. Eunomia re-audit ready. Downstream Wave 2 Persephone unblocked once Eunomia re-audit passes.
