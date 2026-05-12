# OQ-02 Decision: Charts Library

**Decided by**: Selene (Wave 1 worker)
**Date**: 2026-05-12 19:10 WIB
**Status**: LOCKED V1
**Authority**: Selene domain decision per Metis Section 7.1 + Pythia contract `claude-design-bundle-to-selene.md` line 121 (designer-decided alternate possible, otherwise Selene picks).

## Decision

**Library**: Recharts (`recharts@^2.x`, latest stable).
**Scope**: All dashboard chart components (Burndown, Velocity, Sparkline) in `frontend/components/dashboard/*` plus any Wave 2 chart visuals (Persephone reuse for side panel mode variants).

## Rationale

### Why Recharts (primary picks)

1. **React-native declarative API**. Composable JSX primitives (`<AreaChart>`, `<LineChart>`, `<Bar>`) match React 19 + Next.js 16 App Router server-component-first rendering pattern. Chart.js requires imperative Canvas API calls + `useRef` lifecycle plumbing inside `useEffect`, a mismatch with our RSC pipeline.
2. **Tree-shake friendly**. Recharts ships ES modules per primitive (only imports + bundles the chart types we use, vs Chart.js which pulls the full controller registry by default unless tree-shaken manually with the `chart.js/auto` vs `chart.js` split).
3. **SVG output, NOT Canvas**. Dashboard prototype HTML uses static SVG paths (per Designer `charts.jsx` bundle, lines 1-94). Recharts also renders SVG, which preserves visual fidelity 1-to-1 with Designer mockup. Canvas-based libs (Chart.js, ApexCharts) need rasterization and lose pixel-precise gridlines + dashed strokes the Designer intent specifies.
4. **ResponsiveContainer first-class**. Recharts `<ResponsiveContainer width="100%" height={240}>` handles the panel-resize requirement Persephone Wave 2 also needs for side-panel mode variant charts. Chart.js needs manual `aspectRatio` + `resize` event wiring.
5. **Severity color token compatibility**. Recharts accepts CSS variable strings (`var(--sev-5)`) on `stroke` / `fill` props. Chart.js requires hex/rgb strings, blocking our OKLCH severity ramp Designer specifies (instrument-panel intent.md line 38 `--sev-5: oklch(0.42 ...)`).
6. **Hackathon time budget**. Recharts integration overhead per smoke-test in Context7 documentation pattern: drop in component, wrap in ResponsiveContainer, pass `data` prop. Chart.js requires register-the-controllers boilerplate + plugin pipeline. Estimated save ~30 min of Selene Cycle 2 budget.

### Why NOT react-chartjs-2 (fallback)

- Chart.js v4 imperative core wrapped in React = double layer of indirection (the wrapper itself eats 8-12 KB + Chart.js itself eats 56 KB minified for the typical pre-set). Recharts core ships ~75 KB but tree-shake to ~30-40 KB for our 3 chart types (Area + Line + ResponsiveContainer + a few axes/tooltips).
- Animation API in Chart.js requires plugin reg + tween config + transition controllers. Designer mockup has no animation (intent: instrument-panel calm + sober), so animation tooling is wasted.
- Tooltip customization in Chart.js requires custom plugin classes. Recharts `<Tooltip content={({ active, payload }) => ...}>` accepts a JSX render-prop directly.

### Why NOT alternative libraries considered

- **Visx** (Airbnb): low-level d3 primitives, too much custom wiring for hackathon time budget. Would force me to author the SVG geometry myself, which the Designer already did in `charts.jsx`. Recharts gives me a clean ramp from Designer's hand-authored SVG to a parameterized component.
- **Tremor**: opinionated dashboard kit with built-in palette. Conflicts with Designer's deliberately restrained instrument-panel palette + OKLCH severity ramp. Cohesion loss.
- **D3 direct**: same problem as Visx, too low-level for budget.
- **Apex Charts**: Canvas-based, same fidelity loss as Chart.js. Skipped.

## Implementation notes (Selene authors, Persephone consumes)

