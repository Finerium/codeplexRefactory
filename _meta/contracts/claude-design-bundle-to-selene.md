# Contract: Claude Design Bundle to Selene

**Edge type**: external (claude.ai/design manual session output to Wave 1 worker)
**Wave**: External (Ghaisan operator) to Wave 1 consumer
**Status**: locked
**Authored**: 2026-05-12 15:01 WIB

## Producer

**Worker**: Ghaisan Khoirul Badruzaman (operator) via claude.ai/design platform manual session execution
**Domain**: Paste Prompt 3 (Dashboard View) from `_meta/designer/prompt-design_codeplex-chronicle.md` lines 169-240 into fresh claude.ai/design roomchat (SEPARATE from Prompt 1 + Prompt 2 sessions). 3-direction proposal dialog focused on instrument-panel mood. Pick one direction, iterate, export Code Handoff Bundle.

**Identity disclosure**: NOT a Claude Code worker. Producer is human operator (Ghaisan) plus claude.ai/design assistant.

## Consumer

**Worker**: Selene (Wave 1)
**Domain**: Dashboard execution at `frontend/app/dashboard/page.tsx`. 7 dashboard panel components (velocity, burndown, milestone progress, contributor analytics, spec-drift summary, refactor proposal status, cross-repo summary) plus embedded city preview corner (~300x200px independent Canvas inset), glassmorphism accent on resident vignette cards, charts library decision (OQ-02). Selene also decides UI library (OQ-03) consistency with Wave 2 Persephone (recommendation: shadcn).

## Output schema (producer to consumer)

```
_meta/designer/prompt3-dashboard/handoff-bundle-extracted/
├── design-tokens.json          # Instrument-panel restrained palette, shared typography family
├── components/
│   ├── OneSentenceBriefing.tsx # Display voice top of page
│   ├── KPIGlance.tsx           # Velocity + Cycle time + Change failure + Deploys
│   ├── BurndownChart.tsx
│   ├── VelocityChart.tsx
│   ├── TopContributors.tsx
│   ├── SpecDriftSummary.tsx    # 5 patterns A-E with severity differentiation visual
│   ├── RefactorProposalsList.tsx
│   ├── CrossRepoRail.tsx
│   ├── CityPreviewCorner.tsx   # Bottom-right fixed, Open city view link, Argus watcher
│   ├── ArgusWatcher.tsx        # Quiet companion, blinks, eye tracks, does NOT flee
│   ├── MultiRepoDropdown.tsx
│   └── TimeRangeSelector.tsx
├── pages/
│   └── page.tsx                # Assembled dashboard composition
├── public/
│   └── ...                     # Argus SVG, severity icons, sparkline assets
├── intent.md                   # Instrument-panel mood + severity encoding + Argus treatment
└── charts-decision.md          # OQ-02 charts library selection (Recharts recommended)
```

`design-tokens.json` instrument-panel variant (concrete expectations):

```json
{
  "colors": {
    "background": { "primary": "#0e1014", "panel": "#171a20" },
    "foreground": { "primary": "#dfe2e8", "muted": "#8a8f99" },
    "severity": {
      "critical": "#e84a4a",
      "high": "#e87a4a",
      "medium": "#e0c84a",
      "low": "#5aa3e8",
      "info": "#8a8f99"
    },
    "chart": { "line": "#7c8aff", "fill": "rgba(124, 138, 255, 0.15)" }
  },
  "typography": {
    "display": "...same family as Landing + Entry (cohesion)",
    "body": "...same neo-grotesque body",
    "mono": "...for KPI numbers + sparklines, dev-tool feel"
  },
  "tweaks": {
    "informationDensity": 0.8,
    "argusBlinkFrequency": 4000,
    "severityContrastIntensity": 0.9,
    "cityPreviewSize": 1.0,
    "chartLineWeight": 1.5
  }
}
```

`charts-decision.md` content (Designer-decided OQ-02):

```markdown
# OQ-02: Charts library decision

**Recommendation**: Recharts
**Rationale**: React-native declarative, tree-shake friendly, fits dashboard's responsive panel grid, low integration overhead. Chart.js alternative considered but imperative API mismatches with React 19 patterns.
**Selene implementation note**: Use Recharts ResponsiveContainer wrapping each chart. Color tokens consumed from design-tokens.json color.chart.line/fill.
```

`intent.md` schema:

```markdown
# Dashboard design intent

## Direction chosen
<one of 3 proposals picked verbally>

## Instrument-panel mood
<bridge of quiet ship at night; calm + present + decisive; not Grafana clone>

## Severity encoding system
<color + shape + density + motion combination; manager scans pattern severity in <1 second>

## Argus treatment
<quiet companion, blinks, eye tracks subtly, does NOT flee, hover shows subtle ring highlight>

## City preview corner approach
<fixed bottom-right ~300x200px, Open city view link, Argus sits here>

## Cross-page cohesion
<typography family shared; instrument-panel palette deliberately restrained vs Landing + Entry>
```

