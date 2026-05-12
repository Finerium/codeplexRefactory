# Contract: Claude Design Bundle to Calliope

**Edge type**: external (claude.ai/design manual session output to Wave 1 worker)
**Wave**: External (Ghaisan operator) to Wave 1 consumer
**Status**: locked
**Authored**: 2026-05-12 14:55 WIB

## Producer

**Worker**: Ghaisan Khoirul Badruzaman (operator) via claude.ai/design platform manual session execution
**Domain**: Paste Prompt 1 (Landing Page) from `_meta/designer/prompt-design_codeplex-chronicle.md` lines 22-87 into fresh claude.ai/design roomchat. Engage in 3-direction proposal dialog. Pick one direction verbally. Iterate via Tweaks sliders + inline comments. Export Code Handoff Bundle via "Export to Claude Code" button when satisfied.

**Identity disclosure**: This is NOT a Claude Code worker. Producer is the human operator (Ghaisan) plus the claude.ai/design assistant (separate Claude.ai session, distinct from this Claude Code session). Producer is external by definition.

## Consumer

**Worker**: Calliope (Wave 1)
**Domain**: Landing page execution from Prompt 1 bundle integrated as `frontend/app/page.tsx` plus supporting components in `frontend/components/landing/`. Calliope ports bundle code to Next.js 16 + React 19 + Tailwind, preserves voice + motion + creature behavior, ensures Lighthouse 90+ on Performance + Accessibility + Best Practices + SEO.

## Output schema (producer to consumer)

Bundle structure exported by claude.ai/design and stored locally:

```
_meta/designer/prompt1-landing/handoff-bundle-extracted/
├── design-tokens.json          # Color palette + typography family + spacing scale + motion timing
├── components/                 # React component source per page section
│   ├── HeroSection.tsx
│   ├── TrinitySection.tsx
│   ├── ModesPreview.tsx
│   ├── ResidentsPreview.tsx
│   ├── TechStackSignal.tsx
│   ├── HackathonCreditFooter.tsx
│   └── ShyCreature.tsx         # Cursor-flee creature component, shared
├── pages/
│   └── page.tsx                # Assembled landing page composition
├── public/                     # Static assets (creature SVGs, HDRI files, fonts if self-hosted)
│   └── ...
├── styles/                     # Global CSS additions if any (Tailwind extension)
│   └── globals.css
└── intent.md                   # Voice + tone + motion philosophy + Tweaks parameter mapping
```

`design-tokens.json` shape (concrete expectations):

```json
{
  "colors": {
    "background": { "primary": "#0a0a0f", "secondary": "#13131a" },
    "foreground": { "primary": "#e8e8ee", "secondary": "#9a9aa8" },
    "accent": { "primary": "#7c8aff", "glow": "#a0b0ff" }
  },
  "typography": {
    "display": "...font family declaration, characterful display per Designer ban-list",
    "body": "...neo-grotesque body per Designer ban-list"
  },
  "spacing": { "scale": [4, 8, 12, 16, 24, 32, 48, 64, 96, 128] },
  "motion": {
    "easing": { "cinematic": "cubic-bezier(0.4, 0.0, 0.2, 1)", "creature-flee": "cubic-bezier(0.6, 0, 0.4, 1)" },
    "duration": { "fast": "200ms", "medium": "500ms", "slow": "1200ms" }
  },
  "tweaks": {
    "creatureFleeDistance": 150,
    "glassOpacity": 0.4,
    "paletteSaturation": 0.85,
    "motionIntensity": 0.8,
    "particleDensity": 1500,
    "scrollActPacing": 1.0
  }
}
```

`intent.md` schema:

```markdown
# Landing page design intent

## Direction chosen
<one of 3 proposals picked verbally by Ghaisan>

## Voice + tone
<dev-poetic declarative fragments, specific numbers, no marketing adjectives>

## Motion philosophy
<sticky-pinned hero with scroll-driven acts, three-mesh-gradient cinematic restraint, prefers-reduced-motion graceful fallback>

## Trinity translation
<how code-becomes-city plus AI-residents-move-in is visually expressed>

## Shy creature behavior
<flee distance, return delay, viewport distribution rule (no more than 1 visible at a time)>

## Tweaks parameter mapping
<each Tweaks slider description plus value range plus visual effect>

## Cross-page cohesion
<typography family shared with Entry + Dashboard; palette varies per page>
```

## Storage location

