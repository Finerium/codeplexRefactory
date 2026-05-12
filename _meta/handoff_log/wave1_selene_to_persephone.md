# Handoff: Selene to Persephone (Wave 1 to Wave 2)

**Date**: 2026-05-12 21:10 WIB
**Producer**: Selene (Wave 1 dashboard executor)
**Consumer**: Persephone (Wave 2 panel mounter, AI residents chat panel + ticket panel + side panel)
**Contract**: `_meta/contracts/selene-to-persephone.md`

## Output produced by Selene (Wave 1)

### Types (canonical, Persephone imports verbatim, NEVER redefines)

**Path**: `frontend/src/lib/dashboard/types.ts`

```typescript
// Single source of truth, all panels consume this shape
export interface DashboardData { ... }

// 14 sub-types: VelocityPoint, BurndownPoint, BurndownMeta, MilestoneProgress,
// ContributorStats, DriftPattern, Severity, DriftSummary, RefactorStage,
// RefactorProposal, RepoStatus, KPIMetric, TimeRangeOption, CityPreviewMeta
```

**Barrel re-export**: `frontend/src/lib/dashboard/index.ts` exports all types + hook + mock data + queries. Persephone imports via:

```tsx
import { type DashboardData, type RefactorProposal, type DriftSummary, type ContributorStats, useDashboardData } from '@/lib/dashboard';
```

### Fetch hook

**Path**: `frontend/src/lib/dashboard/useDashboardData.ts`

Wave 1: returns mock data via stub. Wave 3: hot-swap to fetch from Demeter `/api/dashboard`. Persephone reuses this hook for side-panel mode variant data fetch.

### Mock data

**Path**: `frontend/src/lib/dashboard/mockDashboardData.ts`

[MOCK Wave 1, real Wave 3 Demeter]. Shaped per Pythia contract. Persephone can reuse this for side panel demo data Wave 2, label `[MOCK Wave 2, real Wave 3 Demeter]` if extended.

## Decisions delivered

### OQ-02 charts library = Recharts (LOCKED V1)

**Decision doc**: `_meta/decisions/oq02_charts_library.md`

Persephone uses Recharts for side panel chart visuals. Already in `package.json` (`recharts@2.15.0`). Pattern (Selene `BurndownChart.tsx` + `VelocityChart.tsx` is the reference):

```tsx
'use client';
import { ResponsiveContainer, AreaChart, Area, ... } from 'recharts';

export const SomeSidePanelChart: React.FC<...> = ({ data }) => (
  <ResponsiveContainer width="100%" height={180}>
    <AreaChart data={data}>...</AreaChart>
  </ResponsiveContainer>
);
```

Color tokens via CSS variables: `var(--accent)`, `var(--muted-2)`, `var(--sev-5)` etc. Scope CSS variables via wrapping `<div style={cssVars}>` if Persephone side panel renders inside dashboard route. Otherwise default to Tailwind tokens.

### OQ-03 UI library = shadcn (LOCKED V1)

**Decision doc**: `_meta/decisions/oq03_ui_library.md`

Persephone Wave 2 responsible for `npx shadcn init` + adding side panel primitives. Wave 1 dashboard does NOT have shadcn installed yet (Selene scope deferral, see decision doc rationale).

**Persephone Wave 2 setup steps**:

```bash
cd frontend
npx shadcn@latest init  # one-time, picks Tailwind config + CSS variables
npx shadcn@latest add dialog dropdown-menu tooltip popover tabs
```

This populates `frontend/components/ui/*`. Persephone uses for:
- AI resident chat panel input (Textarea, Button)
- Ticket panel filter chips (Badge, DropdownMenu)
- Side panel mode tabs (Tabs)
- Hover detail popovers (Popover, Tooltip)

**Cohesion mandate**: shadcn primitives use the same Tailwind tokens Daedalus configured (`codeplex-*` colors). Side panel rendered inside dashboard route scopes the Designer "Graphite Signal" palette via inline `style={cssVars}`; side panel rendered inside city view route uses Tailwind dark cinematic.

## Consumer expectations

Per `selene-to-persephone.md` line 211-219:

- [x] Selene exports all types via `frontend/src/lib/dashboard/index.ts` barrel
- [x] Mock data passes TypeScript strict-mode check (no `any`, no `unknown`)
- [x] Hook returns stable reference for unchanged data (React.useState stable identity)
- [x] All 11+ panel components consume types correctly, no inline type definitions
- [x] TypeScript build smoke test: `npx tsc --noEmit` exit 0 on dashboard route

## Persephone Wave 2 validation steps (consumer side)

- [ ] Import types from `@/lib/dashboard`, NOT redefine
- [ ] Side panel mode variant components consume RefactorProposal / DriftSummary / ContributorStats directly
- [ ] shadcn UI library used for buttons, dialogs, tooltips, dropdown menus, tabs
- [ ] Smoke test: 3 panel mode variants render in side slot, types verified via TS build

## Asumption baked

1. Persephone Wave 2 inherits Selene's Recharts + shadcn decisions verbatim. If Persephone disagrees with either, ferry V1 Orch BEFORE re-deciding (HIGH bar, cohesion mandate).
2. DashboardData shape is canonical. Persephone does NOT define alternate data shapes for side panel mode variants; reuses Selene's types.
3. CSS variable scoping for instrument-panel palette is dashboard-route-only. City-view side panel (Persephone Wave 2 scope) uses Tailwind dark cinematic Daedalus palette.
4. Argus dashboard preview corner is independent of city view residents. Persephone Wave 2 does NOT touch dashboard preview corner.

## Open questions for V1 Orch / Persephone

1. **Side panel chart visuals scope**: does Persephone Wave 2 ship chart visuals in any panel mode (e.g., contributor activity heatmap)? If yes, Recharts pattern from Selene applies. If no, Persephone uses plain HTML + Tailwind only.
2. **Side panel data refresh interval**: Wave 3 Demeter contract assumes 30-second TTL cache. Wave 2 Persephone may need polling or WebSocket subscription for real-time side panel data. Defer to Wave 3 Demeter / Hades WebSocket scope decision.

## City preview corner deviation (D3 disclosure)

**Selene Wave 1 chose Designer SVG silhouette over Daedalus ChronicleCanvas reuse for the dashboard inset.**

This affects Persephone Wave 2 only if Persephone is asked to mount a different city preview component for side-panel-in-dashboard mode. Per contract `selene-to-persephone.md` line 232 "Persephone does NOT touch dashboard preview", Persephone is unaffected.

If Eunomia Wave 1 audit flags the SVG decision and requires ChronicleCanvas swap, Selene Cycle 4 re-spawn handles it. Persephone Wave 2 starts unchanged.

## Ferry items (Selene to V1 Orch via this handoff)

None HIGH bar. 1 medium-confidence concern (U1 SVG vs Canvas decision) documented in uncertainty journal + checkpoint. Persephone unaffected.

## Validation done

- `npx tsc --noEmit` exit 0
- `curl http://localhost:3000/dashboard` returns 200 OK
- Playwright snapshot all 11+ panels render
- Console clean (1 favicon 404 cosmetic only)

## Closing

Persephone Wave 2 spawn unblocked. Types + hook + mock data + Recharts dep + shadcn decision all delivered per contract. Side panel mode variant authoring can begin Day 2 Wave 2.

Gas Persephone.