## Storage location

- Bundle extracted to: `_meta/designer/prompt3-dashboard/handoff-bundle-extracted/`
- Selene integrates: `frontend/app/dashboard/page.tsx` + `frontend/components/dashboard/*`
- City preview corner: independent Three.js Canvas mount, separate from main Canvas (see `selene-to-persephone.md` for embedded preview data shape)
- OQ-02 decision document copied to `_meta/decisions/oq02_charts_library.md` by Selene

## Asumption baked

1. Ghaisan executes Prompt 3 manual on claude.ai/design in SEPARATE roomchat from Prompt 1 + Prompt 2. Same cohesion mandate (shared typography family) plus instrument-panel palette deliberately restrained.
2. Recharts is the recommended library; if Designer proposes Chart.js direction picked verbally, Selene documents alternate decision in `_meta/decisions/oq02_charts_library.md`.
3. UI library decision (OQ-03) defers to Persephone Wave 2 if Designer does not propose; recommendation = shadcn (consistency win with Persephone, Tailwind compat, low install overhead). Document in `_meta/decisions/oq03_ui_library.md`.
4. City preview corner mounts an independent r3f Canvas (NOT the main City View Canvas from Daedalus). Separate WebGL context acceptable; size 300x200 keeps draw-call budget low. Argus animation lives inside this preview Canvas.
5. Mock data Wave 1; real Postgres queries Wave 3 via `selene-to-demeter.md` contract. Selene hardcodes mock JSON for 7 panels in Wave 1.

## Validation steps

**Producer responsibility (Ghaisan operator)**:
- Paste Prompt 3 fenced block verbatim into FRESH claude.ai/design roomchat.
- Mention cohesion: typography family same as Prompt 1 + 2, palette restrained instrument-panel.
- 3-direction proposal dialog, pick one verbally.
- Export Code Handoff Bundle to `_meta/designer/prompt3-dashboard/handoff-bundle-extracted/`.
- Notify V1 Orch: "Prompt 3 bundle landed, Selene spawn unlocked."

**Consumer responsibility (Selene)**:
- Validate bundle directory exists before starting.
- Read `intent.md` for severity encoding system + Argus treatment philosophy.
- Decide OQ-02 charts library finally (Recharts default per Pythia + Metis recommendation); document at `_meta/decisions/oq02_charts_library.md`.
- Port design tokens to Tailwind config extension.
- Port components to `frontend/components/dashboard/*`.
- Mount embedded city preview corner with independent r3f Canvas (separate from Daedalus main Canvas).
- Hardcode mock data Wave 1 (real Postgres Wave 3 via `selene-to-demeter.md`).
- Smoke test: 7 panels render correctly, charts responsive on viewport resize, embedded city inset loads independent Canvas without WebGL context conflict with main Canvas (Selene runs only dashboard route, no conflict).
- Lighthouse 90+ floor on dashboard route.

## Edge case handling

- Embedded city preview WebGL context limit: browsers allow 16-32 concurrent WebGL contexts. Dashboard route runs only the inset (1 context); navigation to City View route unmounts dashboard. Safe.
- Severity encoding ambiguity: if Designer proposes color-only encoding, Selene adds shape + motion fallback for colorblind accessibility (mandatory floor per PRD Section 13).
- Cross-repo rail data absent Wave 1: Selene shows empty state placeholder ("No connected repos") sourced from mock JSON.
- Argus animation budget: if `usePerformanceState().regressing` (Wave 1 Daedalus context), Selene drops Argus blink frequency to 8000ms or pauses animation.

## Open questions

- OQ-03 (UI library) final lock-in: Selene + Persephone consistency required. If Selene picks shadcn Wave 1 and Persephone disagrees Wave 2, ferry V1 Orch. Default lock = shadcn per Metis recommendation.
- City preview corner shows real city data or skeleton: Wave 1 mock data, Wave 3 real via `demeter-to-selene.md`. Wave 2 Persephone does NOT touch dashboard preview (per Persephone scope).

## Reference

- Metis Agentic Structure md Section 2 DAG: External Designer bundle to Selene edge
- Metis Section 5.2 Selene ship criteria
- Designer doc `_meta/designer/prompt-design_codeplex-chronicle.md` Prompt 3 (lines 169-240)
- PRD Section 9.4 (Activity Mode) + Section 9.5 (Health Mode) for spec-drift pattern A-E definitions
- PRD Section 13 (visual quality bar + accessibility floor)
- PRD Section 25 OQ-02 + OQ-03
- Pythia decision log 2026-05-12 14:42 (designer canonical preference)
- sourceoftruth Section 11.2 Designer execution instructions
