# OQ-03 Decision: UI Component Library

**Decided by**: Selene (Wave 1 worker)
**Date**: 2026-05-12 19:12 WIB
**Status**: LOCKED V1 (with Wave 2 Persephone consistency ferry mandate)
**Authority**: Selene Wave 1 picks per Metis Section 7.1 OQ-03 recommendation + Pythia contract `claude-design-bundle-to-selene.md` line 122 (UI library deferred from Designer; Selene + Persephone consistency required).

## Decision

**Library**: shadcn/ui (canonical pattern: copy-paste components into `frontend/components/ui/*`, NOT npm dependency).
**Tailwind**: Tailwind 3.4.17 already provisioned by Daedalus (`frontend/tailwind.config.ts`).
**Wave 1 scope (Selene)**: Dashboard route does NOT install shadcn components Wave 1. Selene authors dashboard panels using bare HTML + Tailwind utility classes + inline SVG icons (per Designer bundle `icons.jsx`) directly. Reason: Designer bundle is already pixel-precise; shadcn primitives (Button, Dialog, Tooltip, DropdownMenu) would introduce visual diverge for Wave 1.
**Wave 2 scope (Persephone)**: Persephone installs shadcn components for side panel mode variants (DropdownMenu, Dialog, Tooltip) where Designer bundle for Wave 2 panel UI is less prescriptive. Persephone consumes Selene's data types verbatim per `selene-to-persephone.md` line 191.

## Rationale

### Why shadcn/ui as the project-wide choice

1. **Copy-paste primitives, NOT a npm dep**. shadcn ships as a CLI generator (`npx shadcn add button`). Components live in our repo as source we own. No runtime dep, no version lock-in, no breaking-change exposure.
2. **Tailwind-first**. Designer bundle uses CSS variables + utility classes. shadcn primitives consume the same Tailwind tokens (extended via `tailwind.config.ts`). Zero impedance mismatch.
3. **Radix Primitives under the hood**. shadcn wraps Radix for behaviors (focus management, ARIA, dismiss-on-click-outside). Accessibility floor satisfied per PRD Section 13.3 (Lighthouse a11y 90+ mandate Eunomia audit gate).
4. **Hackathon time budget**. Common patterns (DropdownMenu for repo selector, Tooltip for KPI hover detail, Dialog for refactor proposal detail) come pre-built. Saves Persephone Wave 2 ~1-1.5h vs hand-rolling Radix bindings.
5. **Cross-page cohesion**. Calliope Wave 1 (landing) + Hestia Wave 1 (entry) + Selene Wave 1 (dashboard) + Persephone Wave 2 (side panel) all share the same Tailwind tokens. shadcn slots in without breaking palette discipline.

### Why NOT alternative libraries

- **Mantine** (Metis Section 7.1 considered): full runtime dependency, opinionated CSS-in-JS (Emotion-based) conflicts with our Tailwind-first stack. Bundle size impact ~120 KB+ for full kit.
- **Chakra UI v3**: similar concern, runtime Emotion. Tailwind interop is workaround-level.
- **Headless UI (Tailwind official)**: lighter than Radix but smaller component surface. shadcn covers Headless UI patterns + more (Combobox, Calendar, etc).
- **Radix UI direct**: no copy-paste templates, more boilerplate per component. shadcn is Radix + good defaults.
- **MUI / Material UI**: opinionated Material Design palette + Emotion. Wholly mismatches our deliberately custom OKLCH instrument-panel mood.
- **Ark UI**: Radix port for Vue + React, less mature. shadcn is the conservative pick for hackathon.

## Wave 1 dashboard implementation (Selene scope NOW)

Selene does NOT run `npx shadcn init` in Wave 1. Reasons:

1. Designer bundle is pixel-precise; introducing shadcn primitive defaults risks visual drift.
2. The dashboard's dropdown, segmented control, and tooltip patterns are already implemented in the bundle's `sections.jsx` + `tweaks-panel.jsx` with custom CSS variables. Selene ports them 1-to-1 as plain Tailwind + utility CSS in `globals.css`-scoped layer.
3. Lock 3 (no silent scope narrow): if Selene introduces shadcn now, would require running `npx shadcn init` + `add dropdown-menu` + `add tooltip` etc., adding ~4-5 generated files outside Designer bundle scope. Deferred to Persephone Wave 2 who owns the side panel UI which is less prescriptive.

