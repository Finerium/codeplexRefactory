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