```tsx
// frontend/components/dashboard/BurndownChart.tsx (Selene)
'use client';

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, ReferenceLine, Tooltip } from 'recharts';
import type { BurndownPoint } from '@/lib/dashboard/types';

export const BurndownChart: React.FC<{ data: BurndownPoint[]; todayIndex: number }> = ({ data, todayIndex }) => (
  <ResponsiveContainer width="100%" height={240}>
    <AreaChart data={data} margin={{ top: 16, right: 16, bottom: 16, left: 4 }}>
      <XAxis dataKey="day" stroke="var(--muted)" tick={{ fontSize: 10 }} />
      <YAxis stroke="var(--muted)" tick={{ fontSize: 10 }} />
      <Tooltip contentStyle={{ background: 'var(--ink)', color: 'var(--bg)', fontFamily: 'var(--font-mono)' }} />
      <Area type="monotone" dataKey="idealRemaining" stroke="var(--muted-2)" strokeDasharray="3 3" fill="transparent" />
      <Area type="monotone" dataKey="actualRemaining" stroke="var(--accent)" strokeWidth={1.5} fill="var(--accent-3)" />
      <ReferenceLine x={todayIndex} stroke="var(--accent)" strokeDasharray="3 3" strokeOpacity={0.45} />
    </AreaChart>
  </ResponsiveContainer>
);
```

CSS tokens (`--accent`, `--muted`, etc.) injected per dashboard route layout via inline `style={cssVars}` on root container, matching Designer light-mode "Graphite Signal" palette. Tokens do NOT pollute global Tailwind (Tailwind owns Wave 1 cinematic dark scene per Daedalus tailwind.config.ts).

## Downstream cascade

- **Persephone Wave 2**: import `BurndownChart` + `VelocityChart` pattern, reuse for side-panel mode variant charts. Same Recharts dependency, no extra install.
- **Demeter Wave 3**: backend implements `DashboardQueryAPI` per `selene-to-demeter.md` contract. Recharts consumes the JSON shape verbatim, no transformation. JSON keys `idealRemaining` + `actualRemaining` snake_case to camelCase via Pydantic alias generator per contract line 152-158.
- **Hera Wave 2**: Sparkline pattern (in `Velocity` history + cross-repo rail) may reuse the same Recharts `<LineChart>` primitive at smaller dimensions, OR can stay as inline SVG polyline per Designer bundle `Sparkline` (Selene preserves Designer SVG sparkline 1-to-1 to keep dashboard route bundle lean).

## Risk + mitigation

- **Risk**: Recharts and Next.js 16 server-component boundary. Recharts uses React Context internally (ResponsiveContainer measures DOM). MUST mark chart components `'use client'`.
- **Mitigation**: Selene marks every chart component with `'use client'` at top of file. Dashboard route page.tsx stays a Server Component, charts hydrate on client.
- **Risk**: Recharts SSR mismatch warning (server renders without ResizeObserver, client paints with measured dimensions).
- **Mitigation**: Recharts v2.13+ handles this with built-in initial dimensions. Pin `recharts@^2.13.0`.

## Validation

- Selene Cycle 2 smoke test: render `BurndownChart` + `VelocityChart` in dev mode, verify no console error.
- Eunomia Wave 1 audit gate: Lighthouse 90+ on `/dashboard`. Recharts bundle size verification via `next build` output.
- Demeter Wave 3 swap test: replace mock data with real `/api/dashboard?range=sprint` JSON, verify chart re-renders without layout shift.

## References

- Metis Agentic Structure md Section 7.1 (OQ-02 recommendation)
- Pythia contract `claude-design-bundle-to-selene.md` line 78-86 (Designer charts-decision.md schema)
- Pythia contract `selene-to-persephone.md` line 199 (Recharts decision lock-in for Wave 2 reuse)
- Pythia contract `selene-to-demeter.md` line 121-132 (DashboardData camelCase JSON keys Recharts consumes)
- Designer bundle `charts.jsx` (SVG output Recharts replicates fidelity)