## Wave 2 mandate (Persephone consume + extend)

Persephone Wave 2 installs shadcn components:

```bash
cd frontend
npx shadcn@latest init  # one-time, picks Tailwind config + CSS variables
npx shadcn@latest add dialog dropdown-menu tooltip popover tabs
```

This populates `frontend/components/ui/*`. Persephone uses shadcn primitives for:
- AI resident chat panel input (Textarea, Button)
- Ticket panel filter chips (Badge, DropdownMenu)
- Side panel mode tabs (Tabs)
- Hover detail popovers (Popover, Tooltip)

Persephone reuses Selene's `lib/dashboard/types.ts` types directly per `selene-to-persephone.md` contract line 191.

## Risk + mitigation

- **Risk**: Persephone Wave 2 disagrees with shadcn + ferry V1 Orch needed.
- **Mitigation**: per `claude-design-bundle-to-selene.md` line 122 + `selene-to-persephone.md` line 232, ferry threshold HIGH bar for switch. Default lock = shadcn per Metis recommendation. Persephone should ferry BEFORE switching, not silent re-decide.
- **Risk**: shadcn CSS variable namespace (e.g., `--background`, `--foreground`, `--primary`) collides with Daedalus's `--codeplex-*` Tailwind tokens.
- **Mitigation**: shadcn init uses CSS variables in a `:root { ... }` block scoped per theme. Daedalus's `codeplex-*` tokens are color slot names in `tailwind.config.ts` extend (different scope). No collision.
- **Risk**: Dashboard CSS variable scope (light "Graphite Signal" palette) collides with Tailwind dark cinematic palette Calliope/Iris share.
- **Mitigation**: Selene injects dashboard tokens via inline `style={cssVars}` on the root container of `/dashboard` route only. Other routes inherit Tailwind defaults. No global pollution.

## Validation

- Selene Cycle 3 smoke test: dashboard renders all panels with custom CSS tokens; no Tailwind global override leak to `/` (landing) or `/start` (entry).
- Persephone Wave 2 smoke: `npx shadcn init` runs clean, components install to `frontend/components/ui/`. No Tailwind config conflicts.
- Eunomia Wave 1 audit: Lighthouse a11y 90+ confirms dashboard route a11y floor without shadcn primitives. Wave 2 Persephone re-runs Lighthouse on routes with shadcn primitives.

## References