- Bundle extracted to: `_meta/designer/prompt1-landing/handoff-bundle-extracted/`
- Calliope reads from this path. Final Next.js integration written to `frontend/app/page.tsx` + `frontend/components/landing/*` + `frontend/styles/globals.css` (Tailwind config update if needed).

## Asumption baked

1. Ghaisan executes Prompt 1 manual on claude.ai/design at or before Wave 1 spawn time (~16:00 WIB Day 1). **Critical risk**: if execution slips past Wave 1 spawn, Calliope queues until bundle landing.
2. Daedalus + Iris can spawn before bundle lands (zero Designer dependency for 3D scene scaffold).
3. claude.ai/design "Export to Claude Code" button outputs functional Next.js 16 + React 19 compatible code. Calliope may need to port to specific Next.js patterns (Server Components, dynamic imports, image optimization) but base code is portable.
4. design-tokens.json is consumed by extending Tailwind theme in `frontend/tailwind.config.ts`, NOT hardcoded inline.
5. ShyCreature.tsx is a reusable component pattern (props for creature SVG + flee distance + position). Hestia Entry page reuses same component with single-creature override (Hermes guide creature only per Designer prompt 2 line 138).

## Validation steps

**Producer responsibility (Ghaisan operator)**:
- Paste Prompt 1 fenced block verbatim into fresh claude.ai/design roomchat (no edits to prompt).
- Engage in 3-direction proposal dialog. Pick direction verbally before claude.ai/design builds.
- Iterate Tweaks sliders until visually satisfied.
- Export Code Handoff Bundle.
- Extract bundle ZIP to `_meta/designer/prompt1-landing/handoff-bundle-extracted/` path exactly.
- Notify V1 Orch via handoff message: "Prompt 1 bundle landed at `_meta/designer/prompt1-landing/handoff-bundle-extracted/`, Calliope spawn unlocked."

**Consumer responsibility (Calliope)**:
- Validate bundle directory exists before starting work. If not present, FERRY V1 Orch (block).
- Read `intent.md` first to understand voice + tone + motion + creature behavior philosophy.
- Port `design-tokens.json` to Tailwind config extension in `frontend/tailwind.config.ts`.
- Port components to `frontend/components/landing/*` preserving prop interfaces.
- Assemble final page at `frontend/app/page.tsx` (Next.js 16 App Router root).
- Honor `prefers-reduced-motion` graceful fallback (mandatory accessibility floor per PRD Section 13).
- Smoke test: Lighthouse 90+ Performance + Accessibility + Best Practices + SEO on M-series; renders Chrome + Safari 17+ + Edge no console warnings.

## Edge case handling

- Bundle exports broken/incomplete code: Calliope ferries V1 Orch, options: (A) re-export from claude.ai/design with explicit fix prompt, (B) Calliope manually patches broken portions referencing intent.md, (C) drop-protocol activate if persistent fail.
- Tweaks parameter values diverge from intent.md: Calliope honors `design-tokens.json` Tweaks block as canonical (data over prose).
- Cursor-flee creature performance regress: Calliope reduces flee animation framerate behind feature flag if `usePerformanceState().regressing` (Wave 1 Daedalus context).
- Bundle delivery slips past Wave 1 spawn: Calliope queues, Daedalus + Iris proceed, V1 Orch escalates to Ghaisan if delay > 1 hour.

## Open questions

- Voice + tone calibration: claude.ai/design may produce copy that requires Calliope adjustment for technical accuracy (e.g., resident roles, mode names). Defer to bundle delivery time judgment.
- 3D mount-target inside landing: Designer Prompt 1 mentions "subtle 3D city background" but Designer scope is static UI per PRD D22. Wave 1 Calliope leaves placeholder `<div>` containers per Designer instruction; Wave 2 Hera + Boreas decide if subtle Three.js mount inside landing (vs blocking to dashboard preview only).

## Reference

- Metis Agentic Structure md Section 2 DAG: External Designer bundle to Calliope edge
- Metis Section 5.2 Calliope ship criteria
- Designer doc `_meta/designer/prompt-design_codeplex-chronicle.md` Prompt 1 (lines 22-87)
- PRD Section 13 (visual quality bar Awwwards-tier non-negotiable baseline)
- PRD Section 26.1 (Designer handoff section)
- PRD D22 (Designer scope = 3 prompts, City View NOT Designer scope)
- sourceoftruth Section 11.2 Designer execution instructions