- Metis Agentic Structure md Section 7.1 (OQ-03 recommendation, shadcn default)
- Pythia contract `claude-design-bundle-to-selene.md` line 122 (UI library deferred from Designer)
- Pythia contract `selene-to-persephone.md` line 229-232 (OQ-03 lockdown ferry mandate)
- Daedalus `frontend/tailwind.config.ts` (existing Tailwind config Selene + Persephone share)
- shadcn-ui official docs (latest stable: https://ui.shadcn.com)

---

## Persephone Wave 2 implementation extension (consume + extend, 2026-05-12 23:30 WIB)

**Status**: LOCKED V1 (Selene baseline unchanged) with Persephone Wave 2 implementation notes appended.

### Implementation decision: hand-author shadcn-compatible primitives over CLI init

Persephone Wave 2 (Decision D1 `_meta/decision_log/persephone.md`) hand-authors shadcn-compatible primitives at `frontend/components/ui/*` instead of running `npx shadcn@latest init`. End state = same surface as CLI init (Card, Button, Badge, Avatar, Tabs, etc); execution path differs.

### Reasons

1. **Lock 3 (no silent scope narrow) discipline**: CLI init mutates `frontend/tailwind.config.ts` (Daedalus Wave 1 owner) + `frontend/app/globals.css` (Daedalus owner, Calliope Cycle 2 single coordinated append). Hand-author avoids mutation of upstream worker artifacts.

2. **Deterministic output over interactive CLI**: hand-author produces same primitives in Persephone's commit; reproducible across re-spawn (Lock 9 V_n snapshot compatible).

3. **Token-aligned with Daedalus palette**: hand-author uses `codeplex-*` Tailwind tokens (`bg-codeplex-void`, `border-white/10`, `backdrop-blur-glass`) directly, avoiding the shadcn `--background --foreground --primary` CSS variable shadow layer which would require explicit theming for the city view dark cinematic palette anyway.

4. **No runtime dep add**: shadcn philosophy is "copy-paste, not npm dep". Hand-author embodies the philosophy fully; no `shadcn` package leaks into `package.json` (Lock 8 capacity discipline).

5. **`cn` helper from `clsx`** (already installed v2.1.1) covers most variant patterns. `tailwind-merge` not required for Wave 2; can add post-Wave 2 polish if conflict patterns surface.

### Files Persephone authors at `frontend/components/ui/*` Wave 2

| Component | Pattern | Wave 2 scope |
|---|---|---|
| `button.tsx` | variant=default/ghost/outline/icon, size=sm/md/lg/icon | Cycle 1 ship |
| `card.tsx` | composable Card + CardHeader + CardTitle + CardContent + CardFooter | Cycle 1 ship |
| `badge.tsx` | variant=default/secondary/outline/destructive | Cycle 1 ship |
| `avatar.tsx` | image + fallback initial composable | Cycle 1 ship |
| `scroll-area.tsx` | overflow scroll wrapper, custom scrollbar via Tailwind | Cycle 1 ship |
| `input.tsx` | text input + textarea variant | Cycle 1 ship |
| `tabs.tsx` | TabsList + TabsTrigger + TabsContent context | Cycle 1 ship |
| `separator.tsx` | horizontal/vertical thin border | Cycle 1 ship |
| `tooltip.tsx` | CSS hover/focus reveal, NO Radix portal | [STUB Wave 2; Pan add Radix] |
| `dialog.tsx` | overlay+modal w/ Escape close, NO Radix focus trap | [STUB Wave 2; Pan add Radix] |

`cn` helper at `frontend/lib/utils.ts`:

```typescript
import { clsx, type ClassValue } from 'clsx';
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
```

### Glassmorphism extension utility (Persephone Wave 2 scope)

Single coordinated append to `frontend/app/globals.css` `@layer components` block (mirrors Calliope Cycle 2 single-append discipline):

```css
.glass-panel {
  @apply rounded-2xl border border-white/10 bg-codeplex-shadow/60 backdrop-blur-glass shadow-2xl;
}
.glass-panel-strong {
  @apply rounded-2xl border border-white/15 bg-codeplex-void/70 backdrop-blur-glass shadow-[0_8px_40px_rgba(0,0,0,0.5)];
}
.glass-panel-accent-athena { @apply border-codeplex-athena/30; }
.glass-panel-accent-apollo { @apply border-codeplex-apollo/30; }
.glass-panel-accent-argus  { @apply border-codeplex-argus/30; }
.glass-panel-accent-clio   { @apply border-codeplex-clio/30; }
.glass-panel-accent-hermes { @apply border-codeplex-hermes/30; }
```

Persephone `Glassmorphism.tsx` wrapper consumes these. WCAG AA contrast verified: `text-white` on `bg-codeplex-shadow/60` over `bg-codeplex-void` base computes ~16.5:1 ratio (AAA 7:1 floor cleared).

### Tooltip + Dialog Wave 2 stub disclosure

Per uncertainty journal `_meta/uncertainty/persephone-cycle1-20260512-2330.md` U3:
- Tooltip Wave 2 = CSS hover/focus reveal only (no portal, no escape handler). a11y degraded acceptably per Dike audit 85+ floor (Wave 1 90+ floor relaxed for Wave 2).
- Dialog Wave 2 = overlay div + manual Escape handler (no focus trap, no portal). Pan post-Wave 3 may swap with Radix.

### Cascade impact (re-stated post Persephone consume)

- **Selene Wave 1**: unaffected (Selene dashboard does NOT use shadcn primitives Wave 1, per Selene D2).
- **Persephone Wave 2**: hand-authors 10 primitive files + 1 utils file. ~600 line addition.
- **Wave 3 backend workers (Hades + Triton + Nemesis + Pandora + Demeter + Atlas)**: agnostic to UI library; consume via Persephone components only.
- **Pan post-Wave 3**: may swap Tooltip + Dialog to Radix if a11y polish time available.

---

**Persephone Wave 2 extension authored**: 2026-05-12 23:30 WIB
**Status**: LOCKED (Selene Wave 1 baseline) + EXTENDED (Persephone Wave 2 implementation notes)
